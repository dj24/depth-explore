import { pipeline, RawImage } from "@huggingface/transformers";
import { match } from "ts-pattern";

const MODEL = "onnx-community/depth-anything-v2-small";

let depthAnythingModel = null;

const getDepthAnythingModel = async () => {
  if (depthAnythingModel) {
    return depthAnythingModel;
  }
  for (let device of ["webgpu", "wasm"]) {
    try {
      const depthEstimationPipeline = await pipeline(
        "depth-estimation",
        MODEL,
        {
          device: device,
        },
      );
      console.log("pipeline is ready, device", device);
      depthAnythingModel = { pipeline: depthEstimationPipeline, device };
      return depthAnythingModel;
    } catch (error) {
      console.warn(`Failed to load pipeline with device ${device}:`, error);
    }
  }
};

self.onmessage = async (e) => {
  const depthInstance = await getDepthAnythingModel();
  try {
    const { type, data } = e.data;
    match(type)
      .with("ping", () => {
        self.postMessage({ type: "pong", data: depthInstance.device });
      })
      .with("depth", async () => {
        const image = await RawImage.read(data);
        const { depth } = await depthInstance.pipeline(image);
        self.postMessage({ type: "depth_result", data: depth });
      })
      .otherwise(() => {
        throw new Error(`Unknown message type: ${type}`);
      });
  } catch (e) {
    self.postMessage({ type: "error", data: e });
  }
};
