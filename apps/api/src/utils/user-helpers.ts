import { hashValue, compareValue } from "./bcrypt"
import type { User, NewUser } from "../db/schema"

// Helper to hash password before creating user
export async function hashPassword(password: string): Promise<string> {
  return await hashValue(password)
}

// Helper to verify password
export async function verifyPassword(
  password: string,
  hashedPassword: string,
): Promise<boolean> {
  return await compareValue(password, hashedPassword)
}

// Helper to omit password from user object
export function omitPassword(user: User): Omit<User, "password"> {
  const { password, ...userWithoutPassword } = user
  return userWithoutPassword
}

// Helper to prepare new user data (hashes password)
export async function prepareNewUser(
  data: NewUser & { password: string },
): Promise<NewUser> {
  return {
    ...data,
    password: await hashPassword(data.password),
  }
}
