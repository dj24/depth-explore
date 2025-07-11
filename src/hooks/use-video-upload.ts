import React, {useRef} from "react";

export const useVideoUpload = ()=> {
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleVideoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) {
      return
    }
    const file = event.target.files?.[0];
    if (file && file.type.startsWith("video/")) {
      videoRef.current.src = URL.createObjectURL(file);
    }
  };

  return {
    videoRef,
    handleVideoUpload
  };
}