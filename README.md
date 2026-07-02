# The Winelands Art Gallery — Auction Platform

A Next.js + Supabase app for backer registration and live art auctions.

## How it fits together

1. **`/register`** — visitors enter first name, surname, WhatsApp number,
   email. This creates a row in `backers` with **R1,000 bid credit**
   automatically. Duplicate email/WhatsApp is blocked at the database
   level (no credit farming).
2. **`/auctions`** — grid of all artworks (upcoming / live / closed), live
   countdown timers, current price.
3. **`/auctions/[id]`** — artwork detail with full-size image, description,
   recent bid history, and the live bid panel.
4. **Bidding** — a backer enters their WhatsApp number + bid amount. The
   server looks them up, checks the auction is live, checks the bid clears
   the current price + increment, checks it's within their bid credit, and
   atomically records it — all inside one Postgres function (`place_bid`)
   so two people bidding at the same instant can't both "win."
5. **`/admin`** — passcode-gated. Create new auctions (title, artist,
   image, starting price, increment, end time), move an auction from
   *Upcoming* → *Live*, and *Close & settle* it (locks in the highest
   bidder as the winner).

## Setup

1. **Supabase**
   - Create a project at supabase.com.
   - Open the SQL editor and run `supabase/schema.sql` — this creates
     `backers`, `artworks`, `bids`, and the `place_bid` / `close_auction`
     functions.
   - Get your Project URL, anon key, and service role key from
     Project Settings → API.

2. **Environment variables**
   - Copy `.env.local.example` → `.env.local`.
   - Fill in `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
     `SUPABASE_SERVICE_ROLE_KEY`.
   - Set `ADMIN_PASSCODE` to something only gallery staff know — this
     gates `/admin` and its API routes. It's a lightweight gate, not full
     auth; fine for a small team, but don't reuse a real password here.

3. **Install & run**
   ```bash
   npm install
   npm run dev
   ```

4. **Deploy** — push to GitHub, import into Vercel, add the same env vars
   there (Project Settings → Environment Variables).

## What's intentionally NOT built yet

- **Real payment on winning a bid.** Right now bid credit is a ceiling on
  how much someone can bid, not money that's moved. When a piece sells,
  you'll still need to invoice/collect from the winner manually, or wire
  in Payfast/Yoco for that step.
- **Full account login.** Backers are identified by WhatsApp number at
  bid time rather than a password login — fits an in-person gallery/kiosk
  setting. If you later want people bidding remotely from home with real
  confidence it's really them, that's the point to add proper auth
  (Supabase Auth with OTP over WhatsApp/email is a natural next step).
- **Automatic notifications.** No WhatsApp/email are sent yet on
  registration, outbid, or win — the UI shows it live, but nothing pings
  a phone. Twilio or WhatsApp Business API would slot in here.

## Folder structure
```
src/
  app/
    page.js                  Landing page
    register/                KYC registration
    auctions/                Auction list + [id] detail with bidding
    admin/                   Passcode-gated admin panel
    api/
      place-bid/              Bid placement (public, server-validated)
      admin/artworks/          Create/list/update auctions (admin only)
      admin/close-auction/     Close + settle an auction (admin only)
  components/
    ArtworkCard.jsx
    BidPanel.jsx
    CountdownTimer.jsx
  lib/
    supabaseClient.js         Browser-safe client (anon key)
    supabaseAdmin.js          Server-only client (service role key)
    adminAuth.js               Passcode check for admin API routes
supabase/
  schema.sql                  Full DB schema + RPC functions
```
