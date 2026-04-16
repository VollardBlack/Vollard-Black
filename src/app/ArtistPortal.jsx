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
  card: { background:'#fff', border:'1px solid rgba(182,139,46,0.18)', borderRadius:12, padding:20, marginBottom:16 },
  input: { width:'100%', padding:'12px 14px', background:'#f5f3ef', border:'1px solid rgba(182,139,46,0.25)', borderRadius:8, color:'#1a1714', fontFamily:"'DM Sans',sans-serif", fontSize:14, outline:'none', boxSizing:'border-box' },
  label: { display:'block', fontSize:10, fontWeight:500, letterSpacing:2, textTransform:'uppercase', color:'#6b635a', marginBottom:6 },
  btn: (gold) => ({ width:'100%', padding:14, borderRadius:8, border: gold?'none':'1px solid rgba(182,139,46,0.30)', background: gold?'linear-gradient(135deg,#b68b2e,#8a6a1e)':'transparent', color: gold?'#fff':'#b68b2e', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }),
  tab: (a) => ({ padding:'10px 18px', border:'none', borderBottom: a?'2px solid #b68b2e':'2px solid transparent', background:'transparent', color: a?'#b68b2e':'#6b635a', fontSize:13, fontWeight:a?600:400, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }),
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

// ── Registration ──────────────────────────────────────────
function RegisterScreen({onRegistered}) {
  const [form,setForm] = useState({fullName:'',email:'',mobile:'',medium:'',instagram:'',password:'',confirm:'',message:''});
  const [loading,setLoading] = useState(false);
  const [error,setError] = useState('');
  const [showPw,setShowPw] = useState(false);
  const s = (k,v) => setForm(p=>({...p,[k]:v}));

  const handleRegister = async(e) => {
    e.preventDefault();
    if(!form.fullName||!form.email||!form.password) return setError('Please fill in all required fields.');
    if(form.password.length<8) return setError('Password must be at least 8 characters.');
    if(form.password!==form.confirm) return setError('Passwords do not match.');
    setLoading(true); setError('');
    try {
      const {data:authData, error:authErr} = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
      });
      if(authErr) throw authErr;
      await supabase.from('portal_requests').insert({
        id: authData.user?.id,
        email: form.email,
        full_name: form.fullName,
        mobile: form.mobile,
        role: 'artist',
        message: [form.medium&&'Medium: '+form.medium, form.instagram&&'Instagram: '+form.instagram, form.message].filter(Boolean).join(' | '),
        status: 'pending',
      });
      onRegistered(form.email);
    } catch(e) {
      setError(e.message||'Registration failed. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div style={{...S.page, display:'flex', alignItems:'center', justifyContent:'center', padding:20}}>
      <div style={{width:'100%', maxWidth:440}}>
        <Logo sub="Artist Portal"/>
        <div style={{...S.card, padding:32, boxShadow:'0 8px 32px rgba(0,0,0,0.06)'}}>
          <div style={{fontFamily:"'Cormorant Garamond',serif", fontSize:22, color:'#1a1714', marginBottom:4}}>Request Access</div>
          <div style={{fontSize:12, color:'#8a8070', marginBottom:24}}>Complete the form below. Vollard Black will review and approve your request.</div>
          <form onSubmit={handleRegister}>
            <div style={{marginBottom:14}}>
              <label style={S.label}>Full Name *</label>
              <input value={form.fullName} onChange={e=>s('fullName',e.target.value)} style={S.input} placeholder="Your full name"/>
            </div>
            <div style={{marginBottom:14}}>
              <label style={S.label}>Email *</label>
              <input type="email" value={form.email} onChange={e=>s('email',e.target.value)} style={S.input} placeholder="your@email.com" autoComplete="email"/>
            </div>
            <div style={{marginBottom:14}}>
              <label style={S.label}>Mobile</label>
              <input value={form.mobile} onChange={e=>s('mobile',e.target.value)} style={S.input} placeholder="+27 82 000 0000"/>
            </div>
            <div style={{marginBottom:14}}>
              <label style={S.label}>Primary Medium</label>
              <input value={form.medium} onChange={e=>s('medium',e.target.value)} style={S.input} placeholder="e.g. Oil on Canvas"/>
            </div>
            <div style={{marginBottom:14}}>
              <label style={S.label}>Instagram Handle</label>
              <input value={form.instagram} onChange={e=>s('instagram',e.target.value)} style={S.input} placeholder="@yourhandle"/>
            </div>
            <div style={{marginBottom:14}}>
              <label style={S.label}>Password * (min 8 characters)</label>
              <div style={{position:'relative'}}>
                <input type={showPw?'text':'password'} value={form.password} onChange={e=>s('password',e.target.value)} style={{...S.input,paddingRight:56}} autoComplete="new-password"/>
                <button type="button" onClick={()=>setShowPw(p=>!p)} style={{position:'absolute',right:12,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',color:'#8a8070',cursor:'pointer',fontSize:12}}>{showPw?'Hide':'Show'}</button>
              </div>
            </div>
            <div style={{marginBottom:14}}>
              <label style={S.label}>Confirm Password *</label>
              <input type="password" value={form.confirm} onChange={e=>s('confirm',e.target.value)} style={S.input} autoComplete="new-password"/>
            </div>
            <div style={{marginBottom:20}}>
              <label style={S.label}>Message (optional)</label>
              <textarea value={form.message} onChange={e=>s('message',e.target.value)} style={{...S.input,minHeight:70,resize:'vertical'}} placeholder="Tell us about your work..."/>
            </div>
            {error && <div style={{padding:'10px 14px',background:'rgba(196,92,74,0.08)',border:'1px solid rgba(196,92,74,0.2)',borderRadius:8,fontSize:13,color:'#c45c4a',marginBottom:14}}>{error}</div>}
            <button type="submit" disabled={loading} style={{...S.btn(true),opacity:loading?0.6:1}}>{loading?'Submitting…':'Submit Request'}</button>
          </form>
          <div style={{textAlign:'center',marginTop:16,fontSize:12,color:'#8a8070'}}>
            Already have access?{' '}
            <button onClick={()=>onRegistered(null)} style={{background:'none',border:'none',color:'#b68b2e',cursor:'pointer',fontSize:12,fontFamily:"'DM Sans',sans-serif",textDecoration:'underline'}}>Sign in</button>
          </div>
        </div>
        <div style={{textAlign:'center',marginTop:20,fontSize:11,color:'#a09890'}}>Vollard Black (Pty) Ltd · Hermanus, South Africa</div>
      </div>
    </div>
  );
}

// ── Pending Screen ────────────────────────────────────────
function PendingScreen({email, onSignIn}) {
  return (
    <div style={{...S.page,display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
      <div style={{width:'100%',maxWidth:420,textAlign:'center'}}>
        <Logo sub="Artist Portal"/>
        <div style={{...S.card,padding:36}}>
          <div style={{fontSize:48,marginBottom:16}}>◆</div>
          <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:24,color:'#1a1714',marginBottom:8}}>Request Submitted</div>
          <div style={{fontSize:13,color:'#6b635a',lineHeight:1.7,marginBottom:20}}>
            Thank you. Your request has been sent to Vollard Black for review.<br/>
            You will be notified once your account is approved.<br/><br/>
            <strong>{email}</strong>
          </div>
          <button onClick={onSignIn} style={{...S.btn(false),width:'auto',padding:'10px 24px'}}>Sign In Instead</button>
        </div>
      </div>
    </div>
  );
}

// ── Login Screen ──────────────────────────────────────────
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
    <div style={{...S.page,display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
      <div style={{width:'100%',maxWidth:420}}>
        <Logo sub="Artist Portal"/>
        <div style={{...S.card,padding:32,boxShadow:'0 8px 32px rgba(0,0,0,0.06)'}}>
          <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,color:'#1a1714',marginBottom:4}}>Sign In</div>
          <div style={{fontSize:12,color:'#8a8070',marginBottom:24}}>Your personal artist portal</div>
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
            {error&&<div style={{padding:'10px 14px',background:'rgba(196,92,74,0.08)',border:'1px solid rgba(196,92,74,0.2)',borderRadius:8,fontSize:13,color:'#c45c4a',marginBottom:14}}>{error}</div>}
            <button type="submit" disabled={loading} style={{...S.btn(true),opacity:loading?0.6:1}}>{loading?'Signing in…':'Sign In'}</button>
          </form>
          <div style={{textAlign:'center',marginTop:16,fontSize:12,color:'#8a8070'}}>
            Don't have access yet?{' '}
            <button onClick={onRegister} style={{background:'none',border:'none',color:'#b68b2e',cursor:'pointer',fontSize:12,fontFamily:"'DM Sans',sans-serif",textDecoration:'underline'}}>Request Access</button>
          </div>
        </div>
        <div style={{textAlign:'center',marginTop:20,fontSize:11,color:'#a09890'}}>Vollard Black (Pty) Ltd · Hermanus, South Africa</div>
      </div>
    </div>
  );
}

// ── Not Approved ──────────────────────────────────────────
function NotApprovedScreen({onSignOut}) {
  return (
    <div style={{...S.page,display:'flex',alignItems:'center',justifyContent:'center',padding:20,flexDirection:'column',gap:16}}>
      <Logo sub="Artist Portal"/>
      <div style={{...S.card,padding:36,textAlign:'center',maxWidth:420,width:'100%'}}>
        <div style={{fontSize:48,marginBottom:16}}>⏳</div>
        <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,color:'#1a1714',marginBottom:8}}>Awaiting Approval</div>
        <div style={{fontSize:13,color:'#6b635a',lineHeight:1.7,marginBottom:20}}>
          Your account is pending approval from Vollard Black.<br/>
          Please check back soon or contact us directly.
        </div>
        <button onClick={onSignOut} style={{...S.btn(false),width:'auto',padding:'10px 24px'}}>Sign Out</button>
      </div>
    </div>
  );
}

// ── Artist Dashboard ──────────────────────────────────────
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

  if(loading) return <div style={{...S.page,display:'flex',alignItems:'center',justifyContent:'center'}}><div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:24,color:'#b68b2e',letterSpacing:6,opacity:0.6}}>Loading…</div></div>;

  if(!artist) return (
    <div style={{...S.page,display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:16,padding:20}}>
      <Logo sub="Artist Portal"/>
      <div style={{...S.card,padding:36,textAlign:'center',maxWidth:420,width:'100%'}}>
        <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,color:'#1a1714',marginBottom:8}}>Account Not Linked</div>
        <div style={{fontSize:13,color:'#8a8070',marginBottom:16}}>Your account has not been linked to an artist record yet. Contact Vollard Black.</div>
        <button onClick={signOut} style={{...S.btn(false),width:'auto',padding:'10px 24px'}}>Sign Out</button>
      </div>
    </div>
  );

  return (
    <div style={S.page}>
      <div style={{background:'#fff',borderBottom:'1px solid rgba(182,139,46,0.20)',padding:'14px 20px',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:10}}>
        <div>
          <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:18,fontWeight:300,letterSpacing:5,color:'#1a1714'}}>VOLLARD <span style={{color:'#b68b2e'}}>BLACK</span></div>
          <div style={{fontSize:9,letterSpacing:3,textTransform:'uppercase',color:'#8a8070'}}>Artist Portal</div>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <span style={{fontSize:13,color:'#6b635a'}}>{artist.name}</span>
          <button onClick={signOut} style={{padding:'8px 16px',borderRadius:6,border:'1px solid rgba(182,139,46,0.25)',background:'transparent',color:'#8a8070',cursor:'pointer',fontSize:11,fontFamily:"'DM Sans',sans-serif"}}>Sign Out</button>
        </div>
      </div>

      <div style={{maxWidth:900,margin:'0 auto',padding:'20px 16px'}}>
        <div style={{display:'flex',borderBottom:'1px solid rgba(182,139,46,0.15)',marginBottom:20,gap:4,overflowX:'auto'}}>
          {[['overview','Overview'],['works','My Works'],['sales','Sales'],['auctions','Auctions']].map(([id,lbl])=>(
            <button key={id} onClick={()=>setTab(id)} style={S.tab(tab===id)}>{lbl}</button>
          ))}
        </div>

        {tab==='overview'&&(
          <div>
            <div style={{display:'flex',gap:16,alignItems:'flex-start',flexWrap:'wrap',marginBottom:20}}>
              {artist.profileImageUrl&&<div style={{width:80,height:80,borderRadius:'50%',overflow:'hidden',border:'2px solid rgba(182,139,46,0.3)'}}><img src={artist.profileImageUrl} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/></div>}
              <div>
                <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:32,fontWeight:300,color:'#1a1714'}}>{artist.name}</div>
                <div style={{fontSize:13,color:'#8a8070'}}>{artist.medium||'—'} · {artist.style||'—'}</div>
                {artist.bio&&<div style={{fontSize:13,color:'#6b635a',marginTop:6,maxWidth:500,fontStyle:'italic'}}>{artist.bio}</div>}
              </div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(130px,1fr))',gap:12,marginBottom:20}}>
              {[['Works Listed',artworks.length,true,false],['Active',artworks.filter(a=>a.status!=='Sold').length,false,true],['Sold',artworks.filter(a=>a.status==='Sold').length,false,false],['Total Sales','R '+fmt(totalSalesValue),false,true]].map(([lbl,val,gold,green])=>(
                <div key={lbl} style={{...S.card,textAlign:'center',padding:'14px 10px'}}>
                  <div style={{fontSize:10,letterSpacing:2,textTransform:'uppercase',color:'#8a8070',marginBottom:4}}>{lbl}</div>
                  <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:24,color:gold?'#b68b2e':green?'#4a9e6b':'#1a1714'}}>{val}</div>
                </div>
              ))}
            </div>
            {artist.website&&<div style={S.card}><div style={{fontSize:10,letterSpacing:2,textTransform:'uppercase',color:'#8a8070',marginBottom:4}}>Website</div><a href={artist.website} target="_blank" rel="noreferrer" style={{color:'#b68b2e',fontSize:13}}>{artist.website}</a></div>}
            {artist.instagram&&<div style={S.card}><div style={{fontSize:10,letterSpacing:2,textTransform:'uppercase',color:'#8a8070',marginBottom:4}}>Instagram</div><a href={'https://instagram.com/'+artist.instagram.replace('@','')} target="_blank" rel="noreferrer" style={{color:'#b68b2e',fontSize:13}}>@{artist.instagram.replace('@','')}</a></div>}
          </div>
        )}

        {tab==='works'&&(
          <div>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:24,color:'#1a1714',marginBottom:16}}>My Works</div>
            {artworks.length===0?<div style={{...S.card,textAlign:'center',padding:40}}><div style={{fontSize:14,color:'#8a8070'}}>No works listed yet.</div></div>
            :artworks.map(art=>(
              <div key={art.id} style={S.card}>
                <div style={{display:'flex',gap:16,flexWrap:'wrap'}}>
                  {art.imageUrl&&<div style={{width:100,height:100,borderRadius:8,overflow:'hidden',flexShrink:0}}><img src={art.imageUrl} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/></div>}
                  <div style={{flex:1,minWidth:180}}>
                    <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,color:'#1a1714',marginBottom:4}}>{art.title}</div>
                    <div style={{fontSize:12,color:'#8a8070',marginBottom:8}}>{art.medium||'—'} · {art.dimensions||'—'} · {art.year||'—'}</div>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6,fontSize:13}}>
                      <div><span style={{color:'#8a8070'}}>Value: </span><span style={S.gold}>R {fmt(art.recommendedPrice)}</span></div>
                      <div><span style={{color:'#8a8070'}}>Gallery: </span><span>{art.galleryName||'—'}</span></div>
                      <div><span style={{color:'#8a8070'}}>Status: </span><span style={{fontWeight:600,color:art.status==='Sold'?'#648cc8':art.status==='Available'?'#4a9e6b':'#b68b2e'}}>{art.status}</span></div>
                    </div>
                    {art.description&&<div style={{fontSize:12,color:'#6b635a',marginTop:6,fontStyle:'italic'}}>{art.description}</div>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab==='sales'&&(
          <div>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:24,color:'#1a1714',marginBottom:16}}>Sales</div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(130px,1fr))',gap:12,marginBottom:16}}>
              <div style={{...S.card,textAlign:'center',padding:'14px 10px'}}><div style={{fontSize:10,letterSpacing:2,textTransform:'uppercase',color:'#8a8070',marginBottom:4}}>Sales</div><div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:24,color:'#1a1714'}}>{sales.length}</div></div>
              <div style={{...S.card,textAlign:'center',padding:'14px 10px'}}><div style={{fontSize:10,letterSpacing:2,textTransform:'uppercase',color:'#8a8070',marginBottom:4}}>Total Value</div><div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:24,...S.gold}}>R {fmt(totalSalesValue)}</div></div>
              {artistShare>0&&<div style={{...S.card,textAlign:'center',padding:'14px 10px'}}><div style={{fontSize:10,letterSpacing:2,textTransform:'uppercase',color:'#8a8070',marginBottom:4}}>Your Share</div><div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:24,...S.green}}>R {fmt(artistShare)}</div></div>}
            </div>
            {sales.length===0?<div style={{...S.card,textAlign:'center',padding:40}}><div style={{fontSize:14,color:'#8a8070'}}>No sales recorded yet.</div></div>
            :sales.map(sale=>(
              <div key={sale.id} style={S.card}>
                <div style={{display:'flex',justifyContent:'space-between',flexWrap:'wrap',gap:8}}>
                  <div>
                    <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:18,color:'#1a1714',marginBottom:4}}>{sale.artworkTitle}</div>
                    <div style={{fontSize:12,color:'#8a8070'}}>{sale.date||sale.createdAt?.slice(0,10)||'—'}</div>
                  </div>
                  <div style={{textAlign:'right'}}>
                    <div style={{fontSize:11,color:'#8a8070'}}>Sale price</div>
                    <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,...S.gold}}>R {fmt(sale.salePrice)}</div>
                  </div>
                </div>
                {sale.artistShare>0&&(
                  <div style={{marginTop:10,padding:10,background:'rgba(74,158,107,0.06)',border:'1px solid rgba(74,158,107,0.15)',borderRadius:8,fontSize:13,display:'flex',justifyContent:'space-between'}}>
                    <span style={{color:'#6b635a'}}>Your share</span>
                    <span style={S.green}>R {fmt(sale.artistShare)}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {tab==='auctions'&&(
          <div>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:24,color:'#1a1714',marginBottom:16}}>Auction History</div>
            {auctions.length===0?<div style={{...S.card,textAlign:'center',padding:40}}><div style={{fontSize:14,color:'#8a8070'}}>No auctions yet.</div></div>
            :auctions.map(auc=>(
              <div key={auc.id} style={S.card}>
                <div style={{display:'flex',justifyContent:'space-between',flexWrap:'wrap',gap:8,marginBottom:8}}>
                  <div>
                    <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:18,color:'#1a1714'}}>{auc.title}</div>
                    <div style={{fontSize:12,color:'#8a8070',marginTop:2}}>{auc.galleryName||'—'}</div>
                  </div>
                  <span style={{padding:'4px 12px',borderRadius:6,fontSize:11,fontWeight:600,background:auc.status==='Sold'?'rgba(74,158,107,0.12)':auc.status==='Live'?'rgba(196,92,74,0.12)':'rgba(182,139,46,0.12)',color:auc.status==='Sold'?'#4a9e6b':auc.status==='Live'?'#c45c4a':'#b68b2e'}}>{auc.status}</span>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,fontSize:13}}>
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

// ── Root ──────────────────────────────────────────────────
export default function ArtistPortal() {
  const [session,setSession] = useState(undefined);
  const [screen,setScreen] = useState('login');
  const [pendingEmail,setPendingEmail] = useState('');
  const [approved,setApproved] = useState(null);

  useEffect(()=>{
    supabase.auth.getSession().then(({data})=>setSession(data?.session||null));
    const {data:{subscription}} = supabase.auth.onAuthStateChange((_,s)=>setSession(s));
    return ()=>subscription.unsubscribe();
  },[]);

  useEffect(()=>{
    if(!session){ setApproved(null); return; }
    supabase.from('portal_requests')
      .select('status')
      .eq('email', session.user.email)
      .single()
      .then(({data})=>{ setApproved(data?.status==='approved'); });
  },[session]);

  if(session===undefined) return <div style={{minHeight:'100vh',background:'#f5f3ef',display:'flex',alignItems:'center',justifyContent:'center'}}><div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:24,letterSpacing:8,color:'#b68b2e',opacity:0.5}}>VOLLARD BLACK</div></div>;

  if(!session){
    if(screen==='register') return <RegisterScreen onRegistered={(email)=>{ if(email){setPendingEmail(email);setScreen('pending');}else{setScreen('login');} }}/>;
    if(screen==='pending') return <PendingScreen email={pendingEmail} onSignIn={()=>setScreen('login')}/>;
    return <LoginScreen onLogin={s=>setSession(s)} onRegister={()=>setScreen('register')}/>;
  }

  if(approved===null) return <div style={{minHeight:'100vh',background:'#f5f3ef',display:'flex',alignItems:'center',justifyContent:'center'}}><div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:18,color:'#b68b2e',opacity:0.5}}>Checking access…</div></div>;
  if(!approved) return <NotApprovedScreen onSignOut={()=>supabase.auth.signOut()}/>;
  return <ArtistDashboard session={session}/>;
}
