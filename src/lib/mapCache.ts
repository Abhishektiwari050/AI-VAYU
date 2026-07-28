/**
 * Offline Map Tile & GeoJSON Cache Storage
 * Project VAYU — Cockpit Offline Capabilities
 *
 * Persists aeronautical GeoJSON data and map tiles locally in IndexedDB
 * for 100% offline airborne cockpit operation.
 */

const DB_NAME = 'VAYU_OFFLINE_MAP_DB';
const DB_VERSION = 1;
const STORE_NAME = 'geojson_features';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      return reject(new Error('IndexedDB not supported'));
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'icao' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveMapCache(icao: string, data: any): Promise<void> {
  try {
    const db = await openDb();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put({
      icao: icao.toUpperCase(),
      data,
      timestamp: Date.now(),
    });
  } catch (err) {
    console.warn('[MapCache] Failed to save offline map cache:', err);
  }
}

export async function getMapCache(icao: string): Promise<any | null> {
  try {
    const db = await openDb();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(icao.toUpperCase());

    return new Promise((resolve) => {
      request.onsuccess = () => {
        const result = request.result;
        if (result && result.data) {
          resolve(result.data);
        } else {
          resolve(null);
        }
      };
      request.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}
