export const Fab = ({
  setShowEditForm,
}: {
  setShowEditForm: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  return (
    <button
      className="fixed bottom-6 right-6 p-0 w-16 h-16 flex items-center justify-center bg-blue-600 rounded-full hover:bg-blue-700 cursor-pointer shadow"
      onClick={() => setShowEditForm(true)}
    >
      <svg viewBox="0 0 20 20" className="w-8 h-8" fill="white">
        <path d="M16,10c0,0.553-0.048,1-0.601,1H11v4.399C11,15.951,10.553,16,10,16c-0.553,0-1-0.049-1-0.601V11H4.601 C4.049,11,4,10.553,4,10c0-0.553,0.049-1,0.601-1H9V4.601C9,4.048,9.447,4,10,4c0.553,0,1,0.048,1,0.601V9h4.399 C15.952,9,16,9.447,16,10z"></path>
      </svg>
    </button>
  );
};
