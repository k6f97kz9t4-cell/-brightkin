'use strict';
const CACHE='brightkin-github-20260829-3';
const ROOT=new URL('./',self.location.href);
const url=p=>new URL(p,ROOT).href;
const CORE=['','index.html','app.js','mission-fresh.js','mission-runtime.js','manifest.json','icon.svg'].map(url);
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  e.respondWith(fetch(e.request).then(r=>{if(r.ok){const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));}return r}).catch(()=>caches.match(e.request).then(r=>r||caches.match(url('index.html')))));
});
