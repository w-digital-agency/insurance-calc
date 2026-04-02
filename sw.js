/* 離線後備：文件優先走網絡以免舊版快取；其餘先快取（僅 manifest 等） */
const CACHE = 'ins-calc-v3';

function assetUrl(path) {
  return new URL(path, self.location).href;
}

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE).then((cache) =>
      cache.addAll([assetUrl('index.html'), assetUrl('feedback.html'), assetUrl('manifest.json')]).catch(() => {})
    )
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  if (event.request.destination === 'document') {
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(assetUrl('index.html'), copy));
          }
          return res;
        })
        .catch(() => caches.match(assetUrl('index.html')))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((hit) => hit || fetch(event.request))
  );
});
