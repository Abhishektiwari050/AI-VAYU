import { BriefingSummary } from '../types';

export interface OfflineBriefingRecord {
  icao: string;
  tailNumber?: string;
  savedAtUtc: string;
  briefing: BriefingSummary;
}

const DB_NAME = 'VAYU_COCKPIT_OFFLINE_DB';
const DB_VERSION = 1;
const STORE_NAME = 'briefings';

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB is not available in this environment.'));
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'icao' });
        store.createIndex('savedAtUtc', 'savedAtUtc', { unique: false });
        store.createIndex('tailNumber', 'tailNumber', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Save briefing payload into IndexedDB cockpit cache
 */
export async function saveBriefingOffline(
  briefing: BriefingSummary,
  tailNumber?: string
): Promise<boolean> {
  try {
    const db = await openDatabase();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    const record: OfflineBriefingRecord = {
      icao: briefing.icao.toUpperCase(),
      tailNumber: tailNumber || 'VT-VAYU',
      savedAtUtc: new Date().toISOString(),
      briefing,
    };

    return new Promise((resolve, reject) => {
      const req = store.put(record);
      req.onsuccess = () => {
        // Also sync to localStorage as secondary backup
        try {
          localStorage.setItem(`vayu_offline_${record.icao}`, JSON.stringify(record));
        } catch {}
        resolve(true);
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('[OfflineSync] IndexedDB write fallback to localStorage:', err);
    try {
      const record: OfflineBriefingRecord = {
        icao: briefing.icao.toUpperCase(),
        tailNumber: tailNumber || 'VT-VAYU',
        savedAtUtc: new Date().toISOString(),
        briefing,
      };
      localStorage.setItem(`vayu_offline_${record.icao}`, JSON.stringify(record));
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Retrieve cached briefing for specific airport ICAO
 */
export async function getOfflineBriefing(icao: string): Promise<OfflineBriefingRecord | null> {
  const code = icao.toUpperCase();
  try {
    const db = await openDatabase();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);

    return new Promise((resolve) => {
      const req = store.get(code);
      req.onsuccess = () => {
        if (req.result) {
          resolve(req.result as OfflineBriefingRecord);
        } else {
          // Fallback to localStorage lookup
          const local = localStorage.getItem(`vayu_offline_${code}`);
          resolve(local ? JSON.parse(local) : null);
        }
      };
      req.onerror = () => {
        const local = localStorage.getItem(`vayu_offline_${code}`);
        resolve(local ? JSON.parse(local) : null);
      };
    });
  } catch (err) {
    const local = localStorage.getItem(`vayu_offline_${code}`);
    return local ? JSON.parse(local) : null;
  }
}

/**
 * Retrieve all cached offline briefings stored in IndexedDB
 */
export async function getAllOfflineBriefings(): Promise<OfflineBriefingRecord[]> {
  try {
    const db = await openDatabase();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);

    return new Promise((resolve) => {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result as OfflineBriefingRecord[]);
      req.onerror = () => resolve([]);
    });
  } catch (err) {
    return [];
  }
}

/**
 * Get network connectivity status & last sync timestamp
 */
export function getOfflineStatus(): { isOffline: boolean; connectionType: string } {
  const isOffline = typeof navigator !== 'undefined' ? !navigator.onLine : false;
  const connectionType = typeof navigator !== 'undefined' && (navigator as any).connection
    ? (navigator as any).connection.effectiveType || '4g'
    : 'standard';

  return { isOffline, connectionType };
}

/**
 * Register global listener for network status changes (Online/Offline)
 */
export function registerOfflineSyncListener(onStatusChange: (isOffline: boolean) => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const handleOnline = () => onStatusChange(false);
  const handleOffline = () => onStatusChange(true);

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}
