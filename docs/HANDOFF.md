# Handoff: state of the project (2026-11-17)

Read this first in a new session, together with `README.md` and `docs/STORE-SETUP.md`.

## Ground rules from the owner

- Be direct and critical; no sycophancy.
- Develop on branch `claude/snellheid-redesign-discovery-180dkl`. Deploy by pushing the same commit to `main` (fast-forward only). Don't open PRs unless asked.
- Never put real people's names on the site. Never ask for, or echo, secrets in chat (PayPal secret, Printful token, Supabase secret key, OpenRouter keys, GitHub token).
- The owner is often on a phone: give short, copy-pasteable steps.
- After changing any CSS/JS file, bump its `?v=` in every `.html` page that loads it.
- `shop_orders` holds friends' names and addresses: never print them in full or share them.

## What exists

- **Site:** static GitHub Pages, bilingual EN/NL, `noindex` everywhere.
- **Supabase** (project ref `simdsmzaogctcfjokhuk`): leaderboard, $SNEL price, news articles and reactions, plus the shop tables.
- **Newsroom** (`.github/workflows/newsroom.yml`, `scripts/newsroom.mjs`): uses free OpenRouter models. The run turns red if the API key is rejected. "Run workflow" has optional `headline` / `headline_url` / `headline_source` inputs.
- **Store** (`shop.html`, `assets/js/shop.js`, `supabase/functions/shop/index.ts`):
  - Payment goes through live PayPal; orders go to Printful and always arrive as drafts the owner confirms.
  - Outsiders see only a login: the password is checked server-side by the secret `SHOP_PASSWORD`.
- **Slop Machine** (`scripts/slopfactory.mjs`, `.github/workflows/slop.yml`):
  - Paid slop orders get an AI design from OpenRouter (key `OPENROUTER_SLOP_KEY`), with no banner or overlay (the model writes "SNELLHEID INDUSTRIES" itself; misspellings are a feature), uploaded to the Storage bucket `slop`.
  - The function's `place` action then creates the Printful draft.
  - The shop function triggers the workflow immediately (`GITHUB_DISPATCH_TOKEN`); the hourly Newsroom run is the fallback.
- **Budget Slop Roulette** (`supabase/roulette.sql`):
  - €15 / €30 / €60 tiers.
  - The function picks a random item from `roulette_items` whose real Printful `estimate-costs` total plus fees fits the budget, then the Slop Machine designs it at the item's size.
- **Monthly keepalive:** a scheduled task fires into the original session and bumps `.github/keepalive.txt`.

## Open / next steps

1. **Roulette go-live.** Run `supabase/roulette.sql`, then deploy `supabase/functions/shop/index.ts` as the function `shop`, keeping JWT verification **off**.
2. **Real €15 roulette test order.** Check `shop_orders.roulette_item` (`cost_eur`) and the Printful draft. Printful's `estimate-costs` has only been tested against a stand-in, not the real API.
3. **Verify roulette print layouts.** Blanket orientation is guessed, and large formats are upscaled from about 1.5 MP. Deactivate bad items via `roulette_items.active`.
4. **Prepare a real Impressum and withdrawal info.** Real money is taken at a profit and the Impressum is a joke. The owner deferred this.
5. **Optional.** A 3D route (parametric trophy or lithophane) is blocked on finding a print service with an order API. Candidates to ask: 3DreamFactory, WAZP.
