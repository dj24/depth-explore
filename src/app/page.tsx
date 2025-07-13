"use client";

import React, {
  Suspense,
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import styles from "./page.module.css";
import { useWorkerContext, WorkerProvider } from "@/contexts/worker-context";
import { useVideoUpload } from "@/hooks/use-video-upload";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { PointCloud } from "@/components/point-cloud";
import { getWorkerPromise } from "@/helpers/worker-promise";

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
  const [workerPromise, setWorkerPromise] = useState<Promise<Worker> | null>(
    null,
  );

  useLayoutEffect(() => {
    setWorkerPromise(getWorkerPromise());
  }, []);

  return (
    <Suspense fallback={<div>Loading...</div>}>
      {workerPromise && (
        <WorkerProvider workerPromise={workerPromise}>
          <div className={styles.page}>
            <Foo />
          </div>
        </WorkerProvider>
      )}
    </Suspense>
  );
}
