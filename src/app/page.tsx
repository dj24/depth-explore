"use client";

import React, {Suspense, useCallback, useEffect, useRef} from "react";
import styles from "./page.module.css";
import {Canvas} from "@react-three/fiber";
import {useWorkerContext, WorkerProvider} from "@/contexts/worker-context";
import {useVideoUpload} from "@/hooks/use-video-upload";
import {Box} from "@/components/box";
import {RawImage} from "@huggingface/transformers";
import {useRenderVideoToCanvas} from "@/hooks/use-render-video-to-canvas";

const Foo = () => {
  const {send} = useWorkerContext();

  return (
    <>
      <button onClick={() => {
        send({
          type: 'start',
          dataUrl: 'https://example.com/video.mp4' // Replace with actual video URL or data URL
        })
      }}>START
      </button>
      <button onClick={() => {
        send({
          type: 'finish',
          rawImage: new RawImage(new Uint8Array(), 2, 2, 1), // Replace with actual video URL or data URL
        })
      }}>START
      </button>
    </>
  )
}

export default function Home() {
  const {videoSrc, handleVideoUpload} = useVideoUpload();
  const {canvasRef, videoRef} = useRenderVideoToCanvas();

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <WorkerProvider>
        <div className={styles.page}>
          <Foo/>
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
          {videoSrc && <video
              ref={videoRef}
              src={videoSrc}
              controls
              width="800px"
              height="auto"
          />}
          <canvas width={200} height={200} style={{width: 400, height: 300, border: '1px solid blue'}} ref={canvasRef}/>
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
  )
    ;
}
