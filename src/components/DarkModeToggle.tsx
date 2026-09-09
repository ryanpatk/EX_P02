import { useDarkMode } from '../hooks/useDarkMode'
import { MoonIcon, SunIcon } from './icons'

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
        {isDark ? <SunIcon width={14} height={14} /> : <MoonIcon width={14} height={14} />}
      </span>
      <span className="theme-toggle-label">
        {isDark ? 'Light Mode' : 'Dark Mode'}
      </span>
    </button>
  )
}

export default DarkModeToggle
