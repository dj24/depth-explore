"use client";

import React, {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from "react";
import styles from "./page.module.css";
import { useWorkerContext, WorkerProvider } from "@/contexts/worker-context";
import { useVideoUpload } from "@/hooks/use-video-upload";
import { useRenderVideoToCanvas } from "@/hooks/use-render-video-to-canvas";
import { Canvas } from "@react-three/fiber";
import { createImageDataFromRawImage } from "@/helpers/create-image-data-from-raw-image";
import { OrbitControls } from "@react-three/drei";
import { RawImage } from "@huggingface/transformers";

const PointCloud = ({
  positions,
  colors,
}: {
  positions: Float16Array;
  colors: Uint8Array;
}) => {
  return (
    <points>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={colors.length / 3}
          array={colors}
          normalized={true}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial size={0.1} vertexColors={true} />
    </points>
  );
};

const createPointCloudPositionsFromRawImage = (
  rawImage: RawImage,
): Float16Array => {
  const positions = new Float16Array(rawImage.data.length * 3);
  const aspectRatio = rawImage.width / rawImage.height;
  for (let i = 0; i < rawImage.data.length; ++i) {
    const x = i % rawImage.width;
    const y = Math.floor(i / rawImage.width);

    const xNormalized = (x / rawImage.width) * aspectRatio;
    const yNormalized = 1.0 - y / rawImage.height;

    const xOffset = xNormalized * 2 - aspectRatio;
    const yOffset = yNormalized * 2 - 1;

    positions[i * 3] = xOffset;
    positions[i * 3 + 1] = yOffset;
    positions[i * 3 + 2] = rawImage.data[i] / 255;
  }
  return positions;
};

// TODO: implement actual colour mapping
const createPointCloudColorsFromRawImage = (rawImage: RawImage): Uint8Array => {
  const colors = new Uint8Array(rawImage.data.length * 3);
  for (let i = 0; i < rawImage.data.length; ++i) {
    const x = i % rawImage.width;
    const y = Math.floor(i / rawImage.width);
    const xNormalized = x / rawImage.width;
    const yNormalized = y / rawImage.height;

    colors[i * 3] = xNormalized * 255; // Red
    colors[i * 3 + 1] = yNormalized * 255; // Green
    colors[i * 3 + 2] = 0; // Blue
  }
  return colors;
};

const Foo = () => {
  const { rawImage, send } = useWorkerContext();
  const { videoSrc, handleVideoUpload } = useVideoUpload();
  const { videoRef, renderFrame } = useRenderVideoToCanvas();
  const outputCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // TODO: Send the video element and create the blob in the state machine instead
  const handleSendFrame = useCallback(async () => {
    const blob = await renderFrame(videoRef.current);
    if (blob) {
      send({
        type: "start",
        blob,
      });
    }
  }, [send]);

  useEffect(() => {
    const outputCanvas = outputCanvasRef.current;
    const outputCanvasContext = outputCanvas?.getContext("2d");
    if (!outputCanvas || !outputCanvasContext || !rawImage) return;
    outputCanvas.width = rawImage.width;
    outputCanvas.height = rawImage.height;
    outputCanvasContext.putImageData(
      createImageDataFromRawImage(rawImage),
      0,
      0,
    );
  }, [rawImage]);

  const pointCloudPositions = useMemo(() => {
    if (!rawImage) return null;
    return createPointCloudPositionsFromRawImage(rawImage);
  }, [rawImage]);

  const pointCloudColors = useMemo(() => {
    if (!rawImage) return null;
    return createPointCloudColorsFromRawImage(rawImage);
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
      <div>
        {videoSrc && (
          <video
            onLoadedMetadata={(event) => {
              const video = event.currentTarget;
              const aspectRatio = video.videoWidth / video.videoHeight;
              video.style.aspectRatio = `${aspectRatio} / 1`;
            }}
            style={{ width: 960 }}
            ref={videoRef}
            src={videoSrc}
            controls
          />
        )}
        <canvas ref={outputCanvasRef} style={{ width: 960, height: 540 }} />
      </div>
      <Canvas
        camera={{ fov: 40 }}
        style={{
          width: "100%",
          aspectRatio: "16 / 9",
          border: "1px solid black",
        }}
      >
        <ambientLight />
        <OrbitControls makeDefault />
        {pointCloudPositions && pointCloudColors && (
          <PointCloud
            colors={pointCloudColors}
            positions={pointCloudPositions}
          />
        )}
      </Canvas>
    </>
  );
};

export default function Home() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <WorkerProvider>
        <div className={styles.page}>
          <Foo />
        </div>
      </WorkerProvider>
    </Suspense>
  );
}
