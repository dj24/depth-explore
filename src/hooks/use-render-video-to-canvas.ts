import { useCallback, useRef } from "react";

const DOWNSCALE_FACTOR = 0.1;

export const useRenderVideoToCanvas = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const renderFrame = useCallback(async (video: HTMLVideoElement | null) => {
    if (!video) return;
    const downscaledWidth = Math.floor(video.videoWidth * DOWNSCALE_FACTOR);
    const downscaledHeight = Math.floor(video.videoHeight * DOWNSCALE_FACTOR);
    const canvas = new OffscreenCanvas(downscaledWidth, downscaledHeight);
    const context = canvas.getContext("2d");
    if (!context) return;
    context.drawImage(video, 0, 0, downscaledWidth, downscaledHeight);
    return canvas.convertToBlob();
  }, []);

  return { videoRef, renderFrame };
};
