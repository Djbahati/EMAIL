import { supabase } from "./supabase" // Assuming supabaseClient is the file where supabase is declared

interface EmailOptions {
  to: string
  subject: string
  html: string
  from?: string
}

export async function sendEmail({ to, subject, html, from = "noreply@x-ticket.com" }: EmailOptions) {
  // In a real implementation, you would use a service like Resend, SendGrid, or AWS SES
  // For demo purposes, we'll simulate sending

  try {
    // Log the email attempt
    const { error } = await supabase.from("email_logs").insert({
      from_address: from,
      to_address: to,
      subject: subject,
      status: "sent",
    })

    if (error) throw error

    // Simulate email sending delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    console.log(`Email sent to ${to}: ${subject}`)
    return { success: true }
  } catch (error) {
    console.error("Failed to send email:", error)
    return { success: false, error }
  }
}

export function generateVerificationEmail(username: string, token: string) {
  const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${token}`

  return {
    subject: "Verify your X-Ticket email account",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Welcome to X-Ticket!</h2>
        <p>Hello ${username},</p>
        <p>Thank you for registering with X-Ticket. Please verify your email address by clicking the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" 
             style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
            Verify Email Address
          </a>
        </div>
        <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
        <p>This verification link will expire in 24 hours.</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 12px;">
          This email was sent by X-Ticket Email System. If you didn't request this verification, please ignore this email.
        </p>
      </div>
    `,
  }
}
