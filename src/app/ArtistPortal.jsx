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
  const [uploadForm,setUploadForm] = useState({title:'',medium:'',dimensions:'',year:'',description:'',price:'',imageUrl:''});
  const [uploadImageFile,setUploadImageFile] = useState(null);
  const [uploadImagePreview,setUploadImagePreview] = useState(null);
  const [uploading,setUploading] = useState(false);
  const [uploadDone,setUploadDone] = useState(false);
  const [profileForm,setProfileForm] = useState(null);
  const [savingProfile,setSavingProfile] = useState(false);
  const [profileSaved,setProfileSaved] = useState(false);
  const [saving,setSaving] = useState(false);
  const [saveMsg,setSaveMsg] = useState('');
  const [profileEdit,setProfileEdit] = useState(false);
  const [uploadMsg,setUploadMsg] = useState('');
  const [saleAlert,setSaleAlert] = useState('');

  useEffect(()=>{ loadData(); },[session]);

  // Realtime — listen for sales on artist's artworks
  useEffect(()=>{
    if(!session||!supabase) return;
    const ch = supabase.channel('artist-rt')
      .on('postgres_changes',{event:'INSERT',schema:'public',table:'sales'},(payload)=>{
        loadData();
        const s = payload.new;
        const msg = s.source==='auction'
          ? `🏆 "${s.artwork_title}" sold at auction for R ${Number(s.sale_price||0).toLocaleString('en-ZA',{minimumFractionDigits:2})}!`
          : `✓ "${s.artwork_title}" has been sold for R ${Number(s.sale_price||0).toLocaleString('en-ZA',{minimumFractionDigits:2})}.`;
        setSaleAlert(msg);
        setTimeout(()=>setSaleAlert(''), 10000);
      })
      .on('postgres_changes',{event:'UPDATE',schema:'public',table:'auctions'},(payload)=>{
        loadData();
      })
      .subscribe();
    return ()=>supabase.removeChannel(ch);
  },[session]);

  const loadData = async() => {
    setLoading(true);
    try {
      const {data:arts} = await supabase.from('artists').select('*').eq('email', session.user.email);
      if(!arts||arts.length===0){ setLoading(false); return; }
      const a = toCamel(arts[0]);
      setArtist(a);
      setProfileForm(a);
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

  const saveProfile = async() => {
    if(!artist) return;
    setSavingProfile(true);
    try {
      // If bank details changed, flag for re-verification
      const bankChanged = (
        profileForm.bankName !== (artist.bankName||'') ||
        profileForm.accountNumber !== (artist.accountNumber||'') ||
        profileForm.branchCode !== (artist.branchCode||'') ||
        profileForm.accountHolder !== (artist.accountHolder||'')
      );
      const updates = {
        ...profileForm,
        ...(bankChanged ? { bankVerified: false } : {}),
      };
      const snake = toSnake(updates);
      delete snake.id;
      delete snake.created_at;
      await supabase.from('artists').update(snake).eq('id', artist.id);
      setArtist(a=>({...a,...updates}));
      setSaveMsg(bankChanged ? 'Profile saved. Bank details flagged for verification by Vollard Black.' : 'Profile updated.');
      setTimeout(()=>setSaveMsg(''),5000);
      setProfileEdit(false);
    } catch(e){ console.error(e); setSaveMsg(''); }
    setSavingProfile(false);
  };

  const submitArtwork = async() => {
    if(!uploadForm.title||!uploadForm.price) return setUploadMsg('error:Title and price are required.');
    setUploading(true);
    try {
      let imageUrl = uploadForm.imageUrl || '';
      // Upload image if file selected
      if(uploadImageFile) {
        const ext = uploadImageFile.name.split('.').pop().toLowerCase();
        const path = `artworks/${artist.id}-${Date.now()}.${ext}`;
        const { error:upErr } = await supabase.storage.from('artwork-images').upload(path, uploadImageFile, { upsert:true, contentType:uploadImageFile.type });
        if(!upErr) {
          const { data:urlData } = supabase.storage.from('artwork-images').getPublicUrl(path);
          imageUrl = urlData?.publicUrl || '';
        }
      }
      await supabase.from('artworks').insert({
        id: crypto.randomUUID(),
        title: uploadForm.title,
        artist_name: artist.name,
        artist_id: artist.id,
        medium: uploadForm.medium,
        dimensions: uploadForm.dimensions,
        year: uploadForm.year,
        recommended_price: parseFloat(uploadForm.price)||0,
        description: uploadForm.description,
        image_url: imageUrl,
        status: 'Pending Approval',
        approval_status: 'pending',
        created_at: new Date().toISOString(),
      });
      setUploadMsg('success:Artwork submitted for admin approval. It will appear in the gallery once approved.');
      setUploadForm({title:'',medium:'',dimensions:'',year:'',price:'',description:'',imageUrl:''});
      setUploadImageFile(null);
      setUploadImagePreview(null);
      await loadData();
    } catch(e) {
      setUploadMsg('error:'+e.message);
    }
    setUploading(false);
  };
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
        {saleAlert&&<div style={{padding:'14px 18px',background:'rgba(74,158,107,0.10)',border:'2px solid rgba(74,158,107,0.35)',borderRadius:10,marginBottom:16,fontSize:14,fontWeight:600,color:'#2d7a4a',display:'flex',alignItems:'center',gap:10}}>
          <span style={{fontSize:20}}>🎉</span><span>{saleAlert}</span>
          <button onClick={()=>setSaleAlert('')} style={{marginLeft:'auto',background:'none',border:'none',color:'#4a9e6b',cursor:'pointer',fontSize:18}}>×</button>
        </div>}
        <div style={{display:'flex',flexWrap:'wrap',gap:8,marginBottom:24,padding:'4px 0'}}>
          {[['overview','Overview'],['works','My Works'],['upload','Upload Artwork'],['sales','Sales'],['auctions','Auctions'],['profile','My Profile'],['terms','Terms']].map(([id,lbl])=>(
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
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16,flexWrap:'wrap',gap:10}}>
              <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:24,color:'#1a1714'}}>My Works</div>
              <button onClick={()=>setTab('upload')} style={{padding:'9px 18px',borderRadius:24,border:'none',background:'linear-gradient(135deg,#b68b2e,#8a6a1e)',color:'#fff',fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:"'DM Sans',sans-serif"}}>+ Upload New</button>
            </div>
            {artworks.length===0
              ?<div style={{...S.card,textAlign:'center',padding:40}}><div style={{fontSize:14,color:'#8a8070',marginBottom:12}}>No works listed yet.</div><button onClick={()=>setTab('upload')} style={{padding:'10px 20px',borderRadius:8,border:'1px solid rgba(182,139,46,0.30)',background:'transparent',color:'#b68b2e',fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:"'DM Sans',sans-serif"}}>Upload your first artwork →</button></div>
              :artworks.map(art=>(
              <div key={art.id} style={{...S.card,padding:0,overflow:'hidden'}}>
                {/* Image strip or upload prompt */}
                {art.imageUrl
                  ?<div style={{position:'relative',height:180,background:'#e8e4dd',cursor:'pointer'}} onClick={()=>document.getElementById('img-update-'+art.id).click()}>
                      <img src={art.imageUrl} alt="" style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}}/>
                      <div style={{position:'absolute',bottom:8,right:8,background:'rgba(0,0,0,0.55)',color:'#fff',padding:'4px 10px',borderRadius:20,fontSize:11,fontWeight:600}}>📷 Tap to change</div>
                    </div>
                  :<div style={{height:120,background:'rgba(182,139,46,0.04)',border:'2px dashed rgba(182,139,46,0.25)',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',flexDirection:'column',gap:6}} onClick={()=>document.getElementById('img-update-'+art.id).click()}>
                      <div style={{fontSize:24}}>🖼</div>
                      <div style={{fontSize:12,fontWeight:600,color:'#b68b2e'}}>Tap to add artwork image</div>
                    </div>
                }
                <input id={'img-update-'+art.id} type="file" accept="image/*" style={{display:'none'}} onChange={async(e)=>{
                  const file=e.target.files[0];if(!file)return;
                  const ext=file.name.split('.').pop().toLowerCase();
                  const path=`artworks/${artist.id}-${art.id}.${ext}`;
                  await supabase.storage.from('artwork-images').upload(path,file,{upsert:true,contentType:file.type});
                  const{data:u}=supabase.storage.from('artwork-images').getPublicUrl(path);
                  const url=u?.publicUrl||'';
                  await supabase.from('artworks').update({image_url:url}).eq('id',art.id);
                  await loadData();
                }}/>
                <div style={{padding:16}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:10,marginBottom:8}}>
                    <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,color:'#1a1714'}}>{art.title}</div>
                    <span style={{fontSize:10,fontWeight:700,padding:'3px 10px',borderRadius:20,flexShrink:0,
                      background:art.status==='Sold'?'rgba(100,140,200,0.12)':art.approvalStatus==='pending'?'rgba(230,190,50,0.12)':'rgba(74,158,107,0.12)',
                      color:art.status==='Sold'?'#648cc8':art.approvalStatus==='pending'?'#e6be32':'#4a9e6b'
                    }}>{art.status==='Sold'?'Sold':art.approvalStatus==='pending'?'⏳ Pending':'✓ Listed'}</span>
                  </div>
                  <div style={{fontSize:12,color:'#8a8070',marginBottom:8}}>{[art.medium,art.dimensions,art.year].filter(Boolean).join(' · ')||'—'}</div>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',fontSize:13}}>
                    <span style={{color:'#8a8070'}}>Value</span>
                    <span style={S.gold}>R {fmt(art.recommendedPrice)}</span>
                  </div>
                  {art.description&&<div style={{fontSize:12,color:'#6b635a',marginTop:8,lineHeight:1.6,fontStyle:'italic'}}>{art.description}</div>}
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
                <div style={{display:'flex',justifyContent:'space-between',flexWrap:'wrap',gap:8,marginBottom:8}}>
                  <div>
                    <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:18,color:'#1a1714',marginBottom:4}}>{sale.artworkTitle}</div>
                    <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
                      <span style={{fontSize:11,color:'#8a8070'}}>{sale.date||sale.createdAt?.slice(0,10)||'—'}</span>
                      <span style={{fontSize:10,fontWeight:600,padding:'2px 8px',borderRadius:4,background:sale.source==='auction'?'rgba(74,158,107,0.12)':'rgba(182,139,46,0.12)',color:sale.source==='auction'?'#4a9e6b':'#b68b2e'}}>{sale.source==='auction'?'⚖ Auction':'Direct'}</span>
                    </div>
                  </div>
                  <div style={{textAlign:'right'}}>
                    <div style={{fontSize:11,color:'#8a8070'}}>Sale price</div>
                    <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,...S.gold}}>R {fmt(sale.salePrice)}</div>
                  </div>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,fontSize:13,marginTop:8,padding:10,background:'rgba(182,139,46,0.04)',borderRadius:8}}>
                  <div style={{color:'#6b635a'}}>Buyer</div><div style={{textAlign:'right',fontWeight:500}}>{sale.buyerName||'—'}</div>
                  {sale.collectorName&&<><div style={{color:'#6b635a'}}>License Holder</div><div style={{textAlign:'right'}}>{sale.collectorName}</div></>}
                  <div style={{color:'#6b635a'}}>Artwork value</div><div style={{textAlign:'right'}}>R {fmt(sale.artworkValue||sale.salePrice)}</div>
                </div>
                {(sale.artistShare||0)>0&&(
                  <div style={{marginTop:10,padding:10,background:'rgba(74,158,107,0.06)',border:'1px solid rgba(74,158,107,0.15)',borderRadius:8,fontSize:13,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <span style={{color:'#6b635a',fontWeight:600}}>Your share (30%)</span>
                    <span style={{...S.green,fontFamily:"'Cormorant Garamond',serif",fontSize:18}}>R {fmt(sale.artistShare)}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {tab==='upload'&&(
          <div>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:24,color:'#1a1714',marginBottom:4}}>Upload Artwork</div>
            <div style={{fontSize:13,color:'#8a8070',marginBottom:20}}>Submit artwork for admin review. Once approved it will appear in the gallery.</div>
            {uploadMsg&&<div style={{padding:'12px 14px',background:uploadMsg.startsWith('success:')?'rgba(74,158,107,0.08)':'rgba(196,92,74,0.08)',border:'1px solid '+(uploadMsg.startsWith('success:')?'rgba(74,158,107,0.2)':'rgba(196,92,74,0.2)'),borderRadius:10,fontSize:13,color:uploadMsg.startsWith('success:')?'#4a9e6b':'#c45c4a',marginBottom:16}}>{uploadMsg.replace('success:','').replace('error:','')}</div>}
            <div style={{background:'#fff',border:'1px solid rgba(182,139,46,0.18)',borderRadius:12,padding:20}}>

              {/* Artwork image upload */}
              <div style={{marginBottom:20}}>
                <label style={{display:'block',fontSize:10,fontWeight:500,letterSpacing:2,textTransform:'uppercase',color:'#6b635a',marginBottom:8}}>Artwork Image</label>
                <div onClick={()=>document.getElementById('artwork-img-input').click()} style={{border:`2px dashed ${uploadImagePreview?'rgba(74,158,107,0.5)':'rgba(182,139,46,0.25)'}`,borderRadius:12,cursor:'pointer',overflow:'hidden',background:uploadImagePreview?'rgba(74,158,107,0.04)':'#f5f3ef',minHeight:140,display:'flex',alignItems:'center',justifyContent:'center',transition:'all 0.2s'}}>
                  {uploadImagePreview?(
                    <div style={{width:'100%',position:'relative'}}>
                      <img src={uploadImagePreview} alt="preview" style={{width:'100%',maxHeight:220,objectFit:'cover',display:'block'}}/>
                      <div style={{position:'absolute',bottom:8,right:8,background:'rgba(74,158,107,0.9)',color:'#fff',padding:'4px 10px',borderRadius:20,fontSize:11,fontWeight:700}}>✓ Image selected</div>
                    </div>
                  ):(
                    <div style={{textAlign:'center',padding:24}}>
                      <div style={{fontSize:32,marginBottom:8}}>🖼</div>
                      <div style={{fontSize:13,fontWeight:600,color:'#6b635a',marginBottom:4}}>Tap to upload artwork photo</div>
                      <div style={{fontSize:11,color:'#8a8070'}}>JPG, PNG or WEBP · Max 10MB</div>
                    </div>
                  )}
                </div>
                <input id="artwork-img-input" type="file" accept="image/*" style={{display:'none'}} onChange={e=>{const file=e.target.files[0];if(!file)return;setUploadImageFile(file);const r=new FileReader();r.onload=ev=>setUploadImagePreview(ev.target.result);r.readAsDataURL(file);}}/>
                {uploadImagePreview&&<button onClick={()=>{setUploadImageFile(null);setUploadImagePreview(null);}} style={{marginTop:8,background:'none',border:'none',color:'#c45c4a',cursor:'pointer',fontSize:12,fontFamily:"'DM Sans',sans-serif"}}>✕ Remove image</button>}
              </div>

              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
                {[['title','Title *','text'],['medium','Medium','text'],['dimensions','Dimensions','text'],['year','Year','number'],['price','Price (R) *','number']].map(([key,label,type])=>(
                  <div key={key} style={{gridColumn:key==='price'?'1/-1':undefined}}>
                    <label style={{display:'block',fontSize:10,fontWeight:500,letterSpacing:2,textTransform:'uppercase',color:'#6b635a',marginBottom:6}}>{label}</label>
                    <input type={type} value={uploadForm[key]||''} onChange={e=>setUploadForm(p=>({...p,[key]:e.target.value}))} style={S.input} placeholder={key==='price'?'e.g. 25000':''}/>
                  </div>
                ))}
                <div style={{gridColumn:'1/-1'}}>
                  <label style={{display:'block',fontSize:10,fontWeight:500,letterSpacing:2,textTransform:'uppercase',color:'#6b635a',marginBottom:6}}>Description</label>
                  <textarea value={uploadForm.description||''} onChange={e=>setUploadForm(p=>({...p,description:e.target.value}))} style={{...S.input,minHeight:80,resize:'vertical'}} placeholder="Describe the artwork, inspiration, technique…"/>
                </div>
              </div>
              <div style={{marginTop:16,padding:'10px 14px',background:'rgba(182,139,46,0.06)',borderRadius:8,fontSize:12,color:'#6b635a',lineHeight:1.6}}>
                ℹ After submission, Vollard Black will review and approve your artwork before it appears in the gallery.
              </div>
              <div style={{display:'flex',justifyContent:'flex-end',marginTop:16}}>
                <button onClick={submitArtwork} disabled={uploading} style={{padding:'13px 32px',borderRadius:8,border:'none',background:'linear-gradient(135deg,#b68b2e,#8a6a1e)',color:'#fff',fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:"'DM Sans',sans-serif",opacity:uploading?0.6:1,boxShadow:'0 4px 14px rgba(182,139,46,0.28)'}}>{uploading?'Submitting…':'Submit for Approval'}</button>
              </div>
            </div>

            {artworks.filter(a=>a.status==='Pending Approval').length>0&&(
              <div style={{marginTop:20}}>
                <div style={{fontSize:11,letterSpacing:2,textTransform:'uppercase',color:'#e6be32',marginBottom:10}}>Pending Approval ({artworks.filter(a=>a.status==='Pending Approval').length})</div>
                {artworks.filter(a=>a.status==='Pending Approval').map(art=>(
                  <div key={art.id} style={{background:'#fff',border:'1px solid rgba(230,190,50,0.25)',borderRadius:10,padding:14,marginBottom:10,display:'flex',gap:14,alignItems:'center'}}>
                    {art.imageUrl&&<img src={art.imageUrl} alt="" style={{width:56,height:56,borderRadius:8,objectFit:'cover',flexShrink:0}}/>}
                    <div style={{flex:1}}>
                      <div style={{fontWeight:600,fontSize:14,color:'#1a1714'}}>{art.title}</div>
                      <div style={{fontSize:12,color:'#8a8070'}}>{art.medium||'—'} · R {fmt(art.recommendedPrice)}</div>
                    </div>
                    <span style={{fontSize:11,fontWeight:600,color:'#e6be32',padding:'3px 10px',background:'rgba(230,190,50,0.12)',borderRadius:6,flexShrink:0}}>⚠ Pending</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab==='profile'&&(
          <div>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20,flexWrap:'wrap',gap:10}}>
              <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:24,color:'#1a1714'}}>My Profile</div>
              {!profileEdit&&<button onClick={()=>setProfileEdit(true)} style={{padding:'10px 20px',borderRadius:8,border:'1px solid rgba(182,139,46,0.30)',background:'transparent',color:'#b68b2e',fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:"'DM Sans',sans-serif"}}>Edit</button>}
            </div>
            {saveMsg&&<div style={{padding:'10px 14px',background:'rgba(74,158,107,0.08)',border:'1px solid rgba(74,158,107,0.2)',borderRadius:8,fontSize:13,color:'#4a9e6b',marginBottom:14}}>✓ {saveMsg}</div>}

            {!profileEdit?(
              <div>
                {/* Personal info */}
                <div style={{...S.card,marginBottom:12}}>
                  <div style={{fontSize:10,fontWeight:700,letterSpacing:'0.18em',textTransform:'uppercase',color:'#b68b2e',marginBottom:14}}>Personal Information</div>
                  {[
                    ['Full Name', artist?.name||'—'],
                    ['Email', artist?.email||session.user.email||'—'],
                    ['Mobile', artist?.mobile||'—'],
                    ['ID / Passport', artist?.idNumber||'—'],
                    ['Nationality', artist?.nationality||'—'],
                    ['City', artist?.city||'—'],
                    ['Country', artist?.country||'—'],
                    ['Address', artist?.address||'—'],
                  ].map(([label,value])=>(
                    <div key={label} style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',padding:'9px 0',borderBottom:'1px solid rgba(182,139,46,0.08)',fontSize:13,gap:12}}>
                      <span style={{color:'#8a8070',flexShrink:0}}>{label}</span>
                      <span style={{fontWeight:500,textAlign:'right',color:'#1a1714'}}>{value}</span>
                    </div>
                  ))}
                </div>

                {/* Artist details */}
                <div style={{...S.card,marginBottom:12}}>
                  <div style={{fontSize:10,fontWeight:700,letterSpacing:'0.18em',textTransform:'uppercase',color:'#b68b2e',marginBottom:14}}>Artist Details</div>
                  {[
                    ['Primary Medium', artist?.medium||'—'],
                    ['Style', artist?.style||'—'],
                    ['Instagram', artist?.instagram?('@'+artist.instagram.replace('@','')):'—'],
                    ['Website', artist?.website||'—'],
                  ].map(([label,value])=>(
                    <div key={label} style={{display:'flex',justifyContent:'space-between',padding:'9px 0',borderBottom:'1px solid rgba(182,139,46,0.08)',fontSize:13,gap:12}}>
                      <span style={{color:'#8a8070',flexShrink:0}}>{label}</span>
                      <span style={{fontWeight:500,textAlign:'right'}}>{value}</span>
                    </div>
                  ))}
                  {artist?.bio&&<div style={{paddingTop:10,fontSize:13,color:'#4a4440',lineHeight:1.7}}>{artist.bio}</div>}
                </div>

                {/* Bank details */}
                <div style={{...S.card}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
                    <div style={{fontSize:10,fontWeight:700,letterSpacing:'0.18em',textTransform:'uppercase',color:'#b68b2e'}}>Banking Details</div>
                    {artist?.bankVerified
                      ?<span style={{fontSize:11,fontWeight:700,color:'#4a9e6b',background:'rgba(74,158,107,0.10)',padding:'3px 10px',borderRadius:20}}>✓ Verified</span>
                      :(artist?.bankName||artist?.accountNumber)
                        ?<span style={{fontSize:11,fontWeight:700,color:'#e6be32',background:'rgba(230,190,50,0.10)',padding:'3px 10px',borderRadius:20}}>⏳ Pending Verification</span>
                        :<span style={{fontSize:11,color:'#8a8070'}}>Not yet added</span>
                    }
                  </div>
                  {artist?.bankName||artist?.accountNumber?(
                    [
                      ['Bank', artist?.bankName||'—'],
                      ['Account Holder', artist?.accountHolder||'—'],
                      ['Account Number', artist?.accountNumber||'—'],
                      ['Branch Code', artist?.branchCode||'—'],
                    ].map(([label,value])=>(
                      <div key={label} style={{display:'flex',justifyContent:'space-between',padding:'9px 0',borderBottom:'1px solid rgba(182,139,46,0.08)',fontSize:13,gap:12}}>
                        <span style={{color:'#8a8070',flexShrink:0}}>{label}</span>
                        <span style={{fontWeight:500}}>{value}</span>
                      </div>
                    ))
                  ):(
                    <div style={{fontSize:13,color:'#8a8070',padding:'8px 0'}}>Add your banking details so Vollard Black can pay your share of sales directly to your account.</div>
                  )}
                </div>
              </div>
            ):(
              <div>
                {/* Edit personal */}
                <div style={{...S.card,marginBottom:12}}>
                  <div style={{fontSize:10,fontWeight:700,letterSpacing:'0.18em',textTransform:'uppercase',color:'#b68b2e',marginBottom:16}}>Personal Information</div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
                    {[['name','Full Name'],['mobile','Mobile'],['city','City'],['country','Country']].map(([key,label])=>(
                      <div key={key}>
                        <label style={S.label}>{label}</label>
                        <input value={profileForm[key]||''} onChange={e=>setProfileForm(p=>({...p,[key]:e.target.value}))} style={S.input}/>
                      </div>
                    ))}
                    <div style={{gridColumn:'1/-1'}}>
                      <label style={S.label}>Address</label>
                      <textarea value={profileForm.address||''} onChange={e=>setProfileForm(p=>({...p,address:e.target.value}))} style={{...S.input,minHeight:60,resize:'vertical'}}/>
                    </div>
                  </div>
                </div>

                {/* Edit artist details */}
                <div style={{...S.card,marginBottom:12}}>
                  <div style={{fontSize:10,fontWeight:700,letterSpacing:'0.18em',textTransform:'uppercase',color:'#b68b2e',marginBottom:16}}>Artist Details</div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
                    {[['medium','Primary Medium'],['style','Style'],['instagram','Instagram'],['website','Website']].map(([key,label])=>(
                      <div key={key}>
                        <label style={S.label}>{label}</label>
                        <input value={profileForm[key]||''} onChange={e=>setProfileForm(p=>({...p,[key]:e.target.value}))} style={S.input} placeholder={key==='instagram'?'@yourhandle':key==='website'?'https://...':''}/>
                      </div>
                    ))}
                    <div style={{gridColumn:'1/-1'}}>
                      <label style={S.label}>Bio / Artist Statement</label>
                      <textarea value={profileForm.bio||''} onChange={e=>setProfileForm(p=>({...p,bio:e.target.value}))} style={{...S.input,minHeight:80,resize:'vertical'}} placeholder="Tell us about your work and practice…"/>
                    </div>
                  </div>
                </div>

                {/* Edit bank details */}
                <div style={{...S.card,marginBottom:12}}>
                  <div style={{fontSize:10,fontWeight:700,letterSpacing:'0.18em',textTransform:'uppercase',color:'#b68b2e',marginBottom:4}}>Banking Details</div>
                  <div style={{fontSize:12,color:'#8a8070',marginBottom:16,lineHeight:1.6}}>Your payout account. Changes require re-verification by Vollard Black before payouts resume.</div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
                    {[['bankName','Bank Name'],['accountHolder','Account Holder'],['accountNumber','Account Number'],['branchCode','Branch Code']].map(([key,label])=>(
                      <div key={key}>
                        <label style={S.label}>{label}</label>
                        <input value={profileForm[key]||''} onChange={e=>setProfileForm(p=>({...p,[key]:e.target.value}))} style={S.input} inputMode={key==='accountNumber'||key==='branchCode'?'numeric':undefined}/>
                      </div>
                    ))}
                  </div>
                  <div style={{marginTop:12,padding:'10px 14px',background:'rgba(230,190,50,0.06)',border:'1px solid rgba(230,190,50,0.20)',borderRadius:8,fontSize:12,color:'#6b635a',lineHeight:1.6}}>
                    ⚠ Saving new bank details will flag your account for verification. Vollard Black will confirm before processing payouts.
                  </div>
                </div>

                <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}>
                  <button onClick={()=>setProfileEdit(false)} style={{padding:'11px 20px',borderRadius:8,border:'1px solid rgba(182,139,46,0.30)',background:'transparent',color:'#b68b2e',fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:"'DM Sans',sans-serif"}}>Cancel</button>
                  <button onClick={saveProfile} disabled={savingProfile} style={{padding:'11px 24px',borderRadius:8,border:'none',background:'linear-gradient(135deg,#b68b2e,#8a6a1e)',color:'#fff',fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:"'DM Sans',sans-serif",opacity:savingProfile?0.6:1}}>{savingProfile?'Saving…':'Save Changes'}</button>
                </div>
              </div>
            )}
          </div>
        )}

        {tab==='terms'&&(
          <div>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:24,color:'#1a1714',marginBottom:16}}>Artist Representation Agreement</div>
            <div style={S.card}>
              <div style={{fontSize:12,color:'#8a8070',marginBottom:16}}>Vollard Black (Pty) Ltd · Hermanus, South Africa</div>
              {[
                ['1. Representation','By registering, you authorise Vollard Black to display, market, and sell your artworks through its platform, gallery network, and auction services.'],
                ['2. Commission Structure','On each sale: Artist Share 30% of gallery commission · Gallery Partner Share 40% · Vollard Black Share 30%. These apply to the license fee (50% of sale price).'],
                ['3. Artwork Submission','All submissions are subject to approval. Vollard Black may decline artworks that do not meet quality standards. Approved works are listed in the gallery.'],
                ['4. Intellectual Property','You retain full copyright. You grant Vollard Black a non-exclusive licence to use artwork images for marketing purposes.'],
                ['5. Authenticity','You warrant that all submitted works are original, created by you, free from third-party claims, and that you have full right to sell them.'],
                ['6. Payment','Artist shares are paid within 14 business days of a confirmed sale to the bank account on file.'],
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
