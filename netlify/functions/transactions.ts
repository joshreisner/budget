import { Handler } from "@netlify/functions";
import "dotenv/config";
import { JWT } from "google-auth-library";
import { GoogleSpreadsheet } from "google-spreadsheet";

interface Transaction {
  id: string;
  date: string;
  description: string;
  category: string;
  amount: number;
  notes: string;
}

function parseAmount(value: any): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const cleaned = value.replace(/[$,]/g, "").trim();
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

export const handler: Handler = async (event) => {
  // Only allow GET requests
  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    const sheetId = process.env.GOOGLE_SHEET_ID;
    const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY;

    if (!sheetId || !serviceAccountEmail || !privateKey) {
      console.error("Missing environment variables");
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Server configuration error" }),
      };
    }

    const serviceAccountAuth = new JWT({
      email: serviceAccountEmail,
      key: privateKey,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const doc = new GoogleSpreadsheet(sheetId, serviceAccountAuth);

    await doc.loadInfo();

    const sheet = doc.sheetsByIndex[0];
    if (!sheet) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "Sheet not found" }),
      };
    }

    const rows = await sheet.getRows();

    const transactions: Transaction[] = rows.map((row, index) => ({
      id: String(index + 1), // Use row number as ID
      date: row.get("Date") || "",
      description: row.get("Description") || "",
      category: row.get("Category") || "",
      amount: parseAmount(row.get("Amount")),
      notes: row.get("Notes") || "",
    }));

    transactions.sort((a, b) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        transactions,
        total: transactions.length,
      }),
    };
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Failed to fetch transactions",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
    };
  }
};
