import { Hono } from "hono"
import type { Database } from "../db"
import { zValidator } from "@hono/zod-validator"
import z from "zod"
import {
  PaymentMethodEnum,
  RecurringIntervalEnum,
  TransactionTypeEnum,
  transactions,
} from "../db/schema"
import { verifyJwtToken } from "../utils/jwt"
import { calculateNextOccurrence } from "../utils/helpers"
import { and, desc, eq, or, like, sql, inArray } from "drizzle-orm"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { v2 as cloudinary } from "cloudinary"
import { Env } from "../config/env.confg"

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
  .put(
    "/update/:id",
    zValidator(
      "param",
      z.object({
        id: z.string().min(1, "Transaction ID is required"),
      }),
    ),
    zValidator(
      "json",
      z.object({
        title: z.string().min(1, "Title is required").optional(),
        description: z.string().optional(),
        type: z
          .enum([TransactionTypeEnum.INCOME, TransactionTypeEnum.EXPENSE], {
            message: "Transaction type must either INCOME or EXPENSE",
          })
          .optional(),
        amount: z.number().positive("Amount must be positive").min(1).optional(),
        category: z.string().min(1, "Category is required").optional(),
        isRecurring: z.boolean().optional(),
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
          .optional(),
        date: z.coerce.date().optional(),
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
        const body = c.req.valid("json")
        const db = c.get("db")

        // Find existing transaction
        const [existingTransaction] = await db
          .select()
          .from(transactions)
          .where(and(eq(transactions.id, transactionId), eq(transactions.userId, userId)))
          .limit(1)

        if (!existingTransaction) {
          return c.json(
            {
              error: "Transaction not found",
              message: "Transaction not found or you don't have permission to access it",
            },
            404,
          )
        }

        const now = new Date()
        const isRecurring = body.isRecurring ?? existingTransaction.isRecurring

        const date =
          body.date !== undefined ? new Date(body.date) : existingTransaction.date

        const recurringInterval =
          body.recurringInterval !== undefined
            ? body.recurringInterval
            : existingTransaction.recurringInterval

        let nextRecurringDate: Date | null = null

        if (isRecurring && recurringInterval) {
          const calculatedDate = calculateNextOccurrence(date, recurringInterval)

          nextRecurringDate =
            calculatedDate < now
              ? calculateNextOccurrence(now, recurringInterval)
              : calculatedDate
        }

        // Update transaction
        const [updatedTransaction] = await db
          .update(transactions)
          .set({
            ...(body.title !== undefined && { title: body.title }),
            ...(body.description !== undefined && { description: body.description }),
            ...(body.category !== undefined && { category: body.category }),
            ...(body.type !== undefined && { type: body.type }),
            ...(body.paymentMethod !== undefined && {
              paymentMethod: body.paymentMethod,
            }),
            ...(body.amount !== undefined && {
              amount: Math.round(Number(body.amount) * 100),
            }), // Convert to cents
            ...(body.receiptUrl !== undefined && { receiptUrl: body.receiptUrl }),
            date,
            isRecurring,
            recurringInterval,
            nextRecurringDate,
            updatedAt: now,
          })
          .where(and(eq(transactions.id, transactionId), eq(transactions.userId, userId)))
          .returning()

        return c.json({
          message: "Transaction updated successfully",
          transaction: updatedTransaction,
        })
      } catch (error: any) {
        console.error("Update transaction error:", error)
        return c.json(
          {
            error: "Failed to update transaction",
            message: error.message || "Unknown error",
          },
          500,
        )
      }
    },
  )
  .delete(
    "/delete/:id",
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

        // Check if transaction exists and belongs to user
        const [existingTransaction] = await db
          .select()
          .from(transactions)
          .where(and(eq(transactions.id, transactionId), eq(transactions.userId, userId)))
          .limit(1)

        if (!existingTransaction) {
          return c.json(
            {
              error: "Transaction not found",
              message: "Transaction not found or you don't have permission to delete it",
            },
            404,
          )
        }

        // Delete the transaction
        await db
          .delete(transactions)
          .where(and(eq(transactions.id, transactionId), eq(transactions.userId, userId)))

        return c.json(
          {
            message: "Transaction deleted successfully",
          },
          200,
        )
      } catch (error: any) {
        console.error("Delete transaction error:", error)
        return c.json(
          {
            error: "Failed to delete transaction",
            message: error.message || "Unknown error",
          },
          500,
        )
      }
    },
  )
  .post(
    "/delete/bulk",
    zValidator(
      "json",
      z.object({
        transactionIds: z
          .array(z.string().min(1, "Transaction ID is required"))
          .min(1, "At least one transaction ID is required"),
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
        const { transactionIds } = c.req.valid("json")
        const db = c.get("db")

        // Check if any transactions exist and belong to user
        const existingTransactions = await db
          .select()
          .from(transactions)
          .where(
            and(
              inArray(transactions.id, transactionIds),
              eq(transactions.userId, userId),
            ),
          )

        if (existingTransactions.length === 0) {
          return c.json(
            {
              error: "No transactions found",
              message:
                "No transactions found or you don't have permission to delete them",
            },
            404,
          )
        }

        // Delete the transactions
        await db
          .delete(transactions)
          .where(
            and(
              inArray(transactions.id, transactionIds),
              eq(transactions.userId, userId),
            ),
          )

        return c.json(
          {
            success: true,
            message: "Transactions deleted successfully",
            deletedCount: existingTransactions.length,
          },
          200,
        )
      } catch (error: any) {
        console.error("Bulk delete transactions error:", error)
        return c.json(
          {
            error: "Failed to delete transactions",
            message: error.message || "Unknown error",
          },
          500,
        )
      }
    },
  )
  .post(
    "/bulk-transaction",
    zValidator(
      "json",
      z.object({
        transactions: z
          .array(
            z.object({
              title: z.string().min(1, "Title is required"),
              description: z.string().optional(),
              type: z.enum([TransactionTypeEnum.INCOME, TransactionTypeEnum.EXPENSE], {
                message: "Transaction type must either INCOME or EXPENSE",
              }),
              amount: z.number().positive("Amount must be positive").min(1),
              category: z.string().min(1, "Category is required"),
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
          )
          .min(1, "At least one transaction is required"),
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
        const { transactions: transactionsData } = c.req.valid("json")
        const db = c.get("db")

        // Map transactions to database format
        const bulkTransactions = transactionsData.map((tx) => ({
          userId,
          type: tx.type,
          title: tx.title,
          amount: Math.round(Number(tx.amount) * 100), // Convert to cents
          category: tx.category,
          description: tx.description || null,
          receiptUrl: tx.receiptUrl || null,
          date: tx.date,
          isRecurring: false,
          recurringInterval: null,
          nextRecurringDate: null,
          lastProcessed: null,
          paymentMethod: tx.paymentMethod,
          status: "COMPLETED" as const,
        }))

        // Bulk insert transactions
        const result = await db.insert(transactions).values(bulkTransactions).returning()

        return c.json(
          {
            success: true,
            message: "Bulk transactions inserted successfully",
            insertedCount: result.length,
            transactions: result,
          },
          201,
        )
      } catch (error: any) {
        console.error("Bulk transaction creation error:", error)
        return c.json(
          {
            error: "Failed to create bulk transactions",
            message: error.message || "Unknown error",
          },
          500,
        )
      }
    },
  )
  .post("/scan-receipt", async (c) => {
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

      // Get file from form data
      const formData = await c.req.formData()
      const receiptFile = formData.get("receipt") as File | null

      if (!receiptFile || receiptFile.size === 0) {
        return c.json({ error: "No file uploaded" }, 400)
      }

      // Validate file type
      const validTypes = ["image/jpeg", "image/jpg", "image/png"]
      if (!validTypes.includes(receiptFile.type)) {
        return c.json(
          { error: "Invalid file type. Only JPG, JPEG, and PNG are allowed" },
          400,
        )
      }

      // Validate file size (2MB max)
      if (receiptFile.size > 2 * 1024 * 1024) {
        return c.json({ error: "File size must be less than 2MB" }, 400)
      }

      // Configure Cloudinary
      cloudinary.config({
        cloud_name: Env.CLOUDINARY_CLOUD_NAME,
        api_key: Env.CLOUDINARY_API_KEY,
        api_secret: Env.CLOUDINARY_API_SECRET,
      })

      // Convert file to buffer
      const arrayBuffer = await receiptFile.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      // Upload to Cloudinary
      const uploadResult = await new Promise<{ secure_url: string }>(
        (resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: "receipts",
              resource_type: "image",
              quality: "auto:good",
            },
            (error, result) => {
              if (error) reject(error)
              else resolve(result as { secure_url: string })
            },
          )
          uploadStream.end(buffer)
        },
      )

      // Convert buffer to base64 for AI processing
      const base64String = buffer.toString("base64")

      // Initialize Google Generative AI
      const genAI = new GoogleGenerativeAI(Env.GEMINI_API_KEY)
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

      // Prompt for receipt scanning
      const receiptPrompt = `Analyze this receipt image and extract the following information in JSON format:
      {
        "title": "merchant or store name",
        "amount": "total amount as a number",
        "date": "date in ISO format (YYYY-MM-DD)",
        "description": "brief description of the transaction",
        "category": "category (e.g., Food, Shopping, Transport, etc.)",
        "paymentMethod": "payment method if visible (CASH, CARD, MOBILE_PAYMENT, etc.)",
        "type": "EXPENSE or INCOME"
      }
      
      Rules:
      - If information is not clearly visible, omit that field or use reasonable defaults
      - Amount must be a positive number
      - Date must be in YYYY-MM-DD format
      - Type should almost always be EXPENSE for receipts
      - Return only valid JSON, no additional text`

      // Generate content with AI
      const result = await model.generateContent([
        receiptPrompt,
        {
          inlineData: {
            data: base64String,
            mimeType: receiptFile.type,
          },
        },
      ])

      const response = await result.response
      const text = response.text()

      // Clean up the response (remove markdown code blocks if present)
      const cleanedText = text.replace(/```(?:json)?\n?/g, "").trim()

      if (!cleanedText) {
        return c.json({ error: "Could not read receipt content" }, 400)
      }

      // Parse JSON response
      const data = JSON.parse(cleanedText)

      // Validate required fields
      if (!data.amount || !data.date) {
        return c.json(
          { error: "Receipt missing required information (amount or date)" },
          400,
        )
      }

      // Return extracted data
      return c.json(
        {
          message: "Receipt scanned successfully",
          data: {
            title: data.title || "Receipt",
            amount: data.amount,
            date: data.date,
            description: data.description || "",
            category: data.category || "Uncategorized",
            paymentMethod: data.paymentMethod || PaymentMethodEnum.CASH,
            type: data.type || TransactionTypeEnum.EXPENSE,
            receiptUrl: uploadResult.secure_url,
          },
        },
        200,
      )
    } catch (error: any) {
      console.error("Receipt scanning error:", error)
      return c.json(
        {
          error: "Receipt scanning service unavailable",
          message: error.message || "Unknown error",
        },
        500,
      )
    }
  })

export default app
