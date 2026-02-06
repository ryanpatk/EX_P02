import AppLogo from './AppLogo';
import UserProfile from './UserProfile';

interface AppHeaderProps {
  user: any;
  isMobile: boolean;
  onMobileMenuClick: () => void;
  isCommandHeld?: boolean;
}

const AppHeader = ({
  user,
  isMobile,
  onMobileMenuClick,
  isCommandHeld = false,
}: AppHeaderProps) => {
  return (
    <div className="app-topbar">
      <div className="flex items-center gap-3">
        <AppLogo />
        <span className="text-xs uppercase tracking-[0.2em] text-gray-500 hidden sm:inline">
          Link Library
        </span>
      </div>
      <div className="ml-auto flex items-center gap-3">
        {isCommandHeld && (
          <div className="cmd-indicator">
            ⌘
          </div>
        )}
        {!isMobile && user && <UserProfile user={user} isMobile={false} />}
        {isMobile && (
          <button
            onClick={onMobileMenuClick}
            className="app-icon-button"
          >
            ☰
          </button>
        )}
      </div>
    </div>
  );
};

export default AppHeader;
