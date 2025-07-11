"use client";

import React, {useRef} from "react";
import styles from "./page.module.css";

export default function Home() {
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleVideoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if(!videoRef.current){
      return
    }
    const file = event.target.files?.[0];
    if (file && file.type.startsWith("video/")) {
      videoRef.current.src = URL.createObjectURL(file);
    }
  };

  return (
    <div className={styles.page}>
      <div>
        <label htmlFor="video-upload">
          Upload Video
        </label>
        <input
          id="video-upload"
          type="file"
          accept="video/*"
          onChange={handleVideoUpload}
          className={styles.hiddenInput}
        />
        <div className={styles.videoContainer}>
          <video
            ref={videoRef}
            controls
            className={styles.video}
            width="100%"
            height="auto"
          />
        </div>
      </div>
    </div>
  );
}
