'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import dynamic from 'next/dynamic';

// ── Supabase client created inline — no import chain that can corrupt ──
let _sb = null;
function getSb() {
  if (_sb) return _sb;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  _sb = createClient(url, key, { auth: { autoRefreshToken: true, persistSession: true } });
  return _sb;
}

// ── Lazy load the heavy admin panel only after login ──
const AdminPanel = dynamic(() => import('../VollardBlack.jsx'), {
  ssr: false,
  loading: () => <Loader />,
});

function Loader() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#0d0b08',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{
        fontFamily: '"Cormorant Garamond", Georgia, serif',
        fontSize: 28,
        fontWeight: 300,
        letterSpacing: 10,
        color: '#b68b2e',
        opacity: 0.6,
      }}>
        VOLLARD BLACK
      </div>
    </div>
  );
}

function LoginScreen({ onSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email || !password) { setError('Please enter your email and password.'); return; }
    setLoading(true);
    setError('');
    try {
      const sb = getSb();
      if (!sb) { setError('Database not configured. Check environment variables.'); setLoading(false); return; }
      const { data, error: err } = await sb.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (err) {
        setError('Incorrect email or password.');
        setLoading(false);
        return;
      }
      if (data?.session) {
        onSuccess(data.session);
      }
    } catch (ex) {
      setError('Sign in failed: ' + ex.message);
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0d0b08',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: '"DM Sans", sans-serif',
      padding: 20,
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500&family=DM+Sans:wght@400;500;600&display=swap');
        * { box-sizing: border-box; }
        .vb-input {
          width: 100%;
          padding: 14px 16px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(182,139,46,0.25);
          border-radius: 10px;
          color: #f5f0e8;
          font-family: 'DM Sans', sans-serif;
          font-size: 15px;
          outline: none;
          transition: border-color 0.2s;
        }
        .vb-input:focus { border-color: rgba(182,139,46,0.7); background: rgba(255,255,255,0.08); }
        .vb-input::placeholder { color: rgba(245,240,232,0.25); }
        .vb-btn {
          width: 100%;
          padding: 15px;
          background: linear-gradient(135deg, #b68b2e, #8a6a1e);
          border: none;
          border-radius: 10px;
          color: #f5f0e8;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          font-weight: 600;
          letter-spacing: 1px;
          text-transform: uppercase;
          cursor: pointer;
          transition: opacity 0.2s, transform 0.1s;
        }
        .vb-btn:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
        .vb-btn:active:not(:disabled) { transform: translateY(0); }
        .vb-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      <div style={{
        width: '100%',
        maxWidth: 400,
        animation: 'fadeIn 0.6s ease both',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{
            fontFamily: '"Cormorant Garamond", Georgia, serif',
            fontSize: 36,
            fontWeight: 300,
            letterSpacing: 12,
            color: '#f5f0e8',
            marginBottom: 6,
          }}>
            VOLLARD <span style={{ color: '#b68b2e' }}>BLACK</span>
          </div>
          <div style={{
            fontSize: 10,
            letterSpacing: 4,
            textTransform: 'uppercase',
            color: 'rgba(245,240,232,0.35)',
          }}>
            Fine Art Acquisitions · Admin
          </div>
          <div style={{
            width: 40,
            height: 1,
            background: 'linear-gradient(90deg, transparent, #b68b2e, transparent)',
            margin: '18px auto 0',
          }} />
        </div>

        {/* Card */}
        <div style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(182,139,46,0.20)',
          borderRadius: 16,
          padding: 36,
          backdropFilter: 'blur(10px)',
        }}>
          <div style={{
            fontFamily: '"Cormorant Garamond", Georgia, serif',
            fontSize: 22,
            fontWeight: 400,
            color: '#f5f0e8',
            marginBottom: 4,
          }}>
            Sign in
          </div>
          <div style={{ fontSize: 12, color: 'rgba(245,240,232,0.35)', marginBottom: 28 }}>
            Administrator access only
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <div style={{ marginBottom: 16 }}>
              <label style={{
                display: 'block',
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: 2,
                textTransform: 'uppercase',
                color: 'rgba(245,240,232,0.45)',
                marginBottom: 8,
              }}>
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
              <label style={{
                display: 'block',
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: 2,
                textTransform: 'uppercase',
                color: 'rgba(245,240,232,0.45)',
                marginBottom: 8,
              }}>
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
                  style={{
                    position: 'absolute',
                    right: 14,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'rgba(245,240,232,0.35)',
                    cursor: 'pointer',
                    fontSize: 12,
                    fontFamily: '"DM Sans", sans-serif',
                  }}
                >
                  {showPw ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            {error && (
              <div style={{
                padding: '12px 14px',
                background: 'rgba(196,92,74,0.12)',
                border: '1px solid rgba(196,92,74,0.3)',
                borderRadius: 8,
                fontSize: 13,
                color: '#e07060',
                marginBottom: 20,
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              className="vb-btn"
              disabled={loading}
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        </div>

        <div style={{
          textAlign: 'center',
          marginTop: 24,
          fontSize: 11,
          color: 'rgba(245,240,232,0.18)',
          letterSpacing: 1,
        }}>
          Vollard Black (Pty) Ltd · Hermanus, South Africa
        </div>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const [status, setStatus] = useState('loading'); // loading | login | dashboard
  const [session, setSession] = useState(null);

  useEffect(() => {
    const sb = getSb();
    if (!sb) { setStatus('login'); return; }

    // Check existing session
    sb.auth.getSession().then(({ data }) => {
      if (data?.session) {
        setSession(data.session);
        setStatus('dashboard');
      } else {
        setStatus('login');
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = sb.auth.onAuthStateChange((_, s) => {
      if (s) {
        setSession(s);
        setStatus('dashboard');
      } else {
        setSession(null);
        setStatus('login');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (status === 'loading') return <Loader />;
  if (status === 'login') return <LoginScreen onSuccess={s => { setSession(s); setStatus('dashboard'); }} />;
  return <AdminPanel />;
}
