"use client";

import React, { useCallback, useEffect } from "react";
import styles from "./page.module.css";
import { useWorkerContext, WorkerProvider } from "@/contexts/worker-context";
import { useVideoUpload } from "@/hooks/use-video-upload";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { PointCloud } from "@/components/point-cloud";
import { PlaybackSlider } from "@/components/playback-slider";

const VideoUploader = () => {
  const { isLoading, send } = useWorkerContext();
  const { videoSrc: uploadedVideoSrc, handleVideoUpload } = useVideoUpload();

  useEffect(() => {
    if (uploadedVideoSrc) {
      send({ type: "setupVideo", videoSrc: uploadedVideoSrc });
    }
  }, [uploadedVideoSrc, send]);

  if (isLoading) {
    return <div>Loading worker...</div>;
  }

  return (
    <>
      <label htmlFor="video-upload">Upload Video</label>
      <input
        id="video-upload"
        type="file"
        accept="video/*"
        onChange={handleVideoUpload}
        className={styles.HiddenInput}
      />
    </>
  );
};

const PlaybackControls = () => {
  const { isPlaying, send } = useWorkerContext();

  return (
    <div className={styles.PlaybackControls}>
      <button
        onClick={() => send({ type: isPlaying ? "pauseVideo" : "playVideo" })}
      >
        {isPlaying ? "Pause" : "Play"}
      </button>
      <PlaybackSlider />
    </div>
  );
};

const CanvasWrapper = () => {
  const { positions, colors, isPlaying, isLoading, send } = useWorkerContext();

  return (
    <Canvas camera={{ fov: 15 }}>
      <OrbitControls makeDefault />
      {positions && colors && (
        <PointCloud colors={colors} positions={positions} />
      )}
    </Canvas>
  );
};

export default function Home() {
  const { isEmpty } = useWorkerContext();

  return (
    <main className={styles.Page}>
      {isEmpty ? <VideoUploader /> : <CanvasWrapper />}
      <PlaybackControls />
    </main>
  );
}
