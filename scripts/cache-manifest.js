import { readdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
async function walk(path, prefix = '') {
  const entries = await readdir(path, { withFileTypes: true });
  const result = [];
  for (const entry of entries) {
    if (entry.name === 'service-worker.js') continue;
    const relative = `${prefix}/${entry.name}`;
    if (entry.isDirectory()) result.push(...await walk(join(path, entry.name), relative));
    else result.push(relative);
  }
  return result;
}
const files = (await walk('dist')).sort();
const hash = createHash('sha256');
hash.update(await readFile('scripts/cache-manifest.js'));
for (const file of files) hash.update(await readFile(join('dist', file)));
const version = hash.digest('hex').slice(0, 14);
await writeFile('dist/service-worker.js', `/* Generated app-shell cache; no user data is stored here. */
const CACHE = 'sakinah-${version}';
const ASSETS = ${JSON.stringify(['/', ...files])};
self.addEventListener('install', event => { event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS))); });
self.addEventListener('activate', event => { event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('sakinah-') && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;
  event.respondWith(caches.open(CACHE).then(async cache => {
    // Static module requests can carry Origin while addAll does not. Vite's
    // Vary: Origin response must not turn a precached module into an offline miss.
    const cached = await cache.match(event.request, { ignoreSearch: true, ignoreVary: true });
    if (cached) return cached;
    try { return await fetch(event.request); }
    catch (error) { if (event.request.mode === 'navigate') return cache.match('/index.html', { ignoreVary: true }); throw error; }
  }));
});
`);
console.log(`Offline shell generated: ${files.length} assets, version ${version}`);
