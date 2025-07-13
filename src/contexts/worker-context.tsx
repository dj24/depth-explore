"use client";

import { createContext, use, ReactNode } from "react";
import { useActorRef, useSelector } from "@xstate/react";
import { workerMachine, type WorkerEvent } from "@/machines/worker-machine";
import { match, P } from "ts-pattern";
import { RawImage } from "@huggingface/transformers";
import type { StateFrom } from "xstate";

// Create worker instance - this is fine to be global as it's a singleton resource
const workerPromise: Promise<Worker> = new Promise((resolve) => {
  const worker = new Worker(new URL("../workers/worker.js", import.meta.url), {
    type: "module",
  });

  worker.addEventListener("message", (event: MessageEvent) => {
    if (event.data.type === "pong") {
      resolve(worker);
    }
  });

  worker.postMessage({ type: "ping" });
});

// Selectors for machine state with proper typing
const selectPositions = (state: StateFrom<typeof workerMachine>) =>
  state.context.positions;
const selectColors = (state: StateFrom<typeof workerMachine>) =>
  state.context.colors;

// Message types from worker
type WorkerMessage =
  | { type: "depth_result"; data: RawImage }
  | { type: "error"; data: Error }
  | { type: "pong"; data: string };

const WorkerContext = createContext<{
  positions: Float32Array | null;
  colors: Uint8Array | null;
  send: (event: WorkerEvent) => void;
} | null>(null);

export const WorkerProvider = ({ children }: { children: ReactNode }) => {
  const worker = use(workerPromise);

  // Initialize the machine with the worker
  const actor = useActorRef(workerMachine, {
    input: { worker },
  });

  const positions = useSelector(actor, selectPositions);
  const colors = useSelector(actor, selectColors);

  // Set up worker message handling
  worker.addEventListener("message", (event: MessageEvent<WorkerMessage>) => {
    match(event.data)
      .with({ type: "depth_result" }, (data) => {
        actor.send({ type: "assignDepth", rawImage: { data: data.data } });
      })
      .with({ type: "error" }, (data) => {
        console.error("Worker error:", data.data);
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
      "Worker context is not available. Make sure to wrap your component tree with WorkerProvider.",
    );
  }

  return value;
};
