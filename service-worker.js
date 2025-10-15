const CACHE_NAME = "taskflow-v1";
const urlsToCache = ["/", "/index.html", "/manifest.json"];

// Install Service Worker
self.addEventListener("install", (event) => {
  console.log("[ServiceWorker] Installing...");
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("[ServiceWorker] Caching app shell");
        return cache.addAll(urlsToCache).catch((error) => {
          console.error("[ServiceWorker] Cache addAll failed:", error);
          return Promise.all(
            urlsToCache.map((url) => {
              return cache.add(url).catch((err) => {
                console.error(`[ServiceWorker] Failed to cache ${url}:`, err);
              });
            })
          );
        });
      })
      .catch((error) => {
        console.error("[ServiceWorker] Cache open failed:", error);
      })
  );
  self.skipWaiting();
});

// Activate Service Worker
self.addEventListener("activate", (event) => {
  console.log("[ServiceWorker] Activating...");
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log("[ServiceWorker] Removing old cache:", cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Fetch Strategy: Network First with Cache Fallback
self.addEventListener("fetch", (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Don't cache non-successful responses
        if (!response || response.status !== 200 || response.type !== "basic") {
          return response;
        }

        // Clone the response
        const responseToCache = response.clone();

        // Cache the new response
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return response;
      })
      .catch(() => {
        // If network fails, try cache
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            console.log(
              "[ServiceWorker] Serving from cache:",
              event.request.url
            );
            return cachedResponse;
          }
          // Return cached index.html as fallback
          return caches.match("/index.html");
        });
      })
  );
});

// Background Sync (optional)
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-tasks") {
    console.log("[ServiceWorker] Background sync triggered");
    event.waitUntil(syncTasks());
  }
});

async function syncTasks() {
  console.log("[ServiceWorker] Syncing tasks...");
  // Implement your sync logic here if needed
}

// Push Notifications (optional)
self.addEventListener("push", (event) => {
  const title = "TaskFlow";
  const options = {
    body: event.data ? event.data.text() : "You have a new notification",
    icon: "/icon-192x192.png",
    badge: "/icon-192x192.png",
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  console.log("[ServiceWorker] Notification click received");
  event.notification.close();
  event.waitUntil(clients.openWindow("/"));
});
