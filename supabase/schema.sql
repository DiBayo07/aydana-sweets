-- Выполните в Supabase: SQL Editor → New query → Run

create table if not exists public.products (
  id bigint generated always as identity primary key,
  name text not null,
  brand text not null default '',
  brand_name text,
  type text not null default 'milk',
  cacao integer not null default 0,
  flavor text default 'classic',
  category text default 'bar',
  price integer not null default 0,
  description text default '',
  image text default '',
  tags text[] default '{}',
  country text default '',
  created_at timestamptz default now()
);

create table if not exists public.orders (
  id bigint generated always as identity primary key,
  customer_name text not null,
  phone text not null,
  address text not null,
  payment text default 'cash',
  items jsonb not null default '[]',
  total integer not null default 0,
  status text not null default 'new',
  created_at timestamptz default now()
);

create table if not exists public.messages (
  id bigint generated always as identity primary key,
  name text not null,
  email text not null,
  message text not null,
  created_at timestamptz default now()
);

alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.messages enable row level security;

drop policy if exists "products_select" on public.products;
drop policy if exists "products_insert" on public.products;
drop policy if exists "products_update" on public.products;
drop policy if exists "products_delete" on public.products;

create policy "products_select" on public.products for select using (true);
create policy "products_insert" on public.products for insert with check (true);
create policy "products_update" on public.products for update using (true);
create policy "products_delete" on public.products for delete using (true);

drop policy if exists "orders_select" on public.orders;
drop policy if exists "orders_insert" on public.orders;

create policy "orders_select" on public.orders for select using (true);
create policy "orders_insert" on public.orders for insert with check (true);

drop policy if exists "messages_select" on public.messages;
drop policy if exists "messages_insert" on public.messages;

create policy "messages_select" on public.messages for select using (true);
create policy "messages_insert" on public.messages for insert with check (true);

insert into public.products (name, brand, brand_name, type, cacao, flavor, category, price, description, image, tags, country)
select * from (values
  ('Молочный шоколад с орехами', 'milka', 'Milka', 'milk', 30, 'hazelnut', 'bar', 350,
   'Нежный молочный шоколад с цельным фундуком',
   'https://images.unsplash.com/photo-1599599810769-bcde5a160d32?w=200',
   array['хит']::text[], 'germany'),
  ('Тёмный шоколад 72% какао', 'lindt', 'Lindt', 'dark', 72, 'classic', 'bar', 480,
   'Интенсивный тёмный шоколад с нотками красных фруктов',
   'https://images.unsplash.com/photo-1606312619070-d48b4c652a52?w=200',
   array['хит']::text[], 'switzerland'),
  ('Белый шоколад с ягодами', 'milka', 'Milka', 'white', 0, 'berry', 'bar', 380,
   'Кремовый белый шоколад с кислинкой ягод',
   'https://images.unsplash.com/photo-1581798459219-318e76aecc7b?w=200',
   array[]::text[], 'germany')
) as v(name, brand, brand_name, type, cacao, flavor, category, price, description, image, tags, country)
where not exists (select 1 from public.products limit 1);
