import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token } = body

    if (!token) {
      return NextResponse.json({ error: "Verification token is required" }, { status: 400 })
    }

    // Find user with verification token
    const { data: user, error: findError } = await supabase
      .from("users")
      .select("*")
      .eq("verification_token", token)
      .single()

    if (findError || !user) {
      // Log failed attempt
      const { error: invalidTokenLogError } = await supabase
        .from("verification_logs")
        .insert({
          username: "unknown",
          action: "email_verification",
          status: "invalid_token",
          message: "Invalid verification token provided",
          ip_address: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown",
          user_agent: request.headers.get("user-agent") || "unknown",
        })

      if (invalidTokenLogError) {
        console.error(invalidTokenLogError)
      }

      return NextResponse.json({ error: "Invalid or expired verification token" }, { status: 400 })
    }

    if (user.is_verified) {
      // Log already verified attempt
      const { error: alreadyVerifiedLogError } = await supabase
        .from("verification_logs")
        .insert({
          username: user.username,
          action: "email_verification",
          status: "already_verified",
          message: "Attempted to verify already verified email",
          ip_address: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown",
          user_agent: request.headers.get("user-agent") || "unknown",
        })

      if (alreadyVerifiedLogError) {
        console.error(alreadyVerifiedLogError)
      }
    }

    // Check if token has expired (if expiration is set)
    if (user.verification_token_expires_at) {
      const expirationTime = new Date(user.verification_token_expires_at)
      const currentTime = new Date()

      if (currentTime > expirationTime) {
        // Log expired token attempt
        const { error: expiredTokenLogError } = await supabase
          .from("verification_logs")
          .insert({
            username: user.username,
            action: "email_verification",
            status: "expired_token",
            message: "Verification token has expired",
            ip_address: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown",
            user_agent: request.headers.get("user-agent") || "unknown",
          })

        if (expiredTokenLogError) {
          console.error(expiredTokenLogError)
        }

        return NextResponse.json(
          { error: "Verification token has expired. Please request a new verification email." },
          { status: 400 },
        )
      }
    }

    // Update user as verified
    const { error: updateError } = await supabase
      .from("users")
      .update({
        is_verified: true,
        verification_token: null,
        verification_token_expires_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)

    if (updateError) {
      // Log update failure
      const { error: updateFailureLogError } = await supabase
        .from("verification_logs")
        .insert({
          username: user.username,
          action: "email_verification",
          status: "update_failed",
          message: `Failed to update user verification status: ${updateError.message}`,
          ip_address: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown",
          user_agent: request.headers.get("user-agent") || "unknown",
        })

      if (updateFailureLogError) {
        console.error(updateFailureLogError)
      }
    }

    // Log successful verification
    const { error: successLogError } = await supabase
      .from("verification_logs")
      .insert({
        username: user.username,
        action: "email_verification",
        status: "success",
        message: "Email verified successfully",
        ip_address: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown",
        user_agent: request.headers.get("user-agent") || "unknown",
      })

    if (successLogError) {
      console.error(successLogError)
    }

    return NextResponse.json({
      message: "Email verified successfully",
    })
  } catch (error) {
    console.error("Email verification error:", error)
    return NextResponse.json({ error: "Verification failed" }, { status: 500 })
  }
}
