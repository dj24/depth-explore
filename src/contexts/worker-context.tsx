"use client";

import { createContext, ReactNode, use } from "react";
import { useActorRef, useSelector } from "@xstate/react";
import { match, P } from "ts-pattern";
import { assign } from "xstate";
import { WorkerEvent, workerMachine } from "@/machines/worker-machine";
import { renderVideoFrame } from "@/helpers/render-video-frame";
import { createPointCloudColorsFromImageData } from "@/helpers/create-point-cloud-colors-from-image-data";

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
          return match(event).with(
            { type: "start", video: P.nonNullable },
            ({ video }) => {
              renderVideoFrame(video).then(({ blob, imageData }) => {
                worker.postMessage({
                  type: "depth",
                  data: blob,
                });
                actor.send({
                  type: "assignColors",
                  colors: createPointCloudColorsFromImageData(imageData),
                });
              });
            },
          );
        },
      },
    }),
  );

  const positions = useSelector(actor, selectPositions);
  const colors = useSelector(actor, selectColors);

  worker.addEventListener("message", (event: MessageEvent<any>) => {
    match(event.data)
      .with({ type: "depth_result" }, () => {
        actor.send({ type: "assignDepth", rawImage: event.data });
      })
      .with({ type: P.string }, (data) => {
        console.warn(`Unknown message type: ${data.type}`);
      });
  });

  return (
    <WorkerContext.Provider value={{ positions, colors, send: actor.send }}>
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
