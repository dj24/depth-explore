import { RawImage } from "@huggingface/transformers";

export const createPointCloudPositionsFromRawImage = (
  rawImage: RawImage,
): Float16Array => {
  const positions = new Float16Array(rawImage.data.length * 3);
  const aspectRatio = rawImage.width / rawImage.height;
  for (let i = 0; i < rawImage.data.length; ++i) {
    const x = i % rawImage.width;
    const y = Math.floor(i / rawImage.width);

    const xNormalized = (x / rawImage.width) * aspectRatio;
    const yNormalized = 1.0 - y / rawImage.height;

    const xOffset = xNormalized * 2 - aspectRatio;
    const yOffset = yNormalized * 2 - 1;

    positions[i * 3] = xOffset;
    positions[i * 3 + 1] = yOffset;
    positions[i * 3 + 2] = rawImage.data[i] / 255;
  }
  return positions;
};
