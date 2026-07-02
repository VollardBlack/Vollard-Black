'use client';

import { useState, useEffect, useCallback } from 'react';

export default function AdminPage() {
  const [passcode, setPasscode] = useState('');
  const [authed, setAuthed] = useState(false);
  const [artworks, setArtworks] = useState([]);
  const [loadError, setLoadError] = useState('');
  const [form, setForm] = useState({
    title: '',
    artistName: '',
    description: '',
    imageUrl: '',
    startingPrice: '',
    bidIncrement: '100',
    endsAt: '',
  });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  const loadArtworks = useCallback(async (key) => {
    setLoadError('');
    const res = await fetch('/api/admin/artworks', { headers: { 'x-admin-key': key } });
    const data = await res.json();
    if (!data.ok) {
      setLoadError('Could not load artworks. Check your passcode.');
      return;
    }
    setArtworks(data.artworks);
  }, []);

  useEffect(() => {
    if (authed) loadArtworks(passcode);
  }, [authed, passcode, loadArtworks]);

  function handleLogin(e) {
    e.preventDefault();
    setAuthed(true);
  }

  async function handleCreate(e) {
    e.preventDefault();
    setCreating(true);
    setCreateError('');

    const res = await fetch('/api/admin/artworks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-key': passcode },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setCreating(false);

    if (!data.ok) {
      setCreateError('Could not create artwork. Check the fields and try again.');
      return;
    }

    setForm({
      title: '', artistName: '', description: '', imageUrl: '',
      startingPrice: '', bidIncrement: '100', endsAt: '',
    });
    loadArtworks(passcode);
  }

  async function updateStatus(id, status) {
    await fetch('/api/admin/artworks', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-admin-key': passcode },
      body: JSON.stringify({ id, status }),
    });
    loadArtworks(passcode);
  }

  async function closeAndSettle(id) {
    await fetch('/api/admin/close-auction', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-key': passcode },
      body: JSON.stringify({ artworkId: id }),
    });
    loadArtworks(passcode);
  }

  if (!authed) {
    return (
      <main style={styles.centerMain}>
        <form onSubmit={handleLogin} style={styles.card}>
          <p className="eyebrow" style={{ marginBottom: 10 }}>gallery admin</p>
          <h1 className="serif" style={{ fontSize: 24, marginBottom: 20 }}>Enter passcode</h1>
          <input
            type="password"
            value={passcode}
            onChange={(e) => setPasscode(e.target.value)}
            style={styles.input}
            placeholder="Admin passcode"
            required
          />
          <button type="submit" style={styles.button}>Continue</button>
        </form>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 900, margin: '0 auto', padding: '48px 20px 80px' }}>
      <h1 className="serif" style={{ fontSize: 28, marginBottom: 32 }}>Gallery Admin</h1>

      <section style={styles.section}>
        <h2 className="serif" style={{ fontSize: 20, marginBottom: 18 }}>Add a new auction</h2>
        <form onSubmit={handleCreate} style={styles.grid}>
          <input style={styles.input} placeholder="Title" required
            value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <input style={styles.input} placeholder="Artist name" required
            value={form.artistName} onChange={(e) => setForm({ ...form, artistName: e.target.value })} />
          <input style={{ ...styles.input, gridColumn: '1 / -1' }} placeholder="Description"
            value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <input style={{ ...styles.input, gridColumn: '1 / -1' }} placeholder="Image URL"
            value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} />
          <input style={styles.input} placeholder="Starting price (R)" type="number" required
            value={form.startingPrice} onChange={(e) => setForm({ ...form, startingPrice: e.target.value })} />
          <input style={styles.input} placeholder="Bid increment (R)" type="number"
            value={form.bidIncrement} onChange={(e) => setForm({ ...form, bidIncrement: e.target.value })} />
          <label style={{ gridColumn: '1 / -1' }}>
            <span style={styles.label}>Ends at</span>
            <input style={styles.input} type="datetime-local" required
              value={form.endsAt} onChange={(e) => setForm({ ...form, endsAt: e.target.value })} />
          </label>
          {createError && <p style={{ color: 'var(--error)', gridColumn: '1 / -1' }}>{createError}</p>}
          <button type="submit" style={{ ...styles.button, gridColumn: '1 / -1' }} disabled={creating}>
            {creating ? 'Creating…' : 'Create auction (starts as Upcoming)'}
          </button>
        </form>
      </section>

      <section style={styles.section}>
        <h2 className="serif" style={{ fontSize: 20, marginBottom: 18 }}>Manage auctions</h2>
        {loadError && <p style={{ color: 'var(--error)' }}>{loadError}</p>}
        {artworks.map((a) => (
          <div key={a.id} style={styles.row}>
            <div>
              <p style={{ fontWeight: 600 }}>{a.title}</p>
              <p style={{ fontSize: 13, color: 'var(--muted)' }}>
                {a.artist_name} · R{Number(a.current_price).toLocaleString('en-ZA')} · {a.status}
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {a.status === 'upcoming' && (
                <button style={styles.smallButton} onClick={() => updateStatus(a.id, 'live')}>Go live</button>
              )}
              {a.status === 'live' && (
                <button style={styles.smallButton} onClick={() => closeAndSettle(a.id)}>Close & settle</button>
              )}
            </div>
          </div>
        ))}
        {artworks.length === 0 && !loadError && (
          <p style={{ color: 'var(--muted)', fontSize: 14 }}>No auctions yet.</p>
        )}
      </section>
    </main>
  );
}

const styles = {
  centerMain: {
    minHeight: '100dvh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    background: 'var(--surface)',
    border: '1px solid var(--line)',
    borderTop: '2px solid var(--gold)',
    padding: '32px 28px',
  },
  section: {
    background: 'var(--surface)',
    border: '1px solid var(--line)',
    padding: '28px 26px',
    marginBottom: 28,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 16,
  },
  input: {
    width: '100%',
    background: 'transparent',
    border: '1px solid var(--line)',
    color: 'var(--text)',
    fontSize: 14,
    padding: '10px 12px',
    outline: 'none',
  },
  label: {
    display: 'block',
    fontSize: 11,
    color: 'var(--muted)',
    marginBottom: 6,
  },
  button: {
    background: 'var(--gold)',
    color: '#14110b',
    border: 'none',
    padding: '13px',
    fontSize: 13,
    fontWeight: 600,
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
    cursor: 'pointer',
  },
  smallButton: {
    background: 'transparent',
    border: '1px solid var(--gold)',
    color: 'var(--gold-bright)',
    padding: '8px 14px',
    fontSize: 12,
    cursor: 'pointer',
  },
  row: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '14px 0',
    borderBottom: '1px solid var(--line)',
  },
};
