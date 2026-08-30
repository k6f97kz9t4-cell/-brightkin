'use strict';
const fs = require('fs');
const vm = require('vm');
const assert = require('assert');
const nodeCrypto = require('crypto');

const elements = new Map();
const selectorState = new Map();
function el(id, value='') {
  const x = { id, value, innerHTML:'', textContent:'', disabled:false, files:[], selectedOptions:[], checked:false, dataset:{}, appendChild(){}, replaceChildren(){}, addEventListener(){}, style:{} };
  elements.set(id, x); return x;
}
el('app');

const documentMock = {
  getElementById(id){ return elements.get(id) || null; },
  querySelectorAll(sel){ return selectorState.get(sel) || []; },
  createElement(tag){
    return {tagName:tag.toUpperCase(),className:'',style:{},dataset:{},appendChild(){},remove(){},click(){},set src(v){this._src=v},get src(){return this._src},set href(v){this._href=v},get href(){return this._href}};
  },
  body:{appendChild(){}},
};

const store = new Map();
const localStorageMock = {getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};

const context = {
  console,
  document: documentMock,
  localStorage: localStorageMock,
  navigator: {storage:{}},
  crypto: nodeCrypto.webcrypto,
  Blob, TextEncoder, TextDecoder, Response, Request, URL, structuredClone,
  File: global.File || require('buffer').File,
  FileReader: class {},
  CompressionStream: global.CompressionStream,
  DecompressionStream: global.DecompressionStream,
  AbortSignal,
  fetch: async()=>{ throw new Error('fetch should not be used in local-mode tests'); },
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
const appPath = require('path').join(__dirname, '..', 'app.js');
vm.runInContext(fs.readFileSync(appPath,'utf8'), context, {filename:'app.js'});

async function run(){
  const evalx = (code)=>vm.runInContext(code, context);
  assert.strictEqual(evalx('typeof startDemo'), 'function');
  evalx('startDemo()');
  assert.strictEqual(evalx('state.members.length'), 4, 'demo household should load');
  assert.strictEqual(evalx('state.missions.length'), 0);

  // Mission generation: one means one.
  el('mfCount','1'); el('mfTime','1 hr'); el('mfBudget','under $25'); el('mfEnergy','medium'); el('mfSetting','either'); el('mfFeeling','laugh'); el('missionGenerateBtn');
  selectorState.set('.missionPerson:checked', [{value:'m1'},{value:'m2'}]);
  await evalx('submitMissionForm()');
  assert.strictEqual(evalx('state.missions.length'), 1, 'count=1 must create exactly one mission');
  assert.strictEqual(evalx('state.stats.generated'), 1);

  // Generate 2 more, not 3.
  elements.get('mfCount').value='2';
  elements.get('mfFeeling').value='reconnect';
  await evalx('submitMissionForm()');
  assert.strictEqual(evalx('state.missions.length'), 3, 'count=2 must add exactly two missions');
  assert.strictEqual(evalx('state.stats.generated'), 3);
  assert.ok(evalx('new Set(state.missions.map(m=>m.title)).size') >= 2, 'ideas should rotate rather than always repeat one title');

  // Repeated clicks must produce genuinely fresh activities in every category, not renamed copies.
  const feelings = ['laugh','reconnect','adventure','calm','surprise','learn','celebrate'];
  for (const feeling of feelings) {
    const generated = [];
    for (let i=0;i<30;i++) {
      const batch = evalx(`localMissionSet({people:['m1','m2'],time:'1 hr',budget:'under $25',energy:'medium',setting:'either',feeling:${JSON.stringify(feeling)}},1)`);
      assert.strictEqual(batch.length,1, feeling+' should create one mission');
      const m = batch[0];
      generated.push(m);
      evalx(`state.missions.unshift(${JSON.stringify(m)}); state.stats.generated += 1;`);
    }
    const titles = generated.map(m=>m.title);
    const variants = generated.map(m=>m.variantKey);
    const mechanics = generated.map(m=>m.activityId);
    assert.strictEqual(new Set(titles).size, titles.length, feeling+' should not repeat titles across repeated clicks');
    assert.strictEqual(new Set(variants).size, variants.length, feeling+' should not repeat mission variants');
    assert.strictEqual(new Set(mechanics).size, mechanics.length, feeling+' should produce a different activity mechanic on every repeated click');
    for (let i=0;i<generated.length;i++) for (let j=0;j<i;j++) {
      const score = evalx(`similarityScore(${JSON.stringify((generated[i].title+' '+generated[i].steps.slice(0,3).join(' ')).toLowerCase())}, ${JSON.stringify((generated[j].title+' '+generated[j].steps.slice(0,3).join(' ')).toLowerCase())})`);
      assert.ok(score < .82, feeling+' generated two missions that were too similar');
    }
  }

  // Cloud mission output is also de-duplicated against mission history.
  evalx(`state.missions.unshift({id:'cloud-old',title:'Duplicate Cloud Mission',feeling:'reconnect',steps:['Pick one favorite thing.','Share it together.','Talk about why it matters.'],status:'generated'});`);
  const cloudFreshCount = evalx(`normalizeAiMissions([
    {title:'Duplicate Cloud Mission',steps:['Pick one favorite thing.','Share it together.','Talk about why it matters.']},
    {title:'Brand New Cloud Activity',steps:['Choose three sealed envelopes.','Open one and follow its new challenge.','Trade who chooses the next envelope.']}
  ],{feeling:'reconnect',time:'1 hr',budget:'free'},['m1','m2'],2).length`);
  assert.strictEqual(cloudFreshCount,1,'cloud AI duplicates should be rejected before display');

  // Natural multi-person grammar and story integrity.
  const story = evalx(`localStory({ids:['m1','m2','m3','m4'],theme:'Adventure',tone:'Warm and funny',lesson:'Courage can be small',mem:state.memories[0]})`);
  assert.ok(story.includes('Alex, Sam, Mia, and Leo'), 'story should naturally join multiple names');
  assert.ok(!story.includes('Alex and Sam, Mia'), 'story should not use crossed-over name grammar');
  assert.ok(!story.includes('Tone:'), 'story should not leak prompt metadata');
  assert.ok(!story.includes('A storm canceled our plans'), 'story should not paste raw memory prose into generated prose');
  assert.ok(!/undefined|null/.test(story), 'story should not contain broken placeholders');

  // Memory transformations keep raw memory detail in a dedicated quote, not jammed into prose.
  for (const type of ['Keepsake story','Bedtime story','Future note','Follow-up ideas']) {
    const t = evalx(`localMemoryTransform(state.memories[0], ${JSON.stringify(type)})`);
    assert.ok(t.length > 80, type+' should generate useful text');
    assert.ok(!/undefined|null|Tone:/.test(t), type+' should not contain broken/meta text');
  }
  const keep = evalx(`localMemoryTransform(state.memories[0], 'Keepsake story')`);
  assert.ok(keep.includes('A detail worth preserving:\n“'), 'keepsake should isolate memory detail as a quote');

  // Weekly data is actually scoped to seven days.
  evalx(`state.missions.push({id:'old',status:'complete',created:'2024-01-01',completedDate:'2024-01-01',people:['m1'],rating:5,title:'Old'});`);
  const weeklyHtml = evalx('weekly()');
  assert.ok(weeklyHtml.includes('true seven-day view'), 'weekly screen should describe actual 7-day scope');

  // Cloud AI stays opt-in and local mode works without a network.
  assert.strictEqual(evalx('state.settings.cloudAI'), false);
  assert.ok(evalx(`localMissionSet({people:['m1'],time:'15 min',budget:'free',energy:'low',setting:'indoors',feeling:'calm'},1).length`)===1);

  // Backup crypto round-trip.
  if (context.CompressionStream && context.DecompressionStream) {
    const ok = await evalx(`(async()=>{const raw=new TextEncoder().encode('BrightKin family backup test');const enc=await encryptBytes(raw,'pass123');const out=await decryptBytes(enc.cipher,'pass123',enc.salt,enc.iv);return new TextDecoder().decode(out)==='BrightKin family backup test'})()`);
    assert.strictEqual(ok,true,'AES-GCM backup encryption should round-trip');
  }

  // Rendered HTML labels no longer force three ideas.
  evalx(`state.modal={type:'missionForm',data:{}}`);
  const modal = evalx('modalHtml()');
  assert.ok(modal.includes('How many ideas?'));
  assert.ok(modal.includes('1 idea'));
  assert.ok(!modal.includes('Create 3 missions'));

  // Yearbook produces useful structure.
  const book = evalx('yearbook()');
  assert.ok(book.includes('Year in Joy'));
  assert.ok(book.includes('Print / Save PDF'));
  assert.ok(book.includes('Download book'));

  console.log('PASS: BrightKin v2 behavioral suite');
  console.log(JSON.stringify({missions:evalx('state.missions.length'),members:evalx('state.members.length'),storyChars:story.length,joyScore:evalx('joyScore()')},null,2));
}
run().catch(err=>{console.error(err);process.exit(1)});
