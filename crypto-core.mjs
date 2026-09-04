const encoder = new TextEncoder();
const decoder = new TextDecoder();

export const KDF_SETTINGS = Object.freeze({
  name: "Argon2id",
  operations: 3,
  memoryBytes: 64 * 1024 * 1024,
  keyBytes: 32
});

export const CIPHER_SETTINGS = Object.freeze({
  name: "AES-GCM",
  ivBytes: 12,
  tagLength: 128
});

export function normalizeAnswer(answer) {
  return answer.normalize("NFC").trim();
}

function bytesToBase64(bytes) {
  let binary = "";
  for (let offset = 0; offset < bytes.length; offset += 8192) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 8192));
  }
  return btoa(binary);
}

function base64ToBytes(value) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function associatedData(role) {
  return encoder.encode(`for-future-you:v1:${role}`);
}

async function deriveAesKey({ sodium, subtle, answer, salt, usages, settings }) {
  const normalized = normalizeAnswer(answer);
  if (!normalized) {
    throw new Error("Answer is required");
  }

  const rawKey = sodium.crypto_pwhash(
    settings.keyBytes,
    normalized,
    salt,
    settings.operations,
    settings.memoryBytes,
    sodium.crypto_pwhash_ALG_ARGON2ID13
  );

  try {
    return await subtle.importKey("raw", rawKey, CIPHER_SETTINGS.name, false, usages);
  } finally {
    sodium.memzero(rawKey);
  }
}

export async function encryptContent({ sodium, subtle, role, answer, plaintext, kdf = KDF_SETTINGS }) {
  const salt = sodium.randombytes_buf(sodium.crypto_pwhash_SALTBYTES);
  const iv = sodium.randombytes_buf(CIPHER_SETTINGS.ivBytes);
  const key = await deriveAesKey({
    sodium,
    subtle,
    answer,
    salt,
    usages: ["encrypt"],
    settings: kdf
  });

  const encrypted = await subtle.encrypt(
    {
      name: CIPHER_SETTINGS.name,
      iv,
      additionalData: associatedData(role),
      tagLength: CIPHER_SETTINGS.tagLength
    },
    key,
    encoder.encode(plaintext)
  );

  return {
    version: 1,
    role,
    kdf: {
      name: kdf.name,
      operations: kdf.operations,
      memoryBytes: kdf.memoryBytes,
      keyBytes: kdf.keyBytes,
      salt: bytesToBase64(salt)
    },
    cipher: {
      name: CIPHER_SETTINGS.name,
      tagLength: CIPHER_SETTINGS.tagLength,
      iv: bytesToBase64(iv)
    },
    ciphertext: bytesToBase64(new Uint8Array(encrypted))
  };
}

export async function decryptContent({ sodium, subtle, answer, payload }) {
  if (
    payload?.version !== 1 ||
    payload?.kdf?.name !== KDF_SETTINGS.name ||
    payload?.cipher?.name !== CIPHER_SETTINGS.name
  ) {
    throw new Error("Unsupported encrypted letter format");
  }

  const key = await deriveAesKey({
    sodium,
    subtle,
    answer,
    salt: base64ToBytes(payload.kdf.salt),
    usages: ["decrypt"],
    settings: payload.kdf
  });

  const decrypted = await subtle.decrypt(
    {
      name: CIPHER_SETTINGS.name,
      iv: base64ToBytes(payload.cipher.iv),
      additionalData: associatedData(payload.role),
      tagLength: payload.cipher.tagLength
    },
    key,
    base64ToBytes(payload.ciphertext)
  );

  return decoder.decode(decrypted);
}
