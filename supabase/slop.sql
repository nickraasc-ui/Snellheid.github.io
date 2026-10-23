-- Slop Machine™: AI-designed mystery merch. Run once in Supabase → SQL Editor, after shop.sql.

-- Products whose design is generated per order by scripts/slopfactory.mjs.
alter table public.shop_products add column if not exists slop boolean not null default false;

-- Per order: the generated print file, the prompt that made it, and how often generation failed.
alter table public.shop_orders add column if not exists print_file_url text;
alter table public.shop_orders add column if not exists slop_prompt text;
alter table public.shop_orders add column if not exists slop_attempts int not null default 0;

-- Public bucket for the generated designs (Printful downloads them from here).
-- File names are random, and without a listing policy nobody can browse the bucket.
insert into storage.buckets (id, name, public) values ('slop', 'slop', true) on conflict (id) do nothing;

insert into public.shop_products (sku, name_en, name_nl, blurb_en, blurb_nl, price_eur, image_url, printful_variant_id, max_qty, sort, slop) values
('slop-mug', 'Mystery Slop Mug', 'Mysterie-Slopmok',
 'A one-of-a-kind design by our AI Chief Creative Officer. Nobody prompts it. You see it when it arrives. 11 oz.',
 'Een uniek ontwerp van onze AI Chief Creative Officer. Niemand geeft een prompt. Je ziet het pas als het binnenkomt. 330 ml.',
 20.00, 'assets/merch/slop-mug.jpg', 1320, 1, 5, true),
('slop-sticker', 'Mystery Slop Sticker', 'Mysterie-Slopsticker',
 'Unique AI-generated corporate fever dream, 3×3 in. Could be a Renaissance masterpiece. Could be a layoff death match poster.',
 'Unieke AI-gegenereerde bedrijfskoortsdroom, 7,5×7,5 cm. Kan een renaissance-meesterwerk zijn. Kan een ontslag-deathmatchposter zijn.',
 10.00, 'assets/merch/slop-sticker.jpg', 10163, 1, 6, true)
on conflict (sku) do nothing;
