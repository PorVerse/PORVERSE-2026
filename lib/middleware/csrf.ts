/**
 * CSRF Protection Middleware - Web Crypto API (Edge Runtime Compatible)
 */

import { NextRequest, NextResponse } from 'next/server'

const CSRF_SECRET = process.env['CSRF_SECRET'] || 'default-secret-change-in-production'

async function generateToken(sessionId: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(`${sessionId}-${CSRF_SECRET}-${Date.now()}`)
  
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  
  const randomBytes = new Uint8Array(16)
  crypto.getRandomValues(randomBytes)
  const randomPart = Array.from(randomBytes).map(b => b.toString(16).padStart(2, '0')).join('')
  
  return `${randomPart}.${hashHex.substring(0, 32)}`
}

async function verifyToken(token: string, sessionId: string): Promise<boolean> {
  if (!token || !token.includes('.')) return false
  
  const [randomPart, receivedHash] = token.split('.')
  const encoder = new TextEncoder()
  const data = encoder.encode(`${sessionId}-${CSRF_SECRET}-${randomPart}`)
  
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const expectedHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 32)
  
  return expectedHash === receivedHash
}

export async function csrfProtection(request: NextRequest): Promise<NextResponse | null> {
  const method = request.method.toUpperCase()
  
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
    const pathname = request.nextUrl.pathname
    
    if (pathname.includes('/webhook') || pathname.includes('/callback')) {
      return null
    }
    
    const token = request.headers.get('x-csrf-token')
    const cookies = request.cookies
    const sessionCookie = cookies.get('sb-access-token')
    
    if (!sessionCookie?.value) {
      return NextResponse.json({ error: 'No session' }, { status: 401 })
    }
    
    const isValid = await verifyToken(token || '', sessionCookie.value)
    
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 })
    }
  }
  
  return null
}

export async function generateCsrfToken(sessionId: string): Promise<string> {
  return generateToken(sessionId)
}

export async function validateCsrfForRoute(request: NextRequest): Promise<boolean> {
  const method = request.method.toUpperCase()
  
  if (!['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
    return true
  }
  
  const pathname = request.nextUrl.pathname
  if (pathname.includes('/webhook') || pathname.includes('/callback')) {
    return true
  }
  
  const token = request.headers.get('x-csrf-token')
  const sessionCookie = request.cookies.get('sb-access-token')
  
  if (!sessionCookie?.value) return false
  
  return verifyToken(token || '', sessionCookie.value)
}