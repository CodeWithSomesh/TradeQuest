/**
 * Client-side Deriv API token storage (localStorage).
 * Used when the user enters their token in Dashboard Settings instead of using env.
 */

const STORAGE_KEY = 'deriv_api_token'

export function getDerivToken(): string | null {
  if (typeof window === 'undefined') return null
  try {
    return localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

export function setDerivToken(token: string): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, token.trim())
  } catch {
    // ignore
  }
}

export function clearDerivToken(): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}
