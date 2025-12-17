interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

const SearchBar = ({ value, onChange }: SearchBarProps) => {
  return (
    <div className="flex items-center space-x-4 flex-1 px-6 ml-2">
      <input
        type="text"
        placeholder="Search..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input-field flex-1"
        style={{ backgroundColor: '#ffffff' }}
      />
    </div>
  );
};

export default SearchBar;

