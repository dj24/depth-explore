"use client";

import { createContext, useContext, ReactNode } from "react";
import { useActorRef, useSelector } from "@xstate/react";
import { workerMachine, type WorkerEvent } from "@/machines/worker-machine";
import type { StateFrom } from "xstate";

const WorkerContext = createContext<{
  actor: ReturnType<typeof useActorRef>;
} | null>(null);

export const WorkerProvider = ({ children }: { children: ReactNode }) => {
  const actor = useActorRef(workerMachine);

  return (
    <WorkerContext.Provider
      value={{
        actor,
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

const selectCurrentTime = (state: StateFrom<typeof workerMachine>) =>
  state.context.currentTime;

export const useColors = () => {
  const { actor } = useWorkerContext();
  return useSelector(actor, selectColors);
};

export const usePositions = () => {
  const { actor } = useWorkerContext();
  return useSelector(actor, selectPositions);
};

export const useIsPlaying = () => {
  const { actor } = useWorkerContext();
  return useSelector(actor, selectIsPlaying);
};

export const useIsLoading = () => {
  const { actor } = useWorkerContext();
  return useSelector(actor, selectIsLoading);
};

export const useIsEmpty = () => {
  const { actor } = useWorkerContext();
  return useSelector(actor, selectIsEmpty);
};

export const useCurrentTime = () => {
  const { actor } = useWorkerContext();
  return useSelector(actor, selectCurrentTime);
};

export const useVideoDuration = () => {
  const { actor } = useWorkerContext();
  return useSelector(actor, (state) => state.context.duration);
};
