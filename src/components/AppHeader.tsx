import AppLogo from './AppLogo';
import SearchBar from './SearchBar';
import UserProfile from './UserProfile';

interface AppHeaderProps {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  user: any;
  isMobile: boolean;
  onMobileMenuClick: () => void;
  isCommandHeld?: boolean;
}

const AppHeader = ({
  searchQuery,
  setSearchQuery,
  user,
  isMobile,
  onMobileMenuClick,
  isCommandHeld = false,
}: AppHeaderProps) => {
  return (
    <div className="py-4 border-b border-medium-grey flex items-center" style={{ backgroundColor: '#ffffff' }}>
      <AppLogo />
      <SearchBar value={searchQuery} onChange={setSearchQuery} />
      {/* CMD state indicator */}
      {isCommandHeld && (
        <div className="ml-4 px-3 py-1 text-xs font-medium bg-orange text-white rounded-sm transition-opacity duration-200">
          ⌘ CMD
        </div>
      )}
      {!isMobile && user && <UserProfile user={user} isMobile={false} />}
      {isMobile && (
        <button
          onClick={onMobileMenuClick}
          className="p-2 border border-medium-grey hover:bg-gray-100"
        >
          ☰
        </button>
      )}
    </div>
  );
};

export default AppHeader;
