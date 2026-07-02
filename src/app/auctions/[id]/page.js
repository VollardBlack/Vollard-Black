import { notFound } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import BidPanel from '@/components/BidPanel';

export const revalidate = 0;

export default async function ArtworkPage({ params }) {
  const { id } = params;

  const { data: artwork } = await supabase.from('artworks').select('*').eq('id', id).single();

  if (!artwork) notFound();

  const { data: bids } = await supabase
    .from('bids')
    .select('amount, created_at, backers(first_name)')
    .eq('artwork_id', id)
    .order('created_at', { ascending: false })
    .limit(10);

  return (
    <main style={{ maxWidth: 1000, margin: '0 auto', padding: '48px 20px 80px' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.1fr) minmax(280px, 0.9fr)',
          gap: 40,
        }}
        className="artwork-grid"
      >
        <div>
          <div style={{ aspectRatio: '4 / 3', background: '#0a0908', marginBottom: 24 }}>
            {artwork.image_url ? (
              <img
                src={artwork.image_url}
                alt={artwork.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            ) : null}
          </div>
          <p className="eyebrow" style={{ marginBottom: 8 }}>{artwork.artist_name}</p>
          <h1 className="serif" style={{ fontSize: 30, fontWeight: 500, marginBottom: 16 }}>
            {artwork.title}
          </h1>
          {artwork.description && (
            <p style={{ color: 'var(--muted)', lineHeight: 1.6, fontSize: 15 }}>
              {artwork.description}
            </p>
          )}

          {bids && bids.length > 0 && (
            <div style={{ marginTop: 36 }}>
              <p className="eyebrow" style={{ marginBottom: 14 }}>Recent bids</p>
              <ul style={{ listStyle: 'none' }}>
                {bids.map((bid, i) => (
                  <li
                    key={i}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '10px 0',
                      borderBottom: '1px solid var(--line)',
                      fontSize: 14,
                    }}
                  >
                    <span style={{ color: 'var(--muted)' }}>
                      {bid.backers?.first_name || 'A backer'}
                    </span>
                    <span style={{ fontFamily: "'DM Mono', monospace", color: 'var(--gold-bright)' }}>
                      R{Number(bid.amount).toLocaleString('en-ZA')}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div>
          <BidPanel artwork={artwork} isLive={artwork.status === 'live'} />
        </div>
      </div>

      <style>{`
        @media (max-width: 720px) {
          .artwork-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </main>
  );
}
