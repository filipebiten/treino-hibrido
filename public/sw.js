const CACHE = "th1-v1";

self.addEventListener("install", () => { self.skipWaiting(); });

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  const nav = e.request.mode === "navigate";
  e.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cached = await cache.match(e.request);
      const network = fetch(e.request)
        .then(res => { if (res.ok) cache.put(e.request, res.clone()); return res; })
        .catch(() => cached || Response.error());
      // navegação: rede primeiro (cache só se falhar ou passar de 3s), senão o app fica sempre uma versão atrasado.
      // assets têm hash no nome: cache primeiro.
      if (!nav) return cached || network;
      return cached ? Promise.race([network, new Promise(r => setTimeout(() => r(cached), 3000))]) : network;
    })
  );
});
