const CACHE='fiverrtask-offline-ca687fb494af';
const ASSETS=["/offline.html","/icon-192.png","/icon-512.png","/icon-maskable.png","/apple-touch-icon.png","/manifest.webmanifest"];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>(k.startsWith('fiverrtask-offline-')||k.startsWith('fivertask-offline-'))&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('message',event=>{if(event.data==='OFFLINE_READY')event.ports[0]?.postMessage({ready:true})});
self.addEventListener('fetch',event=>{
 const request=event.request,url=new URL(request.url);
 if(request.method!=='GET'||url.origin!==self.location.origin)return;
 if(request.mode==='navigate'){
  event.respondWith((async()=>{try{const response=await fetch(request);if(response.ok)return response;throw Error('Unavailable')}catch{return (await caches.match('/offline.html'))||Response.error()}})());return;
 }
 if(ASSETS.includes(url.pathname))event.respondWith(caches.match(request).then(cached=>cached||fetch(request)));
});
