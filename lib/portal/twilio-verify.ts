import crypto from "node:crypto";

interface TwilioVerifyResponse {
  status?: string;
}

function credentials() {
  const username = process.env.TWILIO_API_KEY ?? process.env.TWILIO_ACCOUNT_SID;
  const password = process.env.TWILIO_API_SECRET ?? process.env.TWILIO_AUTH_TOKEN;
  const serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID;
  return username && password && serviceSid ? { username, password, serviceSid } : null;
}

function authorizationHeader(username: string, password: string) {
  return `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`;
}

async function verifyRequest(path: "Verifications" | "VerificationCheck", body: URLSearchParams) {
  const config = credentials();
  if (!config) throw new Error("SMS verification is not configured.");

  const response = await fetch(
    `https://verify.twilio.com/v2/Services/${encodeURIComponent(config.serviceSid)}/${path}`,
    {
      method: "POST",
      headers: {
        Authorization: authorizationHeader(config.username, config.password),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
      cache: "no-store",
      signal: AbortSignal.timeout(12_000),
    },
  );

  if (!response.ok) {
    const requestId = response.headers.get("twilio-request-id") ?? crypto.randomBytes(5).toString("hex");
    console.error("Twilio Verify request failed", { path, status: response.status, requestId });
    throw new Error("The verification service is temporarily unavailable.");
  }

  return await response.json() as TwilioVerifyResponse;
}

export function hasTwilioVerify() {
  return credentials() !== null;
}

export function developmentPortalCode() {
  if (process.env.NODE_ENV === "production") return null;
  return process.env.PORTAL_DEV_OTP ?? "246810";
}

export async function startPhoneVerification(phone: string) {
  return verifyRequest("Verifications", new URLSearchParams({ To: phone, Channel: "sms" }));
}

export async function checkPhoneVerification(phone: string, code: string) {
  const result = await verifyRequest("VerificationCheck", new URLSearchParams({ To: phone, Code: code }));
  return result.status === "approved";
}
