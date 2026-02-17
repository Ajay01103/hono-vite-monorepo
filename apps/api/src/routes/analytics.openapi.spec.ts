/**
 * OpenAPI specification for Analytics routes
 * This is manually defined because analytics routes use regular Hono (not OpenAPIHono) for RPC compatibility
 */

export const analyticsOpenAPISpec = {
  "/api/analytics/summary": {
    get: {
      tags: ["Analytics"],
      summary: "Get financial summary",
      description:
        "Retrieve a comprehensive financial summary including income, expenses, balance, savings rate, and percentage changes compared to the previous period. Supports custom date ranges or preset periods.",
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          name: "preset",
          in: "query",
          required: false,
          schema: {
            type: "string",
            enum: [
              "today",
              "yesterday",
              "this-week",
              "last-week",
              "this-month",
              "last-month",
              "this-year",
              "last-year",
              "all-time",
            ],
          },
          description:
            "Preset date range for the analytics period. Overrides custom from/to dates if provided.",
          example: "this-month",
        },
        {
          name: "from",
          in: "query",
          required: false,
          schema: {
            type: "string",
            format: "date",
          },
          description: "Start date for custom date range (ISO 8601 format: YYYY-MM-DD)",
          example: "2026-01-01",
        },
        {
          name: "to",
          in: "query",
          required: false,
          schema: {
            type: "string",
            format: "date",
          },
          description: "End date for custom date range (ISO 8601 format: YYYY-MM-DD)",
          example: "2026-01-31",
        },
      ],
      responses: {
        "200": {
          description: "Summary data retrieved successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  message: { type: "string", example: "Summary fetched successfully" },
                  data: {
                    type: "object",
                    properties: {
                      availableBalance: {
                        type: "number",
                        format: "double",
                        description: "Available balance in dollars (income - expenses)",
                        example: 1250.75,
                      },
                      totalIncome: {
                        type: "number",
                        format: "double",
                        description: "Total income in dollars",
                        example: 3500.0,
                      },
                      totalExpenses: {
                        type: "number",
                        format: "double",
                        description: "Total expenses in dollars",
                        example: 2249.25,
                      },
                      savingRate: {
                        type: "object",
                        properties: {
                          percentage: {
                            type: "number",
                            format: "double",
                            description: "Savings rate as percentage of income",
                            example: 35.73,
                          },
                          expenseRatio: {
                            type: "number",
                            format: "double",
                            description: "Expense ratio as percentage of income",
                            example: 64.27,
                          },
                        },
                      },
                      transactionCount: {
                        type: "integer",
                        description: "Total number of transactions in the period",
                        example: 42,
                      },
                      percentageChange: {
                        type: "object",
                        properties: {
                          income: {
                            type: "number",
                            format: "double",
                            description:
                              "Percentage change in income compared to previous period",
                            example: 12.5,
                          },
                          expenses: {
                            type: "number",
                            format: "double",
                            description:
                              "Percentage change in expenses compared to previous period",
                            example: -5.3,
                          },
                          balance: {
                            type: "number",
                            format: "double",
                            description:
                              "Percentage change in balance compared to previous period",
                            example: 45.2,
                          },
                          prevPeriodFrom: {
                            type: ["string", "null"],
                            format: "date-time",
                            description: "Start date of the previous comparison period",
                          },
                          prevPeriodTo: {
                            type: ["string", "null"],
                            format: "date-time",
                            description: "End date of the previous comparison period",
                          },
                          previousValues: {
                            type: "object",
                            properties: {
                              incomeAmount: {
                                type: "number",
                                format: "double",
                                example: 3200.0,
                              },
                              expenseAmount: {
                                type: "number",
                                format: "double",
                                example: 2400.0,
                              },
                              balanceAmount: {
                                type: "number",
                                format: "double",
                                example: 800.0,
                              },
                            },
                          },
                        },
                      },
                      preset: {
                        type: "object",
                        properties: {
                          from: {
                            type: ["string", "null"],
                            format: "date-time",
                            description: "Start date of the current period",
                          },
                          to: {
                            type: ["string", "null"],
                            format: "date-time",
                            description: "End date of the current period",
                          },
                          value: {
                            type: "string",
                            example: "this-month",
                          },
                          label: {
                            type: "string",
                            example: "This Month",
                          },
                        },
                      },
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
                  message: { type: "string", example: "Unauthorized" },
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
                  message: { type: "string", example: "Failed to fetch summary" },
                  error: { type: "string", example: "Database connection error" },
                },
              },
            },
          },
        },
      },
    },
  },
  "/api/analytics/chart": {
    get: {
      tags: ["Analytics"],
      summary: "Get chart data for income and expenses",
      description:
        "Retrieve daily aggregated income and expense data for charting purposes. Data is grouped by date and sorted chronologically.",
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          name: "preset",
          in: "query",
          required: false,
          schema: {
            type: "string",
            enum: [
              "today",
              "yesterday",
              "this-week",
              "last-week",
              "this-month",
              "last-month",
              "this-year",
              "last-year",
              "all-time",
            ],
          },
          description:
            "Preset date range for the analytics period. Overrides custom from/to dates if provided.",
          example: "this-month",
        },
        {
          name: "from",
          in: "query",
          required: false,
          schema: {
            type: "string",
            format: "date",
          },
          description: "Start date for custom date range (ISO 8601 format: YYYY-MM-DD)",
          example: "2026-01-01",
        },
        {
          name: "to",
          in: "query",
          required: false,
          schema: {
            type: "string",
            format: "date",
          },
          description: "End date for custom date range (ISO 8601 format: YYYY-MM-DD)",
          example: "2026-01-31",
        },
      ],
      responses: {
        "200": {
          description: "Chart data retrieved successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  message: { type: "string", example: "Chart fetched successfully" },
                  data: {
                    type: "object",
                    properties: {
                      chartData: {
                        type: "array",
                        description: "Array of daily aggregated income and expense data",
                        items: {
                          type: "object",
                          properties: {
                            date: {
                              type: "string",
                              format: "date",
                              description: "Date in YYYY-MM-DD format",
                              example: "2026-01-15",
                            },
                            income: {
                              type: "number",
                              format: "double",
                              description: "Total income for the day in dollars",
                              example: 500.0,
                            },
                            expenses: {
                              type: "number",
                              format: "double",
                              description: "Total expenses for the day in dollars",
                              example: 125.5,
                            },
                          },
                        },
                      },
                      totalIncomeCount: {
                        type: "integer",
                        description: "Total number of income transactions",
                        example: 15,
                      },
                      totalExpenseCount: {
                        type: "integer",
                        description: "Total number of expense transactions",
                        example: 27,
                      },
                      preset: {
                        type: "object",
                        properties: {
                          from: {
                            type: ["string", "null"],
                            format: "date-time",
                            description: "Start date of the current period",
                          },
                          to: {
                            type: ["string", "null"],
                            format: "date-time",
                            description: "End date of the current period",
                          },
                          value: {
                            type: "string",
                            example: "this-month",
                          },
                          label: {
                            type: "string",
                            example: "This Month",
                          },
                        },
                      },
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
                  message: { type: "string", example: "Unauthorized" },
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
                  message: { type: "string", example: "Failed to fetch chart data" },
                  error: { type: "string", example: "Database connection error" },
                },
              },
            },
          },
        },
      },
    },
  },
  "/api/analytics/expense-breakdown": {
    get: {
      tags: ["Analytics"],
      summary: "Get expense breakdown by category",
      description:
        "Retrieve a breakdown of expenses by category, showing the top 3 categories and grouping the rest as 'others'. Includes percentages and total spent.",
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          name: "preset",
          in: "query",
          required: false,
          schema: {
            type: "string",
            enum: [
              "today",
              "yesterday",
              "this-week",
              "last-week",
              "this-month",
              "last-month",
              "this-year",
              "last-year",
              "all-time",
            ],
          },
          description:
            "Preset date range for the analytics period. Overrides custom from/to dates if provided.",
          example: "this-month",
        },
        {
          name: "from",
          in: "query",
          required: false,
          schema: {
            type: "string",
            format: "date",
          },
          description: "Start date for custom date range (ISO 8601 format: YYYY-MM-DD)",
          example: "2026-01-01",
        },
        {
          name: "to",
          in: "query",
          required: false,
          schema: {
            type: "string",
            format: "date",
          },
          description: "End date for custom date range (ISO 8601 format: YYYY-MM-DD)",
          example: "2026-01-31",
        },
      ],
      responses: {
        "200": {
          description: "Expense breakdown retrieved successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  message: {
                    type: "string",
                    example: "Expense breakdown fetched successfully",
                  },
                  data: {
                    type: "object",
                    properties: {
                      totalSpent: {
                        type: "number",
                        format: "double",
                        description:
                          "Total amount spent across all categories in dollars",
                        example: 2249.25,
                      },
                      breakdown: {
                        type: "array",
                        description:
                          "Array of category breakdowns (top 3 categories + others if applicable)",
                        items: {
                          type: "object",
                          properties: {
                            name: {
                              type: "string",
                              description: "Category name",
                              example: "groceries",
                            },
                            value: {
                              type: "number",
                              format: "double",
                              description: "Amount spent in this category in dollars",
                              example: 850.5,
                            },
                            percentage: {
                              type: "integer",
                              description: "Percentage of total expenses",
                              example: 38,
                            },
                          },
                        },
                      },
                      preset: {
                        type: "object",
                        properties: {
                          from: {
                            type: ["string", "null"],
                            format: "date-time",
                            description: "Start date of the current period",
                          },
                          to: {
                            type: ["string", "null"],
                            format: "date-time",
                            description: "End date of the current period",
                          },
                          value: {
                            type: "string",
                            example: "this-month",
                          },
                          label: {
                            type: "string",
                            example: "This Month",
                          },
                        },
                      },
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
                  message: { type: "string", example: "Unauthorized" },
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
                  message: {
                    type: "string",
                    example: "Failed to fetch expense breakdown",
                  },
                  error: { type: "string", example: "Database connection error" },
                },
              },
            },
          },
        },
      },
    },
  },
}
