"use client";

import { createContext, useContext, ReactNode } from "react";
import { useActorRef, useSelector } from "@xstate/react";
import { workerMachine, type WorkerEvent } from "@/machines/worker-machine";
import type { StateFrom } from "xstate";

const selectPositions = (state: StateFrom<typeof workerMachine>) =>
  state.context.positions;

const selectColors = (state: StateFrom<typeof workerMachine>) =>
  state.context.colors;

const selectIsPlaying = (state: StateFrom<typeof workerMachine>) =>
  state.context.isPlaying;

const selectIsLoading = (state: StateFrom<typeof workerMachine>) =>
  state.matches("loadingWorker");

const selectIsEmpty = (state: StateFrom<typeof workerMachine>) =>
  state.context.video === null;

const WorkerContext = createContext<{
  positions: Float32Array | null;
  colors: Uint8Array | null;
  isPlaying: boolean;
  isLoading: boolean;
  send: (event: WorkerEvent) => void;
  isEmpty: boolean;
} | null>(null);

export const WorkerProvider = ({ children }: { children: ReactNode }) => {
  const actor = useActorRef(workerMachine);

  const positions = useSelector(actor, selectPositions);
  const colors = useSelector(actor, selectColors);
  const isPlaying = useSelector(actor, selectIsPlaying);
  const isLoading = useSelector(actor, selectIsLoading);
  const isEmpty = useSelector(actor, selectIsEmpty);

  return (
    <WorkerContext.Provider
      value={{
        positions,
        colors,
        isPlaying,
        isLoading,
        send: actor.send,
        isEmpty,
      }}
    >
      {children}
    </WorkerContext.Provider>
  );
};

export const useWorkerContext = () => {
  const value = useContext(WorkerContext);

  if (!value) {
    throw new Error(
      "Worker context is not available. Ensure your component tree is wrapped with WorkerProvider.",
    );
  }

  return value;
};
