/*
  PorVerse V2 – Offline Manager (Prompt 20)
  - Thin client-side SDK to coordinate with the Service Worker
  - Provides: online status, background-sync queue helpers, SW messaging, cache prewarm
  - Zero external deps; uses minimal IndexedDB helpers mirrored with SW schema
*/

// Public API types
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface QueuedAction {
  id: string;
  url: string;
  method: HttpMethod;
  headers: Record<string, string>;
  body: string | null;
  timestamp: number;
  retryCount: number;
}

export interface SyncResult {
  type: 'SYNC_COMPLETE';
  success: number;
  failed: number;
}

export interface OfflineManagerOptions {
  serviceWorkerPath?: string; // default '/sw.js'
  preCacheUrls?: string[];
  enableLogging?: boolean;
}

// Internal constants (must mirror SW)
const DB_NAME = 'PorVerseOfflineDB';
const DB_VERSION = 1;
const STORE_QUEUE = 'syncQueue';
const _SYNC_TAG = 'porverse-background-sync';

// Simple logger
const log = (...args: unknown[]) => {
  if (OfflineManager.instance?.options.enableLogging) {
    // eslint-disable-next-line no-console
    console.log('[OfflineManager]', ...args);
  }
};

// IndexedDB helpers (browser only)
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_QUEUE)) {
        db.createObjectStore(STORE_QUEUE, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbGetAll<T = unknown>(store: string): Promise<T[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readonly');
    const req = tx.objectStore(store).getAll();
    req.onsuccess = () => resolve((req.result || []) as T[]);
    req.onerror = () => reject(req.error);
  });
}

async function idbClear(store: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite');
    const req = tx.objectStore(store).clear();
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// Reactive online status (simple event emitter)
class Emitter<T> {
  private listeners = new Set<(v: T) => void>();
  emit(v: T) { this.listeners.forEach((l) => l(v)); }
  on(fn: (v: T) => void) { this.listeners.add(fn); return () => this.listeners.delete(fn); }
}

export class OfflineManager {
  static instance: OfflineManager | null = null;

  public options: OfflineManagerOptions;
  private ready = false;
  private online = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private onlineEmitter = new Emitter<boolean>();
  private syncEmitter = new Emitter<SyncResult>();
  private bc?: BroadcastChannel; // optional BroadcastChannel for SW messages

  private constructor(options?: OfflineManagerOptions) {
    this.options = { serviceWorkerPath: '/sw.js', preCacheUrls: [], enableLogging: false, ...options };
  }

  // Singleton accessor
  static get(opts?: OfflineManagerOptions) {
    if (!OfflineManager.instance) {OfflineManager.instance = new OfflineManager(opts);}
    return OfflineManager.instance;
  }

  // Init: register SW, set up listeners, pre-cache URLs
  async init(): Promise<void> {
    if (this.ready || typeof window === 'undefined') {return;}

    // Online status listeners
    window.addEventListener('online', () => { this.setOnline(true); });
    window.addEventListener('offline', () => { this.setOnline(false); });

    // Service Worker registration
    if ('serviceWorker' in navigator) {
      try {
        const reg = await navigator.serviceWorker.register(this.options.serviceWorkerPath!);
        log('SW registered', reg.scope);
      } catch (e) {
        log('SW registration failed', e);
      }

      // SW messaging: try BroadcastChannel first
      if ('BroadcastChannel' in window) {
        this.bc = new BroadcastChannel('porverse-sw');
        this.bc.onmessage = (ev) => this.handleSWMessage(ev.data);
      }

      // Fallback to navigator.serviceWorker messages
      navigator.serviceWorker.addEventListener('message', (event) => this.handleSWMessage(event.data));

      // Pre-cache URLs (optional)
      if (this.options.preCacheUrls?.length) {
        this.cacheUrls(this.options.preCacheUrls).catch(() => void 0);
      }
    }

    this.ready = true;
  }

  // Online state
  isOnline() { return this.online; }
  onOnlineChange(cb: (v: boolean) => void) { return this.onlineEmitter.on(cb); }
  private setOnline(v: boolean) { this.online = v; this.onlineEmitter.emit(v); }

  // Listen for SW sync results
  onSyncComplete(cb: (r: SyncResult) => void) { return this.syncEmitter.on(cb); }

  // Send a lightweight ping to SW (optional diagnostics)
  async pingSW(timeoutMs = 2000): Promise<{ ok: boolean; sw?: string; app?: string; }>
  {
    if (!navigator.serviceWorker?.controller) {return { ok: false };}
    return new Promise((resolve) => {
      const mc = new MessageChannel();
      const timer = setTimeout(() => resolve({ ok: false }), timeoutMs);
      mc.port1.onmessage = (ev) => {
        clearTimeout(timer);
        resolve({ ok: true, sw: ev.data?.sw, app: ev.data?.app });
      };
      navigator.serviceWorker.controller?.postMessage({ type: 'PING' }, [mc.port2] as any)

    });
  }

  // Ask SW to cache some URLs now (e.g., last visited portal pages)
  async cacheUrls(urls: string[]): Promise<void> {
    if (!navigator.serviceWorker?.controller) {return;}
    navigator.serviceWorker.controller.postMessage({ type: 'CACHE_URLS', payload: { urls } });
  }

  // Queue writes if offline; otherwise perform fetch normally
  async fetchWithQueue(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const req = new Request(input, init);

    if (req.method === 'GET') {
      return fetch(req);
    }

    if (this.isOnline()) {
      try { return await fetch(req); } catch (e) { /* fall through to queue */ }
    }

    // Build minimal payload to mirror SW queue item
    const bodyText = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)
      ? await req.clone().text()
      : null;

    const queued: QueuedAction = {
      id: crypto.randomUUID(),
      url: req.url,
      method: req.method as HttpMethod,
      headers: Object.fromEntries(req.headers.entries()),
      body: bodyText,
      timestamp: Date.now(),
      retryCount: 0
    };

    // Save locally so UI can reflect queued items even before SW handles it
    await this.dbAdd(STORE_QUEUE, queued);

    // Forward to SW to persist + schedule Background Sync
    if (navigator.serviceWorker?.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'QUEUE_ACTION', payload: queued });
    }

    // Synthetic 202 Accepted response for UI optimism
    return new Response(JSON.stringify({ queued: true, offline: true, id: queued.id }), {
      status: 202,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Queue inspection (UI badges, etc.)
  async getQueue(): Promise<QueuedAction[]> { return idbGetAll<QueuedAction>(STORE_QUEUE); }
  async clearQueue(): Promise<void> { return idbClear(STORE_QUEUE); }

  // ===== local IDB mirror (optional, for UI state) =====
  private async dbAdd(store: string, value: unknown): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(store, 'readwrite');
      tx.objectStore(store).put(value as any);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  // Process messages coming from the Service Worker
  private handleSWMessage(data: any) {
    if (!data) {return;}

    if (data.type === 'SYNC_COMPLETE') {
      // Clear our local mirror so UI reflects latest state; SW is the source of truth
      this.clearQueue().catch(() => void 0);
      this.syncEmitter.emit(data as SyncResult);
      log('Background sync complete', data);
      return;
    }

    if (data.type === 'ONLINE_STATUS') {
      if (typeof data.online === 'boolean') {this.setOnline(data.online);}
      return;
    }
  }
}

// Default exported singleton for convenience
export const offlineManager = OfflineManager.get({ enableLogging: false });

// Convenience: call once in app root (e.g., in a Provider or layout effect)
export async function initializeOffline(options?: OfflineManagerOptions) {
  const mgr = OfflineManager.get(options);
  await mgr.init();
  return mgr;
}
