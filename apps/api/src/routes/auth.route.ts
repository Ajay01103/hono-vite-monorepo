import { Hono } from "hono"
import { zValidator } from "@hono/zod-validator"
import z from "zod"
import { eq } from "drizzle-orm"
import { users, reportSettings, ReportFrequencyEnum } from "../db/schema"
import type { Database } from "../db"
import { prepareNewUser, omitPassword } from "../utils/user-helpers"
import { calulateNextReportDate } from "../utils/helpers"
import { compareValue } from "../utils/bcrypt"
import { signJwtToken } from "../utils/jwt"

type Variables = {
  db: Database
}

const app = new Hono<{ Bindings: CloudflareBindings; Variables: Variables }>()
  .post(
    "/register",
    zValidator(
      "json",
      z.object({
        name: z.string().trim().min(1).max(255),
        email: z.string().trim().email("Invalid email address").min(1).max(255),
        password: z.string().trim().min(4),
      }),
    ),
    async (c) => {
      const { name, email, password } = c.req.valid("json")

      try {
        const db = c.get("db")

        // Check if user already exists
        const existingUser = await db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1)

        if (existingUser.length > 0) {
          return c.json({ error: "User already exists" }, 409)
        }

        // Prepare new user with hashed password
        const newUserData = await prepareNewUser({
          name,
          email,
          password,
          profilePicture: null,
        })

        // Insert new user
        const [newUser] = await db.insert(users).values(newUserData).returning()

        // Create report settings for the new user
        await db.insert(reportSettings).values({
          userId: newUser.id,
          frequency: ReportFrequencyEnum.MONTHLY,
          isEnabled: true,
          nextReportDate: calulateNextReportDate(),
          lastSentDate: null,
        })

        // Return user without password
        return c.json(
          {
            message: "User registered successfully",
            data: { user: omitPassword(newUser) },
          },
          201,
        )
      } catch (error: any) {
        console.error("Registration error:", error)
        return c.json(
          {
            error: "Registration failed",
            message: error.message || "Unknown error",
          },
          500,
        )
      }
    },
  )
  .post(
    "/login",
    zValidator(
      "json",
      z.object({
        email: z.string().trim().email("Invalid email address").min(1).max(255),
        password: z.string().trim().min(4),
      }),
    ),
    async (c) => {
      const { email, password } = c.req.valid("json")

      try {
        const db = c.get("db")

        // Find user
        const user = await db.query.users.findFirst({
          where: { email },
        })

        if (!user) {
          return c.json({ error: "Invalid email or password" }, 401)
        }

        // Verify password
        const isPasswordValid = await compareValue(password, user.password)

        if (!isPasswordValid) {
          return c.json({ error: "Invalid email or password" }, 401)
        }

        // Generate JWT token
        const { token, expiresAt } = signJwtToken({
          userId: user.id,
        })

        // Return response without password
        return c.json(
          {
            message: "User logged in successfully",
            user: omitPassword(user),
            accessToken: token,
            expiresAt,
          },
          200,
        )
      } catch (error: any) {
        console.error("Login error:", error)
        return c.json(
          {
            error: "Login failed",
            message: error.message || "Unknown error",
          },
          500,
        )
      }
    },
  )

export default app
