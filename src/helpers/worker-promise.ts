export const getWorkerPromise = (): Promise<Worker> => {
  // Check if we're in a browser environment
  if (typeof window === "undefined" || typeof Worker === "undefined") {
    return Promise.reject(
      new Error("Worker is not available in this environment"),
    );
  }

  return new Promise((resolve) => {
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
