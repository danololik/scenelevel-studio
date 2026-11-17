const CACHE = 'scenelevel-studio-v101';
const ASSETS = ['./', './index.html', './styles.css?v=1.0.1', './app.js?v=1.0.1', './manifest.webmanifest', './assets/icon.svg', './assets/logo_name_white.svg', './assets/logo_name_colour.svg'];
self.addEventListener('install', event => { event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS))); self.skipWaiting(); });
self.addEventListener('activate', event => { event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k=>k.startsWith('scenelevel-studio-v')&&k!==CACHE).map(k=>caches.delete(k))))); self.clients.claim(); });
self.addEventListener('fetch', event => { const u=new URL(event.request.url); if(event.request.method!=='GET'||u.origin!==location.origin) return; event.respondWith(fetch(event.request).then(response=>{if(response.ok){const clone=response.clone(); caches.open(CACHE).then(cache=>cache.put(event.request,clone));}return response;}).catch(()=>caches.match(event.request))); });
