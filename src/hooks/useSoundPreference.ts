import { useCallback, useSyncExternalStore } from 'react'
import { isSoundEnabled, setSoundEnabled, subscribeSound } from '../utils/sound'

/** The user's sound preference, shared by every settings menu instance. */
export function useSoundPreference() {
  const enabled = useSyncExternalStore(subscribeSound, isSoundEnabled, () => true)

  const toggle = useCallback(() => {
    setSoundEnabled(!isSoundEnabled())
  }, [])

  return { enabled, toggle, setEnabled: setSoundEnabled }
}
