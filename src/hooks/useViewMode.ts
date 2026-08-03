import { useCallback, useState } from 'react'

export type ViewMode = 'list' | 'grid'

const storageKey = (moduleKey: string) => `memex.view.${moduleKey}`

/** Per-module list/grid preference, persisted to localStorage. */
export function useViewMode(moduleKey: string): [ViewMode, (mode: ViewMode) => void] {
  const [mode, setModeState] = useState<ViewMode>(() => {
    try {
      return window.localStorage.getItem(storageKey(moduleKey)) === 'grid'
        ? 'grid'
        : 'list'
    } catch {
      return 'list'
    }
  })

  const setMode = useCallback(
    (next: ViewMode) => {
      setModeState(next)
      try {
        window.localStorage.setItem(storageKey(moduleKey), next)
      } catch {
        /* storage unavailable — skip */
      }
    },
    [moduleKey],
  )

  return [mode, setMode]
}
