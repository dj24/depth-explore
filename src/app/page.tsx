"use client";

import React, {Suspense, useCallback, useEffect, useRef} from "react";
import styles from "./page.module.css";
import {Canvas} from "@react-three/fiber";
import {useWorkerContext, WorkerProvider} from "@/contexts/worker-context";
import {useVideoUpload} from "@/hooks/use-video-upload";
import {Box} from "@/components/box";
import {useRenderVideoToCanvas} from "@/hooks/use-render-video-to-canvas";
import {match, P} from "ts-pattern";

const Foo = () => {
  const {actor, send} = useWorkerContext();
  const {videoSrc, handleVideoUpload} = useVideoUpload();
  const {canvasRef, videoRef} = useRenderVideoToCanvas();
  const outputCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const handleSendFrame = useCallback(() => {
    if (!canvasRef.current || !outputCanvasRef) return;
    send({
      type: 'start',
      dataUrl: canvasRef.current.toDataURL() // Replace with actual video URL or data URL
    })
  }, [canvasRef, send]);

  useEffect(() => {
    console.log('SUBSCRIBING TO ACTOR');
    const subscription = actor.subscribe((snapshot) => {
      const rawImage = snapshot.context.rawImage;
      const canvas = canvasRef.current;
      const canvasContext = canvas?.getContext('2d');
      const outputCanvas = outputCanvasRef.current;
      const outputCanvasContext = outputCanvas?.getContext('2d');
      match({canvas, rawImage,canvasContext, outputCanvasContext,outputCanvas})
          .with(
              {canvas: P.not(P.nullish), rawImage: P.not(P.nullish), canvasContext: P.not(P.nullish), outputCanvasContext: P.not(P.nullish), outputCanvas: P.not(P.nullish)},
              ({canvas, outputCanvas, rawImage, canvasContext, outputCanvasContext}) => {
            canvasContext.clearRect(0, 0, canvas.width, canvas.height);
            const pixelData = canvasContext.getImageData(0, 0, canvas.width, canvas.height);
            for (let i = 0; i < rawImage.data.length; ++i) {
              pixelData.data[4 * i + 1] = rawImage.data[i];
              pixelData.data[4 * i + 2] = rawImage.data[i];
              pixelData.data[4 * i + 3] = 255; // Set alpha to fully opaque
              pixelData.data[4 * i] = rawImage.data[i];
            }
            canvasContext.putImageData(pixelData, 0, 0);
            outputCanvas.width = canvas.width;
            outputCanvas.height = canvas.height;
            outputCanvasContext.clearRect(0, 0, outputCanvas.width, outputCanvas.height);
            outputCanvasContext.drawImage(canvas, 0, 0)
            console.log('Canvas and rawImage are available, processed successfully');
          })
          .otherwise(() => {
            console.error('Canvas or rawImage is not available');
          });
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
      <canvas  width={200} height={200} ref={outputCanvasRef} style={{width: 400, height: 300, border: '1px solid green'}}/>
    </>
  )
}

export default function Home() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <WorkerProvider>
        <div className={styles.page}>
          <Foo/>
          {/*<Canvas style={{*/}
          {/*  width: 800,*/}
          {/*  height: 800,*/}
          {/*  border: '1px solid black',*/}
          {/*}}>*/}
          {/*  <ambientLight/>*/}
          {/*  <pointLight position={[10, 10, 10]}/>*/}
          {/*  <Box/>*/}
          {/*</Canvas>*/}
        </div>
      </WorkerProvider>
    </Suspense>
  )
    ;
}
