import {useCallback, useRef} from "react";

export const useRenderVideoToCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const videoRef = useCallback((video: HTMLVideoElement | null) => {
    if (!video) return;
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    let animationId: number;

    const renderFrame = () => {
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      animationId = requestAnimationFrame(renderFrame);
    };

    const startRendering = () => {
      if (video.readyState >= 2) { // HAVE_CURRENT_DATA
        renderFrame();
      }
    };

    const stopRendering = () => {
      cancelAnimationFrame(animationId);
    }

    video.addEventListener('loadedmetadata', () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    });
    video.addEventListener('play', startRendering);
    video.addEventListener('seeked', startRendering);
    video.addEventListener('pause', stopRendering);
    video.addEventListener('ended', stopRendering);
  }, [canvasRef]);

  return {canvasRef, videoRef};
}
