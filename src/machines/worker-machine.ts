import { assign, setup, fromPromise } from "xstate";
import { RawImage } from "@huggingface/transformers";
import { match, P } from "ts-pattern";
import { createPointCloudPositionsFromRawImage } from "@/helpers/create-point-cloud-positions-from-raw-image";
import { renderVideoFrame } from "@/helpers/render-video-frame";
import { createPointCloudColorsFromImageData } from "@/helpers/create-point-cloud-colors-from-image-data";

export type WorkerStartEvent = { type: "start"; video: HTMLVideoElement };
export type WorkerSetupVideoEvent = { type: "setupVideo"; videoSrc: string };
export type WorkerPlayVideoEvent = { type: "playVideo" };
export type WorkerPauseVideoEvent = { type: "pauseVideo" };

export type WorkerEvent =
  | WorkerStartEvent
  | WorkerSetupVideoEvent
  | WorkerPlayVideoEvent
  | WorkerPauseVideoEvent;

export type WorkerContext = {
  positions: Float32Array | null;
  colors: Uint8Array | null;
  video: HTMLVideoElement | null;
  worker: Worker | null;
  isPlaying: boolean;
  intervalRef: ReturnType<typeof setInterval> | null;
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

        input.worker.postMessage({
          type: "depth",
          data: blob,
        });

        const positions = await new Promise<Float32Array>((resolve, reject) => {
          const handleDepthMessage = (event: MessageEvent<unknown>) => {
            match(event.data)
              .with(
                {
                  type: "depth_result",
                  data: P.nonNullable,
                },
                ({ data }) => {
                  resolve(
                    createPointCloudPositionsFromRawImage(data as RawImage),
                  );
                  input.worker.removeEventListener(
                    "message",
                    handleDepthMessage,
                  );
                },
              )
              .with({ type: "depth_result", data: P.nullish }, () => {
                reject(new Error("Received null or undefined depth data"));
                input.worker.removeEventListener("message", handleDepthMessage);
              });
          };

          input.worker.addEventListener("message", handleDepthMessage);
        });

        const colors = createPointCloudColorsFromImageData(imageData);
        return { colors, positions };
      },
    ),
  },
  actions: {
    setupVideo: assign({
      video: ({ event, context, self }) => {
        return match(event)
          .with({ type: "setupVideo", videoSrc: P.string }, ({ videoSrc }) => {
            const node = document.createElement("video");
            node.currentTime = 0;
            node.src = videoSrc;

            node.addEventListener("play", () => {
              self.send({ type: "playVideo" });
            });

            node.addEventListener("pause", () => {
              self.send({ type: "pauseVideo" });
            });

            return node;
          })
          .otherwise(() => context.video);
      },
    }),
    startVideoPlayback: assign({
      isPlaying: () => true,
      intervalRef: ({ context, self }) => {
        if (!context.video) {
          return null;
        }
        context.video.play();
        return setInterval(() => {
          self.send({
            type: "start",
            video: context.video!,
          });
        }, 1000 / 24); // 24 FPS
      },
    }),
    stopVideoPlayback: assign({
      isPlaying: () => false,
      intervalRef: ({ context }) => {
        if (context.video) {
          context.video.pause();
        }
        if (context.intervalRef) {
          clearInterval(context.intervalRef);
        }
        return null;
      },
    }),
    assignVideo: assign({
      video: ({ event }) => {
        return match(event)
          .with({ type: "start", video: P.nonNullable }, ({ video }) => video)
          .otherwise(() => null);
      },
    }),
    reset: assign({
      positions: () => null,
      colors: () => null,
      video: () => null,
      isPlaying: () => false,
      intervalRef: () => null,
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
    isPlaying: false,
    intervalRef: null,
  }),
  states: {
    idle: {
      on: {
        setupVideo: {
          target: "videoReady",
          actions: ["setupVideo"],
        },
        start: {
          target: "processingVideo",
          actions: ["assignVideo"],
        },
      },
    },
    videoReady: {
      on: {
        setupVideo: {
          target: "videoReady",
          actions: ["setupVideo"],
        },
        playVideo: {
          target: "playing",
          actions: ["startVideoPlayback"],
        },
        start: {
          target: "processingVideo",
          actions: ["assignVideo"],
        },
      },
    },
    playing: {
      on: {
        setupVideo: {
          target: "videoReady",
          actions: ["stopVideoPlayback", "setupVideo"],
        },
        pauseVideo: {
          target: "videoReady",
          actions: ["stopVideoPlayback"],
        },
        start: {
          target: "processingFrame",
          actions: ["assignVideo"],
        },
      },
    },
    processingFrame: {
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
          target: "playing",
          actions: assign({
            colors: ({ event }) => event.output.colors,
            positions: ({ event }) => event.output.positions,
          }),
        },
        onError: {
          target: "playing",
          actions: ({ event }) => {
            console.error("Failed to process video frame", event.error);
          },
        },
      },
      on: {
        setupVideo: {
          target: "videoReady",
          actions: ["stopVideoPlayback", "setupVideo"],
        },
        pauseVideo: {
          target: "videoReady",
          actions: ["stopVideoPlayback"],
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
          target: "idle",
          actions: assign({
            colors: ({ event }) => event.output.colors,
            positions: ({ event }) => event.output.positions,
          }),
        },
        onError: {
          target: "idle",
          actions: ({ event }) => {
            console.error("Failed to process video frame", event.error);
          },
        },
      },
      on: {
        setupVideo: {
          target: "videoReady",
          actions: ["setupVideo"],
        },
      },
    },
  },
});
