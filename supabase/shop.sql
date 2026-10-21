-- Snellheid Merch Store: run once in Supabase → SQL Editor.

-- Product catalogue. Public can read active products; prices here are the ONLY prices the server charges.
create table public.shop_products (
  sku text primary key,                       -- e.g. 'mug-logo'
  name_en text not null,
  name_nl text not null,
  blurb_en text not null default '',
  blurb_nl text not null default '',
  price_eur numeric(8,2) not null check (price_eur > 0),   -- what the buyer pays (cost price incl. shipping + PayPal fee)
  image_url text not null,                    -- picture shown in the shop
  -- How Printful knows what to make. Use ONE of:
  --   (a) printful_sync_variant_id: a product you created in your Printful store, or
  --   (b) printful_variant_id + print_file_url: a Printful catalogue variant (e.g. 11oz white mug) printed with our file.
  -- Leave both empty and the product shows as "opening soon".
  printful_sync_variant_id bigint,
  printful_variant_id bigint,
  print_file_url text,
  max_qty int not null default 5,
  sort int not null default 0,
  active boolean not null default true
);
alter table public.shop_products enable row level security;
create policy "anyone can read active products" on public.shop_products for select using (active);

-- Orders. Contains names and addresses: NO public access at all (only the server function, with the secret key).
create table public.shop_orders (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  paypal_order_id text unique not null,
  sku text not null references public.shop_products(sku),
  qty int not null check (qty between 1 and 20),
  amount_eur numeric(8,2) not null,
  status text not null default 'created',     -- created → paid → submitted (or needs_attention)
  buyer_name text,
  buyer_email text,
  ship_to jsonb,
  printful_order_id bigint,
  note text
);
alter table public.shop_orders enable row level security;
-- (deliberately no policies: the publishable key can neither read nor write orders)

-- Starter catalogue. PRICES ARE ESTIMATES: set price_eur to (Printful product + shipping to NL) × 1.035 + 0.35 (PayPal fee)
-- once you see the real numbers in Printful. Products stay "opening soon" until a Printful ID is filled in.
insert into public.shop_products (sku, name_en, name_nl, blurb_en, blurb_nl, price_eur, image_url, print_file_url, max_qty, sort) values
('mug-logo', 'Logo Mug', 'Logomok',
 'Snail-rocket on one side, "Moving fast. Circling back." on the other. 11 oz, dishwasher safe.',
 'Slak-raket aan de ene kant, "Moving fast. Circling back." aan de andere. 330 ml, vaatwasserbestendig.',
 17.50, 'assets/merch/mug-logo.jpg', 'https://www.snellheid.com/assets/merch/print/mug-logo.png', 5, 1),
('mug-email', '“Per my last email” Mug', '“Per my last email”-mok',
 'For meetings that could have been an email. Which is all of them.',
 'Voor vergaderingen die een mail hadden kunnen zijn. Dus allemaal.',
 17.50, 'assets/merch/mug-email.jpg', 'https://www.snellheid.com/assets/merch/print/mug-email.png', 5, 2),
('sticker-logo', 'Snail-Rocket Sticker', 'Slak-raket-sticker',
 'Die-cut vinyl, 3×3 in. Laptop, water bottle, Dirk’s forehead.',
 'Uitgesneden vinyl, 7,5×7,5 cm. Laptop, waterfles, het voorhoofd van Dirk.',
 7.50, 'assets/merch/sticker-logo.jpg', 'https://www.snellheid.com/assets/merch/print/sticker-logo.png', 10, 3),
('sticker-motto', '“Moving Fast” Sticker', '“Moving Fast”-sticker',
 'The company motto, in sticker form. Legally binding.',
 'Het bedrijfsmotto, als sticker. Juridisch bindend.',
 7.50, 'assets/merch/sticker-motto.jpg', 'https://www.snellheid.com/assets/merch/print/sticker-motto.png', 10, 4);
