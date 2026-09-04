import { webcrypto } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { Writable } from "node:stream";
import { fileURLToPath } from "node:url";
import { createInterface } from "node:readline/promises";

import sodium from "../vendor/libsodium-wrappers.js";

import { decryptContent, encryptContent, normalizeAnswer } from "../crypto-core.mjs";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const letterPath = resolve(projectRoot, "private/letter.html");
const outputDir = resolve(projectRoot, "encrypted");

class HiddenOutput extends Writable {
  muted = false;

  _write(chunk, encoding, callback) {
    if (!this.muted) {
      process.stdout.write(chunk, encoding);
    }
    callback();
  }
}

function validateAnswer(answer) {
  const normalized = normalizeAnswer(answer);
  if (normalized.split(/\s+/u).length < 5) {
    throw new Error("The message must contain at least five words.");
  }
  return normalized;
}

async function askHidden(readline, output, prompt) {
  process.stdout.write(prompt);
  output.muted = true;
  const value = await readline.question("");
  output.muted = false;
  process.stdout.write("\n");
  return value;
}

async function collectAnswer(readline, output, label) {
  const answer = validateAnswer(await askHidden(readline, output, `${label} answer: `));
  const confirmation = validateAnswer(
    await askHidden(readline, output, `${label} answer again: `)
  );

  if (answer !== confirmation) {
    throw new Error(`${label} answers did not match. No encrypted files were written.`);
  }
  return answer;
}

async function writeAtomically(path, contents) {
  const temporaryPath = `${path}.tmp`;
  await writeFile(temporaryPath, contents, { mode: 0o600 });
  await rename(temporaryPath, path);
}

if (!process.stdin.isTTY || !process.stdout.isTTY) {
  throw new Error("Run this command in an interactive Terminal window.");
}

const letterHtml = await readFile(letterPath, "utf8");
const hiddenOutput = new HiddenOutput();
const readline = createInterface({
  input: process.stdin,
  output: hiddenOutput,
  terminal: true
});

let fatherAnswer;
let motherAnswer;
try {
  process.stdout.write("Your pasted messages will stay hidden and will not be saved.\n\n");
  fatherAnswer = await collectAnswer(readline, hiddenOutput, "Father");
  motherAnswer = await collectAnswer(readline, hiddenOutput, "Mother");
} finally {
  hiddenOutput.muted = false;
  readline.close();
}

await sodium.ready;
await mkdir(outputDir, { recursive: true });

const profiles = [
  ["father", fatherAnswer],
  ["mother", motherAnswer]
];

for (const [role, answer] of profiles) {
  const payload = await encryptContent({
    sodium,
    subtle: webcrypto.subtle,
    role,
    answer,
    plaintext: letterHtml
  });

  const verified = await decryptContent({
    sodium,
    subtle: webcrypto.subtle,
    answer,
    payload
  });
  if (verified !== letterHtml) {
    throw new Error(`Self-check failed for ${role}. No files were published.`);
  }

  await writeAtomically(
    resolve(outputDir, `${role}.json`),
    `${JSON.stringify(payload, null, 2)}\n`
  );
}

console.log("Encrypted files created and verified. The answers were not saved.");
