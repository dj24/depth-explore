import { assign, setup, fromPromise } from "xstate";
import { RawImage } from "@huggingface/transformers";
import { match, P } from "ts-pattern";
import { createPointCloudPositionsFromRawImage } from "@/helpers/create-point-cloud-positions-from-raw-image";
import { renderVideoFrame } from "@/helpers/render-video-frame";
import { createPointCloudColorsFromImageData } from "@/helpers/create-point-cloud-colors-from-image-data";

export type WorkerSetupVideoEvent = { type: "setupVideo"; videoSrc: string };
export type WorkerPlayVideoEvent = { type: "playVideo" };
export type WorkerPauseVideoEvent = { type: "pauseVideo" };
export type WorkerProcessFrameEvent = { type: "processFrame" };
export type WorkerSeekEvent = { type: "seek"; time: number };
export type WorkerUpdateVideoMetadataEvent = {
  type: "updateVideoMetadata";
  duration: number;
};
export type WorkerUpdateCurrentTimeEvent = {
  type: "updateCurrentTime";
  currentTime: number;
};

export type WorkerEvent =
  | WorkerSetupVideoEvent
  | WorkerPlayVideoEvent
  | WorkerPauseVideoEvent
  | WorkerProcessFrameEvent
  | WorkerSeekEvent
  | WorkerUpdateVideoMetadataEvent
  | WorkerUpdateCurrentTimeEvent;

export type WorkerContext = {
  positions: Float32Array | null;
  colors: Uint8Array | null;
  video: HTMLVideoElement | null;
  worker: Worker | null;
  isPlaying: boolean;
  intervalRef: ReturnType<typeof setInterval> | null;
  currentTime: number;
  duration: number;
};

const FRAMES_PER_SECOND = 24;

export const workerMachine = setup({
  types: {
    events: {} as WorkerEvent,
    context: {} as WorkerContext,
  },
  actors: {
    loadWorker: fromPromise(async () => {
      return new Promise<Worker>((resolve) => {
        console.log("Creating worker...");
        const worker = new Worker(
          new URL("../workers/worker.js", import.meta.url),
          {
            type: "module",
          },
        );

        worker.addEventListener("message", (event: MessageEvent) => {
          if (event.data.type === "pong") {
            resolve(worker);
          }
        });

        worker.postMessage({ type: "ping" });
      });
    }),
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
    assignWorker: assign({
      worker: ({ event }) => (event as unknown as { output: Worker }).output,
    }),
    setupVideo: assign({
      video: ({ event, context, self }) => {
        return match(event)
          .with({ type: "setupVideo", videoSrc: P.string }, ({ videoSrc }) => {
            const node = document.createElement("video");
            node.currentTime = 0;
            node.src = videoSrc;
            node.muted = true; // Ensure video can autoplay
            node.preload = "metadata";

            node.addEventListener("loadedmetadata", () => {
              self.send({
                type: "updateVideoMetadata",
                duration: node.duration,
              });
            });

            node.addEventListener("timeupdate", () => {
              self.send({
                type: "updateCurrentTime",
                currentTime: node.currentTime,
              });
            });

            node.addEventListener("play", () => {
              self.send({ type: "playVideo" });
            });

            node.addEventListener("pause", () => {
              self.send({ type: "pauseVideo" });
            });

            node.addEventListener("emptied", () => {
              self.send({ type: "pauseVideo" });
            });

            node.addEventListener("ended", () => {
              self.send({ type: "pauseVideo" });
            });

            return node;
          })
          .otherwise(() => context.video);
      },
      duration: ({ event, context }) => {
        return match(event)
          .with({ type: "setupVideo" }, () => 0)
          .otherwise(() => context.duration);
      },
      currentTime: ({ event, context }) => {
        return match(event)
          .with({ type: "setupVideo" }, () => 0)
          .otherwise(() => context.currentTime);
      },
    }),
    updateVideoMetadata: assign({
      duration: ({ event }) =>
        (event as unknown as { duration: number }).duration,
    }),
    updateCurrentTime: assign({
      currentTime: ({ event }) =>
        (event as unknown as { currentTime: number }).currentTime,
    }),
    seekVideo: assign({
      video: ({ context, event, self }) => {
        if (!context.video) {
          return null;
        }
        context.video.currentTime = (event as WorkerSeekEvent).time;
        self.send({ type: "processFrame" });
        return context.video;
      },
    }),
    startVideoPlayback: assign({
      isPlaying: () => true,
      intervalRef: ({ context, self }) => {
        if (!context.video) {
          return null;
        }
        // Use a promise to ensure play() completes
        context.video.play().catch((error) => {
          console.error("Failed to play video:", error);
        });

        return setInterval(() => {
          if (context.worker && context.video && !context.video.paused) {
            self.send({ type: "processFrame" });
          }
        }, 1000 / FRAMES_PER_SECOND);
      },
    }),
    stopVideoPlayback: assign({
      isPlaying: () => false,
      intervalRef: ({ context }) => {
        if (context.video && !context.video.paused) {
          context.video.pause();
        }
        if (context.intervalRef) {
          clearInterval(context.intervalRef);
        }
        return null;
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
  initial: "loadingWorker",
  context: {
    positions: null,
    colors: null,
    video: null,
    worker: null,
    isPlaying: false,
    intervalRef: null,
    currentTime: 0,
    duration: 0,
  },
  on: {
    setupVideo: {
      target: ".paused",
      actions: ["stopVideoPlayback", "setupVideo"],
    },
    updateVideoMetadata: {
      actions: ["updateVideoMetadata"],
    },
    updateCurrentTime: {
      actions: ["updateCurrentTime"],
    },
    seekVideo: {
      actions: ["seekVideo"],
    },
  },
  states: {
    loadingWorker: {
      invoke: {
        id: "loadWorker",
        src: "loadWorker",
        onDone: {
          target: "noVideo",
          actions: "assignWorker",
        },
        onError: {
          target: "loadingWorker",
          actions: ({ event }) => {
            console.error("Failed to load worker, retrying...", event.error);
          },
        },
      },
    },
    noVideo: {},
    paused: {
      on: {
        playVideo: {
          target: "playing",
          actions: ["startVideoPlayback"],
        },
      },
    },
    playing: {
      on: {
        pauseVideo: {
          target: "paused",
          actions: ["stopVideoPlayback"],
        },
        processFrame: {
          target: "processingFrame",
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
    },
  },
});
