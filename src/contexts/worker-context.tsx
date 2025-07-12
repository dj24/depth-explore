"use client";

import { createContext, use } from "react";
import { assign, setup } from "xstate";
import { useActorRef, useSelector } from "@xstate/react";
import { match, P } from "ts-pattern";
import { RawImage } from "@huggingface/transformers";

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

type WorkerStartEvent = { type: "start"; blob: Blob };
type WorkerFinishEvent = { type: "finish"; rawImage: { data: RawImage } };
type WorkerEvent = WorkerStartEvent | WorkerFinishEvent;
type WorkerContext = {
  rawImage: RawImage | null;
};

const WorkerContext = createContext<{
  rawImage: RawImage | null;
  send: (event: WorkerEvent) => void;
} | null>(null);

const workerMachine = setup({
  types: {
    events: {} as WorkerEvent,
    context: {} as WorkerContext,
  },
  actions: {
    start: () => {},
    finish: () => {},
  },
}).createMachine({
  id: "worker",
  initial: "idle",
  context: {
    rawImage: null,
  },
  states: {
    idle: {
      on: {
        start: {
          target: "processing",
          actions: "start",
        },
      },
    },
    processing: {
      on: {
        finish: {
          target: "idle",
          actions: "finish",
        },
      },
    },
  },
});

const selectRawImage = (state: any) => {
  return state.context.rawImage;
};

export const WorkerProvider = ({ children }: { children: React.ReactNode }) => {
  const worker = use(workerPromise);

  const actor = useActorRef(
    workerMachine.provide({
      actions: {
        start: ({ event }) => {
          if (event.type !== "start" || !event.blob) {
            throw new Error("Invalid event type or missing blob");
          }
          console.log("Sending dataUrl to worker:", event.blob);
          worker.postMessage({ type: "depth", data: event.blob });
        },
        finish: assign({
          rawImage: ({ event }) => {
            return match(event)
              .with(
                { type: "finish", rawImage: P.nonNullable },
                ({ rawImage }) => {
                  console.log("Received rawImage from worker:", rawImage.data);
                  return rawImage.data;
                },
              )
              .otherwise(() => {
                throw new Error("Invalid event type or missing rawImage");
              });
          },
        }),
      },
    }),
  );

  const { send } = actor;
  const rawImage = useSelector(actor, selectRawImage);

  worker.addEventListener("message", (event: MessageEvent<any>) => {
    match(event.data)
      .with({ type: "ping" }, () => {
        worker.postMessage({ type: "pong" });
      })
      .with({ type: "pong" }, () => {
        console.log("Worker is ready");
      })
      .with({ type: "depth_result" }, () => {
        const { data } = event;
        send({ type: "finish", rawImage: data });
      })
      .with({ type: "error" }, (error) => {
        console.error("Worker error:", error);
      })
      .with({ type: P.string }, (data) => {
        console.warn(`Unknown message type: ${data.type}`);
      });
  });

  return (
    <WorkerContext.Provider value={{ rawImage, send }}>
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
