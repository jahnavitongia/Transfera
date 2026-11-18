import path from "node:path";
import { parentPort } from "node:worker_threads";
import { fileURLToPath } from "node:url";
import { env, pipeline } from "@huggingface/transformers";

env.allowRemoteModels = false;
const modelPath = process.env.TRANSFERA_MODEL_DIR || fileURLToPath(new URL("../.demo/course-model", import.meta.url));
env.localModelPath = path.dirname(modelPath);
const encoder = await pipeline("feature-extraction", path.basename(modelPath), { dtype: "q8", device: "cpu" });
const catalog = new Map();
async function encode(texts) {
  const vectors = [];
  for (let i = 0; i < texts.length; i += 16) {
    const batch = await encoder(texts.slice(i, i + 16), { pooling: "mean", normalize: true });
    vectors.push(...batch.tolist());
  }
  return vectors;
}

let queue = Promise.resolve();
parentPort.on("message", ({ id, source, destination }) => {
  queue = queue.then(async () => {
    if (catalog.size + destination.length > 256) catalog.clear();
    const missing = destination.filter(text => !catalog.has(text));
    const vectors = await encode(missing);
    missing.forEach((text, i) => catalog.set(text, vectors[i]));
    const inputs = await encode(source);
    const scores = destination.map(text => inputs.map(vector =>
      vector.reduce((sum, value, i) => sum + value * catalog.get(text)[i], 0)));
    parentPort.postMessage({ id, scores });
  }).catch(() => parentPort.postMessage({ id, error: true }));
});
