import { useDarkMode } from '../hooks/useDarkMode'

interface DarkModeToggleProps {
  className?: string
}

const DarkModeToggle = ({ className = '' }: DarkModeToggleProps) => {
  const { isDark, toggleDarkMode } = useDarkMode()

  return (
    <button
      onClick={toggleDarkMode}
      className={`theme-toggle ${className}`.trim()}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <span className="theme-toggle-icon" aria-hidden="true">
        {isDark ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="12" cy="12" r="4.5" />
            <path d="M12 2.5v3" />
            <path d="M12 18.5v3" />
            <path d="M4.93 4.93l2.12 2.12" />
            <path d="M16.95 16.95l2.12 2.12" />
            <path d="M2.5 12h3" />
            <path d="M18.5 12h3" />
            <path d="M4.93 19.07l2.12-2.12" />
            <path d="M16.95 7.05l2.12-2.12" />
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8Z" />
          </svg>
        )}
      </span>
      <span className="theme-toggle-label">
        {isDark ? 'Light Mode' : 'Dark Mode'}
      </span>
    </button>
  )
}

export default DarkModeToggle
