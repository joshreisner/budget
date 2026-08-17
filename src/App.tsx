import { useState } from "react";
import { Fab } from "./components/Fab";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Spinner } from "./components/Spinner";
import { TransactionForm } from "./components/TransactionForm";
import { TransactionsList } from "./components/TransactionsList";
import { useTransactions } from "./hooks/useTransactions";

export default function App() {
  const [showForm, setShowForm] = useState<boolean | number>(false);
  const {
    addTransaction,
    deleteTransaction,
    isAdding,
    isDeleting,
    isLoading,
    transactions,
    updateTransaction,
  } = useTransactions();
  return (
    <ProtectedRoute>
      {isLoading ? (
        <Spinner />
      ) : showForm !== false ? (
        <TransactionForm
          showForm={showForm}
          setShowForm={setShowForm}
          transactions={transactions}
          onAddTransaction={addTransaction}
          onUpdateTransaction={updateTransaction}
          onDeleteTransaction={deleteTransaction}
          isAdding={isAdding}
          isDeleting={isDeleting}
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
