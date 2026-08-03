import { useCallback, useEffect, useRef, useState } from 'react'
import type { FeedbackToastPhase } from '../components/ui'

const TOAST_VISIBLE_MS = 3400

interface ToastState {
  message: string
  phase: FeedbackToastPhase
}

/**
 * Timing/phase state machine for the bottom-right FeedbackToast:
 * flash() shows optimistically, auto-exits after a beat, and the
 * animation-end handler finalizes removal (instant under reduced motion).
 */
export function useFeedbackToast() {
  const [toast, setToast] = useState<ToastState | null>(null)
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const flash = useCallback((message: string) => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current)
    }

    setToast({ message, phase: 'entering' })

    hideTimerRef.current = setTimeout(() => {
      setToast((current) => (current ? { ...current, phase: 'exiting' } : null))
      hideTimerRef.current = null

      window.setTimeout(() => {
        setToast((current) => (current?.phase === 'exiting' ? null : current))
      }, 240)
    }, TOAST_VISIBLE_MS)
  }, [])

  const handleAnimationEnd = useCallback(
    (event: React.AnimationEvent<HTMLDivElement>) => {
      if (event.currentTarget !== event.target) return
      if (event.animationName !== 'bookmark-bulk-feedback-out') return
      setToast((current) => (current?.phase === 'exiting' ? null : current))
    },
    [],
  )

  useEffect(() => {
    return () => {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current)
      }
    }
  }, [])

  return { toast, flash, handleAnimationEnd }
}
