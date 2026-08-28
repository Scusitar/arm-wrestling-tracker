const CACHE="awt-v3.55";
const ASSETS=["./","./index.html","./styles.css","./app.js","./manifest.webmanifest"];
self.addEventListener("install",event=>{event.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting()))});
self.addEventListener("activate",event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener("fetch",event=>{
  const req=event.request;
  if(req.method!=="GET") return;
  const url=new URL(req.url);
  if(url.origin===location.origin && (url.pathname.endsWith(".html")||url.pathname.endsWith(".js")||url.pathname.endsWith(".css")||url.pathname.endsWith(".webmanifest")||url.pathname.endsWith("/"))){
    event.respondWith(fetch(req,{cache:"no-store"}).then(res=>{
      const copy=res.clone(); caches.open(CACHE).then(c=>c.put(req,copy)); return res;
    }).catch(()=>caches.match(req).then(r=>r||caches.match("./index.html"))));
  } else {
    event.respondWith(caches.match(req).then(r=>r||fetch(req)));
  }
});