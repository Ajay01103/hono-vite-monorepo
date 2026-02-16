import { Hono } from "hono"
import { Database } from "../db"
import { verifyJwtToken } from "../utils/jwt"
import { eq, and, gte, lte, sql, asc } from "drizzle-orm"
import { transactions, TransactionTypeEnum } from "../db/schema"
import { calculatePercentageChange } from "../utils/helpers"
import { getDateRange } from "../utils/date"
import { convertToDollarUnit } from "../utils/format-currency"
import { DateRangeEnum, type DateRangePreset } from "../enums/date-range.enumm"
import { differenceInDays, subDays, subYears, format } from "date-fns"

type Variables = {
  db: Database
}

const app = new Hono<{ Bindings: CloudflareBindings; Variables: Variables }>()
  .get("/summary", async (c) => {
    try {
      // Verify JWT token
      const authHeader = c.req.header("Authorization")
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return c.json({ message: "Unauthorized" }, 401)
      }

      const token = authHeader.substring(7)
      const payload = verifyJwtToken(token)

      if (!payload) {
        return c.json({ message: "Invalid or expired token" }, 401)
      }

      const userId = payload.userId
      const db = c.get("db")

      // Get query parameters
      const preset = c.req.query("preset") as DateRangePreset | undefined
      const fromStr = c.req.query("from")
      const toStr = c.req.query("to")

      // Parse dates
      const customFrom = fromStr ? new Date(fromStr) : undefined
      const customTo = toStr ? new Date(toStr) : undefined

      // Get date range
      const range = getDateRange(preset, customFrom, customTo)
      const { from, to, value: rangeValue } = range

      // Build query filters for current period
      const currentPeriodFilters = [eq(transactions.userId, userId)]
      if (from && to) {
        currentPeriodFilters.push(
          and(gte(transactions.date, from), lte(transactions.date, to))!,
        )
      }

      // Query current period transactions
      const currentPeriodData = await db
        .select({
          type: transactions.type,
          amount: transactions.amount,
        })
        .from(transactions)
        .where(and(...currentPeriodFilters))

      // Calculate current period stats
      let totalIncome = 0
      let totalExpenses = 0
      let transactionCount = currentPeriodData.length

      for (const transaction of currentPeriodData) {
        const absAmount = Math.abs(transaction.amount!)
        if (transaction.type === TransactionTypeEnum.INCOME) {
          totalIncome += absAmount
        } else if (transaction.type === TransactionTypeEnum.EXPENSE) {
          totalExpenses += absAmount
        }
      }

      const availableBalance = totalIncome - totalExpenses

      // Calculate savings data
      const savingsPercentage =
        totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0
      const expenseRatio = totalIncome > 0 ? (totalExpenses / totalIncome) * 100 : 0

      // Prepare percentage change object
      let percentageChange: any = {
        income: 0,
        expenses: 0,
        balance: 0,
        prevPeriodFrom: null,
        prevPeriodTo: null,
        previousValues: {
          incomeAmount: 0,
          expenseAmount: 0,
          balanceAmount: 0,
        },
      }

      // Calculate previous period comparison (skip for ALL_TIME)
      if (from && to && rangeValue !== DateRangeEnum.ALL_TIME) {
        const period = differenceInDays(to, from) + 1

        // Use yearly comparison for yearly ranges
        const isYearly = [DateRangeEnum.LAST_YEAR, DateRangeEnum.THIS_YEAR].includes(
          rangeValue as DateRangeEnum,
        )

        const prevPeriodFrom = isYearly ? subYears(from, 1) : subDays(from, period)
        const prevPeriodTo = isYearly ? subYears(to, 1) : subDays(to, period)

        // Query previous period transactions
        const prevPeriodData = await db
          .select({
            type: transactions.type,
            amount: transactions.amount,
          })
          .from(transactions)
          .where(
            and(
              eq(transactions.userId, userId),
              gte(transactions.date, prevPeriodFrom),
              lte(transactions.date, prevPeriodTo),
            ),
          )

        // Calculate previous period stats
        let prevIncome = 0
        let prevExpenses = 0

        for (const transaction of prevPeriodData) {
          const absAmount = Math.abs(transaction.amount!)
          if (transaction.type === TransactionTypeEnum.INCOME) {
            prevIncome += absAmount
          } else if (transaction.type === TransactionTypeEnum.EXPENSE) {
            prevExpenses += absAmount
          }
        }

        const prevBalance = prevIncome - prevExpenses

        // Calculate percentage changes
        percentageChange = {
          income: calculatePercentageChange(prevIncome, totalIncome),
          expenses: calculatePercentageChange(prevExpenses, totalExpenses),
          balance: calculatePercentageChange(prevBalance, availableBalance),
          prevPeriodFrom,
          prevPeriodTo,
          previousValues: {
            incomeAmount: convertToDollarUnit(prevIncome),
            expenseAmount: convertToDollarUnit(prevExpenses),
            balanceAmount: convertToDollarUnit(prevBalance),
          },
        }
      }

      // Format response
      return c.json({
        message: "Summary fetched successfully",
        data: {
          availableBalance: convertToDollarUnit(availableBalance),
          totalIncome: convertToDollarUnit(totalIncome),
          totalExpenses: convertToDollarUnit(totalExpenses),
          savingRate: {
            percentage: parseFloat(savingsPercentage.toFixed(2)),
            expenseRatio: parseFloat(expenseRatio.toFixed(2)),
          },
          transactionCount,
          percentageChange,
          preset: {
            ...range,
            value: rangeValue || DateRangeEnum.ALL_TIME,
            label: range?.label || "All Time",
          },
        },
      })
    } catch (error) {
      console.error("Error fetching analytics summary:", error)
      return c.json(
        {
          message: "Failed to fetch summary",
          error: error instanceof Error ? error.message : "Unknown error",
        },
        500,
      )
    }
  })
  .get("/chart", async (c) => {
    try {
      // Verify JWT token
      const authHeader = c.req.header("Authorization")
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return c.json({ message: "Unauthorized" }, 401)
      }

      const token = authHeader.substring(7)
      const payload = verifyJwtToken(token)

      if (!payload) {
        return c.json({ message: "Invalid or expired token" }, 401)
      }

      const userId = payload.userId
      const db = c.get("db")

      // Get query parameters
      const preset = c.req.query("preset") as DateRangePreset | undefined
      const fromStr = c.req.query("from")
      const toStr = c.req.query("to")

      // Parse dates
      const customFrom = fromStr ? new Date(fromStr) : undefined
      const customTo = toStr ? new Date(toStr) : undefined

      // Get date range
      const range = getDateRange(preset, customFrom, customTo)
      const { from, to, value: rangeValue } = range

      // Build query filters
      const filters = [eq(transactions.userId, userId)]
      if (from && to) {
        filters.push(and(gte(transactions.date, from), lte(transactions.date, to))!)
      }

      // Query all transactions for the period, ordered by date
      const transactionData = await db
        .select({
          date: transactions.date,
          type: transactions.type,
          amount: transactions.amount,
        })
        .from(transactions)
        .where(and(...filters))
        .orderBy(asc(transactions.date))

      // Group transactions by date (YYYY-MM-DD)
      const groupedByDate = new Map<
        string,
        {
          income: number
          expenses: number
          incomeCount: number
          expenseCount: number
        }
      >()

      let totalIncomeCount = 0
      let totalExpenseCount = 0

      for (const transaction of transactionData) {
        // Format date as YYYY-MM-DD
        const dateStr = format(transaction.date!, "yyyy-MM-dd")
        const absAmount = Math.abs(transaction.amount!)

        // Get or create date group
        if (!groupedByDate.has(dateStr)) {
          groupedByDate.set(dateStr, {
            income: 0,
            expenses: 0,
            incomeCount: 0,
            expenseCount: 0,
          })
        }

        const dateGroup = groupedByDate.get(dateStr)!

        // Aggregate by type
        if (transaction.type === TransactionTypeEnum.INCOME) {
          dateGroup.income += absAmount
          dateGroup.incomeCount += 1
          totalIncomeCount += 1
        } else if (transaction.type === TransactionTypeEnum.EXPENSE) {
          dateGroup.expenses += absAmount
          dateGroup.expenseCount += 1
          totalExpenseCount += 1
        }
      }

      // Transform to array and convert to dollars
      const chartData = Array.from(groupedByDate.entries())
        .map(([date, data]) => ({
          date,
          income: convertToDollarUnit(data.income),
          expenses: convertToDollarUnit(data.expenses),
        }))
        .sort((a, b) => a.date.localeCompare(b.date))

      // Format response
      return c.json({
        message: "Chart fetched successfully",
        data: {
          chartData,
          totalIncomeCount,
          totalExpenseCount,
          preset: {
            ...range,
            value: rangeValue || DateRangeEnum.ALL_TIME,
            label: range?.label || "All Time",
          },
        },
      })
    } catch (error) {
      console.error("Error fetching chart analytics:", error)
      return c.json(
        {
          message: "Failed to fetch chart data",
          error: error instanceof Error ? error.message : "Unknown error",
        },
        500,
      )
    }
  })
  .get("/expense-breakdown", async (c) => {
    try {
      // Verify JWT token
      const authHeader = c.req.header("Authorization")
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return c.json({ message: "Unauthorized" }, 401)
      }

      const token = authHeader.substring(7)
      const payload = verifyJwtToken(token)

      if (!payload) {
        return c.json({ message: "Invalid or expired token" }, 401)
      }

      const userId = payload.userId
      const db = c.get("db")

      // Get query parameters
      const preset = c.req.query("preset") as DateRangePreset | undefined
      const fromStr = c.req.query("from")
      const toStr = c.req.query("to")

      // Parse dates
      const customFrom = fromStr ? new Date(fromStr) : undefined
      const customTo = toStr ? new Date(toStr) : undefined

      // Get date range
      const range = getDateRange(preset, customFrom, customTo)
      const { from, to, value: rangeValue } = range

      // Build query filters for expenses only
      const filters = [
        eq(transactions.userId, userId),
        eq(transactions.type, TransactionTypeEnum.EXPENSE),
      ]
      if (from && to) {
        filters.push(and(gte(transactions.date, from), lte(transactions.date, to))!)
      }

      // Query all expense transactions for the period
      const expenseData = await db
        .select({
          category: transactions.category,
          amount: transactions.amount,
        })
        .from(transactions)
        .where(and(...filters))

      // Group by category and sum amounts
      const categoryMap = new Map<string, number>()

      for (const expense of expenseData) {
        const category = expense.category!
        const absAmount = Math.abs(expense.amount!)
        categoryMap.set(category, (categoryMap.get(category) || 0) + absAmount)
      }

      // Convert to array and sort by value descending
      const sortedCategories = Array.from(categoryMap.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)

      // Get top 3 categories
      const topThree = sortedCategories.slice(0, 3)

      // Sum the rest as "others"
      const othersValue = sortedCategories
        .slice(3)
        .reduce((sum, cat) => sum + cat.value, 0)

      // Combine top 3 with others (if there are more than 3 categories)
      const categories = [...topThree]
      if (othersValue > 0) {
        categories.push({ name: "others", value: othersValue })
      }

      // Calculate total spent
      const totalSpent = categories.reduce((sum, cat) => sum + cat.value, 0)

      // Calculate percentages and convert to dollars
      const breakdown = categories.map((cat) => ({
        name: cat.name,
        value: convertToDollarUnit(cat.value),
        percentage: totalSpent > 0 ? Math.round((cat.value / totalSpent) * 100) : 0,
      }))

      // Format response
      return c.json({
        message: "Expense breakdown fetched successfully",
        data: {
          totalSpent: convertToDollarUnit(totalSpent),
          breakdown,
          preset: {
            ...range,
            value: rangeValue || DateRangeEnum.ALL_TIME,
            label: range?.label || "All Time",
          },
        },
      })
    } catch (error) {
      console.error("Error fetching expense breakdown:", error)
      return c.json(
        {
          message: "Failed to fetch expense breakdown",
          error: error instanceof Error ? error.message : "Unknown error",
        },
        500,
      )
    }
  })

export default app
