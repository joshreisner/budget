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

  const trimmedValue = value.trim();

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
  return `'${year}-${month}-${day}`;
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

      // format date as M/D/YYYY
      const dateObj = parseLocalDateValue(newTransaction.date);
      if (isNaN(dateObj.getTime())) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: "Invalid date format" }),
        };
      }
      const formattedDate = formatSheetDate(dateObj);

      // add the new row to the top of the sheet
      await sheet.insertDimension(
        "ROWS",
        { startIndex: 1, endIndex: 2 },
        false,
      );

      await sheet.loadCells({
        startRowIndex: 1,
        endRowIndex: 2,
        startColumnIndex: 0,
        endColumnIndex: 5,
      });

      const newRowData = [
        formattedDate,
        newTransaction.description.trim(),
        newTransaction.category || "",
        amount,
        newTransaction.notes?.trim() || "",
      ];

      newRowData.forEach((value, columnIndex) => {
        const cell = sheet.getCell(1, columnIndex);
        cell.value = value;
      });

      await sheet.saveUpdatedCells();

      const rows = await sheet.getRows();
      const sortedRows = [...rows].sort((left, right) => {
        const leftDate = parseLocalDateValue(left.get("Date") || "").getTime();
        const rightDate = parseLocalDateValue(
          right.get("Date") || "",
        ).getTime();
        return rightDate - leftDate;
      });

      const headerRow = ["Date", "Description", "Category", "Amount", "Notes"];
      const dataRows = sortedRows.map((row) => {
        const date = parseLocalDateValue(row.get("Date") || "");
        return [
          formatSheetDate(date),
          row.get("Description") || "",
          row.get("Category") || "",
          parseAmount(row.get("Amount")),
          row.get("Notes") || "",
        ];
      });

      const rowCount = Math.max(sheet.rowCount, dataRows.length + 1);
      await sheet.loadCells({
        startRowIndex: 0,
        endRowIndex: rowCount,
        startColumnIndex: 0,
        endColumnIndex: 5,
      });

      for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
        for (let columnIndex = 0; columnIndex < 5; columnIndex++) {
          const cell = sheet.getCell(rowIndex, columnIndex);

          if (rowIndex === 0) {
            cell.value = headerRow[columnIndex];
            continue;
          }

          const rowData = dataRows[rowIndex - 1];
          cell.value = rowData?.[columnIndex] ?? "";
        }
      }

      await sheet.saveUpdatedCells();

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
