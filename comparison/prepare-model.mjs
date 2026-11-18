import { createHash } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const revision = "751bff37182d3f1213fa05d7196b954e230abad9";
const hashes = {
  "config.json": "7135149f7cffa1a573466c6e4d8423ed73b62fd2332c575bf738a0d033f70df7",
  "tokenizer.json": "da0e79933b9ed51798a3ae27893d3c5fa4a201126cef75586296df9b4d2c62a0",
  "tokenizer_config.json": "9261e7d79b44c8195c1cada2b453e55b00aeb81e907a6664974b4d7776172ab3",
  "onnx/model_quantized.onnx": "afdb6f1a0e45b715d0bb9b11772f032c399babd23bfc31fed1c170afc848bdb1",
};
const root = fileURLToPath(new URL("../.demo/course-model/", import.meta.url));
const digest = bytes => createHash("sha256").update(bytes).digest("hex");
for (const [name, expected] of Object.entries(hashes)) {
  const target = path.join(root, name);
  const existing = await readFile(target).catch(error => {
    if (error.code !== "ENOENT") throw error;
  });
  if (existing && digest(existing) === expected) continue;
  const url = `https://huggingface.co/Xenova/all-MiniLM-L6-v2/resolve/${revision}/${name}`;
  const response = await fetch(url, { signal: AbortSignal.timeout(120000) });
  if (!response.ok) throw Error(`Model download failed for ${name}: ${response.status}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (digest(bytes) !== expected) throw Error(`Checksum mismatch: ${name}`);
  await mkdir(path.dirname(target), { recursive: true });
  const temp = target + "." + process.pid + ".tmp";
  await writeFile(temp, bytes);
  await rename(temp, target);
}
console.log("Local course model verified. Faculty comparison is ready for offline use.");
