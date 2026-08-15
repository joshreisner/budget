const transactions = [
  {
    date: "8/14/2026",
    description: "T-Mobile",
    category: "Utilities",
    amount: 56.56,
  },

  {
    date: "8/13/2026",
    description: "Safeway",
    category: "Groceries",
    amount: 15.48,
  },
  {
    date: "8/13/2026",
    description: "Whole Foods",
    category: "Groceries",
    amount: 39.61,
  },
  {
    date: "8/13/2026",
    description: "Delta",
    category: "Travel",
    amount: 833.02,
  },
  {
    date: "8/12/2026",
    description: "Drinkmate",
    category: "Groceries",
    amount: 37.0,
  },
  {
    date: "8/12/2026",
    description: "AA",
    category: "Donations",
    amount: 3.0,
  },
  {
    date: "8/11/2026",
    description: "Disney+",
    category: "Entertainment",
    amount: 17.99,
  },
];

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
};

export const TransactionsList: React.FC = () => {
  return (
    <div>
      {transactions.map((transaction, index) => (
        <div
          key={index}
          className="flex justify-between p-4 border-b border-gray-200 dark:border-gray-800 w-full"
        >
          <div>
            <div className="font-semibold">{transaction.description}</div>
            <div className="text-sm text-gray-500">
              {formatDate(transaction.date)}
            </div>
          </div>
          <div className="text-right">
            <div className="font-semibold">{transaction.amount.toFixed(2)}</div>
            <div className="text-sm text-gray-500">{transaction.category}</div>
          </div>
        </div>
      ))}
    </div>
  );
};
