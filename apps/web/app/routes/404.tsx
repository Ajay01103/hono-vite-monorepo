import { useLocation } from "react-router"

export default function NotFound() {
  const location = useLocation()

  // Silently handle Chrome DevTools requests
  if (location.pathname.startsWith("/.well-known")) {
    return null
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold">404</h1>
        <p className="mt-4 text-xl">Page not found</p>
        <a
          href="/"
          className="mt-6 inline-block text-blue-600 hover:underline">
          Go back home
        </a>
      </div>
    </div>
  )
}
