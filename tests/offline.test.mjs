import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('../public/sw.js',import.meta.url),'utf8');
function worker(fetcher){const handlers={},entries=new Map(),deleted=[];let claimed=false;const cache={addAll:async paths=>{for(const path of paths)entries.set(path,{url:path})}};const context={URL,Response,Error,Promise,fetch:fetcher,caches:{open:async()=>cache,match:async path=>entries.get(typeof path==='string'?path:new URL(path.url).pathname),keys:async()=>['fiverrtask-offline-old','unrelated-cache'],delete:async key=>deleted.push(key)},self:{location:{origin:'https://fiverrtask.example'},addEventListener:(name,fn)=>handlers[name]=fn,skipWaiting:async()=>{},clients:{claim:async()=>{claimed=true}}}};vm.runInNewContext(source,context);return {handlers,entries,deleted,claimed:()=>claimed}}
test('offline install precaches a complete standalone rewriter and activation only removes old app caches',async()=>{const w=worker();let task;w.handlers.install({waitUntil:p=>task=p});await task;assert.ok(w.entries.has('/offline.html'));assert.ok(w.entries.has('/manifest.webmanifest'));assert.ok(w.entries.has('/icon-maskable.png'));w.handlers.activate({waitUntil:p=>task=p});await task;assert.deepEqual(w.deleted,['fiverrtask-offline-old']);assert.equal(w.claimed(),true)});
test('offline navigations open the cached rewriter while Firebase requests bypass the worker',async()=>{const w=worker(async()=>{throw Error('offline')});w.entries.set('/offline.html',{offline:true});let response;w.handlers.fetch({request:{url:'https://fiverrtask.example/?view=projects',method:'GET',mode:'navigate'},respondWith:p=>response=p});assert.deepEqual(await response,{offline:true});response=undefined;w.handlers.fetch({request:{url:'https://firestore.googleapis.com/private',method:'GET'},respondWith:p=>response=p});assert.equal(response,undefined)});
test('online navigation stays fresh and asset requests use the offline cache',async()=>{const fresh={fresh:true},w=worker(async()=>({...fresh,ok:true}));let response;w.handlers.fetch({request:{url:'https://fiverrtask.example/',method:'GET',mode:'navigate'},respondWith:p=>response=p});assert.equal((await response).fresh,true);w.entries.set('/icon-192.png',{cached:true});w.handlers.fetch({request:{url:'https://fiverrtask.example/icon-192.png',method:'GET'},respondWith:p=>response=p});assert.equal((await response).cached,true)});
test('offline document has no remote scripts and embeds the shared rewrite engine',()=>{const html=fs.readFileSync(new URL('../public/offline.html',import.meta.url),'utf8');assert.ok(!html.includes('/* REWRITE_CORE */'));assert.ok(!/<script[^>]+src=/i.test(html));const core=html.split('<script>')[1].split('const defaults=')[0],context={};vm.runInNewContext(core,context);assert.equal(context.rewriteMessage('Please review the price.',['review','price']).text,'Please r-eview the p-rice.')});
test('complete offline script boots, rewrites edits, counts words and uses embedded SVG icons',()=>{
 const html=fs.readFileSync(new URL('../public/offline.html',import.meta.url),'utf8');
 assert.ok(!html.includes('\uFFFD'));
 assert.ok(html.includes('<title>FiverrTask'));
 assert.match(html, /id="rewrite">Rewrite<svg/);
 const elements=new Map(),storage=new Map();
 const element=()=>({value:'',checked:true,textContent:'',children:[],classList:{toggle(){}},replaceChildren(...children){this.children=children},append(...children){this.children.push(...children)},focus(){},select(){},showModal(){},close(){}});
 const get=id=>{if(!elements.has(id))elements.set(id,element());return elements.get(id)};
 get('random').checked=false;
 const context={document:{getElementById:get,createElement:element,body:{classList:{toggle(){},contains(){return false}}}},localStorage:{getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,value)},matchMedia:()=>({matches:false}),window:{addEventListener(){}},navigator:{onLine:false},console};
 vm.runInNewContext(html.split('<script>')[1].split('</script>')[0],context);
 get('source').value='Please review the price.';get('source').oninput();
 assert.equal(get('result').value,'Please r-eview the p-rice.');
 assert.equal(get('count').textContent,'4 words | 24 characters');
 get('rewrite').onclick();assert.equal(get('status').textContent,'Message rewritten.');
 assert.equal(JSON.parse(storage.get('folio-rewrites')).length,1);
 get('clear').onclick();assert.equal(get('result').value,'');
});
