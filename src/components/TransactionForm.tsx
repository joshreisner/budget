import { useTransactions } from "../hooks/useTransactions";

const categories = ["Groceries", "Travel", "Donations", "Entertainment"];

export const TransactionForm = ({
  showForm,
  setShowForm,
}: {
  showForm: boolean | number;
  setShowForm: (show: boolean) => void;
}) => {
  const transactions = useTransactions();
  const transaction =
    typeof showForm === "number" ? transactions[showForm] : null;
  return (
    <form className="p-6">
      <div className="mb-4">
        <label className="block mb-1 text-sm" htmlFor="date">
          Date
        </label>
        <input
          id="date"
          type="date"
          className="shadow px-3 py-2 border border-gray-500 rounded focus:shadow-outline focus:outline-none w-full appearance-none"
          defaultValue={
            transaction
              ? new Date(transaction.date).toISOString().split("T")[0]
              : new Date().toISOString().split("T")[0]
          }
          required
        />
      </div>
      <div className="mb-4">
        <label className="block mb-1 text-sm" htmlFor="amount">
          Amount
        </label>
        <input
          id="amount"
          type="number"
          step="0.01"
          className="shadow px-3 py-2 border border-gray-500 rounded focus:shadow-outline focus:outline-none w-full appearance-none"
          inputMode="decimal"
          defaultValue={transaction ? transaction.amount.toString() : ""}
          required
        />
      </div>
      <div className="mb-4">
        <label className="block mb-1 text-sm" htmlFor="description">
          Description
        </label>
        <input
          id="description"
          type="text"
          className="shadow px-3 py-2 border border-gray-500 rounded focus:shadow-outline focus:outline-none w-full appearance-none"
          defaultValue={transaction ? transaction.description : ""}
        />
      </div>
      <div className="mb-4">
        <label className="block mb-1 text-sm" htmlFor="category">
          Category
        </label>
        <select
          id="category"
          className="shadow px-3 py-2 border border-gray-500 rounded focus:shadow-outline focus:outline-none w-full appearance-none"
          defaultValue={transaction ? transaction.category : ""}
        >
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>
      <div className="gap-4 grid grid-cols-3 my-8">
        <button
          type="submit"
          className="col-span-2 bg-blue-400 dark:bg-blue-600 px-4 py-2 rounded font-bold"
        >
          Save
        </button>
        <button
          type="submit"
          className="px-4 py-2 border border-gray-500 rounded"
          onClick={() => setShowForm(false)}
        >
          Cancel
        </button>
      </div>
    </form>
  );
};
