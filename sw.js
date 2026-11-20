/* Service worker: ใช้งานออฟไลน์ได้หลังเปิดครั้งแรก */
const VERSION = "wol-v8";
const SHELL = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./icon-maskable-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// เปิดหน้าเว็บ: ลองเครือข่ายก่อน (ได้เวอร์ชันล่าสุด) ถ้าออฟไลน์ใช้แคช
// ไฟล์อื่น (ฟอนต์ ไอคอน): ใช้แคชก่อน แล้วอัปเดตเบื้องหลัง
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET" || !req.url.startsWith("http")) return;
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req).then(res => { const copy = res.clone(); caches.open(VERSION).then(c => c.put("./index.html", copy)); return res; })
        .catch(() => caches.match("./index.html"))
    );
    return;
  }
  e.respondWith(
    caches.match(req).then(hit => {
      const net = fetch(req).then(res => {
        if (res.ok || res.type === "opaque") { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
        return res;
      }).catch(() => hit);
      return hit || net;
    })
  );
});
