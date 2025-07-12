export const createPointCloudColorsFromImageData = (
  imageData: ImageData,
  gamma: number = 1.8,
): Uint8Array => {
  // 4 channels (RGBA) to 3 channels (RGB)
  const numPixels = imageData.data.length / 4;
  const colors = new Uint8Array(numPixels * 3);

  const gammaFunc = (value: number) => Math.pow(value / 255, gamma) * 255;

  for (let i = 0, j = 0; i < imageData.data.length; i += 4, j += 3) {
    colors[j] = Math.round(gammaFunc(imageData.data[i])); // Red
    colors[j + 1] = Math.round(gammaFunc(imageData.data[i + 1])); // Green
    colors[j + 2] = Math.round(gammaFunc(imageData.data[i + 2])); // Blue
  }
  return colors;
};
