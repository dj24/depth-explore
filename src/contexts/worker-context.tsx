"use client";

import { createContext, ReactNode, use } from "react";
import { assign } from "xstate";
import { useActorRef, useSelector } from "@xstate/react";
import { match, P } from "ts-pattern";
import { WorkerEvent, workerMachine } from "@/machines/worker-machine";
import { createPointCloudPositionsFromRawImage } from "@/helpers/create-point-cloud-positions-from-raw-image";
import { createPointCloudColorsFromRawImage } from "@/helpers/create-point-cloud-colors-from-image-data";

const workerPromise: Promise<Worker> = new Promise((resolve) => {
  const worker = new Worker(new URL("../workers/worker.js", import.meta.url), {
    type: "module",
  });
  worker.postMessage({ type: "ping" });
  worker.addEventListener("message", (event) => {
    if (event.data.type === "pong") {
      resolve(worker);
    }
  });
});

const selectPositions = (state: any) => {
  return state.context.positions;
};

const selectColors = (state: any) => {
  return state.context.colors;
};

const WorkerContext = createContext<{
  positions: Float16Array | null;
  colors: Uint8Array | null;
  send: (event: WorkerEvent) => void;
} | null>(null);

export const WorkerProvider = ({ children }: { children: ReactNode }) => {
  const worker = use(workerPromise);

  const actor = useActorRef(
    workerMachine.provide({
      actions: {
        start: ({ event }) => {
          match(event)
            .with({ type: "start", blob: P.nonNullable }, ({ blob }) =>
              worker.postMessage({ type: "depth", data: blob }),
            )
            .otherwise(() => {
              throw new Error(
                `Invalid event type: ${event.type} or missing blob`,
              );
            });
        },
        finish: assign({
          positions: ({ event }) => {
            return match(event)
              .with(
                { type: "finish", rawImage: P.nonNullable },
                ({ rawImage }) =>
                  createPointCloudPositionsFromRawImage(rawImage.data),
              )
              .otherwise(() => {
                throw new Error(
                  `Invalid event type: ${event.type} or missing rawImage`,
                );
              });
          },
          colors: ({ event }) => {
            return match(event)
              .with(
                { type: "finish", rawImage: P.nonNullable },
                ({ rawImage }) =>
                  createPointCloudColorsFromRawImage(rawImage.data),
              )
              .otherwise(() => {
                throw new Error(
                  `Invalid event type: ${event.type} or missing rawImage`,
                );
              });
          },
        }),
      },
    }),
  );

  const { send } = actor;
  const positions = useSelector(actor, selectPositions);
  const colors = useSelector(actor, selectColors);

  worker.addEventListener("message", (event: MessageEvent<any>) => {
    match(event.data)
      .with({ type: "depth_result" }, () => {
        send({ type: "finish", rawImage: event.data });
      })
      .with({ type: P.string }, (data) => {
        console.warn(`Unknown message type: ${data.type}`);
      });
  });

  return (
    <WorkerContext.Provider value={{ positions, colors, send }}>
      {children}
    </WorkerContext.Provider>
  );
};

export const useWorkerContext = () => {
  const value = use(WorkerContext);

  if (!value) {
    throw new Error(
      "Worker context is not available. Make sure to wrap your component tree with WorkerContextProvider.",
    );
  }

  return value;
};
