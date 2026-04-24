// Service Worker - 彻底禁用缓存，每次都从网络获取最新
self.addEventListener('install', function(event) {
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(keys.map(k => caches.delete(k)));
    }).then(() => self.clients.claim())
  );
});

// 所有请求都直接从网络获取，不使用缓存
self.addEventListener('fetch', function(event) {
  event.respondWith(fetch(event.request));
});
