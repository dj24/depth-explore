"use client";

import React, { Suspense, useCallback, useEffect, useRef } from "react";
import styles from "./page.module.css";
import { useWorkerContext, WorkerProvider } from "@/contexts/worker-context";
import { useVideoUpload } from "@/hooks/use-video-upload";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";

const PointCloud = ({
  positions,
  colors,
}: {
  positions: Float32Array;
  colors: Uint8Array;
}) => {
  return (
    <points key={`${positions.length}-${colors.length}`}>
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
      <pointsMaterial size={0.3} vertexColors={true} />
    </points>
  );
};

const Foo = () => {
  const { positions, colors, send } = useWorkerContext();
  const { videoSrc, handleVideoUpload } = useVideoUpload();
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const handleSendFrame = useCallback(() => {
    if (videoRef.current) {
      send({
        type: "start",
        video: videoRef.current,
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
            style={{ width: 640 }}
            ref={videoRef}
            src={videoSrc}
            controls
          />
        )}
        <Canvas
          camera={{ fov: 15 }}
          style={{
            width: 1280,
            aspectRatio: "16 / 9",
            border: "1px solid black",
          }}
        >
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
