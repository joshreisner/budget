import React, { useState } from "react";

export const LoginScreen = () => {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/.netlify/functions/auth-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
        credentials: "include", // Important for cookies
      });

      if (response.ok) {
        // Login successful - redirect to app
        window.location.reload();
      } else {
        const data = await response.json();
        setError(data.error || "Login failed");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center p-5 min-h-dvh">
      <div className="space-y-8 w-full max-w-md">
        <div className="text-center">
          <h1 className="font-bold text-4xl">💰</h1>
          <h2 className="mt-6 font-bold text-gray-900 dark:text-white text-3xl">
            Budget Tracker
          </h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400 text-sm">
            Please enter your password to continue
          </p>
        </div>
        <form className="space-y-6 mt-8" onSubmit={handleLogin}>
          <div>
            <label htmlFor="password" className="sr-only">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="block focus:z-10 relative dark:bg-gray-700 px-3 py-2 border border-gray-300 focus:border-blue-500 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-blue-500 w-full text-gray-900 dark:text-white sm:text-sm appearance-none placeholder-gray-500"
              placeholder="Enter your password"
              autoFocus
            />
          </div>

          {error && (
            <div className="text-red-500 text-sm text-center">{error}</div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative flex justify-center bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-4 py-2 border border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 w-full font-medium text-white text-sm transition-colors disabled:cursor-not-allowed"
            >
              {loading ? "Logging in…" : "Sign In"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
