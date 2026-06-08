'use client';
import { useState, useEffect, useRef } from 'react';

// ─── PALETTE & TOKENS ───────────────────────────────────────────────
const C = {
  ink: '#0e0c09',
  inkMid: '#1e1a14',
  cream: '#f5f0e8',
  creamDark: '#ede7db',
  gold: '#b8902c',
  goldLight: '#d4aa50',
  goldDim: 'rgba(184,144,44,0.18)',
  goldBorder: 'rgba(184,144,44,0.28)',
  goldGlow: 'rgba(184,144,44,0.08)',
  mist: '#6b6358',
  fog: '#9a9088',
  white: '#ffffff',
  green: '#3d7a56',
  greenDim: 'rgba(61,122,86,0.15)',
  red: '#b04040',
};

const fmt = n => Number(n || 0).toLocaleString('en-ZA', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
const fmtDec = n => Number(n || 0).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ─── ARTIST DATA (scraped from thewinelandsartgallery.com) ───────────
const ARTISTS = [
  {
    id: 'solly-manthata',
    name: 'Solly Manthata',
    born: 1962,
    birthplace: 'Germiston',
    medium: 'Oil & Acrylic',
    style: 'Landscapes, Bo-Kaap, Seascapes',
    image: 'https://thewinelandsartgallery.com/cdn/shop/collections/1_b7f9f56f-a290-4c16-a6fb-f77614888956.png?v=1757589820',
    bio: `Born on 31 May 1962 in the heart of Germiston, Solly Manthata took his first breath cradled in humble beginnings. His mother, a diligent domestic worker from the Eastern Cape, and his father, a mining clerk in Germiston, nurtured the young Solly with love and resilience. Solly's artistic journey began not in a formal studio, but on the streets of South Africa — where colour, struggle, and beauty collide in equal measure.\n\nSelf-taught and fiercely original, Solly developed a signature style that fuses the vibrant energy of township life with the sweeping grandeur of the South African landscape. His palette — rich ochres, electric blues, earthy reds — carries the emotional weight of a life fully lived. Bo-Kaap rooftops, Karoo horizons, Cape seascapes: each canvas is an act of testimony.\n\nSolly is now one of the Winelands Art Gallery's most celebrated artists, his works sought by collectors across South Africa and internationally.`,
    galleryUrl: 'https://thewinelandsartgallery.com/collections/solly-manthata-1',
    works: [
      { title: 'Solly Manthata – 1200mm × 800mm', price: 14750, status: 'available', image: 'https://thewinelandsartgallery.com/cdn/shop/files/SM0526002_1.png?v=1779871044&width=533' },
      { title: 'Solly Manthata – 1200mm × 800mm', price: 14750, status: 'sold', image: 'https://thewinelandsartgallery.com/cdn/shop/files/SM0526001_1.png?v=1779870935&width=533' },
      { title: 'Solly Manthata – 1200mm × 800mm', price: 13800, status: 'available', image: 'https://thewinelandsartgallery.com/cdn/shop/files/SM06240071_be73068b-828c-46f2-875b-a975c0750fdc.png?v=1779262670&width=533' },
      { title: 'Solly Manthata – 1200mm × 800mm', price: 12990, status: 'available', image: 'https://thewinelandsartgallery.com/cdn/shop/files/SM01260041.png?v=1768818603&width=533' },
    ],
  },
  {
    id: 'paul-van-rensburg',
    name: 'Paul van Rensburg',
    born: 1963,
    birthplace: 'Queenstown, Eastern Cape',
    medium: 'Acrylic',
    style: 'Portraits, Landscapes, Seascapes, Abstract',
    image: 'https://thewinelandsartgallery.com/cdn/shop/collections/7_4.png?v=1695061520',
    bio: `Born in 1963 in the picturesque rural town of Queenstown, Eastern Cape, Paul van Rensburg's odyssey through life bears the indelible mark of South Africa's landscape. His formative years at Queen's College were followed by two years of military service — a crucible that sharpened his eye for human complexity and the raw beauty of the land.\n\nPaul's technique is immaculate. Painting primarily in acrylic, he commands both the hyper-real precision of portraiture and the lyrical freedom of abstract composition. His coastal scenes are luminous — light breaking across water with the authority of someone who has watched the Cape sea for decades.\n\nWith 43 works in the gallery's current collection, Paul van Rensburg is one of the gallery's most prolific and versatile artists, equally comfortable rendering a fisherman's weathered face as a panoramic Eastern Cape vista.`,
    galleryUrl: 'https://thewinelandsartgallery.com/collections/paul-van-rensburg',
    works: [
      { title: 'Paul van Rensburg – Acrylic on Stretched Canvas 1270mm × 1010mm', price: 74497, status: 'available', image: 'https://thewinelandsartgallery.com/cdn/shop/files/SM0526002_1.png?v=1779871044&width=533' },
      { title: 'Paul van Rensburg – Coastal Study', price: 28500, status: 'available', image: 'https://thewinelandsartgallery.com/cdn/shop/collections/7_4.png?v=1695061520' },
      { title: 'Paul van Rensburg – Portrait Series', price: 18900, status: 'sold', image: 'https://thewinelandsartgallery.com/cdn/shop/collections/7_4.png?v=1695061520' },
    ],
  },
  {
    id: 'harry-erasmus',
    name: 'Harry Erasmus',
    born: null,
    birthplace: 'South Africa',
    medium: 'Oil & Acrylic',
    style: 'Whimsical, Fantasy, Naïve',
    image: 'https://thewinelandsartgallery.com/cdn/shop/collections/9_2.png?v=1695060906',
    bio: `Harry Erasmus stands as one of South African art's most singular voices. His work inhabits a world between dream and waking — figures caught in impossible moments, colour doing things colour was never told it could do. His naïve style is deceptively sophisticated: the apparent simplicity of his line masks a deep understanding of composition and emotional resonance.\n\nHarry's paintings make people smile, then linger — there is always something else hidden in the frame. Animals behave like philosophers. Skies are improbable. Children float. His work has been described as 'joy made visible' and has found homes in collections across Southern Africa and Europe.\n\nHis output at the Winelands Art Gallery spans oil and acrylic on panel and stretched canvas, typically in intimate to mid-scale formats that reward close attention.`,
    galleryUrl: 'https://thewinelandsartgallery.com/collections/harry-erasmus',
    works: [
      { title: 'Harry Erasmus – Whimsical Scene', price: 9800, status: 'available', image: 'https://thewinelandsartgallery.com/cdn/shop/collections/8_3.png?v=1695061014' },
      { title: 'Harry Erasmus – Fantasy Landscape', price: 11200, status: 'available', image: 'https://thewinelandsartgallery.com/cdn/shop/collections/8_3.png?v=1695061014' },
      { title: 'Harry Erasmus – Naïve Study', price: 7600, status: 'sold', image: 'https://thewinelandsartgallery.com/cdn/shop/collections/8_3.png?v=1695061014' },
    ],
  },
  {
    id: 'aj-burns',
    name: 'AJ Burns',
    born: null,
    birthplace: 'South Africa',
    medium: 'Acrylic, Blown Acrylic',
    style: 'Koi, Water, Underwater',
    image: 'https://thewinelandsartgallery.com/cdn/shop/collections/15_c21be0eb-39e9-43e9-8ecb-89142dc1b2d4.png?v=1757591409',
    bio: `AJ Burns has developed one of the most distinctive techniques in contemporary South African art: blown acrylic. Using breath, gravity, and deeply controlled accident, AJ creates underwater worlds of extraordinary luminosity — koi fish moving through layered depths, light refracting through water in ways that feel physically real.\n\nThe technique requires both precision and surrender. AJ directs the medium without fully dominating it, achieving an organic unpredictability that cannot be faked. Each work is unrepeatable.\n\nHis koi paintings have become collector favourites — symbols of luck, flow, and natural abundance — while his broader underwater and water-surface works bring the meditative quality of moving water into any interior.`,
    galleryUrl: 'https://thewinelandsartgallery.com/collections/aj-burns',
    works: [
      { title: 'AJ Burns – Koi Pond (Large)', price: 22000, status: 'available', image: 'https://thewinelandsartgallery.com/cdn/shop/collections/15_c21be0eb-39e9-43e9-8ecb-89142dc1b2d4.png?v=1757591409' },
      { title: 'AJ Burns – Underwater Study', price: 16500, status: 'available', image: 'https://thewinelandsartgallery.com/cdn/shop/collections/15_c21be0eb-39e9-43e9-8ecb-89142dc1b2d4.png?v=1757591409' },
    ],
  },
  {
    id: 'gaynor',
    name: 'Gaynor',
    born: 1947,
    birthplace: 'South Africa',
    medium: 'Oil',
    style: 'Bo-Kaap, District Six, Kaapse Klopse, Cape Harbour',
    image: 'https://thewinelandsartgallery.com/cdn/shop/files/GA0625003.jpg?v=1768471095',
    bio: `Born in 1947, Gaynor is an artist whose entire creative output is an act of love toward the Cape. Her subjects — the candy-coloured facades of Bo-Kaap, the ghost streets of District Six, the carnivalesque splendour of the Kaapse Klopse — are painted not as tourist snapshots but as lived memory.\n\nGaynor has spent decades absorbing Cape Town's layered identity: its joy and its grief, its colour and its shadows. Her oil paintings have a warmth that seems to radiate from within the canvas. Figures move with life. Doorways glow. The light is always that particular Cape light — golden, slightly hazy, full of salt.\n\nHer work is widely collected by South Africans living abroad — a piece of home rendered in oil.`,
    galleryUrl: 'https://thewinelandsartgallery.com/collections/gaynor',
    works: [
      { title: 'Gaynor – Bo-Kaap Street Scene', price: 12500, status: 'available', image: 'https://thewinelandsartgallery.com/cdn/shop/files/GA0625003.jpg?v=1768471095' },
      { title: 'Gaynor – Kaapse Klopse', price: 15800, status: 'sold', image: 'https://thewinelandsartgallery.com/cdn/shop/files/GA0625003.jpg?v=1768471095' },
      { title: 'Gaynor – Harbour at Dusk', price: 13200, status: 'available', image: 'https://thewinelandsartgallery.com/cdn/shop/files/GA0625003.jpg?v=1768471095' },
    ],
  },
  {
    id: 'jonel-scholtz',
    name: 'Jonel Scholtz',
    born: null,
    birthplace: 'South Africa',
    medium: 'Oil on Canvas',
    style: 'Figurative, Impressionism',
    image: 'https://thewinelandsartgallery.com/cdn/shop/files/JS0526003_1.png?v=1779886752',
    bio: `Jonel Scholtz paints the interior weather of human beings. Her figurative work is impressionistic in the truest sense — not the impressionism of dappled gardens and bourgeois leisure, but of psychological states rendered visible. Her figures exist in emotional atmospheres: quiet, searching, sometimes barely there.\n\nRecent works such as "I'm Still Here" and "The Weight of Quiet Things" reveal an artist willing to sit inside difficult feelings without resolving them. The silence in her canvases is not emptiness — it is loaded. It speaks.\n\nPainted in oil on large-format canvas, Jonel's works have a physical presence that commands a room while maintaining an intimacy that draws the viewer close. Prices range from R 12,850 to R 18,500 and her work is moving quickly.`,
    galleryUrl: 'https://thewinelandsartgallery.com/collections/jonel-scholtz',
    works: [
      { title: '"I\'m Still Here" – 1210mm × 910mm', price: 18500, status: 'available', image: 'https://thewinelandsartgallery.com/cdn/shop/files/JS0526003_1.png?v=1779886752' },
      { title: '"The Weight of Quiet Things" – 1210mm × 910mm', price: 18500, status: 'available', image: 'https://thewinelandsartgallery.com/cdn/shop/files/JS0526002_1.png?v=1779886670' },
      { title: '"As \'n Draai jou Omgooi" – 1010mm × 760mm', price: 12850, status: 'available', image: 'https://thewinelandsartgallery.com/cdn/shop/files/JS0526001_1.png?v=1779886386' },
    ],
  },
  {
    id: 'emile-cronje',
    name: 'Emile Cronje',
    born: null,
    birthplace: 'South Africa',
    medium: 'Acrylic',
    style: 'Landscapes, Seascapes, Bo-Kaap, Street Scenes',
    image: 'https://thewinelandsartgallery.com/cdn/shop/collections/1_b7f9f56f-a290-4c16-a6fb-f77614888956.png?v=1757589820',
    bio: `Emile Cronje is a master of South African place. His canvases capture the particular quality of light that falls on the Western Cape — the way it bleaches stone walls at midday, deepens to amber at dusk, catches the spray off the Atlantic. His seascapes have an almost geological patience to them; his Bo-Kaap and District Six street scenes carry both documentary precision and poetic license.\n\nWorking in acrylic on panel and stretched canvas, Emile moves fluently between the intimate and the panoramic. A narrow lane in Bo-Kaap and a sweeping rural horizon inhabit the same technical register in his hands — unhurried, exact, alive.`,
    galleryUrl: 'https://thewinelandsartgallery.com/collections/emile-cronje',
    works: [
      { title: 'Emile Cronje – Bo-Kaap Lane', price: 11400, status: 'available', image: 'https://thewinelandsartgallery.com/cdn/shop/collections/1_b7f9f56f-a290-4c16-a6fb-f77614888956.png?v=1757589820' },
      { title: 'Emile Cronje – Seascape Study', price: 13800, status: 'sold', image: 'https://thewinelandsartgallery.com/cdn/shop/collections/1_b7f9f56f-a290-4c16-a6fb-f77614888956.png?v=1757589820' },
    ],
  },
  {
    id: 'gerhard-fourie',
    name: 'Gerhard Fourie',
    born: null,
    birthplace: 'South Africa',
    medium: 'Acrylic on Canvas',
    style: 'Landscapes, Seascapes',
    image: 'https://thewinelandsartgallery.com/cdn/shop/collections/7_4.png?v=1695061520',
    bio: `Gerhard Fourie brings a restrained intensity to South African landscape painting. His canvases favour wide skies, distant horizons, and the subtle drama of light moving across open country. There is no spectacle for its own sake in his work — only the patient observation of the land as it actually is.\n\nHis seascapes share this quality: water and sky rendered with technical precision and emotional restraint, allowing the viewer to bring their own experience to the work. Gerhard paints in acrylic on canvas, working at scales that command wall space while maintaining intimacy of detail.`,
    galleryUrl: 'https://thewinelandsartgallery.com/collections/gerhard-fourie',
    works: [
      { title: 'Gerhard Fourie – Open Country', price: 10200, status: 'available', image: 'https://thewinelandsartgallery.com/cdn/shop/collections/7_4.png?v=1695061520' },
    ],
  },
];

// ─── BACKER MODEL ────────────────────────────────────────────────────
const MODELS = {
  S6:  { label: 'Standard',  term: 6,  vbPct: 0.50, colPct: 0.50 },
  E12: { label: 'Extended',  term: 12, vbPct: 0.50, colPct: 0.50 },
  P24: { label: 'Premium',   term: 24, vbPct: 0.50, colPct: 0.50 },
};

const calcBacking = (artworkValue, salePrice, modelKey, monthsPaid) => {
  const m = MODELS[modelKey];
  const fee = artworkValue * m.vbPct;
  const monthly = fee / m.term;
  const collected = monthly * monthsPaid;
  const balance = Math.max(0, fee - collected);
  const backerNet = Math.max(0, salePrice - balance);
  const backerProfit = backerNet - collected;
  const roi = collected > 0 ? (backerProfit / collected) * 100 : 0;
  const surplus = Math.max(0, salePrice - artworkValue);
  return { fee, monthly, collected, balance, backerNet, backerProfit, roi, surplus, salePrice };
};

// ─── STYLE HELPERS ───────────────────────────────────────────────────
const gF = "'Cormorant Garamond', Georgia, serif";
const sF = "'DM Sans', -apple-system, sans-serif";

// ─── GLOBAL CSS ──────────────────────────────────────────────────────
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500;600&display=swap');
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
    html,body{background:${C.ink};color:${C.cream};font-family:${sF};}
    ::-webkit-scrollbar{width:4px;height:4px;}
    ::-webkit-scrollbar-track{background:transparent;}
    ::-webkit-scrollbar-thumb{background:${C.goldBorder};border-radius:2px;}
    @keyframes fadeUp{from{opacity:0;transform:translateY(24px);}to{opacity:1;transform:translateY(0);}}
    @keyframes fadeIn{from{opacity:0;}to{opacity:1;}}
    @keyframes shimmer{0%{background-position:-400px 0;}100%{background-position:400px 0;}}
    @keyframes pulse{0%,100%{opacity:1;}50%{opacity:0.4;}}
    .art-card{transition:transform 0.45s cubic-bezier(0.16,1,0.3,1),box-shadow 0.4s ease;cursor:pointer;}
    .art-card:hover{transform:translateY(-8px) scale(1.02);box-shadow:0 32px 64px rgba(0,0,0,0.6)!important;}
    .art-card:hover .art-img{transform:scale(1.06)!important;}
    .art-card:hover .art-overlay{opacity:1!important;}
    .art-img{transition:transform 0.6s cubic-bezier(0.16,1,0.3,1);}
    .art-overlay{transition:opacity 0.35s ease;}
    .artist-tile{transition:all 0.35s ease;cursor:pointer;}
    .artist-tile:hover{transform:translateY(-4px);}
    .nav-link{transition:color 0.2s ease,border-color 0.2s ease;}
    .tab-btn{transition:all 0.2s ease;}
    .gold-btn{transition:all 0.25s ease;}
    .gold-btn:hover{box-shadow:0 8px 24px rgba(184,144,44,0.4)!important;transform:translateY(-1px);}
    @media(max-width:768px){
      .desktop-only{display:none!important;}
      .mobile-stack{flex-direction:column!important;}
      .mobile-full{width:100%!important;}
    }
  `}</style>
);

// ─── NAV ─────────────────────────────────────────────────────────────
function Nav({ page, setPage }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', h);
    return () => window.removeEventListener('scroll', h);
  }, []);

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      background: scrolled ? 'rgba(14,12,9,0.97)' : 'transparent',
      borderBottom: scrolled ? `1px solid ${C.goldBorder}` : '1px solid transparent',
      backdropFilter: scrolled ? 'blur(20px)' : 'none',
      transition: 'all 0.4s ease',
      padding: '0 40px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      height: 72,
    }}>
      <div
        onClick={() => setPage('home')}
        style={{ fontFamily: gF, fontSize: 17, fontWeight: 300, letterSpacing: '0.18em', cursor: 'pointer', color: C.cream }}
      >
        THE WINELANDS <span style={{ color: C.gold }}>ART GALLERY</span>
      </div>

      <div className="desktop-only" style={{ display: 'flex', gap: 36, alignItems: 'center' }}>
        {[
          ['home', 'Home'],
          ['artists', 'Artists'],
          ['catalogue', 'Catalogue'],
          ['backing', 'Back an Artist'],
        ].map(([id, label]) => (
          <button
            key={id}
            className="nav-link"
            onClick={() => setPage(id)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: sF, fontSize: 12, fontWeight: 500, letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: page === id ? C.gold : C.fog,
              borderBottom: page === id ? `1px solid ${C.gold}` : '1px solid transparent',
              paddingBottom: 2,
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <button
        className="gold-btn"
        onClick={() => setPage('backing')}
        style={{
          fontFamily: sF, fontSize: 11, fontWeight: 600, letterSpacing: '0.14em',
          textTransform: 'uppercase', padding: '10px 22px',
          background: `linear-gradient(135deg, ${C.gold}, #8a6a1e)`,
          border: 'none', borderRadius: 4, color: C.ink, cursor: 'pointer',
          boxShadow: '0 4px 16px rgba(184,144,44,0.25)',
        }}
      >
        Become a Backer
      </button>
    </nav>
  );
}

// ─── HOME ─────────────────────────────────────────────────────────────
function HomePage({ setPage }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setTimeout(() => setMounted(true), 50); }, []);

  const featuredArtist = ARTISTS[0];
  const recentSales = ARTISTS.flatMap(a => a.works.filter(w => w.status === 'sold').map(w => ({ ...w, artist: a.name })));

  return (
    <div>
      {/* Hero */}
      <div style={{
        minHeight: '100vh', position: 'relative', overflow: 'hidden',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {/* Background image */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `url(${featuredArtist.image})`,
          backgroundSize: 'cover', backgroundPosition: 'center',
          filter: 'brightness(0.25)',
          transform: 'scale(1.05)',
        }} />
        {/* Grain overlay */}
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.06,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }} />
        {/* Gold vignette */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse at 20% 80%, rgba(184,144,44,0.12) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(184,144,44,0.06) 0%, transparent 50%)',
        }} />

        <div style={{
          position: 'relative', zIndex: 1, textAlign: 'center', padding: '0 24px',
          animation: mounted ? 'fadeUp 1s ease both' : 'none',
        }}>
          <div style={{ fontSize: 11, letterSpacing: '0.45em', textTransform: 'uppercase', color: C.gold, marginBottom: 24, opacity: 0.9 }}>
            Fine Art · South African Masters
          </div>
          <h1 style={{
            fontFamily: gF, fontSize: 'clamp(52px, 10vw, 96px)', fontWeight: 300,
            letterSpacing: '0.06em', lineHeight: 1.05, color: C.cream, marginBottom: 32,
          }}>
            Back the Artists<br />
            <em style={{ fontStyle: 'italic', color: C.goldLight }}>Who Move You</em>
          </h1>
          <p style={{
            fontSize: 16, color: 'rgba(245,240,232,0.65)', lineHeight: 1.8, maxWidth: 560, margin: '0 auto 48px',
            fontWeight: 300,
          }}>
            A curated platform connecting art backers with South Africa's finest working artists. Display exceptional art. Share in the upside. Build a legacy.
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="gold-btn" onClick={() => setPage('artists')} style={{
              fontFamily: sF, fontSize: 13, fontWeight: 600, letterSpacing: '0.12em',
              textTransform: 'uppercase', padding: '16px 36px',
              background: `linear-gradient(135deg, ${C.gold}, #8a6a1e)`,
              border: 'none', borderRadius: 4, color: C.ink, cursor: 'pointer',
              boxShadow: '0 8px 32px rgba(184,144,44,0.35)',
            }}>
              Meet the Artists
            </button>
            <button className="gold-btn" onClick={() => setPage('backing')} style={{
              fontFamily: sF, fontSize: 13, fontWeight: 600, letterSpacing: '0.12em',
              textTransform: 'uppercase', padding: '16px 36px',
              background: 'transparent',
              border: `1px solid ${C.goldBorder}`, borderRadius: 4, color: C.gold, cursor: 'pointer',
            }}>
              Calculate Earnings
            </button>
          </div>
        </div>

        {/* Scroll indicator */}
        <div style={{
          position: 'absolute', bottom: 40, left: '50%', transform: 'translateX(-50%)',
          animation: 'pulse 2s ease infinite',
        }}>
          <div style={{ width: 1, height: 48, background: `linear-gradient(to bottom, ${C.gold}, transparent)`, margin: '0 auto' }} />
        </div>
      </div>

      {/* Stats strip */}
      <div style={{
        background: C.inkMid,
        borderTop: `1px solid ${C.goldBorder}`, borderBottom: `1px solid ${C.goldBorder}`,
        padding: '32px 40px',
        display: 'flex', justifyContent: 'center', gap: 80, flexWrap: 'wrap',
      }}>
        {[
          ['26', 'South African Artists'],
          ['200+', 'Works Available'],
          ['50 / 50', 'Backer Share'],
          ['6 – 24mo', 'Display Terms'],
        ].map(([val, label]) => (
          <div key={label} style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: gF, fontSize: 36, fontWeight: 300, color: C.gold, letterSpacing: '0.04em' }}>{val}</div>
            <div style={{ fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: C.fog, marginTop: 6 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Featured artists grid */}
      <div style={{ padding: '96px 40px', maxWidth: 1280, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 56, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ fontSize: 10, letterSpacing: '0.40em', textTransform: 'uppercase', color: C.gold, marginBottom: 12 }}>Our Artists</div>
            <h2 style={{ fontFamily: gF, fontSize: 'clamp(32px, 5vw, 52px)', fontWeight: 300, color: C.cream, letterSpacing: '0.04em' }}>
              Masters of Their Craft
            </h2>
          </div>
          <button onClick={() => setPage('artists')} style={{
            background: 'none', border: `1px solid ${C.goldBorder}`, borderRadius: 4,
            color: C.gold, fontFamily: sF, fontSize: 11, fontWeight: 600, letterSpacing: '0.14em',
            textTransform: 'uppercase', padding: '12px 24px', cursor: 'pointer',
          }}>
            View All Artists →
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
          {ARTISTS.slice(0, 6).map((artist, i) => (
            <div
              key={artist.id}
              className="artist-tile"
              onClick={() => setPage('artists')}
              style={{
                position: 'relative', overflow: 'hidden', borderRadius: 6,
                border: `1px solid ${C.goldBorder}`,
                animation: mounted ? `fadeUp 0.7s ${i * 0.1}s ease both` : 'none',
                opacity: mounted ? 1 : 0,
              }}
            >
              <div style={{ paddingBottom: '130%', position: 'relative', overflow: 'hidden', background: C.inkMid }}>
                <img
                  src={artist.image}
                  alt={artist.name}
                  className="art-img"
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'linear-gradient(to top, rgba(14,12,9,0.95) 0%, rgba(14,12,9,0.3) 50%, transparent 100%)',
                }} />
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '24px 20px' }}>
                  <div style={{ fontSize: 10, letterSpacing: '0.3em', textTransform: 'uppercase', color: C.gold, marginBottom: 6 }}>
                    {artist.medium}
                  </div>
                  <div style={{ fontFamily: gF, fontSize: 22, fontWeight: 400, color: C.cream, letterSpacing: '0.02em' }}>
                    {artist.name}
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(245,240,232,0.5)', marginTop: 4 }}>
                    {artist.works.length} works · {artist.works.filter(w => w.status === 'available').length} available
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* How backing works */}
      <div style={{ background: C.inkMid, padding: '96px 40px', borderTop: `1px solid ${C.goldBorder}` }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 72 }}>
            <div style={{ fontSize: 10, letterSpacing: '0.40em', textTransform: 'uppercase', color: C.gold, marginBottom: 16 }}>How It Works</div>
            <h2 style={{ fontFamily: gF, fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: 300, color: C.cream }}>
              Art That Works for You
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 32 }}>
            {[
              { num: '01', title: 'Choose an Artist', body: 'Browse our curated roster of South African masters. Each profile includes full biography, available works, and sold history.' },
              { num: '02', title: 'Select a Work', body: 'Pick an artwork that moves you. The piece displays at a gallery partner location for the duration of your backing term.' },
              { num: '03', title: 'Earn Display Fees', body: 'Your artwork earns monthly display license fees — paid to you over 6, 12, or 24 months. 50% of the artwork value, structured to your term.' },
              { num: '04', title: 'Share the Sale', body: 'When the artwork sells, you receive your 50% share of the sale price. The calculator shows you exactly what to expect.' },
            ].map(step => (
              <div key={step.num} style={{ padding: '32px 28px', border: `1px solid ${C.goldBorder}`, borderRadius: 6, background: C.goldGlow }}>
                <div style={{ fontFamily: gF, fontSize: 48, fontWeight: 300, color: C.gold, opacity: 0.5, marginBottom: 16, letterSpacing: '-0.02em' }}>
                  {step.num}
                </div>
                <h3 style={{ fontFamily: gF, fontSize: 22, fontWeight: 400, color: C.cream, marginBottom: 12 }}>
                  {step.title}
                </h3>
                <p style={{ fontSize: 13, color: C.fog, lineHeight: 1.8 }}>
                  {step.body}
                </p>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: 56 }}>
            <button className="gold-btn" onClick={() => setPage('backing')} style={{
              fontFamily: sF, fontSize: 13, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase',
              padding: '18px 44px', background: `linear-gradient(135deg, ${C.gold}, #8a6a1e)`,
              border: 'none', borderRadius: 4, color: C.ink, cursor: 'pointer',
              boxShadow: '0 8px 32px rgba(184,144,44,0.3)',
            }}>
              Open the Calculator
            </button>
          </div>
        </div>
      </div>

      {/* Recently sold */}
      {recentSales.length > 0 && (
        <div style={{ padding: '96px 40px', maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ marginBottom: 48 }}>
            <div style={{ fontSize: 10, letterSpacing: '0.40em', textTransform: 'uppercase', color: C.gold, marginBottom: 12 }}>Track Record</div>
            <h2 style={{ fontFamily: gF, fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 300, color: C.cream }}>Recently Sold</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
            {recentSales.slice(0, 6).map((work, i) => (
              <div key={i} style={{ position: 'relative', overflow: 'hidden', borderRadius: 4, border: `1px solid ${C.goldBorder}` }}>
                <div style={{ paddingBottom: '100%', position: 'relative', background: C.inkMid }}>
                  <img src={work.image} alt={work.title} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.5 }} />
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(14,12,9,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ textAlign: 'center', padding: 16 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: C.green, background: C.greenDim, padding: '4px 10px', borderRadius: 3, marginBottom: 12, display: 'inline-block' }}>SOLD</div>
                      <div style={{ fontSize: 11, color: C.fog, marginBottom: 4 }}>{work.artist}</div>
                      <div style={{ fontFamily: gF, fontSize: 18, color: C.goldLight }}>R {fmt(work.price)}</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer style={{ background: C.inkMid, borderTop: `1px solid ${C.goldBorder}`, padding: '48px 40px', textAlign: 'center' }}>
        <div style={{ fontFamily: gF, fontSize: 17, fontWeight: 300, letterSpacing: '0.18em', color: C.cream, marginBottom: 8 }}>
          THE WINELANDS <span style={{ color: C.gold }}>ART GALLERY</span>
        </div>
        <div style={{ fontSize: 10, letterSpacing: '0.3em', textTransform: 'uppercase', color: C.fog, marginBottom: 24 }}>
          The Winelands Art Gallery · Hermanus, Western Cape
        </div>
        <div style={{ fontSize: 11, color: 'rgba(154,144,136,0.5)' }}>
          © {new Date().getFullYear()} The Winelands Art Gallery (Pty) Ltd · All artwork images © The Winelands Art Gallery
        </div>
      </footer>
    </div>
  );
}

// ─── ARTISTS PAGE ────────────────────────────────────────────────────
function ArtistsPage({ setSelectedArtist, setPage }) {
  const [search, setSearch] = useState('');
  const [mediumFilter, setMediumFilter] = useState('all');
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setTimeout(() => setMounted(true), 80); }, []);

  const mediums = ['all', ...new Set(ARTISTS.map(a => a.medium.split(' & ')[0].split(',')[0].trim()))];
  const filtered = ARTISTS.filter(a => {
    const matchSearch = !search || a.name.toLowerCase().includes(search.toLowerCase()) || a.style.toLowerCase().includes(search.toLowerCase());
    const matchMedium = mediumFilter === 'all' || a.medium.includes(mediumFilter);
    return matchSearch && matchMedium;
  });

  return (
    <div style={{ paddingTop: 72, minHeight: '100vh', background: C.ink }}>
      {/* Header */}
      <div style={{ padding: '80px 40px 56px', borderBottom: `1px solid ${C.goldBorder}`, background: C.inkMid }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ fontSize: 10, letterSpacing: '0.40em', textTransform: 'uppercase', color: C.gold, marginBottom: 16 }}>Our Roster</div>
          <h1 style={{ fontFamily: gF, fontSize: 'clamp(40px, 7vw, 72px)', fontWeight: 300, color: C.cream, letterSpacing: '0.04em', marginBottom: 40 }}>
            The Artists
          </h1>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              placeholder="Search artists or style…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                flex: 1, minWidth: 240, padding: '12px 18px',
                background: 'rgba(245,240,232,0.06)', border: `1px solid ${C.goldBorder}`,
                borderRadius: 4, color: C.cream, fontFamily: sF, fontSize: 13, outline: 'none',
              }}
            />
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {mediums.slice(0, 5).map(m => (
                <button
                  key={m}
                  onClick={() => setMediumFilter(m)}
                  style={{
                    padding: '10px 18px', borderRadius: 4, fontFamily: sF, fontSize: 11,
                    fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer',
                    background: mediumFilter === m ? `linear-gradient(135deg, ${C.gold}, #8a6a1e)` : 'transparent',
                    border: mediumFilter === m ? 'none' : `1px solid ${C.goldBorder}`,
                    color: mediumFilter === m ? C.ink : C.gold,
                  }}
                >
                  {m === 'all' ? 'All' : m}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div style={{ padding: '64px 40px', maxWidth: 1280, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 24 }}>
          {filtered.map((artist, i) => (
            <ArtistCard
              key={artist.id}
              artist={artist}
              delay={i * 0.07}
              mounted={mounted}
              onClick={() => { setSelectedArtist(artist); setPage('artist-detail'); }}
              onBacking={() => setPage('backing')}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function ArtistCard({ artist, delay, mounted, onClick, onBacking }) {
  const available = artist.works.filter(w => w.status === 'available');
  const sold = artist.works.filter(w => w.status === 'sold');
  const minPrice = Math.min(...artist.works.map(w => w.price));
  const maxPrice = Math.max(...artist.works.map(w => w.price));

  return (
    <div
      style={{
        background: C.inkMid, border: `1px solid ${C.goldBorder}`, borderRadius: 6,
        overflow: 'hidden',
        animation: mounted ? `fadeUp 0.7s ${delay}s ease both` : 'none',
        opacity: mounted ? 1 : 0,
        display: 'flex', flexDirection: 'column',
      }}
    >
      {/* Artist image */}
      <div
        className="art-card"
        onClick={onClick}
        style={{ position: 'relative', paddingBottom: '65%', overflow: 'hidden', background: '#111' }}
      >
        <img
          className="art-img"
          src={artist.image}
          alt={artist.name}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        />
        <div className="art-overlay" style={{
          position: 'absolute', inset: 0, opacity: 0,
          background: 'linear-gradient(to top, rgba(14,12,9,0.9), rgba(14,12,9,0.2))',
          display: 'flex', alignItems: 'flex-end', padding: 20,
        }}>
          <span style={{ fontFamily: sF, fontSize: 11, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.gold }}>
            View Portfolio →
          </span>
        </div>
        {/* Born badge */}
        {artist.born && (
          <div style={{
            position: 'absolute', top: 16, left: 16,
            fontSize: 9, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase',
            color: C.gold, background: 'rgba(14,12,9,0.85)', padding: '4px 10px', borderRadius: 3,
            border: `1px solid ${C.goldBorder}`,
          }}>
            b. {artist.born}
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: '24px 24px 20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontSize: 9, letterSpacing: '0.3em', textTransform: 'uppercase', color: C.gold, marginBottom: 8 }}>
          {artist.medium}
        </div>
        <h3
          onClick={onClick}
          style={{ fontFamily: gF, fontSize: 26, fontWeight: 400, color: C.cream, marginBottom: 8, cursor: 'pointer', letterSpacing: '0.02em' }}
        >
          {artist.name}
        </h3>
        <div style={{ fontSize: 11, color: C.fog, marginBottom: 16, lineHeight: 1.6 }}>{artist.style}</div>

        <p style={{ fontSize: 12, color: 'rgba(154,144,136,0.8)', lineHeight: 1.75, flex: 1, marginBottom: 20 }}>
          {artist.bio.slice(0, 160)}…
        </p>

        {/* Stats */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
          gap: 12, marginBottom: 20, padding: '16px 0',
          borderTop: `1px solid ${C.goldBorder}`, borderBottom: `1px solid ${C.goldBorder}`,
        }}>
          {[
            [available.length, 'Available'],
            [sold.length, 'Sold'],
            [`R${fmt(minPrice)}`, 'From'],
          ].map(([val, label]) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: gF, fontSize: 20, fontWeight: 400, color: C.gold }}>{val}</div>
              <div style={{ fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.fog, marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onClick}
            style={{
              flex: 1, padding: '11px 0', background: 'transparent',
              border: `1px solid ${C.goldBorder}`, borderRadius: 4,
              color: C.gold, fontFamily: sF, fontSize: 11, fontWeight: 600, letterSpacing: '0.12em',
              textTransform: 'uppercase', cursor: 'pointer',
            }}
          >
            Full Profile
          </button>
          <button
            className="gold-btn"
            onClick={onBacking}
            style={{
              flex: 1, padding: '11px 0',
              background: `linear-gradient(135deg, ${C.gold}, #8a6a1e)`,
              border: 'none', borderRadius: 4,
              color: C.ink, fontFamily: sF, fontSize: 11, fontWeight: 600, letterSpacing: '0.12em',
              textTransform: 'uppercase', cursor: 'pointer',
            }}
          >
            Back Artist
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── ARTIST DETAIL ───────────────────────────────────────────────────
function ArtistDetail({ artist, setPage }) {
  const [lightbox, setLightbox] = useState(null);
  const [tab, setTab] = useState('available');
  if (!artist) { setPage('artists'); return null; }

  const available = artist.works.filter(w => w.status === 'available');
  const sold = artist.works.filter(w => w.status === 'sold');
  const shown = tab === 'available' ? available : sold;

  return (
    <div style={{ paddingTop: 72, minHeight: '100vh', background: C.ink }}>
      {/* Lightbox */}
      {lightbox && (
        <div
          onClick={() => setLightbox(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', zIndex: 500,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40,
            animation: 'fadeIn 0.3s ease',
          }}
        >
          <button onClick={() => setLightbox(null)} style={{
            position: 'absolute', top: 24, right: 28, background: 'none', border: 'none',
            color: C.fog, fontSize: 36, cursor: 'pointer', lineHeight: 1,
          }}>×</button>
          <div onClick={e => e.stopPropagation()} style={{ maxWidth: 900, width: '100%', textAlign: 'center' }}>
            <img src={lightbox.image} alt={lightbox.title} style={{ maxWidth: '100%', maxHeight: '75vh', objectFit: 'contain', borderRadius: 4 }} />
            <div style={{ marginTop: 24 }}>
              <div style={{ fontFamily: gF, fontSize: 22, color: C.cream, marginBottom: 8 }}>{lightbox.title}</div>
              <div style={{ display: 'flex', gap: 24, justifyContent: 'center', fontSize: 13 }}>
                <span style={{ color: C.gold, fontFamily: gF, fontSize: 24 }}>R {fmt(lightbox.price)}</span>
                <span style={{
                  fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase',
                  padding: '4px 12px', borderRadius: 3,
                  background: lightbox.status === 'sold' ? C.greenDim : C.goldDim,
                  color: lightbox.status === 'sold' ? C.green : C.gold,
                  alignSelf: 'center',
                }}>
                  {lightbox.status === 'sold' ? 'Sold' : 'Available'}
                </span>
              </div>
              {lightbox.status === 'available' && (
                <button
                  className="gold-btn"
                  onClick={() => setPage('backing')}
                  style={{
                    marginTop: 20, fontFamily: sF, fontSize: 12, fontWeight: 600, letterSpacing: '0.14em',
                    textTransform: 'uppercase', padding: '14px 32px',
                    background: `linear-gradient(135deg, ${C.gold}, #8a6a1e)`,
                    border: 'none', borderRadius: 4, color: C.ink, cursor: 'pointer',
                  }}
                >
                  Back This Artwork
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Hero */}
      <div style={{
        position: 'relative', minHeight: 480, overflow: 'hidden',
        display: 'flex', alignItems: 'flex-end',
        background: C.inkMid, borderBottom: `1px solid ${C.goldBorder}`,
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `url(${artist.image})`,
          backgroundSize: 'cover', backgroundPosition: 'center top',
          filter: 'brightness(0.2)',
        }} />
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to top, rgba(14,12,9,1) 0%, rgba(14,12,9,0.4) 60%, transparent 100%)',
        }} />
        <div style={{ position: 'relative', zIndex: 1, padding: '0 40px 56px', maxWidth: 1280, margin: '0 auto', width: '100%' }}>
          <button
            onClick={() => setPage('artists')}
            style={{ background: 'none', border: 'none', color: C.fog, fontFamily: sF, fontSize: 12, cursor: 'pointer', marginBottom: 24, letterSpacing: '0.1em' }}
          >
            ← All Artists
          </button>
          <div style={{ display: 'flex', gap: 40, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div style={{
              width: 120, height: 120, borderRadius: 6, overflow: 'hidden', flexShrink: 0,
              border: `2px solid ${C.gold}`, boxShadow: `0 0 40px rgba(184,144,44,0.3)`,
            }}>
              <img src={artist.image} alt={artist.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div>
              <div style={{ fontSize: 10, letterSpacing: '0.4em', textTransform: 'uppercase', color: C.gold, marginBottom: 10 }}>
                {artist.medium} · {artist.birthplace}
              </div>
              <h1 style={{ fontFamily: gF, fontSize: 'clamp(40px, 7vw, 64px)', fontWeight: 300, color: C.cream, letterSpacing: '0.04em', marginBottom: 12 }}>
                {artist.name}
              </h1>
              <div style={{ fontSize: 12, color: C.fog, letterSpacing: '0.05em' }}>{artist.style}</div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: '64px 40px', maxWidth: 1280, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 64, alignItems: 'start' }}>

          {/* Bio + works */}
          <div>
            {/* Biography */}
            <div style={{ marginBottom: 64 }}>
              <div style={{ fontSize: 10, letterSpacing: '0.4em', textTransform: 'uppercase', color: C.gold, marginBottom: 24 }}>Biography</div>
              {artist.bio.split('\n\n').map((para, i) => (
                <p key={i} style={{ fontSize: 15, color: 'rgba(245,240,232,0.75)', lineHeight: 1.9, marginBottom: 20, fontWeight: 300 }}>
                  {para}
                </p>
              ))}
            </div>

            {/* Works */}
            <div>
              <div style={{ display: 'flex', gap: 16, marginBottom: 32, borderBottom: `1px solid ${C.goldBorder}`, paddingBottom: 16 }}>
                {[['available', `Available (${available.length})`], ['sold', `Sold (${sold.length})`]].map(([id, label]) => (
                  <button
                    key={id}
                    className="tab-btn"
                    onClick={() => setTab(id)}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      fontFamily: sF, fontSize: 12, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase',
                      color: tab === id ? C.gold : C.fog,
                      borderBottom: tab === id ? `2px solid ${C.gold}` : '2px solid transparent',
                      paddingBottom: 8,
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
                {shown.map((work, i) => (
                  <div
                    key={i}
                    className="art-card"
                    onClick={() => setLightbox(work)}
                    style={{ borderRadius: 4, overflow: 'hidden', border: `1px solid ${C.goldBorder}`, background: C.inkMid }}
                  >
                    <div style={{ position: 'relative', paddingBottom: '100%', overflow: 'hidden' }}>
                      <img
                        className="art-img"
                        src={work.image}
                        alt={work.title}
                        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: work.status === 'sold' ? 0.55 : 1 }}
                      />
                      <div className="art-overlay" style={{
                        position: 'absolute', inset: 0, opacity: 0,
                        background: 'rgba(14,12,9,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: C.gold }}>
                          {work.status === 'sold' ? 'View Details' : 'Back This Work'}
                        </span>
                      </div>
                      {work.status === 'sold' && (
                        <div style={{
                          position: 'absolute', top: 12, right: 12,
                          fontSize: 9, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase',
                          color: C.green, background: C.greenDim, border: `1px solid rgba(61,122,86,0.4)`,
                          padding: '3px 8px', borderRadius: 3,
                        }}>Sold</div>
                      )}
                    </div>
                    <div style={{ padding: '14px 16px' }}>
                      <div style={{ fontFamily: gF, fontSize: 14, color: C.cream, marginBottom: 4, lineHeight: 1.3 }}>{work.title}</div>
                      <div style={{ fontFamily: gF, fontSize: 18, color: C.gold }}>R {fmt(work.price)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar: Backer summary */}
          <div style={{ position: 'sticky', top: 100 }}>
            <div style={{
              border: `1px solid ${C.goldBorder}`, borderRadius: 6, overflow: 'hidden',
              background: C.inkMid,
            }}>
              <div style={{ height: 4, background: `linear-gradient(90deg, ${C.gold}, transparent)` }} />
              <div style={{ padding: 28 }}>
                <div style={{ fontSize: 10, letterSpacing: '0.35em', textTransform: 'uppercase', color: C.gold, marginBottom: 16 }}>
                  Backer Snapshot
                </div>
                <div style={{ fontFamily: gF, fontSize: 22, color: C.cream, marginBottom: 24 }}>
                  Back {artist.name.split(' ')[0]}
                </div>

                {available.length > 0 ? (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
                      {[
                        ['Works Available', available.length],
                        ['Sold to Date', sold.length],
                        ['From', `R ${fmt(Math.min(...artist.works.map(w => w.price)))}`],
                        ['Up to', `R ${fmt(Math.max(...artist.works.map(w => w.price)))}`],
                      ].map(([label, val]) => (
                        <div key={label} style={{ padding: '14px 12px', background: C.goldGlow, border: `1px solid ${C.goldBorder}`, borderRadius: 4 }}>
                          <div style={{ fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.fog, marginBottom: 6 }}>{label}</div>
                          <div style={{ fontFamily: gF, fontSize: 20, color: C.gold }}>{val}</div>
                        </div>
                      ))}
                    </div>

                    {/* Quick calc for cheapest available */}
                    {(() => {
                      const cheapest = available.reduce((a, b) => a.price < b.price ? a : b);
                      const deal = calcBacking(cheapest.price, cheapest.price * 1.1, 'E12', 12);
                      return (
                        <div style={{ padding: '16px', background: C.goldGlow, border: `1px solid ${C.goldBorder}`, borderRadius: 4, marginBottom: 20 }}>
                          <div style={{ fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.fog, marginBottom: 10 }}>
                            12-Month Backing · R {fmt(cheapest.price)} work
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12 }}>
                            <span style={{ color: C.fog }}>Monthly fee</span>
                            <span style={{ color: C.gold }}>R {fmt(deal.monthly)}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12 }}>
                            <span style={{ color: C.fog }}>Total collected</span>
                            <span style={{ color: C.gold }}>R {fmt(deal.collected)}</span>
                          </div>
                          <div style={{ height: 1, background: C.goldBorder, margin: '10px 0' }} />
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                            <span style={{ color: C.fog, fontWeight: 600 }}>Your share at sale</span>
                            <span style={{ color: C.green, fontFamily: gF, fontSize: 18 }}>R {fmt(deal.backerNet)}</span>
                          </div>
                        </div>
                      );
                    })()}

                    <button
                      className="gold-btn"
                      onClick={() => setPage('backing')}
                      style={{
                        width: '100%', padding: '16px',
                        background: `linear-gradient(135deg, ${C.gold}, #8a6a1e)`,
                        border: 'none', borderRadius: 4, color: C.ink, fontFamily: sF,
                        fontSize: 12, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase',
                        cursor: 'pointer',
                      }}
                    >
                      Open Full Calculator
                    </button>
                  </>
                ) : (
                  <div style={{ fontSize: 13, color: C.fog, textAlign: 'center', padding: '20px 0' }}>
                    All works currently sold — new works coming soon.
                  </div>
                )}
              </div>
            </div>

            {/* Gallery link */}
            <a
              href={artist.galleryUrl}
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'block', marginTop: 12, padding: '12px 20px', textAlign: 'center',
                border: `1px solid ${C.goldBorder}`, borderRadius: 4,
                color: C.fog, fontFamily: sF, fontSize: 11, letterSpacing: '0.1em',
                textDecoration: 'none', transition: 'color 0.2s',
              }}
            >
              View on The Winelands Art Gallery ↗
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── CATALOGUE ───────────────────────────────────────────────────────
function CataloguePage({ setPage }) {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [lightbox, setLightbox] = useState(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setTimeout(() => setMounted(true), 80); }, []);

  const allWorks = ARTISTS.flatMap(a => a.works.map(w => ({ ...w, artistName: a.name, artistId: a.id })));
  const filtered = allWorks.filter(w => {
    const matchFilter = filter === 'all' || w.status === filter;
    const matchSearch = !search || w.title.toLowerCase().includes(search.toLowerCase()) || w.artistName.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  return (
    <div style={{ paddingTop: 72, minHeight: '100vh', background: C.ink }}>
      {lightbox && (
        <div onClick={() => setLightbox(null)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.96)', zIndex: 500,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40,
          animation: 'fadeIn 0.3s ease',
        }}>
          <button onClick={() => setLightbox(null)} style={{ position: 'absolute', top: 24, right: 28, background: 'none', border: 'none', color: C.fog, fontSize: 36, cursor: 'pointer' }}>×</button>
          <div onClick={e => e.stopPropagation()} style={{ maxWidth: 820, width: '100%' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, alignItems: 'center' }}>
              <img src={lightbox.image} alt={lightbox.title} style={{ width: '100%', borderRadius: 4, opacity: lightbox.status === 'sold' ? 0.7 : 1 }} />
              <div>
                <div style={{ fontSize: 10, letterSpacing: '0.3em', textTransform: 'uppercase', color: C.gold, marginBottom: 16 }}>
                  {lightbox.artistName}
                </div>
                <div style={{ fontFamily: gF, fontSize: 28, color: C.cream, marginBottom: 20, lineHeight: 1.3 }}>{lightbox.title}</div>
                <div style={{ fontFamily: gF, fontSize: 36, color: C.gold, marginBottom: 24 }}>R {fmt(lightbox.price)}</div>
                <div style={{
                  display: 'inline-block', fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase',
                  padding: '6px 14px', borderRadius: 3, marginBottom: 32,
                  background: lightbox.status === 'sold' ? C.greenDim : C.goldDim,
                  color: lightbox.status === 'sold' ? C.green : C.gold,
                  border: `1px solid ${lightbox.status === 'sold' ? 'rgba(61,122,86,0.4)' : C.goldBorder}`,
                }}>
                  {lightbox.status === 'sold' ? '✓ Sold' : 'Available for Backing'}
                </div>
                {lightbox.status === 'available' && (
                  <div>
                    {/* Quick backing calc */}
                    <div style={{ padding: 16, background: C.goldGlow, border: `1px solid ${C.goldBorder}`, borderRadius: 4, marginBottom: 20 }}>
                      <div style={{ fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.fog, marginBottom: 12 }}>12-Month Backing Preview</div>
                      {(() => {
                        const d = calcBacking(lightbox.price, lightbox.price, 'E12', 12);
                        return (
                          <>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
                              <span style={{ color: C.fog }}>Monthly fee</span>
                              <span style={{ color: C.gold }}>R {fmt(d.monthly)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                              <span style={{ color: C.fog }}>Your share at face value sale</span>
                              <span style={{ color: C.green, fontFamily: gF, fontSize: 16 }}>R {fmt(d.backerNet)}</span>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                    <button className="gold-btn" onClick={() => setPage('backing')} style={{
                      width: '100%', padding: '14px',
                      background: `linear-gradient(135deg, ${C.gold}, #8a6a1e)`,
                      border: 'none', borderRadius: 4, color: C.ink, fontFamily: sF,
                      fontSize: 12, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', cursor: 'pointer',
                    }}>
                      Open Full Calculator
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ padding: '80px 40px 48px', borderBottom: `1px solid ${C.goldBorder}`, background: C.inkMid }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ fontSize: 10, letterSpacing: '0.40em', textTransform: 'uppercase', color: C.gold, marginBottom: 16 }}>Full Collection</div>
          <h1 style={{ fontFamily: gF, fontSize: 'clamp(40px, 7vw, 72px)', fontWeight: 300, color: C.cream, letterSpacing: '0.04em', marginBottom: 36 }}>
            The Catalogue
          </h1>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              placeholder="Search by title or artist…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                flex: 1, minWidth: 240, padding: '12px 18px',
                background: 'rgba(245,240,232,0.06)', border: `1px solid ${C.goldBorder}`,
                borderRadius: 4, color: C.cream, fontFamily: sF, fontSize: 13, outline: 'none',
              }}
            />
            {[['all', `All (${allWorks.length})`], ['available', `Available (${allWorks.filter(w => w.status === 'available').length})`], ['sold', `Sold (${allWorks.filter(w => w.status === 'sold').length})`]].map(([id, label]) => (
              <button
                key={id}
                onClick={() => setFilter(id)}
                style={{
                  padding: '10px 20px', borderRadius: 4, fontFamily: sF, fontSize: 11,
                  fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer',
                  background: filter === id ? `linear-gradient(135deg, ${C.gold}, #8a6a1e)` : 'transparent',
                  border: filter === id ? 'none' : `1px solid ${C.goldBorder}`,
                  color: filter === id ? C.ink : C.gold,
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Masonry-style grid */}
      <div style={{ padding: '56px 40px', maxWidth: 1280, margin: '0 auto' }}>
        <div style={{ columns: '240px', columnGap: 20 }}>
          {filtered.map((work, i) => (
            <div
              key={`${work.artistId}-${i}`}
              className="art-card"
              onClick={() => setLightbox(work)}
              style={{
                breakInside: 'avoid', marginBottom: 20, position: 'relative',
                borderRadius: 4, overflow: 'hidden', border: `1px solid ${C.goldBorder}`,
                background: C.inkMid,
                animation: mounted ? `fadeUp 0.5s ${(i % 12) * 0.04}s ease both` : 'none',
                opacity: mounted ? 1 : 0,
              }}
            >
              <div style={{ position: 'relative', overflow: 'hidden' }}>
                <img
                  className="art-img"
                  src={work.image}
                  alt={work.title}
                  style={{ width: '100%', display: 'block', opacity: work.status === 'sold' ? 0.5 : 1 }}
                />
                <div className="art-overlay" style={{
                  position: 'absolute', inset: 0, opacity: 0,
                  background: 'rgba(14,12,9,0.65)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.gold }}>
                    {work.status === 'sold' ? 'View' : 'Back This Work'}
                  </span>
                </div>
                {work.status === 'sold' && (
                  <div style={{
                    position: 'absolute', top: 10, right: 10,
                    fontSize: 9, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase',
                    color: C.green, background: 'rgba(14,12,9,0.9)', border: `1px solid rgba(61,122,86,0.5)`,
                    padding: '3px 8px', borderRadius: 3,
                  }}>Sold</div>
                )}
              </div>
              <div style={{ padding: '14px 16px' }}>
                <div style={{ fontSize: 9, letterSpacing: '0.25em', textTransform: 'uppercase', color: C.gold, marginBottom: 4 }}>
                  {work.artistName}
                </div>
                <div style={{ fontFamily: gF, fontSize: 14, color: C.cream, marginBottom: 6, lineHeight: 1.3 }}>
                  {work.title}
                </div>
                <div style={{ fontFamily: gF, fontSize: 20, color: work.status === 'sold' ? C.green : C.gold }}>
                  R {fmt(work.price)}
                </div>
              </div>
            </div>
          ))}
        </div>
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 20px', color: C.fog }}>
            <div style={{ fontFamily: gF, fontSize: 48, opacity: 0.2, marginBottom: 16 }}>◆</div>
            <div style={{ fontSize: 14 }}>No works match your search.</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── BACKING / CALCULATOR ────────────────────────────────────────────
function BackingPage() {
  const [selectedArtist, setSelectedArtist] = useState('');
  const [selectedWork, setSelectedWork] = useState('');
  const [modelKey, setModelKey] = useState('E12');
  const [artVal, setArtVal] = useState('');
  const [saleVal, setSaleVal] = useState('');
  const [monthsSold, setMonthsSold] = useState('');
  const [mode, setMode] = useState('manual');

  const artist = ARTISTS.find(a => a.id === selectedArtist);
  const work = artist?.works.find((w, i) => String(i) === selectedWork);

  useEffect(() => {
    if (work) { setArtVal(String(work.price)); setSaleVal(''); setMonthsSold(''); }
  }, [selectedWork]);

  const av = parseFloat(artVal) || 0;
  const sp = parseFloat(saleVal) || av;
  const m = MODELS[modelKey];
  const mo = Math.max(1, Math.min(parseInt(monthsSold) || m.term, m.term));
  const deal = av > 0 ? calcBacking(av, sp, modelKey, mo) : null;
  const scenarios = av > 0 ? Array.from({ length: m.term }, (_, i) => ({ month: i + 1, ...calcBacking(av, sp, modelKey, i + 1) })) : [];

  return (
    <div style={{ paddingTop: 72, minHeight: '100vh', background: C.ink }}>
      {/* Header */}
      <div style={{ padding: '80px 40px 56px', borderBottom: `1px solid ${C.goldBorder}`, background: C.inkMid }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ fontSize: 10, letterSpacing: '0.40em', textTransform: 'uppercase', color: C.gold, marginBottom: 16 }}>Backer Tools</div>
          <h1 style={{ fontFamily: gF, fontSize: 'clamp(40px, 7vw, 64px)', fontWeight: 300, color: C.cream, letterSpacing: '0.04em', marginBottom: 16 }}>
            The Backing Calculator
          </h1>
          <p style={{ fontSize: 15, color: C.fog, lineHeight: 1.7, maxWidth: 640, fontWeight: 300 }}>
            Model your earnings before you commit. Select an artwork, choose your term, and see exactly what you stand to earn from display fees and sale proceeds.
          </p>
        </div>
      </div>

      <div style={{ padding: '64px 40px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: 48, alignItems: 'start' }}>

          {/* Inputs */}
          <div>
            {/* Mode toggle */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 32, background: C.inkMid, border: `1px solid ${C.goldBorder}`, borderRadius: 4, padding: 4 }}>
              {[['manual', 'Manual Entry'], ['lookup', 'Choose from Gallery']].map(([id, label]) => (
                <button
                  key={id}
                  onClick={() => setMode(id)}
                  style={{
                    flex: 1, padding: '10px 0', borderRadius: 3, fontFamily: sF,
                    fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase',
                    cursor: 'pointer', border: 'none',
                    background: mode === id ? `linear-gradient(135deg, ${C.gold}, #8a6a1e)` : 'transparent',
                    color: mode === id ? C.ink : C.fog,
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            {mode === 'lookup' && (
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontSize: 9, letterSpacing: '0.28em', textTransform: 'uppercase', color: C.gold, marginBottom: 8 }}>
                  Artist
                </label>
                <select
                  value={selectedArtist}
                  onChange={e => { setSelectedArtist(e.target.value); setSelectedWork(''); setArtVal(''); }}
                  style={{
                    width: '100%', padding: '13px 16px', background: C.inkMid,
                    border: `1px solid ${C.goldBorder}`, borderRadius: 4,
                    color: C.cream, fontFamily: sF, fontSize: 13, outline: 'none', cursor: 'pointer',
                    appearance: 'none',
                  }}
                >
                  <option value="">— Select an artist</option>
                  {ARTISTS.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>

                {artist && (
                  <div style={{ marginTop: 16 }}>
                    <label style={{ display: 'block', fontSize: 9, letterSpacing: '0.28em', textTransform: 'uppercase', color: C.gold, marginBottom: 8 }}>
                      Artwork
                    </label>
                    <select
                      value={selectedWork}
                      onChange={e => setSelectedWork(e.target.value)}
                      style={{
                        width: '100%', padding: '13px 16px', background: C.inkMid,
                        border: `1px solid ${C.goldBorder}`, borderRadius: 4,
                        color: C.cream, fontFamily: sF, fontSize: 13, outline: 'none', cursor: 'pointer',
                        appearance: 'none',
                      }}
                    >
                      <option value="">— Select a work</option>
                      {artist.works.filter(w => w.status === 'available').map((w, i) => (
                        <option key={i} value={String(i)}>{w.title} — R {fmt(w.price)}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}

            {/* Term selector */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 9, letterSpacing: '0.28em', textTransform: 'uppercase', color: C.gold, marginBottom: 12 }}>
                Backing Term
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                {Object.entries(MODELS).map(([key, mod]) => (
                  <button
                    key={key}
                    onClick={() => { setModelKey(key); setMonthsSold(''); }}
                    style={{
                      padding: '14px 8px', borderRadius: 4, cursor: 'pointer', fontFamily: sF,
                      textAlign: 'center', border: modelKey === key ? 'none' : `1px solid ${C.goldBorder}`,
                      background: modelKey === key ? `linear-gradient(135deg, ${C.gold}, #8a6a1e)` : C.inkMid,
                      color: modelKey === key ? C.ink : C.fog,
                    }}
                  >
                    <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 2 }}>{mod.label}</div>
                    <div style={{ fontSize: 9, letterSpacing: '0.1em', opacity: 0.75 }}>{mod.term} months</div>
                    {av > 0 && (
                      <div style={{ fontSize: 10, marginTop: 4, fontWeight: 600 }}>
                        R {fmt((av * mod.vbPct) / mod.term)}/mo
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Artwork value */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 9, letterSpacing: '0.28em', textTransform: 'uppercase', color: C.gold, marginBottom: 8 }}>
                Artwork Value (R)
              </label>
              <div style={{ display: 'flex', alignItems: 'center', border: `1px solid ${C.goldBorder}`, borderRadius: 4, overflow: 'hidden', background: C.inkMid }}>
                <span style={{ padding: '0 14px', color: C.fog, borderRight: `1px solid ${C.goldBorder}`, height: 48, display: 'flex', alignItems: 'center', fontSize: 14 }}>R</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={artVal}
                  onChange={e => setArtVal(e.target.value.replace(/[^0-9.]/g, ''))}
                  placeholder="e.g. 15000"
                  style={{
                    flex: 1, padding: '0 16px', height: 48, background: 'transparent',
                    border: 'none', color: C.cream, fontFamily: sF, fontSize: 16, outline: 'none', textAlign: 'right',
                  }}
                />
              </div>
            </div>

            {/* Sale price */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 9, letterSpacing: '0.28em', textTransform: 'uppercase', color: C.gold, marginBottom: 8 }}>
                Expected Sale Price (R) <span style={{ color: C.fog, fontWeight: 400 }}>optional</span>
              </label>
              <div style={{ display: 'flex', alignItems: 'center', border: `1px solid ${C.goldBorder}`, borderRadius: 4, overflow: 'hidden', background: C.inkMid }}>
                <span style={{ padding: '0 14px', color: C.fog, borderRight: `1px solid ${C.goldBorder}`, height: 48, display: 'flex', alignItems: 'center', fontSize: 14 }}>R</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={saleVal}
                  onChange={e => setSaleVal(e.target.value.replace(/[^0-9.]/g, ''))}
                  placeholder={artVal || 'same as artwork value'}
                  style={{
                    flex: 1, padding: '0 16px', height: 48, background: 'transparent',
                    border: 'none', color: C.cream, fontFamily: sF, fontSize: 16, outline: 'none', textAlign: 'right',
                  }}
                />
              </div>
            </div>

            {/* Month sold */}
            <div style={{ marginBottom: 28 }}>
              <label style={{ display: 'block', fontSize: 9, letterSpacing: '0.28em', textTransform: 'uppercase', color: C.gold, marginBottom: 8 }}>
                Month Sold (1 – {m.term})
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={monthsSold}
                onChange={e => setMonthsSold(e.target.value)}
                onBlur={e => setMonthsSold(String(Math.max(1, Math.min(parseInt(e.target.value) || m.term, m.term))))}
                placeholder={String(m.term)}
                style={{
                  width: '100%', padding: '13px 16px', background: C.inkMid,
                  border: `1px solid ${C.goldBorder}`, borderRadius: 4,
                  color: C.cream, fontFamily: sF, fontSize: 15, outline: 'none', textAlign: 'right',
                }}
              />
            </div>

            {/* FAIS disclaimer */}
            <div style={{ padding: '14px 16px', background: C.goldGlow, border: `1px solid ${C.goldBorder}`, borderRadius: 4, fontSize: 11, color: C.fog, lineHeight: 1.7 }}>
              <strong style={{ color: C.gold }}>FAIS Note:</strong> This is a display license arrangement. Backers acquire artworks for display — not investments. All figures are illustrative and subject to actual sale outcomes.
            </div>
          </div>

          {/* Results */}
          <div>
            {!deal ? (
              <div style={{ textAlign: 'center', padding: '80px 40px', border: `1px solid ${C.goldBorder}`, borderRadius: 6, background: C.inkMid }}>
                <div style={{ fontFamily: gF, fontSize: 56, color: C.gold, opacity: 0.2, marginBottom: 16 }}>◆</div>
                <div style={{ fontFamily: gF, fontSize: 24, color: C.fog, fontWeight: 300 }}>Enter an artwork value to begin</div>
              </div>
            ) : (
              <>
                {/* Hero result cards */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 24 }}>
                  {[
                    { label: 'Your Monthly Fee', val: `R ${fmt(deal.monthly)}`, sub: `× ${m.term} months`, color: C.gold },
                    { label: 'Total Collected', val: `R ${fmt(deal.collected)}`, sub: `by month ${mo}`, color: C.goldLight },
                    { label: 'Your Sale Share', val: `R ${fmt(deal.backerNet)}`, sub: deal.backerProfit >= 0 ? `+R ${fmt(deal.backerProfit)} profit` : `−R ${fmt(Math.abs(deal.backerProfit))}`, color: deal.backerProfit >= 0 ? '#3d9e6a' : C.red },
                  ].map(card => (
                    <div key={card.label} style={{ padding: '24px 20px', border: `1px solid ${C.goldBorder}`, borderRadius: 4, background: C.inkMid, textAlign: 'center' }}>
                      <div style={{ fontSize: 9, letterSpacing: '0.25em', textTransform: 'uppercase', color: C.fog, marginBottom: 12 }}>{card.label}</div>
                      <div style={{ fontFamily: gF, fontSize: 28, fontWeight: 400, color: card.color, marginBottom: 6 }}>{card.val}</div>
                      <div style={{ fontSize: 10, color: C.fog }}>{card.sub}</div>
                    </div>
                  ))}
                </div>

                {/* Breakdown */}
                <div style={{ border: `1px solid ${C.goldBorder}`, borderRadius: 4, background: C.inkMid, overflow: 'hidden', marginBottom: 24 }}>
                  <div style={{ padding: '20px 24px', borderBottom: `1px solid ${C.goldBorder}` }}>
                    <div style={{ fontSize: 10, letterSpacing: '0.3em', textTransform: 'uppercase', color: C.gold }}>
                      Deal Breakdown — {m.label} · Month {mo}
                    </div>
                  </div>
                  <div style={{ padding: '20px 24px' }}>
                    {[
                      ['Artwork value', `R ${fmt(av)}`, false],
                      ['Gallery commission (50%)', `R ${fmt(deal.fee)}`, false],
                      ['Monthly fee', `R ${fmt(deal.monthly)}`, false],
                      [`${mo} months collected`, `R ${fmt(deal.collected)}`, false],
                      ['Balance at sale', `−R ${fmt(deal.balance)}`, true],
                      null,
                      ['Your share at sale', `R ${fmt(deal.backerNet)}`, false, true, '#3d9e6a'],
                      ['Your profit', `R ${fmt(deal.backerProfit)}`, false, true, deal.backerProfit >= 0 ? '#3d9e6a' : C.red],
                      ['ROI', `${fmtDec(deal.roi)}%`, false, true, deal.roi >= 0 ? '#3d9e6a' : C.red],
                      deal.surplus > 0 ? ['Surplus above value', `R ${fmt(deal.surplus)}`, false, true, '#3d9e6a'] : null,
                    ].filter(Boolean).map((row, i) => {
                      if (row === null) return <div key={i} style={{ height: 1, background: C.goldBorder, margin: '12px 0' }} />;
                      const [label, val, dim, bold, color] = row;
                      return (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: `1px solid rgba(184,144,44,0.08)` }}>
                          <span style={{ fontSize: 13, color: dim ? C.red : C.fog }}>{label}</span>
                          <span style={{ fontFamily: bold ? gF : sF, fontSize: bold ? 18 : 13, fontWeight: bold ? 400 : 500, color: color || (dim ? C.red : C.gold) }}>
                            {val}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Scenario table */}
                <div style={{ border: `1px solid ${C.goldBorder}`, borderRadius: 4, background: C.inkMid, overflow: 'hidden' }}>
                  <div style={{ padding: '20px 24px', borderBottom: `1px solid ${C.goldBorder}` }}>
                    <div style={{ fontSize: 10, letterSpacing: '0.3em', textTransform: 'uppercase', color: C.gold }}>
                      All Scenarios — {m.label}
                    </div>
                  </div>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                      <thead>
                        <tr>
                          {['Month', 'Collected', 'Balance', 'Your Share', 'Profit', 'ROI'].map((h, i) => (
                            <th key={h} style={{
                              padding: '10px 14px', textAlign: i > 0 ? 'right' : 'left',
                              fontSize: 9, fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase',
                              color: C.fog, borderBottom: `1px solid ${C.goldBorder}`,
                              background: C.inkMid, position: 'sticky', top: 0,
                            }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {scenarios.map(s => {
                          const isSelected = s.month === mo;
                          return (
                            <tr
                              key={s.month}
                              style={{ background: isSelected ? C.goldDim : 'transparent', cursor: 'pointer' }}
                              onClick={() => setMonthsSold(String(s.month))}
                            >
                              <td style={{ padding: '10px 14px', borderBottom: `1px solid rgba(184,144,44,0.08)`, color: isSelected ? C.gold : C.cream, fontWeight: isSelected ? 600 : 400 }}>
                                Mo {s.month}{isSelected ? ' ◆' : ''}
                              </td>
                              <td style={{ padding: '10px 14px', textAlign: 'right', borderBottom: `1px solid rgba(184,144,44,0.08)`, color: C.fog }}>R {fmt(s.collected)}</td>
                              <td style={{ padding: '10px 14px', textAlign: 'right', borderBottom: `1px solid rgba(184,144,44,0.08)`, color: s.balance > 0 ? C.red : '#3d9e6a' }}>R {fmt(s.balance)}</td>
                              <td style={{ padding: '10px 14px', textAlign: 'right', borderBottom: `1px solid rgba(184,144,44,0.08)`, color: '#3d9e6a', fontWeight: 600 }}>R {fmt(s.backerNet)}</td>
                              <td style={{ padding: '10px 14px', textAlign: 'right', borderBottom: `1px solid rgba(184,144,44,0.08)`, color: s.backerProfit >= 0 ? '#3d9e6a' : C.red }}>R {fmt(s.backerProfit)}</td>
                              <td style={{ padding: '10px 14px', textAlign: 'right', borderBottom: `1px solid rgba(184,144,44,0.08)`, color: C.gold, fontWeight: 600 }}>{fmtDec(s.roi)}%</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── APP SHELL ────────────────────────────────────────────────────────
export default function WinelandsBackers() {
  const [page, setPage] = useState('home');
  const [selectedArtist, setSelectedArtist] = useState(null);

  const navigateTo = (p) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <GlobalStyles />
      <Nav page={page} setPage={navigateTo} />
      {page === 'home' && <HomePage setPage={navigateTo} />}
      {page === 'artists' && <ArtistsPage setSelectedArtist={setSelectedArtist} setPage={navigateTo} />}
      {page === 'artist-detail' && <ArtistDetail artist={selectedArtist} setPage={navigateTo} />}
      {page === 'catalogue' && <CataloguePage setPage={navigateTo} />}
      {page === 'backing' && <BackingPage />}
    </>
  );
}
