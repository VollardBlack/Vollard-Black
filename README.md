# The Winelands Art Gallery — Art Backers Platform

A backer-facing platform for The Winelands Art Gallery, built with Next.js 14.

## What it is

This app lets prospective art backers:
- Browse the full artist roster with biographies and portfolios
- View the complete artwork catalogue (available & sold)
- Model their backing earnings with the interactive calculator
- Understand the 50/50 display license model across 6, 12, and 24-month terms

## Pages

| Route | Description |
|-------|-------------|
| `/` | Home — hero, how it works, featured artists, recently sold |
| Artists | Full roster with bios, mediums, available/sold counts |
| Artist Detail | Full biography, artwork gallery, backer snapshot sidebar |
| Catalogue | Masonry grid of all works, filterable by status |
| Backing Calculator | Full deal modeller with scenario table |

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Deploy to Vercel

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import the repository
4. Click Deploy — no environment variables needed

## Tech Stack

- Next.js 14 (App Router)
- React 18
- No external dependencies beyond Next.js
- Artist data sourced from [thewinelandsartgallery.com](https://thewinelandsartgallery.com)

## Adding More Artists

All artist data lives in the `ARTISTS` array inside `src/app/WinelandsBackers.jsx`. Each artist entry takes:

```js
{
  id: 'unique-slug',
  name: 'Full Name',
  born: 1970,             // or null
  birthplace: 'City',
  medium: 'Oil on Canvas',
  style: 'Landscapes, Seascapes',
  image: 'https://...',   // portrait or hero image URL
  bio: `Multi-paragraph biography...`,
  galleryUrl: 'https://thewinelandsartgallery.com/collections/...',
  works: [
    {
      title: 'Artwork Title',
      price: 15000,
      status: 'available', // or 'sold'
      image: 'https://...',
    },
  ],
}
```

## FAIS Compliance

All terminology refers to display license arrangements. The word "investment" is not used. The calculator includes a FAIS disclaimer. No financial advice is provided.

---

© The Winelands Art Gallery (Pty) Ltd · Hermanus, Western Cape
