/**
 * Environment configuration for Cloudflare Workers
 * This module provides a safe way to access environment variables from Cloudflare bindings
 * Note: In Cloudflare Workers, env vars come from c.env (runtime bindings), not process.env
 */

// Type-safe environment config
// For Cloudflare Workers, these values should be accessed from c.env at runtime
// This is a fallback for development/testing purposes only
export const Env = {
  NODE_ENV: (process.env.NODE_ENV as string) || "development",

  JWT_SECRET: (process.env.JWT_SECRET as string) || "secert_jwt",
  JWT_EXPIRES_IN: (process.env.JWT_EXPIRES_IN as string) || "7d",

  GEMINI_API_KEY: (process.env.GEMINI_API_KEY as string) || "",

  CLOUDINARY_CLOUD_NAME: (process.env.CLOUDINARY_CLOUD_NAME as string) || "",
  CLOUDINARY_API_KEY: (process.env.CLOUDINARY_API_KEY as string) || "",
  CLOUDINARY_API_SECRET: (process.env.CLOUDINARY_API_SECRET as string) || "",

  RESEND_API_KEY: (process.env.RESEND_API_KEY as string) || "",
  RESEND_MAILER_SENDER: (process.env.RESEND_MAILER_SENDER as string) || "",

  FRONTEND_ORIGIN: (process.env.FRONTEND_ORIGIN as string) || "localhost",
}

/**
 * Helper to get environment variables from Cloudflare Workers binding
 * Use this in your route handlers: getEnvFromBinding(c.env)
 */
export function getEnvFromBinding(env: CloudflareBindings) {
  return {
    NODE_ENV: env.NODE_ENV || "production",

    JWT_SECRET: env.JWT_SECRET,
    JWT_EXPIRES_IN: env.JWT_EXPIRES_IN || "7d",

    GEMINI_API_KEY: env.GEMINI_API_KEY,

    CLOUDINARY_CLOUD_NAME: env.CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY: env.CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET: env.CLOUDINARY_API_SECRET,

    RESEND_API_KEY: env.RESEND_API_KEY,
    RESEND_MAILER_SENDER: env.RESEND_MAILER_SENDER || "",

    FRONTEND_ORIGIN: env.FRONTEND_ORIGIN || "localhost",
  }
}
