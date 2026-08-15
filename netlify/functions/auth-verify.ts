import { Handler } from "@netlify/functions";
// @ts-ignore
import { createHmac } from "crypto";

export const handler: Handler = async (event) => {
  // Get token from cookie or Authorization header
  const cookie = event.headers.cookie || "";
  const authHeader = event.headers.authorization || "";

  let token = "";

  // Try to get token from cookie
  const cookieMatch = cookie.match(/auth_token=([^;]+)/);
  if (cookieMatch) {
    token = cookieMatch[1];
  } else if (authHeader.startsWith("Bearer ")) {
    // Or from Authorization header
    token = authHeader.substring(7);
  }

  if (!token) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: "No session token provided" }),
    };
  }

  const verified = verifyToken(token);

  // Validate session
  if (!verified) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: "Invalid or expired session" }),
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      authenticated: true,
      email: "user@example.com",
    }),
  };
};

function verifyToken(token: string) {
  const [header, body, sig] = token.split(".");
  if (!header || !body || !sig) return null;

  // @ts-ignore
  const expected = createHmac("sha256", process.env.APP_PASSWORD)
    .update(`${header}.${body}`)
    .digest("base64url");

  if (expected !== sig) return null;

  // @ts-ignore
  const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));

  if (payload.exp < Date.now()) return null;

  return payload;
}
