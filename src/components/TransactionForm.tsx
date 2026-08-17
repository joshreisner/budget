import { type SubmitEvent, useState } from "react";
import { type Transaction } from "../types/Transaction";

const toDateInputValue = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const parseLocalDateValue = (value: string) => {
  const [year, month, day] = value.split("-").map(Number);

  if (!year || !month || !day) {
    return null;
  }

  return Date.UTC(year, month - 1, day, 12, 0, 0, 0);
};

export const TransactionForm = ({
  showForm,
  setShowForm,
  transactions,
  onAddTransaction,
  onUpdateTransaction,
  onDeleteTransaction,
  isAdding = false,
  isDeleting = false,
}: {
  showForm: boolean | number;
  setShowForm: (show: boolean) => void;
  transactions: Transaction[];
  onAddTransaction: (transaction: Transaction) => Promise<Transaction>;
  onUpdateTransaction?: (
    updatedTransaction: Transaction,
    previousTransaction: Transaction,
  ) => Promise<Transaction>;
  onDeleteTransaction?: (transaction: Transaction) => Promise<void>;
  isAdding?: boolean;
  isDeleting?: boolean;
}) => {
  const categories = [...new Set(transactions.map((t) => t.category))].sort();

  const transaction =
    typeof showForm === "number" ? transactions[showForm] : null;
  const isEditing = !!transaction;

  // Form state
  const [date, setDate] = useState(
    transaction
      ? toDateInputValue(new Date(transaction.date))
      : toDateInputValue(new Date()),
  );
  const [amount, setAmount] = useState(
    transaction ? transaction.amount.toString() : "",
  );
  const [description, setDescription] = useState(
    transaction ? transaction.description : "",
  );
  const [category, setCategory] = useState(
    transaction ? transaction.category : categories[0],
  );
  const [notes, setNotes] = useState(transaction ? transaction.notes : "");
  const [formError, setFormError] = useState<string | null>(null);
  const [isDeleteConfirming, setIsDeleteConfirming] = useState(false);

  const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);

    // Validate required fields
    if (!description.trim()) {
      setFormError("Description is required");
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setFormError("Please enter a valid positive amount");
      return;
    }

    if (!date) {
      setFormError("Date is required");
      return;
    }

    // Prepare transaction data
    const parsedDate = parseLocalDateValue(date);
    if (parsedDate === null) {
      setFormError("Please enter a valid date");
      return;
    }

    const nextTransaction: Transaction = {
      date: parsedDate,
      description: description.trim(),
      category,
      amount: amountNum,
      notes: notes.trim(),
    };

    try {
      if (isEditing && transaction) {
        await onUpdateTransaction?.(nextTransaction, transaction);
      } else {
        await onAddTransaction(nextTransaction);
      }

      setShowForm(false);
      setDate(toDateInputValue(new Date()));
      setAmount("");
      setDescription("");
      setCategory(categories[0]);
      setNotes("");
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Failed to save transaction",
      );
    }
  };

  const handleDelete = async () => {
    if (!isDeleteConfirming) {
      setIsDeleteConfirming(true);
      return;
    }

    if (onDeleteTransaction && transaction) {
      try {
        await onDeleteTransaction(transaction);
        setShowForm(false);
        setIsDeleteConfirming(false);
      } catch (err) {
        setFormError(
          err instanceof Error ? err.message : "Failed to delete transaction",
        );
        setIsDeleteConfirming(false);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-5">
      {formError && (
        <div className="bg-red-100 mb-4 p-2 border border-red-400 rounded text-red-700 text-sm">
          {formError}
        </div>
      )}

      <div className="mb-4">
        <label className="block mb-1 font-medium text-sm" htmlFor="date">
          Date
        </label>
        <input
          id="date"
          type="date"
          className="dark:bg-gray-700 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded w-full appearance-none"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />
      </div>

      <div className="mb-4">
        <label className="block mb-1 font-medium text-sm" htmlFor="description">
          Description
        </label>
        <input
          id="description"
          type="text"
          className="dark:bg-gray-700 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded w-full appearance-none"
          placeholder="Payee, store, etc…"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />
      </div>

      <div className="mb-4">
        <label className="block mb-1 font-medium text-sm" htmlFor="amount">
          Amount
        </label>
        <input
          id="amount"
          type="number"
          step="0.01"
          className="dark:bg-gray-700 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded w-full appearance-none"
          inputMode="decimal"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />
      </div>

      <div className="mb-4">
        <label className="block mb-1 font-medium text-sm" htmlFor="category">
          Category
        </label>
        <select
          id="category"
          className="dark:bg-gray-700 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded w-full appearance-none"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-4">
        <label className="block mb-1 font-medium text-sm" htmlFor="notes">
          Notes (optional)
        </label>
        <textarea
          id="notes"
          className="dark:bg-gray-700 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded w-full appearance-none"
          placeholder="Any additional details…"
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      <div
        className={`gap-4 grid my-7 ${isEditing ? "grid-cols-4" : "grid-cols-3"}`}
      >
        <button
          type="submit"
          disabled={isAdding}
          className="col-span-2 bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 disabled:opacity-50 px-4 py-2 rounded font-bold text-white transition-colors disabled:cursor-not-allowed"
        >
          {isAdding ? "Saving…" : isEditing ? "Update" : "Save"}
        </button>
        {isEditing && (
          <button
            type="button"
            disabled={isDeleting}
            onClick={handleDelete}
            className={
              isDeleteConfirming
                ? "bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 px-4 py-2 rounded font-bold text-white transition-colors"
                : "hover:bg-gray-100 dark:hover:bg-gray-700 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded transition-colors"
            }
          >
            {isDeleting
              ? "Deleting…"
              : isDeleteConfirming
                ? "Are you sure?"
                : "Delete"}
          </button>
        )}
        <button
          type="button"
          className="hover:bg-gray-100 dark:hover:bg-gray-700 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded transition-colors"
          onClick={() => {
            setShowForm(false);
            setIsDeleteConfirming(false);
          }}
        >
          Cancel
        </button>
      </div>
    </form>
  );
};
