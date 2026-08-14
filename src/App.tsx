function App() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 border border-slate-100 text-center">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">
          React + Vite + TS
        </h1>
        <p className="text-slate-600 mb-6">
          Tailwind CSS, TanStack Query, Zustand, and React Hook Form are all
          configured and ready!
        </p>
        <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors shadow-sm">
          Get Started
        </button>
      </div>
    </div>
  );
}

export default App;
