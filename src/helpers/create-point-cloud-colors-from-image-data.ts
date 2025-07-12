import { RawImage } from "@huggingface/transformers";

export // TODO: implement actual colour mapping
const createPointCloudColorsFromRawImage = (rawImage: RawImage): Uint8Array => {
  const colors = new Uint8Array(rawImage.data.length * 3);
  for (let i = 0; i < rawImage.data.length; ++i) {
    const x = i % rawImage.width;
    const y = Math.floor(i / rawImage.width);
    const xNormalized = x / rawImage.width;
    const yNormalized = y / rawImage.height;

    colors[i * 3] = xNormalized * 255; // Red
    colors[i * 3 + 1] = yNormalized * 255; // Green
    colors[i * 3 + 2] = 0; // Blue
  }
  return colors;
};
