'use client';
import KYCRegistration from './KYCRegistration';
import { useState, useEffect } from "react";
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = supabaseUrl && supabaseKey 
  ? createClient(supabaseUrl, supabaseKey, { auth: { autoRefreshToken: true, persistSession: true } })
  : null;

const fmt = (n) => Number(n||0).toLocaleString('en-ZA',{minimumFractionDigits:2,maximumFractionDigits:2});
const toSnake = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  const out = {};
  for (const [k, v] of Object.entries(obj))
    out[k.replace(/[A-Z]/g, m => '_' + m.toLowerCase())] = v;
  return out;
};
const toCamel = (obj) => {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return obj;
  const out = {};
  for (const [k, v] of Object.entries(obj))
    out[k.replace(/_([a-z])/g, (_, c) => c.toUpperCase())] = v;
  return out;
};



// ─── iKhoka Payment Helper ────────────────────────────────────────────────────
// Creates an iKhoka paylink via our secure server-side API route
// then redirects the user to the hosted payment page

async function initiateIkhokaPayment({ amount, description, scheduleId, monthNumber, collectorEmail }) {
  try {
    const res = await fetch('/api/ikhoka-paylink', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, description, scheduleId, monthNumber, collectorEmail }),
    });
    const data = await res.json();
    if (!res.ok || !data.paylinkUrl) {
      alert('Payment setup failed: ' + (data.error || 'Unknown error. Please try again.'));
      return;
    }
    // Redirect to iKhoka hosted payment page
    window.location.href = data.paylinkUrl;
  } catch (err) {
    alert('Payment setup failed. Please check your connection and try again.');
    console.error('iKhoka error:', err);
  }
}

const S = {
  page: { minHeight:'100vh', background:'#f5f3ef', fontFamily:"'DM Sans',sans-serif", color:'#2a2622' },
  card: { background:'#fff', border:'1px solid rgba(182,139,46,0.18)', borderRadius:12, padding:20, marginBottom:16 },
  input: { width:'100%', padding:'12px 14px', background:'#f5f3ef', border:'1px solid rgba(182,139,46,0.25)', borderRadius:8, color:'#1a1714', fontFamily:"'DM Sans',sans-serif", fontSize:14, outline:'none', boxSizing:'border-box' },
  label: { display:'block', fontSize:10, fontWeight:500, letterSpacing:2, textTransform:'uppercase', color:'#6b635a', marginBottom:6 },
  btn: (gold) => ({ width:'100%', padding:14, borderRadius:8, border: gold?'none':'1px solid rgba(182,139,46,0.30)', background: gold?'linear-gradient(135deg,#b68b2e,#8a6a1e)':'transparent', color: gold?'#fff':'#b68b2e', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:"'DM Sans',sans-serif", letterSpacing:0.5 }),
  tab: (a) => ({ padding:'10px 18px', border:'none', borderBottom: a?'2px solid #b68b2e':'2px solid transparent', background:'transparent', color: a?'#b68b2e':'#6b635a', fontSize:13, fontWeight: a?600:400, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }),
  gold: { color:'#b68b2e', fontWeight:600 },
  green: { color:'#4a9e6b', fontWeight:600 },
};

const Logo = ({sub}) => (
  <div style={{textAlign:'center', marginBottom:40}}>
    <div style={{fontFamily:"'Cormorant Garamond',serif", fontSize:36, fontWeight:300, letterSpacing:10, color:'#1a1714'}}>
      VOLLARD <span style={{color:'#b68b2e'}}>BLACK</span>
    </div>
    <div style={{fontSize:10, letterSpacing:4, textTransform:'uppercase', color:'#8a8070', marginTop:6}}>{sub}</div>
    <div style={{width:40, height:1, background:'rgba(182,139,46,0.4)', margin:'16px auto 0'}}/>
  </div>
);

// ── Registration Screen ───────────────────────────────────
function PendingScreen({email, onSignIn}) {
  return (
    <div style={{...S.page, display:'flex', alignItems:'center', justifyContent:'center', padding:20}}>
      <div style={{width:'100%', maxWidth:420, textAlign:'center'}}>
        <Logo sub="Renter Portal"/>
        <div style={{...S.card, padding:36}}>
          <div style={{fontSize:48, marginBottom:16}}>◆</div>
          <div style={{fontFamily:"'Cormorant Garamond',serif", fontSize:24, color:'#1a1714', marginBottom:8}}>Request Submitted</div>
          <div style={{fontSize:13, color:'#6b635a', marginBottom:20, lineHeight:1.7}}>
            Thank you. Your request has been sent to Vollard Black for review.<br/>
            You will be notified once your account is approved.<br/><br/>
            <strong>{email}</strong>
          </div>
          <button onClick={onSignIn} style={{...S.btn(false), width:'auto', padding:'10px 24px'}}>Sign In Instead</button>
        </div>
      </div>
    </div>
  );
}

// ── Login Screen ─────────────────────────────────────────
function LoginScreen({onLogin, onRegister}) {
  const [email,setEmail] = useState('');
  const [password,setPassword] = useState('');
  const [loading,setLoading] = useState(false);
  const [error,setError] = useState('');
  const [showPw,setShowPw] = useState(false);

  const handleLogin = async(e) => {
    e.preventDefault();
    if(!email||!password) return setError('Enter your email and password.');
    setLoading(true); setError('');
    const {data,error:err} = await supabase.auth.signInWithPassword({email,password});
    setLoading(false);
    if(err) return setError('Incorrect email or password.');
    if(data?.session) onLogin(data.session);
  };

  return (
    <div style={{...S.page, display:'flex', alignItems:'center', justifyContent:'center', padding:20}}>
      <div style={{width:'100%', maxWidth:420}}>
        <Logo sub="Renter Portal"/>
        <div style={{...S.card, padding:32, boxShadow:'0 8px 32px rgba(0,0,0,0.06)'}}>
          <div style={{fontFamily:"'Cormorant Garamond',serif", fontSize:22, color:'#1a1714', marginBottom:4}}>Sign In</div>
          <div style={{fontSize:12, color:'#8a8070', marginBottom:24}}>Your personal display agreement portal</div>
          <form onSubmit={handleLogin}>
            <div style={{marginBottom:14}}>
              <label style={S.label}>Email</label>
              <input type="email" value={email} onChange={e=>{setEmail(e.target.value);setError('');}} style={S.input} autoComplete="email"/>
            </div>
            <div style={{marginBottom:20}}>
              <label style={S.label}>Password</label>
              <div style={{position:'relative'}}>
                <input type={showPw?'text':'password'} value={password} onChange={e=>{setPassword(e.target.value);setError('');}} style={{...S.input,paddingRight:56}} autoComplete="current-password"/>
                <button type="button" onClick={()=>setShowPw(p=>!p)} style={{position:'absolute',right:12,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',color:'#8a8070',cursor:'pointer',fontSize:12}}>{showPw?'Hide':'Show'}</button>
              </div>
            </div>
            {error && <div style={{padding:'10px 14px',background:'rgba(196,92,74,0.08)',border:'1px solid rgba(196,92,74,0.2)',borderRadius:8,fontSize:13,color:'#c45c4a',marginBottom:14}}>{error}</div>}
            <button type="submit" disabled={loading} style={{...S.btn(true),opacity:loading?0.6:1}}>{loading?'Signing in…':'Sign In'}</button>
          </form>
          <div style={{textAlign:'center',marginTop:16,fontSize:12,color:'#8a8070'}}>
            Don't have access yet? <button onClick={onRegister} style={{background:'none',border:'none',color:'#b68b2e',cursor:'pointer',fontSize:12,fontFamily:"'DM Sans',sans-serif",textDecoration:'underline'}}>Request Access</button>
          </div>
        </div>
        <div style={{textAlign:'center',marginTop:20,fontSize:11,color:'#a09890'}}>Vollard Black (Pty) Ltd · Hermanus, South Africa</div>
      </div>
    </div>
  );
}

// ── Access Denied (not approved yet) ─────────────────────
function NotApprovedScreen({onSignOut}) {
  return (
    <div style={{...S.page, display:'flex', alignItems:'center', justifyContent:'center', padding:20, flexDirection:'column', gap:16}}>
      <Logo sub="Renter Portal"/>
      <div style={{...S.card, padding:36, textAlign:'center', maxWidth:420, width:'100%'}}>
        <div style={{fontSize:48, marginBottom:16}}>⏳</div>
        <div style={{fontFamily:"'Cormorant Garamond',serif", fontSize:22, color:'#1a1714', marginBottom:8}}>Awaiting Approval</div>
        <div style={{fontSize:13, color:'#6b635a', lineHeight:1.7, marginBottom:20}}>
          Your account is pending approval from Vollard Black.<br/>
          Please check back soon or contact us directly.
        </div>
        <button onClick={onSignOut} style={{...S.btn(false), width:'auto', padding:'10px 24px'}}>Sign Out</button>
      </div>
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────
function RenterDashboard({session}) {
  const [tab,setTab] = useState('overview');
  const [collector,setCollector] = useState(null);
  const [schedules,setSchedules] = useState([]);
  const [payments,setPayments] = useState([]);
  const [artworks,setArtworks] = useState([]);
  const [sales,setSales] = useState([]);
  const [loading,setLoading] = useState(true);
  const [profileForm,setProfileForm] = useState(null);
  const [savingProfile,setSavingProfile] = useState(false);
  const [profileSaved,setProfileSaved] = useState(false);
  const [saleAlert,setSaleAlert] = useState('');

  useEffect(()=>{ loadData(); },[session]);

  // Detect iKhoka return URL params
  useEffect(()=>{
    if(typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const payStatus = params.get('payment');
    const ref = params.get('ref');
    if(payStatus==='success') {
      setSaleAlert(`✓ Payment received${ref?' (Ref: '+ref+')':''} — Vollard Black will confirm and update your account within 1 business day.`);
      window.history.replaceState({}, '', window.location.pathname);
      // Switch to payments tab so they see confirmation
      setTab('payments');
    } else if(payStatus==='failed') {
      setSaleAlert('⚠ Payment failed. Please try again or contact Vollard Black.');
      window.history.replaceState({}, '', window.location.pathname);
    } else if(payStatus==='cancelled') {
      setSaleAlert('⚠ Payment was cancelled. No charge was made.');
      window.history.replaceState({}, '', window.location.pathname);
    }
  },[]);

  // Realtime — listen for sales on collector's artworks
  useEffect(()=>{
    if(!session||!supabase) return;
    const ch = supabase.channel('renter-rt')
      .on('postgres_changes',{event:'INSERT',schema:'public',table:'sales'},(payload)=>{
        const s = payload.new;
        // Only care if this sale is for our collector
        loadData();
        if(s.source==='auction') {
          setSaleAlert(`🏆 Your artwork "${s.artwork_title}" sold at auction for R ${Number(s.sale_price||0).toLocaleString('en-ZA',{minimumFractionDigits:2})}!`);
        } else {
          setSaleAlert(`✓ Your artwork "${s.artwork_title}" has been sold for R ${Number(s.sale_price||0).toLocaleString('en-ZA',{minimumFractionDigits:2})}.`);
        }
        setTimeout(()=>setSaleAlert(''), 10000);
      })
      .on('postgres_changes',{event:'UPDATE',schema:'public',table:'schedules'},(payload)=>{
        loadData();
      })
      .subscribe();
    return ()=>supabase.removeChannel(ch);
  },[session]);

  const loadData = async() => {
    setLoading(true);
    try {
      const {data:cols} = await supabase.from('collectors').select('*').eq('email', session.user.email);
      if(!cols||cols.length===0){ setLoading(false); return; }
      const col = toCamel(cols[0]);
      setCollector(col);
      setProfileForm(col);
      setProfileForm({firstName:col.firstName||'',lastName:col.lastName||'',mobile:col.mobile||'',idNumber:col.idNumber||'',nationality:col.nationality||'',city:col.city||'',country:col.country||'South Africa',address:col.address||''});
      const {data:scheds} = await supabase.from('schedules').select('*').eq('collector_id', col.id);
      const s = (scheds||[]).map(toCamel);
      setSchedules(s);
      const {data:pays} = await supabase.from('payments').select('*').eq('collector_id', col.id).order('created_at',{ascending:false});
      setPayments((pays||[]).map(toCamel));
      const artworkIds = s.map(sc=>sc.artworkId).filter(Boolean);
      if(artworkIds.length>0) {
        const {data:arts} = await supabase.from('artworks').select('*').in('id', artworkIds);
        setArtworks((arts||[]).map(toCamel));
      }
      const {data:sls} = await supabase.from('sales').select('*').eq('collector_id', col.id);
      setSales((sls||[]).map(toCamel));
    } catch(e) { console.error(e); }
    setLoading(false);
  };

  const signOut = () => supabase.auth.signOut();
  const saveProfile = async() => {
    if(!collector) return;
    setSaving(true);
    const snake = toSnake(profileForm);
    delete snake.id;
    await supabase.from('collectors').update(snake).eq('id',collector.id);
    setCollector({...collector,...profileForm});
    setSaveMsg('Profile updated successfully.');
    setTimeout(()=>setSaveMsg(''),3000);
    setSaving(false);
    setProfileEdit(false);
  };
  const gn = (c) => c?(c.type==='company'?c.companyName:`${c.firstName||''} ${c.lastName||''}`.trim()):'';
  const totalPaid = payments.reduce((s,p)=>s+(p.amount||0),0);
  const totalOwed = schedules.reduce((s,sc)=>s+(sc.totalDue||0),0);
  const balance = totalOwed - totalPaid;
  const activeScheds = schedules.filter(s=>s.status==='Active');

  if(loading) return <div style={{...S.page,display:'flex',alignItems:'center',justifyContent:'center'}}><div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:24,color:'#b68b2e',letterSpacing:6,opacity:0.6}}>Loading…</div></div>;

  if(!collector) return (
    <div style={{...S.page,display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:16,padding:20}}>
      <Logo sub="Renter Portal"/>
      <div style={{...S.card,padding:36,textAlign:'center',maxWidth:420,width:'100%'}}>
        <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,color:'#1a1714',marginBottom:8}}>Account Not Linked</div>
        <div style={{fontSize:13,color:'#8a8070',marginBottom:16}}>Your account hasn't been linked to a renter record yet. Contact Vollard Black.</div>
        <button onClick={signOut} style={{...S.btn(false),width:'auto',padding:'10px 24px'}}>Sign Out</button>
      </div>
    </div>
  );

  return (
    <div style={S.page}>
      <div style={{background:'#fff',borderBottom:'1px solid rgba(182,139,46,0.20)',padding:'14px 20px',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:10}}>
        <div>
          <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:18,fontWeight:300,letterSpacing:5,color:'#1a1714'}}>VOLLARD <span style={{color:'#b68b2e'}}>BLACK</span></div>
          <div style={{fontSize:9,letterSpacing:3,textTransform:'uppercase',color:'#8a8070'}}>Renter Portal</div>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <span style={{fontSize:13,color:'#6b635a'}}>{gn(collector)}</span>
          <button onClick={signOut} style={{padding:'8px 16px',borderRadius:6,border:'1px solid rgba(182,139,46,0.25)',background:'transparent',color:'#8a8070',cursor:'pointer',fontSize:11,fontFamily:"'DM Sans',sans-serif"}}>Sign Out</button>
        </div>
      </div>
      <div style={{maxWidth:900,margin:'0 auto',padding:'20px 16px'}}>
        {saleAlert&&<div style={{padding:'14px 18px',background:'rgba(74,158,107,0.10)',border:'2px solid rgba(74,158,107,0.35)',borderRadius:10,marginBottom:16,fontSize:14,fontWeight:600,color:'#2d7a4a',display:'flex',alignItems:'center',gap:10}}>
          <span style={{fontSize:20}}>🎉</span><span>{saleAlert}</span>
          <button onClick={()=>setSaleAlert('')} style={{marginLeft:'auto',background:'none',border:'none',color:'#4a9e6b',cursor:'pointer',fontSize:18}}>×</button>
        </div>}
        <div style={{display:'flex',borderBottom:'1px solid rgba(182,139,46,0.15)',marginBottom:20,gap:4,overflowX:'auto'}}>
          {[['overview','Overview'],['artworks','My Artworks'],['payments','Payments'],['statements','Statements'],['profile','My Profile'],['terms','Terms']].map(([id,lbl])=>(
            <button key={id} onClick={()=>setTab(id)} style={S.tab(tab===id)}>{lbl}</button>
          ))}
        </div>

        {tab==='overview'&&(
          <div>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:28,fontWeight:300,color:'#1a1714',marginBottom:20}}>Welcome, {gn(collector)}</div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(130px,1fr))',gap:12,marginBottom:20}}>
              {[['Artworks on Display',activeScheds.length,true,false],['Total Paid','R '+fmt(totalPaid),false,true],['Balance Due','R '+fmt(Math.max(0,balance)),balance<=0,balance>0],['Sales',sales.length,false,false]].map(([lbl,val,gold,red])=>(
                <div key={lbl} style={{...S.card,textAlign:'center',padding:'16px 12px'}}>
                  <div style={{fontSize:10,letterSpacing:2,textTransform:'uppercase',color:'#8a8070',marginBottom:6}}>{lbl}</div>
                  <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:26,color:gold?'#b68b2e':red?'#c45c4a':'#4a9e6b'}}>{val}</div>
                </div>
              ))}
            </div>
            {activeScheds.map(sc=>{
              const art=artworks.find(a=>a.id===sc.artworkId);
              const paid=payments.filter(p=>p.artworkId===sc.artworkId).reduce((s,p)=>s+(p.amount||0),0);
              const pct=sc.termMonths>0?Math.min(100,Math.round((sc.monthsPaid||0)/sc.termMonths*100)):0;
              return(
                <div key={sc.id} style={S.card}>
                  <div style={{display:'flex',gap:14,alignItems:'flex-start'}}>
                    {art?.imageUrl&&<div style={{width:64,height:64,borderRadius:8,overflow:'hidden',flexShrink:0}}><img src={art.imageUrl} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/></div>}
                    <div style={{flex:1}}>
                      <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:18,color:'#1a1714',marginBottom:2}}>{sc.artworkTitle||art?.title}</div>
                      <div style={{fontSize:12,color:'#8a8070',marginBottom:10}}>{art?.artist||'—'} · {art?.galleryName||'—'}</div>
                      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6,fontSize:13,marginBottom:10}}>
                        <div><span style={{color:'#8a8070'}}>Monthly fee: </span><span style={S.gold}>R {fmt(sc.monthlyAmount)}</span></div>
                        <div><span style={{color:'#8a8070'}}>Term: </span><span>{sc.monthsPaid||0} of {sc.termMonths} months</span></div>
                        <div><span style={{color:'#8a8070'}}>Paid: </span><span style={S.green}>R {fmt(paid)}</span></div>
                        <div><span style={{color:'#8a8070'}}>Status: </span><span style={{color:sc.status==='Active'?'#4a9e6b':'#c45c4a',fontWeight:600}}>{sc.status}</span></div>
                      </div>
                      <div style={{height:4,background:'rgba(182,139,46,0.15)',borderRadius:2}}>
                        <div style={{height:'100%',width:pct+'%',background:'linear-gradient(90deg,#b68b2e,#4a9e6b)',borderRadius:2}}/>
                      </div>
                      <div style={{fontSize:10,color:'#8a8070',marginTop:3}}>{pct}% complete</div>
                    </div>
                  </div>
                </div>
              );
            })}
            {activeScheds.length===0&&<div style={{...S.card,textAlign:'center',padding:40}}><div style={{fontSize:14,color:'#8a8070'}}>No active display agreements yet.</div></div>}
          </div>
        )}

        {tab==='artworks'&&(
          <div>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:24,color:'#1a1714',marginBottom:16}}>My Artworks</div>
            {artworks.length===0?<div style={{...S.card,textAlign:'center',padding:40}}><div style={{fontSize:14,color:'#8a8070'}}>No artworks linked yet.</div></div>
            :artworks.map(art=>{
              const sc=schedules.find(s=>s.artworkId===art.id);
              return(
                <div key={art.id} style={S.card}>
                  <div style={{display:'flex',gap:16,flexWrap:'wrap'}}>
                    {art.imageUrl&&<div style={{width:110,height:110,borderRadius:10,overflow:'hidden',flexShrink:0}}><img src={art.imageUrl} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/></div>}
                    <div style={{flex:1,minWidth:180}}>
                      <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,color:'#1a1714',marginBottom:4}}>{art.title}</div>
                      <div style={{fontSize:12,color:'#8a8070',marginBottom:10}}>{art.artist} · {art.medium||'—'} · {art.year||'—'}</div>
                      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6,fontSize:13}}>
                        <div><span style={{color:'#8a8070'}}>Value: </span><span style={S.gold}>R {fmt(art.recommendedPrice)}</span></div>
                        <div><span style={{color:'#8a8070'}}>Gallery: </span><span>{art.galleryName||'—'}</span></div>
                        <div><span style={{color:'#8a8070'}}>Status: </span><span style={{fontWeight:600,color:art.status==='Sold'?'#648cc8':art.status==='Available'?'#4a9e6b':'#b68b2e'}}>{art.status}</span></div>
                        {sc&&<div><span style={{color:'#8a8070'}}>Agreement: </span><span>{sc.status}</span></div>}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {tab==='payments'&&(
          <div>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:24,color:'#1a1714',marginBottom:16}}>Payment History</div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(130px,1fr))',gap:12,marginBottom:16}}>
              <div style={{...S.card,textAlign:'center',padding:'14px 10px'}}><div style={{fontSize:10,letterSpacing:2,textTransform:'uppercase',color:'#8a8070',marginBottom:4}}>Total Paid</div><div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:24,...S.green}}>R {fmt(totalPaid)}</div></div>
              <div style={{...S.card,textAlign:'center',padding:'14px 10px'}}><div style={{fontSize:10,letterSpacing:2,textTransform:'uppercase',color:'#8a8070',marginBottom:4}}>Payments</div><div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:24,color:'#1a1714'}}>{payments.length}</div></div>
              <div style={{...S.card,textAlign:'center',padding:'14px 10px'}}><div style={{fontSize:10,letterSpacing:2,textTransform:'uppercase',color:'#8a8070',marginBottom:4}}>Balance</div><div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:24,...S.gold}}>R {fmt(Math.max(0,balance))}</div></div>
            </div>
            {/* Upcoming payments due */}
            {schedules.filter(sc=>sc.status==='Active'&&sc.monthsPaid<sc.termMonths).map(sc=>{
              const paidMonths=new Set(payments.filter(p=>p.scheduleId===sc.id).map(p=>p.monthNumber));
              const nextMonth=Array.from({length:sc.termMonths},(_,i)=>i+1).find(m=>!paidMonths.has(m));
              if(!nextMonth) return null;
              const payRef = `VB-${sc.id.slice(-8)}-M${nextMonth}`;
              const colFirstName = collector?.firstName||'';
              const colLastName = collector?.lastName||collector?.companyName||'';
              return(
                <div key={sc.id} style={{...S.card,border:'2px solid rgba(182,139,46,0.35)',marginBottom:12}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:12}}>
                    <div>
                      <div style={{fontSize:11,letterSpacing:2,textTransform:'uppercase',color:'#b68b2e',marginBottom:4}}>Payment Due</div>
                      <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:18,color:'#1a1714',marginBottom:2}}>{sc.artworkTitle}</div>
                      <div style={{fontSize:12,color:'#8a8070'}}>Month {nextMonth} of {sc.termMonths} · Due 25th</div>
                    </div>
                    <div style={{textAlign:'right'}}>
                      <div style={{fontSize:11,color:'#8a8070',marginBottom:4}}>Amount due</div>
                      <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:28,fontWeight:600,color:'#b68b2e'}}>R {fmt(sc.monthlyAmount)}</div>
                    </div>
                  </div>
                  <div style={{marginTop:14,display:'flex',gap:10,flexWrap:'wrap'}}>
                    <button
                      onClick={()=>initiateIkhokaPayment({
                        amount: sc.monthlyAmount,
                        description: `Vollard Black License Fee: ${sc.artworkTitle} Mo ${nextMonth}`,
                        scheduleId: sc.id,
                        monthNumber: nextMonth,
                        collectorEmail: session.user.email,
                      })}
                      style={{padding:'12px 24px',borderRadius:8,border:'none',background:'linear-gradient(135deg,#b68b2e,#8a6a1e)',color:'#fff',fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:"'DM Sans',sans-serif",display:'flex',alignItems:'center',gap:8}}
                    >
                      💳 Pay R {fmt(sc.monthlyAmount)} via iKhoka
                    </button>
                    <div style={{fontSize:11,color:'#8a8070',display:'flex',alignItems:'center'}}>Ref: {payRef}</div>
                  </div>
                  <div style={{fontSize:11,color:'#8a8070',marginTop:8,padding:'8px 12px',background:'rgba(182,139,46,0.04)',borderRadius:6}}>
                    💡 After payment, Vollard Black will confirm and your account will be updated within 1 business day.
                  </div>
                </div>
              );
            })}
            {payments.length===0?<div style={{...S.card,textAlign:'center',padding:40}}><div style={{fontSize:14,color:'#8a8070'}}>No payments recorded yet.</div></div>:(
              <div style={S.card}>
                <div style={{overflowX:'auto'}}>
                  <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
                    <thead><tr style={{borderBottom:'1px solid rgba(182,139,46,0.2)'}}>
                      {['Date','Artwork','Month','Method','Amount'].map(h=><th key={h} style={{padding:'8px 10px',textAlign:h==='Amount'?'right':'left',fontSize:10,letterSpacing:1,textTransform:'uppercase',color:'#8a8070',fontWeight:500}}>{h}</th>)}
                    </tr></thead>
                    <tbody>
                      {payments.map(p=>(
                        <tr key={p.id} style={{borderBottom:'1px solid rgba(182,139,46,0.08)'}}>
                          <td style={{padding:'10px 10px',color:'#6b635a'}}>{p.date||p.createdAt?.slice(0,10)||'—'}</td>
                          <td style={{padding:'10px 10px',fontWeight:500}}>{p.artworkTitle||'—'}</td>
                          <td style={{padding:'10px 10px',color:'#8a8070'}}>Mo {p.monthNumber||'—'}</td>
                          <td style={{padding:'10px 10px',color:'#8a8070'}}>{p.method||'—'}</td>
                          <td style={{padding:'10px 10px',textAlign:'right',...S.gold}}>R {fmt(p.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot><tr style={{borderTop:'2px solid rgba(182,139,46,0.2)'}}>
                      <td colSpan={4} style={{padding:'10px 10px',fontWeight:600}}>Total</td>
                      <td style={{padding:'10px 10px',textAlign:'right',...S.green}}>R {fmt(totalPaid)}</td>
                    </tr></tfoot>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {tab==='profile'&&(
          <div>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20,flexWrap:'wrap',gap:10}}>
              <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:24,color:'#1a1714'}}>My Profile</div>
              {!profileEdit&&<button onClick={()=>setProfileEdit(true)} style={{padding:'10px 20px',borderRadius:8,border:'1px solid rgba(182,139,46,0.30)',background:'transparent',color:'#b68b2e',fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:"'DM Sans',sans-serif"}}>Edit Profile</button>}
            </div>
            {saveMsg&&<div style={{padding:'10px 14px',background:'rgba(74,158,107,0.08)',border:'1px solid rgba(74,158,107,0.2)',borderRadius:8,fontSize:13,color:'#4a9e6b',marginBottom:14}}>✓ {saveMsg}</div>}
            {!profileEdit?(
              <div style={S.card}>
                {[['Name',collector?`${collector.firstName||''} ${collector.lastName||''}`.trim()||collector.companyName:'—'],['Email',collector?.email||'—'],['Mobile',collector?.mobile||'—'],['ID',collector?.idNumber||'—'],['Nationality',collector?.nationality||'—'],['City',collector?.city||'—'],['Country',collector?.country||'—']].map(([label,value])=>(
                  <div key={label} style={{display:'flex',justifyContent:'space-between',padding:'10px 0',borderBottom:'1px solid rgba(182,139,46,0.08)',fontSize:13}}>
                    <span style={{color:'#8a8070'}}>{label}</span>
                    <span style={{fontWeight:500}}>{value}</span>
                  </div>
                ))}
              </div>
            ):(
              <div style={S.card}>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
                  {[['firstName','First Name'],['lastName','Last Name'],['mobile','Mobile'],['idNumber','ID / Passport'],['nationality','Nationality'],['city','City'],['country','Country']].map(([key,label])=>(
                    <div key={key}>
                      <label style={{display:'block',fontSize:10,fontWeight:500,letterSpacing:2,textTransform:'uppercase',color:'#6b635a',marginBottom:6}}>{label}</label>
                      <input value={profileForm[key]||''} onChange={e=>setProfileForm(p=>({...p,[key]:e.target.value}))} style={S.input}/>
                    </div>
                  ))}
                  <div style={{gridColumn:'1/-1'}}>
                    <label style={{display:'block',fontSize:10,fontWeight:500,letterSpacing:2,textTransform:'uppercase',color:'#6b635a',marginBottom:6}}>Address</label>
                    <textarea value={profileForm.address||''} onChange={e=>setProfileForm(p=>({...p,address:e.target.value}))} style={{...S.input,minHeight:70,resize:'vertical'}}/>
                  </div>
                </div>
                <div style={{display:'flex',gap:10,marginTop:16,justifyContent:'flex-end'}}>
                  <button onClick={()=>setProfileEdit(false)} style={{padding:'10px 20px',borderRadius:8,border:'1px solid rgba(182,139,46,0.30)',background:'transparent',color:'#b68b2e',fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:"'DM Sans',sans-serif"}}>Cancel</button>
                  <button onClick={saveProfile} disabled={saving} style={{padding:'10px 20px',borderRadius:8,border:'none',background:'linear-gradient(135deg,#b68b2e,#8a6a1e)',color:'#fff',fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:"'DM Sans',sans-serif",opacity:saving?0.6:1}}>{saving?'Saving…':'Save Profile'}</button>
                </div>
              </div>
            )}
          </div>
        )}

        {tab==='statements'&&(
          <div>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:24,color:'#1a1714',marginBottom:16}}>Statements</div>
            {schedules.map(sc=>{
              const art=artworks.find(a=>a.id===sc.artworkId);
              const scPays=payments.filter(p=>p.artworkId===sc.artworkId);
              const paid=scPays.reduce((s,p)=>s+(p.amount||0),0);
              const sale=sales.find(s=>s.artworkId===sc.artworkId);
              return(
                <div key={sc.id} style={S.card}>
                  <div style={{display:'flex',justifyContent:'space-between',flexWrap:'wrap',gap:8,marginBottom:14}}>
                    <div>
                      <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,color:'#1a1714'}}>{sc.artworkTitle||art?.title}</div>
                      <div style={{fontSize:12,color:'#8a8070',marginTop:2}}>Started {sc.startDate||'—'}</div>
                    </div>
                    <span style={{padding:'4px 12px',borderRadius:6,fontSize:11,fontWeight:600,background:sc.status==='Active'?'rgba(74,158,107,0.12)':'rgba(182,139,46,0.12)',color:sc.status==='Active'?'#4a9e6b':'#b68b2e'}}>{sc.status}</span>
                  </div>
                  <div style={{background:'#f5f3ef',borderRadius:8,padding:14,fontSize:13}}>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                      <div style={{color:'#6b635a'}}>Artwork value</div><div style={{textAlign:'right'}}>R {fmt(art?.recommendedPrice)}</div>
                      <div style={{color:'#6b635a'}}>Monthly fee</div><div style={{textAlign:'right',...S.gold}}>R {fmt(sc.monthlyAmount)}</div>
                      <div style={{color:'#6b635a'}}>Term</div><div style={{textAlign:'right'}}>{sc.termMonths} months</div>
                      <div style={{color:'#6b635a'}}>Months paid</div><div style={{textAlign:'right'}}>{sc.monthsPaid||0} of {sc.termMonths}</div>
                      <div style={{height:1,gridColumn:'1/-1',background:'rgba(182,139,46,0.15)',margin:'4px 0'}}/>
                      <div style={{color:'#6b635a'}}>Total paid</div><div style={{textAlign:'right',...S.green}}>R {fmt(paid)}</div>
                      <div style={{color:'#6b635a'}}>Remaining</div><div style={{textAlign:'right',color:balance>0?'#c45c4a':'#4a9e6b',fontWeight:600}}>R {fmt(Math.max(0,(sc.totalDue||0)-paid))}</div>
                    </div>
                    {sale&&(
                      <div style={{marginTop:10,paddingTop:10,borderTop:'1px solid rgba(74,158,107,0.2)'}}>
                        <div style={{fontSize:11,letterSpacing:1,textTransform:'uppercase',color:'#4a9e6b',marginBottom:6,display:'flex',alignItems:'center',gap:6}}>
                          {sale.source==='auction'?'⚖ Auction Sale':'Sale Settlement'}
                        </div>
                        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,fontSize:13}}>
                          <div style={{color:'#6b635a'}}>Source</div><div style={{textAlign:'right',fontSize:11,fontWeight:600,color:sale.source==='auction'?'#4a9e6b':'#b68b2e'}}>{sale.source==='auction'?'Auction':'Direct Sale'}</div>
                          <div style={{color:'#6b635a'}}>Sale date</div><div style={{textAlign:'right'}}>{sale.date||'—'}</div>
                          <div style={{color:'#6b635a'}}>Buyer</div><div style={{textAlign:'right'}}>{sale.buyerName||'—'}</div>
                          <div style={{color:'#6b635a'}}>Sale price</div><div style={{textAlign:'right'}}>R {fmt(sale.salePrice)}</div>
                          <div style={{color:'#2d7a4a',fontWeight:700}}>You receive</div><div style={{textAlign:'right',...S.green,fontSize:16}}>R {fmt(sale.colNet||sale.collectorShare)}</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            {/* Bank details reminder for receiving sale proceeds */}
            {collector&&(collector.bankName||collector.accountNumber)&&(
              <div style={{...S.card,padding:14,marginBottom:12,background:'rgba(74,158,107,0.04)',border:'1px solid rgba(74,158,107,0.2)'}}>
                <div style={{fontSize:11,letterSpacing:2,textTransform:'uppercase',color:'#4a9e6b',marginBottom:8}}>Your Bank Details on File</div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6,fontSize:12}}>
                  <div style={{color:'#6b635a'}}>Bank</div><div>{collector.bankName||'—'}</div>
                  <div style={{color:'#6b635a'}}>Account</div><div>{collector.accountNumber||'—'}</div>
                  <div style={{color:'#6b635a'}}>Branch</div><div>{collector.branchCode||'—'}</div>
                </div>
                <div style={{fontSize:11,color:'#8a8070',marginTop:8}}>Sale proceeds are paid to this account. Update in My Profile if needed.</div>
              </div>
            )}
            {schedules.length===0&&<div style={{...S.card,textAlign:'center',padding:40}}><div style={{fontSize:14,color:'#8a8070'}}>No agreements found.</div></div>}
          </div>
        )}
        {tab==='terms'&&(
          <div>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:24,color:'#1a1714',marginBottom:16}}>Display License Agreement</div>
            <div style={S.card}>
              <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,fontWeight:300,color:'#1a1714',marginBottom:4}}>Display License Agreement</div>
              <div style={{fontSize:12,color:'#8a8070',marginBottom:16}}>Vollard Black (Pty) Ltd · Hermanus, South Africa</div>
              {[
                ['1. License Fee','The display license fee is 50% of the declared artwork value, payable in monthly instalments over your agreed term. Fees are due on the 25th of each month. The payment window runs from the 25th to the 7th of the following month.'],
                ['2. On Sale','When your artwork sells: Vollard Black retains the outstanding license fee balance from the proceeds. You receive the remainder. Any surplus above the original value is split 50/50.'],
                ['3. Care of Artwork','You agree to display the artwork safely, not move it without consent, and notify Vollard Black immediately of any damage or theft.'],
                ['4. Ownership','Title remains with the artist/Vollard Black until the full license fee is paid and a sale is concluded.'],
                ['5. Cancellation','Either party may cancel with 30 days written notice. The artwork must be returned at your expense. Payments made are non-refundable.'],
                ['6. Governing Law','This agreement is governed by the laws of South Africa. Disputes are referred to the Western Cape High Court.'],
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
        {tab==='profile'&&profileForm&&(
          <div>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:24,color:'#1a1714',marginBottom:16}}>My Profile</div>
            {profileSaved&&<div style={{padding:'10px 14px',background:'rgba(74,158,107,0.08)',border:'1px solid rgba(74,158,107,0.2)',borderRadius:8,fontSize:13,color:'#4a9e6b',marginBottom:14}}>✓ Profile updated</div>}
            <div style={S.card}>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
                <div><label style={S.label}>First Name</label><input value={profileForm.firstName||''} onChange={e=>setProfileForm(p=>({...p,firstName:e.target.value}))} style={S.input}/></div>
                <div><label style={S.label}>Last Name</label><input value={profileForm.lastName||''} onChange={e=>setProfileForm(p=>({...p,lastName:e.target.value}))} style={S.input}/></div>
                <div><label style={S.label}>Mobile</label><input value={profileForm.mobile||''} onChange={e=>setProfileForm(p=>({...p,mobile:e.target.value}))} style={S.input}/></div>
                <div><label style={S.label}>ID / Passport</label><input value={profileForm.idNumber||''} onChange={e=>setProfileForm(p=>({...p,idNumber:e.target.value}))} style={S.input}/></div>
                <div><label style={S.label}>Nationality</label><input value={profileForm.nationality||''} onChange={e=>setProfileForm(p=>({...p,nationality:e.target.value}))} style={S.input}/></div>
                <div><label style={S.label}>City</label><input value={profileForm.city||''} onChange={e=>setProfileForm(p=>({...p,city:e.target.value}))} style={S.input}/></div>
                <div><label style={S.label}>Country</label><input value={profileForm.country||''} onChange={e=>setProfileForm(p=>({...p,country:e.target.value}))} style={S.input}/></div>
                <div style={{gridColumn:'1/-1'}}><label style={S.label}>Address</label><textarea value={profileForm.address||''} onChange={e=>setProfileForm(p=>({...p,address:e.target.value}))} style={{...S.input,minHeight:60,resize:'vertical'}}/></div>
                <div style={{gridColumn:'1/-1',paddingTop:14,borderTop:'1px solid rgba(182,139,46,0.15)',marginTop:6}}>
                  <div style={{fontSize:11,letterSpacing:2,textTransform:'uppercase',color:'#b68b2e',marginBottom:12}}>Bank Details — for sale proceeds</div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
                    <div><label style={S.label}>Bank Name</label><input value={profileForm.bankName||''} onChange={e=>setProfileForm(p=>({...p,bankName:e.target.value}))} style={S.input} placeholder="e.g. FNB"/></div>
                    <div><label style={S.label}>Account Holder</label><input value={profileForm.accountHolder||''} onChange={e=>setProfileForm(p=>({...p,accountHolder:e.target.value}))} style={S.input}/></div>
                    <div><label style={S.label}>Account Number</label><input value={profileForm.accountNumber||''} onChange={e=>setProfileForm(p=>({...p,accountNumber:e.target.value}))} style={S.input}/></div>
                    <div><label style={S.label}>Branch Code</label><input value={profileForm.branchCode||''} onChange={e=>setProfileForm(p=>({...p,branchCode:e.target.value}))} style={S.input} placeholder="e.g. 250655"/></div>
                  </div>
                </div>
                <div style={{gridColumn:'1/-1'}}><label style={S.label}>Email (cannot change)</label><input value={session.user.email} readOnly style={{...S.input,background:'#e8e4dd',color:'#8a8070'}}/></div>
              </div>
              <div style={{marginTop:16,display:'flex',justifyContent:'flex-end'}}>
                <button onClick={async()=>{if(!collector)return;setSavingProfile(true);await supabase.from('collectors').update({first_name:profileForm.firstName,last_name:profileForm.lastName,mobile:profileForm.mobile,id_number:profileForm.idNumber,nationality:profileForm.nationality,city:profileForm.city,country:profileForm.country,address:profileForm.address,bank_name:profileForm.bankName||'',account_holder:profileForm.accountHolder||'',account_number:profileForm.accountNumber||'',branch_code:profileForm.branchCode||''}).eq('id',collector.id);setSavingProfile(false);setProfileSaved(true);setTimeout(()=>setProfileSaved(false),3000);}} disabled={savingProfile} style={{padding:'12px 28px',borderRadius:8,border:'none',background:'linear-gradient(135deg,#b68b2e,#8a6a1e)',color:'#fff',cursor:'pointer',fontSize:13,fontWeight:600,fontFamily:"'DM Sans',sans-serif",opacity:savingProfile?0.6:1}}>{savingProfile?'Saving…':'Save Changes'}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Root ──────────────────────────────────────────────────
export default function RenterPortal() {
  const [session,setSession] = useState(undefined);
  const [screen,setScreen] = useState('login'); // login | register | pending
  const [pendingEmail,setPendingEmail] = useState('');
  const [approved,setApproved] = useState(null); // null=unknown, true, false

  useEffect(()=>{
    if(supabase)supabase.auth.getSession().then(({data})=>setSession(data?.session||null));else setSession(null);
    const {data:{subscription}} = supabase?supabase.auth.onAuthStateChange((_,s)=>setSession(s)):{data:{subscription:{unsubscribe:()=>{}}}};
    return ()=>subscription.unsubscribe();
  },[]);

  // When session exists, check approval status
  useEffect(()=>{
    if(!session){ setApproved(null); return; }
    supabase.from('portal_requests')
      .select('status')
      .eq('email', session.user.email)
      .eq('role', 'renter')
      .order('created_at', {ascending:false})
      .limit(1)
      .single()
      .then(({data})=>{ setApproved(data?.status==='approved'); });
  },[session]);

  if(session===undefined) return <div style={{minHeight:'100vh',background:'#f5f3ef',display:'flex',alignItems:'center',justifyContent:'center'}}><div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:24,letterSpacing:8,color:'#b68b2e',opacity:0.5}}>VOLLARD BLACK</div></div>;

  if(!session){
    if(screen==='register') return <KYCRegistration role="renter" supabase={supabase} onComplete={email=>{setPendingEmail(email);setScreen('pending');}} onSignIn={()=>setScreen('login')}/>;
    if(screen==='pending') return <PendingScreen email={pendingEmail} onSignIn={()=>setScreen('login')}/>;
    return <LoginScreen onLogin={s=>setSession(s)} onRegister={()=>setScreen('register')}/>;
  }

  if(approved===null) return <div style={{minHeight:'100vh',background:'#f5f3ef',display:'flex',alignItems:'center',justifyContent:'center'}}><div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:18,color:'#b68b2e',opacity:0.5}}>Checking access…</div></div>;
  if(!approved) return <NotApprovedScreen onSignOut={()=>supabase.auth.signOut()}/>;
  return <RenterDashboard session={session}/>;
}
