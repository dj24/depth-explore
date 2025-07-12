"use client";

import React, {Suspense, useCallback, useEffect} from "react";
import styles from "./page.module.css";
import {Canvas} from "@react-three/fiber";
import {useWorkerContext, WorkerProvider} from "@/contexts/worker-context";
import {useVideoUpload} from "@/hooks/use-video-upload";
import {Box} from "@/components/box";
import {useRenderVideoToCanvas} from "@/hooks/use-render-video-to-canvas";

const Foo = () => {
  const {actor, send} = useWorkerContext();
  const {videoSrc, handleVideoUpload} = useVideoUpload();
  const {canvasRef, videoRef} = useRenderVideoToCanvas();

  const handleSendFrame = useCallback(() => {
    if (!canvasRef.current) return;
    send({
      type: 'start',
      dataUrl: canvasRef.current.toDataURL() // Replace with actual video URL or data URL
    })
  }, [canvasRef, send]);

  useEffect(() => {
    console.log('SUBSCRIBING TO ACTOR');
    const subscription = actor.subscribe((snapshot) => {
      console.log('Actor Snapshot:', snapshot.value);
    });
    return () => {
      console.log('UNSUBSCRIBING FROM ACTOR');
      subscription.unsubscribe();
    };
  },[actor])


  return (
    <>
      <button onClick={handleSendFrame}>Upload Frame</button>
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
    </>
  )
}

export default function Home() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <WorkerProvider>
        <div className={styles.page}>
          <Foo/>
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
