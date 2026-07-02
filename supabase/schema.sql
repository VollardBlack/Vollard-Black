-- Winelands Art Gallery — Auction Platform schema
-- Run in the Supabase SQL editor, top to bottom.

-- ============================================================
-- BACKERS (from KYC registration)
-- ============================================================
create table if not exists public.backers (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  surname text not null,
  whatsapp text not null,
  email text not null,
  bid_credit numeric(10, 2) not null default 1000.00,
  source text default 'kyc_registration',
  created_at timestamptz not null default now(),
  constraint backers_email_unique unique (email),
  constraint backers_whatsapp_unique unique (whatsapp)
);

alter table public.backers enable row level security;

create policy "backers_public_insert"
  on public.backers for insert to anon with check (true);

-- No public select/update/delete — lookups for bidding happen through the
-- place_bid() function below (security definer), not direct table access.

-- ============================================================
-- ARTWORKS
-- ============================================================
create table if not exists public.artworks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  artist_name text not null,
  description text,
  image_url text,
  starting_price numeric(10, 2) not null,
  current_price numeric(10, 2) not null,
  bid_increment numeric(10, 2) not null default 100.00,
  status text not null default 'upcoming' check (status in ('upcoming', 'live', 'closed')),
  starts_at timestamptz not null default now(),
  ends_at timestamptz not null,
  highest_bidder_id uuid references public.backers(id),
  winner_id uuid references public.backers(id),
  created_at timestamptz not null default now()
);

alter table public.artworks enable row level security;

create policy "artworks_public_select"
  on public.artworks for select to anon using (true);

-- Inserts/updates (creating auctions, closing them) go through the admin
-- API route using the service role key — no public write policy.

-- ============================================================
-- BIDS
-- ============================================================
create table if not exists public.bids (
  id uuid primary key default gen_random_uuid(),
  artwork_id uuid not null references public.artworks(id),
  backer_id uuid not null references public.backers(id),
  amount numeric(10, 2) not null,
  created_at timestamptz not null default now()
);

alter table public.bids enable row level security;

create policy "bids_public_select"
  on public.bids for select to anon using (true);

-- No public insert policy — all bids go through place_bid() below so
-- amount / credit / timing / concurrency are enforced server-side.

create index if not exists bids_artwork_id_idx on public.bids (artwork_id, created_at desc);

-- ============================================================
-- ATOMIC BID PLACEMENT
-- Runs as the table owner (security definer), bypassing RLS on writes,
-- so it's the single gate for every bid. Called from the API route with
-- the service role key — never exposed directly to the browser.
-- ============================================================
create or replace function public.place_bid(
  p_artwork_id uuid,
  p_whatsapp text,
  p_amount numeric
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_backer record;
  v_artwork record;
begin
  -- Look up the backer by WhatsApp number (their identity at the kiosk)
  select * into v_backer from backers where whatsapp = p_whatsapp;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'not_registered');
  end if;

  -- Lock the artwork row so two simultaneous bids can't both "win" the same price
  select * into v_artwork from artworks where id = p_artwork_id for update;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'artwork_not_found');
  end if;

  if v_artwork.status <> 'live' or now() < v_artwork.starts_at or now() > v_artwork.ends_at then
    return jsonb_build_object('ok', false, 'error', 'auction_not_live');
  end if;

  if p_amount < v_artwork.current_price + v_artwork.bid_increment then
    return jsonb_build_object(
      'ok', false,
      'error', 'bid_too_low',
      'minimum_bid', v_artwork.current_price + v_artwork.bid_increment
    );
  end if;

  if p_amount > v_backer.bid_credit then
    return jsonb_build_object('ok', false, 'error', 'insufficient_credit', 'available_credit', v_backer.bid_credit);
  end if;

  if v_artwork.highest_bidder_id = v_backer.id then
    return jsonb_build_object('ok', false, 'error', 'already_highest_bidder');
  end if;

  insert into bids (artwork_id, backer_id, amount) values (p_artwork_id, v_backer.id, p_amount);

  update artworks
    set current_price = p_amount, highest_bidder_id = v_backer.id
    where id = p_artwork_id;

  return jsonb_build_object(
    'ok', true,
    'new_price', p_amount,
    'bidder_first_name', v_backer.first_name
  );
end;
$$;

-- ============================================================
-- CLOSE AUCTION (sets status + winner) — called by the admin API route
-- ============================================================
create or replace function public.close_auction(p_artwork_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_artwork record;
begin
  select * into v_artwork from artworks where id = p_artwork_id for update;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'artwork_not_found');
  end if;

  update artworks
    set status = 'closed', winner_id = highest_bidder_id
    where id = p_artwork_id;

  return jsonb_build_object('ok', true);
end;
$$;
