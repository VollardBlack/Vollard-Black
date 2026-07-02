'use client';

import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

const BID_CREDIT = 1000;

function normalizeWhatsapp(raw) {
  const digits = raw.replace(/[^\d+]/g, '');
  if (digits.startsWith('+27')) return digits;
  if (digits.startsWith('0')) return '+27' + digits.slice(1);
  if (digits.startsWith('27')) return '+' + digits;
  return digits;
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidWhatsapp(normalized) {
  return /^\+27\d{9}$/.test(normalized);
}

export default function RegisterForm() {
  const [values, setValues] = useState({ firstName: '', surname: '', whatsapp: '', email: '' });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle');

  function update(field, value) {
    setValues((v) => ({ ...v, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
  }

  function validate() {
    const next = {};
    if (!values.firstName.trim()) next.firstName = 'Enter your first name';
    if (!values.surname.trim()) next.surname = 'Enter your surname';
    const wa = normalizeWhatsapp(values.whatsapp);
    if (!isValidWhatsapp(wa)) next.whatsapp = 'Enter a valid SA WhatsApp number';
    if (!isValidEmail(values.email)) next.email = 'Enter a valid email address';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;

    setStatus('submitting');
    const whatsapp = normalizeWhatsapp(values.whatsapp);
    const { error } = await supabase.from('backers').insert({
      first_name: values.firstName.trim(),
      surname: values.surname.trim(),
      whatsapp,
      email: values.email.trim().toLowerCase(),
      bid_credit: BID_CREDIT,
    });

    if (!error) {
      try {
        window.localStorage?.setItem('winelands_whatsapp', whatsapp);
      } catch {}
      setStatus('success');
      return;
    }

    setStatus(error.code === '23505' ? 'duplicate' : 'error');
  }

  if (status === 'success') {
    return (
      <div className="card seal-card">
        <div className="seal">
          <svg viewBox="0 0 120 120" width="88" height="88" aria-hidden="true">
            <circle cx="60" cy="60" r="58" fill="none" stroke="var(--gold)" strokeWidth="2" />
            <circle cx="60" cy="60" r="50" fill="none" stroke="var(--gold)" strokeWidth="1" opacity="0.5" />
            <text x="60" y="72" textAnchor="middle" fontFamily="Fraunces, serif" fontSize="48" fill="var(--gold-bright)">W</text>
          </svg>
        </div>
        <p className="eyebrow">registration confirmed</p>
        <h2 className="serif">Welcome, {values.firstName}.</h2>
        <p className="credit-amount">R{BID_CREDIT.toLocaleString('en-ZA')}</p>
        <p className="credit-label">in bid credit — applied to your account</p>
        <Link href="/auctions" className="cta-link">View live auctions →</Link>
        <style jsx>{styles}</style>
      </div>
    );
  }

  if (status === 'duplicate') {
    return (
      <div className="card">
        <p className="eyebrow">already registered</p>
        <h2 className="serif">You're already a backer.</h2>
        <p className="fine-print">
          This email or WhatsApp number already has bid credit on file.
        </p>
        <Link href="/auctions" className="cta-link">View live auctions →</Link>
        <style jsx>{styles}</style>
      </div>
    );
  }

  return (
    <form className="card" onSubmit={handleSubmit} noValidate>
      <p className="eyebrow">become a backer</p>
      <h2 className="serif">Register in a minute.</h2>
      <p className="subhead">
        Add your details to unlock R{BID_CREDIT.toLocaleString('en-ZA')} in bid credit
        toward your first work.
      </p>

      <div className="row">
        <Field label="First name" value={values.firstName} onChange={(v) => update('firstName', v)} error={errors.firstName} autoComplete="given-name" />
        <Field label="Surname" value={values.surname} onChange={(v) => update('surname', v)} error={errors.surname} autoComplete="family-name" />
      </div>

      <Field label="WhatsApp number" value={values.whatsapp} onChange={(v) => update('whatsapp', v)} error={errors.whatsapp} placeholder="082 123 4567" type="tel" autoComplete="tel" />
      <Field label="Email address" value={values.email} onChange={(v) => update('email', v)} error={errors.email} placeholder="you@example.com" type="email" autoComplete="email" />

      {status === 'error' && (
        <p className="form-error">Something went wrong on our side. Please try again.</p>
      )}

      <button type="submit" className="submit" disabled={status === 'submitting'}>
        {status === 'submitting' ? 'Registering…' : `Claim R${BID_CREDIT.toLocaleString('en-ZA')} credit`}
      </button>

      <p className="terms">
        By registering you agree to be contacted by The Winelands Art Gallery about
        this and future auctions.
      </p>

      <style jsx>{styles}</style>
    </form>
  );
}

function Field({ label, value, onChange, error, type = 'text', placeholder, autoComplete }) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
        className={error ? 'invalid' : ''}
      />
      {error && <span className="field-error">{error}</span>}
      <style jsx>{styles}</style>
    </label>
  );
}

const styles = `
  .card {
    width: 100%;
    max-width: 420px;
    margin: 0 auto;
    background: var(--surface);
    border: 1px solid var(--line);
    border-top: 2px solid var(--gold);
    padding: 40px 32px 32px;
    color: var(--text);
    box-shadow: 0 30px 60px -20px rgba(0, 0, 0, 0.6);
  }
  .eyebrow { font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase; color: var(--gold-bright); margin: 0 0 10px; }
  .serif { font-family: 'Fraunces', serif; font-weight: 500; font-size: 26px; line-height: 1.25; margin: 0 0 10px; }
  .subhead { font-size: 14px; line-height: 1.5; color: var(--muted); margin: 0 0 28px; }
  .row { display: flex; gap: 16px; }
  .field { display: block; margin-bottom: 20px; flex: 1; }
  .field-label { display: block; font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--muted); margin-bottom: 8px; }
  .field input {
    width: 100%; background: transparent; border: none; border-bottom: 1px solid var(--line);
    color: var(--text); font-size: 15px; padding: 6px 0 10px; outline: none; transition: border-color 0.2s ease;
  }
  .field input::placeholder { color: rgba(168, 154, 131, 0.5); }
  .field input:focus { border-bottom-color: var(--gold); }
  .field input.invalid { border-bottom-color: var(--error); }
  .field-error { display: block; font-size: 12px; color: var(--error); margin-top: 6px; }
  .form-error { font-size: 13px; color: var(--error); margin: 0 0 16px; }
  .submit {
    width: 100%; background: var(--gold); color: #14110b; border: none; padding: 15px;
    font-size: 13px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase;
    cursor: pointer; margin-top: 8px; transition: background 0.2s ease, transform 0.15s ease;
  }
  .submit:hover:not(:disabled) { background: var(--gold-bright); }
  .submit:active:not(:disabled) { transform: scale(0.99); }
  .submit:disabled { opacity: 0.6; cursor: default; }
  .terms { font-size: 11px; color: var(--muted); line-height: 1.5; margin: 16px 0 0; }
  .seal-card { text-align: center; }
  .seal { display: flex; justify-content: center; margin: 4px 0 20px; animation: stamp 0.6s cubic-bezier(0.34, 1.56, 0.64, 1); }
  @keyframes stamp { 0% { transform: scale(0) rotate(-12deg); opacity: 0; } 70% { transform: scale(1.08) rotate(2deg); opacity: 1; } 100% { transform: scale(1) rotate(0deg); opacity: 1; } }
  .credit-amount { font-family: 'DM Mono', monospace; font-size: 42px; color: var(--gold-bright); margin: 8px 0 2px; }
  .credit-label { font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--muted); margin: 0 0 24px; }
  .fine-print { font-size: 13px; color: var(--muted); line-height: 1.6; margin: 0 0 24px; }
  .cta-link {
    display: inline-block; font-size: 13px; font-weight: 600; letter-spacing: 0.04em;
    color: var(--gold-bright); border-bottom: 1px solid var(--gold-bright); padding-bottom: 2px;
  }
  @media (max-width: 480px) {
    .row { flex-direction: column; gap: 0; }
    .card { padding: 32px 22px 26px; }
  }
`;
