import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { sendEmail, generateVerificationEmail } from "@/lib/email"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username } = body

    if (!username) {
      return NextResponse.json({ error: "Username is required" }, { status: 400 })
    }

    // Find user by username
    const { data: user, error: findError } = await supabase.from("users").select("*").eq("username", username).single()

    if (findError || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    if (user.is_verified) {
      return NextResponse.json({ error: "Email is already verified" }, { status: 400 })
    }

    // Generate new verification token
    const newVerificationToken =
      Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)

    // Update user with new token
    const { error: updateError } = await supabase
      .from("users")
      .update({
        verification_token: newVerificationToken,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)

    if (updateError) {
      throw updateError
    }

    // Send new verification email
    const emailContent = generateVerificationEmail(user.username, newVerificationToken)
    const emailResult = await sendEmail({
      to: user.email,
      subject: emailContent.subject,
      html: emailContent.html,
    })

    if (!emailResult.success) {
      return NextResponse.json({ error: "Failed to send verification email" }, { status: 500 })
    }

    // Log the resend attempt
    await supabase
      .from("verification_logs")
      .insert({
        username: user.username,
        action: "resend_verification",
        status: "success",
        ip_address: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown",
        user_agent: request.headers.get("user-agent") || "unknown",
      })
      .catch(console.error) 
      
      // Don't fail the request if logging fails

    return NextResponse.json({
      message: "New verification email sent successfully",
    })
  } catch (error) {
    console.error("Resend verification error:", error)
    return NextResponse.json({ error: "Failed to resend verification email" }, { status: 500 })
  }
}
