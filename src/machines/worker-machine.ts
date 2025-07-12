import { setup } from "xstate";
import { RawImage } from "@huggingface/transformers";

export type WorkerStartEvent = { type: "start"; blob: Blob };
export type WorkerFinishEvent = {
  type: "finish";
  rawImage: { data: RawImage };
};
export type WorkerEvent = WorkerStartEvent | WorkerFinishEvent;
export type WorkerContext = {
  rawImage: RawImage | null;
};

export const workerMachine = setup({
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
