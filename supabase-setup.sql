-- ============================================================
--  WINELANDS ART GALLERY — ARTWORK STATUS TABLE
--  Run this once in your Supabase SQL Editor
-- ============================================================

-- Table to store sold/available overrides per artwork
create table if not exists artwork_status (
  id          uuid primary key default gen_random_uuid(),
  artwork_key text not null unique,   -- "{artistId}|{title}"
  artist_id   text not null,
  artist_name text not null,
  title       text not null,
  price       numeric,
  status      text not null default 'sold',  -- 'sold' or 'available'
  marked_at   timestamptz default now(),
  marked_by   uuid references auth.users(id)
);

-- Allow admin to read/write
alter table artwork_status enable row level security;

-- Anyone can read (so the public site can show sold status)
create policy "Public can read artwork status"
  on artwork_status for select
  using (true);

-- Only authenticated admins can insert/update/delete
create policy "Admins can manage artwork status"
  on artwork_status for all
  using (
    exists (
      select 1 from admin_profiles
      where id = auth.uid()
    )
  );
