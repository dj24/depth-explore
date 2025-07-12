import { RawImage } from "@huggingface/transformers";

const Z_SCALE = 3.0;

export const createPointCloudPositionsFromRawImage = (
  rawImage: RawImage,
): Float16Array => {
  const positions = new Float16Array(rawImage.data.length * 3);
  const aspectRatio = rawImage.width / rawImage.height;
  for (let i = 0; i < rawImage.data.length; ++i) {
    const x = i % rawImage.width;
    const y = Math.floor(i / rawImage.width);
    const z = rawImage.data[i];

    const xNormalized = (x / rawImage.width) * aspectRatio;
    const yNormalized = 1.0 - y / rawImage.height;
    const zNormalized = z / 255; // Normalize z to [0, 1]

    const zScaled = zNormalized * Z_SCALE;

    const xOffset = xNormalized * 2 - aspectRatio;
    const yOffset = yNormalized * 2 - 1;
    const zOffset = zScaled - Z_SCALE / 2;

    positions[i * 3] = xOffset;
    positions[i * 3 + 1] = yOffset;
    positions[i * 3 + 2] = zOffset;
  }
  return positions;
};
