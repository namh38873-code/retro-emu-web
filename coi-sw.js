// Pixcade app service worker (scope: the whole app folder).
// GitHub Pages cannot send COOP/COEP headers, so this worker re-serves the
// app with them (COOP same-origin + COEP credentialless), which makes the
// app cross-origin isolated - required for the threaded PSP core
// (SharedArrayBuffer). The login helper pages (applogin, admin) are
// deliberately excluded so Google sign-in keeps its normal flow there.
// Cross-origin requests (API, emulator CDN) are never intercepted.
self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (e) { e.waitUntil(self.clients.claim()); });

var EXCLUDED = ['applogin.html', 'admin.html'];

self.addEventListener('fetch', function (e) {
  var url;
  try { url = new URL(e.request.url); } catch (err) { return; }
  if (url.origin !== self.location.origin) return;
  var base = url.pathname.split('/').pop();
  if (EXCLUDED.indexOf(base) !== -1) return;
  e.respondWith(fetch(e.request).then(function (resp) {
    if (resp.status >= 300 && resp.status < 400) return resp;
    var h = new Headers(resp.headers);
    h.set('Cross-Origin-Opener-Policy', 'same-origin');
    h.set('Cross-Origin-Embedder-Policy', 'credentialless');
    h.set('Cross-Origin-Resource-Policy', 'cross-origin');
    return new Response(resp.body, { status: resp.status, statusText: resp.statusText, headers: h });
  }));
});
