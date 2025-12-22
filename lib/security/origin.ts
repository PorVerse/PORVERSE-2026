// lib/security/origin.ts
/**
 * Verifică că cererea POST vine din aceeași origine (Origin/Referer).
 * Dev: relaxăm dacă nu există header.
 */
export function verifySameOrigin(req: Request, allowedOrigin: string): boolean {
  try {
    const h = req.headers
    const origin = h.get('origin') || ''
    const referer = h.get('referer') || ''
    if (!allowedOrigin) {return true} // dacă nu avem configurat site url, nu blocăm
    if (!origin && !referer) {
      // În dev local, multe browsere omit origin la fetch. Fii permisiv pe localhost.
      const url = new URL(allowedOrigin)
      if (url.hostname === 'localhost') {return true}
    }
    if (origin && !origin.startsWith(allowedOrigin)) {return false}
    if (referer && !referer.startsWith(allowedOrigin)) {return false}
    return true
  } catch {
    return false
  }
}
