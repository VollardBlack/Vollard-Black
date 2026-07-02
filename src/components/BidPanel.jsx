'use client';

import { useState, useEffect } from 'react';
import CountdownTimer from './CountdownTimer';

function normalizeWhatsapp(raw) {
  const digits = raw.replace(/[^\d+]/g, '');
  if (digits.startsWith('+27')) return digits;
  if (digits.startsWith('0')) return '+27' + digits.slice(1);
  if (digits.startsWith('27')) return '+' + digits;
  return digits;
}

const ERROR_MESSAGES = {
  not_registered: "We couldn't find that WhatsApp number. Register as a backer first.",
  auction_not_found: 'This auction could not be found.',
  auction_not_live: 'This auction is not currently live.',
  bid_too_low: 'Someone just bid higher — try the updated minimum.',
  insufficient_credit: "That's more than your available bid credit.",
  already_highest_bidder: "You're already the highest bidder.",
  server_error: 'Something went wrong. Please try again.',
};

export default function BidPanel({ auction }) {
  const [currentBid, setCurrentBid] = useState(Number(auction.current_bid || auction.reserve_price || 0));
  const [whatsapp, setWhatsapp] = useState('');
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');
  const [closed, setClosed] = useState(auction.status !== 'Live');

  const increment = Number(auction.increment_value || 100);
  const minBid = currentBid + increment;

  useEffect(() => {
    try {
      const stored = window.localStorage?.getItem('winelands_whatsapp');
      if (stored) setWhatsapp(stored);
    } catch {}
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus('submitting');
    setMessage('');

    const wa = normalizeWhatsapp(whatsapp);
    const res = await fetch('/api/place-bid', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ auctionId: auction.id, whatsapp: wa, amount: Number(amount) }),
    });

    let data;
    try {
      data = await res.json();
    } catch {
      setStatus('error');
      setMessage(ERROR_MESSAGES.server_error);
      return;
    }

    if (data.ok) {
      setStatus('success');
      setCurrentBid(Number(data.new_price));
      setAmount('');
      setMessage(`You're the highest bidder at R${Number(data.new_price).toLocaleString('en-ZA')}.`);
      try { window.localStorage?.setItem('winelands_whatsapp', whatsapp); } catch {}
    } else {
      setStatus('error');
      setMessage(ERROR_MESSAGES[data.error] || ERROR_MESSAGES.server_error);
      if (data.minimum_bid) setAmount(String(data.minimum_bid));
    }
  }

  return (
    <div className="bid-panel">
      <div className="price-row">
        <div>
          <p className="label">Current bid</p>
          <p className="price">R{currentBid.toLocaleString('en-ZA')}</p>
        </div>
        <div className="timer">
          <p className="label">{closed ? 'Status' : 'Closes in'}</p>
          <p className="timer-value">
            {auction.end_time ? (
              <CountdownTimer endsAt={auction.end_time} onComplete={() => setClosed(true)} />
            ) : (
              <span style={{ color: 'var(--muted)' }}>—</span>
            )}
          </p>
        </div>
      </div>

      {closed ? (
        <p className="closed-note">
          {auction.status === 'Draft' ? 'This auction has not started yet.' : 'This auction has closed.'}
        </p>
      ) : (
        <form onSubmit={handleSubmit}>
          <label className="field">
            <span className="field-label">Your WhatsApp number</span>
            <input type="tel" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="082 123 4567" required />
          </label>

          <label className="field">
            <span className="field-label">Your bid (min R{minBid.toLocaleString('en-ZA')})</span>
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={String(minBid)} min={minBid} step={increment} required />
          </label>

          {message && <p className={status === 'success' ? 'msg-success' : 'msg-error'}>{message}</p>}

          <button type="submit" className="bid-submit" disabled={status === 'submitting'}>
            {status === 'submitting' ? 'Placing bid…' : 'Place bid'}
          </button>
        </form>
      )}

      <style jsx>{`
        .bid-panel { background: var(--surface); border: 1px solid var(--line); border-top: 2px solid var(--gold); padding: 28px 26px; }
        .price-row { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 24px; }
        .label { font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--muted); margin-bottom: 6px; }
        .price { font-family: 'DM Mono', monospace; font-size: 30px; color: var(--gold-bright); }
        .timer { text-align: right; }
        .timer-value { font-size: 18px; }
        .field { display: block; margin-bottom: 18px; }
        .field-label { display: block; font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--muted); margin-bottom: 8px; }
        .field input { width: 100%; background: transparent; border: none; border-bottom: 1px solid var(--line); color: var(--text); font-size: 15px; padding: 6px 0 10px; outline: none; }
        .field input:focus { border-bottom-color: var(--gold); }
        .bid-submit { width: 100%; background: var(--gold); color: #14110b; border: none; padding: 15px; font-size: 13px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; cursor: pointer; margin-top: 4px; }
        .bid-submit:hover:not(:disabled) { background: var(--gold-bright); }
        .bid-submit:disabled { opacity: 0.6; cursor: default; }
        .msg-error { font-size: 13px; color: var(--error); margin-bottom: 14px; line-height: 1.5; }
        .msg-success { font-size: 13px; color: var(--live); margin-bottom: 14px; line-height: 1.5; }
        .closed-note { font-size: 14px; color: var(--muted); }
      `}</style>
    </div>
  );
}
