export {}

declare global {
  interface CustomJwtSessionClaims {
    metadata: {
      role?: string
      user_id?: string
      lead_id?: string
    }
  }
}