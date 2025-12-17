interface NewProjectButtonProps {
  onClick: () => void;
  disabled: boolean;
}

const NewProjectButton = ({ onClick, disabled }: NewProjectButtonProps) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="absolute bottom-10 left-1/2 transform -translate-x-1/2 flex items-center justify-center gap-2 px-4 py-2 text-black border border-medium-grey bg-white hover:bg-white transition-all duration-300 text-sm font-medium rounded-sm disabled:opacity-50 disabled:cursor-not-allowed z-10 whitespace-nowrap cursor-pointer"
      style={{
        width: '80%',
      }}
    >
      Create Group
    </button>
  );
};

export default NewProjectButton;
