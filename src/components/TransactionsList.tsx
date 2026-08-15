import { useState } from "react";
import { type Transaction } from "../hooks/useTransactions";
import { formatDate } from "../utils/formatDate";

const ROW_LIMIT = 10;

export const TransactionsList = ({
  setShowForm,
  transactions,
}: {
  setShowForm: (show: number) => void;
  transactions: Transaction[];
}) => {
  const [limit, setLimit] = useState(ROW_LIMIT);
  return (
    <>
      {transactions.slice(0, limit).map((transaction, index) => (
        <button
          key={index}
          className="flex justify-between p-4 border-gray-200 dark:border-gray-800 border-b w-full"
          onClick={() => setShowForm(index)}
        >
          <div className="text-left">
            <div className="font-semibold">{transaction.description}</div>
            <div className="text-gray-500 text-sm">
              {formatDate(transaction.date)}
            </div>
          </div>
          <div className="text-right">
            <div className="font-semibold">{transaction.amount.toFixed(2)}</div>
            <div className="text-gray-500 text-sm">{transaction.category}</div>
          </div>
        </button>
      ))}
      {limit < transactions.length && (
        <div className="flex justify-center p-6">
          <button
            onClick={() => setLimit(limit + ROW_LIMIT)}
            className="block bg-blue-400 dark:bg-blue-600 px-4 py-2 rounded w-full text-white"
          >
            Load More
          </button>
        </div>
      )}
    </>
  );
};
