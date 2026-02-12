import crypto from "crypto";

const RSA_PUBLIC_KEY = process.env.RSA_PUBLIC_KEY;

export function generateAesKey() {
  return crypto.randomBytes(32); // 256 bits
}

export function encryptVotePlaintext(plaintext, key) {
  const iv = crypto.randomBytes(12); // GCM recommended
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return {
    cipherText: encrypted.toString("base64"),
    iv: iv.toString("base64"),
    authTag: authTag.toString("base64"),
  };
}

// Fallback key for demo/dev purposes to prevent crashes
const FALLBACK_RSA_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAnLhI/p+dzt2LdMGuJral
25/cdKZxbb3iuRoqKSc72t0rMBSOT65azZ4x60M8jNa9wTvZ2evVDt9IRmYwHo3M
Gs9WCC3g3LTHRVCQ1nxBtTTfjKHMJGaDvDbwwpbNB+EpROZhb9O7u4yJJncAmQou
5ev6qXGNm6FvNllG4HrTx47tibc8aeyCvw3PTA/pSSmp+biQ3KW9fm4AUJoxrD5L
OBRtJA3FlXPAz3rKxj5HqeFvOAEc06KJbvqbgjDVUIh1YOq5slf4X1pjUTIp9U9/
sGAP4geZ+jsIhJAGUJYRbmBXTbZ0c+l2EWog4bP7zfU+Wzsd6FySLdd87ig6us6E
CwIDAQAB
-----END PUBLIC KEY-----`;

export function encryptAesKeyWithRsa(key) {
  const publicKey = process.env.RSA_PUBLIC_KEY || FALLBACK_RSA_PUBLIC_KEY;
  if (!publicKey) {
    throw new Error("RSA_PUBLIC_KEY not configured");
  }
  const encrypted = crypto.publicEncrypt(
    {
      key: publicKey,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: "sha256",
    },
    key
  );
  return encrypted.toString("base64");
}

export function sha256(data) {
  return crypto.createHash("sha256").update(data).digest("hex");
}


