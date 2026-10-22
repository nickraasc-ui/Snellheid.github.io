# Company Store setup

The store is built and live in "opening soon" mode. These steps connect it to PayPal and Printful. Do them in order. Everything starts in **test mode**: fake PayPal money, and Printful orders stay unconfirmed drafts that never get charged.

**What you'll create:** a free PayPal developer app, a free Printful account, and one server function in your existing Supabase project.
**What never goes into chat, the website or GitHub:** the PayPal *secret*, the Printful *token*. Those go into Supabase secrets only.

---

## 1. Supabase: create the tables (2 min)

Supabase → **SQL Editor** → New query. Paste the full contents of [`supabase/shop.sql`](../supabase/shop.sql) and run it. It should say **Success**.

This creates the product list (public) and the orders table (private: holds names and addresses, so nobody can read it except the server function).

## 2. PayPal: get test credentials (5 min)

1. Go to **developer.paypal.com** and log in with your normal PayPal account.
2. Open **Apps & Credentials**, make sure the toggle says **Sandbox**, then click **Create App**.
   - Name: `Snellheid Store`. Type: **Merchant**.
3. Copy the **Client ID**, which is public. You'll send it to Claude in step 6.
4. Copy the **Secret**, which is private. It goes into Supabase in step 4.
5. Under **Testing Tools → Sandbox Accounts** there's a ready-made *Personal* test buyer. Note its email and password, since you'll use it to test-buy.

## 3. Printful: account, payment method, token (10 min)

1. Sign up at **printful.com** (free).
2. **Stores → Add store → "Manual order platform / API"**. Name it `Snellheid`.
3. **Settings → Billing**: add a payment method (card or PayPal). Printful charges this when it produces an order. Draft orders are never charged.
4. Create an API token at **developers.printful.com → Your tokens → Create token**:
   - Access: **the Snellheid store only**.
   - Scopes: at least **orders** (read and write).
   - Copy the token. It's private and goes into Supabase in step 4.

## 4. Supabase: deploy the server function (5 min)

1. Supabase → **Edge Functions → Deploy a new function → Via Editor**.
2. Name it exactly `shop`. Replace the example code with the full contents of [`supabase/functions/shop/index.ts`](../supabase/functions/shop/index.ts), then **Deploy**.
3. Open the function's **Details / Settings** and **turn OFF "Verify JWT"** (also shown as *Enforce JWT verification*). The website uses the new publishable key, which is not a JWT. The function does its own checks.
4. **Edge Functions → Secrets**, then add:

   | Name | Value |
   | --- | --- |
   | `PAYPAL_CLIENT_ID` | Client ID from step 2 |
   | `PAYPAL_SECRET` | Secret from step 2 |
   | `PAYPAL_ENV` | `sandbox` |
   | `PRINTFUL_TOKEN` | token from step 3 |

   Leave `PRINTFUL_AUTO_CONFIRM` unset for now, so orders arrive in Printful as **drafts**.

## 5. Link each product to what Printful should make (5 min)

Each shop item needs to know which Printful product to print our design on. The easiest way is Printful's standard catalogue (nothing to set up in Printful):

1. In your browser, open **https://api.printful.com/products** (public, no login). Use Ctrl+F to find `White Glossy Mug` and note its `"id"`.
2. Open `https://api.printful.com/products/<that id>` and find the variant whose name contains **11 oz**. Note its `"id"`. That's the *variant ID*.
3. Do the same for `Kiss-Cut Stickers` and its **3″×3″** variant.
4. Supabase → SQL Editor:
   ```sql
   update shop_products set printful_variant_id = <MUG VARIANT ID>     where sku in ('mug-logo','mug-email');
   update shop_products set printful_variant_id = <STICKER VARIANT ID> where sku in ('sticker-logo','sticker-motto');
   ```

The print files are already online (`https://www.snellheid.com/assets/merch/print/…`), and the function sends them along with each order.

**Prices:** the starter prices are estimates. Check Printful's cost for each product plus shipping to Germany, then set `price_eur` in **Table Editor → shop_products**. At cost: `(product + shipping) × 1.035 + 0.35` covers PayPal's fee.

## 6. Turn the PayPal buttons on (Claude)

Send Claude your **sandbox Client ID**. It's public by design, and it's safe to paste in chat. Claude puts it in `assets/js/shop.js` and pushes. The Store page then shows PayPal buttons.

## 7. Test-buy

1. Open **www.snellheid.com/shop.html**, pick a mug, click PayPal, and log in with the **sandbox test buyer** from step 2.
2. You should see "Order #… placed".
3. Check **Supabase → Table Editor → shop_orders**: there should be a row with status `draft_in_printful` and the test buyer's address.
4. Check **Printful → Orders**: there should be a draft. Delete it, so it never gets produced.

## 8. Go live (when you're happy)

1. You need a **PayPal Business account** (free; you can convert your personal one). On developer.paypal.com, switch the toggle to **Live**, create the app again, and copy the live Client ID and Secret.
2. Supabase secrets: `PAYPAL_CLIENT_ID` = live ID, `PAYPAL_SECRET` = live secret, `PAYPAL_ENV` = `live`.
3. Send Claude the **live Client ID** for the website.
4. Optional, once you trust it: set `PRINTFUL_AUTO_CONFIRM` = `true`, and paid orders go straight into production. This only takes effect when `PAYPAL_ENV` = `live`, because sandbox payments are fake and anyone can make them. Until then, confirm each draft in Printful yourself; it takes one click per order. For a friends-only shop, keeping it off is the best protection against fraud: you only confirm orders from people you know.

## When something goes wrong

- **Order status `needs_attention`** in `shop_orders`: the buyer *has paid*, but Printful didn't accept the order (bad address, wrong variant ID…). The `note` column says why. Fix it, then place it manually in Printful.
- **Refunds:** do them in your PayPal account. Cancel the order in Printful if it isn't produced yet.
- **The `shop_orders` table contains your friends' addresses.** It's private, but don't share screenshots of it.
