"use client";

import React from "react";
import styles from "./page.module.css";
import {
  useColors,
  useCurrentTime,
  useIsEmpty,
  useIsPlaying,
  usePositions,
  useVideoDuration,
  useWorkerContext,
} from "@/contexts/worker-context";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { PointCloud } from "@/components/point-cloud";
import { PlaybackSlider } from "@/components/playback-slider";
import { PauseIcon } from "@/components/icons/pause";
import { PlayIcon } from "@/components/icons/play";
import { CloseIcon } from "@/components/icons/close";

const VideoUploader = () => {
  const { actor } = useWorkerContext();

  const handleVideoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith("video/")) {
      actor.send({ type: "setupVideo", videoSrc: URL.createObjectURL(file) });
    }
  };

  return (
    <>
      <label className={styles.UploadControl} htmlFor="video-upload">
        Upload Video
      </label>
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

const PlayPauseButton = () => {
  const isPlaying = useIsPlaying();
  const { actor } = useWorkerContext();

  return (
    <button
      className={styles.PlayPauseButton}
      onClick={() =>
        actor.send({ type: isPlaying ? "pauseVideo" : "playVideo" })
      }
    >
      {isPlaying ? <PauseIcon /> : <PlayIcon />}
    </button>
  );
};

const PlaybackControls = () => {
  const currentTime = useCurrentTime();
  const duration = useVideoDuration();
  const { actor } = useWorkerContext();

  const sliderValue = (currentTime / duration) * 100;

  return (
    <div className={styles.PlaybackControls}>
      <PlayPauseButton />
      <PlaybackSlider
        onValueCommitted={(value) => {
          if (typeof value === "number") {
            actor.send({
              type: "seekVideo",
              time: (value / 100) * duration,
            });
          } else {
            actor.send({
              type: "seekVideo",
              time: (value[0] / 100) * duration,
            });
          }
        }}
        value={isNaN(sliderValue) ? 0 : sliderValue}
      />
    </div>
  );
};

const CanvasWrapper = () => {
  const positions = usePositions();
  const colors = useColors();

  return (
    <Canvas camera={{ fov: 15, position: [0, 0, 10] }}>
      <OrbitControls
        makeDefault
        enableZoom={true}
        zoomSpeed={0.3}
        minDistance={2}
        maxDistance={50}
      />
      {positions && colors && (
        <PointCloud colors={colors} positions={positions} />
      )}
    </Canvas>
  );
};

const ClearButton = () => {
  const { actor } = useWorkerContext();

  return (
    <button
      className={styles.ClearButton}
      onClick={() => actor.send({ type: "resetVideo" })}
    >
      <CloseIcon />
    </button>
  );
};

export default function Home() {
  const isEmpty = useIsEmpty();

  return (
    <main className={styles.Page}>
      {isEmpty ? <VideoUploader /> : <CanvasWrapper />}
      <PlaybackControls />
      <ClearButton />
    </main>
  );
}
