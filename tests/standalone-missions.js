'use strict';
const fs = require('fs');
const vm = require('vm');
const assert = require('assert');
const path = require('path');
const nodeCrypto = require('crypto');

const elements = new Map();
const selectorState = new Map();
const documentMock = {
  getElementById(id){ return elements.get(id) || null; },
  querySelectorAll(sel){ return selectorState.get(sel) || []; },
  createElement(tag){ return {tagName:tag.toUpperCase(),className:'',style:{},dataset:{},appendChild(){},remove(){},click(){}}; },
  body:{appendChild(){}},
};
const store = new Map();
const context = {
  console,
  document: documentMock,
  localStorage: {getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)},
  navigator: {storage:{}},
  crypto: nodeCrypto.webcrypto,
  Blob, TextEncoder, TextDecoder, Response, Request, URL, structuredClone,
  File: global.File || require('buffer').File,
  FileReader: class {},
  CompressionStream: global.CompressionStream,
  DecompressionStream: global.DecompressionStream,
  AbortSignal,
  fetch: async()=>{ throw new Error('network should not be used by standalone mission tests'); },
  confirm: ()=>true,
  btoa: s=>Buffer.from(s,'binary').toString('base64'),
  atob: s=>Buffer.from(s,'base64').toString('binary'),
  setTimeout: ()=>0,
  clearTimeout: ()=>{},
  queueMicrotask: fn=>fn(),
  indexedDB: {open(){throw new Error('indexedDB not used in these tests')},deleteDatabase(){return {}}},
};
context.window = context;
context.window.scrollTo = ()=>{};
context.window.addEventListener = ()=>{};
context.window.print = ()=>{};
context.URL.createObjectURL = ()=> 'blob:test';
context.URL.revokeObjectURL = ()=>{};
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(__dirname,'..','app.js'),'utf8'), context, {filename:'app.js'});
vm.runInContext(fs.readFileSync(path.join(__dirname,'..','mission-fresh.js'),'utf8'), context, {filename:'mission-fresh.js'});

const evalx = code => vm.runInContext(code, context);
evalx('startDemo()');

const feelings = ['laugh','reconnect','adventure','calm','surprise','learn','celebrate'];
for (const feeling of feelings) {
  evalx(`state.missions = state.missions.filter(m => normalizedFeeling(m.feeling) !== ${JSON.stringify(feeling)});`);
  const generated = [];
  for (let i=0;i<60;i++) {
    const batch = evalx(`localMissionSet({people:['m1','m2'],time:'1 hr',budget:'under $25',energy:'medium',setting:'either',feeling:${JSON.stringify(feeling)}},1)`);
    assert.strictEqual(batch.length,1,`${feeling}: generator must return exactly one requested mission`);
    const m = batch[0];
    generated.push(m);
    assert.strictEqual(m.source,'local-standalone-v3',`${feeling}: new engine must own every generated mission`);
    assert.ok(m.coreId,`${feeling}: mission must identify one standalone core`);
    assert.ok(String(m.activityId).startsWith('standalone:'),`${feeling}: activity ID must be standalone`);
    assert.ok(!String(m.activityId).includes('composite:'),`${feeling}: composite activity IDs are forbidden`);
    assert.ok(!/mash[- ]?up/i.test(m.title),`${feeling}: mash-up titles are forbidden`);
    assert.ok(!/combines? .* into one new activity/i.test(m.why || ''),`${feeling}: composite explanation is forbidden`);
    evalx(`state.missions.unshift(${JSON.stringify(m)}); state.stats.generated += 1;`);
  }

  const titles = generated.map(m=>m.title);
  const variants = generated.map(m=>m.variantKey);
  const activities = generated.map(m=>m.activityId);
  assert.strictEqual(new Set(titles).size,titles.length,`${feeling}: titles must stay unique across 60 repeated clicks`);
  assert.strictEqual(new Set(variants).size,variants.length,`${feeling}: variants must stay unique across 60 repeated clicks`);
  assert.strictEqual(new Set(activities).size,activities.length,`${feeling}: activity identities must stay unique across 60 repeated clicks`);

  const bankSize = evalx(`freshCoreBank(${JSON.stringify(feeling)}).length`);
  assert.ok(bankSize >= 24,`${feeling}: standalone bank must contain at least 24 distinct core activities`);
  assert.strictEqual(new Set(generated.slice(0,bankSize).map(m=>m.coreId)).size,bankSize,`${feeling}: every core must be used before a core repeats`);

  const lastSeen = new Map();
  generated.forEach((m,index)=>{
    if (lastSeen.has(m.coreId)) {
      assert.ok(index-lastSeen.get(m.coreId) >= bankSize,`${feeling}: core ${m.coreId} repeated too soon`);
    }
    lastSeen.set(m.coreId,index);
  });
}

const batch3 = evalx(`localMissionSet({people:['m1','m2'],time:'1 hr',budget:'free',energy:'medium',setting:'either',feeling:'laugh'},3)`);
assert.strictEqual(batch3.length,3,'three requested ideas must still return three');
assert.strictEqual(new Set(batch3.map(m=>m.coreId)).size,3,'a multi-idea request must return three different standalone core activities');
assert.ok(batch3.every(m=>!String(m.activityId).includes('composite:')),'multi-idea generation must never use composite fallback');

console.log('PASS: standalone Joy Mission regression suite');
console.log(JSON.stringify({engine:evalx('FRESH_MISSION_ENGINE_VERSION'),feelings:feelings.length,clicksPerFeeling:60},null,2));
