import { Handler } from "@netlify/functions";
import "dotenv/config";
import { JWT } from "google-auth-library";
import { GoogleSpreadsheet } from "google-spreadsheet";
import { type Transaction } from "../../src/types/Transaction";

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

  // get transactions
  if (event.httpMethod === "GET") {
    try {
      const rows = await sheet.getRows();

      const transactions: Transaction[] = rows.map((row) => ({
        date: new Date(row.get("Date") || "").getTime(),
        description: row.get("Description") || "",
        category: row.get("Category") || "",
        amount: parseAmount(row.get("Amount")),
        notes: row.get("Notes") || "",
      }));

      transactions.sort((a, b) => b.date - a.date);

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
  }

  // add transaction
  if (event.httpMethod === "POST") {
    try {
      const newTransaction = JSON.parse(event.body || "{}");

      // Validate required fields
      if (!newTransaction.description?.trim()) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: "Description is required" }),
        };
      }

      const amount = parseAmount(newTransaction.amount);
      if (isNaN(amount) || amount <= 0) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: "Amount must be a positive number" }),
        };
      }

      if (!newTransaction.date) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: "Date is required" }),
        };
      }

      // format date as M/D/YYYY
      const dateObj = new Date(newTransaction.date);
      if (isNaN(dateObj.getTime())) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: "Invalid date format" }),
        };
      }
      const formattedDate = `${dateObj.getMonth() + 1}/${dateObj.getDate()}/${dateObj.getFullYear()}`;

      // add the new row
      await sheet.addRow({
        Date: formattedDate,
        Description: newTransaction.description.trim(),
        Category: newTransaction.category || "",
        Amount: amount,
        Notes: newTransaction.notes?.trim() || "",
      });

      // re-sort the sheet after adding the new transaction
      await sheet.sortRange(
        {
          startRowIndex: 1,
          endRowIndex: sheet.rowCount + 1,
          startColumnIndex: 0,
          endColumnIndex: 5,
        },
        [{ dimensionIndex: 0, sortOrder: "DESCENDING" }],
      );

      await sheet.loadCells();

      return {
        statusCode: 201,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: 12345,
          date: newTransaction.date,
          description: newTransaction.description.trim(),
          category: newTransaction.category || "",
          amount: amount,
          notes: newTransaction.notes?.trim() || "",
        }),
      };
    } catch (error) {
      console.error("Error adding transaction:", error);
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: "Failed to add transaction",
          details: error instanceof Error ? error.message : "Unknown error",
        }),
      };
    }
  }

  return {
    statusCode: 405,
    body: JSON.stringify({ error: "Method not allowed" }),
  };
};
