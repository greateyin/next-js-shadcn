import { NextResponse } from "next/server"
import { headers } from "./config"
import { logger } from "@/lib/serverLogger"

/**
 * Apply security headers to a response
 * @param response NextResponse object to add headers to
 * @param type Type of headers to apply ("default" | "auth")
 */
export function applySecurityHeaders(
  response: NextResponse,
  type: keyof typeof headers = "default"
): void {
  try {
    const headersToApply = headers[type]
    
    for (const [key, value] of Object.entries(headersToApply)) {
      response.headers.set(key, value)
    }

    logger.debug("Applied security headers", { type })
  } catch (error) {
    const typedError = error as Error
    logger.error("Error applying security headers", {
      error: typedError.message,
      stack: typedError.stack,
      type
    })
  }
}

/**
 * Create a response with security headers
 * @param body Response body
 * @param init Response initialization options
 * @param headerType Type of headers to apply
 */
export function createSecureResponse(
  body?: BodyInit | null,
  init?: ResponseInit,
  headerType: keyof typeof headers = "default"
): NextResponse {
  try {
    const response = new NextResponse(body, init)
    applySecurityHeaders(response, headerType)
    return response
  } catch (error) {
    const typedError = error as Error
    logger.error("Error creating secure response", {
      error: typedError.message,
      stack: typedError.stack,
      headerType
    })
    return new NextResponse(
      JSON.stringify({ error: "Internal Server Error" }),
      { status: 500 }
    )
  }
}
