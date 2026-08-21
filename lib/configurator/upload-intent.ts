import crypto from "node:crypto";

export interface ConfiguratorUploadIntent {
  nonce: string;
  token: string;
  expiresAt: number;
}

interface UploadIntentPayload {
  nonce: string;
  exp: number;
}

function uploadSecret(): string {
  const secret = process.env.CONFIGURATOR_UPLOAD_SECRET ?? process.env.AUTH_SECRET;
  if (secret) return secret;
  if (process.env.NODE_ENV !== "production") return "fine-line-local-configurator-only";
  throw new Error("CONFIGURATOR_UPLOAD_SECRET or AUTH_SECRET must be configured");
}

function signature(encodedPayload: string): string {
  return crypto.createHmac("sha256", uploadSecret()).update(encodedPayload).digest("base64url");
}

export function createConfiguratorUploadIntent(validForMs = 4 * 60 * 60 * 1000): ConfiguratorUploadIntent {
  const payload: UploadIntentPayload = {
    nonce: crypto.randomBytes(18).toString("base64url"),
    exp: Date.now() + validForMs,
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return { nonce: payload.nonce, expiresAt: payload.exp, token: `${encoded}.${signature(encoded)}` };
}

export function verifyConfiguratorUploadIntent(token: string): UploadIntentPayload | null {
  const [encoded, suppliedSignature] = token.split(".");
  if (!encoded || !suppliedSignature) return null;
  const expectedSignature = signature(encoded);
  if (suppliedSignature.length !== expectedSignature.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(suppliedSignature), Buffer.from(expectedSignature))) return null;

  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as UploadIntentPayload;
    if (!payload.nonce || !Number.isFinite(payload.exp) || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}
