import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;

function getKey() {
  const rawSecret = process.env.ENCRYPTION_SECRET;

  if (!rawSecret) {
    throw new Error("Missing ENCRYPTION_SECRET environment variable.");
  }

  return createHash("sha256").update(rawSecret).digest();
}

export function encryptValue(plainText: string) {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, getKey(), iv);

  const encrypted = Buffer.concat([
    cipher.update(plainText, "utf8"),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  return {
    iv: iv.toString("base64"),
    authTag: authTag.toString("base64"),
    cipherText: encrypted.toString("base64"),
  };
}

export function decryptValue(input: {
  iv: string;
  authTag: string;
  cipherText: string;
}) {
  const decipher = createDecipheriv(
    ALGORITHM,
    getKey(),
    Buffer.from(input.iv, "base64"),
  );

  decipher.setAuthTag(Buffer.from(input.authTag, "base64"));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(input.cipherText, "base64")),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}
