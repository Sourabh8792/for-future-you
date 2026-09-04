import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const expected = {
  mother: "encrypted/mother.json",
  father: "encrypted/father.json"
};
const payloads = [];

for (const [role, relativePath] of Object.entries(expected)) {
  const payload = JSON.parse(await readFile(resolve(relativePath), "utf8"));

  if (
    payload.version !== 1 ||
    payload.role !== role ||
    payload.kdf?.name !== "Argon2id" ||
    payload.kdf?.operations !== 3 ||
    payload.kdf?.memoryBytes !== 64 * 1024 * 1024 ||
    payload.kdf?.keyBytes !== 32 ||
    payload.cipher?.name !== "AES-GCM" ||
    payload.cipher?.tagLength !== 128
  ) {
    throw new Error(`${relativePath} has unexpected encryption settings.`);
  }

  if (
    Buffer.from(payload.kdf.salt, "base64").length !== 16 ||
    Buffer.from(payload.cipher.iv, "base64").length !== 12 ||
    Buffer.from(payload.ciphertext, "base64").length < 500
  ) {
    throw new Error(`${relativePath} has invalid encrypted data.`);
  }

  payloads.push(payload);
}

if (
  payloads[0].kdf.salt === payloads[1].kdf.salt ||
  payloads[0].cipher.iv === payloads[1].cipher.iv ||
  payloads[0].ciphertext === payloads[1].ciphertext
) {
  throw new Error("The two encrypted letters must use independent random values.");
}

console.log("Both encrypted letter files are ready to publish.");
