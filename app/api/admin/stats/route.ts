import { type NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth"
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("auth-token")?.value

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    if (!decoded || decoded.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    // Get user count
    const { count: userCount } = await supabase.from("users").select("*", { count: "exact", head: true })

    // Get email account count
    const { count: emailCount } = await supabase.from("email_accounts").select("*", { count: "exact", head: true })

    // Get storage stats
    const { data: storageData } = await supabase.from("email_accounts").select("storage_used_mb, storage_quota_mb")

    const totalStorageUsed = storageData?.reduce((sum, account) => sum + account.storage_used_mb, 0) || 0
    const totalStorageQuota = storageData?.reduce((sum, account) => sum + account.storage_quota_mb, 0) || 0

    return NextResponse.json({
      stats: {
        totalUsers: userCount || 0,
        totalEmailAccounts: emailCount || 0,
        totalStorageUsed,
        totalStorageQuota,
      },
    })
  } catch (error) {
    console.error("Admin stats fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 })
  }
}
