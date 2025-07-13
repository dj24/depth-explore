import { assign, setup, fromPromise } from "xstate";
import { RawImage } from "@huggingface/transformers";
import { match, P } from "ts-pattern";
import { createPointCloudPositionsFromRawImage } from "@/helpers/create-point-cloud-positions-from-raw-image";
import { renderVideoFrame } from "@/helpers/render-video-frame";
import { createPointCloudColorsFromImageData } from "@/helpers/create-point-cloud-colors-from-image-data";

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
  positions: Float32Array | null;
  colors: Uint8Array | null;
  video: HTMLVideoElement | null;
  worker: Worker | null;
};

export const workerMachine = setup({
  types: {
    events: {} as WorkerEvent,
    context: {} as WorkerContext,
    input: {} as { worker: Worker },
  },
  actors: {
    processVideoFrame: fromPromise(
      async ({
        input,
      }: {
        input: { video: HTMLVideoElement; worker: Worker };
      }) => {
        const { blob, imageData } = await renderVideoFrame(input.video);

        // Send data to worker
        input.worker.postMessage({
          type: "depth",
          data: blob,
        });

        // Generate colors from image data
        const colors = createPointCloudColorsFromImageData(imageData);

        return { colors };
      },
    ),
  },
  actions: {
    assignVideo: assign({
      video: ({ event }) => {
        return match(event)
          .with({ type: "start", video: P.nonNullable }, ({ video }) => video)
          .otherwise(() => null);
      },
    }),
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
    reset: assign({
      positions: () => null,
      colors: () => null,
      video: () => null,
    }),
  },
}).createMachine({
  id: "worker",
  initial: "idle",
  context: ({ input }) => ({
    positions: null,
    colors: null,
    video: null,
    worker: input.worker,
  }),
  states: {
    idle: {
      on: {
        start: {
          target: "processingVideo",
          actions: ["reset", "assignVideo"],
        },
      },
    },
    processingVideo: {
      invoke: {
        id: "processVideoFrame",
        src: "processVideoFrame",
        input: ({ context }) => {
          if (context.video && context.worker) {
            return { video: context.video, worker: context.worker };
          }
          throw new Error("Missing video or worker");
        },
        onDone: {
          target: "waitingForDepthData",
          actions: assign({
            colors: ({ event }) => event.output.colors,
          }),
        },
        onError: {
          target: "idle",
          actions: () => console.error("Failed to process video frame"),
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
