import bcrypt from "bcryptjs"
import { SignJWT, jwtVerify, type JWTPayload } from "jose"
import { supabase } from "./supabase"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

export interface User {
  id: string
  username: string
  email: string
  full_name: string
  department?: string
  role: "admin" | "employee"
  is_verified: boolean
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export async function generateToken(user: User): Promise<string> {
  const secret = new TextEncoder().encode(JWT_SECRET)
  return await new SignJWT({
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(secret)
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const secret = new TextEncoder().encode(JWT_SECRET)
    const { payload } = await jwtVerify(token, secret)
    return payload
  } catch {
    return null
  }
}

export async function createUser(userData: {
  username: string
  email: string
  password: string
  full_name: string
  department?: string
}) {
  const passwordHash = await hashPassword(userData.password)
  const verificationToken = Math.random().toString(36).substring(2, 15)

  const { data, error } = await supabase
    .from("users")
    .insert({
      username: userData.username,
      email: userData.email,
      password_hash: passwordHash,
      full_name: userData.full_name,
      department: userData.department,
      verification_token: verificationToken,
    })
    .select()
    .single()

  if (error) throw error

  // Create email account
  await supabase.from("email_accounts").insert({
    user_id: data.id,
    email_address: `${userData.username}@x-ticket.com`,
  })

  return { user: data, verificationToken }
}

export async function authenticateUser(username: string, password: string) {
  const { data: user, error } = await supabase.from("users").select("*").eq("username", username).single()

  if (error || !user) return null

  const isValid = await verifyPassword(password, user.password_hash)
  if (!isValid) return null

  return user
}
