import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const vendorDir = resolve(projectRoot, "vendor");
const wrapperSource = resolve(
  projectRoot,
  "node_modules/libsodium-wrappers-sumo/dist/modules-sumo-esm/libsodium-wrappers.mjs"
);
const sodiumSource = resolve(
  projectRoot,
  "node_modules/libsodium-sumo/dist/modules-sumo-esm/libsodium-sumo.mjs"
);
const licenseSource = resolve(projectRoot, "node_modules/libsodium-wrappers-sumo/LICENSE");

await mkdir(vendorDir, { recursive: true });

const wrapper = await readFile(wrapperSource, "utf8");
const browserWrapper = wrapper.replace(
  'from"libsodium-sumo"',
  'from"./libsodium-sumo.js"'
);

if (browserWrapper === wrapper) {
  throw new Error("Could not rewrite the pinned libsodium browser import");
}

await Promise.all([
  writeFile(resolve(vendorDir, "libsodium-wrappers.js"), browserWrapper),
  copyFile(sodiumSource, resolve(vendorDir, "libsodium-sumo.js")),
  copyFile(licenseSource, resolve(vendorDir, "libsodium.LICENSE.txt"))
]);

console.log("Vendored libsodium 0.8.4 for local browser use.");
