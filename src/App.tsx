import { useState } from "react";
import { Fab } from "./components/Fab";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { TransactionForm } from "./components/TransactionForm";
import { TransactionsList } from "./components/TransactionsList";
import { useTransactions } from "./hooks/useTransactions";

export default function App() {
  const [showForm, setShowForm] = useState<boolean | number>(false);
  const { transactions, addTransaction, isAdding } = useTransactions();
  return (
    <ProtectedRoute>
      {showForm !== false ? (
        <TransactionForm
          showForm={showForm}
          setShowForm={setShowForm}
          transactions={transactions}
          onAddTransaction={addTransaction}
          isAdding={isAdding}
        />
      ) : (
        <>
          <TransactionsList
            setShowForm={setShowForm}
            transactions={transactions}
          />
          <Fab setShowForm={setShowForm} />
        </>
      )}
    </ProtectedRoute>
  );
}
