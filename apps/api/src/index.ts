import { Hono } from "hono"
import { cors } from "hono/cors"
import authRoute from "./routes/auth.route"
import userRoute from "./routes/user.route"
import { getDb, type Database } from "./db"

type Variables = {
  db: Database
}

const app = new Hono<{ Bindings: CloudflareBindings; Variables: Variables }>()

// Enable CORS for the web app
app.use("*", cors())

// Database middleware - initialize db and add to context
app.use("*", async (c, next) => {
  const db = getDb(c.env.prod_d1_fin)
  c.set("db", db)
  await next()
})

const routes = app
  .basePath("/api")
  .route("/auth", authRoute)
  .route("/users", userRoute)
  .get("/", (c) => {
    return c.json({ message: "Hello from Hono API!" }, 200)
  })
  .get("/hello", (c) => {
    return c.json({ hello: "Hello NIgga" }, 200)
  })

export default app
export type AppType = typeof routes
