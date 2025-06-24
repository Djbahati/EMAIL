"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Mail, CheckCircle, XCircle, RefreshCw, Clock, AlertTriangle } from "lucide-react"

type VerificationStatus = "loading" | "retrieving" | "verifying" | "success" | "error" | "expired" | "invalid"

interface VerificationState {
  status: VerificationStatus
  message: string
  progress: number
  canResend: boolean
  username?: string
}

function VerifyEmailContent() {
  const [state, setState] = useState<VerificationState>({
    status: "loading",
    message: "Initializing verification process...",
    progress: 0,
    canResend: false,
  })

  const [resendLoading, setResendLoading] = useState(false)
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get("token")
  const username = searchParams.get("username")

  useEffect(() => {
    if (token) {
      // Direct token verification
      verifyEmailWithToken(token)
    } else if (username) {
      // Retrieve token first, then verify
      retrieveAndVerifyToken(username)
    } else {
      setState({
        status: "error",
        message: "Invalid verification link. Missing token or username parameter.",
        progress: 0,
        canResend: false,
      })
    }
  }, [token, username])

  const updateProgress = (
    status: VerificationStatus,
    message: string,
    progress: number,
    canResend = false,
    username?: string,
  ) => {
    setState({ status, message, progress, canResend, username })
  }

  const retrieveAndVerifyToken = async (username: string) => {
    try {
      updateProgress("retrieving", "Retrieving verification token...", 25)

      const response = await fetch(`/api/test/get-verification-token?username=${encodeURIComponent(username)}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to retrieve verification token")
      }

      if (!data.verification_token) {
        updateProgress("error", "No verification token found. Account may already be verified.", 0, true, username)
        return
      }

      updateProgress("retrieving", "Token retrieved successfully", 50)

      // Small delay for better UX
      await new Promise((resolve) => setTimeout(resolve, 500))

      // Now verify with the retrieved token
      await verifyEmailWithToken(data.verification_token, username)
    } catch (error: any) {
      console.error("Token retrieval error:", error)
      updateProgress("error", error.message || "Failed to retrieve verification token", 0, true, username)

      // Log the error for monitoring
      logVerificationAttempt(username, "token_retrieval_failed", error.message)
    }
  }

  const verifyEmailWithToken = async (verificationToken: string, usernameParam?: string) => {
    try {
      updateProgress("verifying", "Verifying email address...", 75, false, usernameParam)

      const response = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: verificationToken }),
      })

      const data = await response.json()

      if (response.ok) {
        updateProgress("success", "Email verified successfully! You can now sign in to your account.", 100)

        // Log successful verification
        logVerificationAttempt(usernameParam || "unknown", "success", "Email verified successfully")

        // Auto-redirect to login after 3 seconds
        setTimeout(() => {
          router.push("/login")
        }, 3000)
      } else {
        // Handle specific error cases
        if (response.status === 400) {
          if (data.error.includes("expired")) {
            updateProgress(
              "expired",
              "Verification link has expired. Please request a new verification email.",
              0,
              true,
              usernameParam,
            )
          } else if (data.error.includes("Invalid")) {
            updateProgress(
              "invalid",
              "Invalid verification link. Please check your email for the correct link.",
              0,
              true,
              usernameParam,
            )
          } else if (data.error.includes("already verified")) {
            updateProgress("success", "Email is already verified! You can sign in to your account.", 100)
            setTimeout(() => router.push("/login"), 2000)
          } else {
            updateProgress("error", data.error, 0, true, usernameParam)
          }
        } else {
          updateProgress("error", data.error || "Verification failed", 0, true, usernameParam)
        }

        // Log the error
        logVerificationAttempt(usernameParam || "unknown", "failed", data.error)
      }
    } catch (error: any) {
      console.error("Email verification error:", error)
      updateProgress(
        "error",
        "Network error occurred. Please check your connection and try again.",
        0,
        true,
        usernameParam,
      )

      // Log the error
      logVerificationAttempt(usernameParam || "unknown", "network_error", error.message)
    }
  }

  const handleResendVerification = async () => {
    if (!state.username) {
      setState((prev) => ({ ...prev, message: "Cannot resend: username not available" }))
      return
    }

    setResendLoading(true)
    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: state.username }),
      })

      const data = await response.json()

      if (response.ok) {
        setState((prev) => ({
          ...prev,
          message: "New verification email sent! Please check your inbox.",
          canResend: false,
        }))

        // Log resend attempt
        logVerificationAttempt(state.username, "resend_success", "Verification email resent")
      } else {
        setState((prev) => ({
          ...prev,
          message: data.error || "Failed to resend verification email",
        }))

        // Log resend failure
        logVerificationAttempt(state.username, "resend_failed", data.error)
      }
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        message: "Failed to resend verification email. Please try again.",
      }))

      // Log resend error
      logVerificationAttempt(state.username || "unknown", "resend_error", error.message)
    } finally {
      setResendLoading(false)
    }
  }

  const logVerificationAttempt = async (username: string, status: string, message: string) => {
    try {
      await fetch("/api/auth/log-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          status,
          message,
          timestamp: new Date().toISOString(),
          user_agent: navigator.userAgent,
        }),
      })
    } catch (error) {
      console.error("Failed to log verification attempt:", error)
    }
  }

  const getStatusIcon = () => {
    switch (state.status) {
      case "loading":
      case "retrieving":
      case "verifying":
        return <RefreshCw className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-spin" />
      case "success":
        return <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
      case "expired":
        return <Clock className="h-12 w-12 text-orange-600 mx-auto mb-4" />
      case "invalid":
        return <AlertTriangle className="h-12 w-12 text-yellow-600 mx-auto mb-4" />
      case "error":
      default:
        return <XCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
    }
  }

  const getStatusTitle = () => {
    switch (state.status) {
      case "loading":
        return "Loading..."
      case "retrieving":
        return "Retrieving Token..."
      case "verifying":
        return "Verifying Email..."
      case "success":
        return "Email Verified!"
      case "expired":
        return "Link Expired"
      case "invalid":
        return "Invalid Link"
      case "error":
      default:
        return "Verification Failed"
    }
  }

  const getStatusColor = () => {
    switch (state.status) {
      case "success":
        return "text-green-600"
      case "expired":
        return "text-orange-600"
      case "invalid":
        return "text-yellow-600"
      case "error":
        return "text-red-600"
      default:
        return "text-blue-600"
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          {getStatusIcon()}
          <CardTitle className={`text-2xl ${getStatusColor()}`}>{getStatusTitle()}</CardTitle>
          <CardDescription className="text-center">{state.message}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {(state.status === "loading" || state.status === "retrieving" || state.status === "verifying") && (
            <div className="space-y-2">
              <Progress value={state.progress} className="w-full" />
              <p className="text-sm text-center text-gray-600">{state.progress}% complete</p>
            </div>
          )}

          {state.status === "success" && (
            <div className="space-y-3">
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Your email has been successfully verified. You will be redirected to the login page in a few seconds.
                </AlertDescription>
              </Alert>
              <Button asChild className="w-full">
                <Link href="/login">Sign In Now</Link>
              </Button>
            </div>
          )}

          {(state.status === "error" || state.status === "expired" || state.status === "invalid") && (
            <div className="space-y-3">
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>{state.message}</AlertDescription>
              </Alert>

              <div className="flex flex-col space-y-2">
                {state.canResend && state.username && (
                  <Button onClick={handleResendVerification} disabled={resendLoading} className="w-full">
                    {resendLoading ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Mail className="h-4 w-4 mr-2" />
                        Resend Verification Email
                      </>
                    )}
                  </Button>
                )}

                <Button asChild variant="outline" className="w-full bg-white text-gray-900">
                  <Link href="/register">Create New Account</Link>
                </Button>

                <Button asChild variant="outline" className="w-full bg-white text-gray-900">
                  <Link href="/login">Back to Sign In</Link>
                </Button>
              </div>
            </div>
          )}

          <div className="text-center text-sm text-gray-500">
            <p>
              Need help?{" "}
              <Link href="/support" className="text-blue-600 hover:underline">
                Contact Support
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardContent className="flex items-center justify-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
            </CardContent>
          </Card>
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  )
}
