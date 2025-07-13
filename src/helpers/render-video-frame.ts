const TARGET_WIDTH = 320;

export const renderVideoFrame = async (
  video: HTMLVideoElement,
): Promise<{ blob: Blob; imageData: ImageData }> => {
  const downscaleFactor = TARGET_WIDTH / video.videoWidth;
  const downscaledWidth = Math.floor(video.videoWidth * downscaleFactor);
  const downscaledHeight = Math.floor(video.videoHeight * downscaleFactor);
  const canvas = new OffscreenCanvas(downscaledWidth, downscaledHeight);
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error(
      "Failed to get 2D context from OffscreenCanvas for rendering video frame",
    );
  }
  context.drawImage(video, 0, 0, downscaledWidth, downscaledHeight);
  return {
    blob: await canvas.convertToBlob({
      type: "image/webp",
      quality: 0.5, // PNG does not support quality, but this is a placeholder
    }),
    imageData: context.getImageData(0, 0, downscaledWidth, downscaledHeight),
  };
};
