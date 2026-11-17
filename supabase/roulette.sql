-- Budget Slop Roulette™: pay a fixed budget, get a random AI-designed Printful product. Run once after slop.sql.

-- A roulette "product" in the shop is just a budget; the real item is picked per order from roulette_items.
alter table public.shop_products add column if not exists roulette boolean not null default false;
-- The item the roulette picked for an order (copied from roulette_items, plus Printful's cost estimate).
alter table public.shop_orders add column if not exists roulette_item jsonb;

-- What the roulette can pick. Private (no RLS policy): only the shop function reads it.
-- tier = the budget it belongs to; w/h = print file size in pixels; canvas = what the AI is told it is designing.
create table if not exists public.roulette_items (
  id text primary key,
  tier int not null,
  name text not null,
  variant_id bigint not null,
  placements text[] not null default '{default}',
  w int not null,
  h int not null,
  canvas text not null,
  active boolean not null default true
);
alter table public.roulette_items enable row level security;

insert into public.roulette_items (id, tier, name, variant_id, placements, w, h, canvas) values
('sticker-xl',   15, 'Kiss-cut sticker 5.5″',        10165, '{default}',      1650, 1650, 'a square 5.5×5.5 inch kiss-cut sticker'),
('postcard',     15, 'Postcard 4×6″',                11513, '{default}',      1800, 1200, 'a landscape 4×6 inch postcard'),
('poster-21x30', 15, 'Poster 21×30 cm',               8947, '{default}',      1240, 1772, 'a portrait 21×30 cm wall poster'),
('mug',          30, 'White mug 11 oz',               1320, '{default}',      2700, 1050, 'mug'),
('mousepad',     30, 'Mouse pad',                    13097, '{default}',      2610, 2130, 'a landscape 8.7×7.1 inch mouse pad'),
('poster-30x40', 30, 'Poster 30×40 cm',               8948, '{default}',      1772, 2362, 'a portrait 30×40 cm wall poster'),
('pillow',       30, 'Pillow 16×16″',                49854, '{front,back}',   2400, 2400, 'a square 16×16 inch throw pillow (the same art goes on both sides)'),
('framed-black', 60, 'Framed poster 30×45 cm, black',19644, '{default}',      1772, 2657, 'a portrait 30×45 cm poster in a black frame'),
('framed-white', 60, 'Framed poster 30×45 cm, white',19649, '{default}',      1772, 2657, 'a portrait 30×45 cm poster in a white frame'),
('poster-50x70', 60, 'Poster 50×70 cm',               8952, '{default}',      2480, 3472, 'a portrait 50×70 cm wall poster'),
('blanket',      60, 'Throw blanket 50×60″',         10986, '{default}',      3000, 3600, 'a 50×60 inch throw blanket'),
('sherpa',       60, 'Sherpa blanket 37×57″',        17483, '{default}',      2220, 3420, 'a 37×57 inch sherpa blanket')
on conflict (id) do nothing;

insert into public.shop_products (sku, name_en, name_nl, blurb_en, blurb_nl, price_eur, image_url, max_qty, sort, slop, roulette) values
('roulette-15', 'Budget Slop Roulette · €15', 'Budget Slop Roulette · €15',
 'Name your budget, receive… something. Small format. Possibly paper.',
 'Kies je budget, ontvang… iets. Klein formaat. Mogelijk papier.',
 15.00, 'assets/merch/roulette-15.jpg', 1, 10, true, true),
('roulette-30', 'Budget Slop Roulette · €30', 'Budget Slop Roulette · €30',
 'Mid-tier surprise. Could hold coffee. Could hold your head.',
 'Middenklasse-verrassing. Kan koffie bevatten. Kan je hoofd ondersteunen.',
 30.00, 'assets/merch/roulette-30.jpg', 1, 11, true, true),
('roulette-60', 'Budget Slop Roulette · €60', 'Budget Slop Roulette · €60',
 'Executive tier. Large, framed or cuddly. Definitely unnecessary.',
 'Directieniveau. Groot, ingelijst of knuffelbaar. Absoluut overbodig.',
 60.00, 'assets/merch/roulette-60.jpg', 1, 12, true, true)
on conflict (sku) do nothing;
