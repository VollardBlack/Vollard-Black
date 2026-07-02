import { supabase } from '@/lib/supabaseClient';
import ArtworkCard from '@/components/ArtworkCard';

export const revalidate = 0;

export default async function AuctionsPage() {
  const { data: auctions, error } = await supabase
    .from('auctions')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <main style={{ maxWidth: 1100, margin: '0 auto', padding: '48px 20px 80px' }}>
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <div className="serif" style={{ fontSize: 26, color: 'var(--gold)' }}>W</div>
        <p className="eyebrow" style={{ margin: '8px 0 14px' }}>Winelands Art Gallery</p>
        <h1 className="serif" style={{ fontSize: 32, fontWeight: 500 }}>Live Auctions</h1>
      </div>

      {error && (
        <p style={{ color: 'var(--error)', textAlign: 'center' }}>
          Couldn't load auctions right now. Please refresh.
        </p>
      )}

      {!error && (!auctions || auctions.length === 0) && (
        <p style={{ color: 'var(--muted)', textAlign: 'center' }}>
          No auctions are live yet — check back soon.
        </p>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 24 }}>
        {auctions?.map((auction) => (
          <ArtworkCard key={auction.id} auction={auction} />
        ))}
      </div>
    </main>
  );
}
