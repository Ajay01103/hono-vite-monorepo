import { hc } from "hono/client"
import type { AppType } from "@hono-mono/shared"

// Create the RPC client pointing to your API
export const client = hc<AppType>("http://127.0.0.1:8787")
