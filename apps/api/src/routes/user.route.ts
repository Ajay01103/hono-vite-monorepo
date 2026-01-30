import { Hono } from "hono"
import { Database } from "../db"
import { verifyJwtToken } from "../utils/jwt"
import { omitPassword } from "../utils/user-helpers"
import { zValidator } from "@hono/zod-validator"
import { v2 as cloudinary } from "cloudinary"
import z from "zod/v4"
import { users } from "../db/schema"
import { eq } from "drizzle-orm"
import { Env } from "../config/env.confg"

type Variables = {
  db: Database
}

const app = new Hono<{ Bindings: CloudflareBindings; Variables: Variables }>()
  .get("/current-user", async (c) => {
    try {
      const authHeader = c.req.header("Authorization")

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return c.json({ error: "Unauthorized" }, 401)
      }

      const token = authHeader.substring(7)
      const payload = verifyJwtToken(token)

      if (!payload) {
        return c.json({ error: "Invalid or expired token" }, 401)
      }

      const db = c.get("db")

      const user = await db.query.users.findFirst({
        where: { id: Number(payload.userId) },
      })

      if (!user) {
        return c.json({ error: "User not found" }, 404)
      }

      return c.json(
        {
          user: omitPassword(user),
        },
        200,
      )
    } catch (error: any) {
      console.error("Current user error:", error)
      return c.json(
        {
          error: "Failed to fetch current user",
          message: error.message || "Unknown error",
        },
        500,
      )
    }
  })
  .put("/update", async (c) => {
    try {
      const authHeader = c.req.header("Authorization")

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return c.json({ error: "Unauthorized" }, 401)
      }

      const token = authHeader.substring(7)
      const payload = verifyJwtToken(token)

      if (!payload) {
        return c.json({ error: "Invalid or expired token" }, 401)
      }

      const db = c.get("db")
      const userId = Number(payload.userId)

      // Check if user exists
      const existingUser = await db.query.users.findFirst({
        where: { id: userId },
      })

      if (!existingUser) {
        return c.json({ error: "User not found" }, 404)
      }

      // Parse form data
      const formData = await c.req.formData()
      const name = formData.get("name") as string | null
      const profilePictureFile = formData.get("profilePicture") as File | null

      // Validate name if provided
      if (name && (name.trim().length === 0 || name.length > 255)) {
        return c.json({ error: "Invalid name" }, 400)
      }

      // Build update data
      const updateData: {
        name?: string
        profilePicture?: string
        updatedAt: Date
      } = {
        updatedAt: new Date(),
      }

      if (name && name.trim()) {
        updateData.name = name.trim()
      }

      // Handle profile picture upload to Cloudinary
      if (profilePictureFile && profilePictureFile.size > 0) {
        // Validate file type
        const validTypes = ["image/jpeg", "image/jpg", "image/png"]
        if (!validTypes.includes(profilePictureFile.type)) {
          return c.json(
            { error: "Invalid file type. Only JPG, JPEG, and PNG are allowed" },
            400,
          )
        }

        // Validate file size (2MB max)
        if (profilePictureFile.size > 2 * 1024 * 1024) {
          return c.json({ error: "File size must be less than 2MB" }, 400)
        }

        // Configure Cloudinary
        cloudinary.config({
          cloud_name: Env.CLOUDINARY_CLOUD_NAME,
          api_key: Env.CLOUDINARY_API_KEY,
          api_secret: Env.CLOUDINARY_API_SECRET,
        })

        // Convert file to buffer
        const arrayBuffer = await profilePictureFile.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        // Upload to Cloudinary using upload_stream
        const uploadResult = await new Promise<{ secure_url: string }>(
          (resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
              {
                folder: "images",
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

        updateData.profilePicture = uploadResult.secure_url
      }

      // Check if there's anything to update
      if (!updateData.name && !updateData.profilePicture) {
        return c.json({ error: "No data to update" }, 400)
      }

      // Update user in database
      const [updatedUser] = await db
        .update(users)
        .set(updateData)
        .where(eq(users.id, userId))
        .returning()

      return c.json(
        {
          message: "User updated successfully",
          user: omitPassword(updatedUser),
        },
        200,
      )
    } catch (error: any) {
      console.error("Update user error:", error)
      return c.json(
        {
          error: "Failed to update user",
          message: error.message || "Unknown error",
        },
        500,
      )
    }
  })

export default app
