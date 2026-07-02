import Link from 'next/link';

export default function Home() {
  return (
    <main
      style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '48px 20px',
        gap: 24,
      }}
    >
      <div>
        <div className="serif" style={{ fontSize: 34, color: 'var(--gold)', lineHeight: 1 }}>W</div>
        <div className="eyebrow" style={{ marginTop: 10 }}>Winelands Art Gallery</div>
      </div>

      <h1 className="serif" style={{ fontSize: 40, fontWeight: 500, maxWidth: 560, lineHeight: 1.2 }}>
        Back South African artists. Bid live. Share in the upside.
      </h1>

      <p style={{ color: 'var(--muted)', maxWidth: 440, fontSize: 15, lineHeight: 1.6 }}>
        Register as a backer for R1,000 in bid credit, then bid live on
        original works from the gallery floor.
      </p>

      <div style={{ display: 'flex', gap: 14, marginTop: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
        <Link
          href="/register"
          style={{
            background: 'var(--gold)',
            color: '#14110b',
            padding: '14px 28px',
            fontSize: 13,
            fontWeight: 600,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
          }}
        >
          Register as a backer
        </Link>
        <Link
          href="/auctions"
          style={{
            border: '1px solid var(--line)',
            color: 'var(--text)',
            padding: '14px 28px',
            fontSize: 13,
            fontWeight: 600,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
          }}
        >
          View live auctions
        </Link>
      </div>
    </main>
  );
}
