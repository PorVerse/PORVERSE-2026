"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { OfflineManager, offlineManager, initializeOffline } from "@/lib/offline/offline-manager";

export interface UseOfflineSyncOptions {
  /** Pre-cache these URLs on mount (e.g., last visited pages, assets) */
  preCacheUrls?: string[];
  /** Enable console logs for debugging */
  debug?: boolean;
}

export interface SyncState {
  isReady: boolean;
  isOnline: boolean;
  queuedCount: number;
  lastSync?: { success: number; failed: number } | null;
  /** Versions returned by SW ping (diagnostics) */
  versions?: { sw?: string; app?: string } | null;
}

/**
 * useOfflineSync – React hook for Offline-First UI glue
 * - Initializes OfflineManager (registers Service Worker)
 * - Tracks online/offline, queue length, background sync results
 * - Offers helpers: queue-safe fetch and cache prewarm
 */
export function useOfflineSync(options?: UseOfflineSyncOptions) {
  const { preCacheUrls, debug } = options || {};

  const mgrRef = useRef<OfflineManager | null>(null);
  const [state, setState] = useState<SyncState>({
    isReady: false,
    isOnline: typeof navigator !== "undefined" ? navigator.onLine : true,
    queuedCount: 0,
    lastSync: null,
    versions: null,
  });

  // Derived UI flags
  const badgeVariant = useMemo(() => (state.isOnline ? "success" : "warning"), [state.isOnline]);

  useEffect(() => {
    let unsubOnline: (() => void) | null = null;
    let unsubSync: (() => void) | null = null;
    let mounted = true;

    (async () => {
      // Initialize Offline core
      mgrRef.current = await initializeOffline({
        enableLogging: !!debug,
        preCacheUrls,
      });

      // Fetch initial queue size
      const q = await offlineManager.getQueue();

      // Ping SW (optional)
      const ping = await offlineManager.pingSW().catch(() => ({ ok: false }));

      if (!mounted) return;
      setState((s) => ({
        ...s,
        isReady: true,
        isOnline: mgrRef.current!.isOnline(),
        queuedCount: q.length,
        versions: ping.ok ? { sw: ping.sw, app: ping.app } : null,
      }));

      // Subscribe to online/offline changes
      unsubOnline = mgrRef.current!.onOnlineChange((online) => {
        setState((s) => ({ ...s, isOnline: online }));
      });

      // Subscribe to sync completion
      unsubSync = mgrRef.current!.onSyncComplete((res) => {
        if (debug) console.log("[useOfflineSync] SYNC_COMPLETE", res);
        setState((s) => ({ ...s, lastSync: { success: res.success, failed: res.failed } }));
        // Refresh queue length after sync
        offlineManager.getQueue().then((list) => setState((s) => ({ ...s, queuedCount: list.length })));
      });

      // Keep queue length current (poll small, low-cost)
      const poll = setInterval(() => {
        offlineManager.getQueue().then((list) => setState((s) => ({ ...s, queuedCount: list.length })));
      }, 2500);

      // Cleanup
      return () => clearInterval(poll);
    })();

    return () => {
      mounted = false;
      unsubOnline?.();
      unsubSync?.();
    };
  }, [preCacheUrls, debug]);

  // Helpers
  const prewarm = async (urls: string[]) => offlineManager.cacheUrls(urls);
  const queuedFetch = async (input: RequestInfo | URL, init?: RequestInit) => offlineManager.fetchWithQueue(input, init);

  return {
    ...state,
    badgeVariant, // for chips/badges coloring in UI
    prewarm,
    queuedFetch,
  } as const;
}

// ---- UI helpers (optional): small status badge ----
export function OfflineStatusBadge({ state }: { state: SyncState }) {
  const color = state.isOnline ? "bg-emerald-500" : "bg-amber-500";
  const title = state.isOnline ? "Online" : "Offline";
  return (
    <span
      className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-medium text-white ${color}`}
      title={state.versions ? `SW ${state.versions.sw ?? "?"} | App ${state.versions.app ?? "?"}` : undefined}
    >
      <Dot className="h-2 w-2" />
      {title}
      {state.queuedCount > 0 && (
        <span className="ml-1 inline-flex items-center justify-center h-4 min-w-4 rounded bg-black/20 px-1">
          {state.queuedCount}
        </span>
      )}
    </span>
  );
}

function Dot(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 8 8" fill="currentColor" aria-hidden="true" {...props}>
      <circle cx="4" cy="4" r="4" />
    </svg>
  );
}

/**
 * Example usage:
 *
 * const offline = useOfflineSync({ preCacheUrls: ["/", "/[lang]/portal-dashboard"], debug: false });
 *
 * return (
 *   <div className="flex items-center gap-2">
 *     <OfflineStatusBadge state={offline} />
 *     {!offline.isOnline && (
 *       <button
 *         className="text-xs underline"
 *         onClick={() => offline.prewarm([location.pathname])}
 *       >
 *         Pre-cache this page
 *       </button>
 *     )}
 *   </div>
 * );
 */
