// Minimal service worker — no offline caching yet, this just satisfies
// installability criteria on browsers that still require an active SW.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
self.addEventListener("fetch", () => { }); // passthrough, no-op