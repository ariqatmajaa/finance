// Finance — service worker: aplikasi tetap bisa dibuka tanpa internet
const VERSION = "fa-v56";
const SHELL = ["./", "./index.html", "./manifest.webmanifest",
  "./icons/icon-192.png", "./icons/icon-512.png", "./icons/apple-touch-icon.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  // Halaman utama: ambil versi terbaru kalau ada internet, kalau tidak pakai simpanan
  if (req.mode === "navigate") {
    // Hanya simpan halaman yang berhasil dimuat; kalau gagal/404, pakai versi simpanan
    e.respondWith(fetch(req).then(res => {
        if (res.ok) { const c = res.clone(); caches.open(VERSION).then(x => x.put("./index.html", c)); return res; }
        return caches.match("./index.html").then(hit => hit || res);
      }).catch(() => caches.match("./index.html")));
    return;
  }
  // Font Google: simpan setelah pertama kali dimuat
  if (url.host === "fonts.googleapis.com" || url.host === "fonts.gstatic.com") {
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => { const c = res.clone(); caches.open(VERSION).then(x => x.put(req, c)); return res; })));
    return;
  }
  // File aplikasi lainnya
  if (url.origin === location.origin) {
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => { const c = res.clone(); caches.open(VERSION).then(x => x.put(req, c)); return res; })));
  }
});
