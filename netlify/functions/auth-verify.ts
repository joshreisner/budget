import { Handler } from "@netlify/functions";
import { getAuthenticatedUser } from "./auth";

export const handler: Handler = async (event) => {
  const verified = getAuthenticatedUser(event);

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
