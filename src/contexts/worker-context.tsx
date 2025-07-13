"use client";

import { createContext, use, ReactNode } from "react";
import { useActorRef, useSelector } from "@xstate/react";
import { workerMachine, type WorkerEvent } from "@/machines/worker-machine";
import type { StateFrom } from "xstate";

const selectPositions = (state: StateFrom<typeof workerMachine>) =>
  state.context.positions;

const selectColors = (state: StateFrom<typeof workerMachine>) =>
  state.context.colors;

const selectIsPlaying = (state: StateFrom<typeof workerMachine>) =>
  state.context.isPlaying;

const selectVideoSrc = (state: StateFrom<typeof workerMachine>) =>
  state.context.videoSrc;

const WorkerContext = createContext<{
  positions: Float32Array | null;
  colors: Uint8Array | null;
  isPlaying: boolean;
  videoSrc: string | null;
  send: (event: WorkerEvent) => void;
} | null>(null);

export const WorkerProvider = ({
  children,
  workerPromise,
}: {
  children: ReactNode;
  workerPromise: Promise<Worker>;
}) => {
  const worker = use(workerPromise);

  const actor = useActorRef(workerMachine, {
    input: { worker },
  });

  const positions = useSelector(actor, selectPositions);
  const colors = useSelector(actor, selectColors);
  const isPlaying = useSelector(actor, selectIsPlaying);
  const videoSrc = useSelector(actor, selectVideoSrc);

  return (
    <WorkerContext.Provider
      value={{ positions, colors, isPlaying, videoSrc, send: actor.send }}
    >
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
