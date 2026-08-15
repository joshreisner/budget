import { Handler } from "@netlify/functions";
// @ts-ignore
import { createHmac } from "crypto";

// @ts-ignore
const devMode = process.env.NODE_ENV === "development";

// Simple in-memory session store (production: use Redis or a database)
// For a single user, this is acceptable, but consider using a more persistent store
const sessions: Record<string, { email: string; expires: number }> = {};

export const handler: Handler = async (event) => {
  // Only accept POST requests
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    const { password } = JSON.parse(event.body || "{}");

    // @ts-ignore
    if (!password || password !== process.env.APP_PASSWORD) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: "Invalid credentials" }),
      };
    }

    const payload = {
      email: "user@example.com",
      exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
    };

    // @ts-ignore
    const header = Buffer.from(
      JSON.stringify({ alg: "HS256", typ: "JWT" }),
    ).toString("base64url");

    // @ts-ignore
    const body = Buffer.from(JSON.stringify(payload)).toString("base64url");

    // @ts-ignore
    const signature = createHmac("sha256", process.env.APP_PASSWORD)
      .update(`${header}.${body}`)
      .digest("base64url");

    const token = `${header}.${body}.${signature}`;

    return {
      statusCode: 200,
      headers: {
        "Set-Cookie": `auth_token=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${60 * 60 * 24 * 7}${!devMode ? "; Secure" : ""}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ success: true }),
    };
  } catch (error) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Invalid request" }),
    };
  }
};

// Export the sessions map for use in other functions
export { sessions };
