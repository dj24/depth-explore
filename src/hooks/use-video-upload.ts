import React from "react";

export const useVideoUpload = ()=> {
  const [videoSrc, setVideoSrc] = React.useState<string | null>(null);

  const handleVideoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith("video/")) {
      setVideoSrc(URL.createObjectURL(file));
    }
  };

  return {
    videoSrc,
    handleVideoUpload
  };
}