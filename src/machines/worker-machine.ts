import { assign, setup } from "xstate";
import { RawImage } from "@huggingface/transformers";
import { match, P } from "ts-pattern";
import { createPointCloudPositionsFromRawImage } from "@/helpers/create-point-cloud-positions-from-raw-image";

export type WorkerStartEvent = { type: "start"; video: HTMLVideoElement };
export type AssignDepthEvent = {
  type: "assignDepth";
  rawImage: { data: RawImage };
};
export type AssignColorsEvent = {
  type: "assignColors";
  colors: Uint8Array;
};

export type WorkerEvent =
  | WorkerStartEvent
  | AssignDepthEvent
  | AssignColorsEvent;

export type WorkerContext = {
  positions: Float16Array | null;
  colors: Uint8Array | null;
};

export const workerMachine = setup({
  types: {
    events: {} as WorkerEvent,
    context: {} as WorkerContext,
  },
  actions: {
    start: () => {},
    assignColors: assign({
      colors: ({ event }) => {
        return match(event)
          .with(
            { type: "assignColors", colors: P.nonNullable },
            ({ colors }) => colors,
          )
          .otherwise(() => {
            throw new Error(
              `Invalid event type: ${event.type} or missing colors`,
            );
          });
      },
    }),
    assignDepth: assign({
      positions: ({ event }) => {
        return match(event)
          .with(
            { type: "assignDepth", rawImage: P.nonNullable },
            ({ rawImage }) => {
              return createPointCloudPositionsFromRawImage(rawImage.data);
            },
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
          target: "waitingForColorData",
          actions: "start",
        },
      },
    },
    waitingForColorData: {
      on: {
        assignColors: {
          target: "waitingForDepthData",
          actions: "assignColors",
        },
      },
    },
    waitingForDepthData: {
      on: {
        assignDepth: {
          target: "idle",
          actions: "assignDepth",
        },
      },
    },
  },
});
