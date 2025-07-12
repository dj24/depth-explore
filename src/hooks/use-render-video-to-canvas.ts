import { useCallback, useRef } from "react";

export const useRenderVideoToCanvas = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const renderFrame = useCallback(async (video: HTMLVideoElement | null) => {
    if (!video) return;
    const canvas = new OffscreenCanvas(video.videoWidth, video.videoHeight);
    const context = canvas.getContext("2d");
    if (!context) return;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.convertToBlob();
  }, []);

  return { videoRef, renderFrame };
};
