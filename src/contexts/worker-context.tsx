"use client";

import { createContext, use, ReactNode } from "react";
import { useActorRef, useSelector } from "@xstate/react";
import { workerMachine, type WorkerEvent } from "@/machines/worker-machine";
import type { StateFrom } from "xstate";
import { workerPromise } from "@/helpers/worker-promise";

const selectPositions = (state: StateFrom<typeof workerMachine>) =>
  state.context.positions;

const selectColors = (state: StateFrom<typeof workerMachine>) =>
  state.context.colors;

const WorkerContext = createContext<{
  positions: Float32Array | null;
  colors: Uint8Array | null;
  send: (event: WorkerEvent) => void;
} | null>(null);

export const WorkerProvider = ({ children }: { children: ReactNode }) => {
  const worker = use(workerPromise);

  const actor = useActorRef(workerMachine, {
    input: { worker },
  });

  const positions = useSelector(actor, selectPositions);
  const colors = useSelector(actor, selectColors);

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
      "Worker context is not available. Ensure your component tree is wrapped with WorkerProvider.",
    );
  }

  return value;
};
