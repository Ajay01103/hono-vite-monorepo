import jwt, { type JwtPayload, type SignOptions } from "jsonwebtoken"
import { Env } from "../config/env.confg"

type TimeUnit = "s" | "m" | "h" | "d" | "w" | "y"
type TimeString = `${number}${TimeUnit}`

export type AccessTokenPayload = {
  userId: string
}

type SignOptsAndSecret = SignOptions & {
  secret: string
  expiresIn?: TimeString | number
}

const defaults: SignOptions = {
  audience: ["user"],
}

const accessTokenSignOptions: SignOptsAndSecret = {
  expiresIn: Env.JWT_EXPIRES_IN as TimeString,
  secret: Env.JWT_SECRET,
}

export const signJwtToken = (
  payload: AccessTokenPayload,
  options?: SignOptsAndSecret,
) => {
  const isAccessToken = !options || options === accessTokenSignOptions

  const { secret, ...opts } = options || accessTokenSignOptions

  const token = jwt.sign(payload, secret, {
    ...defaults,
    ...opts,
  })

  const expiresAt = isAccessToken
    ? (jwt.decode(token) as JwtPayload)?.exp! * 1000
    : undefined

  return {
    token,
    expiresAt,
  }
}

export const verifyJwtToken = (token: string): AccessTokenPayload | null => {
  try {
    const decoded = jwt.verify(token, Env.JWT_SECRET, {
      audience: "user",
    })

    if (typeof decoded === "string" || !decoded || typeof decoded !== "object") {
      return null
    }

    const payload = decoded as JwtPayload

    if (!payload.userId || typeof payload.userId !== "string") {
      return null
    }

    return {
      userId: payload.userId,
    }
  } catch (error) {
    return null
  }
}
