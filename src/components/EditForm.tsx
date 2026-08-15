const categories = ["Groceries", "Travel", "Donations", "Entertainment"];

export const EditForm = ({
  setShowEditForm,
}: {
  setShowEditForm: (show: boolean) => void;
}) => {
  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Edit Transaction</h2>
      <form>
        <div className="mb-4">
          <label className="block text-sm font-bold mb-1">Date</label>
          <input
            type="date"
            className="shadow appearance-none border rounded w-full py-2 px-3 focus:outline-none focus:shadow-outline"
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-bold mb-1">Amount</label>
          <input
            type="number"
            step="0.01"
            className="shadow appearance-none border rounded w-full py-2 px-3 focus:outline-none focus:shadow-outline"
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-bold mb-1">Description</label>
          <input
            type="text"
            className="shadow appearance-none border rounded w-full py-2 px-3 focus:outline-none focus:shadow-outline"
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-bold mb-1">Category</label>
          <select className="shadow appearance-none border rounded w-full py-2 px-3 focus:outline-none focus:shadow-outline">
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="bg-blue-500 mt-4 hover:bg-blue-700 text-white w-full font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        >
          Save
        </button>
        <button
          type="submit"
          className="border border-gray-600 text-white w-full font-bold mt-6 py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          onClick={() => setShowEditForm(false)}
        >
          Cancel
        </button>
      </form>
    </div>
  );
};
