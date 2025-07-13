"use client";

import React, {
  Suspense,
  useCallback,
  useEffect,
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
  const [video, setVideo] = useState<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handlePlayVideo = useCallback(() => {
    if (video) {
      video.play();
    }
  }, [video]);

  const handlePauseVideo = useCallback(() => {
    if (video) {
      video.pause();
    }
  }, [video]);

  useEffect(() => {
    if (!videoSrc) {
      return;
    }
    const node = document.createElement("video");
    node.currentTime = 0;
    node.src = videoSrc;
    node.addEventListener("play", () => {
      setIsPlaying(true);
      intervalRef.current = setInterval(() => {
        send({
          type: "start",
          video: node,
        });
      }, 1000 / 24); // 24 FPS
    });
    node.addEventListener("pause", () => {
      setIsPlaying(false);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    });
    node.load();
    setVideo(node);
  }, [videoSrc]);

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
