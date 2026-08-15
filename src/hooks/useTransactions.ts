import { useCallback, useEffect, useState } from "react";

export interface Transaction {
  id: string;
  date: string;
  description: string;
  category: string;
  amount: number;
  notes: string;
}

export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchTransactions = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/.netlify/functions/transactions", {
        credentials: "include", // Send cookies if auth is set up
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch transactions");
      }

      const data = await response.json();
      setTransactions(data.transactions || []);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("An error occurred"));
      console.error("Error fetching transactions:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, []);

  return {
    transactions,
    isLoading,
    error,
    refresh: fetchTransactions,
  };
}
