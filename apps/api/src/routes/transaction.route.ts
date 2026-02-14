import { Hono } from "hono"
import type { Database } from "../db"
import { zValidator } from "@hono/zod-validator"
import z from "zod/v4"
import {
  PaymentMethodEnum,
  RecurringIntervalEnum,
  TransactionTypeEnum,
  transactions,
} from "../db/schema"
import { verifyJwtToken } from "../utils/jwt"
import { calculateNextOccurrence } from "../utils/helpers"
import { and, desc, eq, or, like, sql } from "drizzle-orm"

type Variables = {
  db: Database
}

const app = new Hono<{ Bindings: CloudflareBindings; Variables: Variables }>()
  .post(
    "/create",
    zValidator(
      "json",
      z.object({
        title: z.string().min(1, "Title is required"),
        description: z.string().optional(),
        type: z.enum([TransactionTypeEnum.INCOME, TransactionTypeEnum.EXPENSE], {
          message: "Transaction type must either INCOME or EXPENSE",
        }),
        amount: z.number().positive("Amount must be postive").min(1),
        category: z.string().min(1, "Category is required"),
        isRecurring: z.boolean().default(false),
        recurringInterval: z
          .enum([
            RecurringIntervalEnum.DAILY,
            RecurringIntervalEnum.WEEKLY,
            RecurringIntervalEnum.MONTHLY,
            RecurringIntervalEnum.YEARLY,
          ])
          .nullable()
          .optional(),
        receiptUrl: z.string().optional(),
        paymentMethod: z
          .enum([
            PaymentMethodEnum.CARD,
            PaymentMethodEnum.BANK_TRANSFER,
            PaymentMethodEnum.MOBILE_PAYMENT,
            PaymentMethodEnum.AUTO_DEBIT,
            PaymentMethodEnum.CASH,
            PaymentMethodEnum.OTHER,
          ])
          .default(PaymentMethodEnum.CASH),
        date: z.coerce.date().default(() => new Date()),
      }),
    ),
    async (c) => {
      try {
        const body = c.req.valid("json")
        const authHeader = c.req.header("Authorization")

        // Verify authentication
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          return c.json({ error: "Unauthorized" }, 401)
        }

        const token = authHeader.substring(7)
        const payload = verifyJwtToken(token)

        if (!payload) {
          return c.json({ error: "Invalid or expired token" }, 401)
        }

        const userId = payload.userId
        const db = c.get("db")

        // Calculate next recurring date if applicable
        let nextRecurringDate: Date | undefined
        const currentDate = new Date()

        if (body.isRecurring && body.recurringInterval) {
          const calculatedDate = calculateNextOccurrence(
            body.date,
            body.recurringInterval,
          )

          nextRecurringDate =
            calculatedDate < currentDate
              ? calculateNextOccurrence(currentDate, body.recurringInterval)
              : calculatedDate
        }

        // Create transaction
        const [transaction] = await db
          .insert(transactions)
          .values({
            userId,
            type: body.type,
            title: body.title,
            amount: Math.round(Number(body.amount) * 100), // Convert to cents
            category: body.category,
            description: body.description || null,
            receiptUrl: body.receiptUrl || null,
            date: body.date,
            isRecurring: body.isRecurring || false,
            recurringInterval: body.recurringInterval || null,
            nextRecurringDate: nextRecurringDate || null,
            lastProcessed: null,
            paymentMethod: body.paymentMethod,
          })
          .returning()

        return c.json(
          {
            message: "Transaction created successfully",
            transaction,
          },
          201,
        )
      } catch (error: any) {
        console.error("Transaction creation error:", error)
        return c.json(
          {
            error: "Failed to create transaction",
            message: error.message || "Unknown error",
          },
          500,
        )
      }
    },
  )
  .get("/all", async (c) => {
    try {
      const authHeader = c.req.header("Authorization")

      // Verify authentication
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return c.json({ error: "Unauthorized" }, 401)
      }

      const token = authHeader.substring(7)
      const payload = verifyJwtToken(token)

      if (!payload) {
        return c.json({ error: "Invalid or expired token" }, 401)
      }

      const userId = payload.userId
      const db = c.get("db")

      // Extract query parameters
      const keyword = c.req.query("keyword")
      const type = c.req.query("type") as keyof typeof TransactionTypeEnum | undefined
      const recurringStatus = c.req.query("recurringStatus") as
        | "RECURRING"
        | "NON_RECURRING"
        | undefined
      const pageSize = parseInt(c.req.query("pageSize") || "20")
      const pageNumber = parseInt(c.req.query("pageNumber") || "1")

      // Build filter conditions
      const filterConditions = []

      // User filter (always required)
      filterConditions.push(eq(transactions.userId, userId))

      // Keyword search (title OR category)
      if (keyword) {
        filterConditions.push(
          or(
            like(transactions.title, `%${keyword}%`),
            like(transactions.category, `%${keyword}%`),
          )!,
        )
      }

      // Type filter
      if (
        type &&
        (type === TransactionTypeEnum.INCOME || type === TransactionTypeEnum.EXPENSE)
      ) {
        filterConditions.push(eq(transactions.type, type))
      }

      // Recurring status filter
      if (recurringStatus === "RECURRING") {
        filterConditions.push(eq(transactions.isRecurring, true))
      } else if (recurringStatus === "NON_RECURRING") {
        filterConditions.push(eq(transactions.isRecurring, false))
      }

      // Calculate pagination
      const skip = (pageNumber - 1) * pageSize

      // Execute queries in parallel
      const [transactionsList, countResult] = await Promise.all([
        db
          .select()
          .from(transactions)
          .where(and(...filterConditions))
          .orderBy(desc(transactions.createdAt))
          .limit(pageSize)
          .offset(skip),
        db
          .select({ count: sql<number>`count(*)` })
          .from(transactions)
          .where(and(...filterConditions)),
      ])

      const totalCount = Number(countResult[0]?.count || 0)
      const totalPages = Math.ceil(totalCount / pageSize)

      return c.json({
        message: "Transactions fetched successfully",
        transactions: transactionsList,
        pagination: {
          pageSize,
          pageNumber,
          totalCount,
          totalPages,
          skip,
        },
      })
    } catch (error: any) {
      console.error("Get transactions error:", error)
      return c.json(
        {
          error: "Failed to fetch transactions",
          message: error.message || "Unknown error",
        },
        500,
      )
    }
  })
  .get(
    "/:id",
    zValidator(
      "param",
      z.object({
        id: z.string().min(1, "Transaction ID is required"),
      }),
    ),
    async (c) => {
      try {
        const authHeader = c.req.header("Authorization")

        // Verify authentication
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          return c.json({ error: "Unauthorized" }, 401)
        }

        const token = authHeader.substring(7)
        const payload = verifyJwtToken(token)

        if (!payload) {
          return c.json({ error: "Invalid or expired token" }, 401)
        }

        const userId = payload.userId
        const { id: transactionId } = c.req.valid("param")
        const db = c.get("db")

        // Fetch transaction by id and userId
        const [transaction] = await db
          .select()
          .from(transactions)
          .where(and(eq(transactions.id, transactionId), eq(transactions.userId, userId)))
          .limit(1)

        if (!transaction) {
          return c.json(
            {
              error: "Transaction not found",
              message: "Transaction not found or you don't have permission to access it",
            },
            404,
          )
        }

        return c.json({
          message: "Transaction fetched successfully",
          transaction,
        })
      } catch (error: any) {
        console.error("Get transaction by ID error:", error)
        return c.json(
          {
            error: "Failed to fetch transaction",
            message: error.message || "Unknown error",
          },
          500,
        )
      }
    },
  )
  .put(
    "/duplicate/:id",
    zValidator(
      "param",
      z.object({
        id: z.string().min(1, "Transaction ID is required"),
      }),
    ),
    async (c) => {
      try {
        const authHeader = c.req.header("Authorization")

        // Verify authentication
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          return c.json({ error: "Unauthorized" }, 401)
        }

        const token = authHeader.substring(7)
        const payload = verifyJwtToken(token)

        if (!payload) {
          return c.json({ error: "Invalid or expired token" }, 401)
        }

        const userId = payload.userId
        const { id: transactionId } = c.req.valid("param")
        const db = c.get("db")

        // Find the original transaction
        const [transaction] = await db
          .select()
          .from(transactions)
          .where(and(eq(transactions.id, transactionId), eq(transactions.userId, userId)))
          .limit(1)

        if (!transaction) {
          return c.json(
            {
              error: "Transaction not found",
              message: "Transaction not found or you don't have permission to access it",
            },
            404,
          )
        }

        // Create duplicate transaction
        const [duplicated] = await db
          .insert(transactions)
          .values({
            userId: transaction.userId,
            type: transaction.type,
            title: `Duplicate - ${transaction.title}`,
            amount: transaction.amount,
            category: transaction.category,
            description: transaction.description
              ? `${transaction.description} (Duplicate)`
              : "Duplicated transaction",
            receiptUrl: transaction.receiptUrl,
            date: transaction.date,
            paymentMethod: transaction.paymentMethod,
            isRecurring: false,
            recurringInterval: null,
            nextRecurringDate: null,
            lastProcessed: null,
          })
          .returning()

        return c.json(
          {
            message: "Transaction duplicated successfully",
            transaction: duplicated,
          },
          200,
        )
      } catch (error: any) {
        console.error("Duplicate transaction error:", error)
        return c.json(
          {
            error: "Failed to duplicate transaction",
            message: error.message || "Unknown error",
          },
          500,
        )
      }
    },
  )

export default app
