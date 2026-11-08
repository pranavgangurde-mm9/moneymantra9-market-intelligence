/* MoneyMantra 9 Market Intelligence: website navigation reliability hotfix */
const CACHE_NAME = 'mm9-static-assets-20261108-r531-app-info';
const STATIC_ASSETS = ['./brand-logo.png','./icon-192.png','./icon-512.png','./manifest.json'];
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache=await caches.open(CACHE_NAME);
    // Missing assets should never block service worker installation.
    await Promise.allSettled(STATIC_ASSETS.map(async path => {
      const response=await fetch(path,{cache:'no-store'});
      if(response.ok) await cache.put(path,response);
    }));
    await self.skipWaiting();
  })());
});
self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(key=>key.startsWith('mm9-')&&key!==CACHE_NAME).map(key=>caches.delete(key)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch',event=>{
  const req=event.request;
  if(req.method!=='GET') return;
  const url=new URL(req.url);
  if(url.origin!==self.location.origin)return;
  // Let browser directly load all HTML pages, navigation, APIs and configuration.
  // This prevents stale policy pages and confusing never-ending page loads.
  if(req.mode==='navigate' || req.destination==='document' || /\.html$/i.test(url.pathname) || /\.(?:js|json)$/i.test(url.pathname))return;
  if(!STATIC_ASSETS.some(path=>url.pathname.endsWith(path.slice(1))))return;
  event.respondWith((async()=>{
    const cache=await caches.open(CACHE_NAME);
    const cached=await cache.match(req);
    if(cached)return cached;
    const response=await fetch(req);
    if(response.ok)await cache.put(req,response.clone());
    return response;
  })());
});
