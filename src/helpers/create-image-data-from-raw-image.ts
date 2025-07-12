import { RawImage } from "@huggingface/transformers";

export const createImageDataFromRawImage = (rawImage: RawImage): ImageData => {
  const pixelData = new ImageData(rawImage.width, rawImage.height);
  for (let i = 0; i < rawImage.data.length; ++i) {
    pixelData.data[4 * i] = rawImage.data[i]; // Red
    pixelData.data[4 * i + 1] = 0;
    pixelData.data[4 * i + 2] = 0;
    pixelData.data[4 * i + 3] = 255;
  }
  return pixelData;
};
