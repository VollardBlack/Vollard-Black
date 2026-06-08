'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import dynamic from 'next/dynamic';

// ── Supabase ──────────────────────────────────────────────────
let _sb = null;
function getSb() {
  if (_sb) return _sb;
  const url  = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key  = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  _sb = createClient(url, key, { auth: { autoRefreshToken: true, persistSession: true } });
  return _sb;
}

// ── Admin email whitelist — add any extra admins here ─────────
const ADMIN_EMAILS = ['concierge@vollardblack.com'];

// ── Lazy-load the heavy admin panel only after login ──────────
const AdminPanel = dynamic(() => import('../VollardBlack.jsx'), {
  ssr: false,
  loading: () => <Loader />,
});

function Loader() {
  return (
    <div style={{ minHeight: '100vh', background: '#f5f3ef', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: 28, fontWeight: 300, letterSpacing: 10, color: '#b68b2e', opacity: 0.6 }}>
        VOLLARD BLACK
      </div>
    </div>
  );
}

function LoginScreen({ onSuccess }) {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email || !password) { setError('Please enter your email and password.'); return; }

    // ── Check whitelist before even hitting Supabase ──
    if (!ADMIN_EMAILS.includes(email.trim().toLowerCase())) {
      setError('Access denied. This portal is for administrators only.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const sb = getSb();
      if (!sb) { setError('Database not configured. Check environment variables.'); setLoading(false); return; }

      const { data, error: err } = await sb.auth.signInWithPassword({
        email:    email.trim().toLowerCase(),
        password: password,
      });

      if (err) {
        setError('Incorrect email or password. Please try again.');
        setLoading(false);
        return;
      }

      if (data?.session) onSuccess(data.session);
    } catch (ex) {
      setError('Sign in failed: ' + ex.message);
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f3ef', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: '"DM Sans", sans-serif', padding: 20 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500&family=DM+Sans:wght@400;500;600&display=swap');
        * { box-sizing: border-box; }
        .vb-input { width:100%; padding:13px 16px; background:#fff; border:1px solid rgba(182,139,46,0.25); border-radius:10px; color:#1a1714; font-family:"DM Sans",sans-serif; font-size:14px; outline:none; transition:border-color 0.2s; }
        .vb-input:focus { border-color:rgba(182,139,46,0.7); }
        .vb-input::placeholder { color:rgba(26,23,20,0.3); }
        .vb-btn { width:100%; padding:14px; background:linear-gradient(135deg,#b68b2e,#8a6a1e); border:none; border-radius:10px; color:#fff; font-family:"DM Sans",sans-serif; font-size:13px; font-weight:600; letter-spacing:1px; text-transform:uppercase; cursor:pointer; transition:opacity 0.2s; }
        .vb-btn:hover:not(:disabled) { opacity:0.88; }
        .vb-btn:disabled { opacity:0.5; cursor:not-allowed; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
      `}</style>

      <div style={{ width: '100%', maxWidth: 420, animation: 'fadeUp 0.5s ease both' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: 38, fontWeight: 300, letterSpacing: 10, color: '#1a1714' }}>
            VOLLARD <span style={{ color: '#b68b2e' }}>BLACK</span>
          </div>
          <div style={{ fontSize: 10, letterSpacing: 4, textTransform: 'uppercase', color: '#8a8070', marginTop: 6 }}>
            Fine Art Acquisitions · Admin
          </div>
          <div style={{ width: 40, height: 1, background: 'rgba(182,139,46,0.4)', margin: '18px auto 0' }} />
        </div>

        {/* Card */}
        <div style={{ background: '#ffffff', border: '1px solid rgba(182,139,46,0.20)', borderRadius: 16, padding: 36, boxShadow: '0 8px 32px rgba(0,0,0,0.06)' }}>
          <div style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: 22, color: '#1a1714', marginBottom: 4 }}>Sign in</div>
          <div style={{ fontSize: 12, color: '#8a8070', marginBottom: 28 }}>Administrator access only</div>

          <form onSubmit={handleSubmit} noValidate>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 10, fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase', color: '#6b635a', marginBottom: 8 }}>
                Email
              </label>
              <input
                type="email"
                className="vb-input"
                value={email}
                onChange={e => { setEmail(e.target.value); setError(''); }}
                placeholder="concierge@vollardblack.com"
                autoComplete="email"
                autoFocus
              />
            </div>

            <div style={{ marginBottom: 28 }}>
              <label style={{ display: 'block', fontSize: 10, fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase', color: '#6b635a', marginBottom: 8 }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPw ? 'text' : 'password'}
                  className="vb-input"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(''); }}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  style={{ paddingRight: 56 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(p => !p)}
                  style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#8a8070', cursor: 'pointer', fontSize: 12, fontFamily: '"DM Sans", sans-serif' }}
                >
                  {showPw ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            {error && (
              <div style={{ padding: '11px 14px', background: 'rgba(196,92,74,0.08)', border: '1px solid rgba(196,92,74,0.25)', borderRadius: 8, fontSize: 13, color: '#c45c4a', marginBottom: 20 }}>
                {error}
              </div>
            )}

            <button type="submit" className="vb-btn" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        </div>

        <div style={{ textAlign: 'center', marginTop: 24, fontSize: 11, color: '#a09890' }}>
          Vollard Black (Pty) Ltd · Hermanus, South Africa
        </div>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const [status,  setStatus]  = useState('loading'); // loading | login | dashboard
  const [session, setSession] = useState(null);

  useEffect(() => {
    const sb = getSb();
    if (!sb) { setStatus('login'); return; }

    // Check for existing valid session
    sb.auth.getSession().then(({ data }) => {
      const s = data?.session;
      if (s && ADMIN_EMAILS.includes(s.user?.email?.toLowerCase())) {
        setSession(s);
        setStatus('dashboard');
      } else {
        // Sign out any non-admin session silently
        if (s) sb.auth.signOut();
        setStatus('login');
      }
    });

    // Listen for auth changes (e.g. magic link callback)
    const { data: { subscription } } = sb.auth.onAuthStateChange((_, s) => {
      if (s && ADMIN_EMAILS.includes(s.user?.email?.toLowerCase())) {
        setSession(s);
        setStatus('dashboard');
      } else {
        setSession(null);
        setStatus('login');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (status === 'loading')   return <Loader />;
  if (status === 'login')     return <LoginScreen onSuccess={s => { setSession(s); setStatus('dashboard'); }} />;
  return <AdminPanel />;
}
