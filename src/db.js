import { DEFAULT_SETTINGS } from './data/presets.js';
let database;
export function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('yawm-planner', 1);
    request.onupgradeneeded = () => {
      const store = request.result.createObjectStore('profiles', { keyPath: 'userId' });
      store.createIndex('userId', 'userId', { unique: true });
    };
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error('STORAGE_BLOCKED'));
    request.onsuccess = () => { database = request.result; database.onversionchange = () => database.close(); resolve(); };
  });
}
export function loadProfile(userId) {
  return new Promise((resolve, reject) => {
    const req = database.transaction('profiles').objectStore('profiles').get(userId);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result || emptyProfile(userId));
  });
}
export const emptyProfile = userId => ({ schemaVersion: 1, userId, settings: structuredClone(DEFAULT_SETTINGS), days: {}, tasks: [], notes: {}, fasting: {}, transactions: [], recurringExpenses: [] });
export function saveProfile(profile) {
  return new Promise((resolve, reject) => {
    const tx = database.transaction('profiles', 'readwrite');
    tx.objectStore('profiles').put(profile);
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}
