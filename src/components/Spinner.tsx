export const Spinner = () => (
  <div className="flex justify-center items-center min-h-dvh">
    <div
      className="border-6 border-gray-300 dark:border-gray-700 border-t-gray-900 dark:border-t-gray-200 rounded-full w-14 h-14 animate-spin"
      role="status"
    >
      <span className="sr-only">Loading...</span>
    </div>
  </div>
);
