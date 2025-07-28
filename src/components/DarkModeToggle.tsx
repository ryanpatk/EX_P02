import { useDarkMode } from '../hooks/useDarkMode'

interface DarkModeToggleProps {
  className?: string
}

const DarkModeToggle = ({ className = '' }: DarkModeToggleProps) => {
  const { isDark, toggleDarkMode } = useDarkMode()

  return (
    <button
      onClick={toggleDarkMode}
      className={`flex items-center space-x-2 px-3 py-2 text-sm font-bold transition-colors hover:bg-gray-100 ${className}`}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <span className="text-base">
        {isDark ? '☀️' : '🌙'}
      </span>
      <span>
        {isDark ? 'Light Mode' : 'Dark Mode'}
      </span>
    </button>
  )
}

export default DarkModeToggle