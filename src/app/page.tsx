"use client";

import React, {
  Suspense,
  useCallback,
  useEffect,
  useLayoutEffect,
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
  const { positions, colors, isPlaying, videoSrc, send } = useWorkerContext();
  const { videoSrc: uploadedVideoSrc, handleVideoUpload } = useVideoUpload();

  const handlePlayVideo = useCallback(() => {
    send({ type: "playVideo" });
  }, [send]);

  const handlePauseVideo = useCallback(() => {
    send({ type: "pauseVideo" });
  }, [send]);

  useEffect(() => {
    if (uploadedVideoSrc) {
      send({ type: "setupVideo", videoSrc: uploadedVideoSrc });
    }
  }, [uploadedVideoSrc, send]);

  return (
    <>
      <button onClick={isPlaying ? handlePauseVideo : handlePlayVideo}>
        {isPlaying ? "Pause" : "Play"}
      </button>
      <label htmlFor="video-upload">Upload Video</label>
      <input
        id="video-upload"
        type="file"
        accept="video/*"
        onChange={handleVideoUpload}
        className={styles.hiddenInput}
      />
      <div>
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
