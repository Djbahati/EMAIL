import { type NextRequest, NextResponse } from "next/server"
import { createUser } from "@/lib/auth"
import { sendEmail, generateVerificationEmail } from "@/lib/email"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, email, password, full_name, department } = body

    // Validate input
    if (!username || !email || !password || !full_name) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Create user and email account
    const { user, verificationToken } = await createUser({
      username,
      email,
      password,
      full_name,
      department,
    })

    // Send verification email
    const emailContent = generateVerificationEmail(username, verificationToken)
    await sendEmail({
      to: email,
      subject: emailContent.subject,
      html: emailContent.html,
    })

    return NextResponse.json({
      message: "User created successfully. Please check your email for verification.",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        full_name: user.full_name,
      },
    })
  } catch (error: any) {
    console.error("Registration error:", error)

    if (error.code === "23505") {
      // Unique constraint violation
      return NextResponse.json({ error: "Username or email already exists" }, { status: 409 })
    }

    return NextResponse.json({ error: "Registration failed" }, { status: 500 })
  }
}
