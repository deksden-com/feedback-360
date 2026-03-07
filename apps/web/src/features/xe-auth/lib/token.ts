import { createHmac, timingSafeEqual } from "node:crypto";

const tokenVersion = "xe1";
const defaultTtlSeconds = 60 * 30;

export type XeLoginTokenPayload = {
  runId: string;
  actor: string;
  userId: string;
  companyId: string;
  exp: number;
};

const toBase64Url = (value: string): string => {
  return Buffer.from(value, "utf8").toString("base64url");
};

const fromBase64Url = (value: string): string => {
  return Buffer.from(value, "base64url").toString("utf8");
};

const getXeLoginTokenSecret = (): string => {
  const secret = process.env.XE_AUTH_SECRET ?? process.env.AI_WEBHOOK_SECRET;
  if (!secret || secret.trim().length === 0) {
    throw new Error("XE auth secret is not configured.");
  }
  return `${secret.trim()}:xe-auth-token`;
};

const sign = (payloadPart: string, secret: string): string => {
  return createHmac("sha256", secret).update(payloadPart).digest("base64url");
};

export const issueXeLoginToken = (input: {
  runId: string;
  actor: string;
  userId: string;
  companyId: string;
  ttlSeconds?: number;
}): string => {
  const exp = Math.floor(Date.now() / 1000) + (input.ttlSeconds ?? defaultTtlSeconds);
  const payload = {
    runId: input.runId,
    actor: input.actor,
    userId: input.userId,
    companyId: input.companyId,
    exp,
  } satisfies XeLoginTokenPayload;

  const payloadPart = toBase64Url(JSON.stringify(payload));
  const secret = getXeLoginTokenSecret();
  const signature = sign(payloadPart, secret);
  return `${tokenVersion}.${payloadPart}.${signature}`;
};

export const verifyXeLoginToken = (token: string): XeLoginTokenPayload => {
  const [version, payloadPart, signature] = token.split(".");
  if (version !== tokenVersion || !payloadPart || !signature) {
    throw new Error("XE auth token format is invalid.");
  }

  const secret = getXeLoginTokenSecret();
  const expected = sign(payloadPart, secret);
  const actualBuffer = Buffer.from(signature, "base64url");
  const expectedBuffer = Buffer.from(expected, "base64url");
  if (
    actualBuffer.byteLength !== expectedBuffer.byteLength ||
    !timingSafeEqual(actualBuffer, expectedBuffer)
  ) {
    throw new Error("XE auth token signature is invalid.");
  }

  const payload = JSON.parse(fromBase64Url(payloadPart)) as Partial<XeLoginTokenPayload>;
  if (
    typeof payload.runId !== "string" ||
    typeof payload.actor !== "string" ||
    typeof payload.userId !== "string" ||
    typeof payload.companyId !== "string" ||
    typeof payload.exp !== "number"
  ) {
    throw new Error("XE auth token payload is invalid.");
  }

  if (payload.exp < Math.floor(Date.now() / 1000)) {
    throw new Error("XE auth token has expired.");
  }

  return payload as XeLoginTokenPayload;
};
