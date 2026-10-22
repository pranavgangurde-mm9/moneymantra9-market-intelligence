const CACHE='mm9-india-bullion-ui-racefix-v1';
const STATIC=['./brand-logo.png','./icon-192.png','./icon-512.png','./manifest.json'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(c=>c.addAll(STATIC)).catch(()=>{}));self.skipWaiting();});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));self.clients.claim();});
self.addEventListener('fetch',event=>{
  const r=event.request;if(r.method!=='GET')return;
  const url=new URL(r.url);
  // Always obtain fresh app code and configuration. Market APIs are not intercepted.
  if(url.origin===self.location.origin&&(/\/(index\.html|config\.js)$/.test(url.pathname)||url.pathname.endsWith('/'))){
    event.respondWith(fetch(r,{cache:'no-store'}).catch(()=>caches.match(r)));
    return;
  }
  if(url.origin===self.location.origin){event.respondWith(caches.match(r).then(c=>c||fetch(r)))}
});
