import { assign, setup } from "xstate";
import { RawImage } from "@huggingface/transformers";
import { match, P } from "ts-pattern";
import { createPointCloudPositionsFromRawImage } from "@/helpers/create-point-cloud-positions-from-raw-image";
import { createPointCloudColorsFromRawImage } from "@/helpers/create-point-cloud-colors-from-image-data";

export type WorkerStartEvent = { type: "start"; blob: Blob };
export type WorkerFinishEvent = {
  type: "finish";
  rawImage: { data: RawImage };
};
type PopulatedWorkerContext = {
  positions: Float16Array;
  colors: Uint8Array;
};
type EmptyWorkerContext = {
  positions: null;
  colors: null;
};
export type WorkerEvent = WorkerStartEvent | WorkerFinishEvent;
export type WorkerContext = PopulatedWorkerContext | EmptyWorkerContext;

export const workerMachine = setup({
  types: {
    events: {} as WorkerEvent,
    context: {} as WorkerContext,
  },
  actions: {
    start: () => {},
    finish: assign({
      positions: ({ event }) => {
        return match(event)
          .with({ type: "finish", rawImage: P.nonNullable }, ({ rawImage }) =>
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
          .with({ type: "finish", rawImage: P.nonNullable }, ({ rawImage }) =>
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
}).createMachine({
  id: "worker",
  initial: "idle",
  context: {
    positions: null,
    colors: null,
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
