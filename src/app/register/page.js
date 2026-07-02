import RegisterForm from './RegisterForm';

export const metadata = {
  title: 'Register — The Winelands Art Gallery',
  description: 'Register as a backer and unlock R1,000 in bid credit.',
};

export default function RegisterPage() {
  return (
    <main
      style={{
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 20px',
      }}
    >
      <div style={{ width: '100%' }}>
        <div className="serif" style={{ textAlign: 'center', marginBottom: 28, color: 'var(--gold)', fontSize: 28 }}>
          W
          <div className="eyebrow" style={{ marginTop: 6 }}>Winelands Art Gallery</div>
        </div>
        <RegisterForm />
      </div>
    </main>
  );
}
