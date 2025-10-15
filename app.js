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

// show install prompt when available
let deferredPrompt;
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;
  console.log("beforeinstallprompt event saved");
});

document.getElementById("notifyBtn").addEventListener("click", async () => {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    console.log("User choice:", choice);
    deferredPrompt = null;
  } else {
    alert(
      "Install prompt not available. Make sure site is served on localhost or HTTPS, and meets PWA criteria."
    );
  }
});
