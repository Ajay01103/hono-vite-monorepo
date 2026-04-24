import { hc } from "hono/client"
import type { ApiRoutes } from "@hono-mono/shared"
import { store } from "../store/store"

// Custom fetch function that includes the JWT token from Redux store
const fetchWithAuth: typeof fetch = async (input, init = {}) => {
  const state = store.getState()
  const token = state.auth.accessToken

  // Clone headers or create new ones
  const headers = new Headers(init.headers)

  // Add Authorization header if token exists
  if (token) {
    headers.set("Authorization", `Bearer ${token}`)
  }

  // Make the request with updated headers
  return fetch(input, {
    ...init,
    headers,
  })
}

// Create the RPC client pointing to your API with authentication
// Server-side handles token validation - no client-side proxy needed
export const client = hc<ApiRoutes>("http://127.0.0.1:8787/api", {
  fetch: fetchWithAuth,
})
