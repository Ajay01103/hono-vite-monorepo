import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core"
import { sql } from "drizzle-orm"

// Enums
export const TransactionStatusEnum = {
  PENDING: "PENDING",
  COMPLETED: "COMPLETED",
  FAILED: "FAILED",
} as const

export const RecurringIntervalEnum = {
  DAILY: "DAILY",
  WEEKLY: "WEEKLY",
  MONTHLY: "MONTHLY",
  YEARLY: "YEARLY",
} as const

export const TransactionTypeEnum = {
  INCOME: "INCOME",
  EXPENSE: "EXPENSE",
} as const

export const PaymentMethodEnum = {
  CARD: "CARD",
  BANK_TRANSFER: "BANK_TRANSFER",
  MOBILE_PAYMENT: "MOBILE_PAYMENT",
  AUTO_DEBIT: "AUTO_DEBIT",
  CASH: "CASH",
  OTHER: "OTHER",
} as const

export const ReportStatusEnum = {
  SENT: "SENT",
  PENDING: "PENDING",
  FAILED: "FAILED",
  NO_ACTIVITY: "NO_ACTIVITY",
} as const

export const ReportFrequencyEnum = {
  MONTHLY: "MONTHLY",
} as const

// Users Table
export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  profilePicture: text("profile_picture"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
})

// Transactions Table
export const transactions = sqliteTable("transactions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: text("type", { enum: ["INCOME", "EXPENSE"] }).notNull(),
  title: text("title").notNull(),
  amount: integer("amount").notNull(), // stored in cents
  category: text("category").notNull(),
  receiptUrl: text("receipt_url"),
  description: text("description"),
  date: integer("date", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  isRecurring: integer("is_recurring", { mode: "boolean" }).notNull().default(false),
  recurringInterval: text("recurring_interval", {
    enum: ["DAILY", "WEEKLY", "MONTHLY", "YEARLY"],
  }),
  nextRecurringDate: integer("next_recurring_date", { mode: "timestamp" }),
  lastProcessed: integer("last_processed", { mode: "timestamp" }),
  status: text("status", { enum: ["PENDING", "COMPLETED", "FAILED"] })
    .notNull()
    .default("COMPLETED"),
  paymentMethod: text("payment_method", {
    enum: ["CARD", "BANK_TRANSFER", "MOBILE_PAYMENT", "AUTO_DEBIT", "CASH", "OTHER"],
  })
    .notNull()
    .default("CASH"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
})

// Reports Table
export const reports = sqliteTable("reports", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  period: text("period").notNull(),
  sentDate: integer("sent_date", { mode: "timestamp" }).notNull(),
  status: text("status", { enum: ["SENT", "PENDING", "FAILED", "NO_ACTIVITY"] })
    .notNull()
    .default("PENDING"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
})

// Report Settings Table
export const reportSettings = sqliteTable("report_settings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  frequency: text("frequency", { enum: ["MONTHLY"] })
    .notNull()
    .default("MONTHLY"),
  isEnabled: integer("is_enabled", { mode: "boolean" }).notNull().default(false),
  nextReportDate: integer("next_report_date", { mode: "timestamp" }),
  lastSentDate: integer("last_sent_date", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
})

// Type exports
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert

export type Transaction = typeof transactions.$inferSelect
export type NewTransaction = typeof transactions.$inferInsert

export type Report = typeof reports.$inferSelect
export type NewReport = typeof reports.$inferInsert

export type ReportSetting = typeof reportSettings.$inferSelect
export type NewReportSetting = typeof reportSettings.$inferInsert
