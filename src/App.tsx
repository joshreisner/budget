import { useState } from "react";
import { EditForm } from "./components/EditForm";
import { Fab } from "./components/Fab";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { TransactionsList } from "./components/TransactionsList";

function App() {
  const [showEditForm, setShowEditForm] = useState(false);
  return (
    <ProtectedRoute>
      {showEditForm ? (
        <EditForm setShowEditForm={setShowEditForm} />
      ) : (
        <>
          <TransactionsList />
          <Fab setShowEditForm={setShowEditForm} />
        </>
      )}
    </ProtectedRoute>
  );
}

export default App;
