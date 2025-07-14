# Video Depth Explorer

![Image](./screenshot.png)

[Live Demo](https://depth-explore.vercel.app)

(Requires a modern GPU and Chrome browser to run correctly.)

## Overview

* Uses [Depth Anything v2](https://huggingface.co/onnx-community/depth-anything-v2-small) via `@huggingface/transformers` to infer depth frame-by-frame from videos.

* 3D point cloud visualization is powered by `@react-three/fiber`

* Uses xstate for all state management



