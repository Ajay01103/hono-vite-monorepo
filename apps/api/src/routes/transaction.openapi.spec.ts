/**
 * OpenAPI specification for Transaction routes
 * This is manually defined because transaction routes use regular Hono (not OpenAPIHono) for RPC compatibility
 */

export const transactionOpenAPISpec = {
  "/api/transactions/create": {
    post: {
      tags: ["Transactions"],
      summary: "Create a new transaction",
      description:
        "Create a new transaction (income or expense) with optional receipt and recurring settings. Automatically calculates next recurring date for recurring transactions.",
      security: [{ BearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["title", "type", "amount", "category"],
              properties: {
                title: {
                  type: "string",
                  minLength: 1,
                  description: "Transaction title",
                  example: "Monthly Salary",
                },
                description: {
                  type: "string",
                  description: "Optional transaction description",
                  example: "February 2026 salary payment",
                },
                type: {
                  type: "string",
                  enum: ["INCOME", "EXPENSE"],
                  description: "Transaction type",
                  example: "INCOME",
                },
                amount: {
                  type: "number",
                  minimum: 1,
                  description: "Transaction amount (must be positive)",
                  example: 5000,
                },
                category: {
                  type: "string",
                  minLength: 1,
                  description: "Transaction category",
                  example: "Salary",
                },
                isRecurring: {
                  type: "boolean",
                  default: false,
                  description: "Whether this transaction recurs",
                  example: true,
                },
                recurringInterval: {
                  type: "string",
                  enum: ["DAILY", "WEEKLY", "MONTHLY", "YEARLY"],
                  nullable: true,
                  description: "Interval for recurring transactions",
                  example: "MONTHLY",
                },
                receiptUrl: {
                  type: "string",
                  description: "URL to receipt image (e.g., from Cloudinary)",
                  example:
                    "https://res.cloudinary.com/demo/image/upload/v1234567890/receipt.jpg",
                },
                paymentMethod: {
                  type: "string",
                  enum: [
                    "CARD",
                    "BANK_TRANSFER",
                    "MOBILE_PAYMENT",
                    "AUTO_DEBIT",
                    "CASH",
                    "OTHER",
                  ],
                  default: "CASH",
                  description: "Payment method used",
                  example: "BANK_TRANSFER",
                },
                date: {
                  type: "string",
                  format: "date-time",
                  description: "Transaction date (defaults to current date)",
                  example: "2026-02-17T10:00:00Z",
                },
              },
            },
          },
        },
      },
      responses: {
        "201": {
          description: "Transaction created successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  message: {
                    type: "string",
                    example: "Transaction created successfully",
                  },
                  transaction: {
                    type: "object",
                    properties: {
                      id: { type: "string", example: "clz2def456ghi789jkl012mno" },
                      userId: { type: "string", example: "clz1abc123def456ghi789jkl" },
                      title: { type: "string", example: "Monthly Salary" },
                      description: {
                        type: ["string", "null"],
                        example: "February 2026 salary payment",
                      },
                      type: { type: "string", enum: ["INCOME", "EXPENSE"] },
                      amount: {
                        type: "number",
                        description: "Amount in cents",
                        example: 500000,
                      },
                      category: { type: "string", example: "Salary" },
                      paymentMethod: { type: "string", example: "BANK_TRANSFER" },
                      isRecurring: { type: "boolean", example: true },
                      recurringInterval: {
                        type: ["string", "null"],
                        example: "MONTHLY",
                      },
                      nextRecurringDate: {
                        type: ["string", "null"],
                        format: "date-time",
                      },
                      receiptUrl: { type: ["string", "null"] },
                      date: { type: "string", format: "date-time" },
                      createdAt: { type: "string", format: "date-time" },
                      updatedAt: { type: "string", format: "date-time" },
                    },
                  },
                },
              },
            },
          },
        },
        "401": {
          description: "Unauthorized - Invalid or missing authentication token",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  error: { type: "string", example: "Unauthorized" },
                },
              },
            },
          },
        },
        "500": {
          description: "Internal server error",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  error: { type: "string", example: "Failed to create transaction" },
                  message: { type: "string", example: "Database connection error" },
                },
              },
            },
          },
        },
      },
    },
  },
  "/api/transactions/all": {
    get: {
      tags: ["Transactions"],
      summary: "Get all transactions with filters",
      description:
        "Retrieve all transactions for the authenticated user with optional filters (keyword, type, recurring status) and pagination support.",
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          name: "keyword",
          in: "query",
          description: "Search keyword for title or category",
          schema: { type: "string" },
          example: "grocery",
        },
        {
          name: "type",
          in: "query",
          description: "Filter by transaction type",
          schema: { type: "string", enum: ["INCOME", "EXPENSE"] },
          example: "EXPENSE",
        },
        {
          name: "recurringStatus",
          in: "query",
          description: "Filter by recurring status",
          schema: { type: "string", enum: ["RECURRING", "NON_RECURRING"] },
          example: "RECURRING",
        },
        {
          name: "pageSize",
          in: "query",
          description: "Number of items per page",
          schema: { type: "integer", default: 20 },
          example: 20,
        },
        {
          name: "pageNumber",
          in: "query",
          description: "Page number (1-based)",
          schema: { type: "integer", default: 1 },
          example: 1,
        },
      ],
      responses: {
        "200": {
          description: "Transactions fetched successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  message: {
                    type: "string",
                    example: "Transactions fetched successfully",
                  },
                  transactions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        id: { type: "string" },
                        userId: { type: "string" },
                        title: { type: "string" },
                        description: { type: ["string", "null"] },
                        type: { type: "string", enum: ["INCOME", "EXPENSE"] },
                        amount: { type: "number" },
                        category: { type: "string" },
                        paymentMethod: { type: "string" },
                        isRecurring: { type: "boolean" },
                        recurringInterval: { type: ["string", "null"] },
                        nextRecurringDate: { type: ["string", "null"] },
                        receiptUrl: { type: ["string", "null"] },
                        date: { type: "string", format: "date-time" },
                        createdAt: { type: "string", format: "date-time" },
                        updatedAt: { type: "string", format: "date-time" },
                      },
                    },
                  },
                  pagination: {
                    type: "object",
                    properties: {
                      pageSize: { type: "number", example: 20 },
                      pageNumber: { type: "number", example: 1 },
                      totalCount: { type: "number", example: 150 },
                      totalPages: { type: "number", example: 8 },
                      skip: { type: "number", example: 0 },
                    },
                  },
                },
              },
            },
          },
        },
        "401": {
          description: "Unauthorized",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  error: { type: "string", example: "Unauthorized" },
                },
              },
            },
          },
        },
        "500": {
          description: "Internal server error",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  error: { type: "string", example: "Failed to fetch transactions" },
                  message: { type: "string" },
                },
              },
            },
          },
        },
      },
    },
  },
  "/api/transactions/{id}": {
    get: {
      tags: ["Transactions"],
      summary: "Get a single transaction by ID",
      description:
        "Retrieve detailed information about a specific transaction. Only the transaction owner can access it.",
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          description: "Transaction ID",
          schema: { type: "string" },
          example: "clz2def456ghi789jkl012mno",
        },
      ],
      responses: {
        "200": {
          description: "Transaction fetched successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  message: {
                    type: "string",
                    example: "Transaction fetched successfully",
                  },
                  transaction: {
                    type: "object",
                    properties: {
                      id: { type: "string" },
                      userId: { type: "string" },
                      title: { type: "string" },
                      description: { type: ["string", "null"] },
                      type: { type: "string", enum: ["INCOME", "EXPENSE"] },
                      amount: { type: "number" },
                      category: { type: "string" },
                      paymentMethod: { type: "string" },
                      isRecurring: { type: "boolean" },
                      recurringInterval: { type: ["string", "null"] },
                      nextRecurringDate: { type: ["string", "null"] },
                      receiptUrl: { type: ["string", "null"] },
                      date: { type: "string", format: "date-time" },
                      createdAt: { type: "string", format: "date-time" },
                      updatedAt: { type: "string", format: "date-time" },
                    },
                  },
                },
              },
            },
          },
        },
        "401": {
          description: "Unauthorized",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  error: { type: "string", example: "Unauthorized" },
                },
              },
            },
          },
        },
        "404": {
          description: "Transaction not found",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  error: { type: "string", example: "Transaction not found" },
                  message: {
                    type: "string",
                    example:
                      "Transaction not found or you don't have permission to access it",
                  },
                },
              },
            },
          },
        },
        "500": {
          description: "Internal server error",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  error: { type: "string", example: "Failed to fetch transaction" },
                  message: { type: "string" },
                },
              },
            },
          },
        },
      },
    },
  },
  "/api/transactions/duplicate/{id}": {
    put: {
      tags: ["Transactions"],
      summary: "Duplicate a transaction",
      description:
        "Create a copy of an existing transaction with modified title and description. Duplicated transactions are never recurring.",
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          description: "Transaction ID to duplicate",
          schema: { type: "string" },
          example: "clz2def456ghi789jkl012mno",
        },
      ],
      responses: {
        "200": {
          description: "Transaction duplicated successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  message: {
                    type: "string",
                    example: "Transaction duplicated successfully",
                  },
                  transaction: {
                    type: "object",
                    properties: {
                      id: { type: "string" },
                      userId: { type: "string" },
                      title: {
                        type: "string",
                        example: "Duplicate - Monthly Salary",
                      },
                      description: {
                        type: ["string", "null"],
                        example: "February 2026 salary payment (Duplicate)",
                      },
                      type: { type: "string" },
                      amount: { type: "number" },
                      category: { type: "string" },
                      paymentMethod: { type: "string" },
                      isRecurring: { type: "boolean", example: false },
                      date: { type: "string", format: "date-time" },
                    },
                  },
                },
              },
            },
          },
        },
        "401": {
          description: "Unauthorized",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  error: { type: "string", example: "Unauthorized" },
                },
              },
            },
          },
        },
        "404": {
          description: "Transaction not found",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  error: { type: "string", example: "Transaction not found" },
                  message: {
                    type: "string",
                    example:
                      "Transaction not found or you don't have permission to access it",
                  },
                },
              },
            },
          },
        },
        "500": {
          description: "Internal server error",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  error: { type: "string", example: "Failed to duplicate transaction" },
                  message: { type: "string" },
                },
              },
            },
          },
        },
      },
    },
  },
  "/api/transactions/update/{id}": {
    put: {
      tags: ["Transactions"],
      summary: "Update a transaction",
      description:
        "Update an existing transaction's details. All fields are optional. Automatically recalculates next recurring date if recurring settings are modified.",
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          description: "Transaction ID to update",
          schema: { type: "string" },
          example: "clz2def456ghi789jkl012mno",
        },
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                title: {
                  type: "string",
                  minLength: 1,
                  description: "Transaction title",
                  example: "Updated Monthly Salary",
                },
                description: {
                  type: "string",
                  description: "Transaction description",
                  example: "Updated description",
                },
                type: {
                  type: "string",
                  enum: ["INCOME", "EXPENSE"],
                  description: "Transaction type",
                },
                amount: {
                  type: "number",
                  minimum: 1,
                  description: "Transaction amount",
                  example: 5500,
                },
                category: {
                  type: "string",
                  minLength: 1,
                  description: "Transaction category",
                  example: "Salary",
                },
                isRecurring: {
                  type: "boolean",
                  description: "Whether this transaction recurs",
                },
                recurringInterval: {
                  type: "string",
                  enum: ["DAILY", "WEEKLY", "MONTHLY", "YEARLY"],
                  nullable: true,
                  description: "Interval for recurring transactions",
                },
                receiptUrl: {
                  type: "string",
                  description: "URL to receipt image",
                },
                paymentMethod: {
                  type: "string",
                  enum: [
                    "CARD",
                    "BANK_TRANSFER",
                    "MOBILE_PAYMENT",
                    "AUTO_DEBIT",
                    "CASH",
                    "OTHER",
                  ],
                  description: "Payment method used",
                },
                date: {
                  type: "string",
                  format: "date-time",
                  description: "Transaction date",
                },
              },
            },
          },
        },
      },
      responses: {
        "200": {
          description: "Transaction updated successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  message: {
                    type: "string",
                    example: "Transaction updated successfully",
                  },
                  transaction: {
                    type: "object",
                    properties: {
                      id: { type: "string" },
                      userId: { type: "string" },
                      title: { type: "string" },
                      description: { type: ["string", "null"] },
                      type: { type: "string" },
                      amount: { type: "number" },
                      category: { type: "string" },
                      paymentMethod: { type: "string" },
                      isRecurring: { type: "boolean" },
                      recurringInterval: { type: ["string", "null"] },
                      nextRecurringDate: { type: ["string", "null"] },
                      date: { type: "string", format: "date-time" },
                      updatedAt: { type: "string", format: "date-time" },
                    },
                  },
                },
              },
            },
          },
        },
        "401": {
          description: "Unauthorized",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  error: { type: "string", example: "Unauthorized" },
                },
              },
            },
          },
        },
        "404": {
          description: "Transaction not found",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  error: { type: "string", example: "Transaction not found" },
                  message: {
                    type: "string",
                    example:
                      "Transaction not found or you don't have permission to access it",
                  },
                },
              },
            },
          },
        },
        "500": {
          description: "Internal server error",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  error: { type: "string", example: "Failed to update transaction" },
                  message: { type: "string" },
                },
              },
            },
          },
        },
      },
    },
  },
  "/api/transactions/delete/{id}": {
    delete: {
      tags: ["Transactions"],
      summary: "Delete a transaction",
      description:
        "Permanently delete a transaction. Only the transaction owner can delete it.",
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          description: "Transaction ID to delete",
          schema: { type: "string" },
          example: "clz2def456ghi789jkl012mno",
        },
      ],
      responses: {
        "200": {
          description: "Transaction deleted successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  message: {
                    type: "string",
                    example: "Transaction deleted successfully",
                  },
                },
              },
            },
          },
        },
        "401": {
          description: "Unauthorized",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  error: { type: "string", example: "Unauthorized" },
                },
              },
            },
          },
        },
        "404": {
          description: "Transaction not found",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  error: { type: "string", example: "Transaction not found" },
                  message: {
                    type: "string",
                    example:
                      "Transaction not found or you don't have permission to delete it",
                  },
                },
              },
            },
          },
        },
        "500": {
          description: "Internal server error",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  error: { type: "string", example: "Failed to delete transaction" },
                  message: { type: "string" },
                },
              },
            },
          },
        },
      },
    },
  },
  "/api/transactions/delete/bulk": {
    post: {
      tags: ["Transactions"],
      summary: "Delete multiple transactions",
      description:
        "Permanently delete multiple transactions in a single request. Only transactions owned by the authenticated user will be deleted.",
      security: [{ BearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["transactionIds"],
              properties: {
                transactionIds: {
                  type: "array",
                  minItems: 1,
                  items: { type: "string" },
                  description: "Array of transaction IDs to delete",
                  example: ["clz2def456ghi789jkl012mno", "clz3def456ghi789jkl012mno"],
                },
              },
            },
          },
        },
      },
      responses: {
        "200": {
          description: "Transactions deleted successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  message: {
                    type: "string",
                    example: "Transactions deleted successfully",
                  },
                  deletedCount: { type: "number", example: 2 },
                },
              },
            },
          },
        },
        "401": {
          description: "Unauthorized",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  error: { type: "string", example: "Unauthorized" },
                },
              },
            },
          },
        },
        "404": {
          description: "No transactions found",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  error: { type: "string", example: "No transactions found" },
                  message: {
                    type: "string",
                    example:
                      "No transactions found or you don't have permission to delete them",
                  },
                },
              },
            },
          },
        },
        "500": {
          description: "Internal server error",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  error: { type: "string", example: "Failed to delete transactions" },
                  message: { type: "string" },
                },
              },
            },
          },
        },
      },
    },
  },
  "/api/transactions/bulk-transaction": {
    post: {
      tags: ["Transactions"],
      summary: "Bulk create transactions",
      description:
        "Create multiple transactions in a single request. Useful for importing transaction data. All transactions will be non-recurring.",
      security: [{ BearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["transactions"],
              properties: {
                transactions: {
                  type: "array",
                  minItems: 1,
                  description: "Array of transactions to create",
                  items: {
                    type: "object",
                    required: ["title", "type", "amount", "category"],
                    properties: {
                      title: {
                        type: "string",
                        minLength: 1,
                        description: "Transaction title",
                        example: "Grocery Shopping",
                      },
                      description: {
                        type: "string",
                        description: "Transaction description",
                        example: "Weekly groceries",
                      },
                      type: {
                        type: "string",
                        enum: ["INCOME", "EXPENSE"],
                        description: "Transaction type",
                        example: "EXPENSE",
                      },
                      amount: {
                        type: "number",
                        minimum: 1,
                        description: "Transaction amount",
                        example: 150.5,
                      },
                      category: {
                        type: "string",
                        minLength: 1,
                        description: "Transaction category",
                        example: "Food",
                      },
                      receiptUrl: {
                        type: "string",
                        description: "URL to receipt image",
                      },
                      paymentMethod: {
                        type: "string",
                        enum: [
                          "CARD",
                          "BANK_TRANSFER",
                          "MOBILE_PAYMENT",
                          "AUTO_DEBIT",
                          "CASH",
                          "OTHER",
                        ],
                        default: "CASH",
                        description: "Payment method",
                        example: "CARD",
                      },
                      date: {
                        type: "string",
                        format: "date-time",
                        description: "Transaction date",
                        example: "2026-02-17T10:00:00Z",
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      responses: {
        "201": {
          description: "Bulk transactions created successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  message: {
                    type: "string",
                    example: "Bulk transactions inserted successfully",
                  },
                  insertedCount: { type: "number", example: 10 },
                  transactions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        id: { type: "string" },
                        userId: { type: "string" },
                        title: { type: "string" },
                        description: { type: ["string", "null"] },
                        type: { type: "string" },
                        amount: { type: "number" },
                        category: { type: "string" },
                        paymentMethod: { type: "string" },
                        date: { type: "string", format: "date-time" },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        "401": {
          description: "Unauthorized",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  error: { type: "string", example: "Unauthorized" },
                },
              },
            },
          },
        },
        "500": {
          description: "Internal server error",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  error: {
                    type: "string",
                    example: "Failed to create bulk transactions",
                  },
                  message: { type: "string" },
                },
              },
            },
          },
        },
      },
    },
  },
  "/api/transactions/scan-receipt": {
    post: {
      tags: ["Transactions"],
      summary: "Scan receipt with AI",
      description:
        "Upload a receipt image and use Google Gemini AI to extract transaction details. The receipt is uploaded to Cloudinary and analyzed using AI. Returns structured transaction data ready to be saved.",
      security: [{ BearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "multipart/form-data": {
            schema: {
              type: "object",
              required: ["receipt"],
              properties: {
                receipt: {
                  type: "string",
                  format: "binary",
                  description: "Receipt image file (JPG, JPEG, or PNG, max 2MB)",
                },
              },
            },
          },
        },
      },
      responses: {
        "200": {
          description: "Receipt scanned successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  message: { type: "string", example: "Receipt scanned successfully" },
                  data: {
                    type: "object",
                    properties: {
                      title: {
                        type: "string",
                        description: "Merchant or store name",
                        example: "Walmart Supercenter",
                      },
                      amount: {
                        type: "number",
                        description: "Total amount",
                        example: 45.67,
                      },
                      date: {
                        type: "string",
                        format: "date",
                        description: "Transaction date",
                        example: "2026-02-17",
                      },
                      description: {
                        type: "string",
                        description: "Brief description",
                        example: "Grocery shopping",
                      },
                      category: {
                        type: "string",
                        description: "Transaction category",
                        example: "Food",
                      },
                      paymentMethod: {
                        type: "string",
                        description: "Payment method",
                        example: "CARD",
                      },
                      type: {
                        type: "string",
                        enum: ["INCOME", "EXPENSE"],
                        description: "Transaction type",
                        example: "EXPENSE",
                      },
                      receiptUrl: {
                        type: "string",
                        description: "Cloudinary URL of the uploaded receipt",
                        example:
                          "https://res.cloudinary.com/demo/image/upload/v1234567890/receipts/receipt.jpg",
                      },
                    },
                  },
                },
              },
            },
          },
        },
        "400": {
          description: "Bad request - Invalid file or missing data",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  error: {
                    type: "string",
                    example: "Invalid file type. Only JPG, JPEG, and PNG are allowed",
                  },
                },
              },
            },
          },
        },
        "401": {
          description: "Unauthorized",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  error: { type: "string", example: "Unauthorized" },
                },
              },
            },
          },
        },
        "500": {
          description: "Internal server error",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  error: {
                    type: "string",
                    example: "Receipt scanning service unavailable",
                  },
                  message: { type: "string" },
                },
              },
            },
          },
        },
      },
    },
  },
}
