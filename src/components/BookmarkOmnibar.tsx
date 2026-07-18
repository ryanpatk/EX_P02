import { isUrlLike } from '../utils/urlInput';

interface BookmarkOmnibarProps {
  value: string;
  onChange: (value: string) => void;
  showAdd: boolean;
  onAdd: () => void | Promise<void>;
  addPending?: boolean;
  placeholder?: string;
}

const BookmarkOmnibar = ({
  value,
  onChange,
  showAdd,
  onAdd,
  addPending = false,
  placeholder = 'Search bookmarks or paste a URL…',
}: BookmarkOmnibarProps) => {
  const canSubmitAdd = showAdd && isUrlLike(value);

  const runAdd = () => {
    if (!canSubmitAdd || addPending) return;
    void onAdd();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter') return;
    if (canSubmitAdd) {
      event.preventDefault();
      runAdd();
    }
  };

  const renderOmnibar = () => (
    <div className="bookmark-omnibar">
      <div
        className={`bookmark-omnibar-row${showAdd ? ' bookmark-omnibar-row--with-add' : ''}`}
      >
        <input
          id="bookmark-omnibar-input"
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="bookmark-omnibar-input"
          autoComplete="off"
          spellCheck={false}
          aria-label="Search bookmarks or paste a URL"
        />
        {showAdd && (
          <button
            type="button"
            className="bookmark-omnibar-add"
            onClick={runAdd}
            disabled={!isUrlLike(value) || addPending}
          >
            {addPending ? 'Adding…' : 'Add bookmark'}
          </button>
        )}
      </div>
    </div>
  );

  return renderOmnibar();
};

export default BookmarkOmnibar;
