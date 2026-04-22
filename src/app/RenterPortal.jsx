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

const C={gold:'#b68b2e',goldD:'#8a6a1e',goldL:'rgba(182,139,46,0.12)',goldB:'rgba(182,139,46,0.22)',cream:'#f5f3ef',dark:'#1a1714',mid:'#6b635a',light:'#8a8070',red:'#c45c4a',green:'#4a9e6b',greenD:'#2d7a4a',blue:'#648cc8',white:'#ffffff'};
const SER="'Cormorant Garamond',serif";
const SAN="'DM Sans',sans-serif";

function Logo({sub}){return(<div style={{textAlign:'center',marginBottom:40}}><div style={{fontFamily:SER,fontSize:36,fontWeight:300,letterSpacing:10,color:C.dark}}>VOLLARD <span style={{color:C.gold}}>BLACK</span></div><div style={{fontSize:10,letterSpacing:4,textTransform:'uppercase',color:C.light,marginTop:6}}>{sub}</div><div style={{width:40,height:1,background:'rgba(182,139,46,0.4)',margin:'16px auto 0'}}/></div>);}

function PendingScreen({email,onSignIn}){return(<div style={{minHeight:'100vh',background:C.cream,display:'flex',alignItems:'center',justifyContent:'center',padding:20,fontFamily:SAN}}><div style={{width:'100%',maxWidth:420,textAlign:'center'}}><Logo sub="License Holder Portal"/><div style={{background:C.white,border:`1px solid ${C.goldB}`,borderRadius:16,padding:40}}><div style={{fontSize:48,marginBottom:16}}>◆</div><div style={{fontFamily:SER,fontSize:24,color:C.dark,marginBottom:12}}>Request Submitted</div><div style={{fontSize:14,color:C.mid,lineHeight:1.8,marginBottom:24}}>Thank you. Vollard Black is reviewing your application.<br/><strong>{email}</strong></div><button onClick={onSignIn} style={{padding:'12px 28px',borderRadius:24,border:`1px solid ${C.goldB}`,background:'transparent',color:C.gold,cursor:'pointer',fontSize:13,fontWeight:600,fontFamily:SAN}}>Sign In</button></div></div></div>);}
function NotApprovedScreen({onSignOut}){return(<div style={{minHeight:'100vh',background:C.cream,display:'flex',alignItems:'center',justifyContent:'center',padding:20,fontFamily:SAN}}><div style={{width:'100%',maxWidth:420,textAlign:'center'}}><Logo sub="License Holder Portal"/><div style={{background:C.white,border:`1px solid ${C.goldB}`,borderRadius:16,padding:40}}><div style={{fontSize:48,marginBottom:16}}>⏳</div><div style={{fontFamily:SER,fontSize:24,color:C.dark,marginBottom:12}}>Pending Approval</div><div style={{fontSize:14,color:C.mid,lineHeight:1.8,marginBottom:24}}>Your application is under review. You'll be notified once approved.</div><button onClick={onSignOut} style={{padding:'12px 28px',borderRadius:24,border:`1px solid ${C.goldB}`,background:'transparent',color:C.gold,cursor:'pointer',fontSize:13,fontWeight:600,fontFamily:SAN}}>Sign Out</button></div></div></div>);}

function LoginScreen({onLogin,onRegister}){
  const[email,setEmail]=useState('');const[pw,setPw]=useState('');const[loading,setLoading]=useState(false);const[error,setError]=useState('');const[showPw,setShowPw]=useState(false);
  const handle=async()=>{if(!email||!pw)return setError('Enter your email and password.');setLoading(true);setError('');const{data,error:e}=await supabase.auth.signInWithPassword({email,password:pw});setLoading(false);if(e)setError(e.message);else onLogin(data.session);};
  return(<div style={{minHeight:'100vh',background:C.cream,display:'flex',alignItems:'center',justifyContent:'center',padding:20,fontFamily:SAN}}><div style={{width:'100%',maxWidth:400}}><Logo sub="License Holder Portal"/><div style={{background:C.white,border:`1px solid ${C.goldB}`,borderRadius:16,padding:32}}>{error&&<div style={{padding:'12px 16px',background:'rgba(196,92,74,0.08)',border:'1px solid rgba(196,92,74,0.25)',borderRadius:10,fontSize:13,color:C.red,marginBottom:20}}>{error}</div>}<div style={{marginBottom:18}}><label style={{display:'block',fontSize:10,fontWeight:700,letterSpacing:'0.14em',textTransform:'uppercase',color:C.mid,marginBottom:8}}>Email</label><input type="email" value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handle()} style={{width:'100%',padding:'13px 16px',background:C.white,border:`1.5px solid ${C.goldB}`,borderRadius:12,color:C.dark,fontFamily:SAN,fontSize:14,outline:'none',boxSizing:'border-box'}} autoComplete="email"/></div><div style={{marginBottom:24}}><label style={{display:'block',fontSize:10,fontWeight:700,letterSpacing:'0.14em',textTransform:'uppercase',color:C.mid,marginBottom:8}}>Password</label><div style={{position:'relative'}}><input type={showPw?'text':'password'} value={pw} onChange={e=>setPw(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handle()} style={{width:'100%',padding:'13px 60px 13px 16px',background:C.white,border:`1.5px solid ${C.goldB}`,borderRadius:12,color:C.dark,fontFamily:SAN,fontSize:14,outline:'none',boxSizing:'border-box'}} autoComplete="current-password"/><button type="button" onClick={()=>setShowPw(p=>!p)} style={{position:'absolute',right:14,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',color:C.light,cursor:'pointer',fontSize:12,fontFamily:SAN,fontWeight:600}}>{showPw?'Hide':'Show'}</button></div></div><button onClick={handle} disabled={loading} style={{width:'100%',padding:14,borderRadius:12,border:'none',background:`linear-gradient(135deg,${C.gold},${C.goldD})`,color:C.white,fontSize:14,fontWeight:700,cursor:'pointer',fontFamily:SAN,opacity:loading?0.6:1,boxShadow:'0 6px 20px rgba(182,139,46,0.28)'}}>{loading?'Signing in…':'Sign In'}</button><div style={{textAlign:'center',marginTop:20,fontSize:13,color:C.light}}>New? <button onClick={onRegister} style={{background:'none',border:'none',color:C.gold,cursor:'pointer',fontWeight:600,fontFamily:SAN,fontSize:13}}>Register here →</button></div></div></div></div>);
}

// ── QR Code generator ───────────────────────────────────────
function generateQR(artwork,collectorName){
  const url=`${typeof window!=='undefined'?window.location.origin:''}/gallery/${artwork.id}`;
  const w=window.open('','_blank');
  const qrUrl=`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`;
  const html=`<!DOCTYPE html><html><head><title>Artwork QR</title><style>@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400&family=DM+Sans:wght@400;600&display=swap');body{margin:0;padding:40px;background:#f5f3ef;font-family:'DM Sans',sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;}.card{background:#fff;border:1px solid rgba(182,139,46,0.3);border-radius:16px;padding:40px;text-align:center;max-width:320px;}.logo{font-family:'Cormorant Garamond',serif;font-size:20px;letter-spacing:0.3em;color:#1a1714;margin-bottom:4px;}.logo span{color:#b68b2e;}.divider{width:60px;height:1px;background:rgba(182,139,46,0.4);margin:16px auto;}.title{font-family:'Cormorant Garamond',serif;font-size:24px;color:#1a1714;margin:16px 0 4px;}.collector{font-size:12px;color:#8a8070;margin-bottom:24px;}.qr{margin:20px auto;}.note{font-size:11px;color:#8a8070;margin-top:20px;line-height:1.6;}@media print{body{background:#fff;}}</style></head><body><div class="card"><div class="logo">VOLLARD <span>BLACK</span></div><div class="divider"></div><img class="qr" src="${qrUrl}" width="160" height="160" alt="QR"/><div class="title">${artwork.title}</div><div class="collector">Displayed by ${collectorName}</div><div class="note">Scan to view artwork details<br/>and certificate of authenticity</div></div><script>window.print();</script></body></html>`;
  w.document.write(html);w.document.close();
}

// ── License agreement PDF ───────────────────────────────────
function generateAgreement(schedule,artworkTitle,collectorName){
  const w=window.open('','_blank');
  const html=`<!DOCTYPE html><html><head><title>License Agreement</title><style>@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500&family=DM+Sans:wght@400;600&display=swap');body{margin:0;padding:48px;font-family:'DM Sans',sans-serif;color:#1a1714;}.header{text-align:center;margin-bottom:40px;}.logo{font-family:'Cormorant Garamond',serif;font-size:24px;letter-spacing:0.3em;}.logo span{color:#b68b2e;}.title{font-family:'Cormorant Garamond',serif;font-size:20px;color:#8a8070;margin:8px 0;}.divider{width:80px;height:1px;background:rgba(182,139,46,0.4);margin:16px auto;}.section{margin-bottom:24px;}.section-title{font-family:'Cormorant Garamond',serif;font-size:16px;font-weight:500;margin-bottom:8px;color:#1a1714;}.row{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid rgba(182,139,46,0.1);font-size:13px;}.label{color:#6b635a;}.value{font-weight:600;}@media print{body{background:#fff;}}</style></head><body><div class="header"><div class="logo">VOLLARD <span>BLACK</span></div><div class="title">Display License Agreement</div><div class="divider"></div></div><div class="section"><div class="section-title">Agreement Details</div><div class="row"><span class="label">License Holder</span><span class="value">${collectorName}</span></div><div class="row"><span class="label">Artwork</span><span class="value">${artworkTitle}</span></div><div class="row"><span class="label">Model</span><span class="value">${schedule.acquisitionModel||'O1'}</span></div><div class="row"><span class="label">Term</span><span class="value">${schedule.termMonths} months</span></div><div class="row"><span class="label">Monthly Fee</span><span class="value">R ${fmt(schedule.monthlyAmount)}</span></div><div class="row"><span class="label">Total Due</span><span class="value">R ${fmt(schedule.totalDue)}</span></div><div class="row"><span class="label">Start Date</span><span class="value">${schedule.startDate||'—'}</span></div><div class="row"><span class="label">Status</span><span class="value">${schedule.status}</span></div></div><div class="section" style="margin-top:32px;padding:20px;background:#f5f3ef;border-radius:8px;font-size:12px;color:#4a4440;line-height:1.8;"><strong>Key Terms:</strong> The display license fee is 50% of the declared artwork value, payable in monthly instalments. On sale, Vollard Black retains the outstanding balance from proceeds. You retain the remainder. Contact: concierge@vollardblack.com</div><script>window.print();</script></body></html>`;
  w.document.write(html);w.document.close();
}

// ── iKhoka payment ──────────────────────────────────────────
async function payWithIkhoka({amount,description,scheduleId,monthNumber,email}){
  try{
    const res=await fetch('/api/ikhoka-paylink',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({amount,description,scheduleId,monthNumber,collectorEmail:email})});
    const data=await res.json();
    if(data.paylinkUrl)window.location.href=data.paylinkUrl;
    else alert('Payment setup failed: '+(data.error||'Please try again.'));
  }catch(e){alert('Payment error. Please try again.');}
}

// ── Notification centre ─────────────────────────────────────
function NotifCentre({notifs,onClear}){
  const[open,setOpen]=useState(false);const unread=notifs.filter(n=>!n.read).length;
  return(<div style={{position:'relative'}}><button onClick={()=>setOpen(p=>!p)} style={{position:'relative',padding:'8px 12px',borderRadius:8,border:`1px solid ${C.goldB}`,background:'transparent',color:C.mid,cursor:'pointer',fontSize:16,lineHeight:1}}>🔔{unread>0&&<span style={{position:'absolute',top:-4,right:-4,width:16,height:16,borderRadius:'50%',background:C.red,color:C.white,fontSize:9,fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center'}}>{unread}</span>}</button>{open&&<div style={{position:'absolute',right:0,top:44,width:300,background:C.white,border:`1px solid ${C.goldB}`,borderRadius:14,boxShadow:'0 8px 32px rgba(0,0,0,0.12)',zIndex:100,overflow:'hidden'}}><div style={{padding:'14px 16px',borderBottom:`1px solid ${C.goldL}`,display:'flex',justifyContent:'space-between',alignItems:'center'}}><span style={{fontWeight:700,fontSize:13}}>Notifications</span><button onClick={()=>{onClear();setOpen(false);}} style={{background:'none',border:'none',color:C.light,cursor:'pointer',fontSize:12,fontFamily:SAN}}>Clear all</button></div><div style={{maxHeight:280,overflowY:'auto'}}>{notifs.length===0?<div style={{padding:24,textAlign:'center',fontSize:13,color:C.light}}>No notifications</div>:notifs.map((n,i)=><div key={i} style={{padding:'12px 16px',borderBottom:`1px solid ${C.goldL}`,background:n.read?C.white:'rgba(182,139,46,0.04)'}}><div style={{fontSize:13,color:C.dark,fontWeight:n.read?400:600,marginBottom:2}}>{n.msg}</div><div style={{fontSize:11,color:C.light}}>{n.time}</div></div>)}</div></div>}</div>);
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
  const[profileSaved,setProfileSaved]=useState(false);
  const[notifs,setNotifs]=useState([]);
  const[saving,setSaving]=useState(false);

  const addNotif=msg=>setNotifs(p=>[{msg,time:new Date().toLocaleTimeString('en-ZA',{hour:'2-digit',minute:'2-digit'}),read:false},...p.slice(0,19)]);

  useEffect(()=>{
    loadData();
    if(typeof window!=='undefined'){
      const params=new URLSearchParams(window.location.search);
      const pay=params.get('payment');
      if(pay==='success'){addNotif('✓ Payment received — Vollard Black will confirm shortly.');window.history.replaceState({},'',window.location.pathname);setTab('payments');}
      else if(pay==='failed'){addNotif('⚠ Payment failed. Please try again.');}
    }
  },[session]);

  useEffect(()=>{
    if(!supabase)return;
    const ch=supabase.channel('renter-rt')
      .on('postgres_changes',{event:'INSERT',schema:'public',table:'sales'},payload=>{
        const s=payload.new;
        addNotif(`🎉 "${s.artwork_title}" sold for R ${Number(s.sale_price||0).toLocaleString('en-ZA')}!`);
        loadData();
      })
      .on('postgres_changes',{event:'UPDATE',schema:'public',table:'schedules'},()=>loadData())
      .subscribe();
    return()=>supabase.removeChannel(ch);
  },[]);

  const loadData=async()=>{
    setLoading(true);
    try{
      const{data:cols}=await supabase.from('collectors').select('*').eq('email',session.user.email);
      if(!cols||cols.length===0){setLoading(false);return;}
      const col=toCamel(cols[0]);
      setCollector(col);
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

  const saveProfile=async()=>{
    if(!collector)return;setSavingProfile(true);
    try{
      const bankChanged=(profileForm.bankName||'')!==(collector.bankName||'')||(profileForm.accountNumber||'')!==(collector.accountNumber||'');
      const updates={...profileForm,...(bankChanged?{bankVerified:false}:{})};
      const snake=toSnake(updates);delete snake.id;delete snake.created_at;
      await supabase.from('collectors').update(snake).eq('id',collector.id);
      setCollector(c=>({...c,...updates}));
      setSaveMsg(bankChanged?'Saved. Bank details flagged for verification.':'Profile updated.');
      setTimeout(()=>setSaveMsg(''),5000);setProfileEdit(false);setProfileSaved(true);setTimeout(()=>setProfileSaved(false),3000);
    }catch(e){console.error(e);}
    setSavingProfile(false);
  };

  const totalPaid=payments.reduce((s,p)=>s+(p.amount||0),0);
  const totalOwed=schedules.reduce((s,sc)=>s+(sc.totalDue||0),0);
  const balance=totalOwed-totalPaid;
  const activeScheds=schedules.filter(s=>['Active','Chasing'].includes(s.status));

  // Colors
  const bg='#f5f3ef';
  const cardBg='#ffffff';
  const cardBorder='rgba(182,139,46,0.18)';
  const '#1a1714'='#1a1714';
  const ts='#8a8070';
  const ib='#ffffff';
  const CARD={background:'#ffffff',border:'1px solid rgba(182,139,46,0.18)',borderRadius:16,overflow:'hidden',marginBottom:16};
  const CP={padding:'20px'};
  const SH={fontSize:10,fontWeight:700,letterSpacing:'0.20em',textTransform:'uppercase',color:C.gold,marginBottom:14,paddingBottom:10,borderBottom:`1px solid ${C.goldL}`};
  const inp={width:'100%',padding:'13px 16px',background:ib,border:'1.5px solid rgba(182,139,46,0.22)',borderRadius:12,color:'#1a1714',fontFamily:SAN,fontSize:14,outline:'none',boxSizing:'border-box'};
  const lbl={display:'block',fontSize:10,fontWeight:700,letterSpacing:'0.14em',textTransform:'uppercase',color:'#8a8070',marginBottom:8};

  if(loading)return<div style={{minHeight:'100vh',background:'#f5f3ef',display:'flex',alignItems:'center',justifyContent:'center'}}><div style={{fontFamily:SER,fontSize:24,color:C.gold,letterSpacing:6,opacity:0.6}}>Loading…</div></div>;
  if(!collector)return(<div style={{minHeight:'100vh',background:'#f5f3ef',display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:16,padding:20,fontFamily:SAN}}><Logo sub="License Holder Portal"/><div style={{background:'#ffffff',border:'1px solid rgba(182,139,46,0.18)',borderRadius:16,padding:40,textAlign:'center',maxWidth:420,width:'100%'}}><div style={{fontFamily:SER,fontSize:22,color:'#1a1714',marginBottom:8}}>Account Not Linked</div><div style={{fontSize:13,color:'#8a8070',marginBottom:16}}>Contact Vollard Black to link your account.</div><button onClick={signOut} style={{padding:'10px 24px',borderRadius:8,border:`1px solid ${C.goldB}`,background:'transparent',color:C.gold,cursor:'pointer',fontSize:13,fontWeight:600,fontFamily:SAN}}>Sign Out</button></div></div>);

  return(
    <div style={{minHeight:'100vh',background:'#f5f3ef',fontFamily:SAN,color:'#1a1714',transition:'background 0.3s'}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600&family=DM+Sans:wght@300;400;500;600&display=swap');*{box-sizing:border-box;}input:focus,select:focus,textarea:focus{border-color:${C.gold}!important;box-shadow:0 0 0 3px rgba(182,139,46,0.12)!important;outline:none;}`}</style>

      {/* Top bar */}
      <div style={{background:'#fff',borderBottom:'1px solid rgba(182,139,46,0.18)',padding:'0 20px',height:56,display:'flex',alignItems:'center',justifyContent:'space-between',position:'sticky',top:0,zIndex:50,boxShadow:'0 1px 12px rgba(0,0,0,0.06)'}}>
        <a href="/" style={{textDecoration:'none',display:'flex',alignItems:'center',gap:10}}>
          <div style={{fontFamily:SER,fontSize:18,fontWeight:300,letterSpacing:'0.20em',color:'#1a1714'}}>VOLLARD <span style={{color:C.gold}}>BLACK</span></div>
          <div style={{width:1,height:14,background:C.goldB}}/>
          <span style={{fontSize:9,letterSpacing:'0.18em',textTransform:'uppercase',color:C.gold,fontWeight:700}}>License Holder</span>
        </a>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <button onClick={()=>setDarkMode(d=>!d)} style={{padding:'7px 12px',borderRadius:8,border:'1px solid rgba(182,139,46,0.18)',background:'transparent',color:'#8a8070',cursor:'pointer',fontSize:14,lineHeight:1}}>{'🌙'}</button>
          <NotifCentre notifs={notifs} onClear={()=>setNotifs([])}/>
          <button onClick={()=>window.open('https://wa.me/27826503393?text='+encodeURIComponent('Hi Vollard Black, I need assistance.'),'_blank')} style={{padding:'7px 12px',borderRadius:8,border:'1px solid rgba(37,211,102,0.30)',background:'rgba(37,211,102,0.08)',color:'#25d366',cursor:'pointer',fontSize:13,fontWeight:600,fontFamily:SAN}}>Chat</button>
          <span style={{fontSize:13,color:'#8a8070',fontWeight:500}}>{gn(collector)}</span>
          <button onClick={signOut} style={{padding:'7px 14px',borderRadius:8,border:'1px solid rgba(182,139,46,0.18)',background:'transparent',color:'#8a8070',cursor:'pointer',fontSize:11,fontFamily:SAN}}>Sign Out</button>
        </div>
      </div>

      {/* Header */}
      <div style={{background:'#ffffff',borderBottom:'1px solid rgba(182,139,46,0.18)',padding:'24px 20px 20px'}}>
        <div style={{maxWidth:960,margin:'0 auto'}}>
          <div style={{display:'flex',gap:16,alignItems:'center',marginBottom:20,flexWrap:'wrap'}}>
            <div style={{width:56,height:56,borderRadius:'50%',background:'rgba(182,139,46,0.10)',border:'2px solid rgba(182,139,46,0.22)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,fontSize:22,color:'#b68b2e',fontFamily:SER}}>
              {gn(collector)?gn(collector)[0].toUpperCase():'L'}
            </div>
            <div>
              <div style={{fontFamily:SER,fontSize:28,fontWeight:300,color:'#1a1714'}}>{gn(collector)}</div>
              <div style={{fontSize:12,color:'#8a8070',marginTop:2}}>License Holder · {activeScheds.length} active display{activeScheds.length!==1?'s':''}</div>
            </div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10}}>
            {[['Artworks',schedules.length],['Active',activeScheds.length],['Total Paid','R '+fmt(totalPaid)],['Outstanding','R '+fmt(Math.max(0,balance))]].map(([l,v])=>(
              <div key={l} style={{background:'#f7f5f1',border:'1px solid rgba(182,139,46,0.18)',borderRadius:10,padding:'12px 10px',textAlign:'center'}}>
                <div style={{fontSize:9,letterSpacing:'0.16em',textTransform:'uppercase',color:'#8a8070',marginBottom:4}}>{l}</div>
                <div style={{fontFamily:SER,fontSize:20,fontWeight:300,color:'#1a1714'}}>{v}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div style={{maxWidth:960,margin:'0 auto',padding:'24px 16px 100px'}}>
        {/* Tabs */}
        <div style={{display:'flex',flexWrap:'wrap',gap:8,marginBottom:28}}>
          {[['overview','Overview'],['artworks','My Artworks'],['payments','Payments'],['calendar','Calendar'],['statements','Statements'],['profile','Profile'],['terms','Terms']].map(([id,lbl])=>(
            <button key={id} onClick={()=>setTab(id)} style={{padding:'9px 20px',borderRadius:24,border:tab===id?'none':'1px solid rgba(182,139,46,0.18)',background:tab===id?`linear-gradient(135deg,${C.gold},${C.goldD})`:'#fff',color:tab===id?'#fff':ts,fontSize:13,fontWeight:tab===id?600:400,cursor:'pointer',fontFamily:SAN,whiteSpace:'nowrap',transition:'all 0.2s',boxShadow:tab===id?'0 4px 12px rgba(182,139,46,0.28)':'none'}}>
              {lbl}
            </button>
          ))}
        </div>

        {/* OVERVIEW */}
        {tab==='overview'&&(
          <div>
            {/* Outstanding alert */}
            {balance>0&&<div style={{...CARD,border:`1.5px solid rgba(230,190,50,0.35)`,background:'rgba(230,190,50,0.04)',marginBottom:16}}><div style={CP}><div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:12}}><div><div style={{fontSize:14,fontWeight:700,color:'#b8920a',marginBottom:2}}>Payment Due</div><div style={{fontSize:13,color:'#8a8070'}}>Outstanding balance: <strong style={{color:'#b8920a'}}>R {fmt(balance)}</strong></div></div><button onClick={()=>setTab('payments')} style={{padding:'10px 20px',borderRadius:24,border:'none',background:`linear-gradient(135deg,${C.gold},${C.goldD})`,color:'#fff',cursor:'pointer',fontSize:13,fontWeight:600,fontFamily:SAN}}>Pay Now →</button></div></div></div>}

            {/* Artwork visual cards */}
            {schedules.map(sc=>{
              const art=artworks.find(a=>a.id===sc.artworkId);
              const paid=payments.filter(p=>p.scheduleId===sc.id||p.artworkId===sc.artworkId).reduce((s,p)=>s+(p.amount||0),0);
              const pct=sc.totalDue>0?Math.min(100,Math.round((paid/sc.totalDue)*100)):0;
              const sale=sales.find(s=>s.artworkId===sc.artworkId);
              return(
                <div key={sc.id} style={CARD}>
                  {art?.imageUrl&&<div style={{height:200,overflow:'hidden',position:'relative'}}>
                    <img src={art.imageUrl} alt="" style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}}/>
                    <div style={{position:'absolute',inset:0,background:'linear-gradient(to bottom,transparent 40%,rgba(0,0,0,0.6))'}}/>
                    <div style={{position:'absolute',bottom:12,left:16,right:16,display:'flex',justifyContent:'space-between',alignItems:'flex-end'}}>
                      <div><div style={{fontFamily:SER,fontSize:20,color:'#fff',fontWeight:400,marginBottom:2}}>{sc.artworkTitle||art?.title}</div><div style={{fontSize:11,color:'rgba(255,255,255,0.65)'}}>{art?.medium||'—'} {art?.year?'· '+art.year:''}</div></div>
                      <span style={{fontSize:10,fontWeight:700,padding:'4px 10px',borderRadius:20,background:sc.status==='Active'?'rgba(74,158,107,0.85)':sc.status==='Sold'||sale?'rgba(100,140,200,0.85)':'rgba(196,92,74,0.85)',color:'#fff'}}>{sale?'SOLD':sc.status}</span>
                    </div>
                  </div>}
                  <div style={CP}>
                    {!art?.imageUrl&&<div style={{fontFamily:SER,fontSize:20,color:'#1a1714',marginBottom:4}}>{sc.artworkTitle}</div>}
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:14}}>
                      <div style={{padding:'10px 12px',background:'#f7f5f1',borderRadius:8}}><div style={{fontSize:9,color:'#8a8070',letterSpacing:'0.14em',textTransform:'uppercase',marginBottom:4}}>Monthly Fee</div><div style={{fontFamily:SER,fontSize:18,color:C.gold,fontWeight:600}}>R {fmt(sc.monthlyAmount)}</div></div>
                      <div style={{padding:'10px 12px',background:'#f7f5f1',borderRadius:8}}><div style={{fontSize:9,color:'#8a8070',letterSpacing:'0.14em',textTransform:'uppercase',marginBottom:4}}>Progress</div><div style={{fontFamily:SER,fontSize:18,color:'#1a1714',fontWeight:600}}>{sc.monthsPaid||0}/{sc.termMonths} mo</div></div>
                    </div>
                    <div style={{marginBottom:14}}>
                      <div style={{display:'flex',justifyContent:'space-between',fontSize:11,color:'#8a8070',marginBottom:6}}><span>Paid: R {fmt(paid)}</span><span>{pct}%</span></div>
                      <div style={{height:6,background:'rgba(182,139,46,0.12)',borderRadius:3,overflow:'hidden'}}><div style={{height:'100%',width:pct.toString()+'%',background:`linear-gradient(90deg,${C.gold},${C.goldD})`,borderRadius:3,transition:'width 1s ease'}}/></div>
                    </div>
                    <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                      {art&&<button onClick={()=>generateQR(art,gn(collector))} style={{padding:'8px 16px',borderRadius:24,border:`1px solid ${C.goldB}`,background:'transparent',color:C.gold,cursor:'pointer',fontSize:11,fontWeight:600,fontFamily:SAN}}>📱 QR Code</button>}
                      <button onClick={()=>generateAgreement(sc,sc.artworkTitle||'',gn(collector))} style={{padding:'8px 16px',borderRadius:24,border:`1px solid ${C.goldB}`,background:'transparent',color:C.gold,cursor:'pointer',fontSize:11,fontWeight:600,fontFamily:SAN}}>📄 Agreement</button>
                      {sc.status==='Active'&&<button onClick={()=>{const nextMonth=(sc.monthsPaid||0)+1;payWithIkhoka({amount:sc.monthlyAmount,description:`VB License: ${sc.artworkTitle} Mo ${nextMonth}`,scheduleId:sc.id,monthNumber:nextMonth,email:session.user.email});}} style={{padding:'8px 16px',borderRadius:24,border:'none',background:`linear-gradient(135deg,${C.gold},${C.goldD})`,color:'#fff',cursor:'pointer',fontSize:11,fontWeight:700,fontFamily:SAN}}>💳 Pay Now</button>}
                    </div>
                  </div>
                </div>
              );
            })}
            {schedules.length===0&&<div style={{...CARD,textAlign:'center',padding:56}}><div style={{fontSize:44,opacity:0.2,marginBottom:12}}>🖼</div><div style={{fontFamily:SER,fontSize:22,color:'#1a1714',marginBottom:8}}>No artworks yet</div><div style={{fontSize:13,color:'#8a8070'}}>Contact Vollard Black to set up your first license agreement.</div></div>}
          </div>
        )}

        {/* MY ARTWORKS */}
        {tab==='artworks'&&(
          <div>
            <div style={{fontFamily:SER,fontSize:28,fontWeight:300,color:'#1a1714',marginBottom:20}}>My Artworks</div>
            {schedules.map(sc=>{
              const art=artworks.find(a=>a.id===sc.artworkId);
              const sale=sales.find(s=>s.artworkId===sc.artworkId);
              return(
                <div key={sc.id} style={CARD}>
                  {art?.imageUrl&&<img src={art.imageUrl} alt="" style={{width:'100%',height:220,objectFit:'cover',display:'block'}}/>}
                  <div style={CP}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:10,marginBottom:8}}>
                      <div style={{fontFamily:SER,fontSize:22,color:'#1a1714',fontWeight:400}}>{sc.artworkTitle||art?.title}</div>
                      <span style={{fontSize:10,fontWeight:700,padding:'4px 10px',borderRadius:20,flexShrink:0,background:sale?'rgba(100,140,200,0.12)':sc.status==='Active'?'rgba(74,158,107,0.12)':'rgba(182,139,46,0.12)',color:sale?C.blue:sc.status==='Active'?C.greenD:C.gold}}>{sale?'SOLD':sc.status}</span>
                    </div>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:12}}>
                      {[['Artist',art?.artistName||art?.artist||'—'],['Medium',art?.medium||'—'],['Year',art?.year||'—'],['Value','R '+fmt(art?.recommendedPrice||sc.artworkValue)]].map(([l,v])=>(
                        <div key={l} style={{padding:'8px 10px',background:'#f7f5f1',borderRadius:8}}><div style={{fontSize:9,color:'#8a8070',letterSpacing:'0.12em',textTransform:'uppercase',marginBottom:2}}>{l}</div><div style={{fontSize:13,fontWeight:600,color:'#1a1714'}}>{v}</div></div>
                      ))}
                    </div>
                    <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                      {art&&<button onClick={()=>generateQR(art,gn(collector))} style={{padding:'8px 14px',borderRadius:24,border:`1px solid ${C.goldB}`,background:'transparent',color:C.gold,cursor:'pointer',fontSize:11,fontWeight:600,fontFamily:SAN}}>📱 QR Code</button>}
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
            <div style={{fontFamily:SER,fontSize:28,fontWeight:300,color:'#1a1714',marginBottom:20}}>Payments</div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginBottom:20}}>
              {[['Total Paid','R '+fmt(totalPaid),C.green],['Outstanding','R '+fmt(Math.max(0,balance)),balance>0?'#b8920a':C.green],['Total Due','R '+fmt(totalOwed),'#1a1714']].map(([l,v,color])=>(
                <div key={l} style={{...CARD,textAlign:'center',padding:'18px 12px',marginBottom:0}}><div style={{fontSize:9,letterSpacing:'0.16em',textTransform:'uppercase',color:'#8a8070',marginBottom:8}}>{l}</div><div style={{fontFamily:SER,fontSize:24,fontWeight:300,color}}>{v}</div></div>
              ))}
            </div>
            {schedules.filter(sc=>sc.status==='Active').map(sc=>{
              const nextMonth=(sc.monthsPaid||0)+1;
              if(nextMonth>sc.termMonths)return null;
              return(
                <div key={sc.id} style={{...CARD,border:`1.5px solid ${C.goldB}`}}>
                  <div style={CP}>
                    <div style={{fontFamily:SER,fontSize:18,color:'#1a1714',marginBottom:4}}>{sc.artworkTitle}</div>
                    <div style={{fontSize:12,color:'#8a8070',marginBottom:16}}>Month {nextMonth} of {sc.termMonths} · Due on the 25th</div>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:12}}>
                      <div style={{fontFamily:SER,fontSize:28,color:C.gold,fontWeight:600}}>R {fmt(sc.monthlyAmount)}</div>
                      <button onClick={()=>payWithIkhoka({amount:sc.monthlyAmount,description:`VB License: ${sc.artworkTitle} Mo ${nextMonth}`,scheduleId:sc.id,monthNumber:nextMonth,email:session.user.email})} style={{padding:'12px 28px',borderRadius:24,border:'none',background:`linear-gradient(135deg,${C.gold},${C.goldD})`,color:'#fff',cursor:'pointer',fontSize:13,fontWeight:700,fontFamily:SAN,boxShadow:'0 4px 14px rgba(182,139,46,0.30)'}}>💳 Pay via iKhoka</button>
                    </div>
                  </div>
                </div>
              );
            })}
            <div style={{marginTop:8}}>
              <div style={{fontSize:10,fontWeight:700,letterSpacing:'0.16em',textTransform:'uppercase',color:'#8a8070',marginBottom:12}}>Payment History</div>
              {payments.length===0?<div style={{...CARD,textAlign:'center',padding:40}}><div style={{fontSize:13,color:'#8a8070'}}>No payments recorded yet.</div></div>
              :payments.map(p=>(
                <div key={p.id} style={{...CARD,marginBottom:8}}>
                  <div style={{...CP,padding:'14px 20px',display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:10}}>
                    <div><div style={{fontSize:13,fontWeight:600,color:'#1a1714'}}>{p.artworkTitle||'Payment'}</div><div style={{fontSize:11,color:'#8a8070'}}>{p.date||p.createdAt?.slice(0,10)||'—'} · {p.method||'—'} · Mo {p.monthNumber||'—'}</div></div>
                    <div style={{textAlign:'right'}}><div style={{fontFamily:SER,fontSize:18,color:C.green,fontWeight:600}}>R {fmt(p.amount)}</div><div style={{fontSize:10,color:C.green,fontWeight:700}}>✓ Paid</div></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PAYMENT CALENDAR */}
        {tab==='calendar'&&(
          <div>
            <div style={{fontFamily:SER,fontSize:28,fontWeight:300,color:'#1a1714',marginBottom:20}}>Payment Calendar</div>
            {schedules.map(sc=>{
              const paid=new Set(payments.filter(p=>p.scheduleId===sc.id||p.artworkId===sc.artworkId).map(p=>p.monthNumber));
              const months=Array.from({length:sc.termMonths},(_, i)=>i+1);
              return(
                <div key={sc.id} style={{...CARD,marginBottom:20}}>
                  <div style={CP}>
                    <div style={{fontFamily:SER,fontSize:18,color:'#1a1714',marginBottom:4}}>{sc.artworkTitle}</div>
                    <div style={{fontSize:12,color:'#8a8070',marginBottom:16}}>R {fmt(sc.monthlyAmount)}/mo · {sc.termMonths} months · Started {sc.startDate||'—'}</div>
                    <div style={{display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:6}}>
                      {months.map(m=>{
                        const isPaid=paid.has(m);
                        const isCurrent=m===(sc.monthsPaid||0)+1&&sc.status==='Active';
                        return(
                          <div key={m} style={{padding:'10px 4px',borderRadius:10,textAlign:'center',background:isPaid?'rgba(74,158,107,0.12)':isCurrent?`rgba(182,139,46,0.15)`:'#f7f5f1',border:`1px solid ${isPaid?'rgba(74,158,107,0.30)':isCurrent?C.goldB:'transparent'}`,transition:'all 0.2s'}}>
                            <div style={{fontSize:8,color:isPaid?C.greenD:isCurrent?C.gold:'#8a8070',letterSpacing:'0.1em',textTransform:'uppercase',marginBottom:4}}>Mo {m}</div>
                            <div style={{fontSize:16,lineHeight:1}}>{isPaid?'✓':isCurrent?'●':'○'}</div>
                            <div style={{fontSize:9,color:isPaid?C.greenD:isCurrent?C.gold:'#8a8070',marginTop:2,fontWeight:isPaid||isCurrent?700:400}}>{isPaid?'Paid':isCurrent?'Due':'—'}</div>
                          </div>
                        );
                      })}
                    </div>
                    <div style={{display:'flex',gap:16,marginTop:14,fontSize:11,color:'#8a8070'}}>
                      <span style={{color:C.greenD,fontWeight:600}}>✓ Paid: {paid.size}</span>
                      <span style={{color:C.gold,fontWeight:600}}>● Current: {Math.max(0,(sc.termMonths)-paid.size-(sc.termMonths-(sc.monthsPaid||0)-1))||0}</span>
                      <span>○ Remaining: {sc.termMonths-paid.size}</span>
                    </div>
                  </div>
                </div>
              );
            })}
            {schedules.length===0&&<div style={{...CARD,textAlign:'center',padding:56}}><div style={{fontSize:13,color:'#8a8070'}}>No payment schedules yet.</div></div>}
          </div>
        )}

        {/* STATEMENTS */}
        {tab==='statements'&&(
          <div>
            <div style={{fontFamily:SER,fontSize:28,fontWeight:300,color:'#1a1714',marginBottom:20}}>Statements</div>
            {schedules.map(sc=>{
              const art=artworks.find(a=>a.id===sc.artworkId);
              const scPays=payments.filter(p=>p.scheduleId===sc.id||p.artworkId===sc.artworkId);
              const paid=scPays.reduce((s,p)=>s+(p.amount||0),0);
              const sale=sales.find(s=>s.artworkId===sc.artworkId);
              return(
                <div key={sc.id} style={CARD}>
                  <div style={CP}>
                    <div style={{display:'flex',justifyContent:'space-between',flexWrap:'wrap',gap:8,marginBottom:16}}>
                      <div style={{fontFamily:SER,fontSize:20,color:'#1a1714'}}>{sc.artworkTitle||art?.title}</div>
                      <span style={{padding:'4px 12px',borderRadius:20,fontSize:10,fontWeight:700,background:sc.status==='Active'?'rgba(74,158,107,0.12)':'rgba(182,139,46,0.12)',color:sc.status==='Active'?C.greenD:C.gold}}>{sc.status}</span>
                    </div>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:16}}>
                      {[['Artwork value','R '+fmt(art?.recommendedPrice||sc.artworkValue)],['Monthly fee','R '+fmt(sc.monthlyAmount)],['Term',sc.termMonths+' months'],['Months paid',(sc.monthsPaid||0)+' of '+sc.termMonths],['Total paid','R '+fmt(paid)],['Outstanding','R '+fmt(Math.max(0,(sc.totalDue||0)-paid))]].map(([l,v])=>(
                        <div key={l} style={{padding:'8px 10px',background:'#f7f5f1',borderRadius:8}}><div style={{fontSize:9,color:'#8a8070',letterSpacing:'0.12em',textTransform:'uppercase',marginBottom:2}}>{l}</div><div style={{fontSize:13,fontWeight:600,color:'#1a1714'}}>{v}</div></div>
                      ))}
                    </div>
                    <div style={{display:'flex',gap:8}}>
                      <button onClick={()=>generateAgreement(sc,sc.artworkTitle||'',gn(collector))} style={{padding:'8px 16px',borderRadius:24,border:`1px solid ${C.goldB}`,background:'transparent',color:C.gold,cursor:'pointer',fontSize:11,fontWeight:600,fontFamily:SAN}}>📄 Download Agreement</button>
                    </div>
                    {sale&&<div style={{marginTop:16,padding:'14px',background:'rgba(74,158,107,0.06)',border:'1px solid rgba(74,158,107,0.20)',borderRadius:12}}><div style={{fontSize:10,fontWeight:700,letterSpacing:'0.14em',textTransform:'uppercase',color:C.greenD,marginBottom:10}}>{sale.source==='auction'?'⚖ Auction Sale':'Sale Settlement'}</div><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,fontSize:13}}><div style={{color:'#8a8070'}}>Sale date</div><div style={{fontWeight:600,color:'#1a1714'}}>{sale.date||'—'}</div><div style={{color:'#8a8070'}}>Sale price</div><div style={{fontWeight:600,color:'#1a1714'}}>R {fmt(sale.salePrice)}</div><div style={{color:C.greenD,fontWeight:700}}>You receive</div><div style={{fontFamily:SER,fontSize:18,color:C.greenD,fontWeight:600}}>R {fmt(sale.colNet||sale.collectorShare)}</div></div></div>}
                  </div>
                </div>
              );
            })}
            {schedules.length===0&&<div style={{...CARD,textAlign:'center',padding:56}}><div style={{fontSize:13,color:'#8a8070'}}>No agreements yet.</div></div>}
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
                {[{title:'Personal Information',rows:[['Name',gn(collector)],['Email',collector?.email||session.user.email||'—'],['Mobile',collector?.mobile||'—'],['ID / Passport',collector?.idNumber||'—'],['Nationality',collector?.nationality||'—'],['City',collector?.city||'—'],['Country',collector?.country||'—'],['Address',collector?.address||'—']]},{title:'Banking Details',bank:true}].map(section=>(
                  <div key={section.title} style={CARD}><div style={CP}><div style={SH}>{section.title}</div>
                  {section.bank?(
                    <div>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
                        <span style={{fontSize:12,color:'#8a8070'}}>Payout account for sale proceeds</span>
                        {collector?.bankVerified?<span style={{fontSize:11,fontWeight:700,color:C.greenD,background:'rgba(74,158,107,0.10)',padding:'3px 10px',borderRadius:20}}>✓ Verified</span>:(collector?.bankName||collector?.accountNumber)?<span style={{fontSize:11,fontWeight:700,color:'#b8920a',background:'rgba(230,190,50,0.10)',padding:'3px 10px',borderRadius:20}}>⏳ Pending</span>:<span style={{fontSize:11,color:'#8a8070'}}>Not yet added</span>}
                      </div>
                      {(collector?.bankName||collector?.accountNumber)?[['Bank',collector?.bankName||'—'],['Account Holder',collector?.accountHolder||'—'],['Account Number',collector?.accountNumber||'—'],['Branch Code',collector?.branchCode||'—']].map(([l,v])=><div key={l} style={{display:'flex',justifyContent:'space-between',padding:'9px 0',borderBottom:`1px solid ${C.goldL}`,fontSize:13,gap:12}}><span style={{color:'#8a8070',flexShrink:0}}>{l}</span><span style={{fontWeight:500}}>{v}</span></div>):<div style={{fontSize:13,color:'#8a8070',padding:'8px 0',lineHeight:1.7}}>Add your banking details so Vollard Black can pay sale proceeds directly to your account.</div>}
                    </div>
                  ):section.rows.map(([l,v])=><div key={l} style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',padding:'10px 0',borderBottom:`1px solid ${C.goldL}`,fontSize:13,gap:12}}><span style={{color:'#8a8070',flexShrink:0}}>{l}</span><span style={{fontWeight:500,textAlign:'right',color:'#1a1714'}}>{v}</span></div>)}</div></div>
                ))}
              </div>
            ):(
              <div>
                <div style={{...CARD,marginBottom:16}}><div style={CP}><div style={SH}>Personal Information</div><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>{[['firstName','First Name'],['lastName','Last Name'],['mobile','Mobile'],['idNumber','ID / Passport'],['nationality','Nationality'],['city','City'],['country','Country']].map(([key,label])=><div key={key}><label style={lbl}>{label}</label><input value={profileForm[key]||''} onChange={e=>setProfileForm(p=>({...p,[key]:e.target.value}))} style={inp}/></div>)}<div style={{gridColumn:'1/-1'}}><label style={lbl}>Address</label><textarea value={profileForm.address||''} onChange={e=>setProfileForm(p=>({...p,address:e.target.value}))} style={{...inp,minHeight:60,resize:'vertical'}}/></div></div></div></div>
                <div style={{...CARD,marginBottom:16}}><div style={CP}><div style={SH}>Banking Details</div><div style={{fontSize:12,color:'#8a8070',marginBottom:16,lineHeight:1.7}}>Your payout account. Changes require re-verification by Vollard Black.</div><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>{[['bankName','Bank Name'],['accountHolder','Account Holder'],['accountNumber','Account Number'],['branchCode','Branch Code']].map(([key,label])=><div key={key}><label style={lbl}>{label}</label><input value={profileForm[key]||''} onChange={e=>setProfileForm(p=>({...p,[key]:e.target.value}))} style={inp} inputMode={key==='accountNumber'||key==='branchCode'?'numeric':undefined}/></div>)}</div><div style={{marginTop:14,padding:'11px 14px',background:'rgba(230,190,50,0.05)',border:'1px solid rgba(230,190,50,0.18)',borderRadius:10,fontSize:12,color:'#8a8070',lineHeight:1.6}}>⚠ Changes flag your account for verification before payouts resume.</div></div></div>
                <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}><button onClick={()=>setProfileEdit(false)} style={{padding:'12px 22px',borderRadius:12,border:`1px solid ${C.goldB}`,background:'transparent',color:C.gold,fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:SAN}}>Cancel</button><button onClick={saveProfile} disabled={savingProfile} style={{padding:'12px 28px',borderRadius:12,border:'none',background:`linear-gradient(135deg,${C.gold},${C.goldD})`,color:'#fff',fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:SAN,opacity:savingProfile?0.6:1,boxShadow:'0 4px 14px rgba(182,139,46,0.28)'}}>{savingProfile?'Saving…':'Save Changes'}</button></div>
              </div>
            )}
          </div>
        )}

        {/* TERMS */}
        {tab==='terms'&&(
          <div>
            <div style={{fontFamily:SER,fontSize:28,fontWeight:300,color:'#1a1714',marginBottom:20}}>Display License Agreement</div>
            <div style={CARD}><div style={CP}><div style={{fontSize:12,color:'#8a8070',marginBottom:20}}>Vollard Black (Pty) Ltd · Hermanus, South Africa</div>{[['1. License Fee','The display license fee is 50% of the declared artwork value, payable in monthly instalments over your agreed term.'],['2. On Sale','When your artwork sells: Vollard Black retains the outstanding license fee balance from the proceeds. You receive the remainder. Any surplus above the original value is split 50/50.'],['3. Care of Artwork','You agree to display the artwork safely, not move it without consent, and notify Vollard Black immediately of any damage or theft.'],['4. Ownership','Title remains with the artist/Vollard Black until the full license fee is paid and a sale is concluded.'],['5. Cancellation','Either party may cancel with 30 days written notice.'],['6. Governing Law','This agreement is governed by the laws of South Africa.']].map(([title,text])=><div key={title} style={{marginBottom:16,paddingBottom:16,borderBottom:`1px solid ${C.goldL}`}}><div style={{fontFamily:SER,fontSize:16,color:'#1a1714',marginBottom:6,fontWeight:500}}>{title}</div><div style={{fontSize:13,color:'#8a8070',lineHeight:1.8}}>{text}</div></div>)}<div style={{padding:'12px 16px',background:'rgba(182,139,46,0.06)',borderRadius:10,fontSize:12,color:'#8a6a1e'}}>Contact: <strong>concierge@vollardblack.com</strong></div></div></div>
          </div>
        )}
      </div>

      {/* Mobile bottom nav */}
      <div style={{position:'fixed',bottom:0,left:0,right:0,background:'#fff',borderTop:'1px solid rgba(182,139,46,0.18)',padding:'8px 0',display:'flex',justifyContent:'space-around',zIndex:50,boxShadow:'0 -4px 20px rgba(0,0,0,0.08)'}}>
        {[['overview','🏠','Home'],['artworks','🖼','Works'],['payments','💳','Pay'],['calendar','📅','Calendar'],['profile','👤','Profile']].map(([id,icon,l])=>(
          <button key={id} onClick={()=>setTab(id)} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:2,padding:'4px 8px',background:'none',border:'none',cursor:'pointer',fontFamily:SAN}}>
            <span style={{fontSize:18,opacity:tab===id?1:0.4}}>{icon}</span>
            <span style={{fontSize:9,letterSpacing:'0.06em',textTransform:'uppercase',color:tab===id?C.gold:ts,fontWeight:tab===id?700:400}}>{l}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

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
    supabase.from('portal_requests').select('status').eq('email',session.user.email).eq('role','renter').order('created_at',{ascending:false}).limit(1).single().then(({data,error})=>{
      // No record = not yet registered — sign out so they can register
      if(!data||error){supabase.auth.signOut();return;}
      setApproved(data.status==='approved'?true:data.status==='pending'?'pending':false);
    });
  },[session]);
  if(session===undefined)return<div style={{minHeight:'100vh',background:C.cream,display:'flex',alignItems:'center',justifyContent:'center'}}><div style={{fontFamily:SER,fontSize:24,letterSpacing:8,color:C.gold,opacity:0.5}}>VOLLARD BLACK</div></div>;
  if(!session){
    if(screen==='register')return<KYCRegistration role="renter" supabase={supabase} onComplete={email=>{setPendingEmail(email);setScreen('pending');}} onSignIn={()=>setScreen('login')}/>;
    if(screen==='pending')return<PendingScreen email={pendingEmail} onSignIn={()=>setScreen('login')}/>;
    return<LoginScreen onLogin={s=>setSession(s)} onRegister={()=>setScreen('register')}/>;
  }
  if(approved===null)return<div style={{minHeight:'100vh',background:C.cream,display:'flex',alignItems:'center',justifyContent:'center'}}><div style={{fontFamily:SER,fontSize:18,color:C.gold,opacity:0.5}}>Checking access…</div></div>;
  // 'pending' or false = registered but not yet approved / rejected
  if(approved==='pending'||(!approved&&approved!==null))return<NotApprovedScreen onSignOut={()=>supabase.auth.signOut()}/>;
  return<RenterDashboard session={session}/>;
}
