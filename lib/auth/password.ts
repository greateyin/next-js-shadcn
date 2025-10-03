import { verifyPassword as cryptoVerifyPassword } from "@/lib/crypto"

export async function verifyPassword(
  plainPassword: string,
  hashedPassword: string
): Promise<boolean> {
  try {
    return await cryptoVerifyPassword(plainPassword, hashedPassword)
  } catch (error) {
    console.error("Password verification error:", error)
    return false
  }
}