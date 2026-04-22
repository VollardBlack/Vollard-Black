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

const S = {
  page: { minHeight:'100vh', background:'#f5f3ef', fontFamily:"'DM Sans',sans-serif", color:'#2a2622' },
  card: { background:'#fff', border:'1px solid rgba(182,139,46,0.18)', borderRadius:12, padding:20, marginBottom:16 },
  input: { width:'100%', padding:'12px 14px', background:'#f5f3ef', border:'1px solid rgba(182,139,46,0.25)', borderRadius:8, color:'#1a1714', fontFamily:"'DM Sans',sans-serif", fontSize:14, outline:'none', boxSizing:'border-box' },
  label: { display:'block', fontSize:10, fontWeight:500, letterSpacing:2, textTransform:'uppercase', color:'#6b635a', marginBottom:6 },
  btn: (gold) => ({ width:'100%', padding:14, borderRadius:8, border: gold?'none':'1px solid rgba(182,139,46,0.30)', background: gold?'linear-gradient(135deg,#b68b2e,#8a6a1e)':'transparent', color: gold?'#fff':'#b68b2e', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }),
  tab: (a) => ({ padding:'9px 18px', border: a?'none':'1px solid rgba(182,139,46,0.25)', borderRadius:24, background: a?'linear-gradient(135deg,#b68b2e,#8a6a1e)':'transparent', color: a?'#fff':'#6b635a', fontSize:13, fontWeight:a?600:400, cursor:'pointer', fontFamily:"'DM Sans',sans-serif", whiteSpace:'nowrap', transition:'all 0.2s' }),
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
  const [saleAlert,setSaleAlert] = useState('');
  const [uploadForm,setUploadForm] = useState({title:'',medium:'',dimensions:'',year:'',description:'',price:'',imageUrl:''});
  const [uploadImageFile,setUploadImageFile] = useState(null);
  const [uploadImagePreview,setUploadImagePreview] = useState(null);
  const [uploading,setUploading] = useState(false);
  const [uploadMsg,setUploadMsg] = useState('');
  const [profileForm,setProfileForm] = useState(null);
  const [profileEdit,setProfileEdit] = useState(false);
  const [savingProfile,setSavingProfile] = useState(false);
  const [saveMsg,setSaveMsg] = useState('');

  useEffect(()=>{ loadData(); },[session]);

  useEffect(()=>{
    if(!supabase) return;
    const ch = supabase.channel('artist-sales').on('postgres_changes',{event:'INSERT',schema:'public',table:'sales'},payload=>{
      if(artworks.some(a=>a.id===payload.new.artwork_id)){
        setSaleAlert(`🎉 Your artwork "${payload.new.artwork_title||''}" sold for R ${Number(payload.new.sale_price||0).toLocaleString('en-ZA')}!`);
        loadData();
      }
    }).subscribe();
    return ()=>supabase.removeChannel(ch);
  },[artworks]);

  const loadData = async() => {
    setLoading(true);
    try {
      const {data:arts} = await supabase.from('artists').select('*').eq('email', session.user.email);
      if(!arts||arts.length===0){ setLoading(false); return; }
      const a = toCamel(arts[0]);
      setArtist(a);
      setProfileForm({
        name:a.name||'', mobile:a.mobile||'', medium:a.medium||'',
        style:a.style||'', website:a.website||'', instagram:a.instagram||'',
        bio:a.bio||'', city:a.city||'', country:a.country||'South Africa',
        idNumber:a.idNumber||'', nationality:a.nationality||'',
        address:a.address||'',
        bankName:a.bankName||'', accountHolder:a.accountHolder||'',
        accountNumber:a.accountNumber||'', branchCode:a.branchCode||'',
        bankVerified:a.bankVerified||false,
      });
      const {data:works} = await supabase.from('artworks').select('*').eq('artist_id', a.id);
      const w = (works||[]).map(toCamel);
      setArtworks(w);
      if(w.length>0) {
        const ids = w.map(x=>x.id);
        const {data:sls} = await supabase.from('sales').select('*').in('artwork_id', ids);
        setSales((sls||[]).map(toCamel));
        const {data:aucs} = await supabase.from('auctions').select('*').in('artwork_id', ids);
        setAuctions((aucs||[]).map(toCamel));
      }
    } catch(e){ console.error(e); }
    setLoading(false);
  };

  const signOut = () => supabase.auth.signOut();

  const saveProfile = async() => {
    if(!artist) return;
    setSavingProfile(true);
    try {
      const bankChanged = (
        (profileForm.bankName||'') !== (artist.bankName||'') ||
        (profileForm.accountNumber||'') !== (artist.accountNumber||'') ||
        (profileForm.branchCode||'') !== (artist.branchCode||'') ||
        (profileForm.accountHolder||'') !== (artist.accountHolder||'')
      );
      const updates = {...profileForm, ...(bankChanged ? {bankVerified:false} : {})};
      const snake = toSnake(updates);
      delete snake.id; delete snake.created_at;
      await supabase.from('artists').update(snake).eq('id', artist.id);
      setArtist(a=>({...a,...updates}));
      setSaveMsg(bankChanged ? 'Saved. Bank details flagged for verification.' : 'Profile updated.');
      setTimeout(()=>setSaveMsg(''),5000);
      setProfileEdit(false);
    } catch(e){ console.error(e); }
    setSavingProfile(false);
  };

  const submitArtwork = async() => {
    if(!uploadForm.title||!uploadForm.price) return setUploadMsg('error:Title and price are required.');
    setUploading(true);
    try {
      let imageUrl = '';
      if(uploadImageFile) {
        const ext = uploadImageFile.name.split('.').pop().toLowerCase();
        const path = `artworks/${artist.id}-${Date.now()}.${ext}`;
        const {error:upErr} = await supabase.storage.from('artwork-images').upload(path, uploadImageFile, {upsert:true,contentType:uploadImageFile.type});
        if(!upErr){
          const{data:u}=supabase.storage.from('artwork-images').getPublicUrl(path);
          imageUrl = u?.publicUrl||'';
        }
      }
      await supabase.from('artworks').insert({
        id:crypto.randomUUID(), title:uploadForm.title,
        artist_name:artist.name, artist_id:artist.id,
        medium:uploadForm.medium, dimensions:uploadForm.dimensions,
        year:uploadForm.year, recommended_price:parseFloat(uploadForm.price)||0,
        description:uploadForm.description, image_url:imageUrl,
        status:'Pending Approval', approval_status:'pending',
        created_at:new Date().toISOString(),
      });
      setUploadMsg('success:Submitted for admin approval. It will appear in the gallery once approved.');
      setUploadForm({title:'',medium:'',dimensions:'',year:'',price:'',description:'',imageUrl:''});
      setUploadImageFile(null); setUploadImagePreview(null);
      await loadData();
    } catch(e){ setUploadMsg('error:'+e.message); }
    setUploading(false);
  };

  const totalSalesValue = sales.reduce((s,x)=>s+(x.salePrice||0),0);
  const artistShare = sales.reduce((s,x)=>s+(x.artistShare||0),0);
  const listedWorks = artworks.filter(a=>a.approvalStatus==='approved'||a.status==='Available'||a.status==='Reserved');
  const pendingWorks = artworks.filter(a=>a.status==='Pending Approval');

  // Styles
  const inp = {width:'100%',padding:'13px 16px',background:'#fff',border:'1.5px solid rgba(182,139,46,0.22)',borderRadius:12,color:'#1a1714',fontFamily:"'DM Sans',sans-serif",fontSize:14,outline:'none',boxSizing:'border-box'};
  const lbl = {display:'block',fontSize:10,fontWeight:700,letterSpacing:'0.14em',textTransform:'uppercase',color:'#6b635a',marginBottom:8};
  const card = {background:'#fff',border:'1px solid rgba(182,139,46,0.15)',borderRadius:16,overflow:'hidden',marginBottom:16};
  const cardPad = {padding:'20px'};
  const secHead = {fontSize:10,fontWeight:700,letterSpacing:'0.20em',textTransform:'uppercase',color:'#b68b2e',marginBottom:16,paddingBottom:10,borderBottom:'1px solid rgba(182,139,46,0.12)'};

  if(loading) return <div style={{minHeight:'100vh',background:'#f5f3ef',display:'flex',alignItems:'center',justifyContent:'center'}}><div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:24,color:'#b68b2e',letterSpacing:6,opacity:0.6}}>Loading…</div></div>;

  if(!artist) return (
    <div style={{minHeight:'100vh',background:'#f5f3ef',display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:16,padding:20}}>
      <Logo sub="Artist Portal"/>
      <div style={{background:'#fff',border:'1px solid rgba(182,139,46,0.18)',borderRadius:16,padding:36,textAlign:'center',maxWidth:420,width:'100%'}}>
        <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,color:'#1a1714',marginBottom:8}}>Account Not Linked</div>
        <div style={{fontSize:13,color:'#8a8070',marginBottom:16}}>Your account has not been linked yet. Contact Vollard Black.</div>
        <button onClick={signOut} style={{padding:'10px 24px',borderRadius:8,border:'1px solid rgba(182,139,46,0.30)',background:'transparent',color:'#b68b2e',fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:"'DM Sans',sans-serif"}}>Sign Out</button>
      </div>
    </div>
  );

  return (
    <div style={{minHeight:'100vh',background:'#f5f3ef',fontFamily:"'DM Sans',sans-serif",color:'#1a1714'}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600&family=DM+Sans:wght@300;400;500;600&display=swap');*{box-sizing:border-box;}input:focus,select:focus,textarea:focus{border-color:#b68b2e!important;box-shadow:0 0 0 3px rgba(182,139,46,0.10)!important;outline:none;}`}</style>

      {/* Top bar */}
      <div style={{background:'#fff',borderBottom:'1px solid rgba(182,139,46,0.15)',padding:'0 20px',height:56,display:'flex',alignItems:'center',justifyContent:'space-between',position:'sticky',top:0,zIndex:50,boxShadow:'0 1px 12px rgba(0,0,0,0.05)'}}>
        <a href="/" style={{textDecoration:'none',display:'flex',alignItems:'center',gap:10}}>
          <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:18,fontWeight:300,letterSpacing:'0.20em',color:'#1a1714'}}>VOLLARD <span style={{color:'#b68b2e'}}>BLACK</span></div>
          <div style={{width:1,height:14,background:'rgba(182,139,46,0.25)'}}/>
          <span style={{fontSize:9,letterSpacing:'0.18em',textTransform:'uppercase',color:'#648cc8',fontWeight:700}}>Artist</span>
        </a>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <span style={{fontSize:13,color:'#6b635a',fontWeight:500}}>{artist.name}</span>
          <button onClick={signOut} style={{padding:'7px 14px',borderRadius:8,border:'1px solid rgba(182,139,46,0.25)',background:'transparent',color:'#8a8070',cursor:'pointer',fontSize:11,fontFamily:"'DM Sans',sans-serif"}}>Sign Out</button>
        </div>
      </div>

      {/* Hero header */}
      <div style={{background:'linear-gradient(135deg, #1a1714 0%, #2a2018 60%, #1e1a10 100%)',padding:'40px 20px 32px',position:'relative',overflow:'hidden'}}>
        <div style={{position:'absolute',inset:0,backgroundImage:'radial-gradient(ellipse at 80% 50%, rgba(182,139,46,0.12) 0%, transparent 60%)',pointerEvents:'none'}}/>
        <div style={{position:'absolute',bottom:0,left:0,right:0,height:1,background:'linear-gradient(90deg,transparent,rgba(182,139,46,0.4),transparent)'}}/>
        <div style={{maxWidth:900,margin:'0 auto',position:'relative'}}>
          <div style={{display:'flex',gap:20,alignItems:'flex-start',flexWrap:'wrap'}}>
            {/* Avatar */}
            <div style={{width:72,height:72,borderRadius:'50%',background:'linear-gradient(135deg,rgba(182,139,46,0.3),rgba(182,139,46,0.1))',border:'2px solid rgba(182,139,46,0.4)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,fontSize:28,color:'rgba(182,139,46,0.8)',fontFamily:"'Cormorant Garamond',serif",fontWeight:300}}>
              {artist.name?artist.name[0].toUpperCase():'A'}
            </div>
            <div style={{flex:1}}>
              <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:34,fontWeight:300,color:'#f5f3ef',letterSpacing:'0.02em',lineHeight:1.1,marginBottom:4}}>{artist.name}</div>
              <div style={{fontSize:13,color:'rgba(245,243,239,0.55)',marginBottom:artist.bio?12:0}}>
                {[artist.medium,artist.style].filter(Boolean).join(' · ')||'Artist'}
              </div>
              {artist.bio&&<div style={{fontSize:13,color:'rgba(245,243,239,0.70)',lineHeight:1.75,maxWidth:560,fontStyle:'italic'}}>"{artist.bio}"</div>}
            </div>
          </div>

          {/* Stats row */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginTop:28}}>
            {[
              ['Works Listed', listedWorks.length],
              ['Pending', pendingWorks.length],
              ['Sold', artworks.filter(a=>a.status==='Sold').length],
              ['Total Sales', 'R '+fmt(totalSalesValue)],
            ].map(([lbl,val])=>(
              <div key={lbl} style={{background:'rgba(255,255,255,0.05)',border:'1px solid rgba(182,139,46,0.18)',borderRadius:12,padding:'14px 12px',textAlign:'center',backdropFilter:'blur(4px)'}}>
                <div style={{fontSize:9,letterSpacing:'0.18em',textTransform:'uppercase',color:'rgba(182,139,46,0.65)',marginBottom:6}}>{lbl}</div>
                <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,fontWeight:300,color:'#f5f3ef'}}>{val}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sale alert */}
      {saleAlert&&<div style={{background:'rgba(74,158,107,0.10)',borderBottom:'1px solid rgba(74,158,107,0.25)',padding:'12px 20px',fontSize:14,fontWeight:600,color:'#2d7a4a',display:'flex',alignItems:'center',gap:10,maxWidth:'100%'}}>
        <span>{saleAlert}</span>
        <button onClick={()=>setSaleAlert('')} style={{marginLeft:'auto',background:'none',border:'none',color:'#4a9e6b',cursor:'pointer',fontSize:20,lineHeight:1}}>×</button>
      </div>}

      {/* Tabs + content */}
      <div style={{maxWidth:900,margin:'0 auto',padding:'24px 16px 80px'}}>

        {/* Tab bar */}
        <div style={{display:'flex',flexWrap:'wrap',gap:8,marginBottom:28}}>
          {[['overview','Overview'],['works','My Works'],['upload','Upload'],['sales','Sales'],['auctions','Auctions'],['profile','Profile'],['terms','Terms']].map(([id,lbl])=>(
            <button key={id} onClick={()=>setTab(id)} style={{padding:'9px 20px',borderRadius:24,border:tab===id?'none':'1px solid rgba(182,139,46,0.22)',background:tab===id?'linear-gradient(135deg,#b68b2e,#8a6a1e)':'#fff',color:tab===id?'#fff':'#6b635a',fontSize:13,fontWeight:tab===id?600:400,cursor:'pointer',fontFamily:"'DM Sans',sans-serif",whiteSpace:'nowrap',transition:'all 0.2s',boxShadow:tab===id?'0 4px 12px rgba(182,139,46,0.28)':'none'}}>
              {lbl}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW ── */}
        {tab==='overview'&&(
          <div>
            {/* Bio prompt if missing */}
            {!artist.bio&&(
              <div onClick={()=>{setTab('profile');setProfileEdit(true);}} style={{...card,cursor:'pointer',border:'1.5px dashed rgba(182,139,46,0.30)',background:'rgba(182,139,46,0.03)',marginBottom:20}}>
                <div style={{...cardPad,display:'flex',alignItems:'center',gap:16}}>
                  <div style={{width:40,height:40,borderRadius:'50%',background:'rgba(182,139,46,0.10)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,flexShrink:0}}>✍</div>
                  <div>
                    <div style={{fontWeight:600,fontSize:14,color:'#b68b2e',marginBottom:2}}>Add your artist biography</div>
                    <div style={{fontSize:12,color:'#8a8070'}}>Tell collectors about your practice, inspiration and style. Tap to add.</div>
                  </div>
                  <div style={{marginLeft:'auto',fontSize:18,color:'rgba(182,139,46,0.4)'}}>→</div>
                </div>
              </div>
            )}

            {/* Quick links */}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:20}}>
              <button onClick={()=>setTab('upload')} style={{...card,marginBottom:0,padding:'18px 20px',cursor:'pointer',border:'none',textAlign:'left',display:'block',background:'linear-gradient(135deg,#b68b2e,#8a6a1e)',boxShadow:'0 8px 24px rgba(182,139,46,0.25)'}}>
                <div style={{fontSize:24,marginBottom:6}}>🖼</div>
                <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:18,color:'#fff',marginBottom:2}}>Upload Artwork</div>
                <div style={{fontSize:11,color:'rgba(255,255,255,0.65)'}}>Submit for gallery listing</div>
              </button>
              <button onClick={()=>setTab('works')} style={{...card,marginBottom:0,padding:'18px 20px',cursor:'pointer',border:'1px solid rgba(182,139,46,0.15)',textAlign:'left',display:'block',background:'#fff'}}>
                <div style={{fontSize:24,marginBottom:6}}>📦</div>
                <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:18,color:'#1a1714',marginBottom:2}}>My Works</div>
                <div style={{fontSize:11,color:'#8a8070'}}>{artworks.length} artwork{artworks.length!==1?'s':''} total</div>
              </button>
            </div>

            {/* Social links */}
            {(artist.instagram||artist.website)&&(
              <div style={{...card}}>
                <div style={{...cardPad}}>
                  <div style={secHead}>Connect</div>
                  <div style={{display:'flex',gap:12,flexWrap:'wrap'}}>
                    {artist.instagram&&<a href={'https://instagram.com/'+artist.instagram.replace('@','')} target="_blank" rel="noreferrer" style={{display:'flex',alignItems:'center',gap:8,padding:'10px 16px',borderRadius:24,background:'rgba(182,139,46,0.08)',border:'1px solid rgba(182,139,46,0.20)',color:'#b68b2e',textDecoration:'none',fontSize:13,fontWeight:600}}>📸 @{artist.instagram.replace('@','')}</a>}
                    {artist.website&&<a href={artist.website} target="_blank" rel="noreferrer" style={{display:'flex',alignItems:'center',gap:8,padding:'10px 16px',borderRadius:24,background:'rgba(100,140,200,0.08)',border:'1px solid rgba(100,140,200,0.20)',color:'#648cc8',textDecoration:'none',fontSize:13,fontWeight:600}}>🌐 Website</a>}
                  </div>
                </div>
              </div>
            )}

            {/* Recent artworks preview */}
            {artworks.length>0&&(
              <div style={card}>
                <div style={{...cardPad,paddingBottom:12}}>
                  <div style={secHead}>Recent Works</div>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))',gap:1,borderTop:'1px solid rgba(182,139,46,0.10)'}}>
                  {artworks.slice(0,6).map(art=>(
                    <div key={art.id} onClick={()=>setTab('works')} style={{position:'relative',paddingBottom:'100%',background:art.imageUrl?'#e8e4dd':'rgba(182,139,46,0.04)',cursor:'pointer',overflow:'hidden'}}>
                      {art.imageUrl
                        ?<img src={art.imageUrl} alt="" style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover'}}/>
                        :<div style={{position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:4}}>
                          <div style={{fontSize:24,opacity:0.3}}>🖼</div>
                          <div style={{fontSize:9,color:'#8a8070',letterSpacing:'0.1em',textTransform:'uppercase',textAlign:'center',padding:'0 8px'}}>{art.title}</div>
                        </div>
                      }
                      <div style={{position:'absolute',bottom:0,left:0,right:0,padding:'6px 8px',background:'linear-gradient(transparent,rgba(0,0,0,0.6))',fontSize:10,color:'#fff',fontWeight:600,lineHeight:1.3}}>{art.title}</div>
                      <div style={{position:'absolute',top:6,right:6,padding:'2px 6px',borderRadius:10,fontSize:9,fontWeight:700,background:art.status==='Sold'?'rgba(100,140,200,0.9)':art.approvalStatus==='pending'?'rgba(230,190,50,0.9)':'rgba(74,158,107,0.9)',color:'#fff'}}>{art.status==='Sold'?'SOLD':art.approvalStatus==='pending'?'PENDING':'LISTED'}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── MY WORKS ── */}
        {tab==='works'&&(
          <div>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20,flexWrap:'wrap',gap:10}}>
              <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:28,fontWeight:300,color:'#1a1714'}}>My Works</div>
              <button onClick={()=>setTab('upload')} style={{padding:'10px 22px',borderRadius:24,border:'none',background:'linear-gradient(135deg,#b68b2e,#8a6a1e)',color:'#fff',fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:"'DM Sans',sans-serif",boxShadow:'0 4px 12px rgba(182,139,46,0.28)'}}>+ Upload New</button>
            </div>
            {artworks.length===0
              ?<div style={{...card,textAlign:'center',padding:48}}>
                <div style={{fontSize:40,marginBottom:12,opacity:0.3}}>🖼</div>
                <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,color:'#1a1714',marginBottom:8}}>No works yet</div>
                <div style={{fontSize:13,color:'#8a8070',marginBottom:20}}>Upload your first artwork to get started.</div>
                <button onClick={()=>setTab('upload')} style={{padding:'11px 28px',borderRadius:24,border:'none',background:'linear-gradient(135deg,#b68b2e,#8a6a1e)',color:'#fff',fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:"'DM Sans',sans-serif"}}>Upload Artwork →</button>
              </div>
              :artworks.map(art=>(
              <div key={art.id} style={{...card,marginBottom:16}}>
                {art.imageUrl
                  ?<div style={{position:'relative',height:200,background:'#e8e4dd',cursor:'pointer'}} onClick={()=>document.getElementById('img-upd-'+art.id).click()}>
                    <img src={art.imageUrl} alt="" style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}}/>
                    <div style={{position:'absolute',inset:0,background:'rgba(0,0,0,0)',transition:'background 0.2s'}}/>
                    <div style={{position:'absolute',bottom:10,right:10,background:'rgba(0,0,0,0.55)',color:'#fff',padding:'5px 12px',borderRadius:20,fontSize:11,fontWeight:600}}>📷 Change image</div>
                  </div>
                  :<div style={{height:140,background:'rgba(182,139,46,0.03)',border:'2px dashed rgba(182,139,46,0.22)',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',gap:10}} onClick={()=>document.getElementById('img-upd-'+art.id).click()}>
                    <div style={{fontSize:28}}>🖼</div>
                    <div style={{fontSize:13,fontWeight:600,color:'#b68b2e'}}>Add artwork image</div>
                  </div>
                }
                <input id={'img-upd-'+art.id} type="file" accept="image/*" style={{display:'none'}} onChange={async(e)=>{
                  const file=e.target.files[0];if(!file)return;
                  const ext=file.name.split('.').pop().toLowerCase();
                  const path=`artworks/${artist.id}-${art.id}.${ext}`;
                  await supabase.storage.from('artwork-images').upload(path,file,{upsert:true,contentType:file.type});
                  const{data:u}=supabase.storage.from('artwork-images').getPublicUrl(path);
                  await supabase.from('artworks').update({image_url:u?.publicUrl||''}).eq('id',art.id);
                  await loadData();
                }}/>
                <div style={{padding:'16px 20px'}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:10,marginBottom:6}}>
                    <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,color:'#1a1714',fontWeight:400,lineHeight:1.2}}>{art.title}</div>
                    <span style={{fontSize:10,fontWeight:700,padding:'4px 10px',borderRadius:20,flexShrink:0,letterSpacing:'0.08em',
                      background:art.status==='Sold'?'rgba(100,140,200,0.12)':art.approvalStatus==='pending'?'rgba(230,190,50,0.12)':'rgba(74,158,107,0.12)',
                      color:art.status==='Sold'?'#648cc8':art.approvalStatus==='pending'?'#b8920a':'#2d7a4a'
                    }}>{art.status==='Sold'?'SOLD':art.approvalStatus==='pending'?'⏳ PENDING':'✓ LISTED'}</span>
                  </div>
                  <div style={{fontSize:12,color:'#8a8070',marginBottom:10}}>{[art.medium,art.dimensions,art.year].filter(Boolean).join(' · ')||'—'}</div>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <span style={{fontSize:13,color:'#8a8070'}}>Value</span>
                    <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,color:'#b68b2e',fontWeight:600}}>R {fmt(art.recommendedPrice)}</span>
                  </div>
                  {art.description&&<div style={{fontSize:12,color:'#6b635a',marginTop:10,lineHeight:1.7,fontStyle:'italic',borderTop:'1px solid rgba(182,139,46,0.08)',paddingTop:10}}>{art.description}</div>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── UPLOAD ── */}
        {tab==='upload'&&(
          <div>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:28,fontWeight:300,color:'#1a1714',marginBottom:4}}>Upload Artwork</div>
            <div style={{fontSize:13,color:'#8a8070',marginBottom:24}}>Submit for admin review. Once approved it appears in the gallery.</div>
            {uploadMsg&&<div style={{padding:'13px 16px',background:uploadMsg.startsWith('success:')?'rgba(74,158,107,0.08)':'rgba(196,92,74,0.08)',border:'1px solid '+(uploadMsg.startsWith('success:')?'rgba(74,158,107,0.25)':'rgba(196,92,74,0.25)'),borderRadius:12,fontSize:13,color:uploadMsg.startsWith('success:')?'#2d7a4a':'#c45c4a',marginBottom:20}}>{uploadMsg.replace('success:','').replace('error:','')}</div>}
            <div style={card}>
              <div style={cardPad}>
                {/* Image upload */}
                <div style={{marginBottom:24}}>
                  <label style={lbl}>Artwork Image</label>
                  <div onClick={()=>document.getElementById('new-art-img').click()} style={{border:`2px dashed ${uploadImagePreview?'rgba(74,158,107,0.5)':'rgba(182,139,46,0.25)'}`,borderRadius:14,cursor:'pointer',overflow:'hidden',background:uploadImagePreview?'rgba(74,158,107,0.04)':'#f5f3ef',minHeight:160,display:'flex',alignItems:'center',justifyContent:'center',transition:'all 0.2s'}}>
                    {uploadImagePreview
                      ?<div style={{width:'100%',position:'relative'}}>
                        <img src={uploadImagePreview} alt="preview" style={{width:'100%',maxHeight:260,objectFit:'cover',display:'block'}}/>
                        <div style={{position:'absolute',bottom:10,right:10,background:'rgba(74,158,107,0.9)',color:'#fff',padding:'5px 12px',borderRadius:20,fontSize:11,fontWeight:700}}>✓ Image ready</div>
                      </div>
                      :<div style={{textAlign:'center',padding:28}}>
                        <div style={{fontSize:36,marginBottom:8}}>🖼</div>
                        <div style={{fontSize:14,fontWeight:600,color:'#6b635a',marginBottom:4}}>Tap to upload artwork photo</div>
                        <div style={{fontSize:11,color:'#8a8070'}}>JPG, PNG or WEBP · Max 10MB</div>
                      </div>
                    }
                  </div>
                  <input id="new-art-img" type="file" accept="image/*" style={{display:'none'}} onChange={e=>{const file=e.target.files[0];if(!file)return;setUploadImageFile(file);const r=new FileReader();r.onload=ev=>setUploadImagePreview(ev.target.result);r.readAsDataURL(file);}}/>
                  {uploadImagePreview&&<button onClick={()=>{setUploadImageFile(null);setUploadImagePreview(null);}} style={{marginTop:8,background:'none',border:'none',color:'#c45c4a',cursor:'pointer',fontSize:12,fontFamily:"'DM Sans',sans-serif"}}>✕ Remove</button>}
                </div>

                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
                  {[['title','Title *','text'],['medium','Medium','text'],['dimensions','Dimensions','text'],['year','Year','number']].map(([key,label,type])=>(
                    <div key={key}>
                      <label style={lbl}>{label}</label>
                      <input type={type} value={uploadForm[key]||''} onChange={e=>setUploadForm(p=>({...p,[key]:e.target.value}))} style={inp}/>
                    </div>
                  ))}
                  <div style={{gridColumn:'1/-1'}}>
                    <label style={lbl}>Price (R) *</label>
                    <input type="number" value={uploadForm.price||''} onChange={e=>setUploadForm(p=>({...p,price:e.target.value}))} style={inp} placeholder="e.g. 25000" inputMode="numeric"/>
                  </div>
                  <div style={{gridColumn:'1/-1'}}>
                    <label style={lbl}>Description</label>
                    <textarea value={uploadForm.description||''} onChange={e=>setUploadForm(p=>({...p,description:e.target.value}))} style={{...inp,minHeight:90,resize:'vertical'}} placeholder="Describe the artwork, inspiration, technique…"/>
                  </div>
                </div>

                <div style={{marginTop:16,padding:'12px 16px',background:'rgba(182,139,46,0.05)',border:'1px solid rgba(182,139,46,0.15)',borderRadius:10,fontSize:12,color:'#6b635a',lineHeight:1.6,marginBottom:20}}>
                  ℹ After submission, Vollard Black will review and approve your artwork before it appears in the gallery.
                </div>

                <div style={{display:'flex',justifyContent:'flex-end'}}>
                  <button onClick={submitArtwork} disabled={uploading} style={{padding:'13px 36px',borderRadius:12,border:'none',background:'linear-gradient(135deg,#b68b2e,#8a6a1e)',color:'#fff',fontSize:14,fontWeight:700,cursor:uploading?'not-allowed':'pointer',fontFamily:"'DM Sans',sans-serif",opacity:uploading?0.6:1,boxShadow:'0 6px 20px rgba(182,139,46,0.30)'}}>
                    {uploading?'Submitting…':'Submit for Approval'}
                  </button>
                </div>
              </div>
            </div>

            {pendingWorks.length>0&&(
              <div style={{marginTop:8}}>
                <div style={{fontSize:10,fontWeight:700,letterSpacing:'0.16em',textTransform:'uppercase',color:'#b8920a',marginBottom:12}}>Pending Approval ({pendingWorks.length})</div>
                {pendingWorks.map(art=>(
                  <div key={art.id} style={{...card,marginBottom:10}}>
                    <div style={{display:'flex',gap:14,alignItems:'center',...cardPad}}>
                      {art.imageUrl&&<img src={art.imageUrl} alt="" style={{width:56,height:56,borderRadius:10,objectFit:'cover',flexShrink:0,border:'1px solid rgba(182,139,46,0.15)'}}/>}
                      <div style={{flex:1}}>
                        <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:18,color:'#1a1714'}}>{art.title}</div>
                        <div style={{fontSize:12,color:'#8a8070'}}>{art.medium||'—'} · R {fmt(art.recommendedPrice)}</div>
                      </div>
                      <span style={{fontSize:10,fontWeight:700,color:'#b8920a',padding:'4px 10px',background:'rgba(230,190,50,0.12)',borderRadius:20,flexShrink:0}}>⏳ Pending</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── SALES ── */}
        {tab==='sales'&&(
          <div>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:28,fontWeight:300,color:'#1a1714',marginBottom:20}}>Sales</div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))',gap:12,marginBottom:20}}>
              {[['Total Sales',sales.length,'#1a1714'],['Sales Value','R '+fmt(totalSalesValue),'#b68b2e'],['Your Share','R '+fmt(artistShare),'#4a9e6b']].map(([lbl,val,color])=>(
                <div key={lbl} style={{...card,textAlign:'center',padding:'18px 12px',marginBottom:0}}>
                  <div style={{fontSize:9,letterSpacing:'0.16em',textTransform:'uppercase',color:'#8a8070',marginBottom:8}}>{lbl}</div>
                  <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:26,fontWeight:300,color}}>{val}</div>
                </div>
              ))}
            </div>
            {sales.length===0
              ?<div style={{...card,textAlign:'center',padding:48}}><div style={{fontSize:13,color:'#8a8070'}}>No sales yet. Keep creating!</div></div>
              :sales.map(sale=>(
              <div key={sale.id} style={{...card}}>
                <div style={cardPad}>
                  <div style={{display:'flex',justifyContent:'space-between',flexWrap:'wrap',gap:8,marginBottom:12}}>
                    <div>
                      <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,color:'#1a1714',marginBottom:4}}>{sale.artworkTitle}</div>
                      <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
                        <span style={{fontSize:11,color:'#8a8070'}}>{sale.date||sale.createdAt?.slice(0,10)||'—'}</span>
                        <span style={{fontSize:10,fontWeight:700,padding:'2px 8px',borderRadius:10,background:sale.source==='auction'?'rgba(74,158,107,0.12)':'rgba(182,139,46,0.12)',color:sale.source==='auction'?'#2d7a4a':'#8a6a1e'}}>{sale.source==='auction'?'⚖ Auction':'Direct'}</span>
                      </div>
                    </div>
                    <div style={{textAlign:'right'}}>
                      <div style={{fontSize:10,color:'#8a8070',marginBottom:2}}>Sale Price</div>
                      <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,color:'#b68b2e',fontWeight:600}}>R {fmt(sale.salePrice)}</div>
                    </div>
                  </div>
                  {(sale.artistShare||0)>0&&(
                    <div style={{padding:'12px 16px',background:'rgba(74,158,107,0.06)',border:'1px solid rgba(74,158,107,0.15)',borderRadius:10,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                      <span style={{fontSize:13,color:'#4a9e6b',fontWeight:600}}>Your share (30%)</span>
                      <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,color:'#2d7a4a',fontWeight:600}}>R {fmt(sale.artistShare)}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── AUCTIONS ── */}
        {tab==='auctions'&&(
          <div>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:28,fontWeight:300,color:'#1a1714',marginBottom:20}}>Auctions</div>
            {auctions.length===0
              ?<div style={{...card,textAlign:'center',padding:48}}><div style={{fontSize:13,color:'#8a8070'}}>No auctions yet.</div></div>
              :auctions.map(auc=>(
              <div key={auc.id} style={card}>
                <div style={cardPad}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:10,marginBottom:12}}>
                    <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,color:'#1a1714'}}>{auc.title}</div>
                    <span style={{fontSize:10,fontWeight:700,padding:'4px 12px',borderRadius:20,flexShrink:0,background:auc.status==='Sold'?'rgba(74,158,107,0.12)':auc.status==='Live'?'rgba(196,92,74,0.12)':'rgba(182,139,46,0.12)',color:auc.status==='Sold'?'#2d7a4a':auc.status==='Live'?'#c45c4a':'#b68b2e'}}>{auc.status}</span>
                  </div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,fontSize:13}}>
                    <div style={{padding:'10px 12px',background:'#f5f3ef',borderRadius:8}}><div style={{fontSize:9,color:'#8a8070',letterSpacing:'0.12em',textTransform:'uppercase',marginBottom:4}}>Reserve</div><div style={{fontWeight:600}}>R {fmt(auc.reservePrice)}</div></div>
                    <div style={{padding:'10px 12px',background:'#f5f3ef',borderRadius:8}}><div style={{fontSize:9,color:'#8a8070',letterSpacing:'0.12em',textTransform:'uppercase',marginBottom:4}}>Final Bid</div><div style={{fontWeight:600,color:'#b68b2e'}}>R {fmt(auc.currentBid||0)}</div></div>
                    <div style={{padding:'10px 12px',background:'#f5f3ef',borderRadius:8}}><div style={{fontSize:9,color:'#8a8070',letterSpacing:'0.12em',textTransform:'uppercase',marginBottom:4}}>Bids</div><div style={{fontWeight:600}}>{auc.bidsCount||0}</div></div>
                    <div style={{padding:'10px 12px',background:'#f5f3ef',borderRadius:8}}><div style={{fontSize:9,color:'#8a8070',letterSpacing:'0.12em',textTransform:'uppercase',marginBottom:4}}>Closed</div><div style={{fontWeight:600}}>{auc.closedAt?.slice(0,10)||'—'}</div></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── PROFILE ── */}
        {tab==='profile'&&(
          <div>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:24,flexWrap:'wrap',gap:10}}>
              <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:28,fontWeight:300,color:'#1a1714'}}>My Profile</div>
              {!profileEdit&&<button onClick={()=>setProfileEdit(true)} style={{padding:'10px 22px',borderRadius:24,border:'1px solid rgba(182,139,46,0.30)',background:'transparent',color:'#b68b2e',fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:"'DM Sans',sans-serif"}}>Edit Profile</button>}
            </div>
            {saveMsg&&<div style={{padding:'12px 16px',background:'rgba(74,158,107,0.08)',border:'1px solid rgba(74,158,107,0.20)',borderRadius:12,fontSize:13,color:'#2d7a4a',marginBottom:20}}>✓ {saveMsg}</div>}

            {!profileEdit?(
              <div>
                {/* Personal */}
                <div style={card}>
                  <div style={cardPad}>
                    <div style={secHead}>Personal Information</div>
                    {[['Full Name',artist?.name||'—'],['Email',artist?.email||session.user.email||'—'],['Mobile',artist?.mobile||'—'],['ID / Passport',artist?.idNumber||'—'],['Nationality',artist?.nationality||'—'],['City',artist?.city||'—'],['Country',artist?.country||'—'],['Address',artist?.address||'—']].map(([label,value])=>(
                      <div key={label} style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',padding:'10px 0',borderBottom:'1px solid rgba(182,139,46,0.07)',fontSize:13,gap:12}}>
                        <span style={{color:'#8a8070',flexShrink:0}}>{label}</span>
                        <span style={{fontWeight:500,textAlign:'right',color:'#1a1714'}}>{value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Artist */}
                <div style={card}>
                  <div style={cardPad}>
                    <div style={secHead}>Artist Details</div>
                    {[['Primary Medium',artist?.medium||'—'],['Style',artist?.style||'—'],['Instagram',artist?.instagram?('@'+artist.instagram.replace('@','')):'—'],['Website',artist?.website||'—']].map(([label,value])=>(
                      <div key={label} style={{display:'flex',justifyContent:'space-between',padding:'10px 0',borderBottom:'1px solid rgba(182,139,46,0.07)',fontSize:13,gap:12}}>
                        <span style={{color:'#8a8070',flexShrink:0}}>{label}</span>
                        <span style={{fontWeight:500,textAlign:'right'}}>{value}</span>
                      </div>
                    ))}
                    {artist?.bio
                      ?<div style={{marginTop:14,padding:'14px 16px',background:'rgba(182,139,46,0.04)',borderRadius:10,fontSize:13,color:'#4a4440',lineHeight:1.8,fontStyle:'italic'}}>"{artist.bio}"</div>
                      :<button onClick={()=>setProfileEdit(true)} style={{marginTop:12,padding:'10px 0',background:'none',border:'none',color:'#b68b2e',cursor:'pointer',fontSize:13,fontWeight:600,fontFamily:"'DM Sans',sans-serif"}}>+ Add biography →</button>
                    }
                  </div>
                </div>

                {/* Banking */}
                <div style={card}>
                  <div style={cardPad}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16,...{paddingBottom:10,borderBottom:'1px solid rgba(182,139,46,0.12)'}}}>
                      <div style={{fontSize:10,fontWeight:700,letterSpacing:'0.20em',textTransform:'uppercase',color:'#b68b2e'}}>Banking Details</div>
                      {artist?.bankVerified
                        ?<span style={{fontSize:11,fontWeight:700,color:'#2d7a4a',background:'rgba(74,158,107,0.10)',padding:'3px 10px',borderRadius:20}}>✓ Verified</span>
                        :(artist?.bankName||artist?.accountNumber)
                          ?<span style={{fontSize:11,fontWeight:700,color:'#b8920a',background:'rgba(230,190,50,0.10)',padding:'3px 10px',borderRadius:20}}>⏳ Pending Verification</span>
                          :<span style={{fontSize:11,color:'#8a8070'}}>Not yet added</span>
                      }
                    </div>
                    {(artist?.bankName||artist?.accountNumber)?[['Bank',artist?.bankName||'—'],['Account Holder',artist?.accountHolder||'—'],['Account Number',artist?.accountNumber||'—'],['Branch Code',artist?.branchCode||'—']].map(([label,value])=>(
                      <div key={label} style={{display:'flex',justifyContent:'space-between',padding:'10px 0',borderBottom:'1px solid rgba(182,139,46,0.07)',fontSize:13,gap:12}}>
                        <span style={{color:'#8a8070',flexShrink:0}}>{label}</span><span style={{fontWeight:500}}>{value}</span>
                      </div>
                    )):<div style={{fontSize:13,color:'#8a8070',padding:'8px 0',lineHeight:1.7}}>Add your banking details so Vollard Black can pay your share of sales directly to your account.</div>}
                  </div>
                </div>
              </div>
            ):(
              <div>
                <div style={{...card,marginBottom:16}}>
                  <div style={cardPad}>
                    <div style={secHead}>Personal Information</div>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
                      {[['name','Full Name'],['mobile','Mobile'],['city','City'],['country','Country']].map(([key,label])=>(
                        <div key={key}><label style={lbl}>{label}</label><input value={profileForm[key]||''} onChange={e=>setProfileForm(p=>({...p,[key]:e.target.value}))} style={inp}/></div>
                      ))}
                      <div style={{gridColumn:'1/-1'}}><label style={lbl}>Address</label><textarea value={profileForm.address||''} onChange={e=>setProfileForm(p=>({...p,address:e.target.value}))} style={{...inp,minHeight:60,resize:'vertical'}}/></div>
                    </div>
                  </div>
                </div>

                <div style={{...card,marginBottom:16}}>
                  <div style={cardPad}>
                    <div style={secHead}>Artist Details</div>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
                      {[['medium','Primary Medium'],['style','Style'],['instagram','Instagram'],['website','Website']].map(([key,label])=>(
                        <div key={key}><label style={lbl}>{label}</label><input value={profileForm[key]||''} onChange={e=>setProfileForm(p=>({...p,[key]:e.target.value}))} style={inp} placeholder={key==='instagram'?'@yourhandle':key==='website'?'https://...':''}/></div>
                      ))}
                      <div style={{gridColumn:'1/-1'}}>
                        <label style={lbl}>Biography / Artist Statement</label>
                        <textarea value={profileForm.bio||''} onChange={e=>setProfileForm(p=>({...p,bio:e.target.value}))} style={{...inp,minHeight:120,resize:'vertical'}} placeholder="Tell collectors about your practice, inspiration, style, and what drives your work…"/>
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{...card,marginBottom:16}}>
                  <div style={cardPad}>
                    <div style={secHead}>Banking Details</div>
                    <div style={{fontSize:12,color:'#8a8070',marginBottom:16,lineHeight:1.7}}>Your payout account for sale proceeds. Changes require re-verification by Vollard Black.</div>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
                      {[['bankName','Bank Name'],['accountHolder','Account Holder'],['accountNumber','Account Number'],['branchCode','Branch Code']].map(([key,label])=>(
                        <div key={key}><label style={lbl}>{label}</label><input value={profileForm[key]||''} onChange={e=>setProfileForm(p=>({...p,[key]:e.target.value}))} style={inp} inputMode={key==='accountNumber'||key==='branchCode'?'numeric':undefined}/></div>
                      ))}
                    </div>
                    <div style={{marginTop:14,padding:'11px 14px',background:'rgba(230,190,50,0.05)',border:'1px solid rgba(230,190,50,0.18)',borderRadius:10,fontSize:12,color:'#6b635a',lineHeight:1.6}}>
                      ⚠ Saving new bank details will flag your account for verification before payouts are processed.
                    </div>
                  </div>
                </div>

                <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}>
                  <button onClick={()=>setProfileEdit(false)} style={{padding:'12px 22px',borderRadius:12,border:'1px solid rgba(182,139,46,0.28)',background:'transparent',color:'#b68b2e',fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:"'DM Sans',sans-serif"}}>Cancel</button>
                  <button onClick={saveProfile} disabled={savingProfile} style={{padding:'12px 28px',borderRadius:12,border:'none',background:'linear-gradient(135deg,#b68b2e,#8a6a1e)',color:'#fff',fontSize:13,fontWeight:700,cursor:savingProfile?'not-allowed':'pointer',fontFamily:"'DM Sans',sans-serif",opacity:savingProfile?0.6:1,boxShadow:'0 4px 14px rgba(182,139,46,0.28)'}}>{savingProfile?'Saving…':'Save Changes'}</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── TERMS ── */}
        {tab==='terms'&&(
          <div>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:28,fontWeight:300,color:'#1a1714',marginBottom:20}}>Artist Representation Agreement</div>
            <div style={card}>
              <div style={cardPad}>
                <div style={{fontSize:12,color:'#8a8070',marginBottom:20}}>Vollard Black (Pty) Ltd · Hermanus, South Africa</div>
                {[['1. Representation','By registering, you authorise Vollard Black to display, market, and sell your artworks through its platform, gallery network, and auction services.'],['2. Commission Structure','On each sale: Artist Share 30% of gallery commission · Gallery Partner Share 40% · Vollard Black Share 30%. These apply to the license fee (50% of sale price).'],['3. Artwork Submission','All submissions are subject to approval. Vollard Black may decline artworks that do not meet quality standards. Approved works are listed in the gallery.'],['4. Intellectual Property','You retain full copyright. You grant Vollard Black a non-exclusive licence to use artwork images for marketing purposes.'],['5. Authenticity','You warrant that all submitted works are original, created by you, free from third-party claims, and that you have full right to sell them.'],['6. Payment','Artist shares are paid within 14 business days of a confirmed sale to the bank account on file.']].map(([title,text])=>(
                  <div key={title} style={{marginBottom:16,paddingBottom:16,borderBottom:'1px solid rgba(182,139,46,0.08)'}}>
                    <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:16,color:'#1a1714',marginBottom:6,fontWeight:500}}>{title}</div>
                    <div style={{fontSize:13,color:'#4a4440',lineHeight:1.8}}>{text}</div>
                  </div>
                ))}
                <div style={{padding:'12px 16px',background:'rgba(182,139,46,0.06)',borderRadius:10,fontSize:12,color:'#8a6a1e',marginTop:8}}>
                  Contact: <strong>concierge@vollardblack.com</strong>
                </div>
              </div>
            </div>
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
    if(supabase)supabase.auth.getSession().then(({data})=>setSession(data?.session||null));else setSession(null);
    const {data:{subscription}} = supabase?supabase.auth.onAuthStateChange((_,s)=>setSession(s)):{data:{subscription:{unsubscribe:()=>{}}}};
    return ()=>subscription.unsubscribe();
  },[]);

  useEffect(()=>{
    if(!session){ setApproved(null); return; }
    supabase.from('portal_requests')
      .select('status')
      .eq('email', session.user.email)
      .eq('role', 'artist')
      .order('created_at', {ascending:false})
      .limit(1)
      .single()
      .then(({data})=>{ setApproved(data?.status==='approved'); });
  },[session]);

  if(session===undefined) return <div style={{minHeight:'100vh',background:'#f5f3ef',display:'flex',alignItems:'center',justifyContent:'center'}}><div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:24,letterSpacing:8,color:'#b68b2e',opacity:0.5}}>VOLLARD BLACK</div></div>;

  if(!session){
    if(screen==='register') return <KYCRegistration role="artist" supabase={supabase} onComplete={email=>{setPendingEmail(email);setScreen('pending');}} onSignIn={()=>setScreen('login')}/>;
    if(screen==='pending') return <PendingScreen email={pendingEmail} onSignIn={()=>setScreen('login')}/>;
    return <LoginScreen onLogin={s=>setSession(s)} onRegister={()=>setScreen('register')}/>;
  }

  if(approved===null) return <div style={{minHeight:'100vh',background:'#f5f3ef',display:'flex',alignItems:'center',justifyContent:'center'}}><div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:18,color:'#b68b2e',opacity:0.5}}>Checking access…</div></div>;
  if(!approved) return <NotApprovedScreen onSignOut={()=>supabase.auth.signOut()}/>;
  return <ArtistDashboard session={session}/>;
}
