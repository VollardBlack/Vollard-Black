'use client';
import KYCRegistration from './KYCRegistration';
import { useState, useEffect, useRef } from "react";
import { createClient } from '@supabase/supabase-js';

const sUrl = process.env.NEXT_PUBLIC_SUPABASE_URL||'';
const sKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY||'';
const sb = sUrl&&sKey ? createClient(sUrl,sKey,{auth:{autoRefreshToken:true,persistSession:true}}) : null;

const fmt = n=>Number(n||0).toLocaleString('en-ZA',{minimumFractionDigits:2,maximumFractionDigits:2});
const toCamel = o=>{if(!o||typeof o!=='object'||Array.isArray(o))return o;const r={};for(const[k,v]of Object.entries(o))r[k.replace(/_([a-z])/g,(_,c)=>c.toUpperCase())]=v;return r;};
const toSnake = o=>{if(!o||typeof o!=='object')return o;const r={};for(const[k,v]of Object.entries(o))r[k.replace(/[A-Z]/g,m=>'_'+m.toLowerCase())]=v;return r;};
const G={gold:'#b68b2e',goldD:'#8a6a1e',cream:'#f5f3ef',dark:'#1a1714',mid:'#6b635a',light:'#8a8070',red:'#c45c4a',green:'#4a9e6b',greenD:'#2d7a4a',white:'#ffffff'};
const F={ser:"'Cormorant Garamond',serif",san:"'DM Sans',sans-serif"};

const INP={width:'100%',padding:'13px 16px',background:'#f7f5f1',border:'1.5px solid rgba(182,139,46,0.22)',borderRadius:12,color:G.dark,fontFamily:F.san,fontSize:14,outline:'none',boxSizing:'border-box'};
const LBL={display:'block',fontSize:10,fontWeight:700,letterSpacing:'0.14em',textTransform:'uppercase',color:G.mid,marginBottom:8};
const CARD={background:G.white,border:'1px solid rgba(182,139,46,0.18)',borderRadius:16,overflow:'hidden',marginBottom:16};

function Logo(){return(<div style={{textAlign:'center',marginBottom:32}}><div style={{fontFamily:F.ser,fontSize:32,fontWeight:300,letterSpacing:10,color:G.dark}}>VOLLARD <span style={{color:G.gold}}>BLACK</span></div><div style={{fontSize:10,letterSpacing:4,textTransform:'uppercase',color:G.light,marginTop:6}}>BUYER PORTAL</div><div style={{width:40,height:1,background:'rgba(182,139,46,0.4)',margin:'12px auto 0'}}/></div>);}

function NotApprovedScreen({onSignOut}){
  return(
    <div style={{minHeight:'100vh',background:G.cream,display:'flex',alignItems:'center',justifyContent:'center',padding:20,fontFamily:F.san}}>
      <div style={{width:'100%',maxWidth:420,textAlign:'center'}}>
        <Logo/>
        <div style={{...CARD,padding:36}}>
          <div style={{fontSize:48,marginBottom:12}}>⏳</div>
          <div style={{fontFamily:F.ser,fontSize:22,color:G.dark,marginBottom:8}}>Pending Approval</div>
          <div style={{fontSize:13,color:G.mid,lineHeight:1.8,marginBottom:20}}>Your application is under review. Contact <strong>concierge@vollardblack.com</strong> for immediate access.</div>
          <button onClick={onSignOut} style={{padding:'11px 24px',borderRadius:24,border:'1px solid rgba(182,139,46,0.28)',background:'transparent',color:G.gold,cursor:'pointer',fontSize:13,fontWeight:600,fontFamily:F.san}}>Sign Out</button>
        </div>
      </div>
    </div>
  );
}

function AuthScreen({onAuth, accessError}){
  const[mode,setMode]=useState('login');
  const[email,setEmail]=useState('');
  const[pw,setPw]=useState('');
  const[pw2,setPw2]=useState('');
  const[showPw,setShowPw]=useState(false);
  const[loading,setLoading]=useState(false);
  const[error,setError]=useState('');
  const[msg,setMsg]=useState('');

  const signIn=async()=>{
    if(!email||!pw)return setError('Please enter your email and password.');
    setLoading(true);setError('');
    const{data,error:e}=await sb.auth.signInWithPassword({email:email.trim().toLowerCase(),password:pw});
    setLoading(false);
    if(e){
      if(e.message.includes('Email not confirmed'))
        return setError('Please confirm your email address first. Check your inbox for a confirmation email.');
      if(e.message.includes('Invalid login credentials'))
        return setError('Incorrect email or password. Please try again or create an account.');
      return setError(e.message);
    }
    onAuth(data.session);
  };

  const signUp=async()=>{
    if(!email||!pw)return setError('Please enter your email and password.');
    if(pw.length<6)return setError('Password must be at least 6 characters.');
    if(pw!==pw2)return setError('Passwords do not match.');
    setLoading(true);setError('');
    const emailClean=email.trim().toLowerCase();
    const{data,error:e}=await sb.auth.signUp({email:emailClean,password:pw});
    if(e&&e.message.toLowerCase().includes('already')){
      const{data:d2,error:e2}=await sb.auth.signInWithPassword({email:emailClean,password:pw});
      if(e2){setLoading(false);return setError('An account with this email already exists. Use your existing password to sign in.');}
      await sb.from('portal_requests').upsert({id:crypto.randomUUID(),email:emailClean,role:'buyer',status:'pending',created_at:new Date().toISOString()},{onConflict:'email,role'});
      setLoading(false);return onAuth(d2.session);
    }
    if(e){setLoading(false);return setError(e.message);}
    await sb.from('portal_requests').upsert({id:crypto.randomUUID(),email:emailClean,role:'buyer',status:'pending',created_at:new Date().toISOString()},{onConflict:'email,role'});
    setLoading(false);
    if(data?.session)return onAuth(data.session);
    setMsg('Account created! Check your email to confirm, then sign in.');
    setMode('login');setPw('');setPw2('');
  };

  const resetPw=async()=>{
    if(!email)return setError('Enter your email address first.');
    setLoading(true);
    await sb.auth.resetPasswordForEmail(email.trim().toLowerCase());
    setLoading(false);
    setMsg('Password reset email sent. Check your inbox.');
    setMode('login');
  };

  return(
    <div style={{minHeight:'100vh',background:G.cream,display:'flex',alignItems:'center',justifyContent:'center',padding:20,fontFamily:F.san}}>
      <div style={{width:'100%',maxWidth:420}}>
        <Logo/>
        <div style={{...CARD,padding:28}}>
          {accessError&&<div style={{padding:'11px 14px',background:'rgba(196,92,74,0.08)',border:'1px solid rgba(196,92,74,0.25)',borderRadius:10,fontSize:12,color:'#c45c4a',marginBottom:16}}>⚠ {accessError}</div>}
          <div style={{display:'flex',gap:4,marginBottom:24,background:'#f7f5f1',padding:4,borderRadius:10}}>
            {[['login','Sign In'],['signup','Create Account']].map(([m,l])=>(
              <button key={m} onClick={()=>{setMode(m);setError('');setMsg('');}} style={{flex:1,padding:'9px 0',borderRadius:8,border:'none',background:mode===m?G.white:'transparent',color:mode===m?G.dark:G.light,fontWeight:mode===m?700:400,cursor:'pointer',fontSize:13,fontFamily:F.san,boxShadow:mode===m?'0 1px 4px rgba(0,0,0,0.08)':'none'}}>{l}</button>
            ))}
          </div>
          {error&&<div style={{padding:'11px 14px',background:'rgba(196,92,74,0.08)',border:'1px solid rgba(196,92,74,0.25)',borderRadius:10,fontSize:13,color:G.red,marginBottom:16}}>{error}</div>}
          {msg&&<div style={{padding:'11px 14px',background:'rgba(74,158,107,0.08)',border:'1px solid rgba(74,158,107,0.25)',borderRadius:10,fontSize:13,color:G.greenD,marginBottom:16}}>{msg}</div>}
          {mode==='reset'?(
            <div>
              <div style={{fontFamily:F.ser,fontSize:18,color:G.dark,marginBottom:16}}>Reset Password</div>
              <div style={{marginBottom:16}}><label style={LBL}>Email</label><input type="email" value={email} onChange={e=>setEmail(e.target.value)} style={INP}/></div>
              <button onClick={resetPw} disabled={loading} style={{width:'100%',padding:14,borderRadius:12,border:'none',background:`linear-gradient(135deg,${G.gold},${G.goldD})`,color:G.white,fontSize:14,fontWeight:700,cursor:'pointer',fontFamily:F.san,opacity:loading?0.6:1,marginBottom:10}}>{loading?'Sending…':'Send Reset Email'}</button>
              <button onClick={()=>{setMode('login');setError('');}} style={{width:'100%',padding:10,borderRadius:8,border:'none',background:'transparent',color:G.light,fontSize:13,cursor:'pointer',fontFamily:F.san}}>← Back to Sign In</button>
            </div>
          ):(
            <div>
              <div style={{marginBottom:16}}><label style={LBL}>Email</label><input type="email" value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==='Enter'&&mode==='login'&&signIn()} style={INP} placeholder="you@email.com" autoComplete="email"/></div>
              <div style={{marginBottom:mode==='signup'?16:20}}><label style={LBL}>Password</label>
                <div style={{position:'relative'}}><input type={showPw?'text':'password'} value={pw} onChange={e=>setPw(e.target.value)} onKeyDown={e=>e.key==='Enter'&&mode==='login'&&signIn()} style={{...INP,paddingRight:60}} autoComplete={mode==='login'?'current-password':'new-password'}/><button type="button" onClick={()=>setShowPw(p=>!p)} style={{position:'absolute',right:14,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',color:G.light,cursor:'pointer',fontSize:12,fontFamily:F.san,fontWeight:600}}>{showPw?'Hide':'Show'}</button></div>
              </div>
              {mode==='signup'&&<div style={{marginBottom:20}}><label style={LBL}>Confirm Password</label><input type={showPw?'text':'password'} value={pw2} onChange={e=>setPw2(e.target.value)} style={INP} autoComplete="new-password"/></div>}
              <button onClick={mode==='login'?signIn:signUp} disabled={loading} style={{width:'100%',padding:14,borderRadius:12,border:'none',background:`linear-gradient(135deg,${G.gold},${G.goldD})`,color:G.white,fontSize:14,fontWeight:700,cursor:'pointer',fontFamily:F.san,opacity:loading?0.6:1,boxShadow:'0 6px 20px rgba(182,139,46,0.25)',marginBottom:12}}>
                {loading?(mode==='login'?'Signing in…':'Creating account…'):(mode==='login'?'Sign In':'Create Account')}
              </button>
              {mode==='login'&&<div style={{textAlign:'center'}}><button onClick={()=>{setMode('reset');setError('');setMsg('');}} style={{background:'none',border:'none',color:G.light,cursor:'pointer',fontSize:12,fontFamily:F.san}}>Forgot password?</button></div>}
              {mode==='signup'&&<div style={{fontSize:11,color:G.light,textAlign:'center',lineHeight:1.6,marginTop:4}}>After registering, Vollard Black will review and approve your account.</div>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const TERMS_VERSION='1.0';
function TermsModal({email,onAccepted}){
  const[agreed,setAgreed]=useState(false);
  const[hasSig,setHasSig]=useState(false);
  const[drawing,setDrawing]=useState(false);
  const[saving,setSaving]=useState(false);
  const[err,setErr]=useState('');
  const canvasRef=useRef(null);
  const getPos=(e,c)=>{const r=c.getBoundingClientRect(),sx=c.width/r.width,sy=c.height/r.height;return e.touches?{x:(e.touches[0].clientX-r.left)*sx,y:(e.touches[0].clientY-r.top)*sy}:{x:(e.clientX-r.left)*sx,y:(e.clientY-r.top)*sy};};
  const onDown=e=>{e.preventDefault();const c=canvasRef.current;if(!c)return;const p=getPos(e,c);const ctx=c.getContext('2d');ctx.beginPath();ctx.moveTo(p.x,p.y);setDrawing(true);setHasSig(true);};
  const onMove=e=>{e.preventDefault();if(!drawing)return;const c=canvasRef.current;if(!c)return;const p=getPos(e,c);const ctx=c.getContext('2d');ctx.lineWidth=2.5;ctx.lineCap='round';ctx.strokeStyle=G.dark;ctx.lineTo(p.x,p.y);ctx.stroke();ctx.beginPath();ctx.moveTo(p.x,p.y);};
  const onUp=e=>{if(e)e.preventDefault();setDrawing(false);};
  const clear=()=>{const c=canvasRef.current;if(!c)return;c.getContext('2d').clearRect(0,0,c.width,c.height);setHasSig(false);};
  const sign=async()=>{
    if(!hasSig)return setErr('Please draw your signature.');
    if(!agreed)return setErr('Please tick the checkbox to agree.');
    setSaving(true);
    const sig=canvasRef.current.toDataURL('image/png');
    const now=new Date().toISOString();
    try{await sb.from('portal_agreements').upsert({id:crypto.randomUUID(),email,role:'buyer',signed_at:now,signature_data:sig,user_agent:navigator.userAgent,terms_version:TERMS_VERSION},{onConflict:'email,role'});}catch(e){console.error(e);}
    try{localStorage.setItem('vb_terms_buyer',JSON.stringify({email,v:TERMS_VERSION}));}catch{}
    setSaving(false);onAccepted();
  };
  const terms=[['Platform Access','By registering, you agree to use the Vollard Black platform solely for lawful art acquisition purposes.'],['Auction Participation','Auction bids are binding. A winning bid creates a legal obligation to purchase at the bid price.'],['KYC Compliance','You confirm all identification and personal information submitted is accurate and current.'],['Privacy','Your personal data is held in accordance with POPIA and will not be shared with third parties except to complete transactions.'],['Payments','All payments are processed securely via iKhoka. Vollard Black does not store card details.'],['Governing Law','This agreement is governed by the laws of the Republic of South Africa.']];
  return(
    <div style={{position:'fixed',inset:0,background:'rgba(26,23,20,0.8)',zIndex:1000,display:'flex',alignItems:'flex-start',justifyContent:'center',padding:16,overflowY:'auto',fontFamily:F.san}}>
      <div style={{background:G.white,borderRadius:20,width:'100%',maxWidth:540,marginTop:16,marginBottom:16}}>
        <div style={{background:`linear-gradient(135deg,${G.dark},#2a2018)`,padding:'20px 24px',borderRadius:'20px 20px 0 0',textAlign:'center'}}><div style={{fontFamily:F.ser,fontSize:11,letterSpacing:'0.28em',color:'rgba(182,139,46,0.7)',textTransform:'uppercase',marginBottom:6}}>VOLLARD BLACK</div><div style={{fontFamily:F.ser,fontSize:20,color:'#f5f3ef'}}>Buyer Platform Agreement</div><div style={{fontSize:10,color:'rgba(245,243,239,0.45)',marginTop:4}}>Version {TERMS_VERSION} · Please read and sign before continuing</div></div>
        <div style={{padding:'20px 24px'}}>
          <div style={{maxHeight:220,overflowY:'auto',marginBottom:16}}>{terms.map(([t,x])=><div key={t} style={{marginBottom:12,paddingBottom:12,borderBottom:'1px solid rgba(182,139,46,0.08)'}}><div style={{fontFamily:F.ser,fontSize:14,color:G.dark,marginBottom:3,fontWeight:500}}>{t}</div><div style={{fontSize:12,color:'#4a4440',lineHeight:1.7}}>{x}</div></div>)}<div style={{padding:'8px 12px',background:'rgba(182,139,46,0.06)',borderRadius:8,fontSize:11,color:'#8a6a1e'}}>Vollard Black (Pty) Ltd · Hermanus, Western Cape · concierge@vollardblack.com</div></div>
          <div style={{marginBottom:14}}><div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}><label style={LBL}>Your Signature</label>{hasSig&&<button onClick={clear} style={{fontSize:11,color:G.red,background:'none',border:'none',cursor:'pointer',fontFamily:F.san}}>✕ Clear</button>}</div><div style={{border:'1.5px solid rgba(182,139,46,0.28)',borderRadius:10,background:'#fafaf8',position:'relative',overflow:'hidden'}}><canvas ref={canvasRef} width={492} height={120} style={{width:'100%',height:120,display:'block',touchAction:'none',cursor:'crosshair'}} onMouseDown={onDown} onMouseMove={onMove} onMouseUp={onUp} onMouseLeave={onUp} onTouchStart={onDown} onTouchMove={onMove} onTouchEnd={onUp}/>{!hasSig&&<div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',pointerEvents:'none'}}><span style={{fontSize:13,color:'rgba(182,139,46,0.3)',fontStyle:'italic'}}>Draw your signature here</span></div>}</div><div style={{fontSize:10,color:G.light,marginTop:4}}>Signed by: {email}</div></div>
          <label style={{display:'flex',alignItems:'flex-start',gap:10,cursor:'pointer',marginBottom:14,padding:'10px 12px',background:'rgba(182,139,46,0.04)',borderRadius:8,border:`1px solid ${agreed?'rgba(182,139,46,0.28)':'rgba(182,139,46,0.12)'}`}}><input type="checkbox" checked={agreed} onChange={e=>setAgreed(e.target.checked)} style={{width:15,height:15,marginTop:1,accentColor:G.gold,flexShrink:0}}/><span style={{fontSize:12,color:G.dark,lineHeight:1.6}}>I, <strong>{email}</strong>, have read and agree to the above terms. I understand this is a legally binding digital signature.</span></label>
          {err&&<div style={{padding:'9px 12px',background:'rgba(196,92,74,0.08)',border:'1px solid rgba(196,92,74,0.25)',borderRadius:8,fontSize:12,color:G.red,marginBottom:10}}>{err}</div>}
          <button onClick={sign} disabled={saving} style={{width:'100%',padding:13,borderRadius:12,border:'none',background:hasSig&&agreed?`linear-gradient(135deg,${G.gold},${G.goldD})`:'rgba(182,139,46,0.2)',color:hasSig&&agreed?G.white:G.gold,fontSize:14,fontWeight:700,cursor:'pointer',fontFamily:F.san}}>{saving?'Saving…':'✍ Sign & Continue'}</button>
        </div>
      </div>
    </div>
  );
}



// ─── Sound Engine (Web Audio API — no external files needed) ─────────────────
const _AudioCtxClass = typeof window !== 'undefined' ? (window.AudioContext || window.webkitAudioContext) : null;
let _buyerAudioCtx = null;
const _getAudioCtxBuyer = () => {
  if(!_AudioCtxClass) return null;
  if(!_buyerAudioCtx) _buyerAudioCtx = new _AudioCtxClass();
  if(_buyerAudioCtx.state === 'suspended') _buyerAudioCtx.resume();
  return _buyerAudioCtx;
};

const playTone = (frequency, duration, type='sine', volume=0.3, delay=0) => {
  const ctx = _getAudioCtxBuyer(); if(!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain); gain.connect(ctx.destination);
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, ctx.currentTime + delay);
  gain.gain.setValueAtTime(0, ctx.currentTime + delay);
  gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + delay + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);
  osc.start(ctx.currentTime + delay);
  osc.stop(ctx.currentTime + delay + duration + 0.05);
};

// Bid placed (buyer) — ascending chime: punchy & satisfying
const soundBidPlaced = () => {
  playTone(440, 0.12, 'sine', 0.25, 0);
  playTone(554, 0.12, 'sine', 0.25, 0.08);
  playTone(659, 0.20, 'sine', 0.30, 0.16);
  playTone(880, 0.35, 'sine', 0.20, 0.30);
};

// Outbid alert — tense descending tone
const soundOutbid = () => {
  playTone(660, 0.10, 'sawtooth', 0.15, 0);
  playTone(550, 0.10, 'sawtooth', 0.15, 0.12);
  playTone(440, 0.25, 'sawtooth', 0.20, 0.24);
};

// New bid received (admin) — cash register / auction house feel
const soundNewBid = () => {
  playTone(800, 0.06, 'square', 0.12, 0);
  playTone(1000, 0.06, 'square', 0.12, 0.07);
  playTone(1200, 0.15, 'sine', 0.20, 0.14);
};

// Auction sold — triumphant fanfare
const soundSold = () => {
  [[523,0.15,0],[659,0.15,0.12],[784,0.15,0.24],[1047,0.50,0.36]].forEach(([f,d,t]) => playTone(f, d, 'sine', 0.25, t));
};

// Auction launched — gavel strike simulation
const soundGavel = () => {
  const ctx = _getAudioCtxBuyer(); if(!ctx) return;
  // Low thump
  const buf = ctx.createBuffer(1, ctx.sampleRate * 0.3, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for(let i = 0; i < data.length; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.04));
  }
  const src = ctx.createBufferSource();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass'; filter.frequency.value = 200;
  src.buffer = buf;
  src.connect(filter); filter.connect(gain); gain.connect(ctx.destination);
  gain.gain.setValueAtTime(0.8, ctx.currentTime);
  src.start();
  // Follow with a short tone
  playTone(180, 0.25, 'sine', 0.3, 0.05);
};

const calcMinBid = (currentBid, increment) => {
  if (!increment || (!increment.type && !increment.value)) return (currentBid || 0) + 1;
  const base = currentBid || 0;
  if (increment.type === 'pct') return Math.ceil(base + base * (increment.value || 0.025));
  return base + (increment.value || 500);
};

function useCountdown(endTime, status) {
  const [remaining, setRemaining] = useState(null);
  useEffect(() => {
    if (status !== 'Live' || !endTime) { setRemaining(null); return; }
    const tick = () => { const diff = new Date(endTime) - new Date(); setRemaining(diff > 0 ? diff : 0); };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [endTime, status]);
  return remaining;
}

function formatCountdown(ms) {
  if (ms === null) return null;
  if (ms <= 0) return 'ENDED';
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m ${sec}s`;
  return `${m}m ${sec}s`;
}

const S = {
  page: { minHeight:'100vh', background:'#f5f3ef', fontFamily:"'DM Sans',sans-serif", color:'#2a2622' },
  card: { background:'#fff', border:'1px solid rgba(182,139,46,0.18)', borderRadius:12, padding:20, marginBottom:16 },
  input: { width:'100%', padding:'12px 14px', background:'#f5f3ef', border:'1px solid rgba(182,139,46,0.25)', borderRadius:8, color:'#1a1714', fontFamily:"'DM Sans',sans-serif", fontSize:14, outline:'none', boxSizing:'border-box' },
  label: { display:'block', fontSize:10, fontWeight:500, letterSpacing:2, textTransform:'uppercase', color:'#6b635a', marginBottom:6 },
  btn: (gold) => ({ padding:'12px 24px', borderRadius:8, border: gold?'none':'1px solid rgba(182,139,46,0.30)', background: gold?'linear-gradient(135deg,#b68b2e,#8a6a1e)':'transparent', color: gold?'#fff':'#b68b2e', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }),
  tab: (a) => ({ padding:'9px 18px', border: a?'none':'1px solid rgba(182,139,46,0.25)', borderRadius:24, background: a?'linear-gradient(135deg,#b68b2e,#8a6a1e)':'transparent', color: a?'#fff':'#6b635a', fontSize:13, fontWeight:a?600:400, cursor:'pointer', fontFamily:"'DM Sans',sans-serif", whiteSpace:'nowrap', transition:'all 0.2s' }),
  gold: { color:'#b68b2e', fontWeight:600 },
  green: { color:'#4a9e6b', fontWeight:600 },
};


const PORTAL_ROLE='buyer';


function AuctionAccessButton({buyer, onRefresh}) {
  const [sent,setSent] = useState(false);
  const [sending,setSending] = useState(false);
  const [error,setError] = useState('');
  const handleRequest = async() => {
    if(sent) return;
    setSending(true); setError('');
    try {
      if(buyer?.id) {
        const {error:e} = await sb.from('buyers').update({auction_requested:true,auction_requested_at:new Date().toISOString()}).eq('id',buyer.id);
        if(e) throw e;
      }
      setSent(true);
      setTimeout(()=>onRefresh&&onRefresh(),800);
    } catch(e) { setError('Request failed. Please contact Vollard Black directly.'); }
    setSending(false);
  };
  if(sent||buyer?.auctionRequested) return (
    <div style={{padding:'12px 16px',background:'rgba(74,158,107,0.06)',border:'1px solid rgba(74,158,107,0.2)',borderRadius:8,fontSize:13,color:'#4a9e6b',fontWeight:600}}>
      ✓ Request submitted — Vollard Black will review and activate your access shortly.
    </div>
  );
  return (
    <div>
      <button onClick={handleRequest} disabled={sending} style={{padding:'12px 28px',borderRadius:8,border:'none',background:'linear-gradient(135deg,#b68b2e,#8a6a1e)',color:'#fff',fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:"'DM Sans',sans-serif",opacity:sending?0.6:1,width:'100%'}}>
        {sending?'Submitting…':'Request Auction Access'}
      </button>
      {error&&<div style={{marginTop:8,fontSize:12,color:'#c45c4a'}}>{error}</div>}
    </div>
  );
}

// ─── BID MODAL — bottom sheet ─────────────────────────────────────────────────
function BidModal({auction, buyer, myBids, onClose, onBidPlaced}) {
  const increment = { type: auction.incrementType||'flat', value: Number(auction.incrementValue)||500 };
  const baseBid = auction.currentBid > 0
    ? calcMinBid(auction.currentBid, increment)
    : Math.max(Number(auction.reservePrice)||0, 1);

  const [amount,setAmount] = useState(String(baseBid));
  const [stage,setStage] = useState('entry'); // 'entry' | 'confirm'
  const [submitting,setSubmitting] = useState(false);
  const [error,setError] = useState('');
  const [success,setSuccess] = useState(false);
  const remaining = useCountdown(auction.endTime, auction.status);
  const numAmount = Number(amount)||0;
  const reserveMet = numAmount >= (Number(auction.reservePrice)||0);
  const aboveMin = numAmount >= baseBid;
  const auctionEnded = remaining !== null && remaining <= 0;

  const displayName = buyer.type==='company'
    ? (buyer.companyName||buyer.email)
    : (`${buyer.firstName||''} ${buyer.lastName||''}`.trim()||buyer.email);

  const quickOpts = [
    {label:'Min bid', val:baseBid},
    increment.type==='flat'
      ? {label:`+R ${fmt(increment.value)}`, val:baseBid+increment.value}
      : {label:'+1 step', val:Math.ceil(baseBid*(1+increment.value))},
    increment.type==='flat'
      ? {label:`+R ${fmt(increment.value*2)}`, val:baseBid+increment.value*2}
      : {label:'+2 steps', val:Math.ceil(baseBid*Math.pow(1+increment.value,2))},
  ];

  const handleBid = async() => {
    if(!aboveMin) return setError(`Minimum bid is R ${fmt(baseBid)}`);
    if(auctionEnded) return setError('This auction has ended.');
    if(!buyer?.id) return setError('Your buyer profile is not linked. Please contact Vollard Black.');
    setSubmitting(true); setError('');
    try {
      const bidId = 'VB'+Date.now().toString(36)+Math.random().toString(36).slice(2,6);
      const now = new Date().toISOString();
      const {error:bidErr} = await sb.from('bids').insert({
        id:bidId, auction_id:auction.id, buyer_id:buyer.id, buyer_name:displayName,
        amount:numAmount, timestamp:now, created_at:now,
      });
      if(bidErr) throw bidErr;
      const {error:aucErr} = await sb.from('auctions').update({
        current_bid:numAmount, lead_bidder_id:buyer.id, lead_bidder_name:displayName,
        bids_count:(auction.bidsCount||0)+1,
      }).eq('id',auction.id);
      if(aucErr) throw aucErr;
      soundBidPlaced();
      setSuccess(true);
      setTimeout(()=>{ onBidPlaced(); onClose(); },1200);
    } catch(e) {
      console.error('Bid error:',e);
      setError(e.message||'Failed to place bid. Please try again.');
    }
    setSubmitting(false);
  };

  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.65)',zIndex:200,display:'flex',alignItems:'flex-end',justifyContent:'center'}}
      onClick={e=>{ if(e.target===e.currentTarget) onClose(); }}>
      <div style={{background:'#fff',borderRadius:'16px 16px 0 0',padding:24,width:'100%',maxWidth:520,maxHeight:'92vh',overflowY:'auto'}}>
        <div style={{width:40,height:4,background:'rgba(182,139,46,0.3)',borderRadius:2,margin:'0 auto 20px'}}/>

        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:14}}>
          <div>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,color:'#1a1714'}}>{auction.title}</div>
            <div style={{fontSize:12,color:'#8a8070',marginTop:2}}>{auction.artist||'—'} · {auction.galleryName||'—'}</div>
          </div>
          <button onClick={onClose} style={{background:'none',border:'none',color:'#8a8070',cursor:'pointer',fontSize:28,lineHeight:1,padding:'0 0 0 16px',flexShrink:0}}>×</button>
        </div>

        {remaining!==null&&(
          <div style={{padding:'8px 14px',background:remaining<300000?'rgba(196,92,74,0.08)':'rgba(74,158,107,0.06)',border:`1px solid ${remaining<300000?'rgba(196,92,74,0.25)':'rgba(74,158,107,0.2)'}`,borderRadius:8,marginBottom:14,display:'flex',justifyContent:'space-between'}}>
            <span style={{fontSize:13,color:remaining<300000?'#c45c4a':'#4a9e6b',fontWeight:700}}>⏱ {formatCountdown(remaining)}</span>
            <span style={{fontSize:12,color:'#8a8070'}}>{auction.bidsCount||0} bids</span>
          </div>
        )}

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8,marginBottom:18}}>
          {[['Current Bid','R '+fmt(auction.currentBid||0),'#b68b2e'],['Reserve','R '+fmt(auction.reservePrice||0),reserveMet?'#4a9e6b':'#c45c4a'],['Min Bid','R '+fmt(baseBid),'#1a1714']].map(([l,v,c])=>(
            <div key={l} style={{background:'#f5f3ef',borderRadius:8,padding:'10px 8px',textAlign:'center'}}>
              <div style={{fontSize:9,letterSpacing:1,textTransform:'uppercase',color:'#8a8070',marginBottom:4}}>{l}</div>
              <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:14,fontWeight:700,color:c}}>{v}</div>
            </div>
          ))}
        </div>

        {/* Quick options */}
        <div style={{display:'flex',gap:8,marginBottom:14}}>
          {quickOpts.map(({label,val})=>(
            <button key={label} onClick={()=>{setAmount(String(val));setError('');setStage('entry');}}
              style={{flex:1,padding:'10px 4px',borderRadius:8,border:`2px solid ${numAmount===val?'#b68b2e':'rgba(182,139,46,0.2)'}`,background:numAmount===val?'rgba(182,139,46,0.12)':'#f5f3ef',color:numAmount===val?'#b68b2e':'#6b635a',fontSize:10,cursor:'pointer',fontFamily:"'DM Sans',sans-serif",fontWeight:numAmount===val?700:400,textAlign:'center'}}>
              <div>{label}</div>
              <div style={{fontWeight:700,fontSize:12,marginTop:2,fontFamily:"'Cormorant Garamond',serif"}}>R {fmt(val)}</div>
            </button>
          ))}
        </div>

        {/* Custom input */}
        <div style={{marginBottom:12}}>
          <label style={S.label}>Custom amount (R)</label>
          <div style={{display:'flex',alignItems:'center',background:'#f5f3ef',border:`2px solid ${aboveMin||!numAmount?'rgba(182,139,46,0.4)':'rgba(196,92,74,0.5)'}`,borderRadius:10,overflow:'hidden'}}>
            <span style={{padding:'0 14px',fontSize:14,color:'#8a8070',borderRight:'1px solid rgba(182,139,46,0.18)',height:52,display:'flex',alignItems:'center',flexShrink:0}}>R</span>
            <input type="number" inputMode="numeric" value={amount}
              onChange={e=>{setAmount(e.target.value);setError('');setStage('entry');}}
              min={baseBid}
              style={{flex:1,padding:'0 16px',height:52,background:'transparent',border:'none',color:'#1a1714',fontFamily:"'DM Sans',sans-serif",fontSize:20,fontWeight:700,outline:'none',minWidth:0}}/>
          </div>
          {!aboveMin&&numAmount>0&&<div style={{fontSize:11,color:'#c45c4a',marginTop:4}}>⚠ Must be at least R {fmt(baseBid)}</div>}
        </div>

        {numAmount>0&&(
          <div style={{padding:'8px 12px',background:reserveMet?'rgba(74,158,107,0.06)':'rgba(182,139,46,0.06)',border:`1px solid ${reserveMet?'rgba(74,158,107,0.2)':'rgba(182,139,46,0.2)'}`,borderRadius:8,marginBottom:12,fontSize:12,color:reserveMet?'#4a9e6b':'#8a8070'}}>
            {reserveMet?'✓ Meets reserve price':'⚠ Below reserve — artwork may not sell at this price'}
          </div>
        )}

        {error&&<div style={{padding:'10px 14px',background:'rgba(196,92,74,0.08)',border:'1px solid rgba(196,92,74,0.2)',borderRadius:8,fontSize:13,color:'#c45c4a',marginBottom:12}}>{error}</div>}
        {success&&<div style={{padding:'12px',background:'rgba(74,158,107,0.08)',border:'1px solid rgba(74,158,107,0.25)',borderRadius:8,fontSize:14,color:'#4a9e6b',fontWeight:600,textAlign:'center',marginBottom:12}}>✓ Bid placed successfully!</div>}

        {stage==='entry'&&(
          <button
            onClick={()=>{ if(!aboveMin) return setError(`Minimum bid is R ${fmt(baseBid)}`); if(auctionEnded) return setError('This auction has ended.'); setError(''); setStage('confirm'); }}
            disabled={!aboveMin||auctionEnded}
            style={{width:'100%',padding:'14px',borderRadius:10,border:'none',background:'linear-gradient(135deg,#b68b2e,#8a6a1e)',color:'#fff',fontSize:15,fontWeight:700,cursor:!aboveMin||auctionEnded?'not-allowed':'pointer',fontFamily:"'DM Sans',sans-serif",opacity:!aboveMin&&numAmount>0?0.6:1}}>
            Review Bid — R {fmt(numAmount)}
          </button>
        )}

        {stage==='confirm'&&(
          <div style={{background:'rgba(182,139,46,0.06)',border:'2px solid #b68b2e',borderRadius:12,padding:18,marginBottom:0}}>
            <div style={{fontSize:12,letterSpacing:2,textTransform:'uppercase',color:'#8a8070',marginBottom:10}}>Confirm Your Bid</div>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
              <span style={{fontSize:14,color:'#6b635a'}}>Artwork</span>
              <span style={{fontSize:14,fontWeight:600,color:'#1a1714'}}>{auction.title}</span>
            </div>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
              <span style={{fontSize:14,color:'#6b635a'}}>Your bid</span>
              <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:26,fontWeight:700,color:'#b68b2e'}}>R {fmt(numAmount)}</span>
            </div>
            <div style={{fontSize:11,color:'#8a8070',marginBottom:14,lineHeight:1.6}}>
              By confirming you agree to purchase this artwork at this price if you are the winning bidder when the auction closes.
            </div>
            {error&&<div style={{padding:'10px 14px',background:'rgba(196,92,74,0.08)',border:'1px solid rgba(196,92,74,0.2)',borderRadius:8,fontSize:13,color:'#c45c4a',marginBottom:12}}>{error}</div>}
            {success&&<div style={{padding:'12px',background:'rgba(74,158,107,0.08)',border:'1px solid rgba(74,158,107,0.25)',borderRadius:8,fontSize:14,color:'#4a9e6b',fontWeight:600,textAlign:'center',marginBottom:12}}>✓ Bid placed!</div>}
            <div style={{display:'flex',gap:10}}>
              <button onClick={()=>{setStage('entry');setError('');}} disabled={submitting||success}
                style={{flex:1,padding:'13px',borderRadius:10,border:'1px solid rgba(182,139,46,0.3)',background:'transparent',color:'#b68b2e',fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:"'DM Sans',sans-serif"}}>
                ← Change
              </button>
              <button onClick={handleBid} disabled={submitting||success}
                style={{flex:2,padding:'13px',borderRadius:10,border:'none',background:success?'#4a9e6b':'linear-gradient(135deg,#b68b2e,#8a6a1e)',color:'#fff',fontSize:15,fontWeight:700,cursor:submitting||success?'not-allowed':'pointer',fontFamily:"'DM Sans',sans-serif",opacity:submitting?0.7:1}}>
                {success?'✓ Bid Placed!':submitting?'Placing…':'Confirm Bid'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function AuctionCard({auc, buyer, myBids, onBid}) {
  const remaining = useCountdown(auc.endTime, auc.status);
  const isLive = auc.status==='Live';
  const isLeading = auc.leadBidderId===buyer?.id;
  const myTopBid = myBids.filter(b=>b.auctionId===auc.id).sort((a,b)=>b.amount-a.amount)[0];
  const urgent = remaining!==null&&remaining<300000;
  const auctionEnded = remaining!==null&&remaining<=0;
  // KEY FIX: canBid = live + approved + (no timer OR timer not yet expired)
  const canBid = isLive && buyer?.auctionApproved && !auctionEnded;

  return (
    <div style={{background:'#fff',border:'1px solid rgba(182,139,46,0.18)',borderRadius:12,overflow:'hidden',marginBottom:16}}>
      <div style={{height:3,background:isLeading?'#4a9e6b':isLive?'#c45c4a':'rgba(182,139,46,0.3)'}}/>
      {auc.imageUrl&&(
        <div style={{position:'relative',height:200,overflow:'hidden',background:'#f0ede8'}}>
          <img src={auc.imageUrl} alt={auc.title} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
          {isLive&&<div style={{position:'absolute',top:10,left:10,background:'rgba(196,92,74,0.9)',borderRadius:6,padding:'4px 10px',fontSize:10,fontWeight:700,color:'#fff',letterSpacing:1}}>● LIVE</div>}
          {isLeading&&<div style={{position:'absolute',top:10,right:10,background:'rgba(74,158,107,0.9)',borderRadius:6,padding:'4px 10px',fontSize:10,fontWeight:700,color:'#fff'}}>● LEADING</div>}
        </div>
      )}
      {!auc.imageUrl&&isLive&&<div style={{background:'rgba(196,92,74,0.08)',padding:'8px 16px'}}><span style={{fontSize:10,fontWeight:700,color:'#c45c4a'}}>● LIVE AUCTION</span></div>}

      <div style={{padding:16}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:12,marginBottom:12}}>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,color:'#1a1714',marginBottom:4}}>{auc.title}</div>
            <div style={{fontSize:12,color:'#8a8070'}}>{auc.artist||'—'} · {auc.galleryName||'—'}</div>
          </div>
          <div style={{textAlign:'right',flexShrink:0}}>
            <div style={{fontSize:9,color:'#8a8070',letterSpacing:1,textTransform:'uppercase'}}>Current Bid</div>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:24,fontWeight:600,color:'#b68b2e'}}>R {fmt(auc.currentBid||0)}</div>
            <div style={{fontSize:11,color:'#8a8070'}}>Reserve: R {fmt(auc.reservePrice||0)}</div>
          </div>
        </div>

        {isLive&&(
          <div style={{padding:'8px 12px',background:urgent?'rgba(196,92,74,0.06)':'rgba(182,139,46,0.04)',border:`1px solid ${urgent?'rgba(196,92,74,0.2)':'rgba(182,139,46,0.15)'}`,borderRadius:8,marginBottom:12,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <span style={{fontSize:12,color:urgent?'#c45c4a':'#b68b2e',fontWeight:700}}>
              {remaining===null?'● Open':auctionEnded?'Ended':`⏱ ${formatCountdown(remaining)}`}
            </span>
            <span style={{fontSize:11,color:'#8a8070'}}>{auc.bidsCount||0} bids · {auc.incrementLabel||'—'}</span>
          </div>
        )}

        {isLeading&&<div style={{fontSize:12,fontWeight:600,color:'#4a9e6b',marginBottom:8}}>● Leading — R {fmt(myTopBid?.amount||0)}</div>}
        {myTopBid&&!isLeading&&isLive&&<div style={{fontSize:12,color:'#c45c4a',marginBottom:8}}>⚠ Outbid (your bid: R {fmt(myTopBid.amount)})</div>}

        {canBid&&(
          <button onClick={onBid} style={{width:'100%',padding:'13px',borderRadius:8,border:'none',background:isLeading?'linear-gradient(135deg,#4a9e6b,#2d7a4a)':'linear-gradient(135deg,#b68b2e,#8a6a1e)',color:'#fff',fontSize:14,fontWeight:700,cursor:'pointer',fontFamily:"'DM Sans',sans-serif"}}>
            {isLeading?'↑ Raise Your Bid':myTopBid?'⚠ Place Higher Bid':'Place Bid'}
          </button>
        )}
        {isLive&&!buyer?.auctionApproved&&!buyer?.auctionRequested&&(
          <div style={{padding:'10px 14px',background:'rgba(182,139,46,0.06)',border:'1px solid rgba(182,139,46,0.2)',borderRadius:8,fontSize:12,color:'#8a6a1e',textAlign:'center'}}>KYC verification required — <strong>request access above</strong></div>
        )}
        {isLive&&!buyer?.auctionApproved&&buyer?.auctionRequested&&(
          <div style={{padding:'10px 14px',background:'rgba(74,158,107,0.06)',border:'1px solid rgba(74,158,107,0.2)',borderRadius:8,fontSize:12,color:'#4a9e6b',textAlign:'center'}}>✓ Access requested — Vollard Black will approve shortly</div>
        )}
        {auc.status==='Sold'&&(
          <div style={{padding:'10px',background:isLeading?'rgba(74,158,107,0.08)':'rgba(182,139,46,0.06)',border:`1px solid ${isLeading?'rgba(74,158,107,0.25)':'rgba(182,139,46,0.2)'}`,borderRadius:8,textAlign:'center',fontSize:12,fontWeight:600,color:isLeading?'#4a9e6b':'#8a8070'}}>
            {isLeading?'🏆 You won — Vollard Black will contact you shortly.':'Auction closed'}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Push notification helper ─────────────────────────────────────────────────
async function requestNotifPermission() {
  if(typeof window === 'undefined' || !('Notification' in window)) return false;
  if(Notification.permission === 'denied') return false;
  let granted = Notification.permission === 'granted';
  if(!granted) {
    const p = await Notification.requestPermission();
    granted = p === 'granted';
  }
  // Register service worker for proper mobile push (shows even when tab is backgrounded)
  if(granted && 'serviceWorker' in navigator) {
    try {
      await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    } catch(e) { console.warn('SW registration failed:', e); }
  }
  return granted;
}
function pushNotif(title, body, tag) {
  if(!('Notification' in window)||Notification.permission!=='granted') return;
  try {
    // Use ServiceWorker registration if available (works on mobile when tab backgrounded)
    if(navigator.serviceWorker && navigator.serviceWorker.ready) {
      navigator.serviceWorker.ready.then(reg => {
        reg.showNotification(title, {
          body,
          tag,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          vibrate: [200, 100, 200],
          requireInteraction: tag && tag.startsWith('outbid'),
        }).catch(()=>{
          // Fallback to basic notification
          try { new Notification(title,{body,tag}); } catch(e){}
        });
      }).catch(()=>{
        try { new Notification(title,{body,tag}); } catch(e){}
      });
    } else {
      new Notification(title,{body,tag,icon:'/favicon.ico'});
    }
  } catch(e){}
}

function BuyerDashboard({session, kycComplete=true}) {
  const [tab,setTab] = useState('gallery');
  const [buyer,setBuyer] = useState(null);
  const [artworks,setArtworks] = useState([]);
  const [auctions,setAuctions] = useState([]);
  const [bids,setBids] = useState([]);
  const [purchases,setPurchases] = useState([]);
  const [initialLoading,setInitialLoading] = useState(true);
  const [notifs,setNotifs] = useState([]);
  const [enquiry,setEnquiry] = useState(null);
  const [profileEdit,setProfileEdit] = useState(false);
  const [profileForm,setProfileForm] = useState({});
  const [saving,setSaving] = useState(false);
  const [saveMsg,setSaveMsg] = useState('');
  const [enquiryMsg,setEnquiryMsg] = useState('');
  const [zoomImg,setZoomImg] = useState(null);
  const [search,setSearch] = useState('');
  const [bidTarget,setBidTarget] = useState(null);
  const [toast,setToast] = useState(null); // {msg, type: 'bid'|'outbid'|'sold'|'info'}
  const [watchlist,setWatchlist] = useState(() => { try{return JSON.parse(localStorage.getItem('vb_watchlist')||'[]');}catch{return[];} });
  const [artDetail,setArtDetail] = useState(null); // artwork detail modal
  const [notifEnabled,setNotifEnabled] = useState(false);
  const [soundReady,setSoundReady] = useState(false);
  const buyerRef = useRef(null);

  const unlockSound = () => { const ctx = _getAudioCtxBuyer(); if(ctx) setSoundReady(true); };
  const auctionsRef = useRef([]);
  const toastTimer = useRef(null);

  const showToast = (msg, type='info') => {
    setToast({msg,type});
    if(toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(()=>setToast(null), 5000);
  };

  // Request notification permission on mount
  useEffect(()=>{
    requestNotifPermission().then(granted=>setNotifEnabled(granted));
  },[]);

  useEffect(()=>{ loadData(true); },[session]);

  useEffect(()=>{
    if(typeof window==='undefined') return;
    const params=new URLSearchParams(window.location.search);
    const pay=params.get('payment');
    if(pay==='success'){
      setEnquiryMsg('✓ Payment submitted! Vollard Black will confirm and update your account shortly.');
      window.history.replaceState({},'',window.location.pathname);
      setTab('purchases');
    } else if(pay==='failed'){
      setEnquiryMsg('⚠ Payment failed. Please try again or contact Vollard Black.');
      window.history.replaceState({},'',window.location.pathname);
    } else if(pay==='cancelled'){
      setEnquiryMsg('Payment cancelled — no charge was made.');
      window.history.replaceState({},'',window.location.pathname);
    }
  },[]);

  // Keep refs in sync for use inside realtime callbacks
  useEffect(()=>{ buyerRef.current = buyer; },[buyer]);
  useEffect(()=>{ auctionsRef.current = auctions; },[auctions]);

  useEffect(()=>{
    if(!session||!sb) return;
    const ch = sb.channel('buyer-rt')
      // ── Auction changes: apply payload directly to state ──
      .on('postgres_changes',{event:'UPDATE',schema:'public',table:'auctions'},(payload)=>{
        const updated = toCamel(payload.new);
        const prev = auctionsRef.current.find(a=>a.id===updated.id);
        const me = buyerRef.current;

        // Update auction in state immediately — no re-fetch
        setAuctions(prev=>prev.map(a=>a.id===updated.id?{...a,...updated,imageUrl:a.imageUrl}:a));

        if(!me||!prev) return;

        // Was I just outbid?
        if(prev.leadBidderId===me.id && updated.leadBidderId!==me.id && updated.status==='Live') {
          soundOutbid();
          showToast(`⚠ You've been outbid on "${updated.title}" — R ${fmt(updated.currentBid)}`, 'outbid');
          pushNotif('⚠ Outbid — Vollard Black', `${updated.title}: new bid R ${fmt(updated.currentBid)}. Bid now!`, 'outbid-'+updated.id);
        }
        // Auction just closed and I won
        if(updated.status==='Sold' && updated.leadBidderId===me.id) {
          soundSold();
          showToast(`🏆 You won "${updated.title}" at R ${fmt(updated.currentBid)}!`, 'sold');
          pushNotif('🏆 You Won! — Vollard Black', `Congratulations! You won "${updated.title}" at R ${fmt(updated.currentBid)}.`, 'won-'+updated.id);
        }
        // New bid on an auction I'm watching (not by me)
        if(updated.leadBidderId!==me.id && updated.bidsCount>(prev.bidsCount||0) && updated.status==='Live') {
          showToast(`New bid on "${updated.title}" — R ${fmt(updated.currentBid)}`, 'bid');
        }
      })
      // ── New auction goes live ──
      .on('postgres_changes',{event:'INSERT',schema:'public',table:'auctions'},(payload)=>{
        const a = toCamel(payload.new);
        if(a.status==='Live') {
          setAuctions(prev=>[a,...prev]);
          showToast(`🔴 New auction live: "${a.title}"`, 'bid');
          pushNotif('🔴 Live Auction — Vollard Black', `"${a.title}" is now live. Place your bid!`, 'live-'+a.id);
        }
      })
      // ── New bid inserted: add to bids state immediately ──
      .on('postgres_changes',{event:'INSERT',schema:'public',table:'bids'},(payload)=>{
        const newBid = toCamel(payload.new);
        const me = buyerRef.current;
        // Add to bids list if it's mine
        if(me && newBid.buyerId===me.id) {
          setBids(prev=>[newBid,...prev.filter(b=>b.id!==newBid.id)]);
        }
      })
      // ── Buyer record updated (e.g. auction approved) ──
      .on('postgres_changes',{event:'UPDATE',schema:'public',table:'buyers'},(payload)=>{
        const updated = toCamel(payload.new);
        const me = buyerRef.current;
        if(me && updated.id===me.id) {
          setBuyer(b=>({...b,...updated}));
          if(updated.auctionApproved && !me.auctionApproved) {
            showToast('✓ Auction access approved — you can now place bids!', 'sold');
            pushNotif('✓ Auction Access Approved', 'Vollard Black has approved your auction access. You can now place bids.', 'approved');
          }
        }
      })
      .subscribe((status)=>{
        if(status==='SUBSCRIBED') console.log('Realtime connected');
      });
    return ()=>sb.removeChannel(ch);
  },[session]);

  const loadData = async(isInitial=false) => {
    if(isInitial) setInitialLoading(true);
    try {
      // ilike for case-insensitive email match
      const {data:buyerRows} = await sb.from('buyers').select('*').ilike('email',session.user.email);
      if(buyerRows&&buyerRows.length>0) {
        const b = toCamel(buyerRows[0]);
        setBuyer(b);
        setProfileForm(p=>({...p,...b}));
      }

      const {data:arts} = await sb.from('artworks').select('*').in('status',['Available','Reserved','In Gallery']).order('created_at',{ascending:false});
      setArtworks((arts||[]).map(toCamel));

      const {data:aucs} = await sb.from('auctions').select('*').in('status',['Live','Frozen','Sold','No Sale']).order('created_at',{ascending:false});
      const aucsWithImages = await Promise.all((aucs||[]).map(async(auc)=>{
        if(auc.artwork_id){
          const {data:art} = await sb.from('artworks').select('image_url').eq('id',auc.artwork_id).single();
          return {...toCamel(auc),imageUrl:art?.image_url||null};
        }
        return toCamel(auc);
      }));
      setAuctions(aucsWithImages);

      if(buyerRows&&buyerRows.length>0) {
        const {data:myBids} = await sb.from('bids').select('*').eq('buyer_id',buyerRows[0].id).order('timestamp',{ascending:false});
        setBids((myBids||[]).map(toCamel));
        const {data:sales} = await sb.from('sales').select('*').eq('buyer_id',buyerRows[0].id);
        setPurchases((sales||[]).map(toCamel));
      }
    } catch(e){ console.error('loadData:',e); }
    if(isInitial) setInitialLoading(false);
  };

  const saveProfile = async() => {
    if(!buyer) return;
    setSaving(true);
    const bankChanged = (
      (profileForm.bankName||'') !== (buyer.bankName||'') ||
      (profileForm.accountNumber||'') !== (buyer.accountNumber||'') ||
      (profileForm.branchCode||'') !== (buyer.branchCode||'') ||
      (profileForm.accountHolder||'') !== (buyer.accountHolder||'')
    );
    const updates = {...profileForm, ...(bankChanged ? {bankVerified:false} : {})};
    const snake = toSnake(updates);
    delete snake.id; delete snake.created_at;
    await sb.from('buyers').update(snake).eq('id',buyer.id);
    setBuyer(b=>({...b,...updates}));
    setSaveMsg(bankChanged?'Saved. Bank details flagged for verification.':'Saved.'); setTimeout(()=>setSaveMsg(''),3000);
    setSaving(false); setProfileEdit(false);
  };

  const sendEnquiry = async() => {
    const art = enquiry;
    const bName = buyer?(`${buyer.firstName||''} ${buyer.lastName||''}`.trim()||buyer.companyName||''):session.user.email.split('@')[0];
    const bMobile = buyer?.mobile||'';
    try {
      await sb.from('enquiries').insert({id:crypto.randomUUID(),artwork_id:art.id,artwork_title:art.title,buyer_id:buyer?.id||null,buyer_name:bName,buyer_email:session.user.email,buyer_mobile:bMobile,message:`Interested in "${art.title}" — R ${fmt(art.recommendedPrice)}`,read:false,created_at:new Date().toISOString()});
    } catch(e){ console.error(e); }
    const waMsg = encodeURIComponent(`Hi Vollard Black,\n\nI am interested in purchasing:\n\n*${art.title}*\nArtist: ${art.artist||'—'}\nValue: R ${fmt(art.recommendedPrice)}\n\nKind regards,\n${bName}${bMobile?' — '+bMobile:''}`);
    window.open(`https://wa.me/27826503393?text=${waMsg}`,'_blank');
    setEnquiryMsg('Enquiry sent!'); setTimeout(()=>setEnquiryMsg(''),5000);
    setEnquiry(null);
  };

  const signOut = ()=>sb.auth.signOut();

  const toggleWatchlist = (artId) => {
    setWatchlist(prev => {
      const next = prev.includes(artId) ? prev.filter(id=>id!==artId) : [...prev,artId];
      try{localStorage.setItem('vb_watchlist',JSON.stringify(next));}catch{}
      return next;
    });
  };

  const generatePurchaseCert = (purchase) => {
    const w = window.open('','_blank');
    const bName = buyer?(`${buyer.firstName||''} ${buyer.lastName||''}`.trim()||buyer.companyName||''):session.user.email;
    const html = `<!DOCTYPE html><html><head><title>Purchase Certificate</title><style>@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600&family=DM+Sans:wght@400;600&display=swap');body{margin:0;padding:60px;background:#fff;font-family:'DM Sans',sans-serif;color:#1a1714;max-width:680px;}@page{size:A4;margin:20mm;}@media print{body{padding:0;}}.logo{font-family:'Cormorant Garamond',serif;font-size:22px;letter-spacing:0.3em;margin-bottom:4px;}.logo span{color:#b68b2e;}.title{font-family:'Cormorant Garamond',serif;font-size:32px;margin:32px 0 24px;}.grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;padding:24px;background:#f5f3ef;border-radius:8px;margin-bottom:32px;}.label{font-size:9px;letter-spacing:0.15em;text-transform:uppercase;color:#8a8070;margin-bottom:4px;}.value{font-size:15px;font-weight:600;}</style></head><body><div class="logo">VOLLARD <span>BLACK</span></div><div style="font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:#8a8070;margin-bottom:32px;">Certificate of Purchase</div><div class="title">${purchase.artworkTitle||'Artwork'}</div><div class="grid"><div><div class="label">Purchaser</div><div class="value">${bName}</div></div><div><div class="label">Purchase Date</div><div class="value">${purchase.date||new Date().toLocaleDateString('en-ZA')}</div></div><div><div class="label">Sale Price</div><div class="value">R ${fmt(purchase.salePrice)}</div></div><div><div class="label">Certificate No</div><div class="value">VB-${purchase.id?.slice(-8)?.toUpperCase()||'N/A'}</div></div></div><div style="font-size:12px;color:#4a4440;line-height:1.9;">This certificate confirms the purchase of the above artwork through Vollard Black (Pty) Ltd. This document serves as proof of purchase and is issued on the date shown above.</div><div style="margin-top:48px;display:grid;grid-template-columns:1fr 1fr;gap:40px;"><div style="border-top:1px solid #ccc;padding-top:8px;font-size:11px;color:#8a8070;">Purchaser signature</div><div style="border-top:1px solid #ccc;padding-top:8px;font-size:11px;color:#8a8070;">Vollard Black authorised signature</div></div></body></html>`;
    w.document.write(html); w.document.close();
  };

  const payWithIkhoka = async({amount, description, referenceId, type}) => {
    try {
      const res = await fetch('/api/ikhoka-paylink', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({
          amount,
          description,
          scheduleId: referenceId,
          monthNumber: 1,
          collectorEmail: session.user.email,
          portalType: 'buyer',
          paymentType: type,
        }),
      });
      const data = await res.json();
      if (data.paylinkUrl) {
        window.location.href = data.paylinkUrl;
      } else {
        const errMsg = data.error || data.details?.message || data.details?.responseDescription || 'Please try again.';
        alert('Payment error: ' + errMsg);
      }
    } catch(e) {
      alert('Payment error. Please try again.');
    }
  };
  const displayName = buyer?(`${buyer.firstName||''} ${buyer.lastName||''}`.trim()||buyer.companyName||''):session.user.email.split('@')[0];
  const liveAuctions = auctions.filter(a=>a.status==='Live');
  const isOutbid = bids.some(b=>{ const a=auctions.find(x=>x.id===b.auctionId); return a?.status==='Live'&&a?.leadBidderId!==buyer?.id; });

  if(initialLoading) return (
    <div style={{...S.page,display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{textAlign:'center'}}>
        <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:28,fontWeight:300,letterSpacing:8,color:'#1a1714',marginBottom:8}}>VOLLARD <span style={{color:'#b68b2e'}}>BLACK</span></div>
        <div style={{fontSize:11,color:'#8a8070',letterSpacing:3,textTransform:'uppercase'}}>Loading…</div>
      </div>
    </div>
  );


  return (
    <div style={S.page}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600&family=DM+Sans:wght@300;400;500;600&display=swap');*{box-sizing:border-box;}input:focus,select:focus,textarea:focus{border-color:#b68b2e!important;box-shadow:0 0 0 3px rgba(182,139,46,0.12)!important;outline:none;}`}</style>
      <div style={{background:'#fff',borderBottom:`1px solid ${'rgba(182,139,46,0.18)'}`,padding:'0 20px',height:56,display:'flex',alignItems:'center',justifyContent:'space-between',position:'sticky',top:0,zIndex:50,boxShadow:'0 1px 12px rgba(0,0,0,0.06)'}}>
        <a href="/" style={{textDecoration:'none',display:'flex',alignItems:'center',gap:10}}>
          <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:18,fontWeight:300,letterSpacing:'0.20em',color:'#1a1714'}}>VOLLARD <span style={{color:'#b68b2e'}}>BLACK</span></div>
          <div style={{width:1,height:14,background:'rgba(182,139,46,0.25)'}}/>
          <span style={{fontSize:9,letterSpacing:'0.18em',textTransform:'uppercase',color:'#c45c4a',fontWeight:700}}>Buyer</span>
        </a>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
{/* Notification bell */}
          <div style={{position:'relative'}}>
            <button onClick={()=>setNotifs(p=>p.map(n=>({...n,read:true})))} style={{position:'relative',padding:'7px 12px',borderRadius:8,border:`1px solid ${'rgba(182,139,46,0.18)'}`,background:'transparent',color:'#8a8070',cursor:'pointer',fontSize:14,lineHeight:1}}>🔔{notifs.filter(n=>!n.read).length>0&&<span style={{position:'absolute',top:-4,right:-4,width:16,height:16,borderRadius:'50%',background:'#c45c4a',color:'#fff',fontSize:9,fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center'}}>{notifs.filter(n=>!n.read).length}</span>}</button>
          </div>
          <button onClick={()=>window.open('https://wa.me/27826503393?text='+encodeURIComponent('Hi Vollard Black, I need assistance with my buyer portal.'),'_blank')} style={{padding:'7px 12px',borderRadius:8,border:'1px solid rgba(37,211,102,0.30)',background:'rgba(37,211,102,0.08)',color:'#25d366',cursor:'pointer',fontSize:13,fontWeight:600,fontFamily:"'DM Sans',sans-serif"}}>Chat</button>
          <span style={{fontSize:13,color:'#6b635a',fontWeight:500}}>{displayName}</span>
          <button onClick={signOut} style={{padding:'7px 14px',borderRadius:8,border:`1px solid ${'rgba(182,139,46,0.18)'}`,background:'transparent',color:'#8a8070',cursor:'pointer',fontSize:11,fontFamily:"'DM Sans',sans-serif"}}>Sign Out</button>
        </div>
      </div>

      {/* Toast */}
      <style>{`@keyframes slideDown{from{opacity:0;transform:translateX(-50%) translateY(-16px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}`}</style>
      {toast&&<div onClick={()=>setToast(null)} style={{position:'fixed',top:72,left:'50%',transform:'translateX(-50%)',zIndex:400,maxWidth:380,width:'calc(100% - 32px)',padding:'14px 18px',borderRadius:12,boxShadow:'0 8px 32px rgba(0,0,0,0.22)',background:toast.type==='outbid'?'#c45c4a':toast.type==='sold'?'#2d7a4a':'#1a1714',color:'#fff',fontSize:13,fontWeight:600,display:'flex',alignItems:'center',gap:10,cursor:'pointer',animation:'slideDown 0.25s ease'}}><span style={{flex:1}}>{toast.msg}</span><span style={{opacity:0.5,fontSize:18,flexShrink:0}}>x</span></div>}

      {/* Header */}
      <div style={{background:'#ffffff',borderBottom:'1px solid rgba(182,139,46,0.18)',padding:'24px 20px 20px'}}>
        <div style={{maxWidth:960,margin:'0 auto'}}>
          <div style={{display:'flex',gap:16,alignItems:'center',marginBottom:20,flexWrap:'wrap'}}>
            <div style={{width:56,height:56,borderRadius:'50%',background:'rgba(196,92,74,0.08)',border:'2px solid rgba(196,92,74,0.22)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,fontSize:22,color:'#c45c4a',fontFamily:"'Cormorant Garamond',serif"}}>
              {displayName?displayName[0].toUpperCase():'B'}
            </div>
            <div>
              <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:28,fontWeight:300,color:'#1a1714'}}>{displayName}</div>
              <div style={{fontSize:12,color:'#8a8070',marginTop:2}}>Art Collector · {buyer?.auctionApproved?'✓ Auction Approved':'Gallery Access'}</div>
            </div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10}}>
            {[['Gallery',artworks.length+' works'],['Saved',watchlist.length+' items'],['Bids',bids.length],['Purchases',purchases.length]].map(([l,v])=>(
              <div key={l} style={{background:'#f7f5f1',border:'1px solid rgba(182,139,46,0.18)',borderRadius:10,padding:'12px 10px',textAlign:'center'}}>
                <div style={{fontSize:9,letterSpacing:'0.16em',textTransform:'uppercase',color:'#8a8070',marginBottom:4}}>{l}</div>
                <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,fontWeight:300,color:'#1a1714'}}>{v}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div style={{maxWidth:960,margin:'0 auto',padding:'16px 16px 100px'}}>
        {/* Sound unlock — one tap needed for browser audio policy */}
        {!soundReady&&(
          <div onClick={()=>unlockSound()} style={{padding:'10px 16px',background:'rgba(26,23,20,0.04)',border:'1px solid rgba(26,23,20,0.12)',borderRadius:10,marginBottom:10,display:'flex',alignItems:'center',gap:10,flexWrap:'wrap',cursor:'pointer'}}>
            <span style={{fontSize:16}}>🔊</span>
            <span style={{fontSize:12,color:'#2a2622',flex:1}}>Tap to enable auction sounds</span>
            <span style={{fontSize:11,color:'#8a8070'}}>Tap →</span>
          </div>
        )}
        {!notifEnabled&&typeof window!=='undefined'&&'Notification' in window&&Notification.permission!=='denied'&&(
          <div style={{padding:'10px 16px',background:'rgba(182,139,46,0.06)',border:'1px solid rgba(182,139,46,0.2)',borderRadius:10,marginBottom:10,display:'flex',alignItems:'center',gap:10,flexWrap:'wrap'}}>
            <span style={{fontSize:12,color:'#8a6a1e',flex:1}}>Enable push notifications for instant outbid alerts</span>
            <button onClick={()=>requestNotifPermission().then(g=>setNotifEnabled(g))} style={{padding:'6px 14px',borderRadius:6,border:'none',background:'linear-gradient(135deg,#b68b2e,#8a6a1e)',color:'#fff',fontSize:11,fontWeight:600,cursor:'pointer',fontFamily:"'DM Sans',sans-serif",flexShrink:0}}>Enable</button>
          </div>
        )}
        {liveAuctions.length>0&&<div onClick={()=>{setTab('auctions');setTimeout(()=>window.scrollTo({top:0,behavior:'smooth'}),50);}} style={{padding:'12px 18px',background:'rgba(74,158,107,0.08)',border:'1px solid rgba(74,158,107,0.25)',borderRadius:10,marginBottom:10,cursor:'pointer',display:'flex',alignItems:'center',gap:10}}><span style={{color:'#4a9e6b'}}>●</span><span style={{fontSize:13,fontWeight:600,color:'#4a9e6b'}}>{liveAuctions.length} live auction{liveAuctions.length>1?'s':''} happening now</span><span style={{fontSize:11,color:'#4a9e6b',marginLeft:'auto'}}>Bid now →</span></div>}
        {isOutbid&&<div onClick={()=>setTab('auctions')} style={{padding:'12px 18px',background:'rgba(196,92,74,0.06)',border:'1px solid rgba(196,92,74,0.25)',borderRadius:10,marginBottom:10,cursor:'pointer',display:'flex',alignItems:'center',gap:10}}><span style={{color:'#c45c4a'}}>⚠</span><span style={{fontSize:13,fontWeight:600,color:'#c45c4a'}}>You've been outbid — act now</span><span style={{fontSize:11,color:'#c45c4a',marginLeft:'auto'}}>Bid →</span></div>}
        {enquiryMsg&&<div style={{padding:'12px 16px',background:'rgba(74,158,107,0.08)',border:'1px solid rgba(74,158,107,0.2)',borderRadius:8,marginBottom:10,fontSize:13,color:'#4a9e6b'}}>{enquiryMsg}</div>}

        <div style={{display:'flex',flexWrap:'wrap',gap:8,marginBottom:24,padding:'4px 0'}}>
          {[['gallery',`Gallery${artworks.length>0?' ('+artworks.length+')':''}`],['watchlist',`Saved${watchlist.length>0?' ('+watchlist.length+')':''}`],['auctions',`Auctions${liveAuctions.length>0?' 🔴':''}${isOutbid?' ⚠':''}`],['mybids',`My Bids${bids.length>0?' ('+bids.length+')':''}`],['purchases','Purchases'],['profile','Profile']].map(([id,lbl])=>(
            <button key={id} onClick={()=>setTab(id)} style={{padding:'9px 20px',borderRadius:24,border:tab===id?'none':'1px solid rgba(182,139,46,0.22)',background:tab===id?'linear-gradient(135deg,#b68b2e,#8a6a1e)':'#fff',color:tab===id?'#fff':'#6b635a',fontSize:13,fontWeight:tab===id?600:400,cursor:'pointer',fontFamily:"'DM Sans',sans-serif",whiteSpace:'nowrap',transition:'all 0.2s',boxShadow:tab===id?'0 4px 12px rgba(182,139,46,0.28)':'none'}}>{lbl}</button>
          ))}
        </div>

        {/* GALLERY */}
        {tab==='gallery'&&(
          <div>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:10,marginBottom:16}}>
              <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:24,fontWeight:300,color:'#1a1714'}}>Available Artworks</div>
              <input placeholder="Search..." value={search} onChange={e=>setSearch(e.target.value)} style={{...S.input,maxWidth:220,padding:'9px 12px'}}/>
            </div>
            {artworks.filter(a=>(a.title+' '+(a.artist||'')).toLowerCase().includes(search.toLowerCase())).length===0?(
              <div style={{...S.card,textAlign:'center',padding:48}}><div style={{fontSize:32,marginBottom:12,color:'#b68b2e'}}>◆</div><div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,color:'#1a1714',marginBottom:8}}>No Artworks Available</div><div style={{fontSize:13,color:'#8a8070'}}>Check back soon.</div></div>
            ):(
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))',gap:16}}>
                {artworks.filter(a=>(a.title+' '+(a.artist||'')).toLowerCase().includes(search.toLowerCase())).map(art=>(
                  <div key={art.id} style={{background:'#fff',border:'1px solid rgba(182,139,46,0.18)',borderRadius:12,overflow:'hidden'}}>
                    <div style={{height:200,background:'#f0ede8',overflow:'hidden',cursor:art.imageUrl?'zoom-in':'default',position:'relative'}} onClick={()=>art.imageUrl&&setZoomImg(art.imageUrl)}>
                      {art.imageUrl?<img src={art.imageUrl} alt={art.title} style={{width:'100%',height:'100%',objectFit:'cover'}}/>:<div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',color:'#b68b2e',fontSize:32}}>◆</div>}
                      <button onClick={e=>{e.stopPropagation();toggleWatchlist(art.id);}} style={{position:'absolute',top:8,right:8,width:34,height:34,borderRadius:'50%',background:'rgba(255,255,255,0.92)',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,boxShadow:'0 2px 8px rgba(0,0,0,0.15)'}}>{watchlist.includes(art.id)?'❤️':'🤍'}</button>
                    </div>
                    <div style={{padding:16}}>
                      <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:17,color:'#1a1714',marginBottom:2}}>{art.title}</div>
                      <div style={{fontSize:11,color:'#8a8070',marginBottom:8}}>{art.artist||'—'} · {art.medium||'—'}{art.year?' · '+art.year:''}</div>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
                        <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,...S.gold}}>R {fmt(art.recommendedPrice)}</div>
                        {art.galleryName&&<div style={{fontSize:11,color:'#8a8070'}}>{art.galleryName}</div>}
                      </div>
                      {art.description&&<div style={{fontSize:12,color:'#6b635a',marginBottom:10,fontStyle:'italic',lineHeight:1.5}}>{art.description}</div>}
                      {art.status==='Reserved'
                        ?<div style={{padding:'9px',background:'rgba(182,139,46,0.08)',border:'1px solid rgba(182,139,46,0.20)',borderRadius:8,textAlign:'center',fontSize:12,color:'#b68b2e',fontWeight:600}}>⚖ In Auction</div>
                        :<div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                          <button onClick={()=>toggleWatchlist(art.id)} style={{padding:'9px 12px',borderRadius:8,border:'1px solid rgba(182,139,46,0.25)',background:watchlist.includes(art.id)?'rgba(196,92,74,0.08)':'transparent',color:watchlist.includes(art.id)?'#c45c4a':'#8a8070',cursor:'pointer',fontSize:14,flexShrink:0}}>{watchlist.includes(art.id)?'❤':'🤍'}</button>
                          <button onClick={()=>setArtDetail(art)} style={{padding:'9px 12px',borderRadius:8,border:'1px solid rgba(182,139,46,0.25)',background:'transparent',color:'#6b635a',cursor:'pointer',fontSize:11,fontFamily:"'DM Sans',sans-serif",flexShrink:0}}>View</button>
                          <button onClick={()=>setEnquiry(art)} style={{...S.btn(false),flex:1,padding:'9px',fontSize:11}}>Enquire</button>
                          <button onClick={()=>payWithIkhoka({amount:art.recommendedPrice,description:`Vollard Black: ${art.title}`,referenceId:art.id.slice(-8),type:'gallery'})} style={{...S.btn(true),flex:1,padding:'9px',fontSize:11}}>💳 Pay Now</button>
                        </div>
                      }
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* AUCTIONS */}
        {tab==='auctions'&&(
          <div>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:24,fontWeight:300,color:'#1a1714',marginBottom:14}}>Auctions</div>
            {buyer?.auctionApproved&&<div style={{padding:'10px 16px',background:'rgba(74,158,107,0.06)',border:'1px solid rgba(74,158,107,0.2)',borderRadius:10,marginBottom:14,display:'flex',alignItems:'center',gap:8}}><span style={{color:'#4a9e6b'}}>✓</span><span style={{fontSize:13,fontWeight:600,color:'#4a9e6b'}}>Auction access approved — tap Place Bid on any live auction below</span></div>}
            {buyer&&!buyer.auctionApproved&&(
              <div style={{padding:'16px 18px',background:'rgba(182,139,46,0.06)',border:'1px solid rgba(182,139,46,0.25)',borderRadius:12,marginBottom:16}}>
                <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:18,color:'#1a1714',marginBottom:6}}>Request Bidding Access</div>
                <div style={{fontSize:13,color:'#6b635a',marginBottom:14,lineHeight:1.6}}>To place bids you need to be KYC verified. Click below — Vollard Black will be notified and activate your access.</div>
                <AuctionAccessButton buyer={buyer} onRefresh={()=>loadData(false)}/>
              </div>
            )}
            {auctions.length===0?(
              <div style={{...S.card,textAlign:'center',padding:48}}><div style={{fontSize:32,marginBottom:12,color:'#b68b2e'}}>◆</div><div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,color:'#1a1714',marginBottom:8}}>No Auctions</div><div style={{fontSize:13,color:'#8a8070'}}>Check back soon.</div></div>
            ):auctions.filter(auc=>{
                if(auc.status==='Live'||auc.status==='Frozen') return true;
                // Show closed auctions only if buyer placed a bid on them
                return bids.some(b=>b.auctionId===auc.id);
              }).map(auc=>(
              <AuctionCard key={auc.id} auc={auc} buyer={buyer} myBids={bids} onBid={()=>setBidTarget(auc)}/>
            ))}
          </div>
        )}

        {/* MY BIDS */}
        {tab==='mybids'&&(
          <div>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:24,fontWeight:300,color:'#1a1714',marginBottom:16}}>My Bids</div>
            {bids.length===0?<div style={{...S.card,textAlign:'center',padding:40}}><div style={{fontSize:14,color:'#8a8070'}}>No bids placed yet.</div></div>:(
              <div style={S.card}><div style={{overflowX:'auto'}}>
                <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
                  <thead><tr style={{borderBottom:'1px solid rgba(182,139,46,0.2)'}}>{['Artwork','Your Bid','Date','Status'].map(h=><th key={h} style={{padding:'8px 10px',textAlign:h==='Your Bid'?'right':'left',fontSize:10,letterSpacing:1,textTransform:'uppercase',color:'#8a8070',fontWeight:500,whiteSpace:'nowrap'}}>{h}</th>)}</tr></thead>
                  <tbody>{bids.map(b=>{
                    const auc=auctions.find(a=>a.id===b.auctionId);
                    const won=auc?.status==='Sold'&&auc?.leadBidderId===buyer?.id;
                    const leading=auc?.status==='Live'&&auc?.leadBidderId===buyer?.id;
                    const outbid=auc?.status==='Live'&&auc?.leadBidderId!==buyer?.id;
                    return(<tr key={b.id} style={{borderBottom:'1px solid rgba(182,139,46,0.08)'}}>
                      <td style={{padding:'10px',fontWeight:500}}>{auc?.title||'—'}</td>
                      <td style={{padding:'10px',textAlign:'right',...S.gold,fontFamily:"'Cormorant Garamond',serif",fontSize:15}}>R {fmt(b.amount)}</td>
                      <td style={{padding:'10px',color:'#8a8070',fontSize:12}}>{b.timestamp?.slice(0,10)||'—'}</td>
                      <td style={{padding:'10px'}}>
                        {won&&<span style={{fontSize:11,fontWeight:700,color:'#4a9e6b',background:'rgba(74,158,107,0.1)',padding:'3px 8px',borderRadius:4}}>🏆 Won</span>}
                        {leading&&<span style={{fontSize:11,fontWeight:700,color:'#4a9e6b',background:'rgba(74,158,107,0.1)',padding:'3px 8px',borderRadius:4}}>● Leading</span>}
                        {outbid&&<span onClick={()=>setTab('auctions')} style={{fontSize:11,fontWeight:600,color:'#c45c4a',background:'rgba(196,92,74,0.08)',padding:'3px 8px',borderRadius:4,cursor:'pointer'}}>⚠ Outbid</span>}
                        {!won&&!leading&&!outbid&&<span style={{fontSize:11,color:'#8a8070'}}>{auc?.status||'—'}</span>}
                      </td>
                    </tr>);
                  })}</tbody>
                </table>
              </div></div>
            )}
          </div>
        )}

        {/* TERMS */}
        {tab==='terms'&&(
          <div>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:24,fontWeight:300,color:'#1a1714',marginBottom:16}}>Buyer Terms & Conditions</div>
            <div style={S.card}>
              <div style={{fontSize:12,color:'#8a8070',marginBottom:16}}>Vollard Black (Pty) Ltd · Hermanus, South Africa</div>
              {[
                ['1. Registration & KYC','All buyers must complete KYC verification before purchasing or bidding, including a valid government-issued ID.'],
                ['2. Auction Participation','All bids are binding. The winning bidder is obligated to complete the purchase at the winning bid price. Payment is made directly to the License Holder per the auction settlement report.'],
                ['3. Direct Purchases','Gallery enquiries are expressions of interest only. A sale is concluded only upon written confirmation from Vollard Black and receipt of full payment.'],
                ['4. Artwork Condition','Vollard Black accurately represents artworks. Buyers are encouraged to view in person. Minor variations between photos and physical works are not grounds for return.'],
                ['5. Refunds','All sales are final. Refunds are not available unless an artwork is materially misrepresented. Title passes to the buyer on full payment only.'],
                ['6. Governing Law','These terms are governed by South African law. Disputes are resolved in the Western Cape High Court.'],
              ].map(([title,text])=>(
                <div key={title} style={{marginBottom:14,paddingBottom:14,borderBottom:'1px solid rgba(182,139,46,0.10)'}}>
                  <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:16,color:'#1a1714',marginBottom:6}}>{title}</div>
                  <div style={{fontSize:13,color:'#4a4440',lineHeight:1.8}}>{text}</div>
                </div>
              ))}
              <div style={{padding:'10px 14px',background:'rgba(182,139,46,0.06)',borderRadius:8,fontSize:12,color:'#8a6a1e',marginTop:8}}>
                Contact: <strong>concierge@vollardblack.com</strong>
              </div>
            </div>
          </div>
        )}
        {/* PURCHASES */}
        {tab==='purchases'&&(
          <div>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:24,fontWeight:300,color:'#1a1714',marginBottom:16}}>Purchases & Payments</div>

            {/* Auction wins pending payment */}
            {auctions.filter(a=>a.status==='Sold'&&a.leadBidderId===buyer?.id&&!purchases.some(p=>p.auctionId===a.id||p.artworkId===a.artworkId)).map(a=>(
              <div key={a.id} style={{...S.card,border:'2px solid rgba(74,158,107,0.40)',marginBottom:12}}>
                <div style={{fontSize:10,fontWeight:700,letterSpacing:'0.2em',textTransform:'uppercase',color:'#4a9e6b',marginBottom:10}}>🏆 Auction Won — Payment Due</div>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:12,marginBottom:14}}>
                  <div>
                    <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,color:'#1a1714',marginBottom:4}}>{a.title}</div>
                    <div style={{fontSize:12,color:'#8a8070'}}>Closed {a.closedAt?.slice(0,10)||'—'} · Winning bid</div>
                  </div>
                  <div style={{textAlign:'right'}}>
                    <div style={{fontSize:10,color:'#8a8070',letterSpacing:1,textTransform:'uppercase'}}>Amount Due</div>
                    <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:26,fontWeight:600,color:'#4a9e6b'}}>R {fmt(a.currentBid)}</div>
                  </div>
                </div>
                <div style={{padding:'10px 14px',background:'rgba(74,158,107,0.06)',borderRadius:8,fontSize:12,color:'#4a4440',lineHeight:1.7,marginBottom:14}}>
                  As the winning bidder, please complete your payment. The artwork will be released to you once payment is confirmed and all license fees are settled.
                </div>
                <button
                  onClick={()=>payWithIkhoka({amount:a.currentBid,description:`Vollard Black Auction Purchase: ${a.title}`,referenceId:a.id.slice(-8),type:'auction'})}
                  style={{padding:'13px 28px',borderRadius:8,border:'none',background:'linear-gradient(135deg,#4a9e6b,#2d7a4a)',color:'#fff',cursor:'pointer',fontSize:13,fontWeight:700,fontFamily:"'DM Sans',sans-serif",boxShadow:'0 4px 14px rgba(74,158,107,0.3)'}}>
                  💳 Pay R {fmt(a.currentBid)} via iKhoka
                </button>
              </div>
            ))}

            {/* Completed purchases */}
            {purchases.length===0&&auctions.filter(a=>a.status==='Sold'&&a.leadBidderId===buyer?.id).length===0&&(
              <div style={{...S.card,textAlign:'center',padding:40}}><div style={{fontSize:14,color:'#8a8070'}}>No purchases recorded yet.</div></div>
            )}
            {purchases.map(p=>(
              <div key={p.id} style={S.card}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:10}}>
                  <div>
                    <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:18,color:'#1a1714',marginBottom:4}}>{p.artworkTitle}</div>
                    <div style={{display:'flex',gap:8,alignItems:'center',marginTop:4,flexWrap:'wrap'}}>
                      <span style={{fontSize:12,color:'#8a8070'}}>{p.date||'—'}</span>
                      <span style={{fontSize:10,fontWeight:600,padding:'2px 8px',borderRadius:4,background:p.source==='auction'?'rgba(74,158,107,0.12)':'rgba(182,139,46,0.12)',color:p.source==='auction'?'#4a9e6b':'#b68b2e'}}>{p.source==='auction'?'⚖ Auction':'Direct'}</span>
                    </div>
                  </div>
                  <div style={{textAlign:'right'}}>
                    <div style={{fontSize:9,color:'#8a8070',letterSpacing:1,textTransform:'uppercase'}}>Sale Price</div>
                    <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,...S.gold}}>R {fmt(p.salePrice)}</div>
                    <div style={{fontSize:11,color:'#4a9e6b',marginTop:2,fontWeight:600}}>✓ Payment Complete</div>
                    <button onClick={()=>generatePurchaseCert(p)} style={{marginTop:6,padding:'5px 12px',borderRadius:8,border:'1px solid rgba(182,139,46,0.25)',background:'transparent',color:'#b68b2e',cursor:'pointer',fontSize:10,fontWeight:600,fontFamily:"'DM Sans',sans-serif"}}>📜 Certificate</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* WATCHLIST */}
        {tab==='watchlist'&&(
          <div>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:28,fontWeight:300,color:'#1a1714',marginBottom:8}}>Saved Artworks</div>
            <div style={{fontSize:13,color:'#8a8070',marginBottom:20}}>Artworks you've saved for later.</div>
            {watchlist.length===0?<div style={{background:'#fff',border:`1px solid ${'rgba(182,139,46,0.18)'}`,borderRadius:16,padding:56,textAlign:'center'}}><div style={{fontSize:44,marginBottom:12,opacity:0.2}}>🤍</div><div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,color:'#1a1714',marginBottom:8}}>No saved artworks</div><div style={{fontSize:13,color:'#8a8070',marginBottom:20}}>Tap the heart on any artwork to save it here.</div><button onClick={()=>setTab('gallery')} style={{padding:'11px 28px',borderRadius:24,border:'none',background:'linear-gradient(135deg,#b68b2e,#8a6a1e)',color:'#fff',fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:"'DM Sans',sans-serif"}}>Browse Gallery →</button></div>
            :<div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))',gap:16}}>
              {artworks.filter(a=>watchlist.includes(a.id)).map(art=>(
                <div key={art.id} style={{background:'#fff',border:'1px solid rgba(182,139,46,0.18)',borderRadius:12,overflow:'hidden'}}>
                  <div style={{height:200,background:'#f0ede8',overflow:'hidden',position:'relative',cursor:art.imageUrl?'zoom-in':'default'}} onClick={()=>art.imageUrl&&setZoomImg(art.imageUrl)}>
                    {art.imageUrl?<img src={art.imageUrl} alt={art.title} style={{width:'100%',height:'100%',objectFit:'cover'}}/>:<div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',color:'#b68b2e',fontSize:32}}>◆</div>}
                    <button onClick={e=>{e.stopPropagation();toggleWatchlist(art.id);}} style={{position:'absolute',top:8,right:8,width:34,height:34,borderRadius:'50%',background:'rgba(255,255,255,0.92)',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,boxShadow:'0 2px 8px rgba(0,0,0,0.15)'}}>❤️</button>
                  </div>
                  <div style={{padding:'14px 16px'}}>
                    <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:18,color:'#1a1714',marginBottom:4}}>{art.title}</div>
                    <div style={{fontSize:12,color:'#8a8070',marginBottom:10}}>{art.artist||'—'} · {art.medium||'—'}</div>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
                      <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,color:'#b68b2e',fontWeight:600}}>R {fmt(art.recommendedPrice)}</span>
                    </div>
                    <div style={{display:'flex',gap:8}}>
                      <button onClick={()=>setEnquiry(art)} style={{flex:1,padding:'9px',borderRadius:10,border:'1px solid rgba(182,139,46,0.28)',background:'transparent',color:'#b68b2e',cursor:'pointer',fontSize:11,fontWeight:600,fontFamily:"'DM Sans',sans-serif"}}>Enquire</button>
                      <button onClick={()=>payWithIkhoka({amount:art.recommendedPrice,description:`Vollard Black: ${art.title}`,referenceId:art.id.slice(-8),type:'gallery'})} style={{flex:1,padding:'9px',borderRadius:10,border:'none',background:'linear-gradient(135deg,#b68b2e,#8a6a1e)',color:'#fff',cursor:'pointer',fontSize:11,fontWeight:600,fontFamily:"'DM Sans',sans-serif"}}>💳 Buy Now</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>}
          </div>
        )}

        {/* PROFILE */}
        
        {/* WATCHLIST */}
        {tab==='watchlist'&&(
          <div>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:28,fontWeight:300,color:'#1a1714',marginBottom:20}}>Saved Artworks</div>
            {watchlist.length===0?(
              <div style={{background:'#fff',border:`1px solid ${'rgba(182,139,46,0.18)'}`,borderRadius:16,padding:56,textAlign:'center'}}>
                <div style={{fontSize:44,opacity:0.2,marginBottom:12}}>🤍</div>
                <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,color:'#1a1714',marginBottom:8}}>No saved artworks</div>
                <div style={{fontSize:13,color:'#8a8070',marginBottom:20}}>Tap the heart icon on any artwork in the gallery to save it here.</div>
                <button onClick={()=>setTab('gallery')} style={{padding:'11px 24px',borderRadius:24,border:'none',background:`linear-gradient(135deg,#b68b2e,#8a6a1e)`,color:'#fff',fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:"'DM Sans',sans-serif"}}>Browse Gallery →</button>
              </div>
            ):(
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:16}}>
                {artworks.filter(a=>watchlist.includes(a.id)).map(art=>(
                  <div key={art.id} style={{background:'#fff',border:`1px solid ${'rgba(182,139,46,0.18)'}`,borderRadius:16,overflow:'hidden'}}>
                    <div style={{position:'relative',height:200,background:'#e8e4dd',cursor:'pointer'}} onClick={()=>setArtDetail(art)}>
                      {art.imageUrl?<img src={art.imageUrl} alt="" style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}}/>:<div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:40,opacity:0.2}}>🖼</div>}
                      <button onClick={e=>{e.stopPropagation();toggleWatchlist(art.id);}} style={{position:'absolute',top:10,right:10,width:36,height:36,borderRadius:'50%',border:'none',background:'rgba(0,0,0,0.5)',color:'#c45c4a',cursor:'pointer',fontSize:16,display:'flex',alignItems:'center',justifyContent:'center'}}>❤</button>
                    </div>
                    <div style={{padding:'14px 16px'}}>
                      <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:18,color:'#1a1714',marginBottom:4}}>{art.title}</div>
                      <div style={{fontSize:12,color:'#8a8070',marginBottom:8}}>{art.artistName||art.artist||'—'} · {art.medium||'—'}</div>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                        <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:18,color:'#b68b2e',fontWeight:600}}>R {fmt(art.recommendedPrice)}</span>
                        <button onClick={()=>setEnquiry(art)} style={{padding:'8px 16px',borderRadius:20,border:'none',background:`linear-gradient(135deg,#b68b2e,#8a6a1e)`,color:'#fff',fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:"'DM Sans',sans-serif"}}>Enquire</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

{tab==='profile'&&(
          <div>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16,flexWrap:'wrap',gap:10}}>
              <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:24,fontWeight:300,color:'#1a1714'}}>My Profile</div>
              {!profileEdit&&buyer&&<button onClick={()=>setProfileEdit(true)} style={S.btn(false)}>Edit</button>}
            </div>
            {saveMsg&&<div style={{padding:'10px 14px',background:'rgba(74,158,107,0.08)',border:'1px solid rgba(74,158,107,0.2)',borderRadius:8,fontSize:13,color:'#4a9e6b',marginBottom:14}}>✓ {saveMsg}</div>}
            {!buyer?(
              <div style={{...S.card,textAlign:'center',padding:40}}><div style={{fontSize:14,color:'#8a8070'}}>Profile not linked yet. Contact Vollard Black.</div></div>
            ):!profileEdit?(
              <div>
                <div style={S.card}>
                  <div style={{fontSize:10,fontWeight:700,letterSpacing:'0.16em',textTransform:'uppercase',color:'#b68b2e',marginBottom:14}}>Personal Information</div>
                  {[
                    ['Name',`${buyer.firstName||''} ${buyer.lastName||''}`.trim()||buyer.companyName||'—'],
                    ['Email',buyer.email||session.user.email||'—'],
                    ['Mobile',buyer.mobile||'—'],
                    ['ID / Passport',buyer.idNumber||'—'],
                    ['Nationality',buyer.nationality||'—'],
                    ['City',buyer.city||'—'],
                    ['Country',buyer.country||'—'],
                    ['KYC Status',buyer.kycStatus==='approved'?'✓ Approved':'⚠ Pending'],
                    ['Auction Access',buyer.auctionApproved?'✓ Approved':buyer.auctionRequested?'⏳ Requested':'Not requested'],
                  ].map(([label,value])=>(
                    <div key={label} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'9px 0',borderBottom:'1px solid rgba(182,139,46,0.08)',fontSize:13,gap:12}}>
                      <span style={{color:'#8a8070',flexShrink:0}}>{label}</span>
                      <span style={{fontWeight:500,textAlign:'right',color:String(value).includes('✓')?'#4a9e6b':String(value).includes('⚠')||String(value).includes('⏳')?'#e6be32':'#1a1714'}}>{value}</span>
                    </div>
                  ))}
                </div>
                <div style={S.card}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
                    <div style={{fontSize:10,fontWeight:700,letterSpacing:'0.16em',textTransform:'uppercase',color:'#b68b2e'}}>Banking Details</div>
                    {buyer.bankVerified
                      ?<span style={{fontSize:11,fontWeight:700,color:'#4a9e6b',background:'rgba(74,158,107,0.10)',padding:'3px 10px',borderRadius:20}}>✓ Verified</span>
                      :(buyer.bankName||buyer.accountNumber)
                        ?<span style={{fontSize:11,fontWeight:700,color:'#e6be32',background:'rgba(230,190,50,0.10)',padding:'3px 10px',borderRadius:20}}>⏳ Pending Verification</span>
                        :<span style={{fontSize:11,color:'#8a8070'}}>Not yet added — tap Edit to add</span>
                    }
                  </div>
                  {(buyer.bankName||buyer.accountNumber)?[
                    ['Bank',buyer.bankName||'—'],['Account Holder',buyer.accountHolder||'—'],
                    ['Account Number',buyer.accountNumber||'—'],['Branch Code',buyer.branchCode||'—'],
                  ].map(([label,value])=>(
                    <div key={label} style={{display:'flex',justifyContent:'space-between',padding:'9px 0',borderBottom:'1px solid rgba(182,139,46,0.08)',fontSize:13,gap:12}}>
                      <span style={{color:'#8a8070',flexShrink:0}}>{label}</span><span style={{fontWeight:500}}>{value}</span>
                    </div>
                  )):<div style={{fontSize:13,color:'#8a8070',padding:'8px 0'}}>Add your banking details so proceeds can be paid to you.</div>}
                </div>
              </div>
            ):(
              <div>
                <div style={{...S.card,marginBottom:12}}>
                  <div style={{fontSize:10,fontWeight:700,letterSpacing:'0.16em',textTransform:'uppercase',color:'#b68b2e',marginBottom:16}}>Personal Information</div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
                    {[['firstName','First Name'],['lastName','Last Name'],['mobile','Mobile'],['idNumber','ID / Passport'],['nationality','Nationality'],['city','City'],['country','Country']].map(([key,label])=>(
                      <div key={key}><label style={S.label}>{label}</label><input value={profileForm[key]||''} onChange={e=>setProfileForm(p=>({...p,[key]:e.target.value}))} style={S.input}/></div>
                    ))}
                    <div style={{gridColumn:'1/-1'}}><label style={S.label}>Address</label><textarea value={profileForm.address||''} onChange={e=>setProfileForm(p=>({...p,address:e.target.value}))} style={{...S.input,minHeight:60,resize:'vertical'}}/></div>
                  </div>
                </div>
                <div style={{...S.card,marginBottom:12}}>
                  <div style={{fontSize:10,fontWeight:700,letterSpacing:'0.16em',textTransform:'uppercase',color:'#b68b2e',marginBottom:4}}>Banking Details</div>
                  <div style={{fontSize:12,color:'#8a8070',marginBottom:16,lineHeight:1.6}}>Your payout account for any proceeds. Changes require verification by Vollard Black.</div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
                    {[['bankName','Bank Name'],['accountHolder','Account Holder'],['accountNumber','Account Number'],['branchCode','Branch Code']].map(([key,label])=>(
                      <div key={key}><label style={S.label}>{label}</label><input value={profileForm[key]||''} onChange={e=>setProfileForm(p=>({...p,[key]:e.target.value}))} style={S.input} placeholder={key==='bankName'?'e.g. FNB':key==='branchCode'?'e.g. 250655':''} inputMode={key==='accountNumber'||key==='branchCode'?'numeric':undefined}/></div>
                    ))}
                  </div>
                  <div style={{marginTop:12,padding:'10px 14px',background:'rgba(230,190,50,0.06)',border:'1px solid rgba(230,190,50,0.20)',borderRadius:8,fontSize:12,color:'#6b635a',lineHeight:1.6}}>
                    ⚠ Saving new bank details will flag your account for verification before payouts are processed.
                  </div>
                </div>
                <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}>
                  <button onClick={()=>setProfileEdit(false)} style={S.btn(false)}>Cancel</button>
                  <button onClick={saveProfile} disabled={saving} style={{...S.btn(true),opacity:saving?0.6:1}}>{saving?'Saving…':'Save Changes'}</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Artwork Detail Modal */}
      {artDetail&&<div onClick={()=>setArtDetail(null)} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.85)',zIndex:300,display:'flex',alignItems:'center',justifyContent:'center',padding:16,overflowY:'auto'}}>
        <div onClick={e=>e.stopPropagation()} style={{background:'#fff',borderRadius:20,maxWidth:520,width:'100%',overflow:'hidden',maxHeight:'90vh',overflowY:'auto'}}>
          {artDetail.imageUrl&&<img src={artDetail.imageUrl} alt="" style={{width:'100%',maxHeight:320,objectFit:'cover',display:'block'}}/>}
          <div style={{padding:'24px 20px'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:8}}>
              <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:28,color:'#1a1714',fontWeight:400,lineHeight:1.2,flex:1}}>{artDetail.title}</div>
              <button onClick={()=>toggleWatchlist(artDetail.id)} style={{marginLeft:12,padding:'8px',borderRadius:'50%',border:'1px solid rgba(182,139,46,0.25)',background:'transparent',color:watchlist.includes(artDetail.id)?'#c45c4a':'#8a8070',cursor:'pointer',fontSize:20,flexShrink:0,width:40,height:40,display:'flex',alignItems:'center',justifyContent:'center'}}>{watchlist.includes(artDetail.id)?'❤':'🤍'}</button>
            </div>
            <div style={{fontSize:14,color:'#b68b2e',fontWeight:600,marginBottom:16}}>{artDetail.artistName||artDetail.artist||'—'}</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:16}}>
              {[['Medium',artDetail.medium||'—'],['Year',artDetail.year||'—'],['Dimensions',artDetail.dimensions||'—'],['Status',artDetail.status||'—']].map(([l,v])=>(
                <div key={l} style={{padding:'10px 12px',background:'#f7f5f1',borderRadius:10}}>
                  <div style={{fontSize:9,letterSpacing:'0.14em',textTransform:'uppercase',color:'#8a8070',marginBottom:4}}>{l}</div>
                  <div style={{fontSize:13,fontWeight:600,color:'#1a1714'}}>{v}</div>
                </div>
              ))}
            </div>
            {artDetail.description&&<div style={{fontSize:13,color:'#6b635a',lineHeight:1.8,fontStyle:'italic',marginBottom:16,padding:'12px 16px',background:'rgba(182,139,46,0.05)',borderRadius:10}}>"{artDetail.description}"</div>}
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
              <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:32,color:'#b68b2e',fontWeight:600}}>R {fmt(artDetail.recommendedPrice)}</div>
            </div>
            <div style={{display:'flex',gap:10}}>
              <button onClick={()=>{setEnquiry(artDetail);setArtDetail(null);}} style={{flex:1,padding:'13px',borderRadius:12,border:'1px solid rgba(182,139,46,0.30)',background:'transparent',color:'#b68b2e',cursor:'pointer',fontSize:13,fontWeight:600,fontFamily:"'DM Sans',sans-serif"}}>Enquire</button>
              <button onClick={()=>{payWithIkhoka({amount:artDetail.recommendedPrice,description:`Vollard Black: ${artDetail.title}`,referenceId:artDetail.id.slice(-8),type:'gallery'});setArtDetail(null);}} style={{flex:1,padding:'13px',borderRadius:12,border:'none',background:'linear-gradient(135deg,#b68b2e,#8a6a1e)',color:'#fff',cursor:'pointer',fontSize:13,fontWeight:700,fontFamily:"'DM Sans',sans-serif",boxShadow:'0 4px 14px rgba(182,139,46,0.30)'}}>💳 Buy Now</button>
            </div>
            <button onClick={()=>setArtDetail(null)} style={{width:'100%',marginTop:12,padding:'12px',borderRadius:12,border:'1px solid rgba(182,139,46,0.20)',background:'transparent',color:'#8a8070',cursor:'pointer',fontSize:13,fontFamily:"'DM Sans',sans-serif"}}>Close</button>
          </div>
        </div>
      </div>}

      {/* Bottom nav */}
      <div style={{position:'fixed',bottom:0,left:0,right:0,background:'#fff',borderTop:`1px solid ${'rgba(182,139,46,0.18)'}`,padding:'8px 0',display:'flex',justifyContent:'space-around',zIndex:50,boxShadow:'0 -4px 20px rgba(0,0,0,0.08)'}}>
        {[['gallery','🖼','Gallery'],['watchlist','❤','Saved'],['auctions','⚖','Auctions'],['purchases','📦','Purchases'],['profile','👤','Profile']].map(([id,icon,lbl])=>(
          <button key={id} onClick={()=>setTab(id)} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:2,padding:'4px 8px',background:'none',border:'none',cursor:'pointer',fontFamily:"'DM Sans',sans-serif",minWidth:48,position:'relative'}}>
            <span style={{fontSize:18,opacity:tab===id?1:0.4}}>{icon}</span>
            <span style={{fontSize:9,letterSpacing:'0.06em',textTransform:'uppercase',color:tab===id?'#b68b2e':'#8a8070',fontWeight:tab===id?700:400}}>{lbl}</span>
            {id==='auctions'&&liveAuctions.length>0&&<div style={{position:'absolute',top:0,right:4,width:8,height:8,borderRadius:'50%',background:'#c45c4a'}}/>}
            {id==='watchlist'&&watchlist.length>0&&<div style={{position:'absolute',top:0,right:4,width:8,height:8,borderRadius:'50%',background:'#c45c4a'}}/>}
          </button>
        ))}
      </div>

      {/* Zoom */}
      {zoomImg&&<div onClick={()=>setZoomImg(null)} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.92)',zIndex:300,display:'flex',alignItems:'center',justifyContent:'center',padding:20,cursor:'zoom-out'}}><button onClick={()=>setZoomImg(null)} style={{position:'absolute',top:20,right:24,background:'none',border:'none',color:'rgba(255,255,255,0.7)',fontSize:36,cursor:'pointer',lineHeight:1}}>×</button><img src={zoomImg} alt="" style={{maxWidth:'100%',maxHeight:'90vh',objectFit:'contain',borderRadius:8}}/></div>}

      {/* Enquiry Modal */}
      {enquiry&&<div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',zIndex:200,display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
        <div style={{background:'#fff',borderRadius:16,padding:28,maxWidth:460,width:'100%'}}>
          <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,color:'#1a1714',marginBottom:4}}>Enquire to Purchase</div>
          <div style={{fontSize:12,color:'#8a8070',marginBottom:20}}>Submitting will open WhatsApp with a pre-filled message to Vollard Black.</div>
          <div style={{display:'flex',gap:14,marginBottom:20}}>
            {enquiry.imageUrl&&<div style={{width:80,height:80,borderRadius:8,overflow:'hidden',flexShrink:0}}><img src={enquiry.imageUrl} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/></div>}
            <div><div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:18,color:'#1a1714'}}>{enquiry.title}</div><div style={{fontSize:12,color:'#8a8070',marginTop:2}}>{enquiry.artist||'—'} · {enquiry.medium||'—'}</div><div style={{fontSize:16,fontWeight:600,color:'#b68b2e',marginTop:4}}>R {fmt(enquiry.recommendedPrice)}</div></div>
          </div>
          <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}><button onClick={()=>setEnquiry(null)} style={S.btn(false)}>Cancel</button><button onClick={sendEnquiry} style={S.btn(true)}>Send via WhatsApp</button></div>
        </div>
      </div>}

      {/* Bid Modal */}
      {bidTarget&&buyer&&<BidModal auction={bidTarget} buyer={buyer} myBids={bids} onClose={()=>setBidTarget(null)} onBidPlaced={()=>{setBidTarget(null);loadData(false);}}/>}

      {/* Mobile bottom nav */}
      <div style={{position:'fixed',bottom:0,left:0,right:0,background:'#fff',borderTop:`1px solid ${'rgba(182,139,46,0.18)'}`,padding:'8px 0',display:'flex',justifyContent:'space-around',zIndex:50,boxShadow:'0 -4px 20px rgba(0,0,0,0.08)'}}>
        {[['gallery','🖼','Gallery'],['watchlist','❤','Saved'],['auctions','⚖','Auctions'],['purchases','🏆','Purchases'],['profile','👤','Profile']].map(([id,icon,l])=>(
          <button key={id} onClick={()=>setTab(id)} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:2,padding:'4px 8px',background:'none',border:'none',cursor:'pointer',fontFamily:"'DM Sans',sans-serif"}}>
            <span style={{fontSize:18,opacity:tab===id?1:0.4}}>{icon}</span>
            <span style={{fontSize:9,letterSpacing:'0.06em',textTransform:'uppercase',color:tab===id?'#b68b2e':'#8a8070',fontWeight:tab===id?700:400}}>{l}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── KYC Docs Banner ─────────────────────────────────────────
function KycBanner({email}){
  const[uploading,setUploading]=useState(false);
  const[done,setDone]=useState(false);
  const[idFile,setIdFile]=useState(null);
  const[selfieFile,setSelfieFile]=useState(null);
  const[open,setOpen]=useState(false);

  const upload=async()=>{
    if(!idFile&&!selfieFile)return;
    setUploading(true);
    try{
      const now=Date.now();
      let idUrl='',selfieUrl='';
      if(idFile){
        const path=`kyc/${email}/id_${now}.${idFile.name.split('.').pop()}`;
        await sb.storage.from('kyc-documents').upload(path,idFile,{upsert:true});
        idUrl=sb.storage.from('kyc-documents').getPublicUrl(path).data?.publicUrl||'';
      }
      if(selfieFile){
        const path=`kyc/${email}/selfie_${now}.${selfieFile.name.split('.').pop()}`;
        await sb.storage.from('kyc-documents').upload(path,selfieFile,{upsert:true});
        selfieUrl=sb.storage.from('kyc-documents').getPublicUrl(path).data?.publicUrl||'';
      }
      // Update portal_requests with doc URLs
      const updates={};
      if(idUrl)updates.id_document_url=idUrl;
      if(selfieUrl)updates.selfie_url=selfieUrl;
      if(Object.keys(updates).length)
        await sb.from('portal_requests').update(updates).eq('email',email);
      setDone(true);
    }catch(e){console.error(e);}
    setUploading(false);
  };

  if(done)return null;

  return(
    <div style={{background:'rgba(230,190,50,0.10)',border:'1.5px solid rgba(182,139,46,0.30)',borderRadius:12,padding:'14px 18px',marginBottom:16,fontFamily:F.san}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:10}}>
        <div style={{display:'flex',gap:10,alignItems:'center'}}>
          <span style={{fontSize:18}}>⚠️</span>
          <div>
            <div style={{fontSize:13,fontWeight:700,color:'#7a5c00',marginBottom:2}}>KYC Documents Required</div>
            <div style={{fontSize:12,color:'#8a7040',lineHeight:1.5}}>Please upload your ID document and a selfie. Artworks will only be released once verified.</div>
          </div>
        </div>
        <button onClick={()=>setOpen(o=>!o)} style={{padding:'8px 16px',borderRadius:8,border:'1px solid rgba(182,139,46,0.30)',background:'transparent',color:G.gold,cursor:'pointer',fontSize:12,fontWeight:600,fontFamily:F.san,flexShrink:0}}>
          {open?'Hide':'Upload Documents'}
        </button>
      </div>
      {open&&(
        <div style={{marginTop:14,display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
          <div>
            <label style={{display:'block',fontSize:10,fontWeight:700,letterSpacing:'0.14em',textTransform:'uppercase',color:G.mid,marginBottom:6}}>ID Document</label>
            <input type="file" accept="image/*,.pdf" onChange={e=>setIdFile(e.target.files[0])} style={{width:'100%',fontSize:12,fontFamily:F.san}}/>
            {idFile&&<div style={{fontSize:11,color:G.greenD,marginTop:4}}>✓ {idFile.name}</div>}
          </div>
          <div>
            <label style={{display:'block',fontSize:10,fontWeight:700,letterSpacing:'0.14em',textTransform:'uppercase',color:G.mid,marginBottom:6}}>Selfie with ID</label>
            <input type="file" accept="image/*" capture="user" onChange={e=>setSelfieFile(e.target.files[0])} style={{width:'100%',fontSize:12,fontFamily:F.san}}/>
            {selfieFile&&<div style={{fontSize:11,color:G.greenD,marginTop:4}}>✓ {selfieFile.name}</div>}
          </div>
          <div style={{gridColumn:'1/-1'}}>
            <button onClick={upload} disabled={uploading||(!idFile&&!selfieFile)} style={{width:'100%',padding:'11px',borderRadius:10,border:'none',background:`linear-gradient(135deg,${G.gold},${G.goldD})`,color:G.white,fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:F.san,opacity:uploading||(!idFile&&!selfieFile)?0.5:1}}>
              {uploading?'Uploading…':'Submit Documents'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Root ────────────────────────────────────────────────────
// ── Root ────────────────────────────────────────────────────
export default function BuyerPortal(){
  const[session,setSession]=useState(undefined);
  const[screen,setScreen]=useState('loading');
  const[hasKycDocs,setHasKycDocs]=useState(true);
  const[accessError,setAccessError]=useState('');
  const justRegistered=useRef(false);

  useEffect(()=>{
    if(!sb){setSession(null);setScreen('auth');return;}
    sb.auth.getSession().then(({data})=>setSession(data?.session||null));
    const{data:{subscription}}=sb.auth.onAuthStateChange((_,s)=>setSession(s));
    return()=>subscription.unsubscribe();
  },[]);

  useEffect(()=>{
    if(session===undefined)return;
    if(!session){setScreen('auth');return;}
    if(justRegistered.current)return;
    checkAccess(session.user.email.toLowerCase());
  },[session]);

  const checkTermsLocal=(email)=>{
    try{const s=JSON.parse(localStorage.getItem('vb_terms_buyer')||'null');return !!(s&&s.email===email&&s.v===TERMS_VERSION);}catch{return false;}
  };

  const checkAccess=async(email)=>{
    setScreen('loading');
    try{
      const{data:myRow}=await sb.from('portal_requests').select('status,id_document_url,selfie_url').eq('email',email).eq('role','buyer').order('created_at',{ascending:false}).limit(1).maybeSingle();
      if(myRow){
        if(myRow.status==='approved'){
          setHasKycDocs(!!(myRow.id_document_url||myRow.selfie_url));
          // Check DB first, then localStorage fallback
          const{data:agrRow}=await sb.from('portal_agreements').select('signed_at').eq('email',email).eq('role','buyer').maybeSingle().catch(()=>({data:null}));
          if(agrRow){
            // Already signed in DB - save to localStorage and go to dashboard
            try{localStorage.setItem('vb_terms_buyer',JSON.stringify({email,v:TERMS_VERSION}));}catch{}
            setScreen('dashboard');
          }else{
            setScreen(checkTermsLocal(email)?'dashboard':'terms');
          }
        }else{setScreen('pending');}
        return;
      }
      const{data:anyRow}=await sb.from('portal_requests').select('id,full_name,mobile,message').eq('email',email).limit(1).maybeSingle();
      if(anyRow){
        // KYC exists on another portal - copy details and create pending row for this role
        await sb.from('portal_requests').upsert({
          id:crypto.randomUUID(),
          email,
          role:'buyer',
          status:'pending',
          full_name:anyRow.full_name||'',
          mobile:anyRow.mobile||'',
          message:anyRow.message||'',
          created_at:new Date().toISOString()
        },{onConflict:'email,role'});
        setScreen('pending');
      }else{
        setScreen('kyc');
      }
    }catch(e){
      console.error('checkAccess error:',e);
      setAccessError(e.message||'Access check failed');
      setScreen('auth');
    }
  };

  if(session===undefined||screen==='loading')
    return<div style={{minHeight:'100vh',background:G.cream,display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{fontFamily:F.ser,fontSize:20,letterSpacing:8,color:G.gold,opacity:0.5}}>VOLLARD BLACK</div>
    </div>;

  if(screen==='auth'||!session)
    return<AuthScreen onAuth={s=>{setAccessError('');setSession(s);}} accessError={accessError}/>;

  if(screen==='kyc')
    return<KYCRegistration role="buyer" supabase={sb}
      onComplete={()=>{justRegistered.current=true;setScreen('pending');}}
      onSignIn={()=>setScreen('auth')}/>;

  if(screen==='pending')
    return<NotApprovedScreen onSignOut={()=>{justRegistered.current=false;sb.auth.signOut();}}/>;

  if(screen==='terms')
    return<TermsModal email={session.user.email} onAccepted={()=>setScreen('dashboard')}/>;

  return<BuyerDashboard session={session} kycComplete={hasKycDocs}/>;
}
