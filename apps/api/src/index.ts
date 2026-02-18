import { OpenAPIHono } from "@hono/zod-openapi"
import { Scalar } from "@scalar/hono-api-reference"
import { cors } from "hono/cors"
import { getDb, type Database } from "./db"
import analyticsRoute from "./routes/analytics.route"
import authRoute from "./routes/auth.route"
import transactionRoute from "./routes/transaction.route"
import userRoute from "./routes/user.route"
import { authOpenAPISpec } from "./routes/auth.openapi.spec"
import { analyticsOpenAPISpec } from "./routes/analytics.openapi.spec"
import { userOpenAPISpec } from "./routes/user.openapi.spec"
import { transactionOpenAPISpec } from "./routes/transaction.openapi.spec"

type Variables = {
  db: Database
}

const app = new OpenAPIHono<{ Bindings: CloudflareBindings; Variables: Variables }>()

// Enable CORS for the web app
app.use("*", cors())

// Database middleware - initialize db and add to context
app.use("*", async (c, next) => {
  const db = getDb(c.env.prod_d1_fin)
  c.set("db", db)
  await next()
})

// Create API routes group
const apiRoutes = new OpenAPIHono<{
  Bindings: CloudflareBindings
  Variables: Variables
}>()
  .route("/analytics", analyticsRoute)
  .route("/auth", authRoute)
  .route("/users", userRoute)
  .route("/transactions", transactionRoute)
  .get("/", (c) => {
    return c.json({ message: "Hello from Hono API!" }, 200)
  })

// Mount API routes under /api
app.route("/api", apiRoutes)

// OpenAPI documentation endpoints (at root level, after routes are registered)
app.doc("/doc", (c) => {
  // Get the current request URL to dynamically set the server URL
  const url = new URL(c.req.url)
  const baseUrl = `${url.protocol}//${url.host}`

  return {
    openapi: "3.1.0",
    info: {
      version: "1.0.0",
      title: "Finance Tracker API",
      description:
        "A comprehensive API for managing personal finances, tracking transactions, and generating analytics",
    },
    servers: [
      {
        url: baseUrl,
        description:
          url.hostname === "localhost" ? "Development server" : "Production server",
      },
    ],
  }
})

// Custom doc endpoint with security schemes
app.get("/doc.json", (c) => {
  // Get the current request URL to dynamically set the server URL
  const url = new URL(c.req.url)
  const baseUrl = `${url.protocol}//${url.host}`

  const spec = app.getOpenAPIDocument({
    openapi: "3.1.0",
    info: {
      version: "1.0.0",
      title: "Finance Tracker API",
      description:
        "A comprehensive API for managing personal finances, tracking transactions, and generating analytics",
    },
    servers: [
      {
        url: baseUrl,
        description:
          url.hostname === "localhost" ? "Development server" : "Production server",
      },
    ],
  })

  // Add security schemes to components
  spec.components = spec.components || {}
  spec.components.securitySchemes = {
    BearerAuth: {
      type: "http",
      scheme: "bearer",
      bearerFormat: "JWT",
      description: "JWT Bearer token authentication. Format: Bearer {token}",
    },
  }

  // Add global security requirement
  spec.security = [{ BearerAuth: [] }]

  // Merge manually defined routes (regular Hono routes need manual OpenAPI specs)
  spec.paths = {
    ...spec.paths,
    ...authOpenAPISpec,
    ...analyticsOpenAPISpec,
    ...userOpenAPISpec,
    ...transactionOpenAPISpec,
  } as any

  return c.json(spec)
})

// Scalar API Reference UI
app.get(
  "/reference",
  Scalar({
    theme: "Elysia.js",
    pageTitle: "Finance Tracker API Documentation",
    spec: {
      url: "/doc.json",
    },
  } as any),
)

export default app
// Export API routes type for RPC client (excludes OpenAPI documentation routes)
export type ApiRoutes = typeof apiRoutes
