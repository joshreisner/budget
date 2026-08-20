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

function stripLeadingQuoteChars(value: string): string {
  return value.trim().replace(/^['"]+/, "");
}

function parseLocalDateValue(value: string | number | Date): Date {
  if (value instanceof Date) {
    return new Date(
      Date.UTC(
        value.getUTCFullYear(),
        value.getUTCMonth(),
        value.getUTCDate(),
        12,
      ),
    );
  }

  if (typeof value === "number") {
    return new Date(value);
  }

  const trimmedValue = stripLeadingQuoteChars(value);

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmedValue)) {
    const [year, month, day] = trimmedValue.split("-").map(Number);
    return new Date(Date.UTC(year, month - 1, day, 12));
  }

  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(trimmedValue)) {
    const [month, day, year] = trimmedValue.split("/").map(Number);
    return new Date(Date.UTC(year, month - 1, day, 12));
  }

  const parsedDate = new Date(trimmedValue);
  if (isNaN(parsedDate.getTime())) {
    return new Date(NaN);
  }

  return new Date(
    Date.UTC(
      parsedDate.getUTCFullYear(),
      parsedDate.getUTCMonth(),
      parsedDate.getUTCDate(),
      12,
    ),
  );
}

function formatSheetDate(value: Date): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
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

      const transactions: Transaction[] = rows
        .map((row) => ({
          date: parseLocalDateValue(row.get("Date") || "").getTime(),
          description: row.get("Description") || "",
          category: row.get("Category") || "",
          amount: parseAmount(row.get("Amount")),
          notes: row.get("Notes") || "",
        }))
        .sort((a, b) => b.date - a.date);

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

  // update transaction
  if (event.httpMethod === "PUT") {
    try {
      const payload = JSON.parse(event.body || "{}");
      const previousTransaction = payload.previousTransaction as
        | Transaction
        | undefined;
      const updatedTransaction =
        (payload.transaction as Transaction) || payload;

      if (!updatedTransaction.description?.trim()) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: "Description is required" }),
        };
      }

      const amount = parseAmount(updatedTransaction.amount);
      if (isNaN(amount) || amount <= 0) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: "Amount must be a positive number" }),
        };
      }

      if (!updatedTransaction.date) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: "Date is required" }),
        };
      }

      const dateObj = parseLocalDateValue(updatedTransaction.date);
      if (isNaN(dateObj.getTime())) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: "Invalid date format" }),
        };
      }

      const rows = await sheet.getRows();
      const targetRow = rows.find((row) => {
        const rowDate = parseLocalDateValue(row.get("Date") || "").getTime();
        const rowDescription = (row.get("Description") || "").trim();
        const rowCategory = (row.get("Category") || "").trim();
        const rowAmount = parseAmount(row.get("Amount"));
        const rowNotes = (row.get("Notes") || "").trim();

        if (previousTransaction) {
          return (
            rowDate === previousTransaction.date &&
            rowDescription === previousTransaction.description &&
            rowCategory === previousTransaction.category &&
            rowAmount === previousTransaction.amount &&
            rowNotes === previousTransaction.notes
          );
        }

        return (
          rowDate === updatedTransaction.date &&
          rowDescription === updatedTransaction.description &&
          rowCategory === updatedTransaction.category &&
          rowAmount === updatedTransaction.amount &&
          rowNotes === updatedTransaction.notes
        );
      });

      if (!targetRow) {
        return {
          statusCode: 404,
          body: JSON.stringify({ error: "Transaction not found" }),
        };
      }

      const formattedDate = formatSheetDate(dateObj);
      targetRow.set("Date", formattedDate);
      targetRow.set("Description", updatedTransaction.description.trim());
      targetRow.set("Category", updatedTransaction.category || "");
      targetRow.set("Amount", amount);
      targetRow.set("Notes", updatedTransaction.notes?.trim() || "");
      await targetRow.save();

      await sheet.loadCells();
      await sheet.sortRange(
        {
          startRowIndex: 1,
          endRowIndex: Math.max(sheet.rowCount, 2),
          startColumnIndex: 0,
          endColumnIndex: 5,
        },
        [{ dimensionIndex: 0, sortOrder: "DESCENDING" }],
      );

      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...updatedTransaction,
          amount,
        }),
      };
    } catch (error) {
      console.error("Error updating transaction:", error);
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: "Failed to update transaction",
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

      // format date
      const dateObj = parseLocalDateValue(newTransaction.date);
      if (isNaN(dateObj.getTime())) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: "Invalid date format" }),
        };
      }
      const formattedDate = formatSheetDate(dateObj);

      // add the row, then move it below the header so it will sort at the top of its day
      const newRow = await sheet.addRow({
        Date: formattedDate,
        Description: newTransaction.description.trim(),
        Category: newTransaction.category || "",
        Amount: amount,
        Notes: newTransaction.notes?.trim() || "",
      });
      await sheet.moveDimension(
        "ROWS",
        { startIndex: newRow.rowNumber - 1, endIndex: newRow.rowNumber },
        1,
      );

      await sheet.sortRange(
        {
          startRowIndex: 1,
          endRowIndex: Math.max(sheet.rowCount, 2),
          startColumnIndex: 0,
          endColumnIndex: 5,
        },
        [{ dimensionIndex: 0, sortOrder: "DESCENDING" }],
      );

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

  // delete transaction
  if (event.httpMethod === "DELETE") {
    try {
      const transactionToDelete = JSON.parse(event.body || "{}") as Transaction;

      if (!transactionToDelete.description?.trim()) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: "Invalid transaction to delete" }),
        };
      }

      const rows = await sheet.getRows();
      const targetRow = rows.find((row) => {
        const rowDate = parseLocalDateValue(row.get("Date") || "").getTime();
        const rowDescription = (row.get("Description") || "").trim();
        const rowCategory = (row.get("Category") || "").trim();
        const rowAmount = parseAmount(row.get("Amount"));
        const rowNotes = (row.get("Notes") || "").trim();

        return (
          rowDate === transactionToDelete.date &&
          rowDescription === transactionToDelete.description &&
          rowCategory === transactionToDelete.category &&
          rowAmount === transactionToDelete.amount &&
          rowNotes === transactionToDelete.notes
        );
      });

      if (!targetRow) {
        return {
          statusCode: 404,
          body: JSON.stringify({ error: "Transaction not found" }),
        };
      }

      await targetRow.delete();

      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "Transaction deleted successfully" }),
      };
    } catch (error) {
      console.error("Error deleting transaction:", error);
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: "Failed to delete transaction",
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
