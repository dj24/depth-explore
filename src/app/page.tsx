"use client";

import React, {Suspense, useEffect} from "react";
import styles from "./page.module.css";
import {Canvas} from "@react-three/fiber";
import {WorkerProvider} from "@/contexts/worker-context";
import {useVideoUpload} from "@/hooks/use-video-upload";
import {Box} from "@/components/box";


const useRenderVideoToCanvas = ({videoRef, canvasRef}: {
  videoRef: React.RefObject<HTMLVideoElement | null>,
  canvasRef: React.RefObject<HTMLCanvasElement | null>
}) => {
  useEffect(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const context = canvasRef.current.getContext('2d');
    if (!context) return;

    const renderFrame = () => {
      if (!videoRef.current || !canvasRef.current) return;
      context.drawImage(video, 0, 0, canvasRef.current.width, canvasRef.current.height);
      requestAnimationFrame(renderFrame);
    };

    video.addEventListener('play', renderFrame);

    return () => {
      video.removeEventListener('play', renderFrame);
    };
  }, [videoRef, canvasRef]);
}

export default function Home() {
  const {videoRef, handleVideoUpload} = useVideoUpload();
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  useRenderVideoToCanvas({videoRef, canvasRef});

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <WorkerProvider>
        <div className={styles.page}>

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
          <video
            ref={videoRef}
            controls
            width="800px"
            height="auto"
          />
          <canvas style={{width: 400, height: 300, border: '1px solid blue'}} ref={canvasRef}/>
          <Canvas style={{
            width: 800,
            height: 800,
            border: '1px solid black',
          }}>
            <ambientLight/>
            <pointLight position={[10, 10, 10]}/>
            <Box/>
          </Canvas>
        </div>
      </WorkerProvider>
    </Suspense>
  );
}
