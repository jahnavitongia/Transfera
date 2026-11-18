const path = require("node:path");
const { Worker } = require("node:worker_threads");
let worker;
let serial = 0;
const pending = new Map();

function disconnect(instance) {
  if (worker !== instance) return;
  worker = undefined;
  for (const entry of pending.values()) {
    clearTimeout(entry.timer);
    entry.resolve(null);
  }
  pending.clear();
  instance.terminate().catch(() => {});
}

function localScores(source, destination) {
  if (process.env.TRANSFERA_COMPARISON === "titles" || pending.size >= 4) return Promise.resolve(null);
  if (!worker) {
    const instance = new Worker(path.join(__dirname, "../../comparison/worker.mjs"));
    worker = instance;
    instance.on("error", () => disconnect(instance));
    instance.on("exit", () => disconnect(instance));
    instance.on("message", ({ id, scores }) => {
      const entry = pending.get(id);
      if (!entry) return;
      clearTimeout(entry.timer);
      pending.delete(id);
      entry.resolve(scores ?? null);
      if (!pending.size) instance.unref();
    });
  }
  const instance = worker;
  const id = ++serial;
  return new Promise(resolve => {
    instance.ref();
    const timer = setTimeout(() => disconnect(instance), 4500);
    pending.set(id, { resolve, timer });
    instance.postMessage({ id, source, destination });
  });
}
module.exports = { localScores };
