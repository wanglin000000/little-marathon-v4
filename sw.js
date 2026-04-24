// Service Worker for 小小马拉松 - 强制最新版本
const CACHE_NAME = 'marathon-v4-' + Date.now();

// 要缓存的文件
const urlsToCache = [
  '/',
  '/entry.html',
  '/info.html',
  '/index.html',
  '/finish.html',
  '/admin.html',
  '/dashboard.html'
];

// 安装事件 - 立即激活
self.addEventListener('install', function(event) {
  // 跳过等待，直接激活
  self.skipWaiting();
});

// 激活事件 - 清理旧缓存
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          // 删除所有旧缓存
          if (cacheName.indexOf('marathon-v4') !== -1 && cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(function() {
      // 立即接管所有页面
      return self.clients.matchAll({type: 'window'}).then(function(clients) {
        clients.forEach(function(client) {
          client.navigate(client.url);
        });
      });
    })
  );
});

// 请求拦截 - 始终从网络获取最新
self.addEventListener('fetch', function(event) {
  // 对于HTML请求，始终从网络获取
  if (event.request.headers.get('accept').includes('text/html')) {
    event.respondWith(
      fetch(event.request).then(function(response) {
        // 克隆响应并缓存
        var responseToCache = response.clone();
        caches.open(CACHE_NAME).then(function(cache) {
          cache.put(event.request, responseToCache);
        });
        return response;
      }).catch(function() {
        // 网络失败时从缓存获取
        return caches.match(event.request);
      })
    );
  } else {
    // 其他资源使用缓存优先
    event.respondWith(
      caches.match(event.request).then(function(response) {
        if (response) {
          // 返回缓存但同时更新缓存
          fetch(event.request).then(function(networkResponse) {
            caches.open(CACHE_NAME).then(function(cache) {
              cache.put(event.request, networkResponse);
            });
          });
          return response;
        }
        return fetch(event.request);
      })
    );
  }
});

// 消息监听 - 收到刷新消息时刷新页面
self.addEventListener('message', function(event) {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
});
