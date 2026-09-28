// Snellheid Newsroom™ — turns real business headlines into terrible LinkedIn thought leadership.
// Runs in GitHub Actions every 4 hours. Node 22+, no dependencies.
//
// Env (GitHub secrets / variables):
//   OPENROUTER_API_KEY    required
//   SUPABASE_SECRET_KEY   required (sb_secret_… or legacy service_role key) — only this job may write articles
//   OPENROUTER_MODEL      optional; otherwise the best available free model is picked automatically
//   DRY_RUN=1             optional; print the article instead of saving it

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://simdsmzaogctcfjokhuk.supabase.co';
const OPENROUTER = process.env.OPENROUTER_BASE || 'https://openrouter.ai/api/v1';
// url|source|language — the language picks the blocklist below.
const FEEDS = (process.env.NEWS_FEEDS || [
  'https://feeds.bbci.co.uk/news/business/rss.xml|BBC|en',
  'https://feeds.bbci.co.uk/news/technology/rss.xml|BBC|en',
  'https://feeds.nos.nl/nosnieuwseconomie|NOS|nl',
  'https://feeds.nos.nl/nosnieuwstech|NOS|nl',
].join(',')).split(',').map((f) => { const [url, source, lang] = f.split('|'); return { url, source, lang }; });

// Headlines about suffering are never turned into jokes. Deliberately broad; one list per feed language
// (Dutch "brand" = fire and "kind" = child are harmless English words, so the lists must not be mixed).
const BLOCK_EN = /\b(dead|deaths?|dies|died|dying|kill\w*|murder\w*|war|wars|attack\w*|bomb\w*|shoot\w*|shot|crash\w*|earthquake|flood\w*|fire|wildfires?|hurricane|storm|victims?|abuse\w*|rape\w*|terror\w*|hostages?|genocide|missiles?|suicide|cancer|famine|refugees?|disasters?|massacre|injur\w*|wounded|funeral|stabb\w*|overdose|child|children|kids?|teen\w*)\b/i;
const BLOCK_NL = /\b(dood|doden|overl\w*|omgekomen|gedood|moord\w*|oorlog\w*|aanslag\w*|bom|bommen|schiet\w*|neergeschoten|crash\w*|aardbeving|overstroming\w*|brand|slachtoffer\w*|misbruik\w*|verkracht\w*|terreur|gijzel\w*|genocide|raket\w*|zelfdoding|kanker|hongersnood|vluchteling\w*|ramp\w*|bloedbad|gewond\w*|begrafenis|steekpartij|kinderen|kind|jongeren|tiener\w*)\b/i;

const AUTHORS = {
  derek: 'Derek Lindqvist, Chief Thought Leadership Officer. Posts 11 times a day, relates everything to what his toddler taught him about B2B sales.',
  chad: 'Chad Brockwell, Founder & Chief Velocity Officer. Cold plunges at 3:45am, ends sentences with "at scale".',
  brad: 'Brad Hendricks, Chief Synergy Officer. Merges departments, loves steering committees.',
  kyle: 'Kyle Brennan, VP of Circling Back. Never closes a loop. Proposes taking everything offline.',
  greg: 'Greg Thompson, Chief Coin Officer. Answers everything with "blockchain" and Snellcoin (not launched).',
  todd: 'Todd Kessler, Chief Family Officer. Insists the company is a family, usually right before layoffs.',
};

const log = (...a) => console.log('[newsroom]', ...a);
const req = (name) => { const v = (process.env[name] || '').trim(); if (!v) throw new Error(`Missing env ${name}`); return v; };
// Pasted secrets sometimes carry line breaks or a second value; keep only the real key.
const keyFrom = (name, pattern) => { const v = req(name); return v.split(/\s+/).find((k) => pattern.test(k)) || v.split(/\s+/)[0]; };

function decode(s) {
  return s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
    .replace(/<[^>]+>/g, '').trim();
}
export function parseRss(xml, source, lang) {
  const items = [];
  for (const m of xml.matchAll(/<item\b[\s\S]*?<\/item>/g)) {
    const t = m[0].match(/<title>([\s\S]*?)<\/title>/), l = m[0].match(/<link>([\s\S]*?)<\/link>/);
    if (t && l) items.push({ title: decode(t[1]), url: decode(l[1]), source, lang });
  }
  return items;
}
export const allowed = (h) => !(h.lang === 'nl' ? BLOCK_NL : BLOCK_EN).test(h.title);

async function headlines() {
  const all = [];
  for (const f of FEEDS) {
    try {
      const r = await fetch(f.url, { headers: { 'User-Agent': 'SnellheidNewsroom/1.0 (+https://www.snellheid.com)' } });
      if (!r.ok) throw new Error(r.status);
      all.push(...parseRss(await r.text(), f.source, f.lang).slice(0, 15));
    } catch (e) { log('feed failed', f.url, e.message); }
  }
  return all;
}

function sb(path, opts = {}) {
  const key = keyFrom('SUPABASE_SECRET_KEY', /^(sb_secret_|eyJ)/);
  const headers = { apikey: key, 'Content-Type': 'application/json', ...(opts.headers || {}) };
  if (key.startsWith('eyJ')) headers.Authorization = `Bearer ${key}`; // legacy service_role JWT
  return fetch(SUPABASE_URL + path, { ...opts, headers });
}

async function usedUrls() {
  const r = await sb('/rest/v1/news_articles?select=source_url&order=created_at.desc&limit=100');
  if (!r.ok) throw new Error(`Supabase read failed: ${r.status} ${await r.text()}`);
  return new Set((await r.json()).map((x) => x.source_url));
}

// Prefer an explicit model; otherwise discover OpenRouter's current free models.
async function models() {
  if (process.env.OPENROUTER_MODEL) return process.env.OPENROUTER_MODEL.split(',');
  const r = await fetch(`${OPENROUTER}/models`);
  const ids = (await r.json()).data.map((m) => m.id).filter((id) => id.endsWith(':free'));
  const rank = (id) => { const i = [/deepseek/, /qwen/, /gemini/, /llama/, /mistral/].findIndex((p) => p.test(id)); return i < 0 ? 99 : i; };
  return ids.sort((a, b) => rank(a) - rank(b)).slice(0, 5);
}

function prompt(h, authorKey) {
  return `You write satire for Snellheid Industries, a fictional, self-aware parody conglomerate (products: Fast Glasses™ sunglasses, Snellcoin crypto that never launches, Meetings-as-a-Service, SnellGPT which only says "let's circle back"). Mascot: a snail with a rocket. Motto: "Moving fast. Circling back."

Write a painfully corny LinkedIn thought-leadership post by ${AUTHORS[authorKey]}
It must be only VAGUELY inspired by this real headline (${h.source}): "${h.title}"
Twist the headline into an absurd business lesson. Classic LinkedIn slop: humblebrag opener, one-sentence paragraphs, a made-up personal anecdote, a forced lesson, "Agree?", emojis, 3-5 hashtags. Plug a Snellheid product once.

Hard rules:
- Never name, quote or impersonate real people. Refer to real companies only generically ("a big bank"), never claim they did anything.
- Never mock victims, tragedies, illness, violence, religion, ethnicity or politics. If the headline cannot be used without that, write about something generic in business instead.
- 150-250 words per language.
- Dutch version: natural Dutch office speak, with the English buzzwords Dutch offices actually use. Not a literal translation.

Reply with ONLY this JSON, no code fences:
{"title_en": "...", "body_en": "...", "title_nl": "...", "body_nl": "..."}`;
}

export function parseArticle(text) {
  const s = text.replace(/```(json)?/g, '');
  const j = JSON.parse(s.slice(s.indexOf('{'), s.lastIndexOf('}') + 1));
  for (const k of ['title_en', 'body_en', 'title_nl', 'body_nl']) {
    if (typeof j[k] !== 'string' || j[k].trim().length < (k.startsWith('title') ? 5 : 200)) throw new Error(`bad field ${k}`);
    j[k] = j[k].trim().slice(0, k.startsWith('title') ? 160 : 4000);
  }
  return j;
}

async function write(h, authorKey) {
  const key = keyFrom('OPENROUTER_API_KEY', /^sk-or-/);
  for (const model of await models()) {
    try {
      const r = await fetch(`${OPENROUTER}/chat/completions`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', 'HTTP-Referer': 'https://www.snellheid.com', 'X-Title': 'Snellheid Newsroom' },
        body: JSON.stringify({ model, temperature: 1, max_tokens: 2500, messages: [{ role: 'user', content: prompt(h, authorKey) }] }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(`${r.status} ${JSON.stringify(data).slice(0, 200)}`);
      const a = parseArticle(data.choices[0].message.content);
      log('written by', model);
      return { ...a, model };
    } catch (e) { log('model failed', model, e.message); }
  }
  throw new Error('All models failed');
}

async function main() {
  if (!process.env.DRY_RUN && (!process.env.OPENROUTER_API_KEY || !process.env.SUPABASE_SECRET_KEY)) {
    log('not configured yet: add the OPENROUTER_API_KEY and SUPABASE_SECRET_KEY repository secrets. Skipping.');
    return;
  }
  if (!process.env.DRY_RUN) {
    // Diagnostics without leaking: key type and length only.
    const k = keyFrom('SUPABASE_SECRET_KEY', /^(sb_secret_|eyJ)/);
    const type = k.startsWith('sb_secret_') ? 'sb_secret_' : k.startsWith('eyJ') ? 'legacy JWT' : k.startsWith('sb_publishable_') ? 'PUBLISHABLE (wrong key!)' : 'unknown format';
    log(`Supabase key: ${type}, ${k.length} chars${/[•*]/.test(k) ? ', contains masking dots (copied before Reveal?)' : ''}`);
  }
  const used = process.env.DRY_RUN ? new Set() : await usedUrls();
  const pool = (await headlines()).filter(allowed).filter((h) => !used.has(h.url));
  if (!pool.length) { log('no usable headlines, skipping this run'); return; }
  const h = pool[Math.floor(Math.random() * Math.min(pool.length, 12))];
  const keys = Object.keys(AUTHORS);
  const author = Math.random() < 0.4 ? 'derek' : keys[Math.floor(Math.random() * keys.length)];
  log('headline:', h.source, '|', h.title, '| author:', author);
  const a = await write(h, author);
  const row = { author, source_title: h.title, source_url: h.url, source_name: h.source, ...a };
  if (process.env.DRY_RUN) { console.log(JSON.stringify(row, null, 2)); return; }
  const r = await sb('/rest/v1/news_articles', { method: 'POST', headers: { Prefer: 'return=minimal' }, body: JSON.stringify(row) });
  if (!r.ok) throw new Error(`Supabase insert failed: ${r.status} ${await r.text()}`);
  log('published:', a.title_en);
}

if (import.meta.url === `file://${process.argv[1]}`) main().catch((e) => { console.error(e); process.exit(1); });
