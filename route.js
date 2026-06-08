'use client';
import { useState, useEffect } from 'react';

export default function HubPage() {
  const [hovered, setHovered] = useState(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const portals = [
    {
      id: 'admin',
      href: '/admin',
      label: 'Administration',
      sub: 'Platform Management',
      desc: 'Artworks, license holders, sales, auctions, invoicing and reports.',
      icon: '◈',
      accent: '#b68b2e',
      glow: 'rgba(182,139,46,0.20)',
      border: 'rgba(182,139,46,0.35)',
    },
    {
      id: 'renter',
      href: '/renter',
      label: 'License Holders',
      sub: 'Renter Portal',
      desc: 'View artworks on display, track payments and settlement statements.',
      icon: '◻',
      accent: '#4a9e6b',
      glow: 'rgba(74,158,107,0.18)',
      border: 'rgba(74,158,107,0.35)',
    },
    {
      id: 'artist',
      href: '/artist',
      label: 'Artists',
      sub: 'Artist Portal',
      desc: 'Upload artworks, track sales, view auctions and manage your profile.',
      icon: '◇',
      accent: '#648cc8',
      glow: 'rgba(100,140,200,0.18)',
      border: 'rgba(100,140,200,0.35)',
    },
    {
      id: 'buyer',
      href: '/buyer',
      label: 'Buyers',
      sub: 'Buyer Portal',
      desc: 'Browse the gallery, participate in live auctions and track purchases.',
      icon: '◯',
      accent: '#c45c4a',
      glow: 'rgba(196,92,74,0.18)',
      border: 'rgba(196,92,74,0.35)',
    },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300&family=DM+Sans:wght@300;400;500;600&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        html,body{height:100%;background:#0d0b08;}
        @keyframes fadeUp{from{opacity:0;transform:translateY(20px);}to{opacity:1;transform:translateY(0);}}
        @keyframes shimmer{0%{background-position:-200% 0;}100%{background-position:200% 0;}}
        .hub-card{transition:transform 0.35s cubic-bezier(0.34,1.4,0.64,1),box-shadow 0.3s ease,border-color 0.3s ease;text-decoration:none;display:block;}
        .hub-card:hover{transform:translateY(-8px);}
        .hub-arrow{transition:transform 0.3s ease,opacity 0.3s ease;opacity:0.3;}
        .hub-card:hover .hub-arrow{transform:translateX(4px);opacity:1;}
        .logo-text{background:linear-gradient(90deg,#b68b2e 0%,#e8c86a 45%,#b68b2e 60%,#8a6a1e 100%);background-size:200% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:shimmer 5s linear infinite;}
      `}</style>

      <div style={{
        minHeight: '100vh',
        background: 'radial-gradient(ellipse at 15% 60%, rgba(182,139,46,0.07) 0%, transparent 55%), radial-gradient(ellipse at 85% 15%, rgba(100,140,200,0.05) 0%, transparent 50%), #0d0b08',
        fontFamily: "'DM Sans', sans-serif",
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 24px',
        position: 'relative',
      }}>

        {/* Fine grain overlay */}
        <div style={{
          position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, opacity: 0.03,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }} />

        <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 1080 }}>

          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 60, animation: mounted ? 'fadeUp 0.7s ease both' : 'none' }}>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(42px,7vw,72px)', fontWeight: 300, letterSpacing: '0.22em', lineHeight: 1 }}>
              <span style={{ color: '#ede9e2' }}>VOLLARD </span>
              <span className="logo-text">BLACK</span>
            </div>
            <div style={{ marginTop: 12, fontSize: 10, letterSpacing: '0.40em', textTransform: 'uppercase', color: 'rgba(237,233,226,0.28)' }}>
              Fine Art Acquisitions Platform
            </div>
            <div style={{ width: 56, height: 1, margin: '22px auto 0', background: 'linear-gradient(90deg, transparent, rgba(182,139,46,0.55), transparent)' }} />
          </div>

          {/* Portal cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
            gap: 14,
          }}>
            {portals.map((p, i) => (
              <a
                key={p.id}
                href={p.href}
                className="hub-card"
                onMouseEnter={() => setHovered(p.id)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  background: hovered === p.id ? `rgba(255,255,255,0.04)` : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${hovered === p.id ? p.border : 'rgba(237,233,226,0.07)'}`,
                  borderRadius: 14,
                  padding: '26px 22px 22px',
                  boxShadow: hovered === p.id ? `0 24px 64px rgba(0,0,0,0.5), 0 0 0 1px ${p.border}` : '0 4px 20px rgba(0,0,0,0.25)',
                  animation: mounted ? `fadeUp 0.7s ${0.08 + i * 0.1}s ease both` : 'none',
                  opacity: mounted ? 1 : 0,
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* Top glow line */}
                <div style={{
                  position: 'absolute', top: 0, left: '15%', right: '15%', height: 1,
                  background: hovered === p.id ? `linear-gradient(90deg, transparent, ${p.accent}, transparent)` : 'transparent',
                  transition: 'all 0.35s ease',
                }} />

                {/* Role badge */}
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  fontSize: 9, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase',
                  color: p.accent, marginBottom: 22,
                  padding: '4px 10px', borderRadius: 4,
                  background: hovered === p.id ? p.glow : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${hovered === p.id ? p.border : 'rgba(255,255,255,0.06)'}`,
                  transition: 'all 0.3s',
                }}>
                  <span style={{ fontSize: 14 }}>{p.icon}</span>
                  {p.sub}
                </div>

                {/* Title */}
                <div style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: 28, fontWeight: 400,
                  color: '#ede9e2', letterSpacing: '0.02em',
                  marginBottom: 10, lineHeight: 1.15,
                }}>
                  {p.label}
                </div>

                {/* Description */}
                <div style={{ fontSize: 12, color: 'rgba(237,233,226,0.42)', lineHeight: 1.75, minHeight: 54 }}>
                  {p.desc}
                </div>

                {/* Enter link */}
                <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 7, fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: p.accent }}>
                  Enter
                  <svg className="hub-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </div>
              </a>
            ))}
          </div>

          {/* Footer */}
          <div style={{
            textAlign: 'center', marginTop: 52, fontSize: 11,
            color: 'rgba(237,233,226,0.18)', letterSpacing: '0.08em',
            animation: mounted ? 'fadeUp 0.7s 0.55s ease both' : 'none',
            opacity: mounted ? 1 : 0,
          }}>
            © {new Date().getFullYear()} Vollard Black (Pty) Ltd · Hermanus, Western Cape
            <span style={{ margin: '0 10px', opacity: 0.4 }}>·</span>
            <a href="/terms" style={{ color: 'rgba(182,139,46,0.45)', textDecoration: 'none' }}>Terms</a>
          </div>
        </div>
      </div>
    </>
  );
}
