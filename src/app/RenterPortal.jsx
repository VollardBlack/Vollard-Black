'use client';
import { useState, useEffect } from "react";
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  { auth: { autoRefreshToken: true, persistSession: true } }
);

const fmt = (n) => Number(n||0).toLocaleString('en-ZA',{minimumFractionDigits:2,maximumFractionDigits:2});
const toCamel = (obj) => {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return obj;
  const out = {};
  for (const [k, v] of Object.entries(obj))
    out[k.replace(/_([a-z])/g, (_, c) => c.toUpperCase())] = v;
  return out;
};

// ── Styles ──────────────────────────────────────────────
const S = {
  page: { minHeight:'100vh', background:'#f5f3ef', fontFamily:"'DM Sans',sans-serif", color:'#2a2622' },
  header: { background:'#fff', borderBottom:'1px solid rgba(182,139,46,0.20)', padding:'16px 24px', display:'flex', alignItems:'center', justifyContent:'space-between' },
  logo: { fontFamily:"'Cormorant Garamond',serif", fontSize:20, fontWeight:300, letterSpacing:6, color:'#1a1714' },
  card: { background:'#fff', border:'1px solid rgba(182,139,46,0.18)', borderRadius:12, padding:20, marginBottom:16 },
  label: { fontSize:10, letterSpacing:2, textTransform:'uppercase', color:'#8a8070', marginBottom:6 },
  gold: { color:'#b68b2e', fontWeight:600 },
  green: { color:'#4a9e6b', fontWeight:600 },
  red: { color:'#c45c4a', fontWeight:600 },
  input: { width:'100%', padding:'12px 14px', background:'#f5f3ef', border:'1px solid rgba(182,139,46,0.25)', borderRadius:8, color:'#1a1714', fontFamily:"'DM Sans',sans-serif", fontSize:14, outline:'none', boxSizing:'border-box' },
  btn: (gold) => ({ padding:'12px 24px', borderRadius:8, border: gold ? 'none' : '1px solid rgba(182,139,46,0.30)', background: gold ? 'linear-gradient(135deg,#b68b2e,#8a6a1e)' : 'transparent', color: gold ? '#fff' : '#b68b2e', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }),
  tab: (active) => ({ padding:'10px 18px', border:'none', borderBottom: active ? '2px solid #b68b2e' : '2px solid transparent', background:'transparent', color: active ? '#b68b2e' : '#6b635a', fontSize:13, fontWeight: active ? 600 : 400, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }),
};

function Stat({label,value,gold,green}) {
  return (
    <div style={{...S.card, textAlign:'center', padding:'16px 12px'}}>
      <div style={S.label}>{label}</div>
      <div style={{fontFamily:"'Cormorant Garamond',serif", fontSize:28, fontWeight:400, color: gold ? '#b68b2e' : green ? '#4a9e6b' : '#1a1714'}}>{value}</div>
    </div>
  );
}

// ── Login Screen ─────────────────────────────────────────
function LoginScreen({onLogin}) {
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
        <div style={{textAlign:'center', marginBottom:48}}>
          <div style={{fontFamily:"'Cormorant Garamond',serif", fontSize:36, fontWeight:300, letterSpacing:10, color:'#1a1714'}}>
            VOLLARD <span style={{color:'#b68b2e'}}>BLACK</span>
          </div>
          <div style={{fontSize:10, letterSpacing:4, textTransform:'uppercase', color:'#8a8070', marginTop:6}}>
            Renter Portal
          </div>
          <div style={{width:40, height:1, background:'rgba(182,139,46,0.4)', margin:'20px auto 0'}}/>
        </div>
        <div style={{background:'#fff', border:'1px solid rgba(182,139,46,0.20)', borderRadius:16, padding:36, boxShadow:'0 8px 32px rgba(0,0,0,0.06)'}}>
          <div style={{fontFamily:"'Cormorant Garamond',serif", fontSize:22, color:'#1a1714', marginBottom:6}}>Sign in</div>
          <div style={{fontSize:12, color:'#8a8070', marginBottom:28}}>Your personal display agreement portal</div>
          <form onSubmit={handleLogin}>
            <div style={{marginBottom:16}}>
              <label style={{display:'block', ...S.label, marginBottom:6}}>Email</label>
              <input type="email" value={email} onChange={e=>{setEmail(e.target.value);setError('');}} style={S.input} placeholder="your@email.com" autoComplete="email"/>
            </div>
            <div style={{marginBottom:24}}>
              <label style={{display:'block', ...S.label, marginBottom:6}}>Password</label>
              <div style={{position:'relative'}}>
                <input type={showPw?'text':'password'} value={password} onChange={e=>{setPassword(e.target.value);setError('');}} style={{...S.input, paddingRight:56}} autoComplete="current-password"/>
                <button type="button" onClick={()=>setShowPw(p=>!p)} style={{position:'absolute',right:12,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',color:'#8a8070',cursor:'pointer',fontSize:12}}>{showPw?'Hide':'Show'}</button>
              </div>
            </div>
            {error && <div style={{padding:'10px 14px',background:'rgba(196,92,74,0.08)',border:'1px solid rgba(196,92,74,0.2)',borderRadius:8,fontSize:13,color:'#c45c4a',marginBottom:16}}>{error}</div>}
            <button type="submit" disabled={loading} style={{...S.btn(true), width:'100%', padding:14, letterSpacing:1, textTransform:'uppercase', opacity:loading?0.6:1}}>
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        </div>
        <div style={{textAlign:'center', marginTop:24, fontSize:11, color:'#a09890'}}>
          Vollard Black (Pty) Ltd · Hermanus, South Africa
        </div>
      </div>
    </div>
  );
}

// ── Main Portal ──────────────────────────────────────────
function RenterDashboard({session}) {
  const [tab,setTab] = useState('overview');
  const [collector,setCollector] = useState(null);
  const [schedules,setSchedules] = useState([]);
  const [payments,setPayments] = useState([]);
  const [artworks,setArtworks] = useState([]);
  const [sales,setSales] = useState([]);
  const [loading,setLoading] = useState(true);

  useEffect(()=>{
    loadData();
  },[session]);

  const loadData = async() => {
    setLoading(true);
    try {
      // Load collector by email
      const {data:cols} = await supabase.from('collectors').select('*').eq('email', session.user.email);
      if(!cols||cols.length===0){ setLoading(false); return; }
      const col = toCamel(cols[0]);
      setCollector(col);

      // Load schedules for this collector
      const {data:scheds} = await supabase.from('schedules').select('*').eq('collector_id', col.id);
      const s = (scheds||[]).map(toCamel);
      setSchedules(s);

      // Load payments
      const {data:pays} = await supabase.from('payments').select('*').eq('collector_id', col.id).order('created_at',{ascending:false});
      setPayments((pays||[]).map(toCamel));

      // Load artworks
      const artworkIds = s.map(sc=>sc.artworkId).filter(Boolean);
      if(artworkIds.length>0) {
        const {data:arts} = await supabase.from('artworks').select('*').in('id', artworkIds);
        setArtworks((arts||[]).map(toCamel));
      }

      // Load sales for this collector
      const {data:sls} = await supabase.from('sales').select('*').eq('collector_id', col.id);
      setSales((sls||[]).map(toCamel));

    } catch(e) { console.error(e); }
    setLoading(false);
  };

  const signOut = () => supabase.auth.signOut();
  const gn = (c) => c ? (c.type==='company' ? c.companyName : `${c.firstName||''} ${c.lastName||''}`.trim()) : '';
  const totalPaid = payments.reduce((s,p)=>s+(p.amount||0),0);
  const totalOwed = schedules.reduce((s,sc)=>s+(sc.totalDue||0),0);
  const balance = totalOwed - totalPaid;
  const activeScheds = schedules.filter(s=>s.status==='Active');

  if(loading) return (
    <div style={{...S.page, display:'flex', alignItems:'center', justifyContent:'center'}}>
      <div style={{fontFamily:"'Cormorant Garamond',serif", fontSize:24, color:'#b68b2e', letterSpacing:6, opacity:0.6}}>Loading…</div>
    </div>
  );

  if(!collector) return (
    <div style={{...S.page, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:16}}>
      <div style={{fontFamily:"'Cormorant Garamond',serif", fontSize:22, color:'#1a1714'}}>No account found</div>
      <div style={{fontSize:14, color:'#8a8070'}}>No renter record found for {session.user.email}</div>
      <div style={{fontSize:13, color:'#8a8070'}}>Contact Vollard Black to have your account linked.</div>
      <button onClick={signOut} style={S.btn(false)}>Sign Out</button>
    </div>
  );

  return (
    <div style={S.page}>
      {/* Header */}
      <div style={S.header}>
        <div>
          <div style={S.logo}>VOLLARD <span style={{color:'#b68b2e'}}>BLACK</span></div>
          <div style={{fontSize:10, letterSpacing:3, textTransform:'uppercase', color:'#8a8070', marginTop:2}}>Renter Portal</div>
        </div>
        <div style={{display:'flex', alignItems:'center', gap:12}}>
          <div style={{textAlign:'right'}}>
            <div style={{fontSize:13, fontWeight:500, color:'#1a1714'}}>{gn(collector)}</div>
            <div style={{fontSize:11, color:'#8a8070'}}>{session.user.email}</div>
          </div>
          <button onClick={signOut} style={{...S.btn(false), padding:'8px 16px', fontSize:12}}>Sign Out</button>
        </div>
      </div>

      {/* Content */}
      <div style={{maxWidth:900, margin:'0 auto', padding:'24px 16px'}}>

        {/* Tabs */}
        <div style={{display:'flex', borderBottom:'1px solid rgba(182,139,46,0.15)', marginBottom:24, gap:4, overflowX:'auto'}}>
          {[['overview','Overview'],['artworks','My Artworks'],['payments','Payment History'],['statements','Statements']].map(([id,lbl])=>(
            <button key={id} onClick={()=>setTab(id)} style={S.tab(tab===id)}>{lbl}</button>
          ))}
        </div>

        {/* Overview Tab */}
        {tab==='overview' && (
          <div>
            <div style={{fontFamily:"'Cormorant Garamond',serif", fontSize:28, fontWeight:300, color:'#1a1714', marginBottom:4}}>
              Welcome, {gn(collector)}
            </div>
            <div style={{fontSize:13, color:'#8a8070', marginBottom:24}}>
              Your Vollard Black display agreement overview
            </div>

            {/* Stats */}
            <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))', gap:12, marginBottom:24}}>
              <Stat label="Artworks on Display" value={activeScheds.length} gold/>
              <Stat label="Total Paid" value={'R '+fmt(totalPaid)} green/>
              <Stat label="Balance Due" value={'R '+fmt(Math.max(0,balance))} gold={balance<=0} red={balance>0}/>
              <Stat label="Sales" value={sales.length} green/>
            </div>

            {/* Active agreements */}
            {activeScheds.map(sc=>{
              const art = artworks.find(a=>a.id===sc.artworkId);
              const paid = payments.filter(p=>p.artworkId===sc.artworkId).reduce((s,p)=>s+(p.amount||0),0);
              const pct = sc.termMonths>0 ? Math.min(100,Math.round((sc.monthsPaid||0)/sc.termMonths*100)) : 0;
              return (
                <div key={sc.id} style={S.card}>
                  <div style={{display:'flex', gap:14, alignItems:'flex-start'}}>
                    {art?.imageUrl && <div style={{width:64, height:64, borderRadius:8, overflow:'hidden', flexShrink:0, border:'1px solid rgba(182,139,46,0.2)'}}><img src={art.imageUrl} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/></div>}
                    <div style={{flex:1}}>
                      <div style={{fontFamily:"'Cormorant Garamond',serif", fontSize:18, color:'#1a1714', marginBottom:2}}>{sc.artworkTitle||art?.title||'—'}</div>
                      <div style={{fontSize:12, color:'#8a8070', marginBottom:12}}>{art?.artist||'—'} · {sc.galleryName||art?.galleryName||'—'}</div>
                      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, fontSize:13, marginBottom:12}}>
                        <div><span style={{color:'#8a8070'}}>Monthly fee: </span><span style={S.gold}>R {fmt(sc.monthlyAmount)}</span></div>
                        <div><span style={{color:'#8a8070'}}>Term: </span><span>{sc.monthsPaid||0} of {sc.termMonths} months</span></div>
                        <div><span style={{color:'#8a8070'}}>Total paid: </span><span style={S.green}>R {fmt(paid)}</span></div>
                        <div><span style={{color:'#8a8070'}}>Status: </span><span style={{color:sc.status==='Active'?'#4a9e6b':sc.status==='Chasing'?'#e6be32':'#c45c4a', fontWeight:600}}>{sc.status}</span></div>
                      </div>
                      {/* Progress bar */}
                      <div style={{height:4, background:'rgba(182,139,46,0.15)', borderRadius:2}}>
                        <div style={{height:'100%', width:pct+'%', background:'linear-gradient(90deg,#b68b2e,#4a9e6b)', borderRadius:2, transition:'width 0.3s'}}/>
                      </div>
                      <div style={{fontSize:10, color:'#8a8070', marginTop:4}}>{pct}% complete</div>
                    </div>
                  </div>
                </div>
              );
            })}

            {activeScheds.length===0 && (
              <div style={{...S.card, textAlign:'center', padding:40}}>
                <div style={{fontSize:32, marginBottom:12}}>◆</div>
                <div style={{fontSize:14, color:'#8a8070'}}>No active display agreements yet.</div>
              </div>
            )}
          </div>
        )}

        {/* Artworks Tab */}
        {tab==='artworks' && (
          <div>
            <div style={{fontFamily:"'Cormorant Garamond',serif", fontSize:24, color:'#1a1714', marginBottom:20}}>My Artworks</div>
            {artworks.length===0 ? (
              <div style={{...S.card, textAlign:'center', padding:40}}>
                <div style={{fontSize:14, color:'#8a8070'}}>No artworks linked yet.</div>
              </div>
            ) : artworks.map(art=>{
              const sc = schedules.find(s=>s.artworkId===art.id);
              return (
                <div key={art.id} style={S.card}>
                  <div style={{display:'flex', gap:16, alignItems:'flex-start', flexWrap:'wrap'}}>
                    {art.imageUrl && <div style={{width:120, height:120, borderRadius:10, overflow:'hidden', flexShrink:0, border:'1px solid rgba(182,139,46,0.2)'}}><img src={art.imageUrl} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/></div>}
                    <div style={{flex:1, minWidth:200}}>
                      <div style={{fontFamily:"'Cormorant Garamond',serif", fontSize:22, color:'#1a1714', marginBottom:4}}>{art.title}</div>
                      <div style={{fontSize:13, color:'#8a8070', marginBottom:12}}>{art.artist} · {art.medium||'—'} · {art.year||'—'}</div>
                      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, fontSize:13}}>
                        <div><span style={{color:'#8a8070'}}>Declared value: </span><span style={S.gold}>R {fmt(art.recommendedPrice)}</span></div>
                        <div><span style={{color:'#8a8070'}}>Gallery: </span><span>{art.galleryName||'—'}</span></div>
                        <div><span style={{color:'#8a8070'}}>Status: </span><span style={{fontWeight:600, color:art.status==='Available'?'#4a9e6b':art.status==='Sold'?'#648cc8':'#b68b2e'}}>{art.status}</span></div>
                        {sc && <div><span style={{color:'#8a8070'}}>Agreement: </span><span>{sc.status}</span></div>}
                      </div>
                      {art.description && <div style={{fontSize:12, color:'#6b635a', marginTop:10, fontStyle:'italic'}}>{art.description}</div>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Payments Tab */}
        {tab==='payments' && (
          <div>
            <div style={{fontFamily:"'Cormorant Garamond',serif", fontSize:24, color:'#1a1714', marginBottom:20}}>Payment History</div>
            <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))', gap:12, marginBottom:24}}>
              <Stat label="Total Paid" value={'R '+fmt(totalPaid)} green/>
              <Stat label="Payments" value={payments.length}/>
              <Stat label="Balance" value={'R '+fmt(Math.max(0,balance))} gold/>
            </div>
            {payments.length===0 ? (
              <div style={{...S.card, textAlign:'center', padding:40}}>
                <div style={{fontSize:14, color:'#8a8070'}}>No payments recorded yet.</div>
              </div>
            ) : (
              <div style={S.card}>
                <div style={{overflowX:'auto'}}>
                  <table style={{width:'100%', borderCollapse:'collapse', fontSize:13}}>
                    <thead>
                      <tr style={{borderBottom:'1px solid rgba(182,139,46,0.2)'}}>
                        {['Date','Artwork','Month','Method','Amount'].map(h=>(
                          <th key={h} style={{padding:'8px 12px', textAlign:h==='Amount'?'right':'left', fontSize:10, letterSpacing:1, textTransform:'uppercase', color:'#8a8070', fontWeight:500}}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map(p=>(
                        <tr key={p.id} style={{borderBottom:'1px solid rgba(182,139,46,0.08)'}}>
                          <td style={{padding:'10px 12px', color:'#6b635a'}}>{p.date||p.createdAt?.slice(0,10)||'—'}</td>
                          <td style={{padding:'10px 12px', fontWeight:500}}>{p.artworkTitle||'—'}</td>
                          <td style={{padding:'10px 12px', color:'#8a8070'}}>Mo {p.monthNumber||'—'}</td>
                          <td style={{padding:'10px 12px', color:'#8a8070'}}>{p.method||'—'}</td>
                          <td style={{padding:'10px 12px', textAlign:'right', ...S.gold}}>R {fmt(p.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr style={{borderTop:'2px solid rgba(182,139,46,0.2)'}}>
                        <td colSpan={4} style={{padding:'10px 12px', fontWeight:600}}>Total</td>
                        <td style={{padding:'10px 12px', textAlign:'right', ...S.green}}>R {fmt(totalPaid)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Statements Tab */}
        {tab==='statements' && (
          <div>
            <div style={{fontFamily:"'Cormorant Garamond',serif", fontSize:24, color:'#1a1714', marginBottom:20}}>Statements</div>
            {schedules.map(sc=>{
              const art = artworks.find(a=>a.id===sc.artworkId);
              const scPays = payments.filter(p=>p.artworkId===sc.artworkId);
              const paid = scPays.reduce((s,p)=>s+(p.amount||0),0);
              const sale = sales.find(s=>s.artworkId===sc.artworkId);
              return (
                <div key={sc.id} style={S.card}>
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:8, marginBottom:16}}>
                    <div>
                      <div style={{fontFamily:"'Cormorant Garamond',serif", fontSize:20, color:'#1a1714'}}>{sc.artworkTitle||art?.title}</div>
                      <div style={{fontSize:12, color:'#8a8070', marginTop:2}}>
                        {sc.acquisitionModel} · Started {sc.startDate||'—'}
                      </div>
                    </div>
                    <span style={{padding:'4px 12px', borderRadius:6, fontSize:11, fontWeight:600, background:sc.status==='Active'?'rgba(74,158,107,0.12)':sc.status==='Complete'?'rgba(100,140,200,0.12)':'rgba(182,139,46,0.12)', color:sc.status==='Active'?'#4a9e6b':sc.status==='Complete'?'#648cc8':'#b68b2e'}}>
                      {sc.status}
                    </span>
                  </div>
                  <div style={{background:'#f5f3ef', borderRadius:8, padding:14, fontSize:13}}>
                    <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8}}>
                      <div style={{color:'#6b635a'}}>Artwork value</div><div style={{textAlign:'right'}}>R {fmt(art?.recommendedPrice)}</div>
                      <div style={{color:'#6b635a'}}>Monthly fee</div><div style={{textAlign:'right', ...S.gold}}>R {fmt(sc.monthlyAmount)}</div>
                      <div style={{color:'#6b635a'}}>Term</div><div style={{textAlign:'right'}}>{sc.termMonths} months</div>
                      <div style={{color:'#6b635a'}}>Months paid</div><div style={{textAlign:'right'}}>{sc.monthsPaid||0} of {sc.termMonths}</div>
                      <div style={{height:1, gridColumn:'1/-1', background:'rgba(182,139,46,0.15)', margin:'4px 0'}}/>
                      <div style={{color:'#6b635a'}}>Total paid to date</div><div style={{textAlign:'right', ...S.green}}>R {fmt(paid)}</div>
                      <div style={{color:'#6b635a'}}>Remaining balance</div><div style={{textAlign:'right', color:balance>0?'#c45c4a':'#4a9e6b', fontWeight:600}}>R {fmt(Math.max(0,(sc.totalDue||0)-paid))}</div>
                    </div>
                    {sale && (
                      <div style={{marginTop:12, paddingTop:12, borderTop:'1px solid rgba(74,158,107,0.2)'}}>
                        <div style={{fontSize:11, letterSpacing:1, textTransform:'uppercase', color:'#4a9e6b', marginBottom:8}}>Sale Settlement</div>
                        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8}}>
                          <div style={{color:'#6b635a'}}>Sale price</div><div style={{textAlign:'right'}}>R {fmt(sale.salePrice)}</div>
                          <div style={{color:'#6b635a', fontWeight:600}}>You receive</div><div style={{textAlign:'right', ...S.green}}>R {fmt(sale.colNet||sale.collectorShare)}</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            {schedules.length===0 && (
              <div style={{...S.card, textAlign:'center', padding:40}}>
                <div style={{fontSize:14, color:'#8a8070'}}>No agreements found.</div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

export default function RenterPortal() {
  const [session,setSession] = useState(undefined);

  useEffect(()=>{
    supabase.auth.getSession().then(({data})=>setSession(data?.session||null));
    const {data:{subscription}} = supabase.auth.onAuthStateChange((_,s)=>setSession(s));
    return ()=>subscription.unsubscribe();
  },[]);

  if(session===undefined) return (
    <div style={{minHeight:'100vh', background:'#f5f3ef', display:'flex', alignItems:'center', justifyContent:'center'}}>
      <div style={{fontFamily:"'Cormorant Garamond',serif", fontSize:24, letterSpacing:8, color:'#b68b2e', opacity:0.5}}>VOLLARD BLACK</div>
    </div>
  );

  if(!session) return <LoginScreen onLogin={s=>setSession(s)}/>;
  return <RenterDashboard session={session}/>;
}
