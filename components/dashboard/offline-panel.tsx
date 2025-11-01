"use client"

import { useEffect } from "react"
import { logger } from "@/lib/telemetry/logger"
import { metrics } from "@/lib/telemetry/metrics"
import { useOfflineSync, OfflineStatusBadge } from "@/hooks/useOfflineSync"

/**
 * Client-only mini panel for Portal Dashboard
 * - Shows offline/online badge and queued actions count
 * - Logs a view and records a metric on mount
 * - Exposes a demo button that uses queuedFetch to verify offline flow
 */
export function OfflinePanel() {
  const offline = useOfflineSync()

  useEffect(() => {
    logger.info("portal_dashboard.view")
    metrics.inc("page.portal_dashboard.views")
  }, [])

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
      <OfflineStatusBadge state={offline} />
      <button
        className="px-3 py-1.5 rounded-md bg-purple-600 text-white text-sm hover:bg-purple-700"
        onClick={async () => {
          try {
            const res = await offline.queuedFetch("/api/portals/save-responses", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ ping: Date.now() })
            })
            logger.info("dashboard.demoSave", { status: res.status })
          } catch (err) {
            logger.error("dashboard.demoSave.error", err as Error)
          }
        }}
      >
        Demo save (queued if offline)
      </button>
    </div>
  )
}
