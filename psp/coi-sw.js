// Pixcade PSP page service worker (scope: this folder only).
// GitHub Pages cannot send COOP/COEP headers, so this worker re-serves this
// folder's pages with them, making the PSP player cross-origin isolated
// (required for the threaded ppsspp core / SharedArrayBuffer). It also proxies
// the EmulatorJS data bundle under data/ so core files load same-origin.
// The main app lives outside this scope and is never touched by this worker.
self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (e) { e.waitUntil(self.clients.claim()); });

var CDN = 'https://cdn.emulatorjs.org/stable/data/';

function withIsoHeaders(resp) {
  var h = new Headers(resp.headers);
  h.set('Cross-Origin-Opener-Policy', 'same-origin');
  h.set('Cross-Origin-Embedder-Policy', 'require-corp');
  h.set('Cross-Origin-Resource-Policy', 'cross-origin');
  return new Response(resp.body, { status: resp.status, statusText: resp.statusText, headers: h });
}

self.addEventListener('fetch', function (e) {
  var url = new URL(e.request.url);
  if (url.origin === self.location.origin && url.pathname.indexOf('/psp/data/') !== -1) {
    var target = CDN + url.pathname.split('/psp/data/')[1];
    e.respondWith(fetch(target).then(withIsoHeaders));
    return;
  }
  e.respondWith(fetch(e.request).then(function (resp) {
    if (resp.status >= 300 && resp.status < 400) return resp;
    return withIsoHeaders(resp);
  }));
});
