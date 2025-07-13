export const getWorkerPromise = (): Promise<Worker> => {
  return new Promise((resolve) => {
    console.log("Creating worker...");
    const worker = new Worker(
      new URL("../workers/worker.js", import.meta.url),
      {
        type: "module",
      },
    );

    worker.addEventListener("message", (event: MessageEvent) => {
      if (event.data.type === "pong") {
        resolve(worker);
      }
    });

    worker.postMessage({ type: "ping" });
  });
};
