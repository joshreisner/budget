import { type SubmitEvent, useState } from "react";
import { type Transaction } from "../types/Transaction";

export const TransactionForm = ({
  showForm,
  setShowForm,
  transactions,
  onAddTransaction,
  isAdding = false,
}: {
  showForm: boolean | number;
  setShowForm: (show: boolean) => void;
  transactions: Transaction[];
  onAddTransaction: (transaction: Transaction) => Promise<Transaction>;
  isAdding?: boolean;
}) => {
  const categories = [...new Set(transactions.map((t) => t.category))].sort();

  const transaction =
    typeof showForm === "number" ? transactions[showForm] : null;
  const isEditing = !!transaction;

  // Form state
  const [date, setDate] = useState(
    transaction
      ? new Date(transaction.date).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0],
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
    const newTransaction: Transaction = {
      date: new Date(date).getTime(),
      description: description.trim(),
      category,
      amount: amountNum,
      notes: notes.trim(),
    };

    try {
      await onAddTransaction(newTransaction);
      setShowForm(false);
      setDate(new Date().toISOString().split("T")[0]);
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

  return (
    <form onSubmit={handleSubmit} className="p-6">
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

      <div className="gap-4 grid grid-cols-3 my-8">
        <button
          type="submit"
          disabled={isAdding}
          className="col-span-2 bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 disabled:opacity-50 px-4 py-2 rounded font-bold text-white transition-colors disabled:cursor-not-allowed"
        >
          {isAdding ? "Saving…" : isEditing ? "Update" : "Save"}
        </button>
        <button
          type="button"
          className="hover:bg-gray-100 dark:hover:bg-gray-700 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded transition-colors"
          onClick={() => setShowForm(false)}
        >
          Cancel
        </button>
      </div>
    </form>
  );
};
