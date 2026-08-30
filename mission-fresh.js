'use strict';

// BrightKin Standalone Joy Mission Engine v3
// Purpose: every generation is one coherent activity. No mash-ups, no composite fallback.
const FRESH_MISSION_ENGINE_VERSION = '3.0.0';

function parseFreshCores(text) {
  return text.trim().split('\n').map(line => {
    const [id,title,setup,action,finish] = line.split('|').map(x => x.trim());
    return { id, title, setup, action, finish };
  });
}

const freshStandaloneCores = {
  laugh: parseFreshCores(`
silent-dub|Silent Movie Dubbing|Pick a short muted clip or silently act out a simple scene.|Invent the dialogue and sound effects live while the scene plays.|Replay the funniest version once and give the scene a ridiculous title.
object-court|Object Courtroom|Choose one harmless everyday object and assign a judge, prosecutor, and defender.|Put the object on trial for a ridiculous crime using made-up evidence.|Deliver a dramatic verdict and write one sentence for the case file.
nonsense-news|Nonsense Newsroom|Choose three ordinary things that happened today.|Turn them into wildly over-serious breaking-news reports.|End with a weather forecast for something impossible.
bad-magic|Deliberately Bad Magic Show|Gather three safe household objects that can become fake magic props.|Take turns performing intentionally terrible magic tricks with confident patter.|Award the most convincing failed magician a homemade title.
freeze-museum|Freeze-Frame Museum|Choose three strange poses or moments to turn into living exhibits.|One person freezes while the others invent the museum placard and backstory.|Tour all exhibits in your most serious museum voices.
household-roast|Roast the Room|Pick harmless objects in one room, never people.|Take turns giving each object a playful one-line roast and one compliment.|Crown one object the unexpected star of the room.
fake-documentary|Tiny Fake Documentary|Pick a very ordinary household subject such as a spoon, sock, or houseplant.|Film or narrate a 60-second nature-documentary-style story about its secret life.|Give the documentary an overly important title.
wrong-instructions|Wrong Instructions Challenge|Pick a simple task everyone knows how to do.|Explain how to do it using only absurdly wrong but safe instructions.|Let someone perform a pantomime version and identify the funniest instruction.
character-dinner|Character at the Table|Everyone chooses a harmless invented character voice or personality.|Hold a five-minute conversation while staying in character.|Vote on the line most likely to become an inside joke.
pun-hunt|Pun Hunt|Choose one topic visible around you such as food, cars, pets, or furniture.|Create as many terrible puns about it as possible in five minutes.|Save the best-worst pun as the official winner.
dramatic-reading|Overdramatic Reading|Find a boring piece of text such as directions, a label, or a grocery list.|Read it like a movie trailer, royal decree, sports commentary, or soap opera.|Choose the reading style that made the text least recognizable.
superhero-draft|Unlikely Superhero Draft|Choose three ordinary jobs, objects, or habits.|Turn each into a superhero with a power, weakness, and catchphrase.|Pitch which hero deserves the first movie.
fake-review|Five-Star Review for Something Ridiculous|Pick three ordinary items or tiny experiences from the day.|Give each an exaggerated online-style review with pros, cons, and a star rating.|Read the most absurd review in a serious critic voice.
sound-effects|Live Sound-Effects Studio|Choose a short silent action scene to perform, such as making a snack or crossing the room.|Everyone else creates the live sound effects using voices or safe objects.|Switch performers and make the second soundtrack completely different.
costume-sprint|Two-Minute Costume Sprint|Set a two-minute timer and use only clothes or props already nearby.|Build the funniest harmless character look you can before time runs out.|Give every character a name and one-line biography.
comedy-bingo|Comedy Bingo|Write nine harmless funny events or behaviors that might happen tonight.|Play until someone naturally completes a row.|Read the winning row like an awards-show recap.
meme-lab|Real-Life Meme Lab|Choose one ordinary family moment, object, or photo that is safe to use.|Write three different meme-style captions for it.|Keep the caption that best captures your household humor.
reverse-charades|Reverse Charades|One person guesses while everyone else acts out the same word together.|Use ordinary actions, animals, or family-safe situations.|Finish with one impossible-to-guess bonus round.
press-conference|Ridiculous Press Conference|One person secretly becomes an invented celebrity, creature, or expert.|Everyone else asks serious press questions while the speaker improvises answers.|Reveal the identity and award best question and best answer.
joke-detective|Joke Detective|One person invents a silly mystery about something harmless that “went missing” or “went wrong.”|Others can ask only yes-or-no questions to solve the ridiculous case.|Reveal the answer with an unnecessary detective monologue.
ridiculous-awards|Ridiculous Awards Night|Create five absurd award categories based on ordinary moments from the day.|Nominate objects, snacks, songs, or harmless events instead of judging people.|Give acceptance speeches for the winning categories.
bad-advice|Terrible Advice Hotline|Choose harmless everyday dilemmas such as choosing a snack or what socks to wear.|Take turns giving the worst obviously unserious advice possible.|End by giving one genuinely good answer in the same dramatic voice.
photo-reenact|Awkward Photo Re-Creation|Choose a harmless old photo or invent a fake posed-photo prompt.|Re-create the pose with exaggerated expressions and safe props.|Compare versions and name the new photo like an art masterpiece.
prop-monologue|One-Prop Monologue|Choose one ordinary object as the only prop.|Each person gets 45 seconds to perform a dramatic monologue in which the prop is extremely important.|Vote for the most unnecessary plot twist.`),

  reconnect: parseFreshCores(`
three-photo-story|Three-Photo Story Swap|Each person chooses three photos they are comfortable sharing.|Tell the story behind the photos in under three minutes each.|End by naming one detail you learned about someone else.
question-walk|One-Question Walk|Take a short walk or sit somewhere away from the usual routine.|Each person asks one question they genuinely want answered and listens without fixing.|Share one answer you want to remember.
memory-object|Memory Object Show-and-Tell|Each person finds one ordinary object connected to a memory.|Tell why the object matters and what part of the story others may not know.|Choose one story to write down later.
childhood-map|Childhood Map|Sketch a rough map of a street, home, school, or neighborhood from childhood.|Mark three places that hold a story and explain one of them.|Compare what kinds of places mattered to each person.
future-sunday|Design a Future Sunday|Imagine one ordinary Sunday a year from now that feels genuinely good.|Build the day from morning to night using simple realistic details.|Choose one small piece of that future day to try soon.
music-history|Our Music History|Each person chooses one song tied to a specific time in life.|Play a short portion and explain where you were and what it meant then.|Build a tiny shared playlist from the selections.
gratitude-receipt|Gratitude Receipt|Write down three specific things another person did recently that made life better.|Read them like line items on a receipt, with the reason each mattered.|Keep one line somewhere it can be found later.
support-menu|Build a Support Menu|Each person lists three small things that help on a stressful day.|Compare the lists and clarify what “helpful” actually looks like.|Pick one support action everyone can remember without guessing.
favorite-revival|Revive a Forgotten Favorite|Think of something you used to enjoy together but have not done in a while.|Talk about what made it good and why it faded out.|Choose the smallest possible version to bring back once.
two-chair-interview|Two-Chair Interview|Sit facing each other with a short timer.|Take turns asking three questions about current life, hopes, or routines.|End by reflecting one thing you heard rather than giving advice.
origin-story|Family Origin Story|Choose one family tradition, phrase, recipe, object, or habit.|Trace where it came from and how different people remember it.|Decide which detail belongs in the family memory vault.
photo-roulette|Photo Album Roulette|Open a photo library and stop at a random older month or year.|Choose one safe photo and tell what was happening outside the frame.|Ask one follow-up question that the photo itself cannot answer.
shared-recipe|Recipe With a Story|Choose a food connected to a person, place, or period in your lives.|Make, order, or simply discuss the food while telling the story behind it.|Save the story with the recipe name.
tiny-promise|Tiny Promise Exchange|Each person names one small realistic thing they can do to make the next week easier for someone else.|Make the promises specific enough to know when they happened.|Check that each promise feels helpful rather than burdensome.
bucket-list-draft|Ten-Item Shared Bucket List|Create a list of ten experiences that range from tiny to ambitious.|Each person contributes at least two without debating feasibility yet.|Circle one inexpensive item and one long-term item.
appreciation-specific|Specific Appreciation Round|Think of one exact moment when another person did something meaningful.|Describe the action and why it mattered instead of using a general compliment.|Let the receiver say what they remember about the same moment.
routine-tour|Teach Me Your Routine|Choose one ordinary routine another person usually does alone.|Have them walk you through how they actually do it and what makes it easier or harder.|Identify one part you understand better now.
place-revisit|Revisit a Meaningful Place|Choose a nearby place tied to a good shared memory.|Visit it or look at photos of it and compare what each person remembers first.|Notice what has changed and what still feels familiar.
five-minute-timeline|Five-Minute Life Timeline|Each person draws a quick line showing five meaningful moments from the last few years.|Pick one point on the line to explain more deeply.|Compare where your timelines overlap.
letter-future-us|Letter to Future Us|Write a short note to yourselves six or twelve months from now.|Include what feels important today and one thing you hope remains true.|Date it and choose when it should be reopened.
high-low-hope|High, Low, Hope|Each person shares one high point, one difficult point, and one thing they hope for next.|Listeners may ask one curious follow-up but do not solve the low point.|Finish by naming one hope you can support together.
old-message-reflection|Old Message Reflection|Find an old harmless message, card, or note that still makes you smile.|Read it and talk about what was happening in life at that time.|Write one new sentence you would add today.
dream-day-sketch|Sketch Each Other's Good Day|Each person describes what a genuinely good ordinary day looks like right now.|The listener sketches or lists the details they heard.|Compare the picture with the description and notice what mattered most.
silent-side-by-side|Quiet Side-by-Side Hour|Choose one calm task each person can do in the same space.|Spend time together without requiring conversation or entertainment.|End with a simple check-in about how the quiet company felt.`),

  adventure: parseFreshCores(`
mystery-turn|Mystery Turn Walk|Choose a safe walkable area and a clear time limit.|At each major turn, let a different person choose left, right, or straight without planning ahead.|Stop at the most interesting discovery and document it.
local-landmark|Local Landmark Mission|Pick a nearby landmark you usually pass without stopping.|Visit it as if you were a tourist and find three details you never noticed.|Give the place a one-sentence review.
color-trail|Follow One Color|Choose a color before leaving.|Let safe objects or signs in that color influence your next stop or direction.|Take one final photo showing the trail's best find.
photo-quest|Five-Prompt Photo Quest|Write five photo prompts such as tiny, strange, bright, old, or peaceful.|Explore a safe area and capture one image for each prompt.|Compare the most different interpretations.
random-pin|Random Map Pin|Choose a safe random point on a local map within your time limit.|Go near it and find one interesting place, view, or object you did not know about.|Save the discovery for a future revisit.
alphabet-route|Alphabet Route|Pick a starting letter and look for a place, object, food, or sign beginning with it.|Continue through the next letters as far as your time allows.|Record the hardest letter and best discovery.
taste-test-tour|Three-Stop Taste Tour|Choose three small food or drink categories within a set budget.|Try one item from three different nearby places or from three sections of one market.|Rank them using one surprising category besides taste.
sunset-chase|Beat the Sunset|Choose a safe scenic destination that fits the remaining daylight.|Take a route you do not normally use and arrive early enough to sit for a few minutes.|Name five things you noticed before heading home.
three-envelope|Three-Envelope Adventure|Write three safe mini-destinations or activities on slips and seal them.|Draw one envelope and commit to that single adventure.|Leave the other envelopes unopened for future days.
ten-dollar-explorer|Ten-Dollar Explorer|Set a small shared budget and choose a nearby area you rarely explore.|Spend the budget on one new thing to taste, try, or bring home.|Create a one-sentence adventure review.
transit-roulette|Next-Stop Roulette|Use a safe transit route, walking path, or drive with several possible stops.|Let a random choice decide one stop you normally skip.|Explore that stop for a fixed short window and find one worthwhile detail.
nature-bingo|Nature Bingo|Create a simple 3x3 card of local things you might safely spot outdoors.|Explore until you complete a line or your time ends.|Take a photo of the hardest square you found.
architecture-hunt|Architecture Detail Hunt|Choose a safe neighborhood or public area with varied buildings.|Look for five details such as arches, unusual doors, dates, textures, or shapes.|Pick the detail you would steal for an imaginary dream house.
thrift-find|Thrift-Store Treasure Rule|Set a tiny budget and one strange category such as funniest mug or best old postcard.|Visit one secondhand shop and search only for that category.|Choose a winner even if you buy nothing.
park-circuit|Park Circuit Challenge|Choose a park or outdoor space with several distinct areas.|Visit three sections and do one simple observation or movement challenge at each.|Name the section worth returning to.
library-hunt|Library Discovery Hunt|Visit a library or bookstore and pick three sections you rarely browse.|Each person finds one surprising title, image, or fact to show the others.|Check out or photograph one future curiosity if allowed.
mural-trail|Mural and Public-Art Trail|Find two or three nearby public artworks or murals.|Visit them in a simple route and notice one detail in each that you missed online.|Choose the artwork that would make the best story setting.
weird-sign|Weird Sign Expedition|Explore a familiar route with one goal: notice unusual, old, funny, or beautiful signs.|Collect five safe observations or photos without trespassing.|Vote on which sign has the best imaginary backstory.
roadside-curiosity|Roadside Curiosity Stop|Pick one safe roadside place, shop, view, or marker you have wondered about but never visited.|Stop there on purpose and spend at least ten minutes exploring.|Decide whether it deserves a second visit.
map-edge|Edge-of-the-Map Mission|Look at the edge of the local map area you usually consider “home.”|Choose one safe place near that edge you have never visited.|Go there and find one reason the trip was worth it.
one-hour-tourist|One-Hour Tourist|Choose a nearby town or neighborhood and pretend you have only one hour there.|Pick one walk, one local detail, and one snack or photo stop.|Create a three-item recommendation list afterward.
scavenger-decode|Clue-by-Clue Scavenger Route|Write or choose a short sequence of location-neutral clues such as water, red door, tall tree, or music.|Use each clue to choose the next safe direction or stop.|Finish when you solve the final clue or time runs out.
coin-choice|Coin-Choice Explorer|Start with two safe options for each next move.|Flip a coin to choose between them instead of debating.|Stop after a set number of decisions and review where chance took you.
weather-expedition|Weather-Perfect Expedition|Use today's actual conditions as the theme rather than fighting them.|Choose one safe activity that fits the weather, from puddle photos to shade hunting to cloud watching.|Capture one detail that could only have happened in this weather.`),

  calm: parseFreshCores(`
five-senses-walk|Five-Senses Walk|Choose a safe short route with no destination pressure.|Notice one thing you can see, hear, smell, touch, and physically feel.|At the end, name the detail you want to remember.
home-cafe|Tiny Home Café|Set up one small spot with simple drinks or snacks.|Spend a quiet window there doing low-pressure activities side by side.|Close the café with one gentle question.
one-album|One-Album Listening|Choose one album or short playlist everyone can tolerate.|Listen without multitasking for at least three songs.|Each person names one sound, lyric-free moment, or feeling they noticed.
puzzle-pause|Puzzle and Pause|Choose a puzzle, blocks, coloring page, or repetitive craft.|Work quietly together without needing to finish it.|Stop while it still feels relaxing and leave it ready for next time.
tea-question|Tea and One Good Question|Make a simple drink or snack.|Ask one gentle question and give everyone time to answer without rushing.|Let the conversation end naturally when it feels complete.
slow-breakfast|Slow Breakfast Window|Choose a 30-minute window with no need to rush.|Make the simplest favorite breakfast or snack and sit somewhere different.|Talk only about things you enjoy, wonder about, or look forward to.
sky-watch|Sky-Watching Pocket|Find a comfortable outdoor or window spot.|Watch clouds, stars, rain, birds, or changing light for ten quiet minutes.|Each person points out one detail the others may have missed.
quiet-reading|Quiet Reading Company|Everyone chooses something to read, draw, browse, or journal.|Sit in the same room for 20–30 minutes with no requirement to talk.|Share one interesting thought or image only if you want.
care-ritual|Care Ritual Exchange|Choose a small caring action everyone is comfortable with, such as making tea or setting up a cozy seat.|Take turns receiving the small act without multitasking.|Say one thing that would make the coming week easier.
low-light-reset|Low-Light Reset|Dim the room and remove only the clutter that interrupts comfort.|Add one calming element such as a blanket, music, or warm drink.|Spend the remaining time doing nothing productive.
window-sit|Ten-Minute Window Sit|Choose a window with something to watch outside.|Sit together for ten minutes without phones or a task.|Name one small change you noticed during the sit.
simple-bake|Slow Simple Bake|Choose one very easy recipe or ready-to-bake item.|Make it together without optimizing speed or cleanliness.|Eat the first serving while it is still warm and unhurried.
garden-observe|Garden Observation|Choose a plant, yard, balcony, or public green space.|Spend fifteen minutes noticing small changes, textures, insects, or growth.|Take one photo or note of something you normally overlook.
stretch-pair|Gentle Stretch Pair|Choose a few comfortable stretches or mobility movements that are safe for everyone.|Move slowly together without turning it into a workout.|Finish by sitting or lying quietly for one minute.
handwrite|Handwritten Quiet|Set out paper and pens with no assignment longer than one page.|Write, doodle, list, or sketch whatever feels useful.|Share only one line or drawing if you feel like it.
photo-sort|Ten-Photo Sort|Choose only ten recent or old photos to look through.|Slowly sort them into keep, print, share, or memory-story categories.|Pick one photo worth adding to BrightKin later.
slow-craft|One Small Craft|Choose a simple hands-on project with very few materials.|Work at a deliberately slow pace with music or silence.|Stop at a natural point rather than forcing completion.
floor-picnic|Cozy Floor Picnic|Put a blanket on the floor or another unusual comfortable spot.|Bring simple snacks and sit without screens for a short window.|Finish with one thing each person is glad happened today.
breathe-music|Breathing With Music|Choose one calm instrumental track or ambient sound.|Sit comfortably and let breathing slow naturally with the music.|Notice how the room feels when the track ends.
low-noise-tidy|Ten-Minute Calm Reset|Choose one small area, not the whole house.|Quietly put away only what makes that spot feel calmer.|Stop exactly when the timer ends and enjoy the cleared space.
porch-minute|Porch or Doorstep Pause|Step outside to a safe quiet spot for ten minutes.|Bring a drink or blanket and watch the neighborhood or sky without a plan.|End by naming one thing that feels less urgent now.
gratitude-sketch|Gratitude Sketch|Choose one small good thing from the day.|Draw it badly or beautifully for five minutes without judging the result.|Explain why that tiny thing deserved a picture.
scent-ritual|Favorite Scent Ritual|Choose a safe familiar scent such as coffee, tea, soap, herbs, or baked food.|Slow down enough to notice the scent while preparing or using it.|Pair it with one calm song or quiet minute.
screen-free-nest|Screen-Free Nest|Build one comfortable screen-free corner with pillows, blankets, books, or simple games.|Spend a short window there with no agenda.|Leave one part of the setup ready for tomorrow.`),

  surprise: parseFreshCores(`
task-erase|Erase One Annoying Task|Choose one small task another person usually carries.|Quietly complete or simplify that single task without making a production of it.|Let them discover the finished result naturally.
favorite-drop|Favorite-Thing Drop|Choose one small favorite food, drink, flower, song cue, or useful item.|Place it where the person will find it during a normal part of the day.|Add one sentence explaining why you thought of them.
secret-date|Secret 30-Minute Date|Choose a realistic 30-minute window and one simple destination or setup.|Tell the person only what they need to know until it begins.|Reveal the plan at the start and keep it easy.
room-upgrade|Quiet Room Upgrade|Pick one small space another person uses often.|Improve one detail based on their preferences, such as comfort, organization, or a favorite item.|Leave a tiny note so they know it was intentional.
note-trail|Three-Note Trail|Write three short notes with compliments, memories, or tiny clues.|Hide them in places the person naturally visits during the day.|Make the final note point to a small treat or warm message.
playlist-ambush|Three-Song Surprise|Choose three songs tied to good memories or the person's taste.|Queue them for a drive, meal, or ordinary moment without announcing why.|Afterward reveal what made you choose each one.
snack-delivery|Unexpected Snack Delivery|Choose a favorite or curiosity snack within the budget.|Bring it at a time the person would not expect a treat.|Present it with no occasion required.
mini-scavenger|Tiny Surprise Scavenger Hunt|Create three very easy clues around the house or another safe space.|Each clue leads to the next and the final one leads to a note or small treat.|Keep the whole hunt under fifteen minutes.
ordinary-bouquet|Ordinary-Day Bouquet|Gather or buy a small safe arrangement of flowers, leaves, herbs, or paper creations.|Place it somewhere visible with a note that says why today deserved it.|Do not tie it to a holiday or milestone.
desk-reset|Desk or Car Reset|Choose one small personal space you have permission to tidy or improve.|Reset it with one useful and one comforting detail.|Let the person notice the difference on their own.
kindness-envelope|Kindness Envelope|Put one helpful coupon, one memory, and one encouraging line into an envelope.|Leave it where the person will naturally find it.|Let them choose when to use the helpful coupon.
breakfast-setup|Breakfast Already Waiting|Prepare the simplest breakfast or drink the person likes.|Set it up before their normal routine begins.|Add one small detail that makes an ordinary morning feel cared for.
photo-print|Unexpected Photo Memory|Choose one photo that represents a good shared moment.|Print it if possible or create a simple digital presentation that feels intentional.|Pair it with one sentence about what you remember most.
doorstep-treat|Doorstep or Seat Treat|Choose one tiny item that fits the person's taste.|Place it at their seat, bedside, desk, or another natural discovery point.|Include a note that makes clear there is no reason other than thinking of them.
compliment-trail|Hidden Compliment Trail|Write three very specific compliments on small notes.|Hide them in ordinary places the person will encounter across the day.|Make each compliment about a different quality or action.
chore-swap|Secret Chore Swap|Choose one routine chore the person is likely to do today.|Do that one chore for them before they get to it.|Leave the area ready to use rather than announcing the favor.
unexpected-picnic|Unexpected Mini Picnic|Choose a simple snack and a nearby safe spot, indoors or outside.|Set up a tiny picnic with minimal prep.|Invite the person only when it is ready.
favorite-detour|Favorite-Place Detour|Pick a place the person enjoys that fits the available time.|Reroute an ordinary outing to include a brief stop there.|Keep the detour short enough to feel like a gift, not an obligation.
mystery-bag|Mystery Bag|Fill a small bag with three inexpensive or already-owned things tied to the person's interests.|Let them pull the items out one at a time without explanation.|Explain the thought behind each item after the reveal.
mini-celebration|Celebrate a Tiny Win|Choose one recent small accomplishment the person may have brushed off.|Create a five-minute celebration using a snack, note, song, or cheer.|Name exactly what you are celebrating.
comfort-kit|Tiny Comfort Kit|Choose three small comfort items the person already likes or can use.|Arrange them in one easy-to-find place for a stressful moment.|Add a note giving permission to take a break.
memory-callback|Memory Callback Surprise|Choose one harmless detail from a good shared memory.|Recreate only that detail, such as a snack, song, phrase, or place setting.|Let the person recognize the reference before you explain it.
choice-token|Surprise Choice Token|Create a simple token that lets the person choose one small treat, activity, or favor.|Present it on an ordinary day with a short list of realistic options.|Honor the choice without adding extra conditions.
evening-setup|Evening Already Set|Choose one low-effort way the person likes to unwind.|Prepare the space, drink, blanket, book, game, or show setup before they arrive.|Leave the rest of the evening unscheduled.`),

  learn: parseFreshCores(`
teach-me|Teach Me Your Thing|Choose one skill or topic one person knows better than the others.|Give a ten-minute beginner lesson with one hands-on try.|The learner explains back the most useful thing they understood.
mini-science|Mini Science Lab|Choose one safe household science experiment with simple materials.|Predict what will happen, run the experiment, and observe the result.|Compare the prediction with what actually happened.
blind-taste|Blind Taste Test|Choose three safe familiar foods or drinks everyone can have.|Taste them without seeing labels and describe flavor, texture, or aroma.|Reveal the items and compare guesses.
tiny-museum|Tiny Museum Night|Choose five household objects with interesting stories, designs, or purposes.|Create a one-sentence museum label for each and take turns giving the tour.|Pick the object that created the best question.
curiosity-question|One Big Curiosity Question|Choose one question nobody in the group knows the answer to.|Make individual guesses before looking anything up.|Research briefly and compare the real answer with the guesses.
safe-teardown|How It Works Inspection|Choose a safe object that can be inspected without damaging or energizing it.|Identify visible parts and predict what each part does.|Check a trustworthy explanation and correct the diagram or guesses.
map-challenge|Map Challenge|Choose a city, state, country, route, or region that interests you.|Find five features such as borders, rivers, distances, or landmarks.|Use the map to plan one imaginary trip.
family-trivia|Build Family Trivia|Each person writes three factual questions about their own interests or history.|Take turns answering and explaining the correct response.|Keep the question that taught everyone something new.
skill-swap|Fifteen-Minute Skill Swap|Two people each choose one tiny skill they can teach quickly.|Teach one skill at a time with a short practice round.|Name the trick or shortcut that made the biggest difference.
one-topic-doc|One-Topic Documentary|Choose a short educational video or documentary segment on one agreed topic.|Watch only long enough to answer three questions you wrote first.|Share the most surprising fact afterward.
recipe-experiment|Recipe Experiment|Choose one simple recipe with a variable you can safely change, such as spice, shape, or cooking time within safe limits.|Make two small versions and predict the difference.|Taste and decide which variable mattered most.
five-words|Five Words in Another Language|Choose a language connected to curiosity, travel, family, or culture.|Learn five useful words or phrases and practice saying them.|Use all five in a silly or practical mini-dialogue.
sketch-explain|Sketch and Explain|Choose a process or object someone understands reasonably well.|Draw how it works from memory without worrying about art quality.|Compare the sketch with a reliable reference and fix one misconception.
nature-id|Nature ID Walk|Take a short safe walk and choose three plants, birds, rocks, clouds, or insects to identify.|Photograph or describe them without disturbing anything.|Use a reliable guide to identify what you can.
budget-challenge|Tiny Budget Challenge|Choose a pretend household goal and a fixed small budget.|Decide together how to allocate every dollar and explain the tradeoffs.|Change one condition and see how the plan changes.
photo-lesson|Photo Composition Challenge|Choose one basic photography idea such as framing, leading lines, or symmetry.|Take three photos using that one concept.|Compare which photo demonstrates the idea most clearly.
logic-lab|Logic Puzzle Lab|Choose one age-appropriate logic puzzle, riddle, or spatial challenge.|Solve it collaboratively while explaining reasoning out loud.|After solving, identify the clue that mattered most.
history-object|History of an Ordinary Object|Pick one common object in the room.|Guess when and why its modern form was invented, then research briefly.|Share the most unexpected part of its history.
kitchen-chemistry|Kitchen Chemistry Observation|Choose one safe cooking process such as browning, dissolving, emulsifying, or yeast activity.|Observe it closely while preparing food.|Explain what changed using a reliable source afterward.
bridge-build|Build a Tiny Bridge|Use paper, cards, blocks, or other safe simple materials.|Build a bridge spanning a fixed gap and test how much light weight it can hold.|Change one design feature and test again.
memory-interview|Interview for a Memory|Choose one person and one period of their life the others know less about.|Ask five respectful factual and feeling-based questions.|Summarize the story back to make sure you understood it correctly.
explain-five|Explain It Like I'm Five|Choose one everyday concept that seems complicated.|Each person attempts a very simple explanation without jargon.|Look up a clear reference and improve the explanation together.
tool-demo|Safe Tool or App Demo|Choose one safe tool, app feature, or household device someone uses well.|Demonstrate one useful function and let others try it.|Create a one-sentence tip that would help a beginner.
compare-sources|Compare Two Sources|Choose one low-stakes factual question.|Read two trustworthy sources and note where they agree or differ.|Decide what evidence makes one explanation clearer or stronger.`),

  celebrate: parseFreshCores(`
tiny-banquet|Tiny Victory Banquet|Choose one small recent win worth noticing.|Make or buy one simple favorite food and give the win an official toast.|End by naming what effort made the win possible.
victory-lap|One-Song Victory Lap|Choose one song that fits the accomplishment.|Play it once while everyone does an exaggerated but safe victory lap or dance.|Take one photo or simply enjoy the ridiculousness.
ordinary-toast|Ordinary-Day Toast|Choose something good that happened today even if it seems small.|Raise whatever drinks you already have and each say one sentence about it.|Name the ordinary thing you hope happens again.
homemade-award|Homemade Award|Create one funny or meaningful award category for a real accomplishment.|Make the trophy from paper or an ordinary object.|Present it with a 30-second acceptance speech.
achievement-timeline|Achievement Timeline|Draw a quick timeline showing the steps that led to a recent win.|Mark the hardest point and the turning point.|Celebrate the part of the process that usually gets forgotten.
favorite-feast|Favorite-Food Mini Feast|Choose one favorite food that fits the budget and time.|Make it the centerpiece of a deliberately small celebration.|Add one sentence explaining what the occasion is.
photo-wall|Three-Photo Celebration Wall|Choose three photos that show progress, effort, or a happy milestone.|Display them together temporarily or digitally.|Tell the story connecting photo one to photo three.
celebration-walk|Celebration Walk|Take a short walk dedicated to one good thing that happened.|Use the walk to tell the full story and what it took to get there.|Choose one point on the walk as the unofficial finish line.
voice-montage|Voice-Note Montage|Record a few short voice notes from willing participants about what they appreciate or celebrate.|Keep every message under 20 seconds.|Play the montage once and save it privately if desired.
crown-hour|Crown for an Hour|Make a paper crown, badge, or silly title for the person or group being celebrated.|Let the honoree choose one small privilege or activity for the hour.|Retire the crown ceremonially at the end.
dessert-reveal|Dessert Reveal|Choose one simple dessert or treat connected to the person or occasion.|Keep it hidden until a normal moment in the day.|Reveal it with one specific sentence about what you are celebrating.
confetti-note|Confetti Note|Write several tiny slips naming reasons the moment matters.|Place them in an envelope, bowl, or folded paper packet rather than making a mess.|Read them one by one during the celebration.
gratitude-circle|Celebration Gratitude Circle|Name the specific event or effort being celebrated.|Each person says one thing they appreciated about the process or person.|Let the honoree respond last.
win-jar|Start a Win Jar|Choose a jar, box, or digital note for recording small wins.|Add today's win as the first entry with a date.|Decide on one simple trigger for adding future entries.
highlight-replay|Replay the Highlight|Choose one moment from the accomplishment that felt especially good.|Tell or show that moment from each person's perspective.|Create a short headline for the highlight.
mini-ceremony|Five-Minute Ceremony|Choose one real milestone and give it a beginning, presentation, and closing.|Use one simple object as a symbol of the achievement.|Keep the entire ceremony intentionally short and sincere.
celebration-playlist|Three-Song Celebration Playlist|Choose one song for effort, one for the moment of success, and one for what comes next.|Play them in order and explain each choice.|Save the three-song set as the milestone soundtrack.
future-marker|Future Milestone Marker|Celebrate today's progress by choosing one future date or checkpoint to look forward to.|Write a note about what you hope will be true then.|Store the note with today's date.
achievement-hunt|Achievement Scavenger Hunt|Create three clues tied to steps, places, or objects from the accomplishment.|Let the honoree solve the clues in order.|The final clue leads to a note, treat, or symbolic prize.
surprise-banner|Tiny Surprise Banner|Make a small paper or digital banner with the exact accomplishment written on it.|Place it where the person will encounter it naturally.|Leave it up just long enough to make the day feel different.
trophy-craft|Build the Trophy|Use cardboard, paper, blocks, or a funny harmless household object to make a trophy.|Add the date and achievement title.|Present it and decide where it lives for one day.
story-of-win|Tell the Story of the Win|Tell the accomplishment as a beginning, challenge, turning point, and ending.|Let another person add one detail the storyteller forgot.|Save the four-part version as a memory.
small-splurge|Small Splurge With a Reason|Set a modest budget and choose one treat, outing, or item that feels celebratory.|Say exactly what milestone the purchase represents before enjoying it.|Keep the spending contained so the meaning stays bigger than the price.
choose-cheer|Choose Your Cheer|Offer the honoree three simple celebration styles such as quiet treat, music moment, or short outing.|Let them choose the one that fits their energy.|Do only that chosen celebration instead of piling on extras.`)
};

const freshEditions = [
  {id:'original',label:'Fresh Pick',instruction:'Keep the rules simple and let the core activity be the whole mission.'},
  {id:'secret-choice',label:'Secret Choice',instruction:'One person secretly chooses the subject or prompt before the activity begins.'},
  {id:'timer',label:'Timer Edition',instruction:'Use a short timer for each turn or phase so the pace feels different.'},
  {id:'random-draw',label:'Random Draw',instruction:'Put several possible subjects or prompts on slips and draw one at random.'},
  {id:'no-phone',label:'No-Phone Edition',instruction:'After any setup is complete, put phones away for the rest of the activity.'},
  {id:'photo-proof',label:'Photo Finish',instruction:'End with exactly one photo that captures the result or best moment.'},
  {id:'one-object',label:'One-Object Rule',instruction:'Choose one ordinary object as the recurring prop, marker, or theme.'},
  {id:'nostalgia',label:'Nostalgia Edition',instruction:'Use a harmless detail from earlier years as the subject or theme.'},
  {id:'tiny-budget',label:'Tiny-Budget Edition',instruction:'Keep any optional spending under five dollars and use what you already have first.'},
  {id:'outside',label:'Fresh-Air Edition',instruction:'If safe and appropriate, do the activity outdoors or in a public open-air space.'},
  {id:'after-dinner',label:'After-Dinner Edition',instruction:'Make this a compact version that fits into a 20-minute after-dinner window.'},
  {id:'morning',label:'Morning Edition',instruction:'Adapt the activity into a light, easy version that works earlier in the day.'},
  {id:'youngest-leads',label:'Youngest Leads',instruction:'Let the youngest willing participant make the key choice for the activity.'},
  {id:'quiet-leads',label:'Quiet Voice Leads',instruction:'Let the person who usually chooses least often make the key decision.'},
  {id:'single-theme',label:'Single-Theme Edition',instruction:'Choose one clear theme at the start and keep the entire activity focused on it.'},
  {id:'wildcard',label:'Wildcard Finish',instruction:'At the final step, let one participant add a harmless unexpected rule for the ending.'}
];

const freshFocuses = [
  'something local','a favorite color','a shared memory','one person’s favorite thing','something unexpectedly tiny','something from childhood','a food theme','a music theme',
  'something outdoors','an ordinary object','something you usually overlook','a place you pass often','a cozy theme','a playful competition theme','a photo-worthy detail','a simple tradition',
  'something from this week','a seasonal detail','a neighborhood detail','something handmade','a favorite animal','a travel theme','a future dream','an inside joke'
];

function freshCoreBank(feeling) {
  return freshStandaloneCores[feeling] || freshStandaloneCores.reconnect;
}

function freshMissionHistory(feeling, additional = []) {
  return [...(state.missions || []), ...(additional || [])].filter(m => normalizedFeeling(m.feeling) === feeling);
}

function freshTitle(core, edition, focusIndex, cycle) {
  if (cycle === 0) return core.title;
  const focus = freshFocuses[focusIndex % freshFocuses.length];
  const extra = cycle > freshEditions.length ? ` · ${titleInterest(focus)}` : '';
  return clip(`${core.title} — ${edition.label}${extra}`, 92);
}

function buildFreshStandaloneMission(form, ids, core, edition, focus, serial, cycle, coreIndex) {
  const feeling = normalizedFeeling(form.feeling);
  const names = memberNames(ids);
  const memory = recentMemoryFor(ids);
  const setting = form.setting === 'either' ? 'wherever feels easiest' : form.setting;
  const interestPool = missionInterestPool(ids);
  const interest = interestPool.length ? interestPool[serial % interestPool.length] : '';
  const title = freshTitle(core, edition, Math.floor(serial / Math.max(1, freshCoreBank(feeling).length * freshEditions.length)), cycle);
  const focusLine = focus ? `Use ${focus} as the subject or flavor of the activity if it fits naturally.` : '';
  const interestLine = interest ? `If useful, shape the subject around ${interest}; keep it one activity, not a second event.` : '';
  const steps = [
    core.setup,
    core.action,
    focusLine || `Keep it comfortable for ${form.energy} energy and ${setting}.`,
    edition.instruction,
    core.finish
  ].filter(Boolean);
  const why = `A standalone ${feeling} mission for ${naturalJoin(names)}. The core activity is “${core.title},” selected because it has not been used recently in this category. It fits ${form.energy} energy and ${setting}. ${interest ? `A familiar interest such as ${interest} can shape the theme without changing the activity itself. ` : ''}${memory ? `It can borrow the positive feeling from “${memory.title}” without recreating that memory.` : ''}`;
  const variantKey = `standalone-v3:${feeling}:${core.id}:${edition.id}:${serial}`;
  return {
    id: uid(),
    title,
    people: ids,
    created: today(),
    status: 'generated',
    rating: null,
    filters: form,
    why,
    steps,
    time: timeLabel(form.time),
    cost: costLabel(form.budget),
    surprise: cycle === 0 ? 'Do not add another activity; let this one idea be enough.' : edition.instruction,
    prompt: `Ask afterward: “What part of ${core.title.toLowerCase()} felt most worth remembering?”`,
    capture: `Save one detail from ${core.title.toLowerCase()} that you would want to remember a year from now.`,
    feeling,
    source: 'local-standalone-v3',
    engineVersion: FRESH_MISSION_ENGINE_VERSION,
    coreId: core.id,
    coreIndex,
    editionId: edition.id,
    activityId: `standalone:${feeling}:${core.id}:${edition.id}:${serial}`,
    twistId: edition.id,
    variantKey
  };
}

function standaloneCandidateIsFresh(candidate, feeling, additional = []) {
  const history = freshMissionHistory(feeling, additional);
  if (history.some(m => m.variantKey === candidate.variantKey)) return false;
  if (history.some(m => cleanText(m.title).toLowerCase() === cleanText(candidate.title).toLowerCase())) return false;

  // A core mechanic cannot recur until every other core in this feeling has had a turn.
  const bankLength = freshCoreBank(feeling).length;
  const recent = history.slice(0, Math.max(0, bankLength - 1));
  if (recent.some(m => m.coreId === candidate.coreId)) return false;

  // Guard against accidentally producing nearly identical prose even with different IDs.
  const candidateText = `${candidate.title} ${(candidate.steps || []).join(' ')}`.toLowerCase();
  return !history.slice(0, 80).some(old => {
    const oldText = `${old.title || ''} ${(old.steps || []).join(' ')}`.toLowerCase();
    return similarityScore(candidateText, oldText) >= 0.80;
  });
}

localMissionSet = function freshLocalMissionSet(form, count, alreadyCreated = []) {
  const ids = form.people.length ? form.people : state.members.slice(0, 2).map(m => m.id);
  const feeling = normalizedFeeling(form.feeling);
  const bank = freshCoreBank(feeling);
  const created = [];
  const existingCount = freshMissionHistory(feeling, alreadyCreated).length;
  const target = Math.max(0, Number(count) || 0);

  for (let outputIndex = 0; outputIndex < target; outputIndex++) {
    let chosen = null;
    const startingSerial = existingCount + outputIndex;

    // Probe a large deterministic space of standalone missions. We never call activityCombinations
    // or buildCompositeMission here. One candidate = one core activity.
    for (let probe = 0; probe < bank.length * freshEditions.length * freshFocuses.length; probe++) {
      const serial = startingSerial + probe;
      const coreIndex = serial % bank.length;
      const cycle = Math.floor(serial / bank.length);
      const edition = freshEditions[cycle % freshEditions.length];
      const focusIndex = Math.floor(serial / (bank.length * freshEditions.length));
      const focus = freshFocuses[focusIndex % freshFocuses.length];
      const core = bank[coreIndex];
      const candidate = buildFreshStandaloneMission(form, ids, core, edition, focus, serial, cycle, coreIndex);
      if (standaloneCandidateIsFresh(candidate, feeling, [...(alreadyCreated || []), ...created])) {
        chosen = candidate;
        break;
      }
    }

    // Extremely defensive fallback: still one standalone core, never a mash-up.
    if (!chosen) {
      const serial = Date.now() + outputIndex + Number(state.stats.generated || 0);
      const coreIndex = Math.abs(serial) % bank.length;
      const core = bank[coreIndex];
      const edition = freshEditions[Math.abs(Math.floor(serial / Math.max(1, bank.length))) % freshEditions.length];
      const focus = freshFocuses[Math.abs(Math.floor(serial / 17)) % freshFocuses.length];
      chosen = buildFreshStandaloneMission(form, ids, core, edition, focus, serial, Math.floor(serial / bank.length), coreIndex);
      chosen.title = clip(`${core.title} — ${edition.label} · ${String(serial).slice(-4)}`, 92);
      chosen.variantKey += `:fallback:${serial}`;
      chosen.activityId += `:fallback:${serial}`;
    }

    created.push(chosen);
  }
  return created;
};
