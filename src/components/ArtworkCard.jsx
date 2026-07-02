'use client';

import Link from 'next/link';
import CountdownTimer from './CountdownTimer';

const STATUS_LABEL = { Live: 'Live', Draft: 'Upcoming', Closed: 'Closed' };

export default function ArtworkCard({ auction }) {
  return (
    <Link href={`/auctions/${auction.id}`} className="art-card">
      <div className="image-wrap">
        {auction.image_url ? (
          <img src={auction.image_url} alt={auction.title} />
        ) : (
          <div className="placeholder" />
        )}
        <span className={`status-badge status-${auction.status}`}>
          {STATUS_LABEL[auction.status] || auction.status}
        </span>
      </div>
      <div className="info">
        <p className="artist">{auction.artist}</p>
        <p className="title">{auction.title}</p>
        <div className="meta">
          <span className="price">R{Number(auction.current_bid || auction.reserve_price || 0).toLocaleString('en-ZA')}</span>
          {auction.status === 'Live' && auction.end_time && (
            <span className="countdown">
              <CountdownTimer endsAt={auction.end_time} />
            </span>
          )}
        </div>
      </div>

      <style jsx>{`
        .art-card { display: block; background: var(--surface); border: 1px solid var(--line); overflow: hidden; transition: border-color 0.2s ease; }
        .art-card:hover { border-color: var(--gold); }
        .image-wrap { position: relative; aspect-ratio: 4 / 3; background: #0a0908; }
        .image-wrap img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .placeholder { width: 100%; height: 100%; background: linear-gradient(135deg, #1c1811, #0a0908); }
        .status-badge { position: absolute; top: 12px; left: 12px; font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase; padding: 5px 10px; background: rgba(14, 12, 9, 0.85); border: 1px solid var(--line); }
        .status-Live { color: var(--live); border-color: var(--live); }
        .status-Draft { color: var(--gold-bright); }
        .status-Closed { color: var(--muted); }
        .info { padding: 18px 18px 20px; }
        .artist { font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--muted); margin-bottom: 4px; }
        .title { font-family: 'Fraunces', serif; font-size: 18px; color: var(--text); margin-bottom: 14px; }
        .meta { display: flex; justify-content: space-between; align-items: center; }
        .price { font-family: 'DM Mono', monospace; font-size: 15px; color: var(--gold-bright); }
        .countdown { font-size: 13px; color: var(--muted); }
      `}</style>
    </Link>
  );
}
