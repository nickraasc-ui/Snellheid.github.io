// Snellheid Merch Store — Supabase Edge Function "shop".
//
// Actions, all POST JSON to /functions/v1/shop:
//   { action: "create",  sku, qty }      → creates a PayPal order (price comes from shop_products, never the browser)
//   { action: "capture", orderID }       → captures the payment, verifies it, then places the Printful order
//                                          (Slop Machine products are queued instead: their design doesn't exist yet)
//   { action: "place", id }              → Slop Machine only: places the Printful draft once scripts/slopfactory.mjs
//                                          has generated the design. Header x-shop-key must be a Supabase secret key.
//
// Secrets (Supabase → Edge Functions → Secrets):
//   PAYPAL_CLIENT_ID, PAYPAL_SECRET, PAYPAL_ENV ("sandbox" | "live")
//   PRINTFUL_TOKEN, PRINTFUL_STORE_ID (optional), PRINTFUL_AUTO_CONFIRM ("true" sends orders to production;
//   anything else leaves them as drafts in Printful for you to confirm by hand)
//   ALLOWED_ORIGINS (optional, comma-separated; default https://www.snellheid.com)
//   SHOP_DB_KEY: your Supabase secret key (sb_secret_…), so the function can read products and write orders.
//   GITHUB_DISPATCH_TOKEN (optional): fine-grained GitHub token with Actions read/write on this repo only. Starts the
//   Slop Machine workflow the moment a slop order is paid; without it the hourly Newsroom run picks the order up.
// SUPABASE_URL is provided by Supabase automatically.

const env = (k: string, d = "") => (Deno.env.get(k) ?? d).trim();

const PAYPAL_API = env("PAYPAL_API_BASE") ||
  (env("PAYPAL_ENV", "sandbox") === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com");
const PRINTFUL_API = env("PRINTFUL_API_BASE", "https://api.printful.com");
const SB_URL = env("SUPABASE_URL");
// Prefer the project secret key you set yourself (SHOP_DB_KEY); fall back to the legacy key Supabase injects.
const SB_KEY = env("SHOP_DB_KEY") || env("SUPABASE_SERVICE_ROLE_KEY");
const ORIGINS = env("ALLOWED_ORIGINS", "https://www.snellheid.com,https://snellheid.com").split(",").map((s) => s.trim());

// ---------- helpers ----------
function cors(origin: string | null) {
  return {
    "Access-Control-Allow-Origin": origin && ORIGINS.includes(origin) ? origin : ORIGINS[0],
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "content-type, apikey, authorization, x-client-info",
    "Vary": "Origin",
  };
}
function json(body: unknown, status: number, origin: string | null) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors(origin), "Content-Type": "application/json" } });
}
class Fail extends Error {
  constructor(public status: number, message: string) { super(message); }
}

async function db(path: string, init: RequestInit = {}) {
  const headers: Record<string, string> = { apikey: SB_KEY, "Content-Type": "application/json", ...(init.headers as Record<string, string> ?? {}) };
  if (SB_KEY.startsWith("eyJ")) headers.Authorization = `Bearer ${SB_KEY}`;
  const r = await fetch(`${SB_URL}/rest/v1/${path}`, { ...init, headers });
  const text = await r.text();
  if (!r.ok) throw new Error(`db ${r.status}: ${text.slice(0, 200)}`);
  return text ? JSON.parse(text) : null;
}

async function paypalToken() {
  const r = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
    method: "POST",
    headers: { Authorization: "Basic " + btoa(`${env("PAYPAL_CLIENT_ID")}:${env("PAYPAL_SECRET")}`), "Content-Type": "application/x-www-form-urlencoded" },
    body: "grant_type=client_credentials",
  });
  const d = await r.json();
  if (!r.ok || !d.access_token) throw new Error(`paypal auth ${r.status}`);
  return d.access_token as string;
}
async function paypal(path: string, body: unknown, requestId?: string) {
  const headers: Record<string, string> = { Authorization: `Bearer ${await paypalToken()}`, "Content-Type": "application/json" };
  if (requestId) headers["PayPal-Request-Id"] = requestId; // idempotency: a retried call never double-charges
  const r = await fetch(`${PAYPAL_API}${path}`, { method: "POST", headers, body: JSON.stringify(body ?? {}) });
  const d = await r.json().catch(() => ({}));
  return { ok: r.ok, status: r.status, d };
}

const money = (n: number) => (Math.round(n * 100) / 100).toFixed(2);

// ---------- actions ----------
async function create(sku: unknown, qty: unknown) {
  if (typeof sku !== "string" || !/^[a-z0-9-]{1,40}$/.test(sku)) throw new Fail(400, "bad sku");
  const n = Number(qty);
  const [p] = await db(`shop_products?sku=eq.${sku}&active=is.true&select=*`) ?? [];
  if (!p) throw new Fail(404, "unknown product");
  if (!p.printful_sync_variant_id && !(p.printful_variant_id && (p.print_file_url || p.slop))) throw new Fail(409, "product not orderable yet");
  if (!Number.isInteger(n) || n < 1 || n > p.max_qty) throw new Fail(400, "bad quantity");

  // Bot brake: unpaid checkouts are free to create, so cap them shop-wide.
  const since = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  const recent = await db(`shop_orders?select=id&status=eq.created&created_at=gte.${since}&limit=21`);
  if ((recent?.length ?? 0) >= 20) throw new Fail(429, "too many checkouts, try again in a few minutes");

  const unit = money(Number(p.price_eur)), total = money(Number(p.price_eur) * n);
  const res = await paypal("/v2/checkout/orders", {
    intent: "CAPTURE",
    purchase_units: [{
      reference_id: sku,
      description: `Snellheid Industries — ${p.name_en}`.slice(0, 127),
      amount: { currency_code: "EUR", value: total, breakdown: { item_total: { currency_code: "EUR", value: total } } },
      items: [{ name: p.name_en.slice(0, 127), quantity: String(n), unit_amount: { currency_code: "EUR", value: unit }, category: "PHYSICAL_GOODS" }],
    }],
    payment_source: { paypal: { experience_context: {
      brand_name: "Snellheid Industries",
      shipping_preference: "GET_FROM_FILE", // ship to the address in the buyer's PayPal account
      user_action: "PAY_NOW",
    } } },
  });
  if (!res.ok || !res.d.id) throw new Error(`paypal create ${res.status}: ${JSON.stringify(res.d).slice(0, 200)}`);
  await db("shop_orders", { method: "POST", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ paypal_order_id: res.d.id, sku, qty: n, amount_eur: total }) });
  return { id: res.d.id };
}

async function capture(orderID: unknown) {
  if (typeof orderID !== "string" || !/^[A-Z0-9]{5,40}$/.test(orderID)) throw new Fail(400, "bad order id");
  const [o] = await db(`shop_orders?paypal_order_id=eq.${orderID}&select=*`) ?? [];
  if (!o) throw new Fail(404, "unknown order");
  if (o.status !== "created") return { status: o.status }; // already handled (double click / retry)
  // Claim the order atomically so two simultaneous captures can never both place a Printful order.
  const claimed = await db(`shop_orders?id=eq.${o.id}&status=eq.created`, {
    method: "PATCH", headers: { Prefer: "return=representation" }, body: JSON.stringify({ status: "capturing" }),
  });
  if (!claimed?.length) return { status: "processing" };

  const res = await paypal(`/v2/checkout/orders/${orderID}/capture`, {}, `capture-${orderID}`);
  const unit = res.d.purchase_units?.[0];
  const cap = unit?.payments?.captures?.[0];
  if (!res.ok || res.d.status !== "COMPLETED" || cap?.status !== "COMPLETED") {
    await db(`shop_orders?id=eq.${o.id}`, { method: "PATCH", body: JSON.stringify({ status: "payment_failed", note: JSON.stringify(res.d).slice(0, 500) }) });
    throw new Fail(402, "payment not completed");
  }
  if (cap.amount?.currency_code !== "EUR" || money(Number(cap.amount?.value)) !== money(Number(o.amount_eur))) {
    await db(`shop_orders?id=eq.${o.id}`, { method: "PATCH", body: JSON.stringify({ status: "needs_attention", note: `amount mismatch: ${JSON.stringify(cap.amount)}` }) });
    throw new Fail(409, "amount mismatch");
  }

  const ship = unit.shipping ?? {}, a = ship.address ?? {};
  const recipient = {
    name: ship.name?.full_name ?? [res.d.payer?.name?.given_name, res.d.payer?.name?.surname].filter(Boolean).join(" "),
    address1: a.address_line_1, address2: a.address_line_2 ?? undefined,
    city: a.admin_area_2, state_code: a.admin_area_1 ?? undefined,
    country_code: a.country_code, zip: a.postal_code,
    email: res.d.payer?.email_address,
  };
  await db(`shop_orders?id=eq.${o.id}`, { method: "PATCH", body: JSON.stringify({ status: "paid", buyer_name: recipient.name, buyer_email: recipient.email, ship_to: recipient }) });

  // Paid. Now ask Printful to make and ship it. If that fails the money is safe and the order is flagged for a human.
  try {
    const [p] = await db(`shop_products?sku=eq.${o.sku}&select=slop,printful_sync_variant_id,printful_variant_id,print_file_url`);
    if (p.slop) {
      // Slop Machine: the workflow (scripts/slopfactory.mjs) designs it, then calls "place".
      await db(`shop_orders?id=eq.${o.id}`, { method: "PATCH", body: JSON.stringify({ status: "slop_queued" }) });
      await startSlopMachine();
      return { status: "slop", order: o.id };
    }
    const item = p.printful_sync_variant_id
      ? { sync_variant_id: p.printful_sync_variant_id, quantity: o.qty }
      : { variant_id: p.printful_variant_id, quantity: o.qty, files: [{ url: p.print_file_url }] };
    // Never auto-produce on sandbox payments: anyone can "pay" with fake sandbox money.
    const confirm = env("PRINTFUL_AUTO_CONFIRM") === "true" && env("PAYPAL_ENV") === "live";
    const id = await printful(o, recipient, item, confirm);
    await db(`shop_orders?id=eq.${o.id}`, { method: "PATCH", body: JSON.stringify({ status: confirm ? "submitted" : "draft_in_printful", printful_order_id: id }) });
    return { status: "ok", order: o.id };
  } catch (e) {
    await db(`shop_orders?id=eq.${o.id}`, { method: "PATCH", body: JSON.stringify({ status: "needs_attention", note: String(e).slice(0, 500) }) });
    return { status: "paid_needs_attention", order: o.id };
  }
}

// Kick off .github/workflows/slop.yml now instead of waiting for the hourly run. Best effort: the order is already queued.
async function startSlopMachine() {
  const token = env("GITHUB_DISPATCH_TOKEN");
  if (!token) return;
  try {
    const r = await fetch(`${env("GITHUB_API_BASE", "https://api.github.com")}/repos/${env("GITHUB_REPO", "nickraasc-ui/Snellheid.github.io")}/actions/workflows/slop.yml/dispatches`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json", "User-Agent": "snellheid-shop", "Content-Type": "application/json" },
      body: JSON.stringify({ ref: "main" }),
    });
    if (!r.ok) console.error("slop dispatch", r.status, (await r.text()).slice(0, 200));
  } catch (e) { console.error("slop dispatch", e); }
}

async function printful(o: { id: number }, recipient: unknown, item: unknown, confirm: boolean) {
  const headers: Record<string, string> = { Authorization: `Bearer ${env("PRINTFUL_TOKEN")}`, "Content-Type": "application/json" };
  if (env("PRINTFUL_STORE_ID")) headers["X-PF-Store-Id"] = env("PRINTFUL_STORE_ID");
  const r = await fetch(`${PRINTFUL_API}/orders${confirm ? "?confirm=true" : ""}`, {
    method: "POST", headers,
    body: JSON.stringify({ external_id: `snel-${o.id}`, recipient, items: [item] }),
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok || !d.result?.id) throw new Error(`printful ${r.status}: ${JSON.stringify(d).slice(0, 300)}`);
  return d.result.id as number;
}

// Slop Machine: the design is ready, send it to Printful. Always a draft, so a human looks at the slop before it's printed.
async function place(id: unknown, key: string | null) {
  const n = Number(id);
  if (!Number.isInteger(n) || n < 1) throw new Fail(400, "bad id");
  // Orders are invisible to the publishable key (no RLS policy), so a key that can read this one is a project secret key.
  if (!key || !/^(sb_secret_|eyJ)[\w.-]+$/.test(key)) throw new Fail(401, "not allowed");
  const headers: Record<string, string> = { apikey: key };
  if (key.startsWith("eyJ")) headers.Authorization = `Bearer ${key}`;
  const check = await fetch(`${SB_URL}/rest/v1/shop_orders?id=eq.${n}&select=id`, { headers });
  if (!check.ok || (await check.json()).length !== 1) throw new Fail(401, "not allowed");

  const [o] = await db(`shop_orders?id=eq.${n}&status=eq.slop_ready`, {
    method: "PATCH", headers: { Prefer: "return=representation" }, body: JSON.stringify({ status: "placing" }),
  }) ?? [];
  if (!o) return { status: "not_ready" };
  try {
    const [p] = await db(`shop_products?sku=eq.${o.sku}&select=printful_variant_id`);
    const pf = await printful(o, o.ship_to, { variant_id: p.printful_variant_id, quantity: o.qty, files: [{ url: o.print_file_url }] }, false);
    await db(`shop_orders?id=eq.${o.id}`, { method: "PATCH", body: JSON.stringify({ status: "draft_in_printful", printful_order_id: pf }) });
    return { status: "ok", order: o.id };
  } catch (e) {
    await db(`shop_orders?id=eq.${o.id}`, { method: "PATCH", body: JSON.stringify({ status: "needs_attention", note: String(e).slice(0, 500) }) });
    return { status: "needs_attention", order: o.id };
  }
}

// ---------- server ----------
Deno.serve(async (req) => {
  const origin = req.headers.get("Origin");
  if (req.method === "OPTIONS") return new Response(null, { headers: cors(origin) });
  if (req.method !== "POST") return json({ error: "POST only" }, 405, origin);
  try {
    const body = await req.json().catch(() => ({}));
    if (body.action === "create") return json(await create(body.sku, body.qty), 200, origin);
    if (body.action === "capture") return json(await capture(body.orderID), 200, origin);
    if (body.action === "place") return json(await place(body.id, req.headers.get("x-shop-key")), 200, origin);
    throw new Fail(400, "unknown action");
  } catch (e) {
    if (e instanceof Fail) return json({ error: e.message }, e.status, origin);
    console.error(e);
    return json({ error: "server error" }, 500, origin);
  }
});
