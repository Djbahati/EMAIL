import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, status, message, timestamp, user_agent } = body

    // Log verification attempt
    const { error } = await supabase.from("verification_logs").insert({
      username,
      action: "email_verification",
      status,
      message,
      ip_address: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown",
      user_agent: user_agent || request.headers.get("user-agent") || "unknown",
      created_at: timestamp || new Date().toISOString(),
    })

    if (error) {
      console.error("Failed to log verification attempt:", error)
      return NextResponse.json({ error: "Logging failed" }, { status: 500 })
    }

    return NextResponse.json({ message: "Logged successfully" })
  } catch (error) {
    console.error("Verification logging error:", error)
    return NextResponse.json({ error: "Logging failed" }, { status: 500 })
  }
}
