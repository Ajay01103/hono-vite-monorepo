import { defineConfig } from "drizzle-kit"

export default defineConfig({
  dialect: "sqlite",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: ".wrangler/state/v3/d1/miniflare-D1DatabaseObject/8eddf59c11e5943f6a3415b4690a4f971bce17c41f1ecc264656060d21fd2354.sqlite",
  },
})
