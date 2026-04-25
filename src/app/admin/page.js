'use client';
import dynamic from 'next/dynamic';

const VollardBlack = dynamic(() => import('../VollardBlack.jsx'), {
  ssr: false,
  loading: () => (
    <div style={{
      minHeight: '100vh',
      background: '#f5f3ef',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{
        fontFamily: 'Georgia, serif',
        fontSize: 24,
        letterSpacing: 8,
        color: '#b68b2e',
        opacity: 0.6
      }}>
        VOLLARD BLACK
      </div>
    </div>
  ),
});

export default function AdminPage() {
  return <VollardBlack />;
}
