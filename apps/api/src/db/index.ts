import { drizzle } from "drizzle-orm/d1"
import { relations } from "./relations"

export const getDb = (d1: D1Database) => {
  return drizzle(d1, { relations })
}

export type Database = ReturnType<typeof getDb>
