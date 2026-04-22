'use client';
import KYCRegistration from './KYCRegistration';
import { useState, useEffect } from "react";
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey, { auth: { autoRefreshToken: true, persistSession: true } })
  : null;

const fmt = n => Number(n||0).toLocaleString('en-ZA',{minimumFractionDigits:2,maximumFractionDigits:2});
const toCamel = obj => { if(!obj||typeof obj!=='object'||Array.isArray(obj))return obj; const o={}; for(const[k,v]of Object.entries(obj))o[k.replace(/_([a-z])/g,(_,c)=>c.toUpperCase())]=v; return o; };
const toSnake = obj => { if(!obj||typeof obj!=='object')return obj; const o={}; for(const[k,v]of Object.entries(obj))o[k.replace(/[A-Z]/g,m=>'_'+m.toLowerCase())]=v; return o; };

const C = { gold:'#b68b2e',goldD:'#8a6a1e',goldL:'rgba(182,139,46,0.12)',goldB:'rgba(182,139,46,0.22)',cream:'#f5f3ef',dark:'#1a1714',mid:'#6b635a',light:'#8a8070',red:'#c45c4a',green:'#4a9e6b',greenD:'#2d7a4a',blue:'#648cc8',white:'#ffffff' };
const SER = "'Cormorant Garamond',serif";
const SAN = "'DM Sans',sans-serif";

function Logo({sub}){return(<div style={{textAlign:'center',marginBottom:40}}><div style={{fontFamily:SER,fontSize:36,fontWeight:300,letterSpacing:10,color:C.dark}}>VOLLARD <span style={{color:C.gold}}>BLACK</span></div><div style={{fontSize:10,letterSpacing:4,textTransform:'uppercase',color:C.light,marginTop:6}}>{sub}</div><div style={{width:40,height:1,background:'rgba(182,139,46,0.4)',margin:'16px auto 0'}}/></div>);}

function PendingScreen({email,onSignIn}){return(<div style={{minHeight:'100vh',background:C.cream,display:'flex',alignItems:'center',justifyContent:'center',padding:20,fontFamily:SAN}}><div style={{width:'100%',maxWidth:420,textAlign:'center'}}><Logo sub="License Holder Portal"/><div style={{background:C.white,border:`1px solid ${C.goldB}`,borderRadius:16,padding:40}}><div style={{fontSize:56,marginBottom:16}}>◆</div><div style={{fontFamily:SER,fontSize:26,color:C.dark,marginBottom:12}}>Application Submitted</div><div style={{fontSize:14,color:C.mid,lineHeight:1.8,marginBottom:24}}>Thank you. Vollard Black is reviewing your application.<br/>You'll be notified once approved.<br/><br/><strong>{email}</strong></div><button onClick={onSignIn} style={{padding:'12px 28px',borderRadius:24,border:`1px solid ${C.goldB}`,background:'transparent',color:C.gold,cursor:'pointer',fontSize:13,fontWeight:600,fontFamily:SAN}}>Sign In Instead</button></div></div></div>);}

function NotApprovedScreen({onSignOut}){return(<div style={{minHeight:'100vh',background:C.cream,display:'flex',alignItems:'center',justifyContent:'center',padding:20,fontFamily:SAN}}><div style={{width:'100%',maxWidth:420,textAlign:'center'}}><Logo sub="License Holder Portal"/><div style={{background:C.white,border:`1px solid ${C.goldB}`,borderRadius:16,padding:40}}><div style={{fontSize:56,marginBottom:16}}>⏳</div><div style={{fontFamily:SER,fontSize:26,color:C.dark,marginBottom:12}}>Pending Approval</div><div style={{fontSize:14,color:C.mid,lineHeight:1.8,marginBottom:24}}>Your application is under review. Vollard Black will contact you once approved.</div><button onClick={onSignOut} style={{padding:'12px 28px',borderRadius:24,border:`1px solid ${C.goldB}`,background:'transparent',color:C.gold,cursor:'pointer',fontSize:13,fontWeight:600,fontFamily:SAN}}>Sign Out</button></div></div></div>);}

function LoginScreen({onLogin,onRegister}){
  const[email,setEmail]=useState('');const[pw,setPw]=useState('');const[loading,setLoading]=useState(false);const[error,setError]=useState('');const[showPw,setShowPw]=useState(false);
  const handle=async()=>{if(!email||!pw)return setError('Enter your email and password.');setLoading(true);setError('');const{data,error:e}=await supabase.auth.signInWithPassword({email,password:pw});setLoading(false);if(e)setError(e.message);else onLogin(data.session);};
  return(<div style={{minHeight:'100vh',background:C.cream,display:'flex',alignItems:'center',justifyContent:'center',padding:20,fontFamily:SAN}}><div style={{width:'100%',maxWidth:400}}><Logo sub="License Holder Portal"/><div style={{background:C.white,border:`1px solid ${C.goldB}`,borderRadius:16,padding:32}}>{error&&<div style={{padding:'12px 16px',background:'rgba(196,92,74,0.08)',border:'1px solid rgba(196,92,74,0.25)',borderRadius:10,fontSize:13,color:C.red,marginBottom:20}}>{error}</div>}<div style={{marginBottom:18}}><label style={{display:'block',fontSize:10,fontWeight:700,letterSpacing:'0.14em',textTransform:'uppercase',color:C.mid,marginBottom:8}}>Email</label><input type="email" value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handle()} style={{width:'100%',padding:'13px 16px',background:C.white,border:`1.5px solid ${C.goldB}`,borderRadius:12,color:C.dark,fontFamily:SAN,fontSize:14,outline:'none',boxSizing:'border-box'}} autoComplete="email"/></div><div style={{marginBottom:24}}><label style={{display:'block',fontSize:10,fontWeight:700,letterSpacing:'0.14em',textTransform:'uppercase',color:C.mid,marginBottom:8}}>Password</label><div style={{position:'relative'}}><input type={showPw?'text':'password'} value={pw} onChange={e=>setPw(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handle()} style={{width:'100%',padding:'13px 16px',paddingRight:60,background:C.white,border:`1.5px solid ${C.goldB}`,borderRadius:12,color:C.dark,fontFamily:SAN,fontSize:14,outline:'none',boxSizing:'border-box'}} autoComplete="current-password"/><button type="button" onClick={()=>setShowPw(p=>!p)} style={{position:'absolute',right:14,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',color:C.light,cursor:'pointer',fontSize:12,fontFamily:SAN,fontWeight:600}}>{showPw?'Hide':'Show'}</button></div></div><button onClick={handle} disabled={loading} style={{width:'100%',padding:14,borderRadius:12,border:'none',background:`linear-gradient(135deg,${C.gold},${C.goldD})`,color:C.white,fontSize:14,fontWeight:700,cursor:'pointer',fontFamily:SAN,opacity:loading?0.6:1,boxShadow:'0 6px 20px rgba(182,139,46,0.28)'}}>{loading?'Signing in…':'Sign In'}</button><div style={{textAlign:'center',marginTop:20,fontSize:13,color:C.light}}>New here? <button onClick={onRegister} style={{background:'none',border:'none',color:C.gold,cursor:'pointer',fontWeight:600,fontFamily:SAN,fontSize:13}}>Register →</button></div></div></div></div>);
}

// ── QR Code generator ───────────────────────────────────────
function generateQR(art,galleryName){
  const url=`https://vollard-black.vercel.app`;
  const w=window.open('','_blank');
  const html=`<!DOCTYPE html><html><head><title>Wall Label — ${art.title}</title><script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script><style>@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500&family=DM+Sans:wght@400;600&display=swap');body{margin:0;padding:40px;background:#f5f3ef;font-family:'DM Sans',sans-serif;display:flex;justify-content:center;}.label{width:240px;background:#fff;border:1px solid rgba(182,139,46,0.3);padding:24px;text-align:center;}.logo{font-family:'Cormorant Garamond',serif;font-size:14px;letter-spacing:0.3em;color:#1a1714;margin-bottom:16px;}.logo span{color:#b68b2e;}.title{font-family:'Cormorant Garamond',serif;font-size:20px;color:#1a1714;margin-bottom:4px;}.artist{font-size:12px;color:#b68b2e;font-weight:600;margin-bottom:4px;}.details{font-size:11px;color:#8a8070;margin-bottom:16px;}.qr{display:flex;justify-content:center;margin:16px 0;}.caption{font-size:9px;color:#8a8070;letter-spacing:0.1em;text-transform:uppercase;}@media print{body{background:#fff;}}</style></head><body><div class="label"><div class="logo">VOLLARD <span>BLACK</span></div><div class="title">${art.title}</div><div class="artist">${art.artistName||'Unknown Artist'}</div><div class="details">${[art.medium,art.year].filter(Boolean).join(' · ')||'—'}</div><div class="qr" id="qr"></div><div class="caption">Scan to view gallery</div></div><script>new QRCode(document.getElementById('qr'),{text:'${url}',width:120,height:120,colorDark:'#1a1714',colorLight:'#fff'});setTimeout(()=>window.print(),500);</script></body></html>`;
  w.document.write(html);w.document.close();
}

// ── License Agreement PDF ───────────────────────────────────
function generateAgreement(collector,sched,art){
  const w=window.open('','_blank');
  const name=`${collector.firstName||''} ${collector.lastName||''}`.trim()||collector.companyName||'—';
  const html=`<!DOCTYPE html><html><head><title>License Agreement</title><style>@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500&family=DM+Sans:wght@400;600&display=swap');body{margin:0;padding:60px;background:#fff;font-family:'DM Sans',sans-serif;color:#1a1714;max-width:700px;}@page{size:A4;margin:20mm;}@media print{body{padding:0;}}.logo{font-family:'Cormorant Garamond',serif;font-size:22px;letter-spacing:0.3em;margin-bottom:4px;}.logo span{color:#b68b2e;}.sub{font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:#8a8070;margin-bottom:40px;}.title{font-family:'Cormorant Garamond',serif;font-size:28px;margin-bottom:32px;color:#1a1714;}.section{margin-bottom:24px;}.label{font-size:9px;letter-spacing:0.15em;text-transform:uppercase;color:#8a8070;margin-bottom:4px;}.value{font-size:15px;font-weight:600;}.terms{margin-top:32px;font-size:12px;color:#4a4440;line-height:1.9;}.term{margin-bottom:12px;}</style></head><body><div class="logo">VOLLARD <span>BLACK</span></div><div class="sub">Display License Agreement</div><div class="title">License Agreement</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:32px;padding:24px;background:#f5f3ef;border-radius:8px;"><div><div class="label">License Holder</div><div class="value">${name}</div></div><div><div class="label">Artwork</div><div class="value">${sched.artworkTitle||art?.title||'—'}</div></div><div><div class="label">Start Date</div><div class="value">${sched.startDate||'—'}</div></div><div><div class="label">Term</div><div class="value">${sched.termMonths} months</div></div><div><div class="label">Monthly Fee</div><div class="value">R ${fmt(sched.monthlyAmount)}</div></div><div><div class="label">Total Due</div><div class="value">R ${fmt(sched.totalDue)}</div></div></div><div class="terms"><div class="term"><strong>1. Display License:</strong> The license holder is granted the right to display the above artwork at their registered premises for the duration of the agreement.</div><div class="term"><strong>2. Fees:</strong> License fees are due on the 25th of each month. A grace period extends to the 7th of the following month.</div><div class="term"><strong>3. Care:</strong> The license holder agrees to display the artwork safely and notify Vollard Black immediately of any damage or theft.</div><div class="term"><strong>4. Sale:</strong> Should the artwork sell, the outstanding license fee balance is deducted from proceeds. The remainder is paid to the license holder.</div><div class="term"><strong>5. Ownership:</strong> Title remains with the artist/Vollard Black until the full license fee is paid and a sale is concluded.</div></div><div style="margin-top:48px;display:grid;grid-template-columns:1fr 1fr;gap:40px;"><div style="border-top:1px solid #ccc;padding-top:8px;font-size:11px;color:#8a8070;">License Holder signature &amp; date</div><div style="border-top:1px solid #ccc;padding-top:8px;font-size:11px;color:#8a8070;">Vollard Black authorised signature &amp; date</div></div></body></html>`;
  w.document.write(html);w.document.close();
}

// ── Payment calendar ────────────────────────────────────────
function PaymentCalendar({schedules,payments}){
  const now=new Date();
  const months=[];
  for(let i=-2;i<=4;i++){
    const d=new Date(now.getFullYear(),now.getMonth()+i,1);
    months.push({label:d.toLocaleDateString('en-ZA',{month:'short',year:'numeric'}),year:d.getFullYear(),month:d.getMonth()+1,key:`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`});
  }
  const paidMonths=new Set(payments.map(p=>`${p.scheduleId}-${p.monthNumber}`));
  return(
    <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:6}}>
      {months.map(m=>{
        const dueThisMonth=schedules.filter(s=>{
          if(!s.startDate)return false;
          const start=new Date(s.startDate);
          const monthsDiff=(m.year-start.getFullYear())*12+(m.month-1-(start.getMonth()));
          return monthsDiff>=0&&monthsDiff<(s.termMonths||0);
        });
        const allPaid=dueThisMonth.length>0&&dueThisMonth.every(s=>{
          const start=new Date(s.startDate);
          const mNum=(m.year-start.getFullYear())*12+(m.month-1-start.getMonth())+1;
          return paidMonths.has(`${s.id}-${mNum}`);
        });
        const isNow=m.key===`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
        const isPast=new Date(m.year,m.month-1,1)<new Date(now.getFullYear(),now.getMonth(),1);
        const hasDue=dueThisMonth.length>0;
        return(
          <div key={m.key} style={{padding:'8px 4px',borderRadius:8,textAlign:'center',background:isNow?`rgba(182,139,46,0.15)`:allPaid?'rgba(74,158,107,0.10)':hasDue&&isPast?'rgba(196,92,74,0.08)':'transparent',border:isNow?`1.5px solid ${C.gold}`:'1px solid rgba(182,139,46,0.12)'}}>
            <div style={{fontSize:9,color:isNow?C.gold:C.light,fontWeight:isNow?700:400,marginBottom:4}}>{m.label}</div>
            {hasDue&&<div style={{fontSize:16}}>{allPaid?'✅':isPast?'⚠️':'📅'}</div>}
            {!hasDue&&<div style={{fontSize:16,opacity:0.2}}>—</div>}
          </div>
        );
      })}
    </div>
  );
}

// ── Notification centre ─────────────────────────────────────
function NotifCentre({notifs,onClear}){
  const[open,setOpen]=useState(false);const unread=notifs.filter(n=>!n.read).length;
  return(<div style={{position:'relative'}}><button onClick={()=>setOpen(p=>!p)} style={{position:'relative',padding:'8px 12px',borderRadius:8,border:`1px solid ${C.goldB}`,background:'transparent',color:C.mid,cursor:'pointer',fontSize:16,lineHeight:1}}>🔔{unread>0&&<span style={{position:'absolute',top:-4,right:-4,width:16,height:16,borderRadius:'50%',background:C.red,color:C.white,fontSize:9,fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center'}}>{unread}</span>}</button>{open&&<div style={{position:'absolute',right:0,top:44,width:300,background:C.white,border:`1px solid ${C.goldB}`,borderRadius:16,boxShadow:'0 8px 32px rgba(0,0,0,0.12)',zIndex:100,overflow:'hidden'}}><div style={{padding:'14px 16px',borderBottom:`1px solid ${C.goldL}`,display:'flex',justifyContent:'space-between',alignItems:'center'}}><span style={{fontWeight:700,fontSize:13,color:C.dark}}>Notifications</span><button onClick={()=>{onClear();setOpen(false);}} style={{background:'none',border:'none',color:C.light,cursor:'pointer',fontSize:12,fontFamily:SAN}}>Clear all</button></div><div style={{maxHeight:280,overflowY:'auto'}}>{notifs.length===0?<div style={{padding:24,textAlign:'center',fontSize:13,color:C.light}}>No notifications yet</div>:notifs.map((n,i)=><div key={i} style={{padding:'12px 16px',borderBottom:`1px solid ${C.goldL}`,background:n.read?C.white:'rgba(182,139,46,0.04)'}}><div style={{fontSize:13,color:C.dark,fontWeight:n.read?400:600,marginBottom:2}}>{n.msg}</div><div style={{fontSize:11,color:C.light}}>{n.time}</div></div>)}</div></div>}</div>);
}

// ── Main Dashboard ──────────────────────────────────────────
function RenterDashboard({session}){
  const[tab,setTab]=useState('overview');
  const[collector,setCollector]=useState(null);
  const[schedules,setSchedules]=useState([]);
  const[payments,setPayments]=useState([]);
  const[artworks,setArtworks]=useState([]);
  const[sales,setSales]=useState([]);
  const[loading,setLoading]=useState(true);
  const[profileForm,setProfileForm]=useState(null);
  const[profileEdit,setProfileEdit]=useState(false);
  const[savingProfile,setSavingProfile]=useState(false);
  const[saveMsg,setSaveMsg]=useState('');
  const[notifs,setNotifs]=useState([]);
  const[darkMode,setDarkMode]=useState(false);
  const[ikhokaLoading,setIkhokaLoading]=useState(null);
  const[ikhokaLink,setIkhokaLink]=useState(null);

  const addNotif=msg=>setNotifs(p=>[{msg,time:new Date().toLocaleTimeString('en-ZA',{hour:'2-digit',minute:'2-digit'}),read:false},...p.slice(0,19)]);

  useEffect(()=>{loadData();},[session]);

  useEffect(()=>{
    if(typeof window==='undefined')return;
    const params=new URLSearchParams(window.location.search);
    const pay=params.get('payment');
    if(pay==='success'){addNotif('✓ Payment submitted! Vollard Black will confirm shortly.');window.history.replaceState({},'',window.location.pathname);setTab('payments');}
    else if(pay==='failed'){addNotif('⚠ Payment failed. Please try again.');window.history.replaceState({},'',window.location.pathname);}
    else if(pay==='cancelled'){addNotif('Payment cancelled — no charge made.');window.history.replaceState({},'',window.location.pathname);}
  },[]);

  useEffect(()=>{
    if(!session||!supabase)return;
    const ch=supabase.channel('renter-rt')
      .on('postgres_changes',{event:'INSERT',schema:'public',table:'sales'},payload=>{
        const s=payload.new;
        addNotif(`🎉 "${s.artwork_title}" sold for R ${Number(s.sale_price||0).toLocaleString('en-ZA')}!`);
        loadData();
      })
      .on('postgres_changes',{event:'UPDATE',schema:'public',table:'schedules'},()=>loadData())
      .subscribe();
    return()=>supabase.removeChannel(ch);
  },[session]);

  const loadData=async()=>{
    setLoading(true);
    try{
      const{data:cols}=await supabase.from('collectors').select('*').eq('email',session.user.email);
      if(!cols||cols.length===0){setLoading(false);return;}
      const col=toCamel(cols[0]);setCollector(col);
      setProfileForm({firstName:col.firstName||'',lastName:col.lastName||'',mobile:col.mobile||'',idNumber:col.idNumber||'',nationality:col.nationality||'',city:col.city||'',country:col.country||'South Africa',address:col.address||'',bankName:col.bankName||'',accountHolder:col.accountHolder||'',accountNumber:col.accountNumber||'',branchCode:col.branchCode||'',bankVerified:col.bankVerified||false});
      const{data:scheds}=await supabase.from('schedules').select('*').eq('collector_id',col.id);
      const s=(scheds||[]).map(toCamel);setSchedules(s);
      const{data:pays}=await supabase.from('payments').select('*').eq('collector_id',col.id).order('created_at',{ascending:false});
      setPayments((pays||[]).map(toCamel));
      const artIds=s.map(sc=>sc.artworkId).filter(Boolean);
      if(artIds.length>0){const{data:arts}=await supabase.from('artworks').select('*').in('id',artIds);setArtworks((arts||[]).map(toCamel));}
      const{data:sls}=await supabase.from('sales').select('*').eq('collector_id',col.id);
      setSales((sls||[]).map(toCamel));
    }catch(e){console.error(e);}
    setLoading(false);
  };

  const signOut=()=>supabase.auth.signOut();
  const gn=c=>c?(c.type==='company'?c.companyName:`${c.firstName||''} ${c.lastName||''}`.trim()):'';

  const initiatePayment=async(sched,nextMonth)=>{
    setIkhokaLoading(sched.id);
    try{
      const res=await fetch('/api/ikhoka-paylink',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({amount:sched.monthlyAmount,description:`Vollard Black License Fee: ${sched.artworkTitle} Mo ${nextMonth}`,scheduleId:sched.id,monthNumber:nextMonth,collectorEmail:session.user.email})});
      const data=await res.json();
      if(data.paylinkUrl){setIkhokaLink({url:data.paylinkUrl,sched,month:nextMonth});} else{alert('Payment setup failed.');}
    }catch(e){alert('Error: '+e.message);}
    setIkhokaLoading(null);
  };

  const totalPaid=payments.reduce((s,p)=>s+(p.amount||0),0);
  const totalOwed=schedules.reduce((s,sc)=>s+(sc.totalDue||0),0);
  const balance=totalOwed-totalPaid;
  const activeScheds=schedules.filter(s=>s.status==='Active');

  const bg=darkMode?'#0f0d0b':'#f5f3ef';
  const cardBg=darkMode?'#1a1714':C.white;
  const cardBorder=darkMode?'rgba(182,139,46,0.20)':'rgba(182,139,46,0.15)';
  const textPrimary=darkMode?'#f5f3ef':C.dark;
  const textSecondary=darkMode?'rgba(245,243,239,0.55)':C.light;
  const inputBg=darkMode?'#2a2318':C.white;
  const inp={width:'100%',padding:'13px 16px',background:inputBg,border:`1.5px solid ${darkMode?'rgba(182,139,46,0.30)':C.goldB}`,borderRadius:12,color:textPrimary,fontFamily:SAN,fontSize:14,outline:'none',boxSizing:'border-box'};
  const lbl={display:'block',fontSize:10,fontWeight:700,letterSpacing:'0.14em',textTransform:'uppercase',color:textSecondary,marginBottom:8};
  const CARD={background:cardBg,border:`1px solid ${cardBorder}`,borderRadius:16,overflow:'hidden',marginBottom:16};
  const CP={padding:'20px'};
  const SH={fontSize:10,fontWeight:700,letterSpacing:'0.20em',textTransform:'uppercase',color:C.gold,marginBottom:14,paddingBottom:10,borderBottom:`1px solid ${C.goldL}`};

  if(loading)return<div style={{minHeight:'100vh',background:bg,display:'flex',alignItems:'center',justifyContent:'center'}}><div style={{fontFamily:SER,fontSize:24,color:C.gold,letterSpacing:6,opacity:0.6}}>Loading…</div></div>;

  if(!collector)return(<div style={{minHeight:'100vh',background:bg,display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:16,padding:20,fontFamily:SAN}}><Logo sub="License Holder Portal"/><div style={{background:cardBg,border:`1px solid ${cardBorder}`,borderRadius:16,padding:40,textAlign:'center',maxWidth:420,width:'100%'}}><div style={{fontFamily:SER,fontSize:22,color:textPrimary,marginBottom:8}}>Account Not Linked</div><div style={{fontSize:13,color:textSecondary,marginBottom:16}}>Contact Vollard Black to link your account.</div><button onClick={signOut} style={{padding:'10px 24px',borderRadius:8,border:`1px solid ${C.goldB}`,background:'transparent',color:C.gold,cursor:'pointer',fontSize:13,fontWeight:600,fontFamily:SAN}}>Sign Out</button></div></div>);

  return(
    <div style={{minHeight:'100vh',background:bg,fontFamily:SAN,color:textPrimary,transition:'background 0.3s'}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600&family=DM+Sans:wght@300;400;500;600&display=swap');*{box-sizing:border-box;}input:focus,select:focus,textarea:focus{border-color:${C.gold}!important;box-shadow:0 0 0 3px rgba(182,139,46,0.12)!important;outline:none;}`}</style>

      {/* Top bar */}
      <div style={{background:darkMode?'#1a1714':C.white,borderBottom:`1px solid ${cardBorder}`,padding:'0 20px',height:56,display:'flex',alignItems:'center',justifyContent:'space-between',position:'sticky',top:0,zIndex:50,boxShadow:'0 1px 12px rgba(0,0,0,0.06)'}}>
        <a href="/" style={{textDecoration:'none',display:'flex',alignItems:'center',gap:10}}><div style={{fontFamily:SER,fontSize:18,fontWeight:300,letterSpacing:'0.20em',color:textPrimary}}>VOLLARD <span style={{color:C.gold}}>BLACK</span></div><div style={{width:1,height:14,background:C.goldB}}/><span style={{fontSize:9,letterSpacing:'0.18em',textTransform:'uppercase',color:C.gold,fontWeight:700}}>License Holder</span></a>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <button onClick={()=>setDarkMode(d=>!d)} style={{padding:'7px 12px',borderRadius:8,border:`1px solid ${cardBorder}`,background:'transparent',color:textSecondary,cursor:'pointer',fontSize:14,lineHeight:1}}>{darkMode?'☀':'🌙'}</button>
          <NotifCentre notifs={notifs} onClear={()=>setNotifs([])}/>
          <button onClick={()=>window.open('https://wa.me/27826503393?text='+encodeURIComponent('Hi Vollard Black, I need assistance with my license holder portal.'),'_blank')} style={{padding:'7px 12px',borderRadius:8,border:'1px solid rgba(37,211,102,0.30)',background:'rgba(37,211,102,0.08)',color:'#25d366',cursor:'pointer',fontSize:13,fontWeight:600,fontFamily:SAN}}>Chat</button>
          <span style={{fontSize:13,color:textSecondary,fontWeight:500}}>{gn(collector)}</span>
          <button onClick={signOut} style={{padding:'7px 14px',borderRadius:8,border:`1px solid ${cardBorder}`,background:'transparent',color:textSecondary,cursor:'pointer',fontSize:11,fontFamily:SAN}}>Sign Out</button>
        </div>
      </div>

      {/* Hero */}
      <div style={{background:'linear-gradient(135deg,#1a1714 0%,#2a2018 60%,#1e1a10 100%)',padding:'36px 20px 28px',position:'relative',overflow:'hidden'}}>
        <div style={{position:'absolute',inset:0,backgroundImage:'radial-gradient(ellipse at 80% 50%, rgba(182,139,46,0.12) 0%, transparent 60%)',pointerEvents:'none'}}/>
        <div style={{position:'absolute',bottom:0,left:0,right:0,height:1,background:'linear-gradient(90deg,transparent,rgba(182,139,46,0.5),transparent)'}}/>
        <div style={{maxWidth:960,margin:'0 auto',position:'relative'}}>
          <div style={{display:'flex',gap:16,alignItems:'center',marginBottom:24}}>
            <div style={{width:56,height:56,borderRadius:'50%',background:'linear-gradient(135deg,rgba(182,139,46,0.3),rgba(182,139,46,0.08))',border:'2px solid rgba(182,139,46,0.4)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,fontSize:22,color:'rgba(182,139,46,0.8)',fontFamily:SER}}>{gn(collector)?gn(collector)[0].toUpperCase():'L'}</div>
            <div><div style={{fontFamily:SER,fontSize:28,fontWeight:300,color:'#f5f3ef',letterSpacing:'0.02em'}}>{gn(collector)}</div><div style={{fontSize:12,color:'rgba(245,243,239,0.50)',marginTop:2}}>License Holder · {activeScheds.length} active display{activeScheds.length!==1?'s':''}</div></div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10}}>
            {[['Artworks',schedules.length],['Active',activeScheds.length],['Total Paid','R '+fmt(totalPaid)],['Outstanding','R '+fmt(Math.max(0,balance))]].map(([l,v])=>(
              <div key={l} style={{background:'rgba(255,255,255,0.05)',border:'1px solid rgba(182,139,46,0.18)',borderRadius:12,padding:'12px 10px',textAlign:'center'}}>
                <div style={{fontSize:9,letterSpacing:'0.18em',textTransform:'uppercase',color:'rgba(182,139,46,0.65)',marginBottom:4}}>{l}</div>
                <div style={{fontFamily:SER,fontSize:20,fontWeight:300,color:'#f5f3ef'}}>{v}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* iKhoka link modal */}
      {ikhokaLink&&<div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',zIndex:200,display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
        <div style={{background:cardBg,borderRadius:20,padding:28,maxWidth:440,width:'100%',border:`1px solid ${cardBorder}`}}>
          <div style={{fontFamily:SER,fontSize:24,color:textPrimary,marginBottom:4}}>Payment Link Ready</div>
          <div style={{fontSize:13,color:textSecondary,marginBottom:20}}>{ikhokaLink.sched.artworkTitle} · Month {ikhokaLink.month} · R {fmt(ikhokaLink.sched.monthlyAmount)}</div>
          <div style={{display:'flex',gap:8,marginBottom:16,flexWrap:'wrap'}}>
            <button onClick={()=>{navigator.clipboard.writeText(ikhokaLink.url);alert('Copied!');}} style={{flex:1,padding:'11px 0',borderRadius:10,border:`1px solid ${C.goldB}`,background:'transparent',color:C.gold,cursor:'pointer',fontSize:12,fontWeight:600,fontFamily:SAN}}>📋 Copy</button>
            <button onClick={()=>window.open(ikhokaLink.url,'_blank')} style={{flex:1,padding:'11px 0',borderRadius:10,border:'none',background:`linear-gradient(135deg,${C.gold},${C.goldD})`,color:C.white,cursor:'pointer',fontSize:12,fontWeight:700,fontFamily:SAN}}>Pay Now →</button>
          </div>
          <button onClick={()=>setIkhokaLink(null)} style={{width:'100%',padding:'10px',borderRadius:10,border:`1px solid ${cardBorder}`,background:'transparent',color:textSecondary,cursor:'pointer',fontSize:12,fontFamily:SAN}}>Close</button>
        </div>
      </div>}

      {/* Content */}
      <div style={{maxWidth:960,margin:'0 auto',padding:'24px 16px 100px'}}>
        <div style={{display:'flex',flexWrap:'wrap',gap:8,marginBottom:28}}>
          {[['overview','Overview'],['artworks','My Artworks'],['payments','Payments'],['calendar','Calendar'],['statements','Statements'],['profile','Profile'],['terms','Terms']].map(([id,l])=>(
            <button key={id} onClick={()=>setTab(id)} style={{padding:'9px 20px',borderRadius:24,border:tab===id?'none':`1px solid ${cardBorder}`,background:tab===id?`linear-gradient(135deg,${C.gold},${C.goldD})`:cardBg,color:tab===id?C.white:textSecondary,fontSize:13,fontWeight:tab===id?600:400,cursor:'pointer',fontFamily:SAN,whiteSpace:'nowrap',transition:'all 0.2s',boxShadow:tab===id?'0 4px 12px rgba(182,139,46,0.28)':'none'}}>{l}</button>
          ))}
        </div>

        {/* OVERVIEW */}
        {tab==='overview'&&(
          <div>
            {/* Quick actions */}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:16}}>
              <button onClick={()=>setTab('payments')} style={{...CARD,marginBottom:0,padding:'18px 20px',cursor:'pointer',border:'none',textAlign:'left',display:'block',background:`linear-gradient(135deg,${C.gold},${C.goldD})`,boxShadow:'0 8px 24px rgba(182,139,46,0.25)'}}>
                <div style={{fontSize:24,marginBottom:6}}>💳</div>
                <div style={{fontFamily:SER,fontSize:18,color:C.white,marginBottom:2}}>Make Payment</div>
                <div style={{fontSize:11,color:'rgba(255,255,255,0.6)'}}>Pay via iKhoka</div>
              </button>
              <button onClick={()=>setTab('calendar')} style={{...CARD,marginBottom:0,padding:'18px 20px',cursor:'pointer',textAlign:'left',display:'block'}}>
                <div style={{fontSize:24,marginBottom:6}}>📅</div>
                <div style={{fontFamily:SER,fontSize:18,color:textPrimary,marginBottom:2}}>Payment Calendar</div>
                <div style={{fontSize:11,color:textSecondary}}>View schedule</div>
              </button>
            </div>

            {/* Artworks on display */}
            {schedules.length>0&&<div style={CARD}><div style={{...CP}}>
              <div style={SH}>Artworks on Display</div>
              {schedules.map(sc=>{
                const art=artworks.find(a=>a.id===sc.artworkId);
                const paid=payments.filter(p=>p.scheduleId===sc.id).reduce((s,p)=>s+(p.amount||0),0);
                const pct=sc.totalDue>0?Math.min(100,Math.round((paid/sc.totalDue)*100)):0;
                return(
                  <div key={sc.id} style={{display:'flex',gap:14,marginBottom:20,paddingBottom:20,borderBottom:`1px solid ${C.goldL}`}}>
                    {art?.imageUrl?<img src={art.imageUrl} alt="" style={{width:80,height:80,borderRadius:12,objectFit:'cover',flexShrink:0,border:`1px solid ${C.goldL}`}}/>:<div style={{width:80,height:80,borderRadius:12,background:`rgba(182,139,46,0.08)`,flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:28}}>🖼</div>}
                    <div style={{flex:1}}>
                      <div style={{fontFamily:SER,fontSize:20,color:textPrimary,marginBottom:2}}>{sc.artworkTitle||art?.title}</div>
                      <div style={{fontSize:12,color:textSecondary,marginBottom:8}}>{art?.artistName||art?.artist||'—'} · {art?.medium||'—'}</div>
                      <div style={{height:6,background:darkMode?'rgba(255,255,255,0.08)':'rgba(182,139,46,0.10)',borderRadius:3,overflow:'hidden',marginBottom:6}}>
                        <div style={{height:'100%',width:`${pct}%`,background:`linear-gradient(90deg,${C.gold},${C.goldD})`,borderRadius:3,transition:'width 1s'}}/>
                      </div>
                      <div style={{display:'flex',justifyContent:'space-between',fontSize:11,color:textSecondary}}>
                        <span>{sc.monthsPaid||0} of {sc.termMonths} months paid</span>
                        <span style={{color:C.gold,fontWeight:600}}>{pct}%</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div></div>}
          </div>
        )}

        {/* MY ARTWORKS */}
        {tab==='artworks'&&(
          <div>
            <div style={{fontFamily:SER,fontSize:28,fontWeight:300,color:textPrimary,marginBottom:20}}>My Artworks</div>
            {schedules.length===0?<div style={{...CARD,textAlign:'center',padding:56}}><div style={{fontSize:44,opacity:0.2,marginBottom:12}}>🖼</div><div style={{fontSize:13,color:textSecondary}}>No artworks linked yet. Contact Vollard Black.</div></div>
            :schedules.map(sc=>{
              const art=artworks.find(a=>a.id===sc.artworkId);
              const paid=payments.filter(p=>p.scheduleId===sc.id).reduce((s,p)=>s+(p.amount||0),0);
              const pct=sc.totalDue>0?Math.min(100,Math.round((paid/sc.totalDue)*100)):0;
              return(
                <div key={sc.id} style={CARD}>
                  {art?.imageUrl&&<div style={{height:200,overflow:'hidden'}}><img src={art.imageUrl} alt="" style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}}/></div>}
                  <div style={CP}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:12,gap:10}}>
                      <div><div style={{fontFamily:SER,fontSize:22,color:textPrimary,marginBottom:2}}>{sc.artworkTitle||art?.title}</div><div style={{fontSize:12,color:textSecondary}}>{art?.artistName||art?.artist||'—'} · {art?.medium||'—'}</div></div>
                      <span style={{fontSize:10,fontWeight:700,padding:'4px 10px',borderRadius:20,flexShrink:0,background:sc.status==='Active'?'rgba(74,158,107,0.12)':'rgba(182,139,46,0.12)',color:sc.status==='Active'?C.greenD:C.gold}}>{sc.status}</span>
                    </div>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:14}}>
                      {[['Monthly Fee','R '+fmt(sc.monthlyAmount)],['Total Due','R '+fmt(sc.totalDue)],['Paid','R '+fmt(paid)],['Remaining','R '+fmt(Math.max(0,(sc.totalDue||0)-paid))]].map(([l,v])=>(
                        <div key={l} style={{padding:'10px 12px',background:darkMode?'rgba(255,255,255,0.05)':'#f5f3ef',borderRadius:8}}>
                          <div style={{fontSize:9,color:textSecondary,letterSpacing:'0.12em',textTransform:'uppercase',marginBottom:4}}>{l}</div>
                          <div style={{fontWeight:600,color:textPrimary}}>{v}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{height:8,background:darkMode?'rgba(255,255,255,0.08)':'rgba(182,139,46,0.10)',borderRadius:4,overflow:'hidden',marginBottom:8}}>
                      <div style={{height:'100%',width:`${pct}%`,background:`linear-gradient(90deg,${C.gold},${C.greenD})`,borderRadius:4,transition:'width 1s'}}/>
                    </div>
                    <div style={{display:'flex',justifyContent:'space-between',fontSize:12,color:textSecondary,marginBottom:16}}>
                      <span>{sc.monthsPaid||0} of {sc.termMonths} months</span><span style={{color:C.gold,fontWeight:700}}>{pct}% complete</span>
                    </div>
                    <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                      {art&&<button onClick={()=>generateQR(art,sc.galleryName)} style={{padding:'9px 16px',borderRadius:10,border:`1px solid ${C.goldB}`,background:'transparent',color:C.gold,cursor:'pointer',fontSize:12,fontWeight:600,fontFamily:SAN}}>📱 QR Label</button>}
                      <button onClick={()=>generateAgreement(collector,sc,art)} style={{padding:'9px 16px',borderRadius:10,border:`1px solid ${C.goldB}`,background:'transparent',color:C.gold,cursor:'pointer',fontSize:12,fontWeight:600,fontFamily:SAN}}>📄 Agreement</button>
                      {sc.status==='Active'&&<button onClick={()=>initiatePayment(sc,( sc.monthsPaid||0)+1)} disabled={ikhokaLoading===sc.id} style={{padding:'9px 16px',borderRadius:10,border:'none',background:`linear-gradient(135deg,${C.gold},${C.goldD})`,color:C.white,cursor:'pointer',fontSize:12,fontWeight:700,fontFamily:SAN,opacity:ikhokaLoading===sc.id?0.6:1,boxShadow:'0 4px 12px rgba(182,139,46,0.25)'}}>{ikhokaLoading===sc.id?'Generating…':'💳 Pay Month '+(( sc.monthsPaid||0)+1)}</button>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* PAYMENTS */}
        {tab==='payments'&&(
          <div>
            <div style={{fontFamily:SER,fontSize:28,fontWeight:300,color:textPrimary,marginBottom:20}}>Payments</div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginBottom:20}}>
              {[['Total Paid','R '+fmt(totalPaid),C.green],['Total Due','R '+fmt(totalOwed),C.gold],['Outstanding','R '+fmt(Math.max(0,balance)),balance>0?C.red:C.green]].map(([l,v,color])=>(
                <div key={l} style={{...CARD,textAlign:'center',padding:'18px 12px',marginBottom:0}}><div style={{fontSize:9,letterSpacing:'0.16em',textTransform:'uppercase',color:textSecondary,marginBottom:8}}>{l}</div><div style={{fontFamily:SER,fontSize:24,fontWeight:300,color}}>{v}</div></div>
              ))}
            </div>
            {/* Pay due amounts */}
            {schedules.filter(s=>s.status==='Active').map(sc=>{
              const paid=payments.filter(p=>p.scheduleId===sc.id).reduce((s,p)=>s+(p.amount||0),0);
              const nextMonth=(sc.monthsPaid||0)+1;
              if(nextMonth>sc.termMonths)return null;
              return(
                <div key={sc.id} style={{...CARD,border:`1.5px solid ${C.goldB}`}}>
                  <div style={CP}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:10}}>
                      <div><div style={{fontFamily:SER,fontSize:18,color:textPrimary,marginBottom:2}}>{sc.artworkTitle}</div><div style={{fontSize:12,color:textSecondary}}>Month {nextMonth} of {sc.termMonths} · Due 25th</div></div>
                      <div style={{textAlign:'right'}}><div style={{fontFamily:SER,fontSize:26,color:C.gold,fontWeight:600}}>R {fmt(sc.monthlyAmount)}</div></div>
                    </div>
                    <button onClick={()=>initiatePayment(sc,nextMonth)} disabled={ikhokaLoading===sc.id} style={{width:'100%',marginTop:14,padding:'13px',borderRadius:12,border:'none',background:`linear-gradient(135deg,${C.gold},${C.goldD})`,color:C.white,cursor:'pointer',fontSize:14,fontWeight:700,fontFamily:SAN,opacity:ikhokaLoading===sc.id?0.6:1,boxShadow:'0 6px 20px rgba(182,139,46,0.28)'}}>{ikhokaLoading===sc.id?'Generating link…':'💳 Pay via iKhoka'}</button>
                  </div>
                </div>
              );
            })}
            {/* History */}
            {payments.length>0&&<div style={CARD}><div style={CP}><div style={SH}>Payment History</div>{payments.map(p=><div key={p.id} style={{display:'flex',justifyContent:'space-between',padding:'10px 0',borderBottom:`1px solid ${C.goldL}`,fontSize:13,gap:10}}><div><div style={{fontWeight:500,color:textPrimary}}>{p.artworkTitle||'Payment'}</div><div style={{fontSize:11,color:textSecondary}}>{p.createdAt?.slice(0,10)||p.date||'—'} · {p.method||'—'} · Mo {p.monthNumber}</div></div><div style={{color:C.green,fontWeight:700,flexShrink:0}}>R {fmt(p.amount)}</div></div>)}</div></div>}
          </div>
        )}

        {/* CALENDAR */}
        {tab==='calendar'&&(
          <div>
            <div style={{fontFamily:SER,fontSize:28,fontWeight:300,color:textPrimary,marginBottom:8}}>Payment Calendar</div>
            <div style={{fontSize:13,color:textSecondary,marginBottom:24}}>✅ = paid · 📅 = upcoming · ⚠️ = overdue</div>
            <div style={CARD}><div style={CP}><PaymentCalendar schedules={schedules} payments={payments}/></div></div>
            <div style={CARD}><div style={CP}><div style={SH}>Upcoming Due Dates</div>
              {schedules.filter(s=>s.status==='Active').map(sc=>{
                const nextMonth=(sc.monthsPaid||0)+1;
                if(nextMonth>sc.termMonths)return null;
                const startDate=new Date(sc.startDate||Date.now());
                const dueDate=new Date(startDate.getFullYear(),startDate.getMonth()+nextMonth,25);
                return(
                  <div key={sc.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 0',borderBottom:`1px solid ${C.goldL}`,gap:10}}>
                    <div><div style={{fontSize:14,fontWeight:500,color:textPrimary}}>{sc.artworkTitle}</div><div style={{fontSize:12,color:textSecondary}}>Month {nextMonth} · Due {dueDate.toLocaleDateString('en-ZA',{day:'numeric',month:'long',year:'numeric'})}</div></div>
                    <div style={{textAlign:'right',flexShrink:0}}><div style={{fontFamily:SER,fontSize:18,color:C.gold,fontWeight:600}}>R {fmt(sc.monthlyAmount)}</div></div>
                  </div>
                );
              })}
            </div></div>
          </div>
        )}

        {/* STATEMENTS */}
        {tab==='statements'&&(
          <div>
            <div style={{fontFamily:SER,fontSize:28,fontWeight:300,color:textPrimary,marginBottom:20}}>Statements</div>
            {schedules.map(sc=>{
              const art=artworks.find(a=>a.id===sc.artworkId);
              const scPays=payments.filter(p=>p.scheduleId===sc.id);
              const paid=scPays.reduce((s,p)=>s+(p.amount||0),0);
              const sale=sales.find(s=>s.artworkId===sc.artworkId);
              return(
                <div key={sc.id} style={CARD}><div style={CP}>
                  <div style={{display:'flex',justifyContent:'space-between',flexWrap:'wrap',gap:8,marginBottom:16}}>
                    <div><div style={{fontFamily:SER,fontSize:20,color:textPrimary}}>{sc.artworkTitle||art?.title}</div><div style={{fontSize:12,color:textSecondary,marginTop:2}}>Started {sc.startDate||'—'}</div></div>
                    <span style={{padding:'4px 12px',borderRadius:6,fontSize:11,fontWeight:600,background:sc.status==='Active'?'rgba(74,158,107,0.12)':'rgba(182,139,46,0.12)',color:sc.status==='Active'?C.greenD:C.gold}}>{sc.status}</span>
                  </div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:16}}>
                    {[['Artwork Value','R '+fmt(art?.recommendedPrice)],['Monthly Fee','R '+fmt(sc.monthlyAmount)],['Term',sc.termMonths+' months'],['Months Paid',(sc.monthsPaid||0)+' of '+sc.termMonths],['Total Due','R '+fmt(sc.totalDue||0)],['Paid to Date','R '+fmt(paid)]].map(([l,v])=>(
                      <div key={l} style={{padding:'10px 12px',background:darkMode?'rgba(255,255,255,0.05)':'#f5f3ef',borderRadius:8}}><div style={{fontSize:9,color:textSecondary,letterSpacing:'0.12em',textTransform:'uppercase',marginBottom:4}}>{l}</div><div style={{fontWeight:600,color:textPrimary}}>{v}</div></div>
                    ))}
                  </div>
                  {sale&&<div style={{padding:'14px 16px',background:'rgba(74,158,107,0.06)',border:'1px solid rgba(74,158,107,0.15)',borderRadius:10}}>
                    <div style={{fontSize:10,letterSpacing:'0.14em',textTransform:'uppercase',color:C.green,marginBottom:10,fontWeight:700}}>Sale Settled</div>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,fontSize:13}}>
                      <div style={{color:textSecondary}}>Sale date</div><div style={{fontWeight:500,textAlign:'right'}}>{sale.date||'—'}</div>
                      <div style={{color:textSecondary}}>Sale price</div><div style={{fontWeight:500,textAlign:'right'}}>R {fmt(sale.salePrice)}</div>
                      <div style={{color:C.greenD,fontWeight:700}}>You receive</div><div style={{color:C.greenD,fontWeight:700,textAlign:'right',fontFamily:SER,fontSize:18}}>R {fmt(sale.colNet||sale.collectorShare)}</div>
                    </div>
                  </div>}
                  <div style={{marginTop:12,display:'flex',gap:8,flexWrap:'wrap'}}>
                    <button onClick={()=>generateAgreement(collector,sc,art)} style={{padding:'9px 16px',borderRadius:10,border:`1px solid ${C.goldB}`,background:'transparent',color:C.gold,cursor:'pointer',fontSize:12,fontWeight:600,fontFamily:SAN}}>📄 Download Agreement</button>
                    {art&&<button onClick={()=>generateQR(art)} style={{padding:'9px 16px',borderRadius:10,border:`1px solid ${C.goldB}`,background:'transparent',color:C.gold,cursor:'pointer',fontSize:12,fontWeight:600,fontFamily:SAN}}>📱 QR Wall Label</button>}
                  </div>
                </div></div>
              );
            })}
            {schedules.length===0&&<div style={{...CARD,textAlign:'center',padding:56}}><div style={{fontSize:44,opacity:0.2,marginBottom:12}}>📋</div><div style={{fontSize:13,color:textSecondary}}>No agreements found.</div></div>}
          </div>
        )}

        {/* PROFILE */}
        {tab==='profile'&&(
          <div>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:24,flexWrap:'wrap',gap:10}}>
              <div style={{fontFamily:SER,fontSize:28,fontWeight:300,color:textPrimary}}>My Profile</div>
              {!profileEdit&&<button onClick={()=>setProfileEdit(true)} style={{padding:'10px 22px',borderRadius:24,border:`1px solid ${C.goldB}`,background:'transparent',color:C.gold,fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:SAN}}>Edit</button>}
            </div>
            {saveMsg&&<div style={{padding:'12px 16px',background:'rgba(74,158,107,0.08)',border:'1px solid rgba(74,158,107,0.20)',borderRadius:12,fontSize:13,color:C.greenD,marginBottom:20}}>✓ {saveMsg}</div>}
            {!profileEdit?(
              <div>
                <div style={CARD}><div style={CP}><div style={SH}>Personal Information</div>
                  {[['Name',`${collector?.firstName||''} ${collector?.lastName||''}`.trim()||collector?.companyName||'—'],['Email',collector?.email||session.user.email||'—'],['Mobile',collector?.mobile||'—'],['ID / Passport',collector?.idNumber||'—'],['Nationality',collector?.nationality||'—'],['City',collector?.city||'—'],['Country',collector?.country||'—'],['Address',collector?.address||'—']].map(([l,v])=>(
                    <div key={l} style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',padding:'10px 0',borderBottom:`1px solid ${C.goldL}`,fontSize:13,gap:12}}><span style={{color:textSecondary,flexShrink:0}}>{l}</span><span style={{fontWeight:500,textAlign:'right',color:textPrimary}}>{v}</span></div>
                  ))}
                </div></div>
                <div style={CARD}><div style={CP}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14,paddingBottom:10,borderBottom:`1px solid ${C.goldL}`}}>
                    <div style={{fontSize:10,fontWeight:700,letterSpacing:'0.20em',textTransform:'uppercase',color:C.gold}}>Banking Details</div>
                    {collector?.bankVerified?<span style={{fontSize:11,fontWeight:700,color:C.greenD,background:'rgba(74,158,107,0.10)',padding:'3px 10px',borderRadius:20}}>✓ Verified</span>:(collector?.bankName||collector?.accountNumber)?<span style={{fontSize:11,fontWeight:700,color:'#b8920a',background:'rgba(230,190,50,0.10)',padding:'3px 10px',borderRadius:20}}>⏳ Pending</span>:<span style={{fontSize:11,color:textSecondary}}>Not yet added</span>}
                  </div>
                  {(collector?.bankName||collector?.accountNumber)?[['Bank',collector?.bankName||'—'],['Account Holder',collector?.accountHolder||'—'],['Account Number',collector?.accountNumber||'—'],['Branch Code',collector?.branchCode||'—']].map(([l,v])=>(
                    <div key={l} style={{display:'flex',justifyContent:'space-between',padding:'10px 0',borderBottom:`1px solid ${C.goldL}`,fontSize:13,gap:12}}><span style={{color:textSecondary,flexShrink:0}}>{l}</span><span style={{fontWeight:500}}>{v}</span></div>
                  )):<div style={{fontSize:13,color:textSecondary,padding:'8px 0',lineHeight:1.7}}>Add your banking details so sale proceeds can be paid to you.</div>}
                </div></div>
              </div>
            ):(
              <div>
                <div style={{...CARD,marginBottom:16}}><div style={CP}><div style={SH}>Personal Information</div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
                    {[['firstName','First Name'],['lastName','Last Name'],['mobile','Mobile'],['idNumber','ID / Passport'],['nationality','Nationality'],['city','City'],['country','Country']].map(([key,l])=>(
                      <div key={key}><label style={lbl}>{l}</label><input value={profileForm[key]||''} onChange={e=>setProfileForm(p=>({...p,[key]:e.target.value}))} style={inp}/></div>
                    ))}
                    <div style={{gridColumn:'1/-1'}}><label style={lbl}>Address</label><textarea value={profileForm.address||''} onChange={e=>setProfileForm(p=>({...p,address:e.target.value}))} style={{...inp,minHeight:60,resize:'vertical'}}/></div>
                  </div>
                </div></div>
                <div style={{...CARD,marginBottom:16}}><div style={CP}><div style={SH}>Banking Details</div>
                  <div style={{fontSize:12,color:textSecondary,marginBottom:16,lineHeight:1.7}}>Your payout account for sale proceeds. Changes require re-verification.</div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
                    {[['bankName','Bank Name'],['accountHolder','Account Holder'],['accountNumber','Account Number'],['branchCode','Branch Code']].map(([key,l])=>(
                      <div key={key}><label style={lbl}>{l}</label><input value={profileForm[key]||''} onChange={e=>setProfileForm(p=>({...p,[key]:e.target.value}))} style={inp} inputMode={key==='accountNumber'||key==='branchCode'?'numeric':undefined}/></div>
                    ))}
                  </div>
                  <div style={{marginTop:14,padding:'11px 14px',background:'rgba(230,190,50,0.05)',border:'1px solid rgba(230,190,50,0.18)',borderRadius:10,fontSize:12,color:textSecondary,lineHeight:1.6}}>⚠ Changes flag your account for re-verification before payouts resume.</div>
                </div></div>
                <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}>
                  <button onClick={()=>setProfileEdit(false)} style={{padding:'12px 22px',borderRadius:12,border:`1px solid ${C.goldB}`,background:'transparent',color:C.gold,fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:SAN}}>Cancel</button>
                  <button onClick={async()=>{if(!collector)return;setSavingProfile(true);const bankChanged=(profileForm.bankName||'')!==(collector.bankName||'')||(profileForm.accountNumber||'')!==(collector.accountNumber||'');const updates={...profileForm,...(bankChanged?{bankVerified:false}:{})};const snake=toSnake(updates);delete snake.id;delete snake.created_at;await supabase.from('collectors').update(snake).eq('id',collector.id);setCollector(c=>({...c,...updates}));setSaveMsg(bankChanged?'Saved. Bank details pending verification.':'Profile updated.');setTimeout(()=>setSaveMsg(''),5000);setProfileEdit(false);setSavingProfile(false);}} disabled={savingProfile} style={{padding:'12px 28px',borderRadius:12,border:'none',background:`linear-gradient(135deg,${C.gold},${C.goldD})`,color:C.white,fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:SAN,opacity:savingProfile?0.6:1,boxShadow:'0 4px 14px rgba(182,139,46,0.28)'}}>{savingProfile?'Saving…':'Save Changes'}</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TERMS */}
        {tab==='terms'&&(
          <div>
            <div style={{fontFamily:SER,fontSize:28,fontWeight:300,color:textPrimary,marginBottom:20}}>Display License Agreement</div>
            <div style={CARD}><div style={CP}>
              <div style={{fontSize:12,color:textSecondary,marginBottom:20}}>Vollard Black (Pty) Ltd · Hermanus, South Africa</div>
              {[['1. License Fee','The display license fee is 50% of the declared artwork value, payable in monthly instalments over your agreed term. Fees are due on the 25th of each month.'],['2. On Sale','When your artwork sells: Vollard Black retains the outstanding license fee balance from proceeds. You receive the remainder. Any surplus above the original value is split 50/50.'],['3. Care of Artwork','You agree to display the artwork safely, not move it without consent, and notify Vollard Black immediately of any damage or theft.'],['4. Ownership','Title remains with the artist/Vollard Black until the full license fee is paid and a sale is concluded.'],['5. Cancellation','Either party may cancel with 30 days written notice. The artwork must be returned at your expense. Payments made are non-refundable.'],['6. Governing Law','This agreement is governed by the laws of South Africa.']].map(([title,text])=>(
                <div key={title} style={{marginBottom:16,paddingBottom:16,borderBottom:`1px solid ${C.goldL}`}}>
                  <div style={{fontFamily:SER,fontSize:16,color:textPrimary,marginBottom:6,fontWeight:500}}>{title}</div>
                  <div style={{fontSize:13,color:textSecondary,lineHeight:1.8}}>{text}</div>
                </div>
              ))}
              <div style={{padding:'12px 16px',background:'rgba(182,139,46,0.06)',borderRadius:10,fontSize:12,color:'#8a6a1e'}}>Contact: <strong>concierge@vollardblack.com</strong></div>
            </div></div>
          </div>
        )}
      </div>

      {/* Mobile bottom nav */}
      <div style={{position:'fixed',bottom:0,left:0,right:0,background:darkMode?'#1a1714':C.white,borderTop:`1px solid ${cardBorder}`,padding:'8px 0',display:'flex',justifyContent:'space-around',zIndex:50,boxShadow:'0 -4px 20px rgba(0,0,0,0.08)'}}>
        {[['overview','🏠','Home'],['artworks','🖼','Works'],['payments','💳','Pay'],['calendar','📅','Calendar'],['profile','👤','Profile']].map(([id,icon,l])=>(
          <button key={id} onClick={()=>setTab(id)} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:2,padding:'4px 8px',background:'none',border:'none',cursor:'pointer',fontFamily:SAN}}>
            <span style={{fontSize:18,opacity:tab===id?1:0.4}}>{icon}</span>
            <span style={{fontSize:9,letterSpacing:'0.06em',textTransform:'uppercase',color:tab===id?C.gold:textSecondary,fontWeight:tab===id?700:400}}>{l}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Root ────────────────────────────────────────────────────
export default function RenterPortal(){
  const[session,setSession]=useState(undefined);
  const[screen,setScreen]=useState('login');
  const[pendingEmail,setPendingEmail]=useState('');
  const[approved,setApproved]=useState(null);

  useEffect(()=>{
    if(supabase)supabase.auth.getSession().then(({data})=>setSession(data?.session||null));else setSession(null);
    const{data:{subscription}}=supabase?supabase.auth.onAuthStateChange((_,s)=>setSession(s)):{data:{subscription:{unsubscribe:()=>{}}}};
    return()=>subscription.unsubscribe();
  },[]);

  useEffect(()=>{
    if(!session){setApproved(null);return;}
    supabase.from('portal_requests').select('status').eq('email',session.user.email).eq('role','renter').order('created_at',{ascending:false}).limit(1).single().then(({data})=>{setApproved(data?.status==='approved');});
  },[session]);

  if(session===undefined)return<div style={{minHeight:'100vh',background:C.cream,display:'flex',alignItems:'center',justifyContent:'center'}}><div style={{fontFamily:SER,fontSize:24,letterSpacing:8,color:C.gold,opacity:0.5}}>VOLLARD BLACK</div></div>;
  if(!session){
    if(screen==='register')return<KYCRegistration role="renter" supabase={supabase} onComplete={email=>{setPendingEmail(email);setScreen('pending');}} onSignIn={()=>setScreen('login')}/>;
    if(screen==='pending')return<PendingScreen email={pendingEmail} onSignIn={()=>setScreen('login')}/>;
    return<LoginScreen onLogin={s=>setSession(s)} onRegister={()=>setScreen('register')}/>;
  }
  if(approved===null)return<div style={{minHeight:'100vh',background:C.cream,display:'flex',alignItems:'center',justifyContent:'center'}}><div style={{fontFamily:SER,fontSize:18,color:C.gold,opacity:0.5}}>Checking access…</div></div>;
  if(!approved)return<NotApprovedScreen onSignOut={()=>supabase.auth.signOut()}/>;
  return<RenterDashboard session={session}/>;
}
