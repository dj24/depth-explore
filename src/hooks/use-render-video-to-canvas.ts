import {useCallback, useRef} from "react";

export const useRenderVideoToCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const videoRef = useCallback((video: HTMLVideoElement | null) => {
    if (!video) return;
    if (!canvasRef.current) return;

    console.log({videoRef: video, canvasRef: canvasRef.current});

    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    console.log({video, canvas, context});

    if (!context) return;

    video.addEventListener('loadedmetadata', (event) => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      console.log(video.videoWidth);
    });

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

    // Start rendering when video is ready and playing
    video.addEventListener('play', startRendering);
    video.addEventListener('pause', stopRendering);
  }, [canvasRef]);

  return {canvasRef, videoRef};
}
