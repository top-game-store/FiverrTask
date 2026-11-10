import fs from 'node:fs';
import crypto from 'node:crypto';
import ts from 'typescript';
import vm from 'node:vm';
const core=ts.transpileModule(fs.readFileSync('lib/rewriter.ts','utf8').replaceAll('export ',''),{compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.None}}).outputText;
const keywords=fs.readFileSync('lib/keywords.json','utf8');
const template=fs.readFileSync('scripts/offline-template.html','utf8');
const ui=fs.readFileSync('scripts/offline-ui.js','utf8');
const html=template.replace('/* REWRITE_CORE */',()=>core).replace('/* KEYWORDS */',()=>keywords).replace('/* OFFLINE_UI */',()=>ui);
for(const match of html.matchAll(/<script>([\s\S]*?)<\/script>/g))new vm.Script(match[1]);
if(html.includes('\uFFFD'))throw Error('Offline page contains invalid text encoding.');
fs.writeFileSync('public/offline.html',html,'utf8');
const assets=['/offline.html','/icon-192.png','/icon-512.png','/icon-maskable.png','/apple-touch-icon.png','/manifest.webmanifest'];
const version=crypto.createHash('sha256').update(fs.readFileSync('public/offline.html')).digest('hex').slice(0,12);
fs.writeFileSync('public/sw.js',`const CACHE='fiverrtask-offline-${version}';
const ASSETS=${JSON.stringify(assets)};
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
`);
console.log('Generated offline rewriter and versioned service worker.');
