import assert from "node:assert/strict";
import { webcrypto } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";

import sodium from "libsodium-wrappers-sumo";

import {
  decryptContent,
  encryptContent,
  KDF_SETTINGS,
  normalizeAnswer
} from "../crypto-core.mjs";

const [html, css, script, config] = await Promise.all([
  readFile(new URL("../index.html", import.meta.url), "utf8"),
  readFile(new URL("../styles.css", import.meta.url), "utf8"),
  readFile(new URL("../script.js", import.meta.url), "utf8"),
  readFile(new URL("../access-config.js", import.meta.url), "utf8")
]);

test("shows the three approved role choices", () => {
  assert.match(html, /Let’s first check who you are first\./);
  assert.match(html, />I’m his mother<\/button>/);
  assert.match(html, />I’m his father<\/button>/);
  assert.match(html, />I’m the guy, this gift is for me<\/button>/);
});

test("uses the approved questions and nephew flow", () => {
  assert.match(config, /mother:[\s\S]*date: "27 March 2026"/);
  assert.match(config, /father:[\s\S]*date: "13 June 2026"/);
  assert.match(script, /exact\.textContent = "“exact”"/);
  assert.match(script, /"Please copy-paste the "/);
  assert.match(script, /first message I sent you in our personal WhatsApp chat on \$\{profile\.date\}\./);
  assert.match(html, /Well, I didn’t really have a WhatsApp chat with you when I wrote this, so ask your mom or dad to help you unlock it :\)/);
  assert.match(html, />Ask Mom<\/button>/);
  assert.match(html, />Ask Dad<\/button>/);
});

test("keeps the gate minimal and locks again on reload", () => {
  assert.match(html, /class="back-link"[^>]*>Go back<\/button>/);
  assert.match(css, /\.back-link \{[\s\S]*font-size: 13px/);
  assert.match(css, /--surface: #ebe1d3/);
  assert.match(css, /\.choice-button,[\s\S]*background: var\(--surface\)/);
  assert.doesNotMatch(script, /localStorage|sessionStorage|indexedDB/);
  assert.doesNotMatch(css, /animation|gradient|backdrop-filter|box-shadow/);
});

test("keeps private content out of the public page shell", () => {
  assert.doesNotMatch(html, /<article|Twitter|Click here for the gift|notion\.site/i);
  assert.doesNotMatch(script, /Twitter|Click here for the gift|notion\.site/i);
  assert.doesNotMatch(config, /Twitter|Click here for the gift|notion\.site/i);
});

test("normalizes only Unicode representation and outside whitespace", () => {
  assert.equal(normalizeAnswer("  A message with a question?  "), "A message with a question?");
  assert.notEqual(normalizeAnswer("Exact Message?"), normalizeAnswer("exact message?"));
  assert.notEqual(normalizeAnswer("Exact Message?"), normalizeAnswer("Exact Message"));
});

test("Argon2id and AES-GCM round-trip while rejecting a wrong answer", async () => {
  await sodium.ready;
  const plaintext = "A disposable test letter";
  const answer = "A private disposable answer with enough words?";
  const payload = await encryptContent({
    sodium,
    subtle: webcrypto.subtle,
    role: "mother",
    answer,
    plaintext,
    kdf: KDF_SETTINGS
  });

  assert.equal(
    await decryptContent({ sodium, subtle: webcrypto.subtle, answer, payload }),
    plaintext
  );
  await assert.rejects(
    decryptContent({
      sodium,
      subtle: webcrypto.subtle,
      answer: "A different disposable answer with enough words?",
      payload
    })
  );
});

test("uses only local runtime assets", () => {
  assert.match(html, /src="script\.js"/);
  assert.match(script, /\.\/vendor\/libsodium-wrappers\.js/);
  assert.doesNotMatch(html, /<(?:script|link)[^>]+(?:src|href)="https?:/i);
});
