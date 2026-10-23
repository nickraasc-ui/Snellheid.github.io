// Snellheid Slop Machine™ — designs one-of-a-kind AI merch for paid "slop" orders.
// Runs in the hourly Newsroom workflow. Node 22+ and sharp (installed by the workflow).
//
// For each order the shop function left in status "slop_queued":
//   1. roll a random over-the-top corporate concept and let an OpenRouter image model draw it, with our logo as reference;
//   2. stamp the real Snellheid Industries™ logo banner on top (the model can't be trusted to spell its own employer);
//   3. upload the print file to the public "slop" storage bucket;
//   4. ask the shop function to place it at Printful, always as a draft, so a human looks at it before it's printed.
// Failures go back to the queue and are retried next hour; after MAX_ATTEMPTS the order becomes "needs_attention".
//
// Env (GitHub secrets / variables):
//   SUPABASE_SECRET_KEY   required
//   OPENROUTER_SLOP_KEY   OpenRouter key for images (its own spending limit); falls back to OPENROUTER_API_KEY
//   SLOP_IMAGE_MODEL   optional, comma-separated OpenRouter model ids (default below, then other image models it finds)
//   SAMPLE=mug|sticker optional; make one sample design, upload it under samples/ and print its URL. No order involved.
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
  mug: { w: 2700, h: 1050, aspect: '21:9', band: 'assets/merch/slop/band-mug.png',
    canvas: 'a very wide panoramic wrap-around print for an 11 oz coffee mug (about 2.6 times wider than tall); compose it as one continuous scene that also works when only the left or right half is visible' },
  sticker: { w: 900, h: 900, aspect: '1:1', band: 'assets/merch/slop/band-sticker.png',
    canvas: 'a square 3×3 inch sticker; bold, readable from across an open-plan office' },
};

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
];
const STYLES = [
  '1987 airbrushed chrome', 'Soviet constructivist poster', 'baroque oil painting with extreme chiaroscuro', 'vaporwave',
  'Y2K clip art collage with WordArt', 'ukiyo-e woodblock print', 'Byzantine icon with gold leaf', 'psychedelic 1960s concert poster',
  '1990s Saturday morning cartoon', 'hyper-real 3D render with far too many lens flares', 'rococo pastel extravagance',
  'Art Nouveau with ornate borders', 'pixel art', 'velvet blacklight painting', 'embroidered patch', 'retro sci-fi pulp magazine cover',
  'Renaissance fresco', 'holographic foil trading card', 'MS Paint on a 1998 office PC', 'Lisa-Frank-style neon rainbow',
];
const THEMES = [
  'synergy', '"we\'re not a company, we\'re a family" (announced right before layoffs)', 'circling back', 'KPIs and OKRs',
  'mandatory return to office', 'pivoting to AI', 'the reorg', 'a pizza party instead of a raise', 'unlimited PTO that nobody takes',
  'the meeting that could have been an email', '"per my last email"', 'reply-all apocalypse', '4am cold plunges and hustle culture',
  'stakeholder alignment', 'thought leadership', 'low-hanging fruit', 'moving fast and circling back', 'headcount optimization',
  'the open-plan office', 'quarterly earnings', 'disruption', '"let\'s take this offline"', 'being a 10x rockstar ninja',
];

export function concept(kind) {
  const k = KINDS[kind];
  const idea = { format: pick(FORMATS), style: pick(STYLES), theme: pick(THEMES) };
  const prompt = [
    `Create original artwork for ${k.canvas}.`,
    'It is official merchandise of Snellheid Industries™, a fictional, absurdly self-important mega-corporation. Its mascot is the snail with a rocket on its back shown in the attached image.',
    `Concept: ${idea.format}, about ${idea.theme}. Visual style: ${idea.style}.`,
    'Make the snail-rocket mascot the hero of the scene. Add one short, deadpan corporate slogan or title in big bold English lettering.',
    'Go completely, ridiculously over the top: maximalist, epic, dramatic, overflowing with details, deranged corporate pride. Subtle is a fireable offence.',
    'Rules: everything must be original. No real company names, brands or logos other than Snellheid; no copyrighted characters; no real people, celebrities or politicians.',
    'Strictly family friendly: no nudity, nothing sexual, no blood or gore, no weapons aimed at anyone, no drugs, no hate symbols, no real tragedies. Any fighting is harmless cartoon slapstick.',
    'Flat print artwork only, filling the whole canvas edge to edge: no border, no mug or sticker mockup, no product photo. Keep the bottom 15% simple background, a brand banner will be placed there.',
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
          image_config: { aspect_ratio: KINDS[kind].aspect },
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
  const k = KINDS[kind];
  return sharp(art).resize(k.w, k.h, { fit: 'cover' })
    .composite([{ input: new URL(k.band, ROOT).pathname }])
    .png().toBuffer();
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

const kindOf = (sku) => (sku.includes('mug') ? 'mug' : 'sticker');

async function design(kind) {
  const idea = concept(kind);
  log(`concept: ${idea.format.split('(')[0].trim()} | ${idea.theme} | ${idea.style}`);
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
    const { idea, model, png } = await design(kindOf(o.sku));
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

async function main() {
  if (process.env.SAMPLE) {
    const kind = KINDS[process.env.SAMPLE] ? process.env.SAMPLE : 'sticker';
    const { idea, png } = await design(kind);
    if (process.env.DRY_RUN) { await writeFile(`slop-sample-${kind}.png`, png); log(`saved slop-sample-${kind}.png`); return; }
    const name = `samples/${Date.now()}-${randomBytes(6).toString('hex')}`;
    const url = await upload(`${name}.png`, png);
    // The full mug print file is too big for GitHub's image proxy, so the summary shows a small JPEG and links the original.
    const { default: sharp } = await import('sharp');
    const preview = await upload(`${name}-preview.jpg`, await sharp(png).resize({ width: 1200 }).jpeg({ quality: 82 }).toBuffer(), 'image/jpeg');
    log('sample:', url);
    if (process.env.GITHUB_STEP_SUMMARY) await appendFile(process.env.GITHUB_STEP_SUMMARY, `### Slop sample (${kind})\n\n[![sample](${preview})](${url})\n\n[Full print file](${url})\n\n<details><summary>Prompt</summary>\n\n${idea.prompt}\n\n</details>\n`);
    return;
  }
  if (!process.env.SUPABASE_SECRET_KEY) { log('not configured (SUPABASE_SECRET_KEY missing). Skipping.'); process.exit(process.env.PEEK ? 1 : 0); }
  const todo = await sbJson('/rest/v1/shop_orders?status=in.(slop_queued,slop_ready)&select=id,sku,status,slop_attempts&order=id&limit=5');
  if (process.env.PEEK) { log(`${todo.length} slop order(s) waiting`); process.exit(todo.length ? 0 : 1); }
  if (!todo.length) return log('nothing to make');
  if (!process.env.OPENROUTER_SLOP_KEY && !process.env.OPENROUTER_API_KEY) throw new Error('Missing env OPENROUTER_SLOP_KEY');
  for (const o of todo) {
    if (o.status === 'slop_queued') await work(o);
    try { await place(o.id); } catch (e) { log(`order ${o.id} not placed yet:`, e.message); }
  }
}

if (import.meta.url === `file://${process.argv[1]}`) main().catch((e) => { console.error('[slop] failed:', e.message); process.exit(1); });
