'use client';

import { useEffect, useState } from 'react';

function getRemaining(endsAt) {
  const diff = new Date(endsAt).getTime() - Date.now();
  if (diff <= 0) return null;
  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  return { hours, minutes, seconds };
}

export default function CountdownTimer({ endsAt, onComplete }) {
  const [remaining, setRemaining] = useState(() => getRemaining(endsAt));

  useEffect(() => {
    const interval = setInterval(() => {
      const next = getRemaining(endsAt);
      setRemaining(next);
      if (!next) {
        clearInterval(interval);
        onComplete?.();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [endsAt, onComplete]);

  if (!remaining) {
    return <span style={{ color: 'var(--error)' }}>Auction closed</span>;
  }

  const pad = (n) => String(n).padStart(2, '0');

  return (
    <span style={{ fontFamily: "'DM Mono', monospace", fontVariantNumeric: 'tabular-nums' }}>
      {remaining.hours > 0 && `${pad(remaining.hours)}:`}
      {pad(remaining.minutes)}:{pad(remaining.seconds)}
    </span>
  );
}
