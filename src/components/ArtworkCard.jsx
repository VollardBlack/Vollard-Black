'use client';

import Link from 'next/link';
import CountdownTimer from './CountdownTimer';

export default function ArtworkCard({ artwork }) {
  return (
    <Link href={`/auctions/${artwork.id}`} className="art-card">
      <div className="image-wrap">
        {artwork.image_url ? (
          <img src={artwork.image_url} alt={artwork.title} />
        ) : (
          <div className="placeholder" />
        )}
        <span className={`status-badge status-${artwork.status}`}>
          {artwork.status === 'live' ? 'Live' : artwork.status === 'upcoming' ? 'Upcoming' : 'Closed'}
        </span>
      </div>
      <div className="info">
        <p className="artist">{artwork.artist_name}</p>
        <p className="title">{artwork.title}</p>
        <div className="meta">
          <span className="price">R{Number(artwork.current_price).toLocaleString('en-ZA')}</span>
          {artwork.status === 'live' && (
            <span className="countdown">
              <CountdownTimer endsAt={artwork.ends_at} />
            </span>
          )}
        </div>
      </div>

      <style jsx>{`
        .art-card {
          display: block;
          background: var(--surface);
          border: 1px solid var(--line);
          overflow: hidden;
          transition: border-color 0.2s ease;
        }
        .art-card:hover {
          border-color: var(--gold);
        }
        .image-wrap {
          position: relative;
          aspect-ratio: 4 / 3;
          background: #0a0908;
        }
        .image-wrap img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .placeholder {
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, #1c1811, #0a0908);
        }
        .status-badge {
          position: absolute;
          top: 12px;
          left: 12px;
          font-size: 10px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          padding: 5px 10px;
          background: rgba(14, 12, 9, 0.85);
          border: 1px solid var(--line);
        }
        .status-live {
          color: var(--live);
          border-color: var(--live);
        }
        .status-upcoming {
          color: var(--gold-bright);
        }
        .status-closed {
          color: var(--muted);
        }
        .info {
          padding: 18px 18px 20px;
        }
        .artist {
          font-size: 11px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--muted);
          margin-bottom: 4px;
        }
        .title {
          font-family: 'Fraunces', serif;
          font-size: 18px;
          color: var(--text);
          margin-bottom: 14px;
        }
        .meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .price {
          font-family: 'DM Mono', monospace;
          font-size: 15px;
          color: var(--gold-bright);
        }
        .countdown {
          font-size: 13px;
          color: var(--muted);
        }
      `}</style>
    </Link>
  );
}
