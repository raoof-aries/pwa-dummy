// register service worker
if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    try {
      const reg = await navigator.serviceWorker.register("/service-worker.js");
      console.log("Service Worker registered:", reg.scope);
    } catch (err) {
      console.error("SW registration failed:", err);
    }
  });
}

// beforeinstallprompt flow
let deferredPrompt;
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;
  document.getElementById("notifyBtn").textContent = "Install App";
  console.log("beforeinstallprompt saved");
});

// install button
document.getElementById("notifyBtn").addEventListener("click", async () => {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    console.log("User choice", choice);
    deferredPrompt = null;
    document.getElementById("notifyBtn").textContent = "Installed";
  } else {
    // For iOS and browsers that don't fire beforeinstallprompt:
    alert(
      "Install not available automatically in this browser. On iOS use Safari → Share → Add to Home Screen. On desktop, check the address bar install icon."
    );
  }
});

// simple smooth reveal for learnMore link
document.getElementById("learnMore").addEventListener("click", (ev) => {
  ev.preventDefault();
  alert(
    "This demo uses a manifest.json + service-worker.js. Service worker caches the app shell and returns offline.html for navigations when offline."
  );
});
