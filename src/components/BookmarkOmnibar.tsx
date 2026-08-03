import Omnibar from './ui/Omnibar';
import { isUrlLike } from '../utils/urlInput';

interface BookmarkOmnibarProps {
  value: string;
  onChange: (value: string) => void;
  showAdd: boolean;
  onAdd: () => void | Promise<void>;
  addPending?: boolean;
  placeholder?: string;
  trailing?: React.ReactNode;
}

/** Links-module omnibar: generic Omnibar with URL-gated bookmark capture. */
const BookmarkOmnibar = ({
  value,
  onChange,
  showAdd,
  onAdd,
  addPending = false,
  placeholder = 'Search bookmarks or paste a URL…',
  trailing,
}: BookmarkOmnibarProps) => (
  <Omnibar
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    ariaLabel="Search bookmarks or paste a URL"
    trailing={trailing}
    action={{
      label: 'Add bookmark',
      pendingLabel: 'Adding…',
      show: showAdd,
      disabled: !isUrlLike(value),
      pending: addPending,
      onRun: onAdd,
    }}
  />
);

export default BookmarkOmnibar;
