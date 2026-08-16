import { useCallback, useEffect, useState } from "react";

import { type Transaction } from "../types/Transaction";

export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const fetchTransactions = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/.netlify/functions/transactions", {
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch transactions");
      }

      const data = await response.json();
      const transactions = (data.transactions || []) as Transaction[];
      setTransactions(transactions.sort((a, b) => b.date - a.date));
    } catch (err) {
      setError(err instanceof Error ? err : new Error("An error occurred"));
      console.error("Error fetching transactions:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addTransaction = useCallback(async (newTransaction: Transaction) => {
    setIsAdding(true);
    setError(null);

    // Update UI immediately
    setTransactions((prev) =>
      [newTransaction, ...prev].sort((a, b) => b.date - a.date),
    );

    try {
      const response = await fetch("/.netlify/functions/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(newTransaction),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add transaction");
      }

      const addedTransaction = await response.json();

      return addedTransaction;
    } catch (err) {
      const error = err instanceof Error ? err : new Error("An error occurred");
      setError(error);
      console.error("Error adding transaction:", err);
      throw error;
    } finally {
      setIsAdding(false);
    }
  }, []);

  const updateTransaction = useCallback(
    async (
      updatedTransaction: Transaction,
      previousTransaction: Transaction,
    ) => {
      setIsAdding(true);
      setError(null);

      setTransactions((prev) =>
        prev
          .map((transaction) =>
            transaction === previousTransaction
              ? updatedTransaction
              : transaction,
          )
          .sort((a, b) => b.date - a.date),
      );

      try {
        const response = await fetch("/.netlify/functions/transactions", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            previousTransaction,
            transaction: updatedTransaction,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to update transaction");
        }

        const savedTransaction = await response.json();
        return savedTransaction;
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error("An error occurred");
        setError(error);
        console.error("Error updating transaction:", err);
        throw error;
      } finally {
        setIsAdding(false);
      }
    },
    [],
  );

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  return {
    transactions,
    isLoading,
    error,
    isAdding,
    refresh: fetchTransactions,
    addTransaction,
    updateTransaction,
  };
}
