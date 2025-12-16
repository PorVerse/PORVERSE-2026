// lib/telemetry/server.ts
/**
 * Helper server-only pentru telemetrie.
 * Trimite evenimentele către endpointurile interne (dacă există),
 * cu fallback la console în dev.
 */

type TelemetryPayload = Record<string, unknown> & { ts?: string }

const LOGS_ENDPOINT = '/api/telemetry/logs'
const METRICS_ENDPOINT = '/api/telemetry/metrics'

function siteUrl() {
  // în runtime server; în dev / local e ok relativ
  return process.env['NEXT_PUBLIC_SITE_URL']?.replace(/\/+$/, '') || ''
}

export async function svLog(event: string, payload: TelemetryPayload = {}) {
  try {
    const url = siteUrl() + LOGS_ENDPOINT
    await fetch(url || LOGS_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // scriem timestamp pe server
      body: JSON.stringify({ level: 'info', event, payload: { ...payload, ts: new Date().toISOString() } }),
      cache: 'no-store',
    })
  } catch (e) {
    if (process.env['NODE_ENV'] !== 'production') {
      console.info('[telemetry/log-fallback]', event, payload)
    }
  }
}

export async function svMetric(name: string, value = 1) {
  try {
    const url = siteUrl() + METRICS_ENDPOINT
    await fetch(url || METRICS_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify([{ name, value }]),
      cache: 'no-store',
    })
  } catch (e) {
    if (process.env['NODE_ENV'] !== 'production') {
      console.info('[telemetry/metric-fallback]', name, value)
    }
  }
}
