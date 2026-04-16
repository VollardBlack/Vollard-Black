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

const S = {
  page: { minHeight:'100vh', background:'#f5f3ef', fontFamily:"'DM Sans',sans-serif", color:'#2a2622' },
  header: { background:'#fff', borderBottom:'1px solid rgba(182,139,46,0.20)', padding:'16px 24px', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 },
  logo: { fontFamily:"'Cormorant Garamond',serif", fontSize:20, fontWeight:300, letterSpacing:6, color:'#1a1714' },
  card: { background:'#fff', border:'1px solid rgba(182,139,46,0.18)', borderRadius:12, padding:20, marginBottom:16 },
  label: { fontSize:10, letterSpacing:2, textTransform:'uppercase', color:'#8a8070', marginBottom:6 },
  gold: { color:'#b68b2e', fontWeight:600 },
  green: { color:'#4a9e6b', fontWeight:600 },
  input: { width:'100%', padding:'12px 14px', background:'#f5f3ef', border:'1px solid rgba(182,139,46,0.25)', borderRadius:8, color:'#1a1714', fontFamily:"'DM Sans',sans-serif", fontSize:14, outline:'none', boxSizing:'border-box' },
  btn: (gold) => ({ padding:'12px 24px', borderRadius:8, border: gold?'none':'1px solid rgba(182,139,46,0.30)', background: gold?'linear-gradient(135deg,#b68b2e,#8a6a1e)':'transparent', color: gold?'#fff':'#b68b2e', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }),
  tab: (active) => ({ padding:'10px 18px', border:'none', borderBottom: active?'2px solid #b68b2e':'2px solid transparent', background:'transparent', color: active?'#b68b2e':'#6b635a', fontSize:13, fontWeight: active?600:400, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }),
};

function Stat({label,value,gold,green}) {
  return (
    <div style={{...S.card, textAlign:'center', padding:'16px 12px'}}>
      <div style={S.label}>{label}</div>
      <div style={{fontFamily:"'Cormorant Garamond',serif", fontSize:28, fontWeight:400, color: gold?'#b68b2e':green?'#4a9e6b':'#1a1714'}}>{value}</div>
    </div>
  );
}

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
          <div style={{fontSize:10, letterSpacing:4, textTransform:'uppercase', color:'#8a8070', marginTop:6}}>Artist Portal</div>
          <div style={{width:40, height:1, background:'rgba(182,139,46,0.4)', margin:'20px auto 0'}}/>
        </div>
        <div style={{background:'#fff', border:'1px solid rgba(182,139,46,0.20)', borderRadius:16, padding:36, boxShadow:'0 8px 32px rgba(0,0,0,0.06)'}}>
          <div style={{fontFamily:"'Cormorant Garamond',serif", fontSize:22, color:'#1a1714', marginBottom:6}}>Sign in</div>
          <div style={{fontSize:12, color:'#8a8070', marginBottom:28}}>Your personal artist portal</div>
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
        <div style={{textAlign:'center', marginTop:24, fontSize:11, color:'#a09890'}}>Vollard Black (Pty) Ltd · Hermanus, South Africa</div>
      </div>
    </div>
  );
}

function ArtistDashboard({session}) {
  const [tab,setTab] = useState('overview');
  const [artist,setArtist] = useState(null);
  const [artworks,setArtworks] = useState([]);
  const [sales,setSales] = useState([]);
  const [auctions,setAuctions] = useState([]);
  const [loading,setLoading] = useState(true);

  useEffect(()=>{ loadData(); },[session]);

  const loadData = async() => {
    setLoading(true);
    try {
      const {data:arts} = await supabase.from('artists').select('*').eq('email', session.user.email);
      if(!arts||arts.length===0){ setLoading(false); return; }
      const a = toCamel(arts[0]);
      setArtist(a);

      const {data:works} = await supabase.from('artworks').select('*').eq('artist_id', a.id);
      const w = (works||[]).map(toCamel);
      setArtworks(w);

      const artworkIds = w.map(x=>x.id);
      if(artworkIds.length>0) {
        const {data:sls} = await supabase.from('sales').select('*').in('artwork_id', artworkIds);
        setSales((sls||[]).map(toCamel));
        const {data:aucs} = await supabase.from('auctions').select('*').in('artwork_id', artworkIds);
        setAuctions((aucs||[]).map(toCamel));
      }
    } catch(e){ console.error(e); }
    setLoading(false);
  };

  const signOut = () => supabase.auth.signOut();
  const totalSalesValue = sales.reduce((s,x)=>s+(x.salePrice||0),0);
  const artistShare = sales.reduce((s,x)=>s+(x.artistShare||0),0);
  const soldWorks = artworks.filter(a=>a.status==='Sold');
  const activeWorks = artworks.filter(a=>a.status==='Available'||a.status==='Reserved'||a.status==='In Gallery');

  if(loading) return <div style={{...S.page, display:'flex', alignItems:'center', justifyContent:'center'}}><div style={{fontFamily:"'Cormorant Garamond',serif", fontSize:24, color:'#b68b2e', letterSpacing:6, opacity:0.6}}>Loading…</div></div>;

  if(!artist) return (
    <div style={{...S.page, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:16}}>
      <div style={{fontFamily:"'Cormorant Garamond',serif", fontSize:22, color:'#1a1714'}}>No account found</div>
      <div style={{fontSize:14, color:'#8a8070'}}>No artist record found for {session.user.email}</div>
      <div style={{fontSize:13, color:'#8a8070'}}>Contact Vollard Black to have your account set up.</div>
      <button onClick={signOut} style={S.btn(false)}>Sign Out</button>
    </div>
  );

  return (
    <div style={S.page}>
      <div style={S.header}>
        <div>
          <div style={S.logo}>VOLLARD <span style={{color:'#b68b2e'}}>BLACK</span></div>
          <div style={{fontSize:10, letterSpacing:3, textTransform:'uppercase', color:'#8a8070', marginTop:2}}>Artist Portal</div>
        </div>
        <div style={{display:'flex', alignItems:'center', gap:12}}>
          <div style={{textAlign:'right'}}>
            <div style={{fontSize:13, fontWeight:500, color:'#1a1714'}}>{artist.name}</div>
            <div style={{fontSize:11, color:'#8a8070'}}>{session.user.email}</div>
          </div>
          <button onClick={signOut} style={{...S.btn(false), padding:'8px 16px', fontSize:12}}>Sign Out</button>
        </div>
      </div>

      <div style={{maxWidth:900, margin:'0 auto', padding:'24px 16px'}}>
        <div style={{display:'flex', borderBottom:'1px solid rgba(182,139,46,0.15)', marginBottom:24, gap:4, overflowX:'auto'}}>
          {[['overview','Overview'],['works','My Works'],['sales','Sales'],['auctions','Auctions']].map(([id,lbl])=>(
            <button key={id} onClick={()=>setTab(id)} style={S.tab(tab===id)}>{lbl}</button>
          ))}
        </div>

        {tab==='overview' && (
          <div>
            <div style={{display:'flex', gap:16, alignItems:'flex-start', flexWrap:'wrap', marginBottom:24}}>
              {artist.profileImageUrl && <div style={{width:80, height:80, borderRadius:'50%', overflow:'hidden', border:'2px solid rgba(182,139,46,0.3)'}}><img src={artist.profileImageUrl} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/></div>}
              <div>
                <div style={{fontFamily:"'Cormorant Garamond',serif", fontSize:32, fontWeight:300, color:'#1a1714'}}>{artist.name}</div>
                <div style={{fontSize:13, color:'#8a8070'}}>{artist.medium||'—'} · {artist.style||'—'}</div>
                {artist.bio && <div style={{fontSize:13, color:'#6b635a', marginTop:8, maxWidth:500, fontStyle:'italic'}}>{artist.bio}</div>}
              </div>
            </div>
            <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))', gap:12, marginBottom:24}}>
              <Stat label="Works Listed" value={artworks.length} gold/>
              <Stat label="Active" value={activeWorks.length} green/>
              <Stat label="Sold" value={soldWorks.length}/>
              <Stat label="Total Sales" value={'R '+fmt(totalSalesValue)} green/>
              {artistShare>0 && <Stat label="Your Share" value={'R '+fmt(artistShare)} gold/>}
            </div>
            {artist.website && <div style={S.card}><div style={S.label}>Website</div><a href={artist.website} target="_blank" rel="noreferrer" style={{color:'#b68b2e', fontSize:13}}>{artist.website}</a></div>}
            {artist.instagram && <div style={S.card}><div style={S.label}>Instagram</div><a href={'https://instagram.com/'+artist.instagram.replace('@','')} target="_blank" rel="noreferrer" style={{color:'#b68b2e', fontSize:13}}>@{artist.instagram.replace('@','')}</a></div>}
          </div>
        )}

        {tab==='works' && (
          <div>
            <div style={{fontFamily:"'Cormorant Garamond',serif", fontSize:24, color:'#1a1714', marginBottom:20}}>My Works</div>
            {artworks.length===0 ? (
              <div style={{...S.card, textAlign:'center', padding:40}}><div style={{fontSize:14, color:'#8a8070'}}>No works listed yet.</div></div>
            ) : artworks.map(art=>(
              <div key={art.id} style={S.card}>
                <div style={{display:'flex', gap:16, alignItems:'flex-start', flexWrap:'wrap'}}>
                  {art.imageUrl && <div style={{width:100, height:100, borderRadius:8, overflow:'hidden', flexShrink:0, border:'1px solid rgba(182,139,46,0.2)'}}><img src={art.imageUrl} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/></div>}
                  <div style={{flex:1, minWidth:180}}>
                    <div style={{fontFamily:"'Cormorant Garamond',serif", fontSize:20, color:'#1a1714', marginBottom:4}}>{art.title}</div>
                    <div style={{fontSize:12, color:'#8a8070', marginBottom:10}}>{art.medium||'—'} · {art.dimensions||'—'} · {art.year||'—'}</div>
                    <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, fontSize:13}}>
                      <div><span style={{color:'#8a8070'}}>Value: </span><span style={S.gold}>R {fmt(art.recommendedPrice)}</span></div>
                      <div><span style={{color:'#8a8070'}}>Gallery: </span><span>{art.galleryName||'—'}</span></div>
                      <div><span style={{color:'#8a8070'}}>Status: </span><span style={{fontWeight:600, color:art.status==='Sold'?'#648cc8':art.status==='Available'?'#4a9e6b':'#b68b2e'}}>{art.status}</span></div>
                    </div>
                    {art.description && <div style={{fontSize:12, color:'#6b635a', marginTop:8, fontStyle:'italic'}}>{art.description}</div>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab==='sales' && (
          <div>
            <div style={{fontFamily:"'Cormorant Garamond',serif", fontSize:24, color:'#1a1714', marginBottom:20}}>Sales</div>
            <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))', gap:12, marginBottom:24}}>
              <Stat label="Total Sales" value={sales.length}/>
              <Stat label="Total Value" value={'R '+fmt(totalSalesValue)} gold/>
              <Stat label="Your Share" value={'R '+fmt(artistShare)} green/>
            </div>
            {sales.length===0 ? (
              <div style={{...S.card, textAlign:'center', padding:40}}><div style={{fontSize:14, color:'#8a8070'}}>No sales recorded yet.</div></div>
            ) : sales.map(sale=>(
              <div key={sale.id} style={S.card}>
                <div style={{display:'flex', justifyContent:'space-between', flexWrap:'wrap', gap:8}}>
                  <div>
                    <div style={{fontFamily:"'Cormorant Garamond',serif", fontSize:18, color:'#1a1714', marginBottom:4}}>{sale.artworkTitle}</div>
                    <div style={{fontSize:12, color:'#8a8070'}}>{sale.date||sale.createdAt?.slice(0,10)||'—'}</div>
                  </div>
                  <div style={{textAlign:'right'}}>
                    <div style={{fontSize:12, color:'#8a8070'}}>Sale price</div>
                    <div style={{...S.gold, fontSize:18, fontFamily:"'Cormorant Garamond',serif"}}>R {fmt(sale.salePrice)}</div>
                  </div>
                </div>
                {sale.artistShare>0 && (
                  <div style={{marginTop:12, padding:12, background:'rgba(74,158,107,0.06)', border:'1px solid rgba(74,158,107,0.15)', borderRadius:8, fontSize:13, display:'flex', justifyContent:'space-between'}}>
                    <span style={{color:'#6b635a'}}>Your share from this sale</span>
                    <span style={S.green}>R {fmt(sale.artistShare)}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {tab==='auctions' && (
          <div>
            <div style={{fontFamily:"'Cormorant Garamond',serif", fontSize:24, color:'#1a1714', marginBottom:20}}>Auction History</div>
            {auctions.length===0 ? (
              <div style={{...S.card, textAlign:'center', padding:40}}><div style={{fontSize:14, color:'#8a8070'}}>No auctions yet.</div></div>
            ) : auctions.map(auc=>(
              <div key={auc.id} style={S.card}>
                <div style={{display:'flex', justifyContent:'space-between', flexWrap:'wrap', gap:8, marginBottom:10}}>
                  <div>
                    <div style={{fontFamily:"'Cormorant Garamond',serif", fontSize:18, color:'#1a1714'}}>{auc.title}</div>
                    <div style={{fontSize:12, color:'#8a8070', marginTop:2}}>{auc.galleryName||'—'}</div>
                  </div>
                  <span style={{padding:'4px 12px', borderRadius:6, fontSize:11, fontWeight:600, background:auc.status==='Sold'?'rgba(74,158,107,0.12)':auc.status==='Live'?'rgba(196,92,74,0.12)':'rgba(182,139,46,0.12)', color:auc.status==='Sold'?'#4a9e6b':auc.status==='Live'?'#c45c4a':'#b68b2e'}}>{auc.status}</span>
                </div>
                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, fontSize:13}}>
                  <div><span style={{color:'#8a8070'}}>Reserve: </span><span>R {fmt(auc.reservePrice)}</span></div>
                  <div><span style={{color:'#8a8070'}}>Final bid: </span><span style={S.gold}>R {fmt(auc.currentBid||0)}</span></div>
                  <div><span style={{color:'#8a8070'}}>Bids: </span><span>{auc.bidsCount||0}</span></div>
                  <div><span style={{color:'#8a8070'}}>Closed: </span><span>{auc.closedAt?.slice(0,10)||'—'}</span></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ArtistPortal() {
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
  return <ArtistDashboard session={session}/>;
}
