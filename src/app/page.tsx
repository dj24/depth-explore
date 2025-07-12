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
import { OrbitControls } from "@react-three/drei";

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

const Foo = () => {
  const { positions, colors, send } = useWorkerContext();
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
        <Canvas
          camera={{ fov: 40 }}
          style={{
            width: 960,
            aspectRatio: "16 / 9",
            border: "1px solid black",
          }}
        >
          <ambientLight />
          <OrbitControls makeDefault />
          {positions && colors && (
            <PointCloud colors={colors} positions={positions} />
          )}
        </Canvas>
      </div>
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
