import { useTransactions } from "../hooks/useTransactions";
import { formatDate } from "../utils/formatDate";

export const TransactionsList = ({
  setShowForm,
}: {
  setShowForm: (show: number) => void;
}) => {
  const transactions = useTransactions();
  return (
    <div>
      {transactions.map((transaction, index) => (
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
    </div>
  );
};
