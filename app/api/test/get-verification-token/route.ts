import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  // Only allow this in development
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const username = searchParams.get("username")

  if (!username) {
    return NextResponse.json({ error: "Username parameter required" }, { status: 400 })
  }

  try {
    const { data: user, error } = await supabase
      .from("users")
      .select("username, verification_token, is_verified")
      .eq("username", username)
      .single()

    if (error || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({
      username: user.username,
      verification_token: user.verification_token,
      is_verified: user.is_verified,
      verification_url: user.verification_token
        ? `${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${user.verification_token}`
        : null,
    })
  } catch (error) {
    console.error("Error fetching verification token:", error)
    return NextResponse.json({ error: "Failed to fetch verification token" }, { status: 500 })
  }
}
