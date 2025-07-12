"use client";

import React, {
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import styles from "./page.module.css";
import { useWorkerContext, WorkerProvider } from "@/contexts/worker-context";
import { useVideoUpload } from "@/hooks/use-video-upload";
import { useRenderVideoToCanvas } from "@/hooks/use-render-video-to-canvas";
import { match, P } from "ts-pattern";
import { RawImage } from "@huggingface/transformers";
import { Canvas } from "@react-three/fiber";

const createImageDataFromRawImage = (
  rawImage: RawImage,
  width: number,
  height: number,
): ImageData => {
  const pixelData = new ImageData(width, height);
  for (let i = 0; i < rawImage.data.length; ++i) {
    pixelData.data[4 * i] = rawImage.data[i]; // Red
    pixelData.data[4 * i + 1] = 0;
    pixelData.data[4 * i + 2] = 0;
    pixelData.data[4 * i + 3] = 255;
  }
  return pixelData;
};

const Foo = () => {
  const { rawImage, send } = useWorkerContext();
  const { videoSrc, handleVideoUpload } = useVideoUpload();
  const { videoRef, renderFrame } = useRenderVideoToCanvas();
  const outputCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const handleSendFrame = useCallback(async () => {
    if (!outputCanvasRef) return;
    const blob = await renderFrame(videoRef.current);
    if (!blob) return;
    send({
      type: "start",
      blob, // Replace with actual video URL or data URL
    });
  }, [send]);

  useEffect(() => {
    const outputCanvas = outputCanvasRef.current;
    const outputCanvasContext = outputCanvas?.getContext("2d");
    const video = videoRef.current;
    match({
      rawImage,
      outputCanvasContext,
      outputCanvas,
      video,
    })
      .with(
        {
          rawImage: P.not(P.nullish),
          outputCanvasContext: P.not(P.nullish),
          outputCanvas: P.not(P.nullish),
          video: P.not(P.nullish),
        },
        ({ outputCanvas, rawImage, outputCanvasContext, video }) => {
          console.log({ width: video.videoWidth, height: video.videoHeight });
          outputCanvas.width = video.videoWidth;
          outputCanvas.height = video.videoHeight;
          const pixelData = createImageDataFromRawImage(
            rawImage,
            video.videoWidth,
            video.videoHeight,
          );
          outputCanvasContext.putImageData(pixelData, 0, 0);
          console.log(
            "Canvas and rawImage are available, processed successfully",
          );
        },
      )
      .otherwise(() => {
        console.error("Canvas or rawImage is not available");
      });
  }, [rawImage]);

  return (
    <>
      <button onClick={handleSendFrame}>Upload Frame</button>
      <label htmlFor="video-upload">Upload Video</label>
      <input
        id="video-upload"
        type="file"
        accept="video/*"
        onChange={handleVideoUpload}
        className={styles.hiddenInput}
      />
      {videoSrc && (
        <video
          ref={videoRef}
          src={videoSrc}
          controls
          width="800px"
          height="800px"
        />
      )}
      <canvas
        width={400}
        height={400}
        ref={outputCanvasRef}
        style={{ width: 400, height: 400, border: "1px solid green" }}
      />
    </>
  );
};

export default function Home() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <WorkerProvider>
        <div className={styles.page}>
          <Foo />
          <Canvas
            style={{
              width: 800,
              height: 800,
              border: "1px solid black",
            }}
          >
            <ambientLight />
            <pointLight position={[10, 10, 10]} />
          </Canvas>
        </div>
      </WorkerProvider>
    </Suspense>
  );
}
