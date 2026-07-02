-- These changes have ALREADY been applied directly to your live Supabase
-- project (hilonlqgngpoialsvmqv) via the Supabase MCP connector — you do
-- NOT need to run this again. It's kept here only as a record of what
-- was changed, in case you want it in version control.

-- 1. Added bid credit + WhatsApp identity to your existing `buyers` table
alter table public.buyers
  add column if not exists whatsapp text,
  add column if not exists bid_credit numeric(10,2) not null default 0;

create unique index if not exists buyers_email_unique_idx on public.buyers (email) where email is not null;
create unique index if not exists buyers_whatsapp_unique_idx on public.buyers (whatsapp) where whatsapp is not null;

-- 2. Added image/description fields to your existing `auctions` table
alter table public.auctions add column if not exists image_url text;
alter table public.auctions add column if not exists description text;

-- 3. Atomic, race-safe bid placement against your real auctions/bids/buyers tables
create or replace function public.place_bid_v2(
  p_auction_id text,
  p_whatsapp text,
  p_amount numeric
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_buyer record;
  v_auction record;
  v_min_next numeric;
begin
  select * into v_buyer from buyers where whatsapp = p_whatsapp;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'not_registered');
  end if;

  select * into v_auction from auctions where id = p_auction_id for update;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'auction_not_found');
  end if;

  if v_auction.status <> 'Live' then
    return jsonb_build_object('ok', false, 'error', 'auction_not_live');
  end if;

  v_min_next := coalesce(v_auction.current_bid, 0) + coalesce(v_auction.increment_value, 0);
  if p_amount < v_min_next then
    return jsonb_build_object('ok', false, 'error', 'bid_too_low', 'minimum_bid', v_min_next);
  end if;

  if p_amount > v_buyer.bid_credit then
    return jsonb_build_object('ok', false, 'error', 'insufficient_credit', 'available_credit', v_buyer.bid_credit);
  end if;

  if v_auction.lead_bidder_id = v_buyer.id::text then
    return jsonb_build_object('ok', false, 'error', 'already_highest_bidder');
  end if;

  insert into bids (id, auction_id, buyer_id, buyer_name, amount, timestamp)
  values (gen_random_uuid()::text, p_auction_id, v_buyer.id::text,
          trim(coalesce(v_buyer.first_name,'') || ' ' || coalesce(v_buyer.last_name,'')),
          p_amount, now()::text);

  update auctions
    set current_bid = p_amount,
        lead_bidder_id = v_buyer.id::text,
        lead_bidder_name = trim(coalesce(v_buyer.first_name,'') || ' ' || coalesce(v_buyer.last_name,'')),
        bids_count = coalesce(bids_count, 0) + 1
    where id = p_auction_id;

  return jsonb_build_object('ok', true, 'new_price', p_amount);
end;
$$;

-- 4. Close-out function
create or replace function public.close_auction_v2(p_auction_id text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  update auctions set status = 'Closed', closed_at = now()::text where id = p_auction_id;
  return jsonb_build_object('ok', true);
end;
$$;

-- ============================================================
-- NOT APPLIED — flagged for your decision, not run automatically:
-- 10 of your tables currently have Row Level Security DISABLED,
-- meaning the public anon key can read/write them freely. This
-- includes `buyers`, `collectors` (bank details), `payments`, `sales`.
-- Turning this on requires matching policies or it will lock your
-- own app out — do this deliberately, ideally with me, not by
-- pasting this blind:
--
-- alter table public.collectors enable row level security;
-- alter table public.payments enable row level security;
-- alter table public.sales enable row level security;
-- alter table public.schedules enable row level security;
-- alter table public.buyers enable row level security;
-- alter table public.auctions enable row level security;
-- alter table public.bids enable row level security;
-- alter table public.portal_requests enable row level security;
-- alter table public.enquiries enable row level security;
-- alter table public.portal_agreements enable row level security;
