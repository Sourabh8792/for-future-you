import sodium from "./vendor/libsodium-wrappers.js";

import { ACCESS_PROFILES } from "./access-config.js";
import { decryptContent } from "./crypto-core.mjs";

const subtle = globalThis.crypto?.subtle;
const screens = {
  role: document.querySelector("#role-screen"),
  nephew: document.querySelector("#nephew-screen"),
  question: document.querySelector("#question-screen"),
  letter: document.querySelector("#letter-screen")
};
const questionText = document.querySelector("#question-text");
const unlockForm = document.querySelector("#unlock-form");
const answerInput = document.querySelector("#answer");
const unlockButton = document.querySelector("#unlock-button");
const statusMessage = document.querySelector("#unlock-status");

let selectedRole = null;

function showScreen(name) {
  for (const [screenName, element] of Object.entries(screens)) {
    element.hidden = screenName !== name;
  }
  window.scrollTo({ top: 0, behavior: "instant" });
}

function showQuestion(role) {
  const profile = ACCESS_PROFILES[role];
  selectedRole = role;
  questionText.textContent = `Please copy and paste the “exact” first message I sent you on WhatsApp on ${profile.date}.`;
  answerInput.value = "";
  statusMessage.textContent = "";
  showScreen("question");
  answerInput.focus();
}

for (const button of document.querySelectorAll("[data-role]")) {
  button.addEventListener("click", () => {
    const role = button.dataset.role;
    if (role === "nephew") {
      showScreen("nephew");
      return;
    }
    showQuestion(role);
  });
}

for (const button of document.querySelectorAll("[data-helper]")) {
  button.addEventListener("click", () => showQuestion(button.dataset.helper));
}

for (const button of document.querySelectorAll("[data-back]")) {
  button.addEventListener("click", () => {
    selectedRole = null;
    answerInput.value = "";
    statusMessage.textContent = "";
    showScreen("role");
  });
}

unlockForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!selectedRole || !answerInput.value.trim()) {
    statusMessage.textContent = "Please paste the WhatsApp message first.";
    return;
  }

  if (!subtle) {
    statusMessage.textContent = "This browser can’t open the letter. Try a current version of Safari, Chrome, or Firefox.";
    return;
  }

  unlockButton.disabled = true;
  unlockButton.textContent = "Checking…";
  statusMessage.textContent = "";

  try {
    const profile = ACCESS_PROFILES[selectedRole];
    const response = await fetch(profile.payloadUrl, { cache: "no-store" });
    if (!response.ok) {
      throw new Error("Encrypted letter is unavailable");
    }

    const payload = await response.json();
    await sodium.ready;
    const letterHtml = await decryptContent({
      sodium,
      subtle,
      answer: answerInput.value,
      payload
    });

    answerInput.value = "";
    screens.letter.innerHTML = letterHtml;
    showScreen("letter");
  } catch {
    answerInput.value = "";
    statusMessage.textContent = "That doesn’t match. Check the message and try again.";
    answerInput.focus();
  } finally {
    unlockButton.disabled = false;
    unlockButton.textContent = "Unlock the letter";
  }
});
