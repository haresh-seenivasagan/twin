/**
 * Simple in-memory token storage for development.
 * In production, use encrypted session storage or database.
 */

interface TokenData {
  access_token: string
  refresh_token?: string
  expires_at?: number
}

// Store tokens by email: { "user@example.com": { access_token: "...", refresh_token: "..." } }
const tokenStore = new Map<string, TokenData>()

export function storeToken(email: string, tokenData: TokenData) {
  tokenStore.set(email, tokenData)
}

export function getToken(email: string): TokenData | undefined {
  return tokenStore.get(email)
}

export function removeToken(email: string): boolean {
  return tokenStore.delete(email)
}

export function hasToken(email: string): boolean {
  return tokenStore.has(email)
}

export function getAllEmails(): string[] {
  return Array.from(tokenStore.keys())
}
