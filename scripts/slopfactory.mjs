// Snellheid Slop Machine™ — designs one-of-a-kind AI merch for paid "slop" orders.
// Runs in the hourly Newsroom workflow. Node 22+ and sharp (installed by the workflow).
//
// For each order the shop function left in status "slop_queued":
//   1. roll a random over-the-top corporate concept and let an OpenRouter image model draw it, with our logo as reference;
//   2. scale it to the product's exact print size. No banner or overlay: the model writes the company name itself,
//      and its occasional misspellings are a feature;
//   3. upload the print file to the public "slop" storage bucket;
//   4. ask the shop function to place it at Printful, always as a draft, so a human looks at it before it's printed.
// Failures go back to the queue and are retried next hour; after MAX_ATTEMPTS the order becomes "needs_attention".
//
// Env (GitHub secrets / variables):
//   SUPABASE_SECRET_KEY   required
//   OPENROUTER_SLOP_KEY   OpenRouter key for images (its own spending limit); falls back to OPENROUTER_API_KEY
//   SLOP_IMAGE_MODEL   optional, comma-separated OpenRouter model ids (default below, then other image models it finds)
//   SAMPLE=mug|sticker optional; make one sample design, upload it under samples/ and print its URL. No order involved.
//   SAMPLE=roulette-all|roulette-15|roulette-30|roulette-60  one sample per active Budget Slop Roulette item
//                      (all of them, or one budget tier), at that item's real size. No order, no Printful draft.
//   PEEK=1             optional; exit 0 if there is work to do, 1 if not (lets the workflow skip installing sharp)
//   DRY_RUN=1          optional, with SAMPLE: write the file locally instead of uploading it

import { readFile, writeFile, appendFile } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://simdsmzaogctcfjokhuk.supabase.co';
const OPENROUTER = process.env.OPENROUTER_BASE || 'https://openrouter.ai/api/v1';
const SHOP_FN = process.env.SHOP_FUNCTION_URL || `${SUPABASE_URL}/functions/v1/shop`;
const DEFAULT_MODELS = ['google/gemini-2.5-flash-image'];
const MAX_ATTEMPTS = 5;
const ROOT = new URL('..', import.meta.url);

const KINDS = {
  mug: { w: 2700, h: 1050, aspect: '21:9',
    canvas: 'a very wide panoramic wrap-around print for an 11 oz coffee mug (about 2.6 times wider than tall); compose it as one continuous scene that also works when only the left or right half is visible' },
  sticker: { w: 900, h: 900, aspect: '1:1',
    canvas: 'a square 3×3 inch sticker; bold, readable from across an open-plan office' },
};

// Budget Slop Roulette items come with their own size and description; the AI gets the closest aspect ratio it supports.
const ASPECTS = ['1:1', '2:3', '3:2', '3:4', '4:3', '4:5', '5:4', '9:16', '16:9', '21:9'];
const nearestAspect = (w, h) => ASPECTS.reduce((best, a) => {
  const [x, y] = a.split(':').map(Number), [bx, by] = best.split(':').map(Number);
  return Math.abs(Math.log(x / y / (w / h))) < Math.abs(Math.log(bx / by / (w / h))) ? a : best;
});
const specOf = (kind) => (typeof kind === 'string' ? KINDS[kind] : kind);

const log = (...a) => console.log('[slop]', ...a);
const req = (name) => { const v = (process.env[name] || '').trim(); if (!v) throw new Error(`Missing env ${name}`); return v; };
// Pasted secrets sometimes carry line breaks or a second value; keep only the real key.
const keyFrom = (name, pattern) => { const v = req(name); return v.split(/\s+/).find((k) => pattern.test(k)) || v.split(/\s+/)[0]; };
const pick = (a) => a[Math.floor(Math.random() * a.length)];

// ---------- the creative department ----------
const FORMATS = [
  'a parody of a famous public-domain painting (pick one painted before 1900, e.g. the Mona Lisa, The Creation of Adam, The Last Supper, Washington Crossing the Delaware, Liberty Leading the People, The Raft of the Medusa, Napoleon Crossing the Alps, The Night Watch, The Great Wave off Kanagawa, Girl with a Pearl Earring, The Arnolfini Portrait)',
  'a heroic re-enactment of a famous historical moment (e.g. the signing of a great treaty, the moon landing, a Roman triumph, the coronation of an emperor, the building of the pyramids, the first Olympic games), rewritten as a corporate milestone',
  'commemorative deal memorabilia: a lucite deal tombstone, a gold commemorative coin, a collector\'s plate or a limited-edition trading card celebrating a merger nobody asked for',
  'a fake achievement award: a trophy, medal, certificate or plaque for an absurd corporate accomplishment',
  'the poster for a deranged mandatory corporate event (e.g. the Annual Employee Layoff Survival Death Match, the Return-to-Office Gladiator Games, the Q4 Pivot Rave, the Offsite Trust-Fall World Championship, Family Day with tracked attendance)',
  'a motivational office poster that has gone completely off the rails',
  'a 1980s action movie poster for a film about a quarterly business review',
  'a heavy metal album cover for the band "Synergy"',
  'a propaganda-style recruitment poster for an internal reorg',
  'a medieval illuminated manuscript page or tapestry chronicling a legendary meeting that could have been an email',
  'a stained glass church window depicting the saints of corporate productivity',
  'a tarot card from the "Major Arcana of Middle Management"',
  'a monster truck rally / wrestling event flyer for a showdown between two departments',
  'a vintage travel poster for a destination that is actually a meeting room',
  'a cereal box for a breakfast cereal that "boosts KPIs"',
  'a souvenir postage stamp issued to celebrate a record-breaking quarter',
  'an Egyptian tomb wall of hieroglyphs recording the rise and fall of a product launch',
  'a Greek vase painting of an epic battle between two project management tools',
  'a nature documentary still of the rare corporate creatures of the open-plan savannah',
  'a 1950s B-movie poster: ATTACK OF THE 50-FOOT MIDDLE MANAGER',
  'a fantasy RPG character sheet and boss battle against a final boss called The Q4 Forecast',
  'a cursed board game box for "Corporate Ladder: The Game" with all its pieces',
  'a wildly overdesigned birthday cake for the company\'s 1000th consecutive reorg',
  'an exploded-view technical diagram of the snail-rocket, with absurd labelled parts',
  'the cover of a self-help book written by the snail-rocket',
  'a national banknote of the Snellheid Republic',
  'a museum diorama of "Homo Corporatus in its natural habitat, circa 2025"',
  'a classical marble sculpture garden of heroic employees in impossible poses',
  'a Victorian circus poster for The Greatest Synergy On Earth',
  'a breakfast-TV infomercial still for a gadget that schedules meetings about meetings',
  'a map of a fantasy kingdom whose regions are departments, with dragons labelled Compliance',
  'a space-race propaganda poster for the first open-plan office on the Moon',
];
const STYLES = [
  '1987 airbrushed chrome', 'Soviet constructivist poster', 'baroque oil painting with extreme chiaroscuro', 'vaporwave',
  'Y2K clip art collage with WordArt', 'ukiyo-e woodblock print', 'Byzantine icon with gold leaf', 'psychedelic 1960s concert poster',
  '1990s Saturday morning cartoon', 'hyper-real 3D render with far too many lens flares', 'rococo pastel extravagance',
  'Art Nouveau with ornate borders', 'pixel art', 'velvet blacklight painting', 'embroidered patch', 'retro sci-fi pulp magazine cover',
  'Renaissance fresco', 'holographic foil trading card', 'MS Paint on a 1998 office PC', 'Lisa-Frank-style neon rainbow',
  'claymation', 'woven Persian carpet', 'Mexican lucha libre poster', 'Mughal miniature painting', 'Bauhaus geometric',
  '1930s rubber-hose cartoon', 'Dutch Golden Age still life', 'airport duty-free luxury advertisement', 'thermal-printer receipt',
  'Lego-like plastic brick diorama', 'cross-stitch sampler', 'neon sign on a brick wall at night', 'ancient Roman mosaic',
  'children\'s crayon drawing taken far too seriously', 'Edo-period scroll', 'Wes-Anderson-style symmetrical pastel diorama',
];
const THEMES = [
  'synergy', '"we\'re not a company, we\'re a family" (announced right before layoffs)', 'circling back', 'KPIs and OKRs',
  'mandatory return to office', 'pivoting to AI', 'the reorg', 'a pizza party instead of a raise', 'unlimited PTO that nobody takes',
  'the meeting that could have been an email', '"per my last email"', 'reply-all apocalypse', '4am cold plunges and hustle culture',
  'stakeholder alignment', 'thought leadership', 'low-hanging fruit', 'moving fast and circling back', 'headcount optimization',
  'the open-plan office', 'quarterly earnings', 'disruption', '"let\'s take this offline"', 'being a 10x rockstar ninja',
  'the all-hands meeting', 'the annual performance review', 'bring your whole self to work', 'the office coffee machine',
  'the company offsite', 'the org chart', 'the expense report', 'the LinkedIn humblebrag', 'the out-of-office reply',
  'the team-building escape room', 'the hot desk', 'the slide deck with 140 slides',
];
// Absurd extra ingredients: every design gets two, so even the same format never comes out the same twice.
const TWISTS = [
  'the whole scene takes place inside a giant snow globe', 'everyone in it is a Roman senator', 'it is set on the surface of the Moon',
  'a giant squid is clearly the real CEO', 'every character is wearing a lanyard with an ID badge', 'there is a marching band',
  'it is raining sticky notes', 'a volcano is erupting coffee', 'everything is happening underwater',
  'a tiny bureaucrat is stamping documents in the corner', 'the background is full of pigeons in tiny business suits',
  'there are fireworks shaped like pie charts', 'a dragon is guarding a printer', 'the snail-rocket rides a majestic horse',
  'it is all inside a fish tank on someone\'s desk', 'a choir of identical interns is singing', 'a meteor shaped like a calendar invite is approaching',
  'everything is made of cake', 'there are far too many potted plants', 'a laser show spells out quarterly numbers',
  'an ancient prophecy scroll unrolls across the scene', 'a submarine periscope is watching from below', 'cats in hard hats are supervising',
  'it is the grand finale of a fireworks show', 'a parade float carries an enormous trophy', 'the sky is a giant spreadsheet',
  'a lighthouse beams a progress bar', 'there is a tiny snail-rocket hidden in every corner', 'the clouds form the shape of an org chart',
  'a herd of runaway office chairs stampedes through', 'everyone is riding a unicycle', 'it is lit like a stadium rock concert',
];

// Deal from shuffled decks instead of rolling dice, so a batch never repeats a pick until the deck runs out.
// RECENT holds the prompts of the last orders; picks that appear in them are skipped while there are alternatives.
let RECENT = '';
const decks = new Map();
function deal(list) {
  let deck = decks.get(list);
  if (!deck?.length) {
    deck = [...list].sort(() => Math.random() - 0.5);
    decks.set(list, deck);
  }
  const i = Math.max(0, deck.findIndex((x) => !RECENT.includes(x)));
  return deck.splice(i, 1)[0];
}

export function concept(kind) {
  const k = specOf(kind);
  const idea = { format: deal(FORMATS), style: deal(STYLES), theme: deal(THEMES), twists: [deal(TWISTS), deal(TWISTS)] };
  const prompt = [
    `Create original artwork for ${k.canvas}.`,
    'It is official merchandise of Snellheid Industries™, a fictional, absurdly self-important mega-corporation. Its mascot is the snail with a rocket on its back shown in the attached image.',
    `Concept: ${idea.format}, about ${idea.theme}. Visual style: ${idea.style}.`,
    `Twists: ${idea.twists[0]}; and ${idea.twists[1]}.`,
    'Make the snail-rocket mascot the hero of the scene. Add one short, deadpan corporate slogan or title in big bold English lettering.',
    'Somewhere prominent, also write the company name "SNELLHEID INDUSTRIES" in big lettering that fits the style.',
    'Go completely, ridiculously over the top: maximalist, epic, dramatic, overflowing with details, deranged corporate pride. Subtle is a fireable offence.',
    'Escalate: take the concept, then make it three times more absurd. Fill the background with at least five small sight gags that reward a second look. Commit to the bit with total seriousness.',
    'Rules: everything must be original. No real company names, brands or logos other than Snellheid; no copyrighted characters; no real people, celebrities or politicians.',
    'Strictly family friendly: no nudity, nothing sexual, no blood or gore, no weapons aimed at anyone, no drugs, no hate symbols, no real tragedies. Any fighting is harmless cartoon slapstick.',
    'Flat print artwork only, filling the whole canvas edge to edge: no border, no mug or sticker mockup, no product photo.',
  ].join('\n');
  return { ...idea, prompt };
}

// ---------- plumbing ----------
function sb(path, opts = {}) {
  const key = keyFrom('SUPABASE_SECRET_KEY', /^(sb_secret_|eyJ)/);
  const headers = { apikey: key, 'Content-Type': 'application/json', ...(opts.headers || {}) };
  if (key.startsWith('eyJ')) headers.Authorization = `Bearer ${key}`; // legacy service_role JWT
  return fetch(SUPABASE_URL + path, { ...opts, headers });
}
async function sbJson(path, opts) {
  const r = await sb(path, opts);
  const text = await r.text();
  if (!r.ok) throw new Error(`Supabase ${r.status}: ${text.slice(0, 200)}`);
  return text ? JSON.parse(text) : null;
}

async function models() {
  const list = (process.env.SLOP_IMAGE_MODEL || '').split(',').map((s) => s.trim()).filter(Boolean);
  if (list.length) return list;
  // Default first, then up to two other image models OpenRouter offers, in case the default is gone or down.
  try {
    const r = await fetch(`${OPENROUTER}/models`);
    const extra = (await r.json()).data
      .filter((m) => m.architecture?.output_modalities?.includes('image') && m.architecture?.input_modalities?.includes('image') && m.id.startsWith('google/'))
      .map((m) => m.id).filter((id) => !DEFAULT_MODELS.includes(id));
    return [...DEFAULT_MODELS, ...extra.slice(0, 2)];
  } catch { return DEFAULT_MODELS; }
}

async function draw(kind, idea) {
  const key = keyFrom(process.env.OPENROUTER_SLOP_KEY ? 'OPENROUTER_SLOP_KEY' : 'OPENROUTER_API_KEY', /^sk-or-/);
  const logo = (await readFile(new URL('assets/img/logo-mark.png', ROOT))).toString('base64');
  let lastErr;
  for (const model of await models()) {
    try {
      const r = await fetch(`${OPENROUTER}/chat/completions`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', 'HTTP-Referer': 'https://www.snellheid.com', 'X-Title': 'Snellheid Slop Machine' },
        body: JSON.stringify({
          model,
          modalities: ['image', 'text'],
          image_config: { aspect_ratio: specOf(kind).aspect },
          messages: [{ role: 'user', content: [
            { type: 'text', text: idea.prompt },
            { type: 'image_url', image_url: { url: `data:image/png;base64,${logo}` } },
          ] }],
        }),
      });
      const d = await r.json().catch(() => ({}));
      // A real key is "sk-or-v1-" + 64 hex characters; show only its shape, never the key.
      if (r.status === 401) throw new Error(`401 ${JSON.stringify(d.error || d).slice(0, 120)} — key starts with "${key.slice(0, 9)}", ${key.length} chars (a valid one starts with "sk-or-v1-" and has 73)`);
      if (!r.ok) throw new Error(`${r.status} ${JSON.stringify(d.error || d).slice(0, 200)}`);
      const url = d.choices?.[0]?.message?.images?.[0]?.image_url?.url;
      if (!url) throw new Error(`no image in reply: ${JSON.stringify(d.choices?.[0]?.message?.content || d).slice(0, 200)}`);
      const buf = url.startsWith('data:') ? Buffer.from(url.slice(url.indexOf(',') + 1), 'base64') : Buffer.from(await (await fetch(url)).arrayBuffer());
      log(`${model} drew it (${d.usage?.total_tokens ?? '?'} tokens, $${d.usage?.cost ?? '?'})`);
      return { buf, model };
    } catch (e) { lastErr = e; log(`${model} failed:`, e.message); }
  }
  throw new Error(`all image models failed; last: ${lastErr?.message}`);
}

async function printFile(kind, art) {
  const { default: sharp } = await import('sharp');
  const k = specOf(kind);
  return sharp(art).resize(k.w, k.h, { fit: 'cover' }).png().toBuffer();
}

async function upload(name, data, type = 'image/png') {
  const r = await sb(`/storage/v1/object/slop/${name}`, { method: 'POST', headers: { 'Content-Type': type, 'x-upsert': 'true' }, body: data });
  if (!r.ok) throw new Error(`upload ${r.status}: ${(await r.text()).slice(0, 200)}`);
  return `${SUPABASE_URL}/storage/v1/object/public/slop/${name}`;
}

async function place(id) {
  const key = keyFrom('SUPABASE_SECRET_KEY', /^(sb_secret_|eyJ)/);
  const r = await fetch(SHOP_FN, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-shop-key': key }, body: JSON.stringify({ action: 'place', id }) });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`place ${r.status}: ${JSON.stringify(d)}`);
  log(`order ${id} → Printful: ${d.status}`);
}

function kindOf(o) {
  const r = o.roulette_item;
  if (!r) return o.sku.includes('mug') ? 'mug' : 'sticker';
  if (r.canvas === 'mug') return 'mug';
  return { w: r.w, h: r.h, aspect: nearestAspect(r.w, r.h), canvas: r.canvas };
}

async function design(kind) {
  const idea = concept(kind);
  log(`concept: ${idea.format.split('(')[0].trim()} | ${idea.theme} | ${idea.style} | ${idea.twists.join(' + ')}`);
  const art = await draw(kind, idea);
  return { idea, model: art.model, png: await printFile(kind, art.buf) };
}

async function work(o) {
  // Claim it, so two overlapping runs never design the same order twice.
  const [mine] = await sbJson(`/rest/v1/shop_orders?id=eq.${o.id}&status=eq.slop_queued`, {
    method: 'PATCH', headers: { Prefer: 'return=representation' }, body: JSON.stringify({ status: 'slop_generating' }),
  }) ?? [];
  if (!mine) return;
  try {
    const { idea, model, png } = await design(kindOf(o));
    const url = await upload(`order-${o.id}-${randomBytes(8).toString('hex')}.png`, png);
    await sbJson(`/rest/v1/shop_orders?id=eq.${o.id}`, { method: 'PATCH', body: JSON.stringify({
      status: 'slop_ready', print_file_url: url, slop_prompt: `[${model}] ${idea.prompt}`,
    }) });
    log(`order ${o.id} designed: ${url}`);
  } catch (e) {
    const attempts = (o.slop_attempts || 0) + 1;
    await sbJson(`/rest/v1/shop_orders?id=eq.${o.id}`, { method: 'PATCH', body: JSON.stringify({
      status: attempts >= MAX_ATTEMPTS ? 'needs_attention' : 'slop_queued', slop_attempts: attempts, note: `slop: ${e.message}`.slice(0, 500),
    }) });
    log(`order ${o.id} failed (attempt ${attempts}):`, e.message);
  }
}

// One sample design: uploaded under samples/ and shown in the GitHub run summary. No order involved.
async function sample(label, kind, file = label) {
  const { idea, model, png } = await design(kind);
  if (process.env.DRY_RUN) { await writeFile(`slop-sample-${file}.png`, png); log(`saved slop-sample-${file}.png`); return; }
  const name = `samples/${Date.now()}-${file}-${randomBytes(6).toString('hex')}`;
  const url = await upload(`${name}.png`, png);
  // The full mug print file is too big for GitHub's image proxy, so the summary shows a small JPEG and links the original.
  const { default: sharp } = await import('sharp');
  const preview = await upload(`${name}-preview.jpg`, await sharp(png).resize({ width: 1200 }).jpeg({ quality: 82 }).toBuffer(), 'image/jpeg');
  log(`sample ${label}:`, url);
  if (process.env.GITHUB_STEP_SUMMARY) await appendFile(process.env.GITHUB_STEP_SUMMARY, `### Slop sample: ${label}\n\n[![sample](${preview})](${url})\n\n[Full print file](${url}) · ${model}\n\n<details><summary>Prompt</summary>\n\n${idea.prompt}\n\n</details>\n\n`);
}

// Budget Slop Roulette samples: every active item (or one budget tier), each at its real print size.
async function rouletteSamples(which) {
  const tier = which.split('-')[1];
  const items = await sbJson(`/rest/v1/roulette_items?active=is.true${/^\d+$/.test(tier) ? `&tier=eq.${tier}` : ''}&select=*&order=tier,id`);
  if (!items?.length) throw new Error('no active roulette items');
  let failed = 0;
  for (const item of items) {
    try { await sample(`${item.name} (€${item.tier} tier)`, kindOf({ roulette_item: item }), item.id); }
    catch (e) { failed++; log(`sample ${item.id} failed:`, e.message); }
  }
  log(`${items.length - failed}/${items.length} roulette samples made`);
  if (failed === items.length) throw new Error('every roulette sample failed');
}

async function main() {
  if (process.env.SAMPLE) {
    if (process.env.SAMPLE.startsWith('roulette')) return rouletteSamples(process.env.SAMPLE);
    const label = ['mug', 'sticker', 'poster'].includes(process.env.SAMPLE) ? process.env.SAMPLE : 'sticker';
    const kind = label === 'poster' ? { w: 1772, h: 2362, aspect: '3:4', canvas: 'a portrait 30×40 cm wall poster' } : label;
    return sample(label, kind);
  }
  if (!process.env.SUPABASE_SECRET_KEY) { log('not configured (SUPABASE_SECRET_KEY missing). Skipping.'); process.exit(process.env.PEEK ? 1 : 0); }
  const todo = await sbJson('/rest/v1/shop_orders?status=in.(slop_queued,slop_ready)&select=id,sku,status,slop_attempts,roulette_item&order=id&limit=5');
  if (process.env.PEEK) { log(`${todo.length} slop order(s) waiting`); process.exit(todo.length ? 0 : 1); }
  if (!todo.length) return log('nothing to make');
  if (!process.env.OPENROUTER_SLOP_KEY && !process.env.OPENROUTER_API_KEY) throw new Error('Missing env OPENROUTER_SLOP_KEY');
  // Remember the last orders' concepts, so two friends ordering the same week don't get the same idea.
  const recent = await sbJson('/rest/v1/shop_orders?slop_prompt=not.is.null&select=slop_prompt&order=id.desc&limit=10').catch(() => []);
  RECENT = (recent ?? []).map((r) => r.slop_prompt).join('\n');
  for (const o of todo) {
    if (o.status === 'slop_queued') await work(o);
    try { await place(o.id); } catch (e) { log(`order ${o.id} not placed yet:`, e.message); }
  }
}

if (import.meta.url === `file://${process.argv[1]}`) main().catch((e) => { console.error('[slop] failed:', e.message); process.exit(1); });
