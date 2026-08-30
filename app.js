'use strict';

const STORAGE_KEY = 'brightkin_state_v2';
const LEGACY_KEYS = ['brightkin_state_v1', 'brightkin_live_v1'];
const MEDIA_DB = 'brightkin_media_v1';
const MEDIA_STORE = 'media';
const APP_VERSION = 2;
const MAX_MEDIA_FILE = 20 * 1024 * 1024;
const MAX_MEDIA_PER_MEMORY = 5;

const uid = () => (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2, 10));
const today = () => new Date().toISOString().slice(0, 10);
const currentYear = () => new Date().getFullYear();
const escapeHtml = s => String(s ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
const cleanText = s => String(s ?? '').replace(/\s+/g, ' ').trim();
const clip = (s, n = 180) => { const t = cleanText(s); return t.length <= n ? t : t.slice(0, n - 1).trimEnd() + '…'; };
const fmtDate = d => {
  if (!d) return 'Unknown date';
  const x = new Date(String(d).slice(0, 10) + 'T12:00:00');
  return Number.isNaN(x.getTime()) ? escapeHtml(d) : x.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};
const naturalJoin = items => {
  const a = items.filter(Boolean);
  if (!a.length) return 'your household';
  if (a.length === 1) return a[0];
  if (a.length === 2) return `${a[0]} and ${a[1]}`;
  return `${a.slice(0, -1).join(', ')}, and ${a[a.length - 1]}`;
};
const safeSlug = s => cleanText(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 42) || 'household';
const tokenize = s => cleanText(s).toLowerCase().split(/[,;]+|\band\b/).map(x => x.trim()).filter(Boolean);
const sentenceList = s => cleanText(s).match(/[^.!?]+[.!?]?/g)?.map(x => x.trim()).filter(Boolean) || [];
const memoryAnchor = r => clip(sentenceList(r?.story || '')[0] || r?.title || 'A small moment worth remembering.', 170);
const emotionPhrase = r => (r?.emotions || []).slice(0, 3).join(', ') || 'warm, connected';
const ensurePeriod = s => { const t = cleanText(s); return !t ? '' : /[.!?]$/.test(t) ? t : t + '.'; };
const inLastDays = (date, days) => {
  if (!date) return false;
  const d = new Date(String(date).slice(0,10) + 'T12:00:00');
  const now = new Date();
  return !Number.isNaN(d.getTime()) && (now - d) >= 0 && (now - d) <= days * 86400000;
};

function defaultState() {
  return {
    version: APP_VERSION,
    household: '',
    members: [],
    missions: [],
    memories: [],
    stories: [],
    celebrations: [],
    view: 'welcome',
    onboarded: false,
    demo: false,
    stats: { generated: 0, completed: 0 },
    settings: {
      private: true,
      cloudAI: false,
      householdId: uid(),
      deviceId: uid(),
      yearbookYear: currentYear(),
    },
    toast: '',
    modal: null,
  };
}

function migrateLegacy(raw) {
  if (!raw || typeof raw !== 'object') return defaultState();
  const base = defaultState();
  if (raw.members || raw.household) {
    const s = { ...base, ...raw };
    s.version = APP_VERSION;
    s.members = Array.isArray(raw.members) ? raw.members : [];
    s.memories = Array.isArray(raw.memories) ? raw.memories.map(r => ({ mediaMeta: [], mediaIds: [], artifacts: [], emotions: [], ...r })) : [];
    s.missions = Array.isArray(raw.missions) ? raw.missions : [];
    s.stories = Array.isArray(raw.stories) ? raw.stories : [];
    s.celebrations = Array.isArray(raw.celebrations) ? raw.celebrations : [];
    s.stats = { ...base.stats, ...(raw.stats || {}) };
    s.settings = { ...base.settings, ...(raw.settings || {}), cloudAI: false };
    s.toast = '';
    s.modal = null;
    return s;
  }
  if (raw.people || raw.house) {
    return {
      ...base,
      household: raw.house || 'My Household',
      onboarded: !!raw.on,
      view: raw.view || 'home',
      members: (raw.people || []).map(p => ({
        id: p.id || uid(), name: p.name || 'Person', role: p.role || 'Family', age: p.age || 'Adult',
        interests: p.interests || '', dislikes: p.dislikes || '', foods: p.foods || '', love: p.love || 'Quality time',
        energy: p.energy || 'medium', access: p.access || '', notes: p.notes || ''
      })),
      memories: (raw.memories || []).map(r => ({
        id: r.id || uid(), title: r.title || 'Memory', date: r.date || today(), people: r.people || [], story: r.story || '',
        emotions: r.emotions || tokenize(r.tags || ''), artifacts: r.artifacts || [], mediaIds: [], mediaMeta: []
      })),
      missions: (raw.missions || []).map(m => ({
        ...m, created: m.created || today(), status: m.status === 'done' ? 'complete' : (m.status === 'new' ? 'generated' : m.status),
        feeling: m.feeling || m.feel || 'reconnect', cost: m.cost || m.bud || 'Flexible', time: m.time || '1 hr'
      })),
      stats: { generated: Number(raw.generated || 0), completed: Number(raw.done || 0) },
    };
  }
  return base;
}

function loadState() {
  try {
    const current = localStorage.getItem(STORAGE_KEY);
    if (current) return migrateLegacy(JSON.parse(current));
    for (const key of LEGACY_KEYS) {
      const old = localStorage.getItem(key);
      if (old) {
        const migrated = migrateLegacy(JSON.parse(old));
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...migrated, toast: '', modal: null }));
        return migrated;
      }
    }
  } catch (err) {
    console.warn('BrightKin state load failed', err);
  }
  return defaultState();
}

let state = loadState();
state.settings.cloudAI = false; // GitHub Pages build: generation stays on-device.
let liveObjectUrls = [];

function save() {
  const persisted = { ...state, toast: '', modal: null, version: APP_VERSION };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(persisted));
}
function toast(msg) {
  state.toast = msg;
  render();
  setTimeout(() => { if (state.toast === msg) { state.toast = ''; render(); } }, 1900);
}
function openModal(type, data = {}) { state.modal = { type, data }; render(); }
function closeModal() { state.modal = null; render(); }
function go(view) { state.view = view; state.modal = null; save(); render(); window.scrollTo({ top: 0, behavior: 'smooth' }); }

const demoMembers = [
  {id:'m1',name:'Alex',role:'Parent',age:'Adult',interests:'coffee, grilling, road trips, live music, quiet mornings',dislikes:'crowds, overly complicated plans',foods:'tacos, steak, breakfast',love:'Quality time',energy:'medium',access:'',notes:'Likes surprises that feel thoughtful, not expensive.'},
  {id:'m2',name:'Sam',role:'Partner',age:'Adult',interests:'gardening, bookstores, cozy movies, trying new food, photography',dislikes:'rushed schedules',foods:'Italian, pastries, tea',love:'Acts of service',energy:'low',access:'',notes:'Feels cared for when someone removes a task from the day.'},
  {id:'m3',name:'Mia',role:'Child',age:'8–12',interests:'animals, drawing, scavenger hunts, science experiments, silly stories',dislikes:'long waits',foods:'pizza, strawberries, pancakes',love:'Words of affirmation',energy:'high',access:'',notes:'Loves being given a secret mission.'},
  {id:'m4',name:'Leo',role:'Child',age:'3–7',interests:'dinosaurs, puddles, blocks, bedtime stories, treasure hunts',dislikes:'loud places',foods:'mac and cheese, apples, waffles',love:'Physical affection',energy:'high',access:'',notes:'Loves being the hero of a story.'}
];
const demoMemories = [
  {id:'r1',title:'Rainy-day pancake contest',date:new Date(Date.now()-86400000*18).toISOString().slice(0,10),people:['m1','m2','m3','m4'],story:'A storm canceled our plans, so everyone invented a ridiculous pancake shape. The dinosaur won even though it looked like a boot.',emotions:['funny','cozy'],artifacts:[],mediaIds:[],mediaMeta:[]},
  {id:'r2',title:'Sunset by the lake',date:new Date(Date.now()-86400000*46).toISOString().slice(0,10),people:['m1','m2'],story:'We brought takeout, left the phones in the car, and watched the sunset. It felt like the simplest good decision we had made all month.',emotions:['calm','connected'],artifacts:[],mediaIds:[],mediaMeta:[]}
];
function startDemo() {
  state = { ...defaultState(), household: 'The Bright Family', members: structuredClone(demoMembers), memories: structuredClone(demoMemories), onboarded: true, demo: true, view: 'home' };
  save(); render();
}

function memberNames(ids) { return (ids || []).map(id => state.members.find(m => m.id === id)?.name).filter(Boolean); }
function knownLikes(ids) { return (ids || []).map(id => state.members.find(m => m.id === id)).filter(Boolean).flatMap(m => tokenize(m.interests)).slice(0, 16); }
function sharedInterests(ids) {
  const people = (ids || []).map(id => state.members.find(m => m.id === id)).filter(Boolean);
  const all = people.flatMap(p => tokenize(p.interests));
  const counts = {};
  all.forEach(x => counts[x] = (counts[x] || 0) + 1);
  return Object.entries(counts).sort((a,b) => b[1]-a[1]).map(x => x[0]).slice(0, 8);
}
function recentMemoryFor(ids) {
  return [...state.memories].sort((a,b) => String(b.date).localeCompare(String(a.date))).find(r => (ids || []).some(id => (r.people || []).includes(id)));
}
function memberContext(ids) {
  return (ids || []).map(id => state.members.find(m => m.id === id)).filter(Boolean).map(m => ({
    name: m.name, role: m.role, age: m.age, interests: m.interests, dislikes: m.dislikes, foods: m.foods,
    appreciation: m.love, energy: m.energy, access: m.access, notes: clip(m.notes, 180)
  }));
}

const missionTemplates = [
  {feel:'laugh',titles:['The 20-Minute Ridiculous Challenge','Tiny Comedy Olympics','The Family Improv Mission','The Worst Masterpiece Contest','Operation: Make Someone Snort-Laugh']},
  {feel:'reconnect',titles:['The No-Phone Favorite Things Hour','A Small Night That Feels Big','The Memory Remix','The One-Question Walk','The Tiny Tradition Test']},
  {feel:'adventure',titles:['The Two-Mile Mystery Mission','Choose-Your-Own Adventure Afternoon','The Three-Stop Micro Adventure','The $10 Detour','The Local Explorer Challenge']},
  {feel:'calm',titles:['The Soft Evening Reset','Tea, Blankets & One Good Question','The Quiet Hour','The Slow-Morning Pocket','The Cozy Side-by-Side']},
  {feel:'surprise',titles:['The Secret Kindness Operation','Operation: Make Their Tuesday Better','The Invisible Gift','The Favorite-Thing Ambush','The Quiet Upgrade']},
  {feel:'learn',titles:['The Curiosity Swap','Teach Me Your Thing','The One-Hour Family Lab','The Tiny Museum Night','The Question Nobody Knows Yet']},
  {feel:'celebrate',titles:['The Ordinary-Day Celebration','Tiny Victory Banquet','Make Today Count','The One-Song Victory Lap','The Little Win Ceremony']}
];

// Each feeling has multiple genuinely different activity mechanics. The first pass through a
// category uses every mechanic before any is reused. Later passes combine a mechanic with a
// different rule/twist and interest, producing a large non-repeating space of missions.
const missionActivityBank = {
  laugh: [
    {id:'caption-chaos',title:'Caption Chaos',steps:['Take three ordinary household photos or objects.','Everyone secretly writes the funniest possible caption for each one.','Read them dramatically without saying who wrote what.','Choose one caption to save as the official quote of the day.'],surprise:'Give the winning caption an absurd homemade trophy.'},
    {id:'commercial',title:'Make the Worst Commercial',steps:['Pick a completely ordinary object nearby.','Split into teams or take turns making a 30-second ridiculous commercial for it.','Add one fake feature that makes absolutely no sense.','Vote for funniest slogan, best acting, and strangest feature.'],surprise:'Record the final slogan in a serious announcer voice.'},
    {id:'drawing-relay',title:'Blind Drawing Relay',steps:['Choose a simple subject everyone knows.','One person describes it without naming it while another draws with eyes mostly closed.','Swap roles and use a different subject.','Reveal every drawing at once and name each accidental masterpiece.'],surprise:'Frame the funniest drawing on the fridge for one day.'},
    {id:'soundtrack',title:'Ridiculous Soundtrack Challenge',steps:['Choose three normal actions like making a snack, folding a blanket, or walking across the room.','Each person picks or invents a dramatic soundtrack for one action.','Perform the action as if it belongs in a movie trailer.','Finish with a group slow-motion finale.'],surprise:'Award someone the title “Best Unnecessary Drama.”'},
    {id:'one-word-story',title:'One-Word Story Disaster',steps:['Choose a silly setting or character.','Build a story around the circle one word at a time.','Whenever someone laughs, they must add a harmless plot twist.','End the story after five minutes and give it a ridiculous title.'],surprise:'Save the final title as a future inside joke.'},
    {id:'mini-games',title:'Five-Minute Mini-Game Gauntlet',steps:['Pick three tiny games that need almost no setup.','Set a five-minute limit for each game.','Change one rule halfway through every round.','Let the last-place person invent the final bonus round.'],surprise:'Use a spoon, sock, or paper cup as the traveling championship trophy.'},
    {id:'mystery-voice',title:'Mystery Voice Theater',steps:['Write down several harmless characters, animals, or famous archetypes.','Take turns drawing one and speaking in that voice for one minute.','Everyone else gives the character an ordinary problem to solve.','Finish with all characters appearing in one ridiculous scene.'],surprise:'Let the youngest or quietest person direct the finale.'},
    {id:'bad-invention',title:'Terrible Invention Pitch Night',steps:['Choose a normal annoyance from everyday life.','Everyone invents the most overcomplicated solution possible.','Give each invention a name, price, and impossible feature.','Pitch them like serious investors are in the room.'],surprise:'Make a fake “patent certificate” for the funniest idea.'},
    {id:'emoji-charades',title:'Emoji Charades',steps:['Each person secretly chooses three emojis that describe a movie, memory, person, or activity.','Act out or explain the emojis without saying the answer.','Give one bonus point for the most creative wrong guess.','End with one set of emojis that represents your household.'],surprise:'Save the household emoji combination as a secret family symbol.'},
    {id:'reverse-talent',title:'The Reverse Talent Show',steps:['Each person chooses something they are definitely not an expert at.','Give everyone two minutes to perform or demonstrate it with total confidence.','The audience gives only positive, ridiculous awards.','Finish by choosing one “talent” to try for real someday.'],surprise:'Create a paper medal labeled “Confidently Incorrect.”'}
  ],
  reconnect: [
    {id:'question-walk',title:'The One-Question Walk',steps:['Take a short walk or sit somewhere away from the normal routine.','Each person gets to ask one question they genuinely want the others to answer.','No fixing or interrupting; just listen and ask one follow-up.','End by naming one thing you learned that you did not know before.'],surprise:'Bring a favorite drink or snack for someone without asking first.'},
    {id:'favorite-swap',title:'Favorite-Thing Swap',steps:['Each person chooses one small favorite: song, snack, game, place, photo, or ritual.','Trade favorites for 10–15 minutes and experience someone else’s choice.','Explain what you like about the other person’s pick.','Choose one favorite to repeat together next week.'],surprise:'Quietly include a favorite someone mentioned weeks ago.'},
    {id:'memory-map',title:'Memory Map Night',steps:['Pick a room, neighborhood, route, or place connected to shared history.','Take turns naming a memory linked to different spots.','Ask one person to share a detail nobody else remembers.','Choose one old memory to recreate in a tiny way.'],surprise:'Bring one photo or object connected to a past memory.'},
    {id:'phone-free-hour',title:'The Phone-Free Pocket',steps:['Put phones in one place for a defined short window.','Make or share something simple to eat or drink.','Each person names one high point and one hard part from the week.','Finish by choosing one thing you want to protect time for together.'],surprise:'Start with a note that says “Nothing else needs us for the next hour.”'},
    {id:'appreciation-trade',title:'Specific Appreciation Trade',steps:['Give everyone two minutes to think of one very specific thing they appreciate about another person.','Share examples rather than general compliments.','Let the person receiving it say what that moment meant to them.','Write down one appreciation worth remembering.'],surprise:'Hide one appreciation note somewhere it will be found later.'},
    {id:'future-postcard',title:'Postcard From Next Year',steps:['Imagine it is one year from today and things are going well.','Each person writes or says a short “postcard” describing one ordinary good day.','Compare the details that show up more than once.','Pick one tiny part of that future day you can do this month.'],surprise:'Date and save the postcards to reread next year.'},
    {id:'side-by-side',title:'Side-by-Side Project',steps:['Choose one small task or creative project no one has to be good at.','Work beside each other rather than dividing into separate jobs.','Play music or make a favorite snack while you work.','When finished, take five minutes to sit with what you made together.'],surprise:'Add one detail based on another person’s favorite color, food, or interest.'},
    {id:'story-swap',title:'The Story I Never Told You',steps:['Each person chooses a harmless story from childhood, school, work, or an old trip that others may not know.','Tell the story in three minutes or less.','Listeners ask one question about how it felt, not just what happened.','Finish by finding one surprising thing the stories have in common.'],surprise:'Write down the funniest or most meaningful quote from the stories.'},
    {id:'mini-date',title:'Ten-Dollar Mini Date',steps:['Set a tiny budget and a short time window.','One person chooses the first stop or snack; the other chooses the second.','At each stop, ask one question you have not asked in a while.','End somewhere you can sit for ten quiet minutes.'],surprise:'Bring or choose something that references an old inside joke.'},
    {id:'tradition-lab',title:'Tiny Tradition Laboratory',steps:['List three small moments in a normal week that could feel more special.','Invent a five-minute ritual for one of them.','Try the ritual immediately if possible.','Decide whether to keep, change, or retire it after one week.'],surprise:'Give the new tradition an unnecessarily official name.'}
  ],
  adventure: [
    {id:'coin-route',title:'Coin-Flip Explorer',steps:['Choose a safe starting point and a short travel limit.','At each reasonable intersection or choice point, flip a coin to pick between two safe options.','Stop when you find something interesting, beautiful, tasty, or strange.','Document the best accidental discovery.'],surprise:'Pack one sealed snack or small treat to open at the halfway point.'},
    {id:'three-stop',title:'Three-Stop Micro Adventure',steps:['Pick three categories: something beautiful, something tasty, and something unexpected.','Choose a nearby stop for the first category.','Let a different person select each next stop.','Rate the three discoveries at the end.'],surprise:'One stop must be somewhere nobody in the group has entered before.'},
    {id:'photo-hunt',title:'Photo Hunt Expedition',steps:['Create five photo prompts such as “something tiny,” “a weird sign,” or “the best color.”','Go somewhere walkable or easy to explore.','Everyone tries to capture each prompt differently.','Compare photos and choose the most surprising interpretation.'],surprise:'Add one secret prompt that only gets revealed halfway through.'},
    {id:'random-pin',title:'Random Pin Mission',steps:['Open a map of your local area and choose a safe random point within your time limit.','Find one interesting thing near that point.','Add one food, drink, or scenic stop nearby.','On the way home, each person names the best unexpected detail.'],surprise:'Do not look up reviews for one of the stops; choose by curiosity.'},
    {id:'alphabet',title:'Alphabet Adventure',steps:['Pick a starting letter.','Find a place, object, food, or activity beginning with that letter.','The next discovery must begin with the next letter.','Stop after five letters or when time runs out.'],surprise:'Save the strangest letter challenge to repeat on a future trip.'},
    {id:'budget-detour',title:'The Tiny-Budget Detour',steps:['Set a small shared budget.','Choose one destination you would normally drive past.','Spend the budget only on something new to taste, try, or bring home.','Create a one-sentence review together afterward.'],surprise:'Someone else gets to choose how the final $1–$5 is spent.'},
    {id:'color-route',title:'Follow the Color',steps:['Choose one color before leaving.','For the next hour, let objects or signs in that color suggest the next safe direction or stop.','Take one photo every time the color leads somewhere interesting.','End at a place where you can compare the trail you accidentally created.'],surprise:'Switch colors once without telling everyone until they notice.'},
    {id:'local-tourist',title:'Tourist in Your Own Town',steps:['Choose one nearby place you usually ignore because it feels “too local.”','Visit it as if you were showing it to someone from another country.','Find one detail, fact, or view you never noticed before.','Finish with a local snack or photo.'],surprise:'Ask one person to be the fake tour guide for five minutes.'},
    {id:'mystery-envelope',title:'Three-Envelope Adventure',steps:['Write three safe mini-destinations or activities on separate slips and seal them.','Pick one envelope at random and do what it says.','After finishing, choose whether to open a second envelope.','Save the unopened option for another day.'],surprise:'Make one envelope a wildcard chosen by the youngest person.'},
    {id:'sunset-race',title:'Beat the Sunset Mission',steps:['Check how much daylight you have and choose a nearby scenic destination.','Get there using a route you do not normally take.','Bring one simple snack or drink.','Arrive with enough time to sit and notice five things before leaving.'],surprise:'Each person secretly chooses one song for the ride home.'}
  ],
  calm: [
    {id:'quiet-cafe',title:'Build a Tiny Home Café',steps:['Lower the lights and choose simple drinks or snacks.','Set up one small spot to feel different from the rest of the house.','Spend 20 minutes doing quiet activities side by side.','End with one gentle question about something you are looking forward to.'],surprise:'Write a tiny café menu naming everyone’s usual order.'},
    {id:'slow-walk',title:'The Five-Senses Walk',steps:['Take a short unhurried walk somewhere safe.','Notice one thing you can see, hear, smell, touch, and physically feel.','No one needs to fill every silence.','At the end, each person names the detail they want to remember.'],surprise:'Bring a warm or cold favorite drink for the walk.'},
    {id:'blanket-listen',title:'Blankets & One Album',steps:['Choose one album, playlist, or set of songs everyone can tolerate.','Make the room comfortable and put phones away.','Listen without multitasking for at least three songs.','Each person picks one line, sound, or moment they liked.'],surprise:'Let one person pick a nostalgic song nobody has heard together in a while.'},
    {id:'puzzle-pause',title:'Puzzle & Pause',steps:['Choose a puzzle, blocks, coloring page, simple craft, or repetitive hands-on activity.','Work quietly together for 20–40 minutes.','Keep conversation optional and low-pressure.','Stop before it feels like a chore and leave the project ready for next time.'],surprise:'Set out the materials before anyone knows the plan.'},
    {id:'soft-reset',title:'The Soft Evening Reset',steps:['Choose one small area to make comfortable together.','Put away only what makes the space feel calmer; do not turn it into a cleaning project.','Add a drink, blanket, candle, or music.','Spend the rest of the time doing nothing productive.'],surprise:'Leave tomorrow-morning-you one small helpful gift, like prepared coffee or a note.'},
    {id:'cloud-watch',title:'Sky-Watching Pocket',steps:['Find a comfortable outdoor or window spot.','Spend ten minutes watching clouds, stars, rain, birds, or changing light.','Each person points out one thing the others might have missed.','Finish with one quiet photo or no photo at all.'],surprise:'Bring a blanket or favorite snack without announcing it.'},
    {id:'read-together',title:'Quiet Reading Company',steps:['Everyone chooses something to read, browse, draw, or journal.','Sit in the same room for 20–30 minutes with no requirement to talk.','At the end, each person shares one interesting sentence, image, or thought if they want.','Keep the rest of the evening intentionally unscheduled.'],surprise:'Put out one snack each person likes before starting.'},
    {id:'tea-question',title:'Tea and One Good Question',steps:['Make a simple drink or snack.','Choose one gentle question rather than a list of prompts.','Give everyone time to answer without rushing.','Let the conversation end naturally instead of forcing a conclusion.'],surprise:'Use a mug, cup, or snack tied to a good memory.'},
    {id:'massage-hands',title:'Care Ritual Exchange',steps:['Choose a simple caring action everyone is comfortable with, such as hand lotion, brushing hair, making tea, or setting up a cozy seat.','Take turns receiving the small act without multitasking.','Say one thing that would make the coming week easier.','Choose one helpful act to repeat later.'],surprise:'Use someone’s favorite scent, blanket, or music if appropriate.'},
    {id:'slow-breakfast',title:'Slow Breakfast Window',steps:['Choose a morning or evening when nobody has to rush for 30 minutes.','Make the simplest favorite breakfast or snack you can.','Sit somewhere different from the usual eating spot.','Talk only about things you enjoy, are curious about, or want to do.'],surprise:'Add one small “weekend” detail even if it is a weekday.'}
  ],
  surprise: [
    {id:'task-erase',title:'Erase One Annoying Task',steps:['Choose one person and identify a small task they usually carry.','Quietly complete or simplify it without making a production of it.','Add one comfort detail connected to something they like.','Let them discover it naturally.'],surprise:'Leave a two-word note: “Already handled.”'},
    {id:'favorite-drop',title:'Favorite-Thing Drop',steps:['Choose a small favorite food, drink, song, flower, object, or activity.','Place it where the person will discover it during a normal part of the day.','Add a short note explaining the specific reason you thought of them.','Do not turn it into a big event.'],surprise:'Reference an inside joke in the note.'},
    {id:'micro-date',title:'Secret 30-Minute Date',steps:['Choose a 30-minute window the person can realistically enjoy.','Plan one simple destination or setup based on their preferences.','Tell them only what they need to wear or bring.','Reveal the plan when it starts.'],surprise:'Include one thing they mentioned wanting to do but never scheduled.'},
    {id:'room-upgrade',title:'The Quiet Upgrade',steps:['Pick one tiny space the person uses often.','Improve comfort or remove friction without changing their belongings dramatically.','Add one personal detail that proves you were paying attention.','Let the result speak for itself.'],surprise:'Hide a short appreciation note in the upgraded space.'},
    {id:'memory-revive',title:'Bring Back a Good Memory',steps:['Choose one positive shared memory.','Recreate only one small element from it: a snack, song, route, game, or phrase.','Wait to see whether the person recognizes the reference.','If they do, share what you remembered about that day.'],surprise:'Use the original date or location as a hidden clue.'},
    {id:'mystery-menu',title:'Mystery Menu Night',steps:['Choose three simple food or drink options the group likes.','Give them playful mystery names instead of revealing exactly what they are.','Let everyone order from the fake menu.','Reveal the menu theme at the end.'],surprise:'Create one “chef’s secret” item tied to a person’s favorite.'},
    {id:'compliment-trail',title:'Tiny Compliment Trail',steps:['Write three very specific positive notes for one person.','Place them along a normal path through the day.','Make each note about a different quality or memory.','Let the final note point to a small shared activity.'],surprise:'Use one note to remind them of something they did that mattered to you.'},
    {id:'playlist',title:'Secret Three-Song Playlist',steps:['Choose three songs for one person: one nostalgic, one current, and one that says something you want them to hear.','Give the playlist a meaningful or funny title.','Share it without a long explanation.','Later, ask which song landed best.'],surprise:'Hide a spoken voice memo between songs if your music app allows it, or send it separately.'},
    {id:'morning-kit',title:'Tomorrow-Morning Rescue Kit',steps:['Think about the first stressful part of someone’s next morning.','Prepare two or three tiny things that make it easier.','Add a favorite drink, snack, or note if practical.','Leave everything ready before they wake up or start the day.'],surprise:'Include one thing they would normally have to remember themselves.'},
    {id:'secret-vote',title:'Everyone Votes for Your Surprise',steps:['Choose the person being surprised.','Everyone else privately suggests one tiny thing that would make them smile.','Pick the easiest or most thoughtful suggestion.','Do it together without telling who proposed it.'],surprise:'Let the surprised person guess whose idea it was.'}
  ],
  learn: [
    {id:'teach-five',title:'Teach Me in Five',steps:['Each person chooses one thing they know or love.','They get five minutes to teach it using only what is nearby.','Everyone asks one genuine follow-up question.','Pick one lesson to try together.'],surprise:'Award a paper badge for “Most Unexpected Fact.”'},
    {id:'mystery-experiment',title:'Mystery Experiment Hour',steps:['Choose a safe, age-appropriate experiment or observation.','Before starting, everyone predicts what will happen.','Run it and write down what actually happened.','Talk about why the result surprised or confirmed your guesses.'],surprise:'The person with the wildest wrong prediction names the experiment.'},
    {id:'tiny-museum',title:'Build a Tiny Museum',steps:['Pick a theme everyone can contribute to.','Each person finds one object, photo, drawing, or fact for the exhibit.','Create short museum labels explaining why each item belongs.','Give each other a two-minute guided tour.'],surprise:'Make one label intentionally mysterious and let visitors guess the object.'},
    {id:'question-hunt',title:'Question Nobody Knows',steps:['Everyone writes one question they do not know the answer to.','Choose one question at random.','Spend a short time researching, observing, or experimenting together.','Each person explains the answer back in their own words.'],surprise:'Keep a jar for future “nobody knows” questions.'},
    {id:'skill-swap',title:'Skill Swap',steps:['Pair people up or take turns.','Each person teaches one tiny skill that can be learned in ten minutes.','The learner must demonstrate it back without help.','Vote on which skill should return in a future challenge.'],surprise:'Give the learner a ridiculous certificate of completion.'},
    {id:'taste-lab',title:'Blind Taste Lab',steps:['Choose several safe foods or drinks everyone can have.','Taste them blind or with labels hidden.','Describe texture, smell, sweetness, saltiness, or other features before guessing.','Rank them and discuss what made the favorite stand out.'],surprise:'Include one very familiar item to see whether anyone recognizes it.'},
    {id:'map-story',title:'Map Story Expedition',steps:['Choose a place on a map that someone is curious about.','Find three things: what it looks like, what people eat or do there, and one surprising fact.','Each person chooses one thing they would want to experience there.','Plan a tiny at-home version of one detail.'],surprise:'Pick the location by spinning or dropping a finger on the map.'},
    {id:'how-it-works',title:'How Does That Work?',steps:['Pick one everyday object nobody has thought much about.','Everyone guesses how it works before researching.','Look up or inspect the real explanation together.','Draw the simplest possible diagram or explanation.'],surprise:'Choose an object that someone uses every day.'},
    {id:'family-interview',title:'Interview the Expert',steps:['Choose one person as the “expert” on their own life or interest.','Everyone else prepares one question they have never asked.','Record or write down the most interesting answer.','Switch experts next time.'],surprise:'End with one question the expert gets to ask everyone else.'},
    {id:'build-test',title:'Build, Test, Improve',steps:['Choose a tiny building challenge using blocks, paper, tape, cups, or household objects.','Build a first version quickly.','Test it against one simple goal.','Change one thing and test again.'],surprise:'Give the final design a product name and one ridiculous feature.'}
  ],
  celebrate: [
    {id:'victory-lap',title:'One-Song Victory Lap',steps:['Name the win, milestone, or effort you are celebrating.','Choose one song that fits the person or moment.','Play it loudly enough to feel different from a normal day.','End with one sentence from each person about why the win matters.'],surprise:'Make a 30-second entrance for the person being celebrated.'},
    {id:'tiny-banquet',title:'Tiny Victory Banquet',steps:['Choose one favorite food or drink connected to the person.','Set the table or serving area in a way that feels deliberately special.','Give one short toast focused on effort, not just outcome.','Take one photo or save one quote from the celebration.'],surprise:'Create a menu item named after the person or accomplishment.'},
    {id:'award-show',title:'Home Award Show',steps:['Invent three specific awards connected to the person’s effort, humor, growth, or kindness.','Make simple paper certificates or announce them dramatically.','Let other people add one sentence explaining an award.','Save the best award title for the Year in Joy.'],surprise:'Include one funny category nobody expects.'},
    {id:'memory-wall',title:'Mini Celebration Wall',steps:['Collect three photos, notes, objects, or messages connected to the moment.','Arrange them in one small visible spot.','Walk through what each item represents.','Leave the display up for a day or a week.'],surprise:'Add one item from before the achievement that shows how far they came.'},
    {id:'choice-day',title:'The Winner Chooses',steps:['Tell the celebrated person they get three small choices.','Offer realistic options for food, music, activity, or where to sit.','Everyone else agrees to follow their picks without negotiating.','End with one appreciation statement.'],surprise:'Add a fourth choice they did not know was available.'},
    {id:'future-toast',title:'Toast to the Next Chapter',steps:['Celebrate what just happened first.','Then ask what the person hopes this makes possible next.','Everyone offers one way they can support that next chapter.','Write down one sentence to revisit later.'],surprise:'Save the sentence in a dated envelope or digital note.'},
    {id:'ordinary-win',title:'Celebrate the Ordinary Win',steps:['Choose a small thing that normally would pass without recognition.','Name exactly why it mattered or required effort.','Add one five-minute ritual: favorite snack, song, dance, or toast.','Decide whether this kind of win deserves a recurring tradition.'],surprise:'Use a “fancy” item on purpose: special glass, plate, napkin, or outfit.'},
    {id:'message-circle',title:'Three Messages That Matter',steps:['Ask up to three people to send one short message about what they appreciate or noticed.','Read or play the messages together.','Let the celebrated person respond only if they want to.','Save the messages with the date.'],surprise:'Include one message from someone they would not expect.'},
    {id:'mini-premiere',title:'Mini Premiere Night',steps:['Choose photos, clips, drawings, or moments from the accomplishment.','Put them in a simple order like a tiny premiere.','Watch or walk through them with a favorite snack.','End by naming the scene or moment that best captures the achievement.'],surprise:'Create a fake movie title for the whole journey.'},
    {id:'tradition-start',title:'Start a Victory Tradition',steps:['Choose one tiny ritual that fits this kind of win.','Make it easy enough to repeat in under ten minutes.','Do the ritual now for the first time.','Give the tradition a name and decide what future wins qualify.'],surprise:'Make one physical token that gets reused every time.'}
  ]
};

const missionTwists = [
  {id:'secret-choice',label:'Secret Choice',instruction:'Add a secret choice: one person quietly decides one part of the mission and reveals it only when that moment arrives.'},
  {id:'coin-flip',label:'Coin-Flip Rule',instruction:'For one harmless decision, use a coin flip between two safe options instead of discussing it.'},
  {id:'photo-clue',label:'Photo Clue',instruction:'Before starting, take or choose one photo that becomes a clue or theme for part of the mission.'},
  {id:'swap-leader',label:'Leader Swap',instruction:'Halfway through, switch who gets to make the next decision.'},
  {id:'time-capsule',label:'Time Capsule',instruction:'Save one sentence, photo, or tiny object with today’s date to revisit later.'},
  {id:'wild-card',label:'Wild Card',instruction:'Give one person a single safe wild-card they may use to change one part of the plan.'},
  {id:'three-word',label:'Three-Word Rule',instruction:'At the end, everyone describes the experience in exactly three words and saves the best phrase.'},
  {id:'reverse-pick',label:'Reverse Pick',instruction:'Let the person who usually chooses least often make one key decision this time.'}
];

function timeLabel(v) { return ({'15 min':'15–25 minutes','1 hr':'45–75 minutes','half day':'2–4 hours','full day':'5–8 hours'})[v] || v; }
function costLabel(v) { return ({'free':'$0–$10','under $25':'$5–$25','under $75':'$20–$75','splurge':'Flexible'})[v] || v; }
function normalizedFeeling(v) { return ({joy:'laugh',fun:'laugh',connection:'reconnect'})[v] || v || 'reconnect'; }
function missionSignatureParts(m) {
  const title = cleanText(m?.title).toLowerCase().replace(/[^a-z0-9 ]/g,'');
  const steps = (m?.steps || []).slice(0,3).map(x => cleanText(x).toLowerCase().replace(/[^a-z0-9 ]/g,'')).join('|');
  return `${normalizedFeeling(m?.feeling || m?.filters?.feeling)}::${title}::${steps}`;
}
function missionSimilarityText(m) {
  return `${cleanText(m?.title)} ${(m?.steps || []).slice(0,3).map(cleanText).join(' ')}`.toLowerCase();
}
function tokenSet(s) { return new Set(cleanText(s).toLowerCase().split(/[^a-z0-9]+/).filter(x => x.length > 2)); }
function similarityScore(a,b) {
  const A=tokenSet(a), B=tokenSet(b); if(!A.size || !B.size) return 0;
  let both=0; A.forEach(x=>{if(B.has(x)) both++;});
  return both / Math.max(A.size,B.size);
}
function isMissionFresh(candidate, additional = []) {
  const all = [...(state.missions || []), ...(additional || [])];
  const sig = missionSignatureParts(candidate);
  const text = missionSimilarityText(candidate);
  return !all.some(old => {
    if (old.variantKey && candidate.variantKey && old.variantKey === candidate.variantKey) return true;
    if (missionSignatureParts(old) === sig) return true;
    if (cleanText(old.title).toLowerCase() === cleanText(candidate.title).toLowerCase()) return true;
    return similarityScore(text, missionSimilarityText(old)) >= .82;
  });
}
function titleInterest(s) {
  const t=cleanText(s); if(!t) return '';
  return t.split(' ').slice(0,4).map(w=>w ? w[0].toUpperCase()+w.slice(1) : '').join(' ');
}
function missionInterestPool(ids) {
  const shared=sharedInterests(ids), likes=knownLikes(ids);
  const base=[...shared,...likes,'music','food','photos','a favorite place','a tiny challenge','a shared memory'];
  return [...new Set(base.map(cleanText).filter(Boolean))];
}
function buildLocalMission(form, ids, blueprint, twist, interest, cycle) {
  const names = memberNames(ids);
  const memory = recentMemoryFor(ids);
  const setting = form.setting === 'either' ? 'wherever feels easiest' : form.setting;
  const interestLabel = titleInterest(interest);
  const suffix = cycle === 0 ? '' : ` — ${twist.label}${interestLabel ? `: ${interestLabel}` : ''}`;
  const why = `Designed for ${naturalJoin(names)} with a genuinely different ${normalizedFeeling(form.feeling)} activity, ${form.energy} energy, and ${setting}. ${interest ? `This version pulls in ${interest}. ` : ''}${memory ? `It uses the positive signal from “${memory.title}” without recreating that old plan.` : 'It is intentionally easy to start without a lot of planning.'}`;
  const steps = blueprint.steps.slice();
  if (interest && steps.length > 1) steps[1] = `${steps[1]} Work in something connected to ${interest} if it fits naturally.`;
  if (cycle > 0) steps.push(twist.instruction);
  return {
    id: uid(), title: `${blueprint.title}${suffix}`, people: ids, created: today(), status: 'generated', rating: null,
    filters: form, why, steps: steps.slice(0,5), time: timeLabel(form.time), cost: costLabel(form.budget), surprise: blueprint.surprise,
    prompt: 'Ask: “What part of this should we steal and use again in a completely different way?”',
    capture: 'Save one candid photo, short clip, or sentence about the moment nobody planned.',
    feeling: normalizedFeeling(form.feeling), source: 'local',
    activityId: blueprint.id, twistId: twist.id, variantKey: `${normalizedFeeling(form.feeling)}:${blueprint.id}:${twist.id}:${cleanText(interest).toLowerCase()}:${cycle}`
  };
}

function activityCombinations(bank, size) {
  const out=[];
  function walk(start, picked) {
    if (picked.length===size) { out.push(picked.slice()); return; }
    for (let i=start;i<bank.length;i++) { picked.push(bank[i]); walk(i+1,picked); picked.pop(); }
  }
  walk(0,[]); return out;
}
function compactActivityName(title) {
  return cleanText(title).replace(/^(the|a|an)\s+/i,'').split(' ').slice(0,4).join(' ');
}
function buildCompositeMission(form, ids, blueprints, twist, interest) {
  const feeling=normalizedFeeling(form.feeling);
  const names=memberNames(ids), memory=recentMemoryFor(ids);
  const setting=form.setting==='either'?'wherever feels easiest':form.setting;
  const labels=blueprints.map(b=>compactActivityName(b.title));
  const title=clip(`Mash-Up: ${labels.join(' + ')}`, 90);
  const steps=[blueprints[0].steps[0]];
  blueprints.forEach((b,i)=>steps.push(b.steps[Math.min(1+i%2,b.steps.length-1)]));
  if (steps.length<4) steps.push(blueprints[blueprints.length-1].steps[Math.min(2,blueprints[blueprints.length-1].steps.length-1)]);
  steps.push(twist.instruction);
  const comboId=blueprints.map(b=>b.id).join('+');
  return {
    id:uid(),title,people:ids,created:today(),status:'generated',rating:null,filters:form,
    why:`A fresh ${feeling} mash-up for ${naturalJoin(names)} that combines ${labels.join(', ')} into one new activity instead of recycling an older mission. ${interest?`Use ${interest} as the theme when it fits. `:''}${memory?`It keeps the emotional signal from “${memory.title}” while changing the actual activity.`:`It fits ${form.energy} energy and ${setting}.`}`,
    steps:steps.slice(0,5),time:timeLabel(form.time),cost:costLabel(form.budget),surprise:blueprints[blueprints.length-1].surprise,
    prompt:'Ask: “Which part of this mash-up surprised you enough that we should build a totally new mission around it next time?”',
    capture:'Save the most unexpected crossover moment from the two activities.',feeling,source:'local',
    activityId:`composite:${comboId}`,twistId:twist.id,variantKey:`${feeling}:composite:${comboId}:${twist.id}:${cleanText(interest).toLowerCase()}`
  };
}

function localMissionSet(form, count, alreadyCreated = []) {
  const ids=form.people.length?form.people:state.members.slice(0,2).map(m=>m.id);
  const feeling=normalizedFeeling(form.feeling);
  const bank=missionActivityBank[feeling]||missionActivityBank.reconnect;
  const interests=missionInterestPool(ids);
  const created=[];
  const generationBase=Number(state.stats.generated||0);

  for (let outputIndex=0;outputIndex<count;outputIndex++) {
    const history=[...(state.missions||[]),...(alreadyCreated||[]),...created].filter(m=>normalizedFeeling(m.feeling||m.filters?.feeling)===feeling);
    const usedActivityIds=new Set(history.map(m=>m.activityId).filter(Boolean));
    let chosen=null;

    // First priority: a core activity mechanic this household has not been served in this category.
    // This guarantees repeated taps move through different activities before any mash-ups begin.
    for (let probe=0;probe<bank.length;probe++) {
      const blueprint=bank[(generationBase+outputIndex+probe)%bank.length];
      if (usedActivityIds.has(blueprint.id)) continue;
      const interest=interests[(generationBase+outputIndex+probe)%Math.max(1,interests.length)]||'';
      const candidate=buildLocalMission({...form,feeling},ids,blueprint,missionTwists[0],interest,0);
      if (isMissionFresh(candidate,[...(alreadyCreated||[]),...created])) { chosen=candidate; break; }
    }

    // After every core mechanic has been used, create a genuinely new activity by combining two
    // different mechanics. Once all pairs are used, move to three-way mash-ups. With 10 core
    // mechanics this provides 165 additional distinct activities per category before any reuse.
    if (!chosen) {
      const composites=[...activityCombinations(bank,2),...activityCombinations(bank,3)];
      const startAt=(generationBase+outputIndex)%Math.max(1,composites.length);
      for (let probe=0;probe<composites.length;probe++) {
        const group=composites[(startAt+probe)%composites.length];
        const activityId=`composite:${group.map(b=>b.id).join('+')}`;
        if (usedActivityIds.has(activityId)) continue;
        const twist=missionTwists[(generationBase+outputIndex+probe)%missionTwists.length];
        const interest=interests[Math.floor((generationBase+outputIndex+probe)/Math.max(1,bank.length))%Math.max(1,interests.length)]||'';
        const candidate=buildCompositeMission({...form,feeling},ids,group,twist,interest);
        if (isMissionFresh(candidate,[...(alreadyCreated||[]),...created])) { chosen=candidate; break; }
      }
    }

    // Practically unreachable unless a household has generated 175+ activities in one category.
    // Still produce a new activity route rather than returning a duplicate.
    if (!chosen) {
      const blueprint=bank[(generationBase+outputIndex)%bank.length];
      const second=bank[(generationBase+outputIndex+3)%bank.length];
      const third=bank[(generationBase+outputIndex+6)%bank.length];
      const unique=uid().slice(0,5).toUpperCase();
      chosen=buildCompositeMission({...form,feeling},ids,[blueprint,second,third],missionTwists[(generationBase+outputIndex)%missionTwists.length],interests[outputIndex%Math.max(1,interests.length)]||'');
      chosen.title=clip(`${chosen.title} — Route ${unique}`,90);
      chosen.steps=[...chosen.steps.slice(0,4),`Route ${unique}: change the order, location, leader, and final challenge so this run cannot duplicate an earlier one.`];
      chosen.activityId=`route:${unique}`; chosen.variantKey+=`:${unique}`;
    }
    created.push(chosen);
  }
  return created;
}

async function aiRequest(task, context) {
  if (!state.settings.cloudAI) throw new Error('Cloud AI is disabled');
  const res = await fetch('/api/joy-ai', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ task, context })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.ok) throw new Error(data.error || `AI service returned ${res.status}`);
  return data;
}

function normalizeAiMissions(items, form, ids, count) {
  if (!Array.isArray(items)) return [];
  const fresh = [];
  for (const x of items) {
    if (fresh.length >= count) break;
    const m = {
      id: uid(), title: clip(x.title || 'A Good-Day Mission', 90), people: ids, created: today(), status: 'generated', rating: null,
      filters: form, why: clip(x.why || 'Built around your household context.', 330),
      steps: Array.isArray(x.steps) ? x.steps.map(s => clip(s, 180)).filter(Boolean).slice(0,5) : [],
      time: clip(x.time || timeLabel(form.time), 50), cost: clip(x.cost || costLabel(form.budget), 50),
      surprise: clip(x.surprise || 'Add one small unexpected detail.', 180),
      prompt: clip(x.prompt || 'Ask one question that helps everyone notice the moment.', 220),
      capture: clip(x.capture || 'Save one candid detail from the experience.', 180), feeling: normalizedFeeling(form.feeling), source: 'cloud-ai'
    };
    if (m.title && m.steps.length >= 2 && isMissionFresh(m, fresh)) fresh.push(m);
  }
  return fresh;
}

async function submitMissionForm() {
  const people = [...document.querySelectorAll('.missionPerson:checked')].map(x => x.value);
  const form = {
    people,
    time: document.getElementById('mfTime').value,
    budget: document.getElementById('mfBudget').value,
    energy: document.getElementById('mfEnergy').value,
    setting: document.getElementById('mfSetting').value,
    feeling: document.getElementById('mfFeeling').value
  };
  const count = Math.max(1, Math.min(3, Number(document.getElementById('mfCount').value || 1)));
  const ids = people.length ? people : state.members.slice(0,2).map(m => m.id);
  const btn = document.getElementById('missionGenerateBtn');
  if (btn) { btn.disabled = true; btn.textContent = state.settings.cloudAI ? 'Creating with AI…' : 'Creating…'; }
  let created = [];
  let usedLocalFallback = false;
  if (state.settings.cloudAI) {
    try {
      const memories = state.memories.filter(r => ids.some(id => (r.people || []).includes(id))).slice(0,4).map(r => ({ title:r.title, emotions:r.emotions || [], anchor:memoryAnchor(r) }));
      const previousMissions = state.missions.filter(m => normalizedFeeling(m.feeling || m.filters?.feeling) === normalizedFeeling(form.feeling)).slice(0,30).map(m => ({ title:m.title, steps:(m.steps || []).slice(0,3) }));
      const data = await aiRequest('missions', { count, filters: form, people: memberContext(ids), memories, previousMissions, instruction:'Every returned activity must be materially different from every previous mission. Do not rename or lightly remix an old activity.' });
      created = normalizeAiMissions(data.result?.items, form, ids, count);
    } catch (err) {
      console.warn('Cloud mission generation failed; using local engine', err);
      usedLocalFallback = true;
    }
  }
  if (created.length < count) {
    const local = localMissionSet(form, count - created.length, created);
    created = [...created, ...local];
  }
  state.stats.generated = Number(state.stats.generated || 0) + created.length;
  state.missions = [...created, ...state.missions];
  state.modal = null; state.view = 'missions'; save(); render();
  toast(`${created.length} Joy Mission${created.length === 1 ? '' : 's'} created${usedLocalFallback ? ' with local fallback' : ''}`);
}

function joyScore() {
  const completed = state.missions.filter(m => m.status === 'complete');
  const ratings = completed.map(m => Number(m.rating || 0)).filter(Boolean);
  const avg = ratings.length ? ratings.reduce((a,b) => a+b,0)/ratings.length : 4.2;
  return Math.min(98, Math.round(46 + state.memories.length*5 + completed.length*6 + avg*3));
}
function streak() {
  const dates = [...new Set(state.missions.filter(m => m.status === 'complete').map(m => m.completedDate).filter(Boolean))].sort().reverse();
  if (!dates.length) return 0;
  let s = 1;
  for (let i=1;i<dates.length;i++) {
    const a = new Date(dates[i-1]+'T12:00:00'), b = new Date(dates[i]+'T12:00:00');
    if ((a-b)/86400000 <= 7) s++; else break;
  }
  return s;
}
function avgRating(list = state.missions) {
  const r = list.filter(m => m.rating).map(m => Number(m.rating));
  return r.length ? (r.reduce((a,b) => a+b,0)/r.length).toFixed(1) : '—';
}
function recommendedMission() { return state.missions.find(m => m.status === 'saved') || state.missions.find(m => m.status === 'generated') || null; }

function nav() {
  if (!state.onboarded) return '';
  return `<nav class="nav"><div class="navinner">${[['home','⌂','Home'],['missions','✦','Missions'],['memories','◉','Memories'],['graph','⌁','Graph'],['more','•••','More']].map(([v,i,l]) => `<button aria-label="${l}" class="${state.view===v?'active':''}" onclick="go('${v}')"><span class="ico">${i}</span>${l}</button>`).join('')}</div></nav>`;
}
function shell(content) {
  return `<div class="shell"><div class="topbar"><div class="brand"><div class="brandmark">✦</div><div>BrightKin<div class="tag">More good days together · v2</div></div></div>${state.onboarded?`<span class="pill sage">Private household</span>`:''}</div>${content}</div>${nav()}${state.toast?`<div class="toast" role="status">${escapeHtml(state.toast)}</div>`:''}${state.modal?modalHtml():''}`;
}

function welcome() {
  return shell(`<div class="hero"><div class="eyebrow">AI for real human connection</div><h1>Create more days you’ll actually remember.</h1><p>BrightKin learns what your people love, turns memories into future experiences, and helps you preserve the moments that would otherwise disappear—without trying to replace the people you care about.</p><div class="btnrow" style="margin-top:18px"><button class="btn rose" onclick="openModal('onboard')">Create my household</button><button class="btn secondary" onclick="startDemo()">Try a living demo</button></div></div><div class="section grid g3"><div class="card"><span class="pill rose">1</span><h3>Learn your people</h3><p class="muted">Interests, energy, appreciation style, dislikes, accessibility, and the tiny details generic AI misses.</p></div><div class="card"><span class="pill gold">2</span><h3>Build a Joy Graph</h3><p class="muted">Real memories and completed experiences train recommendations more than browsing ever could.</p></div><div class="card"><span class="pill sage">3</span><h3>Turn context into action</h3><p class="muted">Ideas, stories, celebrations, media memories, family sharing, and an annual keepsake book.</p></div></div>`);
}

function home() {
  const rec = recommendedMission();
  const last = [...state.memories].sort((a,b) => String(b.date).localeCompare(String(a.date)))[0];
  return shell(`<div class="hero"><div class="eyebrow">Today’s Joy Pulse</div><h1>${joyScore()} / 100</h1><p>${joyScore()>70?'Your graph is getting rich. Keep choosing small, repeatable moments over perfect plans.':'Your graph is getting started. One completed mission and one saved memory will make the next recommendations more personal.'}</p><div class="progress"><span style="width:${joyScore()}%"></span></div></div><div class="section kpirow"><div class="kpi"><b>${state.stats.completed}</b><span class="small muted">Missions completed</span></div><div class="kpi"><b>${state.memories.length}</b><span class="small muted">Memories saved</span></div><div class="kpi"><b>${avgRating()}</b><span class="small muted">Average rating</span></div><div class="kpi"><b>${streak()}</b><span class="small muted">Connection streak</span></div></div><div class="section"><div class="sectionhead"><div><h2>Do this today</h2><p>One low-friction move toward a better day.</p></div><button class="btn secondary" onclick="openModal('missionForm')">Generate</button></div>${rec?missionCard(rec,true):`<div class="empty"><h3>No mission yet</h3><p>Create exactly as many ideas as you want—one, two, or three.</p><button class="btn rose" onclick="openModal('missionForm')">Create a Joy Mission</button></div>`}</div><div class="section grid g2"><div class="card"><div class="eyebrow">Memory signal</div><h3>${last?escapeHtml(last.title):'Capture the small stuff'}</h3><p class="muted">${last?escapeHtml(memoryAnchor(last)):'Add one moment from this week. Photos and short videos can stay with the memory on this device.'}</p><button class="btn ghost" onclick="go('memories')">Open Memory Vault</button></div><div class="card"><div class="eyebrow">Next best focus</div><h3>${escapeHtml(focusSuggestion().title)}</h3><p class="muted">${escapeHtml(focusSuggestion().text)}</p><button class="btn ghost" onclick="go('graph')">See why</button></div></div>`);
}

function missionCard(m, compact = false) {
  const steps = Array.isArray(m.steps) ? m.steps : [];
  return `<div class="card mission"><div class="btnrow"><span class="pill ${m.feeling==='calm'?'sage':'rose'}">${escapeHtml(m.feeling || 'reconnect')}</span><span class="pill">${escapeHtml(m.time || '')}</span><span class="pill">${escapeHtml(m.cost || '')}</span>${m.source==='cloud-ai'?'<span class="pill gold">AI enhanced</span>':''}</div><h3>${escapeHtml(m.title)}</h3><p class="muted">${escapeHtml(m.why)}</p>${compact?'':`<div class="steps">${steps.map(s=>`<div class="step"><span>${escapeHtml(s)}</span></div>`).join('')}</div><div class="artifact"><b>Tiny surprise</b><div class="small muted">${escapeHtml(m.surprise || '')}</div></div><div class="artifact"><b>Conversation prompt</b><div class="small muted">${escapeHtml(m.prompt || '')}</div></div><div class="artifact"><b>Memory trigger</b><div class="small muted">${escapeHtml(m.capture || '')}</div></div>`}<div class="btnrow" style="margin-top:15px">${m.status==='generated'?`<button class="btn rose" onclick="updateMission('${m.id}','saved')">Save this mission</button>`:''}${m.status==='saved'?`<button class="btn sage" onclick="completeMission('${m.id}')">We did it</button>`:''}${m.status==='complete'?`<span class="pill sage">Completed ${fmtDate(m.completedDate||m.created)}</span>${m.rating?`<span class="pill gold">★ ${m.rating}/5</span>`:''}`:''}<button class="btn ghost" onclick="openModal('missionDetail',{id:'${m.id}'})">Details</button></div></div>`;
}
function missions() {
  const list = state.missions;
  return shell(`<div class="sectionhead"><div><div class="eyebrow">Joy Mission Engine</div><h2>Make a good day easier to start.</h2><p>Generate one idea by default, or choose two or three when you want options.</p></div><button class="btn rose" onclick="openModal('missionForm')">Generate</button></div>${list.length?`<div class="grid g2">${list.map(m=>missionCard(m)).join('')}</div>`:`<div class="empty"><h3>Your first mission is one tap away.</h3><p>BrightKin will create the exact number of plans you request.</p><button class="btn rose" onclick="openModal('missionForm')">Generate a mission</button></div>`}`);
}

function renderMediaAttachments(r) {
  const meta = r.mediaMeta || [];
  if (!meta.length) return '';
  return `<div class="mediaGrid">${meta.map(m => `<div class="mediaSlot" data-media-id="${escapeHtml(m.id)}" data-media-type="${escapeHtml(m.type)}"><span class="small muted">Loading ${m.type?.startsWith('video/')?'video':'photo'}…</span></div>`).join('')}</div>`;
}
function memories() {
  const list = [...state.memories].sort((a,b) => String(b.date).localeCompare(String(a.date)));
  return shell(`<div class="sectionhead"><div><div class="eyebrow">Memory Vault</div><h2>Save what would otherwise disappear.</h2><p>Text, photos, and short videos stay attached to the moment.</p></div><button class="btn rose" onclick="openModal('memoryForm')">Add memory</button></div>${list.length?`<div class="timeline">${list.map(r=>`<div class="memory"><div class="dot"></div><div class="card"><div class="small muted">${fmtDate(r.date)} · ${escapeHtml(naturalJoin(memberNames(r.people)))}</div><h3>${escapeHtml(r.title)}</h3><p class="muted">${escapeHtml(r.story)}</p>${renderMediaAttachments(r)}<div class="btnrow">${(r.emotions||[]).map(x=>`<span class="pill">${escapeHtml(x)}</span>`).join('')}</div>${(r.artifacts||[]).map(a=>`<div class="artifact"><b>${escapeHtml(a.type)}</b><div class="pre small">${escapeHtml(a.text)}</div></div>`).join('')}<div class="btnrow" style="margin-top:13px"><button class="btn secondary" onclick="transformMemory('${r.id}','Keepsake story')">Keepsake</button><button class="btn secondary" onclick="transformMemory('${r.id}','Bedtime story')">Bedtime story</button><button class="btn secondary" onclick="transformMemory('${r.id}','Future note')">Future note</button><button class="btn ghost" onclick="transformMemory('${r.id}','Follow-up ideas')">Inspired ideas</button></div></div></div>`).join('')}</div>`:`<div class="empty"><h3>No memories yet</h3><p>Add a tiny story, photo, or short video. BrightKin can turn it into a keepsake and use it to inspire future plans.</p></div>`}`);
}

function localMemoryTransform(r, type) {
  const people = naturalJoin(memberNames(r.people));
  const anchor = memoryAnchor(r);
  const emotions = emotionPhrase(r);
  if (type === 'Keepsake story') {
    return `${r.title}\n\nSome memories become important because of how they felt, not because the day was perfect. This was one of those moments for ${people}. The memory carries a ${emotions} feeling.\n\nA detail worth preserving:\n“${anchor}”\n\nYears from now, that single detail may be enough to bring the whole scene back. The part worth keeping is simple: everyone was inside the same moment together.`;
  }
  if (type === 'Bedtime story') {
    const mood = (r.emotions || [])[0] || 'warm';
    return `The Little Door Called “${r.title}”\n\nOnce upon a time, ${people} discovered a tiny door that only appeared after a ${mood} day. The door did not lead to a giant castle. It led to a room filled with ordinary things that had somehow become treasure.\n\nEvery treasure had one rule: it only glowed when people noticed it together. So they listened for laughter, looked for small surprises, and helped one another when the path became confusing.\n\nBy bedtime, the door had disappeared. In its place was a note: “Good days do not have to be big. You only have to notice them.”\n\nAfter that, ordinary days never felt quite as ordinary again.`;
  }
  if (type === 'Future note') {
    return `For later\n\nRemember “${r.title}”? I hope we never become too busy to notice days like that. One detail I want us to keep is: “${anchor}”\n\nIf we are reading this years from now, I hope we remember that the life we were trying to build was already happening in scenes like this—small, imperfect, and ours.`;
  }
  return `1. Recreate one ingredient from “${r.title},” but let a different person choose the twist.\n2. Make a 30-minute sequel with the same people and one new shared favorite.\n3. Ask everyone for one detail they remember differently, then save the answers as a new memory.`;
}

async function transformMemory(id, type) {
  const r = state.memories.find(x => x.id === id);
  if (!r) return;
  toast(`Creating ${type.toLowerCase()}…`);
  let text = localMemoryTransform(r, type);
  let source = 'local';
  if (state.settings.cloudAI) {
    try {
      const data = await aiRequest('memory_transform', {
        type, title:r.title, people:memberContext(r.people), emotions:r.emotions || [], memoryAnchor:memoryAnchor(r)
      });
      if (cleanText(data.result?.text).length > 30) { text = data.result.text.trim(); source = 'cloud-ai'; }
    } catch (err) { console.warn('Cloud memory transform failed; local result kept', err); }
  }
  r.artifacts = r.artifacts || [];
  r.artifacts.unshift({ id:uid(), type, text, created:today(), source });
  save(); render(); toast(`${type} created`);
}

function storyNight() {
  const recent = state.stories.slice(0,3);
  return shell(`<div class="sectionhead"><div><div class="eyebrow">Story Night</div><h2>Turn real family context into imagination.</h2><p>BrightKin uses selected interests and memory signals without pasting old memory prose into the story.</p></div></div><div class="card"><div class="field"><label>Featured people</label><div class="btnrow">${state.members.map(m=>`<label class="pill"><input class="storyPerson" type="checkbox" value="${m.id}" checked> ${escapeHtml(m.name)}</label>`).join('')}</div></div><div class="formgrid" style="margin-top:12px"><div class="field"><label>Theme</label><select id="storyTheme"><option>Adventure</option><option>Space</option><option>Animals</option><option>Mystery</option><option>Cozy magic</option></select></div><div class="field"><label>Tone</label><select id="storyTone"><option>Warm and funny</option><option>Calm bedtime</option><option>Epic</option></select></div><div class="field"><label>Lesson</label><input id="storyLesson" value="Courage can be small" /></div><div class="field"><label>Use a memory as inspiration</label><select id="storyMemory"><option value="">No specific memory</option>${state.memories.map(r=>`<option value="${r.id}">${escapeHtml(r.title)}</option>`).join('')}</select></div></div><button id="storyBtn" class="btn rose" style="margin-top:12px" onclick="makeStory()">Create tonight’s story</button><div id="storyOut"></div></div>${recent.length?`<div class="section"><div class="eyebrow">Recent stories</div><div class="grid">${recent.map(s=>`<div class="card"><h3>${escapeHtml(s.title)}</h3><div class="pre small">${escapeHtml(s.text)}</div></div>`).join('')}</div></div>`:''}`);
}

function localStory({ids, theme, tone, lesson, mem}) {
  const names = memberNames(ids);
  const cast = naturalJoin(names);
  const likes = knownLikes(ids).slice(0,4);
  const symbols = likes.length ? naturalJoin(likes) : 'a star, a key, a snack, and a question';
  const memoryLine = mem ? `The first clue was inspired by a real family memory called “${mem.title}.” It carried a ${emotionPhrase(mem)} feeling, so the map marked it with a tiny glowing star.` : 'The first clue asked everyone to name one small moment from the week that had made them smile.';
  const middle = tone === 'Epic'
    ? 'The path crossed a roaring bridge of wind and a valley that rearranged itself whenever anyone tried to solve it alone.'
    : tone === 'Calm bedtime'
      ? 'The path moved quietly through moonlit rooms, soft grass, and a place where even whispers sounded like music.'
      : 'The path immediately went wrong in the funniest possible way, and the mistake turned out to be the clue they needed most.';
  return `${cast} thought it was an ordinary night until a tiny ${theme.toLowerCase()} map appeared where nobody had left it. The map showed ${symbols}.\n\n${memoryLine}\n\n${middle} Nobody had the whole answer. Every person carried one piece, so the only way forward was to listen, help, and keep going together.\n\nAt the final door, the map revealed its secret: ${ensurePeriod(lesson)} The treasure was not gold. It was a small glowing jar that saved one good moment whenever somebody noticed it out loud.\n\nThey carried the jar home, but by morning it had vanished. In its place was a note: “You do not need the jar anymore. You know how to find the treasure.”\n\nAnd after that, ordinary nights never looked quite ordinary again.`;
}

async function makeStory() {
  const ids = [...document.querySelectorAll('.storyPerson:checked')].map(x => x.value);
  if (!ids.length) return toast('Choose at least one person');
  const theme = document.getElementById('storyTheme').value;
  const tone = document.getElementById('storyTone').value;
  const lesson = cleanText(document.getElementById('storyLesson').value) || 'Courage can be small';
  const mem = state.memories.find(r => r.id === document.getElementById('storyMemory').value);
  const btn = document.getElementById('storyBtn');
  if (btn) { btn.disabled = true; btn.textContent = state.settings.cloudAI ? 'Creating with AI…' : 'Creating…'; }
  let text = localStory({ ids, theme, tone, lesson, mem });
  let source = 'local';
  if (state.settings.cloudAI) {
    try {
      const data = await aiRequest('story', {
        theme, tone, lesson, people:memberContext(ids),
        memory: mem ? { title:mem.title, emotions:mem.emotions || [], anchor:memoryAnchor(mem) } : null
      });
      if (cleanText(data.result?.text).length > 120) { text = data.result.text.trim(); source = 'cloud-ai'; }
    } catch (err) { console.warn('Cloud story failed; local story kept', err); }
  }
  const title = `${theme} Story · ${new Date().toLocaleDateString(undefined,{month:'short',day:'numeric'})}`;
  state.stories.unshift({ id:uid(), title, text, created:today(), people:ids, theme, tone, source });
  state.stories = state.stories.slice(0,20);
  save();
  const out = document.getElementById('storyOut');
  if (out) out.innerHTML = `<div class="artifact" style="margin-top:18px"><b>${source==='cloud-ai'?'AI-enhanced story':'Tonight’s story'}</b><div class="pre">${escapeHtml(text)}</div></div>`;
  if (btn) { btn.disabled = false; btn.textContent = 'Create another story'; }
}

function celebrate() {
  const recent = state.celebrations.slice(0,3);
  return shell(`<div class="sectionhead"><div><div class="eyebrow">Celebrate</div><h2>Thoughtfulness without the planning load.</h2><p>Create a gesture, message, gift concept, and shared experience around a real person.</p></div></div><div class="card"><div class="formgrid"><div class="field"><label>Who is it for?</label><select id="celPerson">${state.members.map(m=>`<option value="${m.id}">${escapeHtml(m.name)}</option>`).join('')}</select></div><div class="field"><label>Occasion</label><select id="celOcc"><option>Spontaneous appreciation</option><option>Birthday</option><option>Anniversary</option><option>Achievement</option><option>Tough-week pick-me-up</option></select></div><div class="field"><label>Budget</label><select id="celBudget"><option>Free</option><option>Under $25</option><option>Under $75</option><option>Splurge</option></select></div><div class="field"><label>Time available</label><select id="celTime"><option>15 minutes</option><option>1 hour</option><option>Half day</option></select></div></div><button id="celBtn" class="btn rose" style="margin-top:12px" onclick="makeCelebration()">Build a thoughtful plan</button><div id="celOut"></div></div>${recent.length?`<div class="section"><div class="eyebrow">Recent plans</div><div class="grid">${recent.map(x=>`<div class="card"><h3>${escapeHtml(x.personName)} · ${escapeHtml(x.occasion)}</h3><div class="pre small">${escapeHtml(x.text)}</div></div>`).join('')}</div></div>`:''}`);
}

function localCelebration(p, occ, budget, time) {
  const likes = tokenize(p.interests);
  const food = tokenize(p.foods)[0] || 'a favorite treat';
  return `SMALL GESTURE\nRemove one friction point from ${p.name}’s day. Add one detail connected to ${likes[0] || 'something they enjoy'}. Center the gesture on ${p.love || 'quality time'} rather than price.\n\nMESSAGE IDEA\n“I notice what you carry, and I wanted today to feel a little lighter. One specific thing I appreciate about you is ______. I planned this because I know you enjoy ${likes[1] || 'small thoughtful moments'}.”\n\nGIFT CONCEPT\nMake a tiny “future us” bundle: ${food}, one note or object tied to ${likes[2] || 'a shared interest'}, and a card promising a specific shared experience. Budget: ${budget}.\n\nSHARED EXPERIENCE\nUse ${time} for a low-friction plan around ${likes[0] || 'a favorite activity'}. Keep one piece secret. Finish by asking what would make the next month feel lighter or more fun.\n\nLOW-COST VERSION\nRecreate a favorite memory at home, write three specific appreciations, and let ${p.name} choose the music or activity.`;
}

async function makeCelebration() {
  const p = state.members.find(m => m.id === document.getElementById('celPerson').value);
  if (!p) return;
  const occ = document.getElementById('celOcc').value;
  const budget = document.getElementById('celBudget').value;
  const time = document.getElementById('celTime').value;
  const btn = document.getElementById('celBtn');
  if (btn) { btn.disabled = true; btn.textContent = state.settings.cloudAI ? 'Planning with AI…' : 'Planning…'; }
  let text = localCelebration(p, occ, budget, time);
  let source = 'local';
  if (state.settings.cloudAI) {
    try {
      const data = await aiRequest('celebration', { person:memberContext([p.id])[0], occasion:occ, budget, time });
      if (cleanText(data.result?.text).length > 100) { text = data.result.text.trim(); source = 'cloud-ai'; }
    } catch (err) { console.warn('Cloud celebration failed; local plan kept', err); }
  }
  state.celebrations.unshift({ id:uid(), personId:p.id, personName:p.name, occasion:occ, budget, time, text, created:today(), source });
  state.celebrations = state.celebrations.slice(0,20);
  save();
  const out = document.getElementById('celOut');
  if (out) out.innerHTML = `<div class="artifact" style="margin-top:18px"><div class="pre">${escapeHtml(text)}</div></div>`;
  if (btn) { btn.disabled = false; btn.textContent = 'Build another plan'; }
}

function focusSuggestion() {
  const counts = {};
  state.missions.filter(m => m.status === 'complete').forEach(m => (m.people || []).forEach(id => counts[id]=(counts[id]||0)+1));
  const least = state.members.slice().sort((a,b)=>(counts[a.id]||0)-(counts[b.id]||0))[0];
  if (least) return { title:`Create a moment around ${least.name}`, text:`${least.name} has fewer completed shared missions in the current graph. A small tailored experience would improve balance and teach BrightKin more about what lands well.` };
  return { title:'Complete one shared mission', text:'The graph improves fastest when you rate real experiences, not when you browse ideas.' };
}

function relationshipScore(id) {
  const mem = state.memories.filter(r => (r.people || []).includes(id)).length;
  const done = state.missions.filter(m => m.status==='complete' && (m.people || []).includes(id)).length;
  const rated = state.missions.filter(m => m.rating && (m.people || []).includes(id));
  const avg = rated.length ? rated.reduce((a,m)=>a+Number(m.rating),0)/rated.length : 0;
  return { mem, done, avg, score: Math.min(100, Math.round(20 + mem*8 + done*12 + avg*5)) };
}

function graph() {
  const members = state.members;
  const positions = members.map((m,i)=>{ const a=(Math.PI*2*i/Math.max(1,members.length))-Math.PI/2; return {id:m.id,x:50+34*Math.cos(a),y:50+34*Math.sin(a)}; });
  const edges=[];
  for(let i=0;i<positions.length;i++) for(let j=i+1;j<positions.length;j++) {
    const a=positions[i], b=positions[j], dx=b.x-a.x, dy=b.y-a.y, len=Math.sqrt(dx*dx+dy*dy), ang=Math.atan2(dy,dx)*180/Math.PI;
    const shared=sharedInterests([a.id,b.id]).length;
    const mems=state.memories.filter(r=>(r.people||[]).includes(a.id)&&(r.people||[]).includes(b.id)).length;
    const comps=state.missions.filter(m=>m.status==='complete'&&(m.people||[]).includes(a.id)&&(m.people||[]).includes(b.id)).length;
    if(shared+mems+comps>0) edges.push(`<div class="edge" style="left:${a.x}%;top:${a.y}%;width:${len}%;transform:rotate(${ang}deg);opacity:${Math.min(.9,.22+(shared+mems+comps)*.13)}"></div>`);
  }
  return shell(`<div class="sectionhead"><div><div class="eyebrow">Joy Graph</div><h2>Your relationship map gets smarter by living.</h2><p>Memories, completed plans, and ratings strengthen the signals between people.</p></div></div><div class="graph">${edges.join('')}<div class="node" style="left:50%;top:50%;background:#2f2a27;width:100px;height:100px">${escapeHtml(state.household)}</div>${positions.map((p,i)=>{const m=members.find(x=>x.id===p.id),c=['#ed815d','#2f6c63','#7d4965','#d49a43','#5a718a','#8b6b45'][i%6];return `<div class="node" style="left:${p.x}%;top:${p.y}%;background:${c}">${escapeHtml(m?.name||'')}</div>`}).join('')}</div><div class="section grid g2">${members.map(m=>{const s=relationshipScore(m.id);return `<div class="card"><div class="member"><div class="avatar">${escapeHtml(m.name?.[0]||'?')}</div><div><h3>${escapeHtml(m.name)}</h3><div class="small muted">${s.mem} memories · ${s.done} completed missions · ${s.avg?s.avg.toFixed(1)+'★':'no ratings yet'}</div></div></div><div class="progress" style="margin-top:12px"><span style="width:${s.score}%"></span></div><p class="small muted">${escapeHtml(m.interests || 'Add interests to improve the graph.')}</p></div>`}).join('')}</div>`);
}

function weekly() {
  const completed = state.missions.filter(m => m.status === 'complete' && inLastDays(m.completedDate || m.created, 7));
  const memories = state.memories.filter(r => inLastDays(r.date, 7));
  const people = new Set(completed.flatMap(m => m.people || []));
  const ratings = completed.filter(m=>m.rating);
  const yearCount = state.missions.filter(m=>m.status==='complete' && String(m.completedDate||m.created).startsWith(String(currentYear()))).length + state.memories.filter(r=>String(r.date).startsWith(String(currentYear()))).length;
  return shell(`<div class="sectionhead"><div><div class="eyebrow">Good Days</div><h2>This week’s connection signal.</h2><p>A true seven-day view, not an all-time total.</p></div></div><div class="kpirow"><div class="kpi"><b>${completed.length}</b><span class="small muted">Experiences this week</span></div><div class="kpi"><b>${memories.length}</b><span class="small muted">Memories this week</span></div><div class="kpi"><b>${people.size}</b><span class="small muted">People connected</span></div><div class="kpi"><b>${avgRating(ratings)}</b><span class="small muted">Average joy rating</span></div></div><div class="section card"><div class="eyebrow">Suggested focus</div><h2>${escapeHtml(focusSuggestion().title)}</h2><p class="muted">${escapeHtml(focusSuggestion().text)}</p></div><div class="section hero"><div class="eyebrow">Year in Joy</div><h1>${yearCount} moments worth keeping.</h1><p>BrightKin can now assemble those moments into a private, printable annual book.</p><button class="btn rose" onclick="go('yearbook')">Build my Year in Joy</button></div>`);
}

function availableYears() {
  const years = new Set([currentYear()]);
  state.memories.forEach(r => { const y = Number(String(r.date).slice(0,4)); if(y>2000) years.add(y); });
  state.missions.filter(m=>m.status==='complete').forEach(m => { const y=Number(String(m.completedDate||m.created).slice(0,4)); if(y>2000) years.add(y); });
  return [...years].sort((a,b)=>b-a);
}
function yearbookData(year) {
  const memories = state.memories.filter(r=>String(r.date).startsWith(String(year))).sort((a,b)=>String(a.date).localeCompare(String(b.date)));
  const missions = state.missions.filter(m=>m.status==='complete' && String(m.completedDate||m.created).startsWith(String(year))).sort((a,b)=>String(a.completedDate||a.created).localeCompare(String(b.completedDate||b.created)));
  const emotions={}; memories.flatMap(r=>r.emotions||[]).forEach(x=>emotions[x]=(emotions[x]||0)+1);
  const topEmotions=Object.entries(emotions).sort((a,b)=>b[1]-a[1]).slice(0,4).map(x=>x[0]);
  const topMission=missions.filter(m=>m.rating).sort((a,b)=>Number(b.rating)-Number(a.rating))[0] || missions[0];
  return {year, memories, missions, topEmotions, topMission};
}
function setYearbookYear(y) { state.settings.yearbookYear = Number(y); save(); render(); }
function yearbook() {
  const year = Number(state.settings.yearbookYear || currentYear());
  const d = yearbookData(year);
  return shell(`<div class="sectionhead"><div><div class="eyebrow">Year in Joy</div><h2>Your private family yearbook.</h2><p>Automatically assembled from completed missions and memories.</p></div><div class="field compact"><label>Year</label><select onchange="setYearbookYear(this.value)">${availableYears().map(y=>`<option ${y===year?'selected':''}>${y}</option>`).join('')}</select></div></div><div class="bookCover"><div class="eyebrow">${escapeHtml(state.household)}</div><h1>${year}<br>Year in Joy</h1><p>${d.memories.length + d.missions.length} moments worth keeping.</p></div><div class="section grid g2"><div class="card"><h3>By the numbers</h3><p><b>${d.missions.length}</b> shared experiences<br><b>${d.memories.length}</b> saved memories<br><b>${avgRating(d.missions)}</b> average joy rating</p></div><div class="card"><h3>The year felt like</h3><p class="muted">${escapeHtml(d.topEmotions.length ? naturalJoin(d.topEmotions) : 'still waiting for a few emotion tags')}</p>${d.topMission?`<div class="pill gold">Favorite mission: ${escapeHtml(d.topMission.title)}</div>`:''}</div></div><div class="section"><div class="eyebrow">Memory chapters</div><div class="bookPages">${d.memories.length?d.memories.map((r,i)=>`<article class="card bookPage"><div class="small muted">Chapter ${i+1} · ${fmtDate(r.date)}</div><h2>${escapeHtml(r.title)}</h2>${renderMediaAttachments(r)}<p>${escapeHtml(memoryAnchor(r))}</p><p class="small muted">With ${escapeHtml(naturalJoin(memberNames(r.people)))} · ${escapeHtml(emotionPhrase(r))}</p></article>`).join(''):`<div class="empty">Add memories from ${year} to fill this section.</div>`}</div></div><div class="section"><div class="eyebrow">Experiences we chose</div><div class="grid g2">${d.missions.length?d.missions.map(m=>`<div class="card"><h3>${escapeHtml(m.title)}</h3><p class="muted">${escapeHtml(m.why)}</p><span class="pill">${fmtDate(m.completedDate||m.created)}</span>${m.rating?` <span class="pill gold">★ ${m.rating}/5</span>`:''}</div>`).join(''):`<div class="empty">Complete a Joy Mission in ${year} and it will appear here.</div>`}</div></div><div class="section card"><h3>A note to future us</h3><p class="muted">The point was never to manufacture perfect days. It was to notice enough small good ones that the year felt like ours.</p></div><div class="btnrow section noPrint"><button class="btn rose" onclick="printYearbook()">Print / Save PDF</button><button class="btn secondary" onclick="downloadYearbook()">Download book</button></div>`);
}

async function yearbookStandaloneHtml(year) {
  const d=yearbookData(year);
  const memoryBlocks=[];
  for (const r of d.memories) {
    let image='';
    const first=(r.mediaMeta||[]).find(m=>String(m.type).startsWith('image/'));
    if(first){try{const rec=await getMediaRecord(first.id);if(rec?.blob)image=`<img src="${await blobToDataUrl(rec.blob)}" alt="Saved memory photo">`;}catch{}}
    memoryBlocks.push(`<section><h2>${escapeHtml(r.title)}</h2><div class="meta">${fmtDate(r.date)} · ${escapeHtml(naturalJoin(memberNames(r.people)))}</div>${image}<p>${escapeHtml(memoryAnchor(r))}</p></section>`);
  }
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${escapeHtml(state.household)} — ${year} Year in Joy</title><style>body{font-family:ui-serif,Georgia,serif;color:#2f2a27;max-width:760px;margin:auto;padding:48px 28px;line-height:1.6}h1{font-size:58px;line-height:1;margin:10px 0 60px}h2{font-size:30px;margin-bottom:4px}.cover{min-height:70vh;display:flex;flex-direction:column;justify-content:center;border-bottom:1px solid #ddd}.meta{color:#746c65;font:14px ui-sans-serif,system-ui;margin-bottom:18px}section{break-inside:avoid;margin:55px 0}img{max-width:100%;max-height:520px;object-fit:cover;border-radius:18px;margin:16px 0}.footer{margin-top:80px;border-top:1px solid #ddd;padding-top:30px;color:#746c65}@media print{body{padding:0}.cover{break-after:page}}</style></head><body><div class="cover"><div>${escapeHtml(state.household)}</div><h1>${year}<br>Year in Joy</h1><p>${d.memories.length+d.missions.length} moments worth keeping.</p></div>${memoryBlocks.join('')}<section><h2>Experiences we chose</h2>${d.missions.map(m=>`<p><b>${escapeHtml(m.title)}</b> — ${fmtDate(m.completedDate||m.created)}${m.rating?` · ★ ${m.rating}/5`:''}</p>`).join('') || '<p>No completed missions were recorded this year.</p>'}</section><div class="footer">Built privately with BrightKin. The point was never perfect days; it was noticing enough small good ones that the year felt like ours.</div></body></html>`;
}
function printYearbook(){window.print()}
async function downloadYearbook(){const year=Number(state.settings.yearbookYear||currentYear());toast('Building your book…');const html=await yearbookStandaloneHtml(year);downloadBlob(new Blob([html],{type:'text/html'}),`brightkin-year-in-joy-${year}.html`);toast('Year in Joy downloaded')}

function familyShare(){return shell(`<div class="sectionhead"><div><div class="eyebrow">Family Share</div><h2>Move your household to another device.</h2><p>A private snapshot backup can include profiles, memories, stories, missions, photos, and short videos. No central account is required.</p></div></div><div class="grid g2"><div class="card"><h3>Share this household</h3><p class="muted">On iPhone, BrightKin uses the system share sheet when file sharing is supported. Otherwise it downloads a backup file.</p><div class="field"><label>Optional backup passphrase</label><input id="sharePass" type="password" autocomplete="new-password" placeholder="Recommended when sending outside AirDrop"></div><div class="btnrow" style="margin-top:12px"><button id="shareBtn" class="btn rose" onclick="shareHousehold()">Share household</button><button class="btn secondary" onclick="downloadHouseholdBackup()">Download backup</button></div></div><div class="card"><h3>Import on this device</h3><p class="muted">Choose a .brightkin backup created by BrightKin. Import replaces the current household on this device after confirmation.</p><div class="field"><label>Backup file</label><input id="importFile" type="file" accept=".brightkin,application/vnd.brightkin+json,application/json"></div><div class="field"><label>Passphrase, if used</label><input id="importPass" type="password" autocomplete="current-password"></div><button class="btn sage" onclick="importHouseholdBackup()">Import household</button></div></div><div class="section card"><h3>How sharing works</h3><p class="muted">This is snapshot-based sharing rather than always-on cloud sync. It keeps BrightKin useful without creating a central database of family memories. You can re-share an updated backup whenever another device needs the latest copy.</p></div>`)}

function more(){return shell(`<div class="sectionhead"><div><div class="eyebrow">More</div><h2>Tools that turn context into care.</h2></div></div><div class="grid g2"><button class="card" onclick="openModal('memberForm')" style="text-align:left"><h3>👥 Household Profiles</h3><p class="muted">Add or refine the people who make recommendations personal.</p></button><button class="card" onclick="go('story')" style="text-align:left"><h3>📚 Story Night</h3><p class="muted">Coherent personalized stories using selected family context.</p></button><button class="card" onclick="go('celebrate')" style="text-align:left"><h3>🎉 Celebrate</h3><p class="muted">Thoughtful gesture planning around a real person.</p></button><button class="card" onclick="go('weekly')" style="text-align:left"><h3>☀️ Good Days</h3><p class="muted">A true seven-day connection summary.</p></button><button class="card" onclick="go('yearbook')" style="text-align:left"><h3>📖 Year in Joy</h3><p class="muted">Build, print, and download a private annual keepsake.</p></button><button class="card" onclick="go('share')" style="text-align:left"><h3>↗ Family Share</h3><p class="muted">Move the whole household between devices, including media.</p></button><button class="card" onclick="go('settings')" style="text-align:left"><h3>🔒 Privacy & storage</h3><p class="muted">Review on-device generation, local storage, exports, and reset.</p></button><button class="card" onclick="go('about')" style="text-align:left"><h3>◎ Why BrightKin</h3><p class="muted">The product thesis and design principles.</p></button></div><div class="section card install"><h3>Add BrightKin to your iPhone</h3><p class="muted">Open the HTTPS site in Safari, tap Share, then “Add to Home Screen.” BrightKin is built to continue working with its local data when the network is unreliable.</p></div>`)}

function settings(){return shell(`<div class="sectionhead"><div><div class="eyebrow">Privacy & control</div><h2>Your family should never be the product.</h2></div></div><div class="grid g2"><div class="card"><h3>On-device generation</h3><p class="muted">This GitHub edition runs Joy Missions, stories, memory transformations, and celebration planning locally in your browser. Family context is not sent to a BrightKin server.</p><span class="pill sage">Local mode active</span></div><div class="card"><h3>On-device media storage</h3><p class="muted">Photos and short videos are stored in IndexedDB on this device. BrightKin requests persistent storage when possible.</p><button class="btn secondary" onclick="requestPersistentStorage()">Protect local storage</button></div><div class="card"><h3>Backup & family transfer</h3><p class="muted">Create an optional passphrase-protected .brightkin backup for another device.</p><button class="btn secondary" onclick="go('share')">Open Family Share</button></div><div class="card"><h3>Metadata export</h3><p class="muted">Download household text and settings as JSON. Media is only included in a full .brightkin backup.</p><button class="btn secondary" onclick="exportData()">Export JSON</button></div><div class="card"><h3>Child-safe design</h3><p class="muted">No public profiles, stranger chat, endless feed, or engagement manipulation loop. The goal is to move attention toward real people and shared time.</p></div><div class="card"><h3>Reset this device</h3><p class="muted">Delete BrightKin text data and locally stored media from this browser.</p><button class="btn ghost" onclick="resetAll()">Delete local data</button></div></div>`)}
function about(){return shell(`<div class="hero"><div class="eyebrow">Why BrightKin</div><h1>Technology should make people more human, not less.</h1><p>The thesis is simple: intelligent software can become the planning layer that helps real relationships happen more often, with less friction and better memory—without becoming a substitute friend.</p></div><div class="section grid g3"><div class="card"><h3>Context moat</h3><p class="muted">The Joy Graph learns specific people, shared history, and real experience ratings.</p></div><div class="card"><h3>Action moat</h3><p class="muted">Success is not time spent chatting. It is missions completed, memories preserved, and people connected.</p></div><div class="card"><h3>Trust moat</h3><p class="muted">Local-first generation and storage, no ads, no public family feed, and portable encrypted backups.</p></div></div>`)}
function modalHtml(){
  const {type,data} = state.modal;
  if(type==='onboard')return `<div class="modalwrap" onclick="if(event.target===this)closeModal()"><div class="modal"><button class="close" onclick="closeModal()">×</button><div class="eyebrow">Create household</div><h2>Start with the people, not the technology.</h2><div class="field"><label>Household name</label><input id="hhName" placeholder="The Smith Family"></div><div class="field" style="margin-top:10px"><label>Your name</label><input id="firstName" placeholder="Your name"></div><div class="field" style="margin-top:10px"><label>One thing you love doing</label><input id="firstInterest" placeholder="road trips, coffee, hiking…"></div><button class="btn rose block" style="margin-top:15px" onclick="finishOnboard()">Create BrightKin</button><button class="btn secondary block" style="margin-top:8px" onclick="startDemo();closeModal()">Or load demo family</button></div></div>`;
  if(type==='memberForm')return `<div class="modalwrap" onclick="if(event.target===this)closeModal()"><div class="modal"><button class="close" onclick="closeModal()">×</button><div class="eyebrow">Household profiles</div><h2>Add the details generic AI never knows.</h2><div class="grid">${state.members.map(m=>`<div class="card member"><div class="avatar">${escapeHtml(m.name?.[0]||'?')}</div><div style="min-width:0"><b>${escapeHtml(m.name)}</b><div class="small muted">${escapeHtml(m.role)} · ${escapeHtml(m.interests||'No interests added yet')}</div></div></div>`).join('')}</div>${state.members.length<10?`<div class="formgrid" style="margin-top:14px"><div class="field"><label>Name / nickname</label><input id="pmName" placeholder="Name"></div><div class="field"><label>Relationship</label><input id="pmRole" placeholder="Partner, child, grandparent…"></div><div class="field"><label>Age band</label><select id="pmAge"><option>Adult</option><option>13–17</option><option>8–12</option><option>3–7</option><option>0–2</option></select></div><div class="field"><label>Preferred appreciation</label><select id="pmLove"><option>Quality time</option><option>Acts of service</option><option>Words of affirmation</option><option>Gifts</option><option>Physical affection</option></select></div><div class="field"><label>Interests</label><input id="pmInterests" placeholder="music, animals, road trips…"></div><div class="field"><label>Favorite foods</label><input id="pmFoods" placeholder="tacos, tea, pizza…"></div><div class="field"><label>Dislikes / avoid</label><input id="pmDislikes" placeholder="crowds, long waits…"></div><div class="field"><label>Energy preference</label><select id="pmEnergy"><option>low</option><option selected>medium</option><option>high</option></select></div></div><div class="field" style="margin-top:10px"><label>Accessibility or helpful notes</label><textarea id="pmNotes" placeholder="Anything that helps BrightKin make better plans."></textarea></div><button class="btn rose block" style="margin-top:12px" onclick="addMember()">Add person</button>`:`<p class="muted">This build supports up to 10 household profiles.</p>`}<button class="btn secondary block" style="margin-top:8px" onclick="closeModal()">Done</button></div></div>`;
  if(type==='missionForm')return `<div class="modalwrap" onclick="if(event.target===this)closeModal()"><div class="modal"><button class="close" onclick="closeModal()">×</button><div class="eyebrow">Generate missions</div><h2>What kind of good day fits right now?</h2><div class="field"><label>Who is involved?</label><div class="btnrow">${state.members.map(m=>`<label class="pill"><input type="checkbox" class="missionPerson" value="${m.id}" checked> ${escapeHtml(m.name)}</label>`).join('')}</div></div><div class="formgrid" style="margin-top:13px"><div class="field"><label>How many ideas?</label><select id="mfCount"><option value="1" selected>1 idea</option><option value="2">2 ideas</option><option value="3">3 ideas</option></select></div><div class="field"><label>Time</label><select id="mfTime"><option>15 min</option><option selected>1 hr</option><option>half day</option><option>full day</option></select></div><div class="field"><label>Budget</label><select id="mfBudget"><option>free</option><option selected>under $25</option><option>under $75</option><option>splurge</option></select></div><div class="field"><label>Energy</label><select id="mfEnergy"><option>low</option><option selected>medium</option><option>high</option></select></div><div class="field"><label>Setting</label><select id="mfSetting"><option>either</option><option>indoors</option><option>outdoors</option></select></div><div class="field"><label>Desired feeling</label><select id="mfFeeling"><option>laugh</option><option>reconnect</option><option>adventure</option><option>calm</option><option>surprise</option><option>learn</option><option>celebrate</option></select></div></div><button id="missionGenerateBtn" class="btn rose block" style="margin-top:15px" onclick="submitMissionForm()">Create Joy Mission</button></div></div>`;
  if(type==='memoryForm')return `<div class="modalwrap" onclick="if(event.target===this)closeModal()"><div class="modal"><button class="close" onclick="closeModal()">×</button><div class="eyebrow">Save a memory</div><h2>The tiny details become the valuable part.</h2><div class="formgrid"><div class="field"><label>Title</label><input id="memTitle" placeholder="The rainy pancake contest"></div><div class="field"><label>Date</label><input id="memDate" type="date" value="${today()}"></div></div><div class="field" style="margin-top:10px"><label>People</label><div class="btnrow">${state.members.map(m=>`<label class="pill"><input type="checkbox" class="memPerson" value="${m.id}" checked> ${escapeHtml(m.name)}</label>`).join('')}</div></div><div class="field" style="margin-top:10px"><label>What happened?</label><textarea id="memStory" placeholder="Write it the way you would tell someone who wasn’t there."></textarea></div><div class="field" style="margin-top:10px"><label>Emotion tags</label><input id="memEmotions" placeholder="funny, calm, proud, connected"></div><div class="field" style="margin-top:10px"><label>Photos or short videos</label><input id="memMedia" type="file" accept="image/*,video/*" multiple onchange="updateMediaHint(this)"><div id="mediaHint" class="small muted">Up to ${MAX_MEDIA_PER_MEMORY} files, ${Math.round(MAX_MEDIA_FILE/1024/1024)} MB each. Stored on this device.</div></div><button id="memorySaveBtn" class="btn rose block" style="margin-top:15px" onclick="saveMemory()">Save memory</button></div></div>`;
  if(type==='missionDetail'){const m=state.missions.find(x=>x.id===data.id);return `<div class="modalwrap" onclick="if(event.target===this)closeModal()"><div class="modal"><button class="close" onclick="closeModal()">×</button>${m?missionCard(m):''}</div></div>`}
  if(type==='rate'){const m=state.missions.find(x=>x.id===data.id);return `<div class="modalwrap"><div class="modal"><div class="eyebrow">Mission complete</div><h2>How much joy did this actually create?</h2><p class="muted">This rating trains future recommendations more than browsing ever could.</p><div class="rating">${[1,2,3,4,5].map(n=>`<button aria-label="Rate ${n} out of 5" onclick="rateMission('${m.id}',${n})">${n<5?'★':'🌟'}</button>`).join('')}</div><p class="small muted">1 = not for us · 5 = absolutely do this kind of thing again</p></div></div>`}
  return '';
}

function finishOnboard(){
  const hh=cleanText(document.getElementById('hhName').value), name=cleanText(document.getElementById('firstName').value), interest=cleanText(document.getElementById('firstInterest').value);
  if(!hh||!name)return toast('Add a household and name');
  state.household=hh; state.members=[{id:uid(),name,role:'You',age:'Adult',interests:interest,dislikes:'',foods:'',love:'Quality time',energy:'medium',access:'',notes:''}]; state.onboarded=true; state.view='home'; state.modal=null; save(); render(); setTimeout(()=>openModal('memberForm'),100);
}
function addMember(){
  const name=cleanText(document.getElementById('pmName')?.value); if(!name)return toast('Add a name');
  state.members.push({id:uid(),name,role:cleanText(document.getElementById('pmRole').value)||'Family',age:document.getElementById('pmAge').value,interests:cleanText(document.getElementById('pmInterests').value),dislikes:cleanText(document.getElementById('pmDislikes').value),foods:cleanText(document.getElementById('pmFoods').value),love:document.getElementById('pmLove').value,energy:document.getElementById('pmEnergy').value,access:'',notes:cleanText(document.getElementById('pmNotes').value)});
  save(); render(); toast(name+' added');
}
function updateMediaHint(input){const files=[...(input.files||[])];const el=document.getElementById('mediaHint');if(el)el.textContent=files.length?`${Math.min(files.length,MAX_MEDIA_PER_MEMORY)} file${files.length===1?'':'s'} selected${files.length>MAX_MEDIA_PER_MEMORY?' · only the first '+MAX_MEDIA_PER_MEMORY+' will be saved':''}.`:`Up to ${MAX_MEDIA_PER_MEMORY} files, ${Math.round(MAX_MEDIA_FILE/1024/1024)} MB each. Stored on this device.`}

async function saveMemory(){
  const title=cleanText(document.getElementById('memTitle').value), story=cleanText(document.getElementById('memStory').value);
  if(!title||!story)return toast('Add a title and story');
  const input=document.getElementById('memMedia');
  const files=[...(input?.files||[])].slice(0,MAX_MEDIA_PER_MEMORY);
  const tooLarge=files.find(f=>f.size>MAX_MEDIA_FILE); if(tooLarge)return toast(`${tooLarge.name} is over ${Math.round(MAX_MEDIA_FILE/1024/1024)} MB`);
  const btn=document.getElementById('memorySaveBtn'); if(btn){btn.disabled=true;btn.textContent=files.length?'Saving media…':'Saving…'}
  let mediaMeta=[];
  try{if(files.length){await requestPersistentStorage(false);mediaMeta=await storeMediaFiles(files)}}catch(err){console.error(err);if(btn){btn.disabled=false;btn.textContent='Save memory'}return toast('Could not store media on this device')}
  const r={id:uid(),title,date:document.getElementById('memDate').value||today(),people:[...document.querySelectorAll('.memPerson:checked')].map(x=>x.value),story,emotions:cleanText(document.getElementById('memEmotions').value).split(',').map(x=>x.trim()).filter(Boolean),artifacts:[],mediaIds:mediaMeta.map(x=>x.id),mediaMeta};
  state.memories.unshift(r);state.modal=null;save();render();toast('Memory added to your Joy Graph');
}
function updateMission(id,status){const m=state.missions.find(x=>x.id===id);if(m){m.status=status;save();render();toast(status==='saved'?'Mission saved':'Updated')}}
function completeMission(id){const m=state.missions.find(x=>x.id===id);if(!m)return;m.status='complete';m.completedDate=today();state.stats.completed=Number(state.stats.completed||0)+1;state.modal={type:'rate',data:{id}};save();render();const el=document.createElement('div');el.className='celebrate';document.body.appendChild(el);setTimeout(()=>el.remove(),1200)}
function rateMission(id,n){const m=state.missions.find(x=>x.id===id);if(m)m.rating=n;state.modal=null;save();render();toast('Rating saved — Joy Graph updated')}

function exportData(){const payload={...state,toast:'',modal:null};downloadBlob(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}),`brightkin-${safeSlug(state.household)}-${today()}.json`);toast('JSON export created')}
async function resetAll(){if(confirm('Delete all BrightKin data and saved media from this browser?')){localStorage.removeItem(STORAGE_KEY);for(const k of LEGACY_KEYS)localStorage.removeItem(k);await clearMediaDB().catch(()=>{});state=defaultState();render()}}
function toggleCloudAI(v){state.settings.cloudAI=!!v;save();toast(v?'Cloud AI enabled':'Cloud AI disabled')}
async function testCloudAI(){try{const res=await fetch('/api/joy-ai',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({task:'ping',context:{}})});const data=await res.json();if(res.ok&&data.available)toast('Cloud AI route is ready');else toast('Cloud AI is not available on this deployment')}catch{toast('Cloud AI is not available right now')}}

function openMediaDB(){return new Promise((resolve,reject)=>{const req=indexedDB.open(MEDIA_DB,1);req.onupgradeneeded=()=>{const db=req.result;if(!db.objectStoreNames.contains(MEDIA_STORE))db.createObjectStore(MEDIA_STORE,{keyPath:'id'})};req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error)})}
async function storeMediaFiles(files){const db=await openMediaDB();const meta=[];for(const file of files){const id=uid();await new Promise((resolve,reject)=>{const tx=db.transaction(MEDIA_STORE,'readwrite');tx.objectStore(MEDIA_STORE).put({id,blob:file,name:file.name,type:file.type||'application/octet-stream',size:file.size,created:Date.now()});tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)});meta.push({id,name:file.name,type:file.type||'application/octet-stream',size:file.size})}db.close();return meta}
async function putMediaRecord(rec){const db=await openMediaDB();await new Promise((resolve,reject)=>{const tx=db.transaction(MEDIA_STORE,'readwrite');tx.objectStore(MEDIA_STORE).put(rec);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)});db.close()}
async function getMediaRecord(id){const db=await openMediaDB();const rec=await new Promise((resolve,reject)=>{const req=db.transaction(MEDIA_STORE,'readonly').objectStore(MEDIA_STORE).get(id);req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error)});db.close();return rec}
async function clearMediaDB(){return new Promise((resolve,reject)=>{const req=indexedDB.deleteDatabase(MEDIA_DB);req.onsuccess=()=>resolve();req.onerror=()=>reject(req.error);req.onblocked=()=>resolve()})}
function releaseMediaUrls(){liveObjectUrls.forEach(u=>URL.revokeObjectURL(u));liveObjectUrls=[]}
async function hydrateMedia(){releaseMediaUrls();const slots=[...document.querySelectorAll('.mediaSlot[data-media-id]')];for(const slot of slots){try{const rec=await getMediaRecord(slot.dataset.mediaId);if(!rec?.blob){slot.textContent='Media unavailable on this device';continue}const url=URL.createObjectURL(rec.blob);liveObjectUrls.push(url);slot.replaceChildren();if(String(rec.type).startsWith('video/')){const v=document.createElement('video');v.src=url;v.controls=true;v.preload='metadata';v.playsInline=true;slot.appendChild(v)}else{const img=document.createElement('img');img.src=url;img.alt=rec.name||'Saved memory photo';img.loading='lazy';slot.appendChild(img)}}catch{slot.textContent='Media unavailable on this device'}}}
async function requestPersistentStorage(showToast=true){if(navigator.storage?.persist){const ok=await navigator.storage.persist();if(showToast)toast(ok?'Persistent storage granted':'Browser will manage storage automatically');return ok}if(showToast)toast('Persistent storage control is not available in this browser');return false}

function bytesToBase64(bytes){let binary='';const chunk=0x8000;for(let i=0;i<bytes.length;i+=chunk)binary+=String.fromCharCode(...bytes.subarray(i,Math.min(i+chunk,bytes.length)));return btoa(binary)}
function base64ToBytes(b64){const binary=atob(b64);const bytes=new Uint8Array(binary.length);for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);return bytes}
async function compressBytes(bytes){if(!('CompressionStream'in window))return {bytes,format:'none'};const stream=new Blob([bytes]).stream().pipeThrough(new CompressionStream('gzip'));return {bytes:new Uint8Array(await new Response(stream).arrayBuffer()),format:'gzip'}}
async function decompressBytes(bytes,format){if(format!=='gzip')return bytes;const stream=new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));return new Uint8Array(await new Response(stream).arrayBuffer())}
async function deriveBackupKey(passphrase,salt){const material=await crypto.subtle.importKey('raw',new TextEncoder().encode(passphrase),'PBKDF2',false,['deriveKey']);return crypto.subtle.deriveKey({name:'PBKDF2',salt,iterations:150000,hash:'SHA-256'},material,{name:'AES-GCM',length:256},false,['encrypt','decrypt'])}
async function encryptBytes(bytes,passphrase){const salt=crypto.getRandomValues(new Uint8Array(16)),iv=crypto.getRandomValues(new Uint8Array(12)),key=await deriveBackupKey(passphrase,salt),cipher=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv},key,bytes));return{salt,iv,cipher}}
async function decryptBytes(cipher,passphrase,salt,iv){const key=await deriveBackupKey(passphrase,salt);return new Uint8Array(await crypto.subtle.decrypt({name:'AES-GCM',iv},key,cipher))}
async function blobToDataUrl(blob){return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=()=>reject(r.error);r.readAsDataURL(blob)})}
async function collectMediaForBackup(){const ids=[...new Set(state.memories.flatMap(r=>r.mediaIds||[]))],items=[];for(const id of ids){const rec=await getMediaRecord(id).catch(()=>null);if(rec?.blob){items.push({id:rec.id,name:rec.name,type:rec.type,size:rec.size,created:rec.created,data:bytesToBase64(new Uint8Array(await rec.blob.arrayBuffer()))})}}return items}
async function buildBackupFile(passphrase=''){const payload={magic:'BRIGHTKIN_BACKUP',version:APP_VERSION,created:new Date().toISOString(),state:{...state,toast:'',modal:null},media:await collectMediaForBackup()};const raw=new TextEncoder().encode(JSON.stringify(payload));const compressed=await compressBytes(raw);let wrapper;if(passphrase){const enc=await encryptBytes(compressed.bytes,passphrase);wrapper={magic:'BRIGHTKIN_FILE',version:APP_VERSION,encryption:'aes-gcm',compression:compressed.format,salt:bytesToBase64(enc.salt),iv:bytesToBase64(enc.iv),data:bytesToBase64(enc.cipher)}}else{wrapper={magic:'BRIGHTKIN_FILE',version:APP_VERSION,encryption:'none',compression:compressed.format,data:bytesToBase64(compressed.bytes)}}const blob=new Blob([JSON.stringify(wrapper)],{type:'application/vnd.brightkin+json'});return new File([blob],`brightkin-${safeSlug(state.household)}-${today()}.brightkin`,{type:'application/vnd.brightkin+json'})}
function downloadBlob(blob,name){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),3000)}
async function downloadHouseholdBackup(){const pass=cleanText(document.getElementById('sharePass')?.value||'');toast('Building backup…');try{const file=await buildBackupFile(pass);downloadBlob(file,file.name);toast(pass?'Encrypted backup downloaded':'Backup downloaded')}catch(err){console.error(err);toast('Could not build backup')}}
async function shareHousehold(){const pass=cleanText(document.getElementById('sharePass')?.value||'');const btn=document.getElementById('shareBtn');if(btn){btn.disabled=true;btn.textContent='Building backup…'}try{const file=await buildBackupFile(pass);if(navigator.canShare?.({files:[file]})&&navigator.share){await navigator.share({title:`${state.household} · BrightKin`,text:'BrightKin household backup',files:[file]});toast('Share sheet opened')}else{downloadBlob(file,file.name);toast('Sharing files is unavailable here, so the backup was downloaded')}}catch(err){if(err?.name!=='AbortError'){console.error(err);toast('Could not share backup')}}finally{if(btn){btn.disabled=false;btn.textContent='Share household'}}}
async function parseBackupFile(file,passphrase=''){const wrapper=JSON.parse(await file.text());if(wrapper.magic!=='BRIGHTKIN_FILE')throw new Error('Not a BrightKin backup');let bytes=base64ToBytes(wrapper.data);if(wrapper.encryption==='aes-gcm'){if(!passphrase)throw new Error('This backup needs its passphrase');bytes=await decryptBytes(bytes,passphrase,base64ToBytes(wrapper.salt),base64ToBytes(wrapper.iv))}bytes=await decompressBytes(bytes,wrapper.compression);const payload=JSON.parse(new TextDecoder().decode(bytes));if(payload.magic!=='BRIGHTKIN_BACKUP')throw new Error('Backup payload is invalid');return payload}
async function importHouseholdBackup(){const file=document.getElementById('importFile')?.files?.[0],pass=cleanText(document.getElementById('importPass')?.value||'');if(!file)return toast('Choose a BrightKin backup');if(!confirm('Replace the current household on this device with this backup?'))return;toast('Importing household…');try{const payload=await parseBackupFile(file,pass);await clearMediaDB().catch(()=>{});for(const m of payload.media||[]){const blob=new Blob([base64ToBytes(m.data)],{type:m.type||'application/octet-stream'});await putMediaRecord({id:m.id,name:m.name,type:m.type,size:m.size||blob.size,created:m.created||Date.now(),blob})}state=migrateLegacy(payload.state);state.settings.cloudAI=false;state.view='home';state.modal=null;save();render();toast('Household imported')}catch(err){console.error(err);toast(err.message||'Could not import backup')}}

function render(){
  let html='';
  if(!state.onboarded) html=welcome();
  else switch(state.view){
    case'home':html=home();break;case'missions':html=missions();break;case'memories':html=memories();break;case'graph':html=graph();break;case'more':html=more();break;case'story':html=storyNight();break;case'celebrate':html=celebrate();break;case'weekly':html=weekly();break;case'yearbook':html=yearbook();break;case'share':html=familyShare();break;case'settings':html=settings();break;case'about':html=about();break;default:html=home();
  }
  document.getElementById('app').innerHTML=html;
  queueMicrotask(hydrateMedia);
}

Object.assign(window,{startDemo,openModal,closeModal,finishOnboard,addMember,submitMissionForm,saveMemory,updateMediaHint,updateMission,completeMission,rateMission,go,transformMemory,makeStory,makeCelebration,setYearbookYear,printYearbook,downloadYearbook,shareHousehold,downloadHouseholdBackup,importHouseholdBackup,exportData,resetAll,requestPersistentStorage});

if('serviceWorker'in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
window.addEventListener('beforeunload',releaseMediaUrls);
render();
