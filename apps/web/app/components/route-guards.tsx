import { Navigate } from "react-router"
import { useAppSelector } from "~/store/hooks"

/**
 * Protects auth routes (sign-in, sign-up) from authenticated users
 * Redirects to home if user is already logged in
 * Note: Token expiration is handled by TokenValidator component
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAppSelector((state) => state.auth)

  if (isAuthenticated) {
    return (
      <Navigate
        to="/"
        replace
      />
    )
  }

  return <>{children}</>
}

/**
 * Protects private routes from unauthenticated users
 * Redirects to sign-in if user is not logged in
 * Note: Token expiration is handled by TokenValidator component
 */
export function PrivateGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAppSelector((state) => state.auth)

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/sign-in"
        replace
      />
    )
  }

  return <>{children}</>
}
