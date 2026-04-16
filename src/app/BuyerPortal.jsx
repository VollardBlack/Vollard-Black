'use client';
import { useState, useEffect } from "react";
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = supabaseUrl && supabaseKey 
  ? createClient(supabaseUrl, supabaseKey, { auth: { autoRefreshToken: true, persistSession: true } })
  : null;

const fmt = (n) => Number(n||0).toLocaleString('en-ZA',{minimumFractionDigits:2,maximumFractionDigits:2});
const toCamel = (obj) => {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return obj;
  const out = {};
  for (const [k, v] of Object.entries(obj))
    out[k.replace(/_([a-z])/g, (_, c) => c.toUpperCase())] = v;
  return out;
};
const toSnake = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  const out = {};
  for (const [k, v] of Object.entries(obj))
    out[k.replace(/[A-Z]/g, m => '_' + m.toLowerCase())] = v;
  return out;
};

const S = {
  page: { minHeight:'100vh', background:'#f5f3ef', fontFamily:"'DM Sans',sans-serif", color:'#2a2622' },
  card: { background:'#fff', border:'1px solid rgba(182,139,46,0.18)', borderRadius:12, padding:20, marginBottom:16 },
  input: { width:'100%', padding:'12px 14px', background:'#f5f3ef', border:'1px solid rgba(182,139,46,0.25)', borderRadius:8, color:'#1a1714', fontFamily:"'DM Sans',sans-serif", fontSize:14, outline:'none', boxSizing:'border-box' },
  label: { display:'block', fontSize:10, fontWeight:500, letterSpacing:2, textTransform:'uppercase', color:'#6b635a', marginBottom:6 },
  btn: (gold) => ({ padding:'12px 24px', borderRadius:8, border: gold?'none':'1px solid rgba(182,139,46,0.30)', background: gold?'linear-gradient(135deg,#b68b2e,#8a6a1e)':'transparent', color: gold?'#fff':'#b68b2e', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }),
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

function RegisterScreen({onRegistered}) {
  const [form,setForm] = useState({fullName:'',email:'',mobile:'',idNumber:'',nationality:'',address:'',city:'',country:'South Africa',password:'',confirm:'',message:''});
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
      const {data:authData,error:authErr} = await supabase.auth.signUp({email:form.email,password:form.password});
      if(authErr) throw authErr;
      await supabase.from('portal_requests').insert({
        id: authData.user?.id, email:form.email, full_name:form.fullName, mobile:form.mobile, role:'buyer',
        message: [form.idNumber&&'ID: '+form.idNumber,form.nationality&&'Nationality: '+form.nationality,form.city&&'City: '+form.city,form.country&&'Country: '+form.country,form.address&&'Address: '+form.address,form.message].filter(Boolean).join(' | '),
        status:'pending',
      });
      onRegistered(form.email);
    } catch(e) { setError(e.message||'Registration failed.'); }
    setLoading(false);
  };

  return (
    <div style={{...S.page,display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
      <div style={{width:'100%',maxWidth:440}}>
        <Logo sub="Buyer Portal"/>
        <div style={{...S.card,padding:32,boxShadow:'0 8px 32px rgba(0,0,0,0.06)'}}>
          <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,color:'#1a1714',marginBottom:4}}>Request Access</div>
          <div style={{fontSize:12,color:'#8a8070',marginBottom:24}}>Register to browse and purchase artwork from Vollard Black.</div>
          <form onSubmit={handleRegister}>
            {[['fullName','Full Name *','text'],['email','Email *','email'],['mobile','Mobile','text'],['idNumber','ID / Passport Number','text'],['nationality','Nationality','text'],['city','City','text'],['country','Country','text']].map(([key,label,type])=>(
              <div key={key} style={{marginBottom:14}}>
                <label style={S.label}>{label}</label>
                <input type={type} value={form[key]} onChange={e=>s(key,e.target.value)} style={S.input} autoComplete={key==='email'?'email':undefined}/>
              </div>
            ))}
            <div style={{marginBottom:14}}>
              <label style={S.label}>Address</label>
              <textarea value={form.address} onChange={e=>s('address',e.target.value)} style={{...S.input,minHeight:60,resize:'vertical'}}/>
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
              <textarea value={form.message} onChange={e=>s('message',e.target.value)} style={{...S.input,minHeight:60,resize:'vertical'}} placeholder="Tell us about yourself..."/>
            </div>
            {error&&<div style={{padding:'10px 14px',background:'rgba(196,92,74,0.08)',border:'1px solid rgba(196,92,74,0.2)',borderRadius:8,fontSize:13,color:'#c45c4a',marginBottom:14}}>{error}</div>}
            <button type="submit" disabled={loading} style={{...S.btn(true),width:'100%',opacity:loading?0.6:1}}>{loading?'Submitting…':'Submit Registration'}</button>
          </form>
          <div style={{textAlign:'center',marginTop:16,fontSize:12,color:'#8a8070'}}>Already registered? <button onClick={()=>onRegistered(null)} style={{background:'none',border:'none',color:'#b68b2e',cursor:'pointer',fontSize:12,fontFamily:"'DM Sans',sans-serif",textDecoration:'underline'}}>Sign in</button></div>
        </div>
      </div>
    </div>
  );
}

function PendingScreen({email,onSignIn}) {
  return (
    <div style={{...S.page,display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
      <div style={{width:'100%',maxWidth:420,textAlign:'center'}}>
        <Logo sub="Buyer Portal"/>
        <div style={{...S.card,padding:36}}>
          <div style={{fontSize:48,marginBottom:16}}>◆</div>
          <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:24,color:'#1a1714',marginBottom:8}}>Registration Submitted</div>
          <div style={{fontSize:13,color:'#6b635a',lineHeight:1.7,marginBottom:20}}>Thank you. Your registration is under review.<br/>You will be notified once approved.<br/><br/><strong>{email}</strong></div>
          <button onClick={onSignIn} style={{...S.btn(false)}}>Sign In Instead</button>
        </div>
      </div>
    </div>
  );
}

function LoginScreen({onLogin,onRegister}) {
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
        <Logo sub="Buyer Portal"/>
        <div style={{...S.card,padding:32,boxShadow:'0 8px 32px rgba(0,0,0,0.06)'}}>
          <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,color:'#1a1714',marginBottom:4}}>Sign In</div>
          <div style={{fontSize:12,color:'#8a8070',marginBottom:24}}>Browse and purchase fine art from Vollard Black</div>
          <form onSubmit={handleLogin}>
            <div style={{marginBottom:14}}><label style={S.label}>Email</label><input type="email" value={email} onChange={e=>{setEmail(e.target.value);setError('');}} style={S.input} autoComplete="email"/></div>
            <div style={{marginBottom:20}}>
              <label style={S.label}>Password</label>
              <div style={{position:'relative'}}>
                <input type={showPw?'text':'password'} value={password} onChange={e=>{setPassword(e.target.value);setError('');}} style={{...S.input,paddingRight:56}} autoComplete="current-password"/>
                <button type="button" onClick={()=>setShowPw(p=>!p)} style={{position:'absolute',right:12,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',color:'#8a8070',cursor:'pointer',fontSize:12}}>{showPw?'Hide':'Show'}</button>
              </div>
            </div>
            {error&&<div style={{padding:'10px 14px',background:'rgba(196,92,74,0.08)',border:'1px solid rgba(196,92,74,0.2)',borderRadius:8,fontSize:13,color:'#c45c4a',marginBottom:14}}>{error}</div>}
            <button type="submit" disabled={loading} style={{...S.btn(true),width:'100%',opacity:loading?0.6:1}}>{loading?'Signing in…':'Sign In'}</button>
          </form>
          <div style={{textAlign:'center',marginTop:16,fontSize:12,color:'#8a8070'}}>Not registered? <button onClick={onRegister} style={{background:'none',border:'none',color:'#b68b2e',cursor:'pointer',fontSize:12,fontFamily:"'DM Sans',sans-serif",textDecoration:'underline'}}>Request Access</button></div>
        </div>
      </div>
    </div>
  );
}

function NotApprovedScreen({onSignOut,status}) {
  return (
    <div style={{...S.page,display:'flex',alignItems:'center',justifyContent:'center',padding:20,flexDirection:'column',gap:16}}>
      <Logo sub="Buyer Portal"/>
      <div style={{...S.card,padding:36,textAlign:'center',maxWidth:420,width:'100%'}}>
        <div style={{fontSize:48,marginBottom:16}}>{status==='rejected'?'✗':'⏳'}</div>
        <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,color:'#1a1714',marginBottom:8}}>{status==='rejected'?'Registration Declined':'Awaiting Approval'}</div>
        <div style={{fontSize:13,color:'#6b635a',lineHeight:1.7,marginBottom:20}}>{status==='rejected'?'Your registration was not approved. Please contact Vollard Black.':'Your account is pending approval. Please check back soon.'}</div>
        <button onClick={onSignOut} style={S.btn(false)}>Sign Out</button>
      </div>
    </div>
  );
}

function BuyerDashboard({session}) {
  const [tab,setTab] = useState('gallery');
  const [buyer,setBuyer] = useState(null);
  const [artworks,setArtworks] = useState([]);
  const [auctions,setAuctions] = useState([]);
  const [bids,setBids] = useState([]);
  const [purchases,setPurchases] = useState([]);
  const [loading,setLoading] = useState(true);
  const [enquiry,setEnquiry] = useState(null);
  const [profileEdit,setProfileEdit] = useState(false);
  const [profileForm,setProfileForm] = useState({});
  const [saving,setSaving] = useState(false);
  const [saveMsg,setSaveMsg] = useState('');
  const [enquiryMsg,setEnquiryMsg] = useState('');
  const [zoomImg,setZoomImg] = useState(null);
  const [search,setSearch] = useState('');

  useEffect(()=>{ loadData(); },[session]);

  // Real-time listener for live auction updates
  useEffect(()=>{
    if(!session) return;
    const ch = supabase.channel('buyer-auctions')
      .on('postgres_changes',{event:'*',schema:'public',table:'auctions'},()=>loadData())
      .on('postgres_changes',{event:'*',schema:'public',table:'bids'},()=>loadData())
      .subscribe();
    return ()=>supabase.removeChannel(ch);
  },[session]);

  const loadData = async() => {
    setLoading(true);
    try {
      const {data:buyers} = await supabase.from('buyers').select('*').eq('email',session.user.email);
      if(buyers&&buyers.length>0){ const b=toCamel(buyers[0]); setBuyer(b); setProfileForm(b); }

      // Available artworks
      const {data:arts} = await supabase.from('artworks').select('*').in('status',['Available','Reserved','In Gallery']).order('created_at',{ascending:false});
      setArtworks((arts||[]).map(toCamel));

      // Auctions with artwork images
      const {data:aucs} = await supabase.from('auctions').select('*').in('status',['Live','Draft','Sold','No Sale']).order('created_at',{ascending:false});
      // Fetch artwork images for each auction
      const aucsWithImages = await Promise.all((aucs||[]).map(async(auc)=>{
        if(auc.artwork_id){
          const {data:art} = await supabase.from('artworks').select('image_url').eq('id',auc.artwork_id).single();
          return {...toCamel(auc), imageUrl: art?.image_url||null};
        }
        return toCamel(auc);
      }));
      setAuctions(aucsWithImages);

      if(buyers&&buyers.length>0){
        const {data:myBids} = await supabase.from('bids').select('*').eq('buyer_id',buyers[0].id).order('timestamp',{ascending:false});
        setBids((myBids||[]).map(toCamel));
        const {data:sales} = await supabase.from('sales').select('*').eq('buyer_id',buyers[0].id);
        setPurchases((sales||[]).map(toCamel));
      }
    } catch(e){ console.error(e); }
    setLoading(false);
  };

  const saveProfile = async() => {
    if(!buyer) return;
    setSaving(true);
    const snake = toSnake(profileForm);
    delete snake.id;
    await supabase.from('buyers').update(snake).eq('id',buyer.id);
    setBuyer({...buyer,...profileForm});
    setSaveMsg('Profile updated successfully.');
    setTimeout(()=>setSaveMsg(''),3000);
    setSaving(false);
    setProfileEdit(false);
  };

  const sendEnquiry = async() => {
    const art = enquiry;
    const buyerName = buyer?`${buyer.firstName||''} ${buyer.lastName||''}`.trim()||buyer.companyName||'':session.user.email.split('@')[0];
    const buyerMobile = buyer?.mobile||'';

    // Save enquiry to Supabase so admin sees notification
    try {
      await supabase.from('enquiries').insert({
        id: crypto.randomUUID(),
        artwork_id: art.id,
        artwork_title: art.title,
        buyer_id: buyer?.id||null,
        buyer_name: buyerName,
        buyer_email: session.user.email,
        buyer_mobile: buyerMobile,
        message: `Interested in purchasing "${art.title}" — R ${fmt(art.recommendedPrice)}`,
        read: false,
        created_at: new Date().toISOString(),
      });
    } catch(e) { console.error('Enquiry save failed:', e); }

    // Open WhatsApp to Vollard Black
    const waMsg = encodeURIComponent(
      `Hi Vollard Black,\n\nI am interested in purchasing the following artwork:\n\n*${art.title}*\nArtist: ${art.artist||'—'}\nValue: R ${fmt(art.recommendedPrice)}\n\nPlease contact me to discuss.\n\nKind regards,\n${buyerName}${buyerMobile?' — '+buyerMobile:''}`
    );
    window.open(`https://wa.me/27826503393?text=${waMsg}`, '_blank');

    setEnquiryMsg('Enquiry sent! Vollard Black will contact you shortly.');
    setTimeout(()=>setEnquiryMsg(''),5000);
    setEnquiry(null);
  };
  const signOut = () => supabase.auth.signOut();
  const displayName = buyer?`${buyer.firstName||''} ${buyer.lastName||''}`.trim()||buyer.companyName||'':session.user.email.split('@')[0];
  const liveAuctions = auctions.filter(a=>a.status==='Live');
  const filteredArts = artworks.filter(a=>(a.title+' '+(a.artist||'')+' '+(a.galleryName||'')).toLowerCase().includes(search.toLowerCase()));

  if(loading) return <div style={{...S.page,display:'flex',alignItems:'center',justifyContent:'center'}}><div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:24,color:'#b68b2e',letterSpacing:6,opacity:0.6}}>Loading…</div></div>;

  return (
    <div style={S.page}>
      {/* Header */}
      <div style={{background:'#fff',borderBottom:'1px solid rgba(182,139,46,0.20)',padding:'14px 20px',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:10}}>
        <div>
          <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:18,fontWeight:300,letterSpacing:5,color:'#1a1714'}}>VOLLARD <span style={{color:'#b68b2e'}}>BLACK</span></div>
          <div style={{fontSize:9,letterSpacing:3,textTransform:'uppercase',color:'#8a8070'}}>Buyer Portal</div>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <span style={{fontSize:13,color:'#1a1714',fontWeight:500}}>{displayName}</span>
          <button onClick={signOut} style={{padding:'8px 16px',borderRadius:6,border:'1px solid rgba(182,139,46,0.25)',background:'transparent',color:'#8a8070',cursor:'pointer',fontSize:11,fontFamily:"'DM Sans',sans-serif"}}>Sign Out</button>
        </div>
      </div>

      <div style={{maxWidth:1000,margin:'0 auto',padding:'20px 16px'}}>
        {/* Auction live banner */}
        {liveAuctions.length>0&&(
          <div onClick={()=>setTab('auctions')} style={{padding:'12px 18px',background:'rgba(74,158,107,0.08)',border:'1px solid rgba(74,158,107,0.25)',borderRadius:10,marginBottom:16,cursor:'pointer',display:'flex',alignItems:'center',gap:10}}>
            <span style={{color:'#4a9e6b',fontSize:16}}>●</span>
            <span style={{fontSize:13,fontWeight:600,color:'#4a9e6b'}}>{liveAuctions.length} live auction{liveAuctions.length>1?'s':''} happening now</span>
            <span style={{fontSize:11,color:'#4a9e6b',marginLeft:'auto'}}>View →</span>
          </div>
        )}

        {enquiryMsg&&<div style={{padding:'12px 16px',background:'rgba(74,158,107,0.08)',border:'1px solid rgba(74,158,107,0.2)',borderRadius:8,marginBottom:14,fontSize:13,color:'#4a9e6b'}}>{enquiryMsg}</div>}

        {/* Tabs */}
        <div style={{display:'flex',borderBottom:'1px solid rgba(182,139,46,0.15)',marginBottom:20,gap:4,overflowX:'auto'}}>
          {[['gallery','Gallery'+(artworks.length>0?' ('+artworks.length+')':'')],['auctions','Auctions'+(liveAuctions.length>0?' 🔴':'')],['mybids','My Bids'],['purchases','Purchases'],['profile','My Profile']].map(([id,lbl])=>(
            <button key={id} onClick={()=>setTab(id)} style={S.tab(tab===id)}>{lbl}</button>
          ))}
        </div>

        {/* GALLERY TAB */}
        {tab==='gallery'&&(
          <div>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:10,marginBottom:20}}>
              <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:28,fontWeight:300,color:'#1a1714'}}>Available Artworks</div>
              <input placeholder="Search artworks..." value={search} onChange={e=>setSearch(e.target.value)} style={{...S.input,maxWidth:260,padding:'10px 14px'}}/>
            </div>
            {filteredArts.length===0?(
              <div style={{...S.card,textAlign:'center',padding:48}}>
                <div style={{fontSize:32,marginBottom:12}}>◆</div>
                <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,color:'#1a1714',marginBottom:8}}>No Artworks Available</div>
                <div style={{fontSize:13,color:'#8a8070'}}>Check back soon for new additions.</div>
              </div>
            ):(
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:20}}>
                {filteredArts.map(art=>(
                  <div key={art.id} style={{background:'#fff',border:'1px solid rgba(182,139,46,0.18)',borderRadius:12,overflow:'hidden',transition:'box-shadow 0.2s'}}>
                    {/* Image */}
                    <div style={{height:220,background:'#f0ede8',overflow:'hidden',position:'relative'}}>
                      {art.imageUrl
                        ?<img src={art.imageUrl} alt={art.title} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                        :<div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',color:'#b68b2e',fontSize:32}}>◆</div>
                      }
                    </div>
                    {/* Info */}
                    <div style={{padding:16}}>
                      <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:18,color:'#1a1714',marginBottom:2}}>{art.title}</div>
                      <div style={{fontSize:12,color:'#8a8070',marginBottom:8}}>{art.artist||'—'} · {art.medium||'—'} · {art.year||'—'}</div>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
                        <div>
                          <div style={{fontSize:10,color:'#8a8070',letterSpacing:1,textTransform:'uppercase'}}>Price</div>
                          <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,...S.gold}}>R {fmt(art.recommendedPrice)}</div>
                        </div>
                        {art.galleryName&&<div style={{fontSize:11,color:'#8a8070',textAlign:'right'}}>{art.galleryName}</div>}
                      </div>
                      {art.description&&<div style={{fontSize:12,color:'#6b635a',marginBottom:12,fontStyle:'italic',lineHeight:1.5}}>{art.description}</div>}
                      {art.status==='Reserved'?(
                        <div style={{padding:'10px',background:'rgba(182,139,46,0.08)',border:'1px solid rgba(182,139,46,0.20)',borderRadius:8,textAlign:'center',fontSize:12,color:'#b68b2e',fontWeight:600}}>
                          ⚖ Currently in Auction
                        </div>
                      ):(
                        <button onClick={()=>setEnquiry(art)} style={{...S.btn(true),width:'100%',padding:'10px',fontSize:12}}>Enquire to Purchase</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* AUCTIONS TAB */}
        {tab==='auctions'&&(
          <div>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:28,fontWeight:300,color:'#1a1714',marginBottom:8}}>Auctions</div>
            <div style={{fontSize:13,color:'#8a8070',marginBottom:20}}>KYC verification required to bid. Contact Vollard Black to participate.</div>

            {/* Auction access request */}
            {buyer&&!buyer.auctionApproved&&(
              <div style={{padding:'16px 18px',background:'rgba(182,139,46,0.06)',border:'1px solid rgba(182,139,46,0.25)',borderRadius:12,marginBottom:20}}>
                <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:18,color:'#1a1714',marginBottom:6}}>Request Bidding Access</div>
                <div style={{fontSize:13,color:'#6b635a',marginBottom:14,lineHeight:1.6}}>To place bids you need to be KYC verified. Click the button below — Vollard Black will be notified via WhatsApp and activate your access.</div>
                <button onClick={async()=>{
                  if(!buyer?.id)return;
                  try{
                    await supabase.from('buyers').update({auction_requested:true,auction_requested_at:new Date().toISOString()}).eq('id',buyer.id);
                    const msg=encodeURIComponent('Hi Vollard Black, I would like to request auction bidding access. Name: '+displayName+' | Email: '+session.user.email+' | ID: '+(buyer.idNumber||'—')+'. Please verify my account. Thank you.');
                    window.open('https://wa.me/27826503393?text='+msg,'_blank');
                    alert('Request sent! Vollard Black will review and activate your auction access.');
                  }catch(e){console.error(e);}
                }} style={{padding:'12px 28px',borderRadius:8,border:'none',background:'linear-gradient(135deg,#b68b2e,#8a6a1e)',color:'#fff',fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:"'DM Sans',sans-serif"}}>
                  Request Auction Access via WhatsApp
                </button>
              </div>
            )}
            {buyer&&buyer.auctionApproved&&(
              <div style={{padding:'10px 16px',background:'rgba(74,158,107,0.06)',border:'1px solid rgba(74,158,107,0.2)',borderRadius:10,marginBottom:16,display:'flex',alignItems:'center',gap:8}}>
                <span style={{color:'#4a9e6b'}}>✓</span>
                <span style={{fontSize:13,fontWeight:600,color:'#4a9e6b'}}>Auction access approved — contact Vollard Black to place bids</span>
              </div>
            )}

            {auctions.length===0?(
              <div style={{...S.card,textAlign:'center',padding:48}}>
                <div style={{fontSize:32,marginBottom:12}}>◆</div>
                <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,color:'#1a1714',marginBottom:8}}>No Auctions</div>
                <div style={{fontSize:13,color:'#8a8070'}}>No auctions at the moment. Check back soon.</div>
              </div>
            ):auctions.map(auc=>{
              const myBid=bids.find(b=>b.auctionId===auc.id);
              const isLeading=auc.leadBidderId===buyer?.id;
              const isLive=auc.status==='Live';
              return(
                <div key={auc.id} style={{...S.card,overflow:'hidden',padding:0,borderLeft:`3px solid ${isLeading?'#4a9e6b':isLive?'#c45c4a':'rgba(182,139,46,0.30)'}`}}>
                  {/* Artwork image with zoom */}
                  {auc.imageUrl&&(
                    <div style={{position:'relative',height:220,overflow:'hidden',cursor:'zoom-in',background:'#f0ede8'}}
                      onClick={()=>setZoomImg(auc.imageUrl)}>
                      <img src={auc.imageUrl} alt={auc.title} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                      <div style={{position:'absolute',bottom:8,right:8,background:'rgba(0,0,0,0.5)',borderRadius:6,padding:'4px 8px',fontSize:10,color:'#fff',letterSpacing:1}}>🔍 ZOOM</div>
                      {isLive&&<div style={{position:'absolute',top:10,left:10,background:'#c45c4a',borderRadius:6,padding:'4px 10px',fontSize:10,fontWeight:700,color:'#fff',letterSpacing:1}}>● LIVE</div>}
                    </div>
                  )}
                  {!auc.imageUrl&&isLive&&(
                    <div style={{background:'rgba(196,92,74,0.08)',padding:'8px 16px',display:'flex',alignItems:'center',gap:6}}>
                      <span style={{fontSize:10,fontWeight:700,color:'#c45c4a'}}>● LIVE AUCTION</span>
                    </div>
                  )}
                  <div style={{padding:16}}>
                    <div style={{display:'flex',justifyContent:'space-between',flexWrap:'wrap',gap:10,marginBottom:10}}>
                      <div>
                        <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,color:'#1a1714',marginBottom:4}}>{auc.title}</div>
                        <div style={{fontSize:12,color:'#8a8070'}}>{auc.artist||'—'} · {auc.galleryName||'—'}</div>
                        {isLeading&&<div style={{fontSize:11,fontWeight:600,color:'#4a9e6b',marginTop:4}}>● You are the leading bidder</div>}
                        {myBid&&!isLeading&&isLive&&<div style={{fontSize:11,color:'#c45c4a',marginTop:4}}>⚠ You have been outbid</div>}
                      </div>
                      <div style={{textAlign:'right'}}>
                        <div style={{fontSize:10,color:'#8a8070',letterSpacing:1,textTransform:'uppercase'}}>Current Bid</div>
                        <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:26,...S.gold}}>R {fmt(auc.currentBid||0)}</div>
                        <div style={{fontSize:11,color:'#8a8070'}}>Reserve: R {fmt(auc.reservePrice)}</div>
                      </div>
                    </div>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6,fontSize:12}}>
                      <div><span style={{color:'#8a8070'}}>Bids: </span><span>{auc.bidsCount||0}</span></div>
                      <div><span style={{color:'#8a8070'}}>Status: </span><span style={{fontWeight:600,color:auc.status==='Sold'?'#4a9e6b':auc.status==='Live'?'#c45c4a':'#8a8070'}}>{auc.status}</span></div>
                      {myBid&&<div><span style={{color:'#8a8070'}}>Your bid: </span><span style={S.gold}>R {fmt(myBid.amount)}</span></div>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* MY BIDS TAB */}
        {tab==='mybids'&&(
          <div>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:28,fontWeight:300,color:'#1a1714',marginBottom:20}}>My Bids</div>
            {bids.length===0?(
              <div style={{...S.card,textAlign:'center',padding:40}}><div style={{fontSize:14,color:'#8a8070'}}>No bids placed yet.</div></div>
            ):(
              <div style={S.card}>
                <div style={{overflowX:'auto'}}>
                  <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
                    <thead><tr style={{borderBottom:'1px solid rgba(182,139,46,0.2)'}}>
                      {['Artwork','Amount','Date','Status'].map(h=><th key={h} style={{padding:'8px 10px',textAlign:h==='Amount'?'right':'left',fontSize:10,letterSpacing:1,textTransform:'uppercase',color:'#8a8070',fontWeight:500}}>{h}</th>)}
                    </tr></thead>
                    <tbody>
                      {bids.map(b=>{
                        const auc=auctions.find(a=>a.id===b.auctionId);
                        const won=auc?.status==='Sold'&&auc?.leadBidderId===buyer?.id;
                        const leading=auc?.status==='Live'&&auc?.leadBidderId===buyer?.id;
                        return(
                          <tr key={b.id} style={{borderBottom:'1px solid rgba(182,139,46,0.08)'}}>
                            <td style={{padding:'10px 10px',fontWeight:500}}>{auc?.title||'—'}</td>
                            <td style={{padding:'10px 10px',textAlign:'right',...S.gold}}>R {fmt(b.amount)}</td>
                            <td style={{padding:'10px 10px',color:'#8a8070'}}>{b.timestamp?.slice(0,10)||'—'}</td>
                            <td style={{padding:'10px 10px'}}>{won?<span style={{fontSize:11,fontWeight:600,...S.green}}>Won</span>:leading?<span style={{fontSize:11,fontWeight:600,...S.green}}>● Leading</span>:<span style={{fontSize:11,color:'#8a8070'}}>Outbid</span>}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* PURCHASES TAB */}
        {tab==='purchases'&&(
          <div>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:28,fontWeight:300,color:'#1a1714',marginBottom:20}}>Purchases</div>
            {purchases.length===0?(
              <div style={{...S.card,textAlign:'center',padding:40}}><div style={{fontSize:14,color:'#8a8070'}}>No purchases yet.</div></div>
            ):purchases.map(p=>(
              <div key={p.id} style={S.card}>
                <div style={{display:'flex',justifyContent:'space-between',flexWrap:'wrap',gap:8}}>
                  <div>
                    <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,color:'#1a1714'}}>{p.artworkTitle}</div>
                    <div style={{fontSize:12,color:'#8a8070',marginTop:2}}>{p.date||p.createdAt?.slice(0,10)||'—'}</div>
                  </div>
                  <div style={{textAlign:'right'}}>
                    <div style={{fontSize:11,color:'#8a8070'}}>Purchase price</div>
                    <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:24,...S.gold}}>R {fmt(p.salePrice)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* PROFILE TAB */}
        {tab==='profile'&&(
          <div>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20,flexWrap:'wrap',gap:10}}>
              <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:28,fontWeight:300,color:'#1a1714'}}>My Profile</div>
              {!profileEdit&&<button onClick={()=>setProfileEdit(true)} style={S.btn(false)}>Edit Profile</button>}
            </div>
            {saveMsg&&<div style={{padding:'10px 14px',background:'rgba(74,158,107,0.08)',border:'1px solid rgba(74,158,107,0.2)',borderRadius:8,fontSize:13,color:'#4a9e6b',marginBottom:14}}>✓ {saveMsg}</div>}
            {!buyer?(
              <div style={{...S.card,textAlign:'center',padding:40}}><div style={{fontSize:14,color:'#8a8070'}}>Profile not linked yet. Contact Vollard Black.</div></div>
            ):!profileEdit?(
              <div style={S.card}>
                {[['Name',`${buyer.firstName||''} ${buyer.lastName||''}`.trim()||buyer.companyName||'—'],['Email',buyer.email||'—'],['Mobile',buyer.mobile||'—'],['ID / Passport',buyer.idNumber||'—'],['Nationality',buyer.nationality||'—'],['City',buyer.city||'—'],['Country',buyer.country||'—'],['KYC Status',buyer.kycStatus==='approved'?'✓ Approved':'⚠ Pending'],['Auction Access',buyer.auctionApproved?'✓ Approved':'Pending']].map(([label,value])=>(
                  <div key={label} style={{display:'flex',justifyContent:'space-between',padding:'10px 0',borderBottom:'1px solid rgba(182,139,46,0.08)',fontSize:13}}>
                    <span style={{color:'#8a8070'}}>{label}</span>
                    <span style={{fontWeight:500,color:value?.toString().includes('✓')?'#4a9e6b':value?.toString().includes('⚠')?'#e6be32':'#1a1714'}}>{value}</span>
                  </div>
                ))}
              </div>
            ):(
              <div style={S.card}>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
                  {[['firstName','First Name'],['lastName','Last Name'],['mobile','Mobile'],['idNumber','ID / Passport'],['nationality','Nationality'],['city','City'],['country','Country']].map(([key,label])=>(
                    <div key={key}>
                      <label style={S.label}>{label}</label>
                      <input value={profileForm[key]||''} onChange={e=>setProfileForm(p=>({...p,[key]:e.target.value}))} style={S.input}/>
                    </div>
                  ))}
                  <div style={{gridColumn:'1/-1'}}>
                    <label style={S.label}>Address</label>
                    <textarea value={profileForm.address||''} onChange={e=>setProfileForm(p=>({...p,address:e.target.value}))} style={{...S.input,minHeight:70,resize:'vertical'}}/>
                  </div>
                </div>
                <div style={{display:'flex',gap:10,marginTop:16,justifyContent:'flex-end'}}>
                  <button onClick={()=>setProfileEdit(false)} style={S.btn(false)}>Cancel</button>
                  <button onClick={saveProfile} disabled={saving} style={{...S.btn(true),opacity:saving?0.6:1}}>{saving?'Saving…':'Save Profile'}</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Zoom Modal */}
      {zoomImg&&(
        <div onClick={()=>setZoomImg(null)} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.92)',zIndex:300,display:'flex',alignItems:'center',justifyContent:'center',padding:20,cursor:'zoom-out'}}>
          <button onClick={()=>setZoomImg(null)} style={{position:'absolute',top:20,right:24,background:'none',border:'none',color:'rgba(255,255,255,0.7)',fontSize:36,cursor:'pointer',lineHeight:1}}>×</button>
          <img src={zoomImg} alt="" style={{maxWidth:'100%',maxHeight:'90vh',objectFit:'contain',borderRadius:8,boxShadow:'0 24px 64px rgba(0,0,0,0.5)'}}/>
        </div>
      )}

      {/* Enquiry Modal */}
      {enquiry&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',zIndex:200,display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
          <div style={{background:'#fff',borderRadius:16,padding:28,maxWidth:460,width:'100%'}}>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,color:'#1a1714',marginBottom:4}}>Enquire to Purchase</div>
            <div style={{fontSize:12,color:'#8a8070',marginBottom:20}}>Clicking Send will open your email app with a pre-filled message to Vollard Black.</div>
            <div style={{display:'flex',gap:14,marginBottom:16}}>
              {enquiry.imageUrl&&<div style={{width:80,height:80,borderRadius:8,overflow:'hidden',flexShrink:0}}><img src={enquiry.imageUrl} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/></div>}
              <div>
                <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:18,color:'#1a1714'}}>{enquiry.title}</div>
                <div style={{fontSize:12,color:'#8a8070',marginTop:2}}>{enquiry.artist||'—'} · {enquiry.medium||'—'}</div>
                <div style={{fontSize:16,fontWeight:600,color:'#b68b2e',marginTop:4}}>R {fmt(enquiry.recommendedPrice)}</div>
              </div>
            </div>
            <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}>
              <button onClick={()=>setEnquiry(null)} style={S.btn(false)}>Cancel</button>
              <button onClick={sendEnquiry} style={S.btn(true)}>Send Enquiry</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function BuyerPortal() {
  const [session,setSession] = useState(undefined);
  const [screen,setScreen] = useState('login');
  const [pendingEmail,setPendingEmail] = useState('');
  const [requestStatus,setRequestStatus] = useState(null);

  useEffect(()=>{
    if(supabase)supabase.auth.getSession().then(({data})=>setSession(data?.session||null));else setSession(null);
    const {data:{subscription}} = supabase?supabase.auth.onAuthStateChange((_,s)=>setSession(s)):{data:{subscription:{unsubscribe:()=>{}}}};
    return ()=>subscription.unsubscribe();
  },[]);

  useEffect(()=>{
    if(!session){setRequestStatus(null);return;}
    supabase.from('portal_requests').select('status').eq('email',session.user.email).single()
      .then(({data})=>setRequestStatus(data?.status||'pending'));
  },[session]);

  if(session===undefined) return <div style={{minHeight:'100vh',background:'#f5f3ef',display:'flex',alignItems:'center',justifyContent:'center'}}><div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:24,letterSpacing:8,color:'#b68b2e',opacity:0.5}}>VOLLARD BLACK</div></div>;
  if(!session){
    if(screen==='register') return <RegisterScreen onRegistered={(email)=>{if(email){setPendingEmail(email);setScreen('pending');}else{setScreen('login');}}}/>;
    if(screen==='pending') return <PendingScreen email={pendingEmail} onSignIn={()=>setScreen('login')}/>;
    return <LoginScreen onLogin={s=>setSession(s)} onRegister={()=>setScreen('register')}/>;
  }
  if(requestStatus===null) return <div style={{minHeight:'100vh',background:'#f5f3ef',display:'flex',alignItems:'center',justifyContent:'center'}}><div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:18,color:'#b68b2e',opacity:0.5}}>Checking access…</div></div>;
  if(requestStatus!=='approved') return <NotApprovedScreen status={requestStatus} onSignOut={()=>supabase.auth.signOut()}/>;
  return <BuyerDashboard session={session}/>;
}
