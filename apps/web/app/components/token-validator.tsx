import { useEffect, useRef } from "react"
import { useAppDispatch, useAppSelector } from "~/store/hooks"
import { logout } from "~/store/slices/authSlice"
import { toast } from "sonner"

/**
 * Efficiently validates the authentication token
 * - Checks on mount and when tab becomes visible
 * - Sets a precise timeout for expiration instead of polling
 * - More performant and production-ready
 */
export function TokenValidator({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch()
  const { expiresAt, isAuthenticated } = useAppSelector((state) => state.auth)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Function to handle token expiration
    const handleExpiration = () => {
      dispatch(logout())
      toast.error("Session expired. Please login again.")
    }

    // Function to check if token is expired and schedule timeout
    const checkAndScheduleExpiration = () => {
      if (!isAuthenticated || !expiresAt) {
        // Clear any existing timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
          timeoutRef.current = null
        }
        return
      }

      const currentTime = Date.now()
      const timeUntilExpiration = expiresAt - currentTime

      // If already expired, logout immediately
      if (timeUntilExpiration <= 0) {
        handleExpiration()
        return
      }

      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      // Set timeout for exact expiration time
      // If expiration is more than 24 hours away, check again in 23 hours (setTimeout max safe value consideration)
      const MAX_TIMEOUT = 23 * 60 * 60 * 1000 // 23 hours
      const timeoutDuration = Math.min(timeUntilExpiration, MAX_TIMEOUT)

      timeoutRef.current = setTimeout(() => {
        if (timeUntilExpiration <= MAX_TIMEOUT) {
          handleExpiration()
        } else {
          // If we hit the max timeout, reschedule
          checkAndScheduleExpiration()
        }
      }, timeoutDuration)
    }

    // Check on mount and when auth state changes
    checkAndScheduleExpiration()

    // Check when tab becomes visible (user returns to the tab)
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        checkAndScheduleExpiration()
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [dispatch, expiresAt, isAuthenticated])

  return <>{children}</>
}
