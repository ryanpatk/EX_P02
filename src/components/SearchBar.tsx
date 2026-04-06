interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
}

const SearchBar = ({
  value,
  onChange,
  label = 'SEARCH ALL:',
  placeholder = 'Search all bookmarks...',
}: SearchBarProps) => {
  return (
    <div className="bookmark-searchbar">
      <label className="bookmark-searchbar-label" htmlFor="bookmark-search-input">
        {label}
      </label>
      <input
        id="bookmark-search-input"
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="bookmark-searchbar-input"
        autoComplete="off"
        spellCheck={false}
      />
    </div>
  );
};

export default SearchBar;
