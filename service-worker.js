const CACHE_NAME = "taskflow-v1";
const urlsToCache = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icons/icon-72x72.png",
  "./icons/icon-96x96.png",
  "./icons/icon-128x128.png",
  "./icons/icon-144x144.png",
  "./icons/icon-152x152.png",
  "./icons/icon-192x192.png",
  "./icons/icon-384x384.png",
  "./icons/icon-512x512.png",
];

// Install Service Worker
self.addEventListener("install", (event) => {
  console.log("[ServiceWorker] Installing...");
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("[ServiceWorker] Caching app shell");
        // Use addAll with error handling
        return cache.addAll(urlsToCache).catch((error) => {
          console.error("[ServiceWorker] Cache addAll failed:", error);
          // Try to add files individually to identify which ones fail
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

// Fetch Strategy: Cache First with Network Fallback
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        console.log("[ServiceWorker] Serving from cache:", event.request.url);
        return cachedResponse;
      }

      console.log("[ServiceWorker] Fetching from network:", event.request.url);
      return fetch(event.request)
        .then((response) => {
          // Don't cache non-successful responses
          if (
            !response ||
            response.status !== 200 ||
            response.type !== "basic"
          ) {
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
        .catch((error) => {
          console.error("[ServiceWorker] Fetch failed:", error);
          // Return cached index.html as fallback
          return caches.match("./index.html");
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
    icon: "./icons/icon-192x192.png",
    badge: "./icons/icon-192x192.png",
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
  event.waitUntil(clients.openWindow("./"));
});
