import type { RootState } from "~/store/store"

/**
 * Checks if the current token is valid (not expired)
 */
export const isTokenValid = (state: RootState): boolean => {
  const { expiresAt, isAuthenticated } = state.auth

  if (!isAuthenticated || !expiresAt) {
    return false
  }

  const currentTime = Date.now()
  return currentTime < expiresAt
}

/**
 * Gets the time remaining before token expiration in milliseconds
 */
export const getTokenExpirationTime = (state: RootState): number | null => {
  const { expiresAt, isAuthenticated } = state.auth

  if (!isAuthenticated || !expiresAt) {
    return null
  }

  const currentTime = Date.now()
  return Math.max(0, expiresAt - currentTime)
}

/**
 * Checks if the token will expire soon (within the next 5 minutes)
 */
export const isTokenExpiringSoon = (state: RootState): boolean => {
  const timeRemaining = getTokenExpirationTime(state)

  if (timeRemaining === null) {
    return false
  }

  const FIVE_MINUTES = 5 * 60 * 1000
  return timeRemaining < FIVE_MINUTES
}
