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
const CP={padding:'20px'};
const SH={fontSize:10,fontWeight:700,letterSpacing:'0.20em',textTransform:'uppercase',color:G.gold,marginBottom:14,paddingBottom:10,borderBottom:'1px solid rgba(182,139,46,0.12)'};

// ── Shared screens ──────────────────────────────────────────────────────
function Logo(){return(<div style={{textAlign:'center',marginBottom:32}}><div style={{fontFamily:F.ser,fontSize:32,fontWeight:300,letterSpacing:10,color:G.dark}}>VOLLARD <span style={{color:G.gold}}>BLACK</span></div><div style={{fontSize:10,letterSpacing:4,textTransform:'uppercase',color:G.light,marginTop:6}}>ARTIST PORTAL</div><div style={{width:40,height:1,background:'rgba(182,139,46,0.4)',margin:'12px auto 0'}}/></div>);}

function PendingScreen({email,onBack}){return(<div style={{minHeight:'100vh',background:G.cream,display:'flex',alignItems:'center',justifyContent:'center',padding:20,fontFamily:F.san}}><div style={{width:'100%',maxWidth:420,textAlign:'center'}}><Logo/><div style={{...CARD,padding:36}}><div style={{fontSize:48,marginBottom:12}}>⏳</div><div style={{fontFamily:F.ser,fontSize:22,color:G.dark,marginBottom:8}}>Application Submitted</div><div style={{fontSize:13,color:G.mid,lineHeight:1.8,marginBottom:20}}>Thank you. Vollard Black will review your application and contact you at <strong>{email}</strong> once approved.</div><button onClick={onBack} style={{padding:'11px 24px',borderRadius:24,border:'1px solid rgba(182,139,46,0.28)',background:'transparent',color:G.gold,cursor:'pointer',fontSize:13,fontWeight:600,fontFamily:F.san}}>Back to Sign In</button></div></div></div>);}

function NotApprovedScreen({onSignOut}){return(<div style={{minHeight:'100vh',background:G.cream,display:'flex',alignItems:'center',justifyContent:'center',padding:20,fontFamily:F.san}}><div style={{width:'100%',maxWidth:420,textAlign:'center'}}><Logo/><div style={{...CARD,padding:36}}><div style={{fontSize:48,marginBottom:12}}>⏳</div><div style={{fontFamily:F.ser,fontSize:22,color:G.dark,marginBottom:8}}>Pending Approval</div><div style={{fontSize:13,color:G.mid,lineHeight:1.8,marginBottom:20}}>Your application is under review. Vollard Black will activate your account shortly. Contact <strong>concierge@vollardblack.com</strong> if you need immediate access.</div><button onClick={onSignOut} style={{padding:'11px 24px',borderRadius:24,border:'1px solid rgba(182,139,46,0.28)',background:'transparent',color:G.gold,cursor:'pointer',fontSize:13,fontWeight:600,fontFamily:F.san}}>Sign Out</button></div></div></div>);}

// ── Auth Screen ─────────────────────────────────────────────────────────
function AuthScreen({onAuth}){
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
    if(e)return setError('Incorrect email or password. Please try again.');
    onAuth(data.session,'login');
  };

  const signUp=async()=>{
    if(!email||!pw)return setError('Please enter your email and password.');
    if(pw.length<6)return setError('Password must be at least 6 characters.');
    if(pw!==pw2)return setError('Passwords do not match.');
    setLoading(true);setError('');
    const emailClean=email.trim().toLowerCase();
    // Try sign up
    const{data,error:e}=await sb.auth.signUp({email:emailClean,password:pw});
    if(e&&e.message.toLowerCase().includes('already')){
      // Account exists — sign in instead
      const{data:d2,error:e2}=await sb.auth.signInWithPassword({email:emailClean,password:pw});
      if(e2){setLoading(false);return setError('An account with this email already exists. Use your existing password to sign in.');}
      // Add artist role request
      await sb.from('portal_requests').upsert({id:crypto.randomUUID(),email:emailClean,role:'artist',status:'pending',created_at:new Date().toISOString()},{onConflict:'email,role'}).catch(()=>{});
      setLoading(false);
      return onAuth(d2.session,'signup');
    }
    if(e){setLoading(false);return setError(e.message);}
    // New account created
    await sb.from('portal_requests').upsert({id:crypto.randomUUID(),email:emailClean,role:'artist',status:'pending',created_at:new Date().toISOString()},{onConflict:'email,role'}).catch(()=>{});
    setLoading(false);
    if(data?.session)return onAuth(data.session,'signup');
    setMsg('Account created! Check your email to confirm your address, then sign in.');
    setMode('login');setPw('');setPw2('');
  };

  const resetPw=async()=>{
    if(!email)return setError('Enter your email address first.');
    setLoading(true);setError('');
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
          {/* Tab toggle */}
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

// ── Terms Modal ─────────────────────────────────────────────────────────
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
    try{await sb.from('portal_agreements').upsert({id:crypto.randomUUID(),email,role:'artist',signed_at:now,signature_data:sig,user_agent:navigator.userAgent,terms_version:TERMS_VERSION},{onConflict:'email,role'});}catch(e){console.error(e);}
    try{localStorage.setItem('vb_terms_artist',JSON.stringify({email,v:TERMS_VERSION}));}catch{}
    setSaving(false);
    onAccepted();
  };

  const terms=[['Representation','You authorise Vollard Black (Pty) Ltd to display, market, and sell your artworks through its platform, gallery network, and auction services.'],['Commission','On each sale: Artist 30% · Gallery Partner 40% · Vollard Black 30% — applied to the license fee (50% of sale price).'],['Submissions','All submissions are subject to approval. Vollard Black may decline works that do not meet quality standards.'],['Intellectual Property','You retain full copyright. You grant Vollard Black a non-exclusive licence to use artwork images for marketing.'],['Authenticity','You warrant all submitted works are original, created by you, and free from third-party claims.'],['Payment','Artist shares are paid within 14 business days of a confirmed sale to the verified bank account on file.'],['Termination','Either party may terminate with 30 days written notice to concierge@vollardblack.com.']];

  return(
    <div style={{position:'fixed',inset:0,background:'rgba(26,23,20,0.8)',zIndex:1000,display:'flex',alignItems:'flex-start',justifyContent:'center',padding:16,overflowY:'auto',fontFamily:F.san}}>
      <div style={{background:G.white,borderRadius:20,width:'100%',maxWidth:540,marginTop:16,marginBottom:16}}>
        <div style={{background:`linear-gradient(135deg,${G.dark},#2a2018)`,padding:'20px 24px',borderRadius:'20px 20px 0 0',textAlign:'center'}}>
          <div style={{fontFamily:F.ser,fontSize:11,letterSpacing:'0.28em',color:'rgba(182,139,46,0.7)',textTransform:'uppercase',marginBottom:6}}>VOLLARD BLACK</div>
          <div style={{fontFamily:F.ser,fontSize:20,color:'#f5f3ef'}}>Artist Representation Agreement</div>
          <div style={{fontSize:10,color:'rgba(245,243,239,0.45)',marginTop:4}}>Version {TERMS_VERSION} · Please read and sign before continuing</div>
        </div>
        <div style={{padding:'20px 24px'}}>
          <div style={{maxHeight:240,overflowY:'auto',marginBottom:16}}>
            {terms.map(([t,x])=><div key={t} style={{marginBottom:12,paddingBottom:12,borderBottom:'1px solid rgba(182,139,46,0.08)'}}><div style={{fontFamily:F.ser,fontSize:14,color:G.dark,marginBottom:3,fontWeight:500}}>{t}</div><div style={{fontSize:12,color:'#4a4440',lineHeight:1.7}}>{x}</div></div>)}
            <div style={{padding:'8px 12px',background:'rgba(182,139,46,0.06)',borderRadius:8,fontSize:11,color:'#8a6a1e'}}>Vollard Black (Pty) Ltd · Hermanus, Western Cape · concierge@vollardblack.com</div>
          </div>
          <div style={{marginBottom:14}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}><label style={LBL}>Your Signature</label>{hasSig&&<button onClick={clear} style={{fontSize:11,color:G.red,background:'none',border:'none',cursor:'pointer',fontFamily:F.san}}>✕ Clear</button>}</div>
            <div style={{border:'1.5px solid rgba(182,139,46,0.28)',borderRadius:10,background:'#fafaf8',position:'relative',overflow:'hidden'}}>
              <canvas ref={canvasRef} width={492} height={120} style={{width:'100%',height:120,display:'block',touchAction:'none',cursor:'crosshair'}} onMouseDown={onDown} onMouseMove={onMove} onMouseUp={onUp} onMouseLeave={onUp} onTouchStart={onDown} onTouchMove={onMove} onTouchEnd={onUp}/>
              {!hasSig&&<div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',pointerEvents:'none'}}><span style={{fontSize:13,color:'rgba(182,139,46,0.3)',fontStyle:'italic'}}>Draw your signature here</span></div>}
            </div>
            <div style={{fontSize:10,color:G.light,marginTop:4}}>Signed by: {email}</div>
          </div>
          <label style={{display:'flex',alignItems:'flex-start',gap:10,cursor:'pointer',marginBottom:14,padding:'10px 12px',background:'rgba(182,139,46,0.04)',borderRadius:8,border:`1px solid ${agreed?'rgba(182,139,46,0.28)':'rgba(182,139,46,0.12)'}`}}>
            <input type="checkbox" checked={agreed} onChange={e=>setAgreed(e.target.checked)} style={{width:15,height:15,marginTop:1,accentColor:G.gold,flexShrink:0}}/>
            <span style={{fontSize:12,color:G.dark,lineHeight:1.6}}>I, <strong>{email}</strong>, have read and agree to the above terms. I understand this is a legally binding digital signature.</span>
          </label>
          {err&&<div style={{padding:'9px 12px',background:'rgba(196,92,74,0.08)',border:'1px solid rgba(196,92,74,0.25)',borderRadius:8,fontSize:12,color:G.red,marginBottom:10}}>{err}</div>}
          <button onClick={sign} disabled={saving} style={{width:'100%',padding:13,borderRadius:12,border:'none',background:hasSig&&agreed?`linear-gradient(135deg,${G.gold},${G.goldD})`:'rgba(182,139,46,0.2)',color:hasSig&&agreed?G.white:G.gold,fontSize:14,fontWeight:700,cursor:'pointer',fontFamily:F.san,transition:'all 0.2s'}}>
            {saving?'Saving…':'✍ Sign & Continue'}
          </button>
        </div>
      </div>
    </div>
  );
}


function sharePortfolio(artworks,artistName,bio,medium){
  // Generate portfolio HTML and offer share/download
  const w=window.open('','_blank');
  const works=artworks.filter(a=>a.status!=='Pending Approval');
  const html=`<!DOCTYPE html><html><head><title>${artistName} — Portfolio</title><style>@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500&family=DM+Sans:wght@400;600&display=swap');body{margin:0;padding:0;background:#fff;font-family:'DM Sans',sans-serif;color:#1a1714;}@page{size:A4;margin:20mm;}.cover{min-height:100vh;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;padding:48px;page-break-after:always;background:linear-gradient(135deg,#1a1714 0%,#2a2018 100%);}.cover-logo{font-family:'Cormorant Garamond',serif;font-size:22px;font-weight:300;letter-spacing:0.4em;color:rgba(245,243,239,0.6);margin-bottom:48px;}.cover-logo span{color:#b68b2e;}.cover-name{font-family:'Cormorant Garamond',serif;font-size:52px;font-weight:300;color:#f5f3ef;margin-bottom:8px;}.cover-medium{font-size:13px;letter-spacing:0.2em;text-transform:uppercase;color:rgba(182,139,46,0.7);margin-bottom:40px;}.cover-bio{max-width:440px;font-size:14px;color:rgba(245,243,239,0.65);line-height:1.8;font-style:italic;}.page{padding:40px;page-break-after:always;display:grid;grid-template-columns:1fr 1fr;gap:32px;align-items:start;}.art-img{width:100%;aspect-ratio:1;object-fit:cover;border-radius:6px;background:#f0ede8;}.art-info{padding-top:8px;}.art-title{font-family:'Cormorant Garamond',serif;font-size:28px;color:#1a1714;margin-bottom:6px;}.art-artist{font-size:13px;color:#b68b2e;font-weight:600;margin-bottom:20px;}.dl{margin-bottom:10px;}.dl-label{font-size:9px;letter-spacing:0.15em;text-transform:uppercase;color:#8a8070;margin-bottom:2px;}.dl-value{font-size:13px;font-weight:600;}.price-box{margin-top:20px;padding:14px;background:#f5f3ef;border-radius:6px;}.price-label{font-size:9px;letter-spacing:0.15em;text-transform:uppercase;color:#8a8070;margin-bottom:2px;}.price-value{font-family:'Cormorant Garamond',serif;font-size:26px;color:#b68b2e;font-weight:600;}</style></head><body><div class="cover"><div class="cover-logo">VOLLARD <span>BLACK</span></div><div class="cover-name">${artistName}</div><div class="cover-medium">${medium||'Fine Art'}</div>${bio?'<div class="cover-bio">"'+bio+'"</div>':''}</div>${works.map(art=>'<div class="page">'+(art.imageUrl?'<img src="'+art.imageUrl+'" class="art-img" alt="'+art.title+'"/>':(art.imageUrl===''?'':'<div class="art-img" style="display:flex;align-items:center;justify-content:center;font-size:48px;color:rgba(182,139,46,0.3)">🖼</div>'))+'<div class="art-info"><div class="art-title">'+art.title+'</div><div class="art-artist">'+artistName+'</div>'+(art.medium?'<div class="dl"><div class="dl-label">Medium</div><div class="dl-value">'+art.medium+'</div></div>':'')+(art.year?'<div class="dl"><div class="dl-label">Year</div><div class="dl-value">'+art.year+'</div></div>':'')+(art.dimensions?'<div class="dl"><div class="dl-label">Dimensions</div><div class="dl-value">'+art.dimensions+'</div></div>':'')+'<div class="price-box"><div class="price-label">Asking Price</div><div class="price-value">R '+Number(art.recommendedPrice||0).toLocaleString('en-ZA',{minimumFractionDigits:2})+'</div></div>'+(art.description?'<div style="margin-top:16px;font-size:12px;color:#4a4440;line-height:1.8;font-style:italic;">'+art.description+'</div>':'')+'</div></div>').join('')}</body></html>`;
  w.document.write(html);
  w.document.close();
  // After render, offer share
  setTimeout(()=>{
    if(navigator.share){
      navigator.share({title:artistName+' — Portfolio',text:'View my art portfolio on Vollard Black',url:window.location.origin+'/artist'}).catch(()=>{});
    } else {
      w.print();
    }
  },800);
}

function generatePortfolio(artworks,artistName,bio,medium){
  const w=window.open('','_blank');
  const works=artworks.filter(a=>a.status!=='Pending Approval');
  const html=`<!DOCTYPE html><html><head><title>${artistName} — Portfolio</title><style>@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600&family=DM+Sans:wght@400;600&display=swap');body{margin:0;padding:0;background:#fff;font-family:'DM Sans',sans-serif;color:#1a1714;}@page{size:A4;margin:20mm;}@media print{body{background:#fff;}}.cover{min-height:297mm;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;padding:48px;page-break-after:always;background:linear-gradient(135deg,#1a1714 0%,#2a2018 100%);}.cover-logo{font-family:'Cormorant Garamond',serif;font-size:24px;font-weight:300;letter-spacing:0.4em;color:rgba(245,243,239,0.6);margin-bottom:60px;}.cover-logo span{color:#b68b2e;}.cover-name{font-family:'Cormorant Garamond',serif;font-size:56px;font-weight:300;color:#f5f3ef;letter-spacing:0.05em;margin-bottom:12px;}.cover-medium{font-size:14px;letter-spacing:0.2em;text-transform:uppercase;color:rgba(182,139,46,0.7);margin-bottom:48px;}.cover-bio{max-width:480px;font-size:15px;color:rgba(245,243,239,0.65);line-height:1.8;font-style:italic;}.artwork-page{padding:32px;page-break-after:always;display:grid;grid-template-columns:1fr 1fr;gap:32px;align-items:start;}.artwork-img{width:100%;aspect-ratio:1;object-fit:cover;border-radius:8px;background:#f0ede8;}.artwork-img-placeholder{width:100%;aspect-ratio:1;background:#f0ede8;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:48px;color:rgba(182,139,46,0.3);}.artwork-info{padding-top:16px;}.artwork-title{font-family:'Cormorant Garamond',serif;font-size:32px;font-weight:400;color:#1a1714;margin-bottom:8px;}.artwork-artist{font-size:14px;color:#b68b2e;font-weight:600;margin-bottom:24px;}.artwork-detail{margin-bottom:12px;}.artwork-detail-label{font-size:9px;letter-spacing:0.2em;text-transform:uppercase;color:#8a8070;margin-bottom:2px;}.artwork-detail-value{font-size:14px;font-weight:600;color:#1a1714;}.artwork-desc{margin-top:24px;font-size:13px;color:#4a4440;line-height:1.8;font-style:italic;}.price-box{margin-top:24px;padding:16px;background:#f5f3ef;border-radius:8px;border:1px solid rgba(182,139,46,0.2);}.price-label{font-size:9px;letter-spacing:0.2em;text-transform:uppercase;color:#8a8070;margin-bottom:4px;}.price-value{font-family:'Cormorant Garamond',serif;font-size:28px;color:#b68b2e;font-weight:600;}</style></head><body><div class="cover"><div class="cover-logo">VOLLARD <span>BLACK</span></div><div class="cover-name">${artistName}</div><div class="cover-medium">${medium||'Fine Art'}</div>${bio?`<div class="cover-bio">"${bio}"</div>`:''}</div>${works.map(art=>`<div class="artwork-page">${art.imageUrl?`<img src="${art.imageUrl}" class="artwork-img" alt="${art.title}"/>`:`<div class="artwork-img-placeholder">🖼</div>`}<div class="artwork-info"><div class="artwork-title">${art.title}</div><div class="artwork-artist">${artistName}</div>${art.medium?`<div class="artwork-detail"><div class="artwork-detail-label">Medium</div><div class="artwork-detail-value">${art.medium}</div></div>`:''}${art.year?`<div class="artwork-detail"><div class="artwork-detail-label">Year</div><div class="artwork-detail-value">${art.year}</div></div>`:''}${art.dimensions?`<div class="artwork-detail"><div class="artwork-detail-label">Dimensions</div><div class="artwork-detail-value">${art.dimensions}</div></div>`:''}<div class="price-box"><div class="price-label">Asking Price</div><div class="price-value">R ${fmt(art.recommendedPrice)}</div></div>${art.description?`<div class="artwork-desc">${art.description}</div>`:''}</div></div>`).join('')}</body></html>`;
  w.document.write(html);w.document.close();
}

function generateCert(art,artistName){
  const w=window.open('','_blank');
  const html=`<!DOCTYPE html><html><head><title>Certificate of Authenticity</title><style>@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600&family=DM+Sans:wght@400;600&display=swap');body{margin:0;padding:48px;background:#f5f3ef;font-family:'DM Sans',sans-serif;}.cert{max-width:680px;margin:0 auto;background:#fff;border:1px solid rgba(182,139,46,0.3);padding:60px;text-align:center;}.logo{font-family:'Cormorant Garamond',serif;font-size:28px;font-weight:300;letter-spacing:0.3em;color:#1a1714;margin-bottom:4px;}.logo span{color:#b68b2e;}.sub{font-size:10px;letter-spacing:0.3em;text-transform:uppercase;color:#8a8070;margin-bottom:40px;}.line{width:80px;height:1px;background:rgba(182,139,46,0.4);margin:24px auto;}.title{font-family:'Cormorant Garamond',serif;font-size:22px;color:#8a8070;font-weight:300;letter-spacing:0.1em;margin-bottom:32px;text-transform:uppercase;}.art-title{font-family:'Cormorant Garamond',serif;font-size:36px;font-weight:400;color:#1a1714;margin-bottom:8px;}.artist{font-size:16px;color:#b68b2e;font-weight:600;margin-bottom:32px;}.details{display:grid;grid-template-columns:1fr 1fr;gap:16px;text-align:left;margin-bottom:40px;background:#f5f3ef;padding:24px;border-radius:8px;}.detail-label{font-size:10px;letter-spacing:0.15em;text-transform:uppercase;color:#8a8070;margin-bottom:4px;}.detail-value{font-size:14px;color:#1a1714;font-weight:600;}.cert-no{font-size:11px;color:#8a8070;margin-top:32px;}.footer{margin-top:40px;font-size:11px;color:#8a8070;line-height:1.7;}@media print{body{background:#fff;}}</style></head><body><div class="cert"><div class="logo">VOLLARD <span>BLACK</span></div><div class="sub">Fine Art Acquisitions</div><div class="line"/><div class="title">Certificate of Authenticity</div><div class="art-title">${art.title}</div><div class="artist">by ${artistName}</div><div class="details"><div><div class="detail-label">Medium</div><div class="detail-value">${art.medium||'—'}</div></div><div><div class="detail-label">Year</div><div class="detail-value">${art.year||'—'}</div></div><div><div class="detail-label">Dimensions</div><div class="detail-value">${art.dimensions||'—'}</div></div><div><div class="detail-label">Value</div><div class="detail-value">R ${fmt(art.recommendedPrice)}</div></div></div><div class="line"/><div class="cert-no">Certificate No: VB-${art.id?.slice(-8)?.toUpperCase()||'N/A'} · Issued ${new Date().toLocaleDateString('en-ZA',{day:'numeric',month:'long',year:'numeric'})}</div><div class="footer">This certificate verifies the authenticity of the above artwork.<br/>Vollard Black (Pty) Ltd · Hermanus, Western Cape · concierge@vollardblack.com</div></div><script>window.print();</script></body></html>`;
  w.document.write(html);w.document.close();
}

function ArtistDashboard({session, kycComplete=true}){
 // null=checking, true=signed, false=needs signing
  const[tab,setTab]=useState('overview');
  const[artist,setArtist]=useState(null);
  const[artworks,setArtworks]=useState([]);
  const[sales,setSales]=useState([]);
  const[auctions,setAuctions]=useState([]);
  const[loading,setLoading]=useState(true);
  const[notifs,setNotifs]=useState([]);
  const[uploadForm,setUploadForm]=useState({title:'',medium:'',dimensions:'',year:'',description:'',price:''});
  const[uploadImageFile,setUploadImageFile]=useState(null);
  const[uploadImagePreview,setUploadImagePreview]=useState(null);
  const[uploading,setUploading]=useState(false);
  const[uploadMsg,setUploadMsg]=useState('');
  const[profileForm,setProfileForm]=useState(null);
  const[profileEdit,setProfileEdit]=useState(false);
  const[savingProfile,setSavingProfile]=useState(false);
  const[saveMsg,setSaveMsg]=useState('');
  const[selectedArt,setSelectedArt]=useState(null);
  const[saving,setSaving]=useState(false);

  const addNotif=(msg)=>setNotifs(p=>[{msg,time:new Date().toLocaleTimeString('en-ZA',{hour:'2-digit',minute:'2-digit'}),read:false},...p.slice(0,19)]);

  useEffect(()=>{loadData();},[session]);

  useEffect(()=>{
    if(!sb)return;
    const ch=sb.channel('artist-portal').on('postgres_changes',{event:'INSERT',schema:'public',table:'sales'},payload=>{
      const s=payload.new;
      addNotif(`🎉 "${s.artwork_title}" sold for R ${Number(s.sale_price||0).toLocaleString('en-ZA')}!`);
      loadData();
    }).on('postgres_changes',{event:'UPDATE',schema:'public',table:'artworks'},payload=>{
      const a=toCamel(payload.new);
      if(a.approvalStatus==='approved')addNotif(`✓ Your artwork "${a.title}" has been approved and is now listed in the gallery.`);
      loadData();
    }).subscribe();
    return()=>sb.removeChannel(ch);
  },[]);

  const loadData=async()=>{
    setLoading(true);
    try{
      const{data:arts}=await sb.from('artists').select('*').eq('email',session.user.email);
      if(!arts||arts.length===0){setLoading(false);return;}
      const a=toCamel(arts[0]);
      setArtist(a);
      setProfileForm({name:a.name||'',mobile:a.mobile||'',medium:a.medium||'',style:a.style||'',website:a.website||'',instagram:a.instagram||'',bio:a.bio||'',city:a.city||'',country:a.country||'South Africa',idNumber:a.idNumber||'',nationality:a.nationality||'',address:a.address||'',bankName:a.bankName||'',accountHolder:a.accountHolder||'',accountNumber:a.accountNumber||'',branchCode:a.branchCode||'',bankVerified:a.bankVerified||false});
      const{data:works}=await sb.from('artworks').select('*').eq('artist_id',a.id);
      const w=(works||[]).map(toCamel);setArtworks(w);
      if(w.length>0){
        const ids=w.map(x=>x.id);
        const{data:sls}=await sb.from('sales').select('*').in('artwork_id',ids);
        setSales((sls||[]).map(toCamel));
        const{data:aucs}=await sb.from('auctions').select('*').in('artwork_id',ids);
        setAuctions((aucs||[]).map(toCamel));
      }
    }catch(e){console.error(e);}
    setLoading(false);
  };

  const signOut=()=>sb.auth.signOut();

  const saveProfile=async()=>{
    if(!artist)return;setSavingProfile(true);
    try{
      const bankChanged=(profileForm.bankName||'')!==(artist.bankName||'')||(profileForm.accountNumber||'')!==(artist.accountNumber||'');
      const updates={...profileForm,...(bankChanged?{bankVerified:false}:{})};
      const snake=toSnake(updates);delete snake.id;delete snake.created_at;
      await sb.from('artists').update(snake).eq('id',artist.id);
      setArtist(a=>({...a,...updates}));
      setSaveMsg(bankChanged?'Saved. Bank details pending verification.':'Profile updated.');
      setTimeout(()=>setSaveMsg(''),5000);setProfileEdit(false);
    }catch(e){console.error(e);}
    setSavingProfile(false);
  };

  const submitArtwork=async()=>{
    if(!uploadForm.title||!uploadForm.price)return setUploadMsg('error:Title and price are required.');
    setUploading(true);
    try{
      let imageUrl='';
      if(uploadImageFile){
        const ext=uploadImageFile.name.split('.').pop().toLowerCase();
        const path=`artworks/${artist.id}-${Date.now()}.${ext}`;
        const{error:upErr}=await sb.storage.from('artwork-images').upload(path,uploadImageFile,{upsert:true,contentType:uploadImageFile.type});
        if(!upErr){const{data:u}=sb.storage.from('artwork-images').getPublicUrl(path);imageUrl=u?.publicUrl||'';}
      }
      await sb.from('artworks').insert({id:crypto.randomUUID(),title:uploadForm.title,artist_name:artist.name,artist_id:artist.id,medium:uploadForm.medium,dimensions:uploadForm.dimensions,year:uploadForm.year,recommended_price:parseFloat(uploadForm.price)||0,description:uploadForm.description,image_url:imageUrl,status:'Pending Approval',approval_status:'pending',created_at:new Date().toISOString()});
      setUploadMsg('success:Submitted! Vollard Black will review and approve your artwork.');
      setUploadForm({title:'',medium:'',dimensions:'',year:'',description:'',price:''});
      setUploadImageFile(null);setUploadImagePreview(null);
      await loadData();
    }catch(e){setUploadMsg('error:'+e.message);}
    setUploading(false);
  };

  const totalSalesValue=sales.reduce((s,x)=>s+(x.salePrice||0),0);
  const artistShare=sales.reduce((s,x)=>s+(x.artistShare||0),0);
  const listedWorks=artworks.filter(a=>a.approvalStatus==='approved'||a.status==='Available'||a.status==='Reserved');
  const pendingWorks=artworks.filter(a=>a.status==='Pending Approval');

  // Dark mode colors
  
  
  
  
  if(loading)return<div style={{minHeight:'100vh',background:'#f5f3ef',display:'flex',alignItems:'center',justifyContent:'center'}}><div style={{fontFamily:SER,fontSize:24,color:C.gold,letterSpacing:6,opacity:0.6}}>Loading…</div></div>;

  if(!artist)return(<div style={{minHeight:'100vh',background:'#f5f3ef',display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:16,padding:20,fontFamily:SAN}}><Logo sub="Artist Portal"/><div style={{background:'#fff',border:'1px solid rgba(182,139,46,0.18)',borderRadius:16,overflow:'hidden',marginBottom:16,padding:40,textAlign:'center',maxWidth:420,width:'100%'}}><div style={{fontFamily:SER,fontSize:22,color:'#1a1714',marginBottom:8}}>Account Not Linked</div><div style={{fontSize:13,color:'#8a8070',marginBottom:16}}>Contact Vollard Black to link your artist account.</div><button onClick={signOut} style={{padding:'10px 24px',borderRadius:8,border:`1px solid ${C.goldB}`,background:'transparent',color:C.gold,cursor:'pointer',fontSize:13,fontWeight:600,fontFamily:SAN}}>Sign Out</button></div></div>);

  // Show terms if not signed yet


  return(
    <div style={{minHeight:'100vh',background:'#f5f3ef',fontFamily:SAN,color:'#1a1714',transition:'background 0.3s'}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600&family=DM+Sans:wght@300;400;500;600&display=swap');*{box-sizing:border-box;}input:focus,select:focus,textarea:focus{border-color:${C.gold}!important;box-shadow:0 0 0 3px rgba(182,139,46,0.12)!important;outline:none;}.art-img-wrap:hover .img-overlay{opacity:1!important;}`}</style>

      {/* Top bar */}
      <div style={{background:'#fff',borderBottom:'1px solid rgba(182,139,46,0.18)',padding:'0 20px',height:56,display:'flex',alignItems:'center',justifyContent:'space-between',position:'sticky',top:0,zIndex:50,boxShadow:'0 1px 12px rgba(0,0,0,0.06)'}}>
        <a href="/" style={{textDecoration:'none',display:'flex',alignItems:'center',gap:10}}>
          <div style={{fontFamily:SER,fontSize:18,fontWeight:300,letterSpacing:'0.20em',color:'#1a1714'}}>VOLLARD <span style={{color:C.gold}}>BLACK</span></div>
          <div style={{width:1,height:14,background:C.goldB}}/>
          <span style={{fontSize:9,letterSpacing:'0.18em',textTransform:'uppercase',color:C.blue,fontWeight:700}}>Artist</span>
        </a>
        <div style={{display:'flex',alignItems:'center',gap:10}}>

          <NotifCentre notifs={notifs} onClear={()=>setNotifs([])}/>
          <button onClick={()=>window.open('https://wa.me/27826503393?text='+encodeURIComponent('Hi Vollard Black, I need assistance with my artist portal.'),'_blank')} style={{padding:'7px 12px',borderRadius:8,border:'1px solid rgba(37,211,102,0.30)',background:'rgba(37,211,102,0.08)',color:'#25d366',cursor:'pointer',fontSize:13,fontWeight:600,fontFamily:SAN}}>Chat</button>
          <span style={{fontSize:13,color:'#8a8070',fontWeight:500}}>{artist.name}</span>
          <button onClick={signOut} style={{padding:'7px 14px',borderRadius:8,border:'1px solid rgba(182,139,46,0.18)',background:'transparent',color:'#8a8070',cursor:'pointer',fontSize:11,fontFamily:SAN}}>Sign Out</button>
        </div>
      </div>

      {/* Header */}
      <div style={{background:'#fff',borderBottom:'1px solid rgba(182,139,46,0.18)',padding:'24px 20px 20px'}}>
        <div style={{maxWidth:960,margin:'0 auto'}}>
          <div style={{display:'flex',gap:16,alignItems:'flex-start',flexWrap:'wrap',marginBottom:20}}>
            <div style={{width:64,height:64,borderRadius:'50%',background:'rgba(182,139,46,0.10)',border:'2px solid rgba(182,139,46,0.25)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,fontSize:26,color:'#b68b2e',fontFamily:SER,fontWeight:300}}>
              {artist.name?artist.name[0].toUpperCase():'A'}
            </div>
            <div style={{flex:1}}>
              <div style={{fontFamily:SER,fontSize:32,fontWeight:300,color:'#1a1714',letterSpacing:'0.02em',lineHeight:1.1,marginBottom:4}}>{artist.name}</div>
              <div style={{fontSize:13,color:'#8a8070',marginBottom:artist.bio?8:0}}>{[artist.medium,artist.style].filter(Boolean).join(' · ')||'Artist'}</div>
              {artist.bio&&<div style={{fontSize:13,color:'#6b635a',lineHeight:1.7,maxWidth:560,fontStyle:'italic'}}>"{artist.bio}"</div>}
            </div>
            <button onClick={()=>sharePortfolio(artworks,artist.name,artist.bio,artist.medium)} style={{padding:'9px 18px',borderRadius:24,border:'1px solid rgba(182,139,46,0.28)',background:'transparent',color:'#b68b2e',cursor:'pointer',fontSize:12,fontWeight:600,fontFamily:SAN,flexShrink:0}}>📄 Share Portfolio</button>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10}}>
            {[['Works Listed',listedWorks.length],['Pending',pendingWorks.length],['Sold',artworks.filter(a=>a.status==='Sold').length],['Total Sales','R '+fmt(totalSalesValue)]].map(([l,v])=>(
              <div key={l} style={{background:'#f7f5f1',border:'1px solid rgba(182,139,46,0.18)',borderRadius:10,padding:'12px 10px',textAlign:'center'}}>
                <div style={{fontSize:9,letterSpacing:'0.16em',textTransform:'uppercase',color:'#8a8070',marginBottom:6}}>{l}</div>
                <div style={{fontFamily:SER,fontSize:20,fontWeight:300,color:'#1a1714'}}>{v}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{maxWidth:960,margin:'0 auto',padding:'24px 16px 100px'}}>
        {/* Tabs */}
        <div style={{display:'flex',flexWrap:'wrap',gap:8,marginBottom:28}}>
          {[['overview','Overview'],['works','My Works'],['upload','Upload'],['sales','Sales'],['auctions','Auctions'],['profile','Profile'],['terms','Terms']].map(([id,lbl])=>(
            <button key={id} onClick={()=>setTab(id)} style={{padding:'9px 20px',borderRadius:24,border:tab===id?'none':'1px solid rgba(182,139,46,0.18)',background:tab===id?`linear-gradient(135deg,${C.gold},${C.goldD})`:'#fff',color:tab===id?'#fff':'#6b635a',fontSize:13,fontWeight:tab===id?600:400,cursor:'pointer',fontFamily:SAN,whiteSpace:'nowrap',transition:'all 0.2s',boxShadow:tab===id?'0 4px 12px rgba(182,139,46,0.28)':'none'}}>
              {lbl}
            </button>
          ))}
        </div>

        {/* OVERVIEW */}
        {tab==='overview'&&(
          <div>
            {!artist.bio&&<div onClick={()=>{setTab('profile');setProfileEdit(true);}} style={{background:'#fff',border:'1px solid rgba(182,139,46,0.18)',borderRadius:16,overflow:'hidden',marginBottom:16,cursor:'pointer',border:`1.5px dashed ${C.goldB}`,background:'rgba(182,139,46,0.03)',marginBottom:20}}><div style={{padding:'16px 20px',display:'flex',alignItems:'center',gap:16}}><div style={{width:44,height:44,borderRadius:'50%',background:`rgba(182,139,46,0.12)`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,flexShrink:0}}>✍</div><div><div style={{fontWeight:700,fontSize:14,color:C.gold,marginBottom:2}}>Add your artist biography</div><div style={{fontSize:12,color:'#8a8070'}}>Tell collectors about your practice and inspiration. Tap to add.</div></div><div style={{marginLeft:'auto',fontSize:20,color:`rgba(182,139,46,0.4)`}}>→</div></div></div>}

            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:16}}>
              <button onClick={()=>setTab('upload')} style={{background:'#fff',border:'1px solid rgba(182,139,46,0.18)',borderRadius:16,overflow:'hidden',marginBottom:16,marginBottom:0,padding:'20px',cursor:'pointer',border:'none',textAlign:'left',display:'block',background:`linear-gradient(135deg,${C.gold},${C.goldD})`,boxShadow:'0 8px 24px rgba(182,139,46,0.30)'}}>
                <div style={{fontSize:28,marginBottom:8}}>🖼</div>
                <div style={{fontFamily:SER,fontSize:20,color:'#fff',marginBottom:2}}>Upload Artwork</div>
                <div style={{fontSize:11,color:'rgba(255,255,255,0.6)'}}>Submit for gallery listing</div>
              </button>
              <button onClick={()=>setTab('works')} style={{background:'#fff',border:'1px solid rgba(182,139,46,0.18)',borderRadius:16,overflow:'hidden',marginBottom:16,marginBottom:0,padding:'20px',cursor:'pointer',textAlign:'left',display:'block'}}>
                <div style={{fontSize:28,marginBottom:8}}>📦</div>
                <div style={{fontFamily:SER,fontSize:20,color:'#1a1714',marginBottom:2}}>My Works</div>
                <div style={{fontSize:11,color:'#8a8070'}}>{artworks.length} artwork{artworks.length!==1?'s':''} total</div>
              </button>
            </div>

            {/* Price history chart */}
            {sales.length>0&&(
              <div style={{background:'#fff',border:'1px solid rgba(182,139,46,0.18)',borderRadius:16,overflow:'hidden',marginBottom:16}}>
                <div style={{...CP}}>
                  <div style={SH}>Price History</div>
                  {sales.map((s,i)=>{
                    const art=artworks.find(a=>a.id===s.artworkId);
                    const sold=s.salePrice||0;
                    const reserve=art?.recommendedPrice||0;
                    const pct=reserve>0?Math.round((sold/reserve)*100):100;
                    const barW=Math.min(pct,150).toString()+'%';
                    const pctLabel=pct.toString()+'% of value';
                    const barBg=pct>=100
                      ?'linear-gradient(90deg,'+C.green+',#2d9e5a)'
                      :'linear-gradient(90deg,'+C.gold+','+C.goldD+')';
                    return(
                      <div key={i} style={{marginBottom:14}}>
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
                          <span style={{fontSize:13,color:'#1a1714',fontWeight:500}}>{s.artworkTitle}</span>
                          <span style={{fontSize:13,color:pct>=100?C.green:C.gold,fontWeight:700}}>
                            R {fmt(sold)}
                            <span style={{fontSize:10,opacity:0.7,marginLeft:4}}>{pctLabel}</span>
                          </span>
                        </div>
                        <div style={{height:6,background:'rgba(182,139,46,0.10)',borderRadius:3,overflow:'hidden'}}>
                          <div style={{height:'100%',width:barW,background:barBg,borderRadius:3,transition:'width 1s ease'}}/>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {(artist.instagram||artist.website)&&<div style={{background:'#fff',border:'1px solid rgba(182,139,46,0.18)',borderRadius:16,overflow:'hidden',marginBottom:16}}><div style={{...CP}}><div style={SH}>Connect</div><div style={{display:'flex',gap:10,flexWrap:'wrap'}}>{artist.instagram&&<a href={'https://instagram.com/'+artist.instagram.replace('@','')} target="_blank" rel="noreferrer" style={{display:'flex',alignItems:'center',gap:8,padding:'10px 18px',borderRadius:24,background:`rgba(182,139,46,0.08)`,border:`1px solid ${C.goldB}`,color:C.gold,textDecoration:'none',fontSize:13,fontWeight:600}}>📸 @{artist.instagram.replace('@','')}</a>}{artist.website&&<a href={artist.website} target="_blank" rel="noreferrer" style={{display:'flex',alignItems:'center',gap:8,padding:'10px 18px',borderRadius:24,background:'rgba(100,140,200,0.08)',border:'1px solid rgba(100,140,200,0.20)',color:C.blue,textDecoration:'none',fontSize:13,fontWeight:600}}>🌐 Website</a>}</div></div></div>}

            {artworks.length>0&&<div style={{background:'#fff',border:'1px solid rgba(182,139,46,0.18)',borderRadius:16,overflow:'hidden',marginBottom:16}}><div style={{padding:'20px 20px 12px'}}><div style={SH}>Recent Works</div></div><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(150px,1fr))',gap:1,borderTop:`1px solid ${C.goldL}`}}>{artworks.slice(0,6).map(art=><div key={art.id} onClick={()=>{setTab('works');}} style={{position:'relative',paddingBottom:'100%',background:art.imageUrl?'#e8e4dd':'rgba(182,139,46,0.04)',cursor:'pointer',overflow:'hidden'}} className="art-img-wrap">{art.imageUrl?<img src={art.imageUrl} alt="" style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover'}}/>:<div style={{position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}}><div style={{fontSize:28,opacity:0.2}}>🖼</div></div>}<div className="img-overlay" style={{position:'absolute',inset:0,background:'rgba(0,0,0,0.5)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',opacity:0,transition:'opacity 0.2s'}}><div style={{fontSize:12,fontWeight:600,color:'#fff',textAlign:'center',padding:'0 8px'}}>{art.title}</div><div style={{fontSize:10,color:'rgba(255,255,255,0.7)',marginTop:4}}>R {fmt(art.recommendedPrice)}</div></div><div style={{position:'absolute',top:6,right:6,padding:'2px 6px',borderRadius:10,fontSize:9,fontWeight:700,background:art.status==='Sold'?'rgba(100,140,200,0.9)':art.approvalStatus==='pending'?'rgba(230,190,50,0.9)':'rgba(74,158,107,0.9)',color:'#fff'}}>{art.status==='Sold'?'SOLD':art.approvalStatus==='pending'?'PENDING':'LISTED'}</div></div>)}</div></div>}
          </div>
        )}

        {/* MY WORKS */}
        {tab==='works'&&(
          <div>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20,flexWrap:'wrap',gap:10}}>
              <div style={{fontFamily:SER,fontSize:28,fontWeight:300,color:'#1a1714'}}>My Works</div>
              <button onClick={()=>setTab('upload')} style={{padding:'10px 22px',borderRadius:24,border:'none',background:`linear-gradient(135deg,${C.gold},${C.goldD})`,color:'#fff',fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:SAN,boxShadow:'0 4px 12px rgba(182,139,46,0.28)'}}>+ Upload New</button>
            </div>
            {artworks.length===0?<div style={{background:'#fff',border:'1px solid rgba(182,139,46,0.18)',borderRadius:16,overflow:'hidden',marginBottom:16,textAlign:'center',padding:56}}><div style={{fontSize:44,marginBottom:12,opacity:0.2}}>🖼</div><div style={{fontFamily:SER,fontSize:22,color:'#1a1714',marginBottom:8}}>No works yet</div><div style={{fontSize:13,color:'#8a8070',marginBottom:24}}>Upload your first artwork to get started.</div><button onClick={()=>setTab('upload')} style={{padding:'12px 28px',borderRadius:24,border:'none',background:`linear-gradient(135deg,${C.gold},${C.goldD})`,color:'#fff',fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:SAN}}>Upload Artwork →</button></div>
            :artworks.map(art=>(
              <div key={art.id} style={{background:'#fff',border:'1px solid rgba(182,139,46,0.18)',borderRadius:16,overflow:'hidden',marginBottom:16}}>
                {art.imageUrl?<div className="art-img-wrap" style={{position:'relative',height:220,background:'#e8e4dd',cursor:'pointer'}} onClick={()=>document.getElementById('img-upd-'+art.id).click()}>
                  <img src={art.imageUrl} alt="" style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}}/>
                  <div className="img-overlay" style={{position:'absolute',inset:0,background:'rgba(0,0,0,0.4)',display:'flex',alignItems:'center',justifyContent:'center',opacity:0,transition:'opacity 0.2s'}}><span style={{color:'#fff',fontSize:13,fontWeight:600}}>📷 Change image</span></div>
                </div>:<div style={{height:140,background:'rgba(182,139,46,0.03)',border:`2px dashed ${C.goldB}`,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',gap:10}} onClick={()=>document.getElementById('img-upd-'+art.id).click()}><div style={{fontSize:28}}>🖼</div><div style={{fontSize:13,fontWeight:600,color:C.gold}}>Add artwork image</div></div>}
                <input id={'img-upd-'+art.id} type="file" accept="image/*" style={{display:'none'}} onChange={async(e)=>{const file=e.target.files[0];if(!file)return;const ext=file.name.split('.').pop().toLowerCase();const path=`artworks/${artist.id}-${art.id}.${ext}`;await sb.storage.from('artwork-images').upload(path,file,{upsert:true,contentType:file.type});const{data:u}=sb.storage.from('artwork-images').getPublicUrl(path);await sb.from('artworks').update({image_url:u?.publicUrl||''}).eq('id',art.id);await loadData();}}/>
                <div style={{padding:'16px 20px'}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:10,marginBottom:6}}>
                    <div style={{fontFamily:SER,fontSize:22,color:'#1a1714',fontWeight:400,lineHeight:1.2}}>{art.title}</div>
                    <div style={{display:'flex',gap:8,flexShrink:0,alignItems:'center'}}>
                      {art.status==='Available'&&art.approvalStatus==='approved'&&<button onClick={()=>generateCert(art,artist.name)} style={{padding:'4px 10px',borderRadius:20,border:`1px solid ${C.goldB}`,background:'transparent',color:C.gold,cursor:'pointer',fontSize:10,fontWeight:600,fontFamily:SAN}}>📜 Cert</button>}
                      <span style={{fontSize:10,fontWeight:700,padding:'4px 10px',borderRadius:20,letterSpacing:'0.06em',background:art.status==='Sold'?'rgba(100,140,200,0.12)':art.approvalStatus==='pending'?'rgba(230,190,50,0.12)':'rgba(74,158,107,0.12)',color:art.status==='Sold'?C.blue:art.approvalStatus==='pending'?'#b8920a':C.greenD}}>{art.status==='Sold'?'SOLD':art.approvalStatus==='pending'?'⏳ PENDING':'✓ LISTED'}</span>
                    </div>
                  </div>
                  <div style={{fontSize:12,color:'#8a8070',marginBottom:10}}>{[art.medium,art.dimensions,art.year].filter(Boolean).join(' · ')||'—'}</div>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <span style={{fontSize:13,color:'#8a8070'}}>Value</span>
                    <span style={{fontFamily:SER,fontSize:20,color:C.gold,fontWeight:600}}>R {fmt(art.recommendedPrice)}</span>
                  </div>
                  {art.description&&<div style={{fontSize:12,color:'#8a8070',marginTop:10,lineHeight:1.7,fontStyle:'italic',borderTop:`1px solid ${C.goldL}`,paddingTop:10}}>{art.description}</div>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* UPLOAD */}
        {tab==='upload'&&(
          <div>
            <div style={{fontFamily:SER,fontSize:28,fontWeight:300,color:'#1a1714',marginBottom:4}}>Upload Artwork</div>
            <div style={{fontSize:13,color:'#8a8070',marginBottom:24}}>Submit for admin review. Appears in gallery once approved.</div>
            {uploadMsg&&<div style={{padding:'13px 16px',background:uploadMsg.startsWith('success:')?'rgba(74,158,107,0.08)':'rgba(196,92,74,0.08)',border:`1px solid ${uploadMsg.startsWith('success:')?'rgba(74,158,107,0.25)':'rgba(196,92,74,0.25)'}`,borderRadius:12,fontSize:13,color:uploadMsg.startsWith('success:')?C.greenD:C.red,marginBottom:20}}>{uploadMsg.replace('success:','').replace('error:','')}</div>}
            <div style={{background:'#fff',border:'1px solid rgba(182,139,46,0.18)',borderRadius:16,overflow:'hidden',marginBottom:16}}>
              <div style={CP}>
                <div style={{marginBottom:24}}>
                  <label style={{...lbl,color:'#8a8070'}}>Artwork Image</label>
                  <div onClick={()=>document.getElementById('new-art-img').click()} style={{border:`2px dashed ${uploadImagePreview?'rgba(74,158,107,0.5)':C.goldB}`,borderRadius:14,cursor:'pointer',overflow:'hidden',background:uploadImagePreview?'rgba(74,158,107,0.04)':'#f7f5f1',minHeight:180,display:'flex',alignItems:'center',justifyContent:'center',transition:'all 0.2s'}}>
                    {uploadImagePreview?<div style={{width:'100%',position:'relative'}}><img src={uploadImagePreview} alt="preview" style={{width:'100%',maxHeight:280,objectFit:'cover',display:'block'}}/><div style={{position:'absolute',bottom:10,right:10,background:'rgba(74,158,107,0.9)',color:'#fff',padding:'5px 12px',borderRadius:20,fontSize:11,fontWeight:700}}>✓ Image ready</div></div>:<div style={{textAlign:'center',padding:28}}><div style={{fontSize:40,marginBottom:8}}>🖼</div><div style={{fontSize:14,fontWeight:600,color:'#8a8070',marginBottom:4}}>Tap to upload artwork photo</div><div style={{fontSize:11,color:'#8a8070',opacity:0.6}}>JPG, PNG or WEBP · Max 10MB</div></div>}
                  </div>
                  <input id="new-art-img" type="file" accept="image/*" style={{display:'none'}} onChange={e=>{const file=e.target.files[0];if(!file)return;setUploadImageFile(file);const r=new FileReader();r.onload=ev=>setUploadImagePreview(ev.target.result);r.readAsDataURL(file);}}/>
                  {uploadImagePreview&&<button onClick={()=>{setUploadImageFile(null);setUploadImagePreview(null);}} style={{marginTop:8,background:'none',border:'none',color:C.red,cursor:'pointer',fontSize:12,fontFamily:SAN}}>✕ Remove</button>}
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
                  {[['title','Title *'],['medium','Medium'],['dimensions','Dimensions'],['year','Year']].map(([key,label])=>(
                    <div key={key}><label style={{...lbl,color:'#8a8070'}}>{label}</label><input value={uploadForm[key]||''} onChange={e=>setUploadForm(p=>({...p,[key]:e.target.value}))} style={{width:'100%',padding:'13px 16px',background:'#f7f5f1',border:'1.5px solid rgba(182,139,46,0.22)',borderRadius:12,color:'#1a1714',fontFamily:SAN,fontSize:14,outline:'none',boxSizing:'border-box'}}/></div>
                  ))}
                  <div style={{gridColumn:'1/-1'}}><label style={{...lbl,color:'#8a8070'}}>Price (R) *</label><input type="number" value={uploadForm.price||''} onChange={e=>setUploadForm(p=>({...p,price:e.target.value}))} style={{width:'100%',padding:'13px 16px',background:'#f7f5f1',border:'1.5px solid rgba(182,139,46,0.22)',borderRadius:12,color:'#1a1714',fontFamily:SAN,fontSize:14,outline:'none',boxSizing:'border-box'}} placeholder="e.g. 25000" inputMode="numeric"/></div>
                  <div style={{gridColumn:'1/-1'}}><label style={{...lbl,color:'#8a8070'}}>Description</label><textarea value={uploadForm.description||''} onChange={e=>setUploadForm(p=>({...p,description:e.target.value}))} style={{width:'100%',padding:'13px 16px',background:'#f7f5f1',border:'1.5px solid rgba(182,139,46,0.22)',borderRadius:12,color:'#1a1714',fontFamily:SAN,fontSize:14,outline:'none',boxSizing:'border-box',minHeight:100,resize:'vertical'}} placeholder="Describe the artwork, inspiration, technique…"/></div>
                </div>
                <div style={{marginTop:16,padding:'12px 16px',background:'rgba(182,139,46,0.05)',border:`1px solid ${C.goldL}`,borderRadius:10,fontSize:12,color:'#8a8070',lineHeight:1.6,marginBottom:20}}>ℹ After submission, Vollard Black will review and approve your artwork before it appears in the gallery.</div>
                <div style={{display:'flex',justifyContent:'flex-end'}}><button onClick={submitArtwork} disabled={uploading} style={{padding:'13px 36px',borderRadius:12,border:'none',background:`linear-gradient(135deg,${C.gold},${C.goldD})`,color:'#fff',fontSize:14,fontWeight:700,cursor:uploading?'not-allowed':'pointer',fontFamily:SAN,opacity:uploading?0.6:1,boxShadow:'0 6px 20px rgba(182,139,46,0.30)'}}>{uploading?'Submitting…':'Submit for Approval'}</button></div>
              </div>
            </div>
            {pendingWorks.length>0&&<div style={{marginTop:8}}><div style={{fontSize:10,fontWeight:700,letterSpacing:'0.16em',textTransform:'uppercase',color:'#b8920a',marginBottom:12}}>Awaiting Approval ({pendingWorks.length})</div>{pendingWorks.map(art=><div key={art.id} style={{background:'#fff',border:'1px solid rgba(182,139,46,0.18)',borderRadius:16,overflow:'hidden',marginBottom:16,marginBottom:10}}><div style={{display:'flex',gap:14,alignItems:'center',...CP}}>{art.imageUrl&&<img src={art.imageUrl} alt="" style={{width:56,height:56,borderRadius:10,objectFit:'cover',flexShrink:0,border:`1px solid ${C.goldL}`}}/>}<div style={{flex:1}}><div style={{fontFamily:SER,fontSize:18,color:'#1a1714'}}>{art.title}</div><div style={{fontSize:12,color:'#8a8070'}}>{art.medium||'—'} · R {fmt(art.recommendedPrice)}</div></div><span style={{fontSize:10,fontWeight:700,color:'#b8920a',padding:'4px 10px',background:'rgba(230,190,50,0.12)',borderRadius:20,flexShrink:0}}>⏳ Pending</span></div></div>)}</div>}
          </div>
        )}

        {/* SALES */}
        {tab==='sales'&&(
          <div>
            <div style={{fontFamily:SER,fontSize:28,fontWeight:300,color:'#1a1714',marginBottom:20}}>Sales</div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginBottom:20}}>
              {[['Total Sales',sales.length,'#1a1714'],['Sales Value','R '+fmt(totalSalesValue),C.gold],['Your Share','R '+fmt(artistShare),C.green]].map(([l,v,color])=>(
                <div key={l} style={{background:'#fff',border:'1px solid rgba(182,139,46,0.18)',borderRadius:16,overflow:'hidden',marginBottom:16,textAlign:'center',padding:'20px 12px',marginBottom:0}}><div style={{fontSize:9,letterSpacing:'0.16em',textTransform:'uppercase',color:'#8a8070',marginBottom:8}}>{l}</div><div style={{fontFamily:SER,fontSize:28,fontWeight:300,color}}>{v}</div></div>
              ))}
            </div>
            {sales.length===0?<div style={{background:'#fff',border:'1px solid rgba(182,139,46,0.18)',borderRadius:16,overflow:'hidden',marginBottom:16,textAlign:'center',padding:56}}><div style={{fontSize:44,opacity:0.2,marginBottom:12}}>💰</div><div style={{fontSize:13,color:'#8a8070'}}>No sales yet. Keep creating!</div></div>
            :sales.map(sale=><div key={sale.id} style={{background:'#fff',border:'1px solid rgba(182,139,46,0.18)',borderRadius:16,overflow:'hidden',marginBottom:16}}><div style={CP}><div style={{display:'flex',justifyContent:'space-between',flexWrap:'wrap',gap:8,marginBottom:12}}><div><div style={{fontFamily:SER,fontSize:20,color:'#1a1714',marginBottom:4}}>{sale.artworkTitle}</div><div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}><span style={{fontSize:11,color:'#8a8070'}}>{sale.date||sale.createdAt?.slice(0,10)||'—'}</span><span style={{fontSize:10,fontWeight:700,padding:'2px 8px',borderRadius:10,background:sale.source==='auction'?'rgba(74,158,107,0.12)':'rgba(182,139,46,0.12)',color:sale.source==='auction'?C.greenD:'#8a6a1e'}}>{sale.source==='auction'?'⚖ Auction':'Direct'}</span></div></div><div style={{textAlign:'right'}}><div style={{fontSize:10,color:'#8a8070',marginBottom:2}}>Sale Price</div><div style={{fontFamily:SER,fontSize:22,color:C.gold,fontWeight:600}}>R {fmt(sale.salePrice)}</div></div></div>{(sale.artistShare||0)>0&&<div style={{padding:'12px 16px',background:'rgba(74,158,107,0.06)',border:`1px solid rgba(74,158,107,0.15)`,borderRadius:10,display:'flex',justifyContent:'space-between',alignItems:'center'}}><span style={{fontSize:13,color:C.green,fontWeight:600}}>Your share (30%)</span><span style={{fontFamily:SER,fontSize:20,color:C.greenD,fontWeight:600}}>R {fmt(sale.artistShare)}</span></div>}</div></div>)}
          </div>
        )}

        {/* AUCTIONS */}
        {tab==='auctions'&&(
          <div>
            <div style={{fontFamily:SER,fontSize:28,fontWeight:300,color:'#1a1714',marginBottom:20}}>Auctions</div>
            {auctions.length===0?<div style={{background:'#fff',border:'1px solid rgba(182,139,46,0.18)',borderRadius:16,overflow:'hidden',marginBottom:16,textAlign:'center',padding:56}}><div style={{fontSize:44,opacity:0.2,marginBottom:12}}>⚖</div><div style={{fontSize:13,color:'#8a8070'}}>No auctions yet.</div></div>
            :auctions.map(auc=><div key={auc.id} style={{background:'#fff',border:'1px solid rgba(182,139,46,0.18)',borderRadius:16,overflow:'hidden',marginBottom:16}}><div style={CP}><div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:10,marginBottom:16}}><div style={{fontFamily:SER,fontSize:20,color:'#1a1714'}}>{auc.title}</div><span style={{fontSize:10,fontWeight:700,padding:'4px 12px',borderRadius:20,flexShrink:0,background:auc.status==='Sold'?'rgba(74,158,107,0.12)':auc.status==='Live'?'rgba(196,92,74,0.12)':'rgba(182,139,46,0.12)',color:auc.status==='Sold'?C.greenD:auc.status==='Live'?C.red:C.gold}}>{auc.status}</span></div><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>{[['Reserve','R '+fmt(auc.reservePrice)],['Final Bid','R '+fmt(auc.currentBid||0)],['Bids',auc.bidsCount||0],['Closed',auc.closedAt?.slice(0,10)||'—']].map(([l,v])=><div key={l} style={{padding:'10px 12px',background:'#f7f5f1',borderRadius:8}}><div style={{fontSize:9,color:'#8a8070',letterSpacing:'0.12em',textTransform:'uppercase',marginBottom:4}}>{l}</div><div style={{fontWeight:600,color:'#1a1714'}}>{v}</div></div>)}</div></div></div>)}
          </div>
        )}

        {/* PROFILE */}
        {tab==='profile'&&(
          <div>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:24,flexWrap:'wrap',gap:10}}>
              <div style={{fontFamily:SER,fontSize:28,fontWeight:300,color:'#1a1714'}}>My Profile</div>
              {!profileEdit&&<button onClick={()=>setProfileEdit(true)} style={{padding:'10px 22px',borderRadius:24,border:`1px solid ${C.goldB}`,background:'transparent',color:C.gold,fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:SAN}}>Edit Profile</button>}
            </div>
            {saveMsg&&<div style={{padding:'12px 16px',background:'rgba(74,158,107,0.08)',border:'1px solid rgba(74,158,107,0.20)',borderRadius:12,fontSize:13,color:C.greenD,marginBottom:20}}>✓ {saveMsg}</div>}
            {!profileEdit?(
              <div>
                {[{title:'Personal Information',rows:[['Full Name',artist?.name||'—'],['Email',artist?.email||session.user.email||'—'],['Mobile',artist?.mobile||'—'],['ID / Passport',artist?.idNumber||'—'],['Nationality',artist?.nationality||'—'],['City',artist?.city||'—'],['Country',artist?.country||'—'],['Address',artist?.address||'—']]},{title:'Artist Details',rows:[['Primary Medium',artist?.medium||'—'],['Style',artist?.style||'—'],['Instagram',artist?.instagram?('@'+artist.instagram.replace('@','')):'—'],['Website',artist?.website||'—']]},{title:'Biography',bio:true}].map(section=>(
                  <div key={section.title} style={{background:'#fff',border:'1px solid rgba(182,139,46,0.18)',borderRadius:16,overflow:'hidden',marginBottom:16}}><div style={CP}><div style={SH}>{section.title}</div>
                  {section.bio?artist?.bio?<div style={{padding:'16px',background:'rgba(182,139,46,0.06)',borderRadius:10,fontSize:14,color:'#1a1714',lineHeight:1.8,fontStyle:'italic'}}>"{artist.bio}"</div>:<button onClick={()=>setProfileEdit(true)} style={{padding:'10px 0',background:'none',border:'none',color:C.gold,cursor:'pointer',fontSize:13,fontWeight:600,fontFamily:SAN}}>+ Add biography →</button>
                  :section.rows.map(([label,value])=><div key={label} style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',padding:'10px 0',borderBottom:`1px solid ${C.goldL}`,fontSize:13,gap:12}}><span style={{color:'#8a8070',flexShrink:0}}>{label}</span><span style={{fontWeight:500,textAlign:'right',color:'#1a1714'}}>{value}</span></div>)}</div></div>
                ))}
                <div style={{background:'#fff',border:'1px solid rgba(182,139,46,0.18)',borderRadius:16,overflow:'hidden',marginBottom:16}}><div style={CP}><div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14,...{paddingBottom:10,borderBottom:`1px solid ${C.goldL}`}}}><div style={{fontSize:10,fontWeight:700,letterSpacing:'0.20em',textTransform:'uppercase',color:C.gold}}>Banking Details</div>{artist?.bankVerified?<span style={{fontSize:11,fontWeight:700,color:C.greenD,background:'rgba(74,158,107,0.10)',padding:'3px 10px',borderRadius:20}}>✓ Verified</span>:(artist?.bankName||artist?.accountNumber)?<span style={{fontSize:11,fontWeight:700,color:'#b8920a',background:'rgba(230,190,50,0.10)',padding:'3px 10px',borderRadius:20}}>⏳ Pending</span>:<span style={{fontSize:11,color:'#8a8070'}}>Not yet added</span>}</div>{(artist?.bankName||artist?.accountNumber)?[['Bank',artist?.bankName||'—'],['Account Holder',artist?.accountHolder||'—'],['Account Number',artist?.accountNumber||'—'],['Branch Code',artist?.branchCode||'—']].map(([label,value])=><div key={label} style={{display:'flex',justifyContent:'space-between',padding:'10px 0',borderBottom:`1px solid ${C.goldL}`,fontSize:13,gap:12}}><span style={{color:'#8a8070',flexShrink:0}}>{label}</span><span style={{fontWeight:500}}>{value}</span></div>):<div style={{fontSize:13,color:'#8a8070',padding:'8px 0',lineHeight:1.7}}>Add your banking details so Vollard Black can pay your share of sales.</div>}</div></div>
              </div>
            ):(
              <div>
                {[{title:'Personal Information',fields:[['name','Full Name'],['mobile','Mobile'],['city','City'],['country','Country']],textarea:[['address','Address']]},{title:'Artist Details',fields:[['medium','Primary Medium'],['style','Style'],['instagram','Instagram'],['website','Website']],bioField:true},{title:'Banking Details',bankFields:true}].map(section=>(
                  <div key={section.title} style={{background:'#fff',border:'1px solid rgba(182,139,46,0.18)',borderRadius:16,overflow:'hidden',marginBottom:16,marginBottom:16}}><div style={CP}><div style={SH}>{section.title}</div>
                  {section.bankFields?<div><div style={{fontSize:12,color:'#8a8070',marginBottom:16,lineHeight:1.7}}>Your payout account. Changes require re-verification.</div><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>{[['bankName','Bank Name'],['accountHolder','Account Holder'],['accountNumber','Account Number'],['branchCode','Branch Code']].map(([key,label])=><div key={key}><label style={{...lbl,color:'#8a8070'}}>{label}</label><input value={profileForm[key]||''} onChange={e=>setProfileForm(p=>({...p,[key]:e.target.value}))} style={{width:'100%',padding:'13px 16px',background:'#f7f5f1',border:'1.5px solid rgba(182,139,46,0.22)',borderRadius:12,color:'#1a1714',fontFamily:SAN,fontSize:14,outline:'none',boxSizing:'border-box'}} inputMode={key==='accountNumber'||key==='branchCode'?'numeric':undefined}/></div>)}</div><div style={{marginTop:14,padding:'11px 14px',background:'rgba(230,190,50,0.05)',border:'1px solid rgba(230,190,50,0.18)',borderRadius:10,fontSize:12,color:'#8a8070',lineHeight:1.6}}>⚠ Changes flag your account for verification before payouts resume.</div></div>
                  :<div><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>{(section.fields||[]).map(([key,label])=><div key={key}><label style={{...lbl,color:'#8a8070'}}>{label}</label><input value={profileForm[key]||''} onChange={e=>setProfileForm(p=>({...p,[key]:e.target.value}))} style={{width:'100%',padding:'13px 16px',background:'#f7f5f1',border:'1.5px solid rgba(182,139,46,0.22)',borderRadius:12,color:'#1a1714',fontFamily:SAN,fontSize:14,outline:'none',boxSizing:'border-box'}} placeholder={key==='instagram'?'@yourhandle':key==='website'?'https://...':''}/></div>)}{(section.textarea||[]).map(([key,label])=><div key={key} style={{gridColumn:'1/-1'}}><label style={{...lbl,color:'#8a8070'}}>{label}</label><textarea value={profileForm[key]||''} onChange={e=>setProfileForm(p=>({...p,[key]:e.target.value}))} style={{width:'100%',padding:'13px 16px',background:'#f7f5f1',border:'1.5px solid rgba(182,139,46,0.22)',borderRadius:12,color:'#1a1714',fontFamily:SAN,fontSize:14,outline:'none',boxSizing:'border-box',minHeight:60,resize:'vertical'}}/></div>)}{section.bioField&&<div style={{gridColumn:'1/-1'}}><label style={{...lbl,color:'#8a8070'}}>Biography / Artist Statement</label><textarea value={profileForm.bio||''} onChange={e=>setProfileForm(p=>({...p,bio:e.target.value}))} style={{width:'100%',padding:'13px 16px',background:'#f7f5f1',border:'1.5px solid rgba(182,139,46,0.22)',borderRadius:12,color:'#1a1714',fontFamily:SAN,fontSize:14,outline:'none',boxSizing:'border-box',minHeight:120,resize:'vertical'}} placeholder="Tell collectors about your practice, inspiration, style, and what drives your work…"/></div>}</div></div>}
                  </div></div>
                ))}
                <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}><button onClick={()=>setProfileEdit(false)} style={{padding:'12px 22px',borderRadius:12,border:`1px solid ${C.goldB}`,background:'transparent',color:C.gold,fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:SAN}}>Cancel</button><button onClick={saveProfile} disabled={savingProfile} style={{padding:'12px 28px',borderRadius:12,border:'none',background:`linear-gradient(135deg,${C.gold},${C.goldD})`,color:'#fff',fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:SAN,opacity:savingProfile?0.6:1,boxShadow:'0 4px 14px rgba(182,139,46,0.28)'}}>{savingProfile?'Saving…':'Save Changes'}</button></div>
              </div>
            )}
          </div>
        )}

        {/* TERMS */}
        {tab==='terms'&&(
          <div>
            <div style={{fontFamily:SER,fontSize:28,fontWeight:300,color:'#1a1714',marginBottom:20}}>Artist Representation Agreement</div>
            <div style={{background:'#fff',border:'1px solid rgba(182,139,46,0.18)',borderRadius:16,overflow:'hidden',marginBottom:16}}><div style={CP}><div style={{fontSize:12,color:'#8a8070',marginBottom:20}}>Vollard Black (Pty) Ltd · Hermanus, South Africa</div>{[['1. Representation','By registering, you authorise Vollard Black to display, market, and sell your artworks through its platform, gallery network, and auction services.'],['2. Commission','On each sale: Artist Share 30% · Gallery Partner Share 40% · Vollard Black Share 30%. Applied to the license fee (50% of sale price).'],['3. Submissions','All submissions are subject to approval. Approved works are listed in the gallery.'],['4. Intellectual Property','You retain full copyright. You grant Vollard Black a non-exclusive licence to use artwork images for marketing.'],['5. Authenticity','You warrant all submitted works are original and free from third-party claims.'],['6. Payment','Artist shares are paid within 14 business days of a confirmed sale to the bank account on file.']].map(([title,text])=><div key={title} style={{marginBottom:16,paddingBottom:16,borderBottom:`1px solid ${C.goldL}`}}><div style={{fontFamily:SER,fontSize:16,color:'#1a1714',marginBottom:6,fontWeight:500}}>{title}</div><div style={{fontSize:13,color:'#8a8070',lineHeight:1.8}}>{text}</div></div>)}<div style={{padding:'12px 16px',background:'rgba(182,139,46,0.06)',borderRadius:10,fontSize:12,color:'#8a6a1e'}}>Contact: <strong>concierge@vollardblack.com</strong></div></div></div>
          </div>
        )}
      </div>

      {/* Mobile bottom nav */}
      <div style={{position:'fixed',bottom:0,left:0,right:0,background:'#fff',borderTop:'1px solid rgba(182,139,46,0.18)',padding:'8px 0',display:'flex',justifyContent:'space-around',zIndex:50,boxShadow:'0 -4px 20px rgba(0,0,0,0.08)'}}>
        {[['overview','🏠','Home'],['works','🖼','Works'],['upload','➕','Upload'],['sales','💰','Sales'],['profile','👤','Profile']].map(([id,icon,lbl])=>(
          <button key={id} onClick={()=>setTab(id)} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:2,padding:'4px 12px',background:'none',border:'none',cursor:'pointer',fontFamily:SAN}}>
            <span style={{fontSize:18,opacity:tab===id?1:0.45}}>{icon}</span>
            <span style={{fontSize:9,letterSpacing:'0.06em',textTransform:'uppercase',color:tab===id?C.gold:'#8a8070',fontWeight:tab===id?700:400}}>{lbl}</span>
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
export default function ArtistPortal(){{
  const[session,setSession]=useState(undefined);
  const[screen,setScreen]=useState('loading');
  const[hasKycDocs,setHasKycDocs]=useState(true);
  const justRegistered=useRef(false); // prevents auth state change from overriding pending

  useEffect(()=>{{
    if(!sb){{setSession(null);setScreen('auth');return;}}
    sb.auth.getSession().then(({{data}})=>setSession(data?.session||null));
    const{{data:{{subscription}}}}=sb.auth.onAuthStateChange((_,s)=>setSession(s));
    return()=>subscription.unsubscribe();
  }},[]);

  useEffect(()=>{{
    if(session===undefined)return;
    if(!session){{setScreen('auth');return;}}
    if(justRegistered.current)return; // just registered — stay on pending
    checkAccess(session.user.email.toLowerCase());
  }},[session]);

  const checkTermsLocal=(email)=>{{
    try{{const s=JSON.parse(localStorage.getItem('vb_terms_artist')||'null');return !!(s&&s.email===email&&s.v===TERMS_VERSION);}}catch{{return false;}}
  }};

  const checkAccess=async(email)=>{{
    setScreen('loading');
    try{{
      const{{data:myRow}}=await sb.from('portal_requests').select('status,id_document_url,selfie_url').eq('email',email).eq('role','artist').order('created_at',{{ascending:false}}).limit(1).maybeSingle();
      if(myRow){{
        if(myRow.status==='approved'){{
          setHasKycDocs(!!(myRow.id_document_url||myRow.selfie_url));
          setScreen(checkTermsLocal(email)?'dashboard':'terms');
        }}else{{setScreen('pending');}}
        return;
      }}
      const{{data:anyRow}}=await sb.from('portal_requests').select('id').eq('email',email).limit(1).maybeSingle();
      if(anyRow){{
        await sb.from('portal_requests').upsert({{id:crypto.randomUUID(),email,role:'artist',status:'pending',created_at:new Date().toISOString()}},{{onConflict:'email,role'}}).catch(()=>{{}});
        setScreen('pending');
      }}else{{
        setScreen('kyc');
      }}
    }}catch(e){{console.error(e);setScreen('auth');}}
  }};

  if(session===undefined||screen==='loading')
    return<div style={{{{minHeight:'100vh',background:G.cream,display:'flex',alignItems:'center',justifyContent:'center'}}}}>
      <div style={{{{fontFamily:F.ser,fontSize:20,letterSpacing:8,color:G.gold,opacity:0.5}}}}>VOLLARD BLACK</div>
    </div>;

  if(screen==='auth'||!session)
    return<AuthScreen onAuth={{s=>setSession(s)}}/>;

  if(screen==='kyc')
    return<KYCRegistration role="artist" supabase={{sb}} 
      onComplete={{()=>{{justRegistered.current=true;setScreen('pending');}}}} 
      onSignIn={{()=>setScreen('auth')}}/>;

  if(screen==='pending')
    return<NotApprovedScreen onSignOut={{()=>{{justRegistered.current=false;sb.auth.signOut();}}}}/>;

  if(screen==='terms')
    return<TermsModal email={{session.user.email}} onAccepted={{()=>setScreen('dashboard')}}/>;

  return<ArtistDashboard session={{session}} kycComplete={{hasKycDocs}}/>;
}}
