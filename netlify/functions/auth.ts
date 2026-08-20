import type { HandlerEvent } from "@netlify/functions";
import "dotenv/config";
import { createHmac, timingSafeEqual } from "node:crypto";

type AuthPayload = {
  email: string;
  exp: number;
};

function getToken(event: HandlerEvent): string | null {
  const cookie = event.headers.cookie || event.headers.Cookie || "";
  const authHeader =
    event.headers.authorization || event.headers.Authorization || "";
  const cookieMatch = cookie.match(/(?:^|;\s*)auth_token=([^;]+)/);

  if (cookieMatch) {
    return cookieMatch[1];
  }

  if (authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7).trim();
  }

  return null;
}

export function getAuthenticatedUser(event: HandlerEvent): AuthPayload | null {
  const token = getToken(event);
  const password = process.env.APP_PASSWORD;

  if (!token || !password) {
    return null;
  }

  const tokenParts = token.split(".");
  if (tokenParts.length !== 3) {
    return null;
  }

  const [header, body, signature] = tokenParts;
  const expectedSignature = createHmac("sha256", password)
    .update(`${header}.${body}`)
    .digest();
  const receivedSignature = Buffer.from(signature, "base64url");

  if (
    receivedSignature.length !== expectedSignature.length ||
    !timingSafeEqual(receivedSignature, expectedSignature)
  ) {
    return null;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(body, "base64url").toString("utf8"),
    ) as Partial<AuthPayload>;

    if (
      typeof payload.email !== "string" ||
      typeof payload.exp !== "number" ||
      payload.exp < Date.now()
    ) {
      return null;
    }

    return payload as AuthPayload;
  } catch {
    return null;
  }
}
