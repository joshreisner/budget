import { useEffect, useRef, useState } from "react";
import { type Transaction } from "../types/Transaction";
import { formatDate } from "../utils/formatDate";

export const TransactionsList = ({
  setShowForm,
  transactions,
}: {
  setShowForm: (show: number) => void;
  transactions: Transaction[];
}) => {
  const [limit, setLimit] = useState(10);
  const loaderRef = useRef<HTMLDivElement>(null);

  // show more transactions as the user scrolls
  useEffect(() => {
    if (!loaderRef.current || !transactions.length) return;

    const observer = new IntersectionObserver(
      ([{ isIntersecting }]) => {
        if (isIntersecting && limit < transactions.length) {
          setLimit((prev) => prev + 10);
        }
      },
      { rootMargin: "250px 0px" },
    );

    observer.observe(loaderRef.current);

    return () => observer.disconnect();
  }, [transactions.length]);

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
      <div ref={loaderRef} />
    </>
  );
};
