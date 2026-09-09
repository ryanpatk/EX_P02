import { useSoundPreference } from '../hooks/useSoundPreference'
import { cue } from '../utils/sound'
import { SoundOffIcon, SoundOnIcon } from './icons'

interface SoundToggleProps {
  className?: string
}

/** Settings-menu switch for interaction sounds. Same anatomy as DarkModeToggle. */
const SoundToggle = ({ className = '' }: SoundToggleProps) => {
  const { enabled, toggle } = useSoundPreference()

  const handleClick = () => {
    toggle()
    // Confirm the new state audibly only when turning sound on
    if (!enabled) cue('toggle')
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`theme-toggle ${className}`.trim()}
      title={enabled ? 'Mute interaction sounds' : 'Unmute interaction sounds'}
      aria-pressed={enabled}
    >
      <span className="theme-toggle-icon" aria-hidden="true">
        {enabled ? <SoundOnIcon width={14} height={14} /> : <SoundOffIcon width={14} height={14} />}
      </span>
      <span className="theme-toggle-label">{enabled ? 'Sound On' : 'Sound Off'}</span>
    </button>
  )
}

export default SoundToggle
