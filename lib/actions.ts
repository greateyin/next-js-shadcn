"use server"

/**
 * Resend verification email to user
 * @param token - Verification token
 * @returns Response with success or error message
 */
export async function resendVerificationEmail(token: string) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/auth/resend-verification`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token }),
    })

    const data = await response.json()

    if (!response.ok) {
      return {
        error: data.error || "Failed to resend verification email",
      }
    }

    return {
      success: "Verification email sent successfully",
    }
  } catch (error) {
    return {
      error: "Something went wrong!",
    }
  }
}
