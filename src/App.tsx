import { useState } from "react";
import { Fab } from "./components/Fab";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { TransactionForm } from "./components/TransactionForm";
import { TransactionsList } from "./components/TransactionsList";

export default function App() {
  const [showForm, setShowForm] = useState<boolean | number>(false);
  return (
    <ProtectedRoute>
      {showForm !== false ? (
        <TransactionForm showForm={showForm} setShowForm={setShowForm} />
      ) : (
        <>
          <TransactionsList setShowForm={setShowForm} />
          <Fab setShowForm={setShowForm} />
        </>
      )}
    </ProtectedRoute>
  );
}
