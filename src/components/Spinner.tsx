export const Spinner = () => (
  <div className="flex justify-center items-center h-screen">
    <div
      className="border-4 border-gray-500 border-t-transparent rounded-full w-12 h-12 animate-spin"
      role="status"
    >
      <span className="sr-only">Loading...</span>
    </div>
  </div>
);
