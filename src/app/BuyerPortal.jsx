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
  red: { color:'#c45c4a', fontWeight:600 },
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
  const [form,setForm] = useState({
    fullName:'', email:'', mobile:'', idNumber:'', nationality:'',
    address:'', city:'', country:'South Africa',
    password:'', confirm:'', message:''
  });
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
        email: form.email, password: form.password,
      });
      if(authErr) throw authErr;
      await supabase.from('portal_requests').insert({
        id: authData.user?.id,
        email: form.email,
        full_name: form.fullName,
        mobile: form.mobile,
        role: 'buyer',
        message: [
          form.idNumber&&'ID: '+form.idNumber,
          form.nationality&&'Nationality: '+form.nationality,
          form.city&&'City: '+form.city,
          form.country&&'Country: '+form.country,
          form.address&&'Address: '+form.address,
          form.message
        ].filter(Boolean).join(' | '),
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
        <Logo sub="Buyer Portal"/>
        <div style={{...S.card, padding:32, boxShadow:'0 8px 32px rgba(0,0,0,0.06)'}}>
          <div style={{fontFamily:"'Cormorant Garamond',serif", fontSize:22, color:'#1a1714', marginBottom:4}}>Request Access</div>
          <div style={{fontSize:12, color:'#8a8070', marginBottom:24}}>Register to participate in Vollard Black auctions. All registrations are reviewed before access is granted.</div>
          <form onSubmit={handleRegister}>
            {[
              ['fullName','Full Name *','Your full name','text'],
              ['email','Email *','your@email.com','email'],
              ['mobile','Mobile','+27 82 000 0000','text'],
              ['idNumber','ID / Passport Number','ID or passport number','text'],
              ['nationality','Nationality','e.g. South African','text'],
              ['city','City','Your city','text'],
              ['country','Country','South Africa','text'],
            ].map(([key,label,placeholder,type])=>(
              <div key={key} style={{marginBottom:14}}>
                <label style={S.label}>{label}</label>
                <input type={type} value={form[key]} onChange={e=>s(key,e.target.value)} style={S.input} placeholder={placeholder} autoComplete={key==='email'?'email':undefined}/>
              </div>
            ))}
            <div style={{marginBottom:14}}>
              <label style={S.label}>Address</label>
              <textarea value={form.address} onChange={e=>s('address',e.target.value)} style={{...S.input,minHeight:60,resize:'vertical'}} placeholder="Your address"/>
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
            <button type="submit" disabled={loading} style={{...S.btn(true),opacity:loading?0.6:1}}>{loading?'Submitting…':'Submit Registration'}</button>
          </form>
          <div style={{textAlign:'center',marginTop:16,fontSize:12,color:'#8a8070'}}>
            Already registered?{' '}
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
        <Logo sub="Buyer Portal"/>
        <div style={{...S.card,padding:36}}>
          <div style={{fontSize:48,marginBottom:16}}>◆</div>
          <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:24,color:'#1a1714',marginBottom:8}}>Registration Submitted</div>
          <div style={{fontSize:13,color:'#6b635a',lineHeight:1.7,marginBottom:20}}>
            Thank you. Your registration has been sent to Vollard Black for review.<br/>
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
        <Logo sub="Buyer Portal"/>
        <div style={{...S.card,padding:32,boxShadow:'0 8px 32px rgba(0,0,0,0.06)'}}>
          <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,color:'#1a1714',marginBottom:4}}>Sign In</div>
          <div style={{fontSize:12,color:'#8a8070',marginBottom:24}}>Access your Vollard Black buyer account</div>
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
            Not registered?{' '}
            <button onClick={onRegister} style={{background:'none',border:'none',color:'#b68b2e',cursor:'pointer',fontSize:12,fontFamily:"'DM Sans',sans-serif",textDecoration:'underline'}}>Request Access</button>
          </div>
        </div>
        <div style={{textAlign:'center',marginTop:20,fontSize:11,color:'#a09890'}}>Vollard Black (Pty) Ltd · Hermanus, South Africa</div>
      </div>
    </div>
  );
}

// ── Not Approved ──────────────────────────────────────────
function NotApprovedScreen({onSignOut, status}) {
  return (
    <div style={{...S.page,display:'flex',alignItems:'center',justifyContent:'center',padding:20,flexDirection:'column',gap:16}}>
      <Logo sub="Buyer Portal"/>
      <div style={{...S.card,padding:36,textAlign:'center',maxWidth:420,width:'100%'}}>
        <div style={{fontSize:48,marginBottom:16}}>{status==='rejected'?'✗':'⏳'}</div>
        <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,color:'#1a1714',marginBottom:8}}>
          {status==='rejected'?'Registration Declined':'Awaiting Approval'}
        </div>
        <div style={{fontSize:13,color:'#6b635a',lineHeight:1.7,marginBottom:20}}>
          {status==='rejected'
            ?'Your registration was not approved. Please contact Vollard Black directly for more information.'
            :'Your account is pending approval from Vollard Black. Please check back soon or contact us directly.'
          }
        </div>
        <button onClick={onSignOut} style={{...S.btn(false),width:'auto',padding:'10px 24px'}}>Sign Out</button>
      </div>
    </div>
  );
}

// ── Buyer Dashboard ───────────────────────────────────────
function BuyerDashboard({session}) {
  const [tab,setTab] = useState('auctions');
  const [buyer,setBuyer] = useState(null);
  const [auctions,setAuctions] = useState([]);
  const [bids,setBids] = useState([]);
  const [purchases,setPurchases] = useState([]);
  const [loading,setLoading] = useState(true);

  useEffect(()=>{ loadData(); },[session]);

  const loadData = async() => {
    setLoading(true);
    try {
      // Load buyer record
      const {data:buyers} = await supabase.from('buyers').select('*').eq('email',session.user.email);
      if(buyers&&buyers.length>0) setBuyer(toCamel(buyers[0]));

      // Load live and recent auctions
      const {data:aucs} = await supabase.from('auctions').select('*').in('status',['Live','Draft','Sold','No Sale']).order('created_at',{ascending:false});
      setAuctions((aucs||[]).map(toCamel));

      // Load this buyer's bids
      if(buyers&&buyers.length>0){
        const {data:myBids} = await supabase.from('bids').select('*').eq('buyer_id',buyers[0].id).order('timestamp',{ascending:false});
        setBids((myBids||[]).map(toCamel));

        // Load purchases
        const {data:sales} = await supabase.from('sales').select('*').eq('buyer_id',buyers[0].id);
        setPurchases((sales||[]).map(toCamel));
      }
    } catch(e){ console.error(e); }
    setLoading(false);
  };

  const signOut = () => supabase.auth.signOut();
  const liveAuctions = auctions.filter(a=>a.status==='Live');
  const pastAuctions = auctions.filter(a=>['Sold','No Sale'].includes(a.status));
  const myBidAuctionIds = new Set(bids.map(b=>b.auctionId));
  const nameParts = session.user.email.split('@')[0];
  const displayName = buyer ? (buyer.type==='company'?buyer.companyName:`${buyer.firstName||''} ${buyer.lastName||''}`.trim()) : nameParts;

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
          <div style={{textAlign:'right'}}>
            <div style={{fontSize:13,color:'#1a1714',fontWeight:500}}>{displayName}</div>
            <div style={{fontSize:11,color:'#8a8070'}}>{session.user.email}</div>
          </div>
          <button onClick={signOut} style={{padding:'8px 16px',borderRadius:6,border:'1px solid rgba(182,139,46,0.25)',background:'transparent',color:'#8a8070',cursor:'pointer',fontSize:11,fontFamily:"'DM Sans',sans-serif"}}>Sign Out</button>
        </div>
      </div>

      <div style={{maxWidth:900,margin:'0 auto',padding:'20px 16px'}}>

        {/* Auction approval status */}
        {buyer&&!buyer.auctionApproved&&(
          <div style={{padding:'14px 18px',background:'rgba(182,139,46,0.06)',border:'1px solid rgba(182,139,46,0.25)',borderRadius:10,marginBottom:20,display:'flex',alignItems:'center',gap:12}}>
            <span style={{fontSize:20}}>⏳</span>
            <div>
              <div style={{fontSize:13,fontWeight:600,color:'#b68b2e'}}>Auction Access Pending</div>
              <div style={{fontSize:12,color:'#6b635a',marginTop:2}}>Your KYC has been approved but auction bidding access is still being reviewed. You will be notified once you can place bids.</div>
            </div>
          </div>
        )}
        {buyer&&buyer.auctionApproved&&(
          <div style={{padding:'12px 18px',background:'rgba(74,158,107,0.06)',border:'1px solid rgba(74,158,107,0.20)',borderRadius:10,marginBottom:20,display:'flex',alignItems:'center',gap:10}}>
            <span style={{color:'#4a9e6b',fontSize:16}}>✓</span>
            <span style={{fontSize:13,fontWeight:600,color:'#4a9e6b'}}>Auction access approved — you may place bids</span>
          </div>
        )}

        {/* Tabs */}
        <div style={{display:'flex',borderBottom:'1px solid rgba(182,139,46,0.15)',marginBottom:20,gap:4,overflowX:'auto'}}>
          {[['auctions','Live Auctions'+(liveAuctions.length>0?' ('+liveAuctions.length+')':'')],['mybids','My Bids'+(bids.length>0?' ('+bids.length+')':'')],['purchases','Purchases'],['profile','My Profile']].map(([id,lbl])=>(
            <button key={id} onClick={()=>setTab(id)} style={S.tab(tab===id)}>{lbl}</button>
          ))}
        </div>

        {/* Live Auctions */}
        {tab==='auctions'&&(
          <div>
            {liveAuctions.length===0?(
              <div style={{...S.card,textAlign:'center',padding:48}}>
                <div style={{fontSize:32,marginBottom:12}}>◆</div>
                <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,color:'#1a1714',marginBottom:8}}>No Live Auctions</div>
                <div style={{fontSize:13,color:'#8a8070'}}>There are no active auctions at the moment. Check back soon.</div>
              </div>
            ):(
              <div>
                <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:24,color:'#1a1714',marginBottom:16}}>Live Auctions</div>
                {liveAuctions.map(auc=>{
                  const myBid = bids.find(b=>b.auctionId===auc.id);
                  const isLeading = auc.leadBidderId===buyer?.id;
                  return(
                    <div key={auc.id} style={{...S.card,borderLeft:`3px solid ${isLeading?'#4a9e6b':'rgba(182,139,46,0.40)'}` }}>
                      <div style={{display:'flex',justifyContent:'space-between',flexWrap:'wrap',gap:10,marginBottom:12}}>
                        <div>
                          <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,color:'#1a1714'}}>{auc.title}</div>
                          <div style={{fontSize:12,color:'#8a8070',marginTop:2}}>{auc.artist||'—'} · {auc.galleryName||'—'}</div>
                          {isLeading&&<div style={{fontSize:11,fontWeight:600,color:'#4a9e6b',marginTop:4}}>● You are the leading bidder</div>}
                          {myBid&&!isLeading&&<div style={{fontSize:11,color:'#c45c4a',marginTop:4}}>⚠ You have been outbid</div>}
                        </div>
                        <div style={{textAlign:'right'}}>
                          <div style={{fontSize:10,color:'#8a8070',letterSpacing:1,textTransform:'uppercase'}}>Current Bid</div>
                          <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:28,...S.gold}}>R {fmt(auc.currentBid||0)}</div>
                          <div style={{fontSize:11,color:'#8a8070'}}>Reserve: R {fmt(auc.reservePrice)}</div>
                        </div>
                      </div>
                      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,fontSize:12,marginBottom:12}}>
                        <div><span style={{color:'#8a8070'}}>Bids placed: </span><span>{auc.bidsCount||0}</span></div>
                        <div><span style={{color:'#8a8070'}}>Increment: </span><span>{auc.incrementLabel}</span></div>
                        {myBid&&<div><span style={{color:'#8a8070'}}>Your last bid: </span><span style={S.gold}>R {fmt(myBid.amount)}</span></div>}
                      </div>
                      {!buyer?.auctionApproved&&(
                        <div style={{padding:'10px 14px',background:'rgba(182,139,46,0.06)',borderRadius:8,fontSize:12,color:'#8a6a1e'}}>
                          Auction access pending approval — contact Vollard Black to bid.
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            {pastAuctions.length>0&&(
              <div style={{marginTop:24}}>
                <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,color:'#1a1714',marginBottom:12}}>Recent Auctions</div>
                {pastAuctions.map(auc=>(
                  <div key={auc.id} style={S.card}>
                    <div style={{display:'flex',justifyContent:'space-between',flexWrap:'wrap',gap:8}}>
                      <div>
                        <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:18,color:'#1a1714'}}>{auc.title}</div>
                        <div style={{fontSize:12,color:'#8a8070'}}>{auc.artist||'—'}</div>
                      </div>
                      <div style={{textAlign:'right'}}>
                        <span style={{padding:'4px 12px',borderRadius:6,fontSize:11,fontWeight:600,background:auc.status==='Sold'?'rgba(74,158,107,0.12)':'rgba(182,139,46,0.12)',color:auc.status==='Sold'?'#4a9e6b':'#b68b2e'}}>{auc.status}</span>
                        <div style={{fontSize:13,...S.gold,marginTop:4}}>R {fmt(auc.currentBid||0)}</div>
                      </div>
                    </div>
                    {myBidAuctionIds.has(auc.id)&&<div style={{fontSize:11,color:'#8a8070',marginTop:6}}>You participated in this auction</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* My Bids */}
        {tab==='mybids'&&(
          <div>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:24,color:'#1a1714',marginBottom:16}}>My Bids</div>
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
                        const isWinning=auc&&auc.leadBidderId===buyer?.id&&auc.status==='Live';
                        return(
                          <tr key={b.id} style={{borderBottom:'1px solid rgba(182,139,46,0.08)'}}>
                            <td style={{padding:'10px 10px',fontWeight:500}}>{auc?.title||'—'}</td>
                            <td style={{padding:'10px 10px',textAlign:'right',...S.gold}}>R {fmt(b.amount)}</td>
                            <td style={{padding:'10px 10px',color:'#8a8070'}}>{b.timestamp?.slice(0,10)||'—'}</td>
                            <td style={{padding:'10px 10px'}}>
                              {isWinning?<span style={{fontSize:11,fontWeight:600,...S.green}}>● Leading</span>
                              :auc?.status==='Sold'&&auc?.leadBidderId===buyer?.id?<span style={{fontSize:11,fontWeight:600,...S.green}}>Won</span>
                              :<span style={{fontSize:11,color:'#8a8070'}}>Outbid</span>}
                            </td>
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

        {/* Purchases */}
        {tab==='purchases'&&(
          <div>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:24,color:'#1a1714',marginBottom:16}}>Purchases</div>
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

        {/* Profile */}
        {tab==='profile'&&(
          <div>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:24,color:'#1a1714',marginBottom:16}}>My Profile</div>
            {!buyer?(
              <div style={{...S.card,textAlign:'center',padding:40}}><div style={{fontSize:14,color:'#8a8070'}}>Profile not linked yet. Contact Vollard Black.</div></div>
            ):(
              <div style={S.card}>
                {[
                  ['Name',buyer.type==='company'?buyer.companyName:`${buyer.firstName||''} ${buyer.lastName||''}`.trim()],
                  ['Email',buyer.email],
                  ['Mobile',buyer.mobile||'—'],
                  ['ID / Passport',buyer.idNumber||'—'],
                  ['Nationality',buyer.nationality||'—'],
                  ['City',buyer.city||'—'],
                  ['Country',buyer.country||'—'],
                  ['KYC Status',buyer.kycStatus==='approved'?'✓ Approved':'⚠ Pending'],
                  ['Auction Access',buyer.auctionApproved?'✓ Approved':'Pending'],
                ].map(([label,value])=>(
                  <div key={label} style={{display:'flex',justifyContent:'space-between',padding:'10px 0',borderBottom:'1px solid rgba(182,139,46,0.08)',fontSize:13}}>
                    <span style={{color:'#8a8070'}}>{label}</span>
                    <span style={{fontWeight:500,color:value?.toString().includes('✓')?'#4a9e6b':value?.toString().includes('⚠')?'#e6be32':'#1a1714'}}>{value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Root ──────────────────────────────────────────────────
export default function BuyerPortal() {
  const [session,setSession] = useState(undefined);
  const [screen,setScreen] = useState('login');
  const [pendingEmail,setPendingEmail] = useState('');
  const [requestStatus,setRequestStatus] = useState(null);

  useEffect(()=>{
    supabase.auth.getSession().then(({data})=>setSession(data?.session||null));
    const {data:{subscription}} = supabase.auth.onAuthStateChange((_,s)=>setSession(s));
    return ()=>subscription.unsubscribe();
  },[]);

  useEffect(()=>{
    if(!session){ setRequestStatus(null); return; }
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
