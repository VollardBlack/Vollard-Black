'use client';
// ═══════════════════════════════════════════════════════════════
// VOLLARD BLACK — KYC Registration v2
// src/app/KYCRegistration.jsx
// ═══════════════════════════════════════════════════════════════

import { useState, useRef, useEffect, useCallback } from 'react';

const C = { gold:'#b68b2e', goldL:'rgba(182,139,46,0.14)', goldB:'rgba(182,139,46,0.25)', cream:'#f5f3ef', dark:'#1a1714', mid:'#6b635a', light:'#8a8070', red:'#c45c4a', green:'#4a9e6b', white:'#ffffff' };

const inp = { width:'100%', padding:'13px 16px', background:C.cream, border:`1px solid ${C.goldB}`, borderRadius:10, color:C.dark, fontFamily:"'DM Sans',sans-serif", fontSize:14, outline:'none', boxSizing:'border-box' };
const lbl = { display:'block', fontSize:10, fontWeight:700, letterSpacing:'0.18em', textTransform:'uppercase', color:C.mid, marginBottom:7 };

const RELATIONSHIPS = ['Spouse','Mother','Father','Son','Daughter','Sister','Brother','Aunt','Uncle','Niece','Nephew','Cousin','Grandmother','Grandfather','Friend','Colleague','Other'];
const COUNTRIES = ["South Africa","Afghanistan","Albania","Algeria","Angola","Argentina","Armenia","Australia","Austria","Azerbaijan","Bahrain","Bangladesh","Belarus","Belgium","Bolivia","Bosnia","Botswana","Brazil","Bulgaria","Cambodia","Cameroon","Canada","Chile","China","Colombia","Croatia","Cuba","Cyprus","Czech Republic","Denmark","Ecuador","Egypt","Ethiopia","Finland","France","Germany","Ghana","Greece","Hungary","India","Indonesia","Iran","Iraq","Ireland","Israel","Italy","Jamaica","Japan","Jordan","Kazakhstan","Kenya","Kuwait","Latvia","Lebanon","Lithuania","Luxembourg","Malaysia","Mali","Malta","Mauritius","Mexico","Morocco","Mozambique","Namibia","Netherlands","New Zealand","Nigeria","Norway","Oman","Pakistan","Palestine","Panama","Peru","Philippines","Poland","Portugal","Qatar","Romania","Russia","Rwanda","Saudi Arabia","Senegal","Serbia","Singapore","Slovakia","Somalia","South Korea","South Sudan","Spain","Sri Lanka","Sudan","Sweden","Switzerland","Syria","Taiwan","Tanzania","Thailand","Tunisia","Turkey","Uganda","Ukraine","United Arab Emirates","United Kingdom","United States","Uruguay","Venezuela","Vietnam","Yemen","Zambia","Zimbabwe"];

function F({ label:lb, required, hint, children }) {
  return (
    <div style={{marginBottom:18}}>
      <label style={lbl}>{lb}{required&&<span style={{color:C.red,marginLeft:3}}>*</span>}</label>
      {children}
      {hint&&<div style={{fontSize:11,color:C.light,marginTop:5,lineHeight:1.5}}>{hint}</div>}
    </div>
  );
}
function Row({ children, cols='1fr 1fr' }) {
  return <div style={{display:'grid',gridTemplateColumns:cols,gap:14}}>{children}</div>;
}
function Sect({ title, children }) {
  return (
    <div style={{marginBottom:24}}>
      <div style={{fontSize:10,fontWeight:700,letterSpacing:'0.22em',textTransform:'uppercase',color:C.gold,paddingBottom:10,marginBottom:18,borderBottom:`1px solid ${C.goldB}`}}>{title}</div>
      {children}
    </div>
  );
}

// ─── Upload box ───────────────────────────────────────────────
function UpBox({ label:lb, required, value, onChange, hint, accept='image/*,application/pdf' }) {
  const [preview, setPreview] = useState(null);
  const ref = useRef();

  const handle = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.type.startsWith('image/')) {
      const r = new FileReader();
      r.onload = ev => setPreview(ev.target.result);
      r.readAsDataURL(file);
    } else { setPreview('pdf'); }
    const base64 = await new Promise(res => { const r = new FileReader(); r.onload = () => res(r.result); r.readAsDataURL(file); });
    onChange({ file, base64, name: file.name, type: file.type });
  };

  return (
    <div style={{marginBottom:18}}>
      <label style={lbl}>{lb}{required&&<span style={{color:C.red,marginLeft:3}}>*</span>}</label>
      <div onClick={()=>ref.current?.click()} style={{
        border:`2px dashed ${value?'rgba(74,158,107,0.5)':C.goldB}`,
        borderRadius:12, cursor:'pointer', overflow:'hidden',
        background:value?'rgba(74,158,107,0.04)':C.cream,
        transition:'all 0.2s', minHeight:100,
        display:'flex', alignItems:'center', justifyContent:'center',
      }}>
        {preview && preview!=='pdf' ? (
          <img src={preview} alt="" style={{width:'100%',maxHeight:160,objectFit:'cover',display:'block'}}/>
        ) : (
          <div style={{textAlign:'center',padding:'20px 16px'}}>
            <div style={{fontSize:26,marginBottom:6}}>{value?'✅':'📎'}</div>
            <div style={{fontSize:13,fontWeight:600,color:value?C.green:C.mid}}>{value?value.name:'Click to upload'}</div>
            {hint&&<div style={{fontSize:11,color:C.light,marginTop:4}}>{hint}</div>}
          </div>
        )}
      </div>
      <input ref={ref} type="file" accept={accept} onChange={handle} style={{display:'none'}}/>
    </div>
  );
}

// ─── Signature pad ───────────────────────────────────────────
function SigPad({ onChange }) {
  const canvasRef = useRef();
  const drawing = useRef(false);
  const last = useRef(null);
  const [signed, setSigned] = useState(false);

  const pos = (e) => {
    const c = canvasRef.current, r = c.getBoundingClientRect(), t = e.touches?.[0]||e;
    return { x:(t.clientX-r.left)*(c.width/r.width), y:(t.clientY-r.top)*(c.height/r.height) };
  };
  const start = (e) => { e.preventDefault(); drawing.current=true; last.current=pos(e); };
  const move = useCallback((e) => {
    e.preventDefault();
    if (!drawing.current) return;
    const c=canvasRef.current, ctx=c.getContext('2d'), p=pos(e);
    ctx.beginPath(); ctx.moveTo(last.current.x,last.current.y); ctx.lineTo(p.x,p.y);
    ctx.strokeStyle=C.dark; ctx.lineWidth=1.8; ctx.lineCap='round'; ctx.lineJoin='round'; ctx.stroke();
    last.current=p; setSigned(true);
  },[]);
  const end = useCallback((e) => {
    e.preventDefault();
    if (!drawing.current) return;
    drawing.current=false;
    onChange(canvasRef.current.toDataURL());
  },[onChange]);

  useEffect(()=>{
    const c=canvasRef.current;
    if(!c)return;
    c.addEventListener('mousemove',move); c.addEventListener('touchmove',move,{passive:false});
    c.addEventListener('mouseup',end); c.addEventListener('touchend',end);
    return()=>{ c.removeEventListener('mousemove',move); c.removeEventListener('touchmove',move); c.removeEventListener('mouseup',end); c.removeEventListener('touchend',end); };
  },[move,end]);

  const clear = () => {
    const ctx=canvasRef.current.getContext('2d');
    ctx.clearRect(0,0,canvasRef.current.width,canvasRef.current.height);
    setSigned(false); onChange(null);
  };

  return (
    <div>
      <label style={lbl}>Signature<span style={{color:C.red,marginLeft:3}}>*</span></label>
      <div style={{border:`2px solid ${signed?'rgba(74,158,107,0.4)':C.goldB}`,borderRadius:12,overflow:'hidden',background:C.white,position:'relative',transition:'border-color 0.2s'}}>
        <canvas ref={canvasRef} width={700} height={160} style={{width:'100%',height:160,cursor:'crosshair',display:'block',touchAction:'none'}} onMouseDown={start} onTouchStart={start}/>
        {!signed&&<div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',pointerEvents:'none'}}>
          <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,color:'rgba(182,139,46,0.25)',fontStyle:'italic'}}>Sign here…</span>
        </div>}
      </div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:8}}>
        <span style={{fontSize:12,color:signed?C.green:C.light,fontWeight:signed?600:400}}>{signed?'✓ Signature captured':'Draw using mouse or finger'}</span>
        <button type="button" onClick={clear} style={{background:'none',border:`1px solid ${C.goldB}`,borderRadius:6,color:C.light,cursor:'pointer',padding:'4px 12px',fontSize:11,fontFamily:"'DM Sans',sans-serif"}}>Clear</button>
      </div>
    </div>
  );
}

// ─── Step indicator ───────────────────────────────────────────
function StepBar({ step }) {
  const steps = ['Account','Personal','Address & Docs','Sign & Submit'];
  return (
    <div style={{display:'flex',alignItems:'center',marginBottom:36,overflowX:'auto',paddingBottom:4,gap:0}}>
      {steps.map((s,i)=>(
        <div key={i} style={{display:'flex',alignItems:'center',flex:i<steps.length-1?'1':'none'}}>
          <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:6,flexShrink:0}}>
            <div style={{width:36,height:36,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:700,
              background:i<step?C.green:i===step?`linear-gradient(135deg,${C.gold},#8a6a1e)`:C.goldL,
              color:i<=step?'#fff':C.gold,border:i>step?`1px solid ${C.goldB}`:'none',transition:'all 0.3s'}}>
              {i<step?'✓':i+1}
            </div>
            <div style={{fontSize:9,fontWeight:700,letterSpacing:'0.12em',textTransform:'uppercase',color:i===step?C.gold:i<step?C.green:C.light,whiteSpace:'nowrap'}}>{s}</div>
          </div>
          {i<steps.length-1&&<div style={{flex:1,height:1,background:i<step?C.green:C.goldB,margin:'0 8px',marginBottom:22,transition:'background 0.3s'}}/>}
        </div>
      ))}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────
export default function KYCRegistration({ role, supabase, onComplete, onSignIn }) {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPw, setShowPw] = useState(false);

  const rc = { buyer:{label:'Buyer',portal:'Buyer Portal',color:'#c45c4a'}, renter:{label:'License Holder',portal:'Renter Portal',color:C.gold}, artist:{label:'Artist',portal:'Artist Portal',color:'#648cc8'} }[role] || { label:'Register',portal:'Portal',color:C.gold };

  const [f, setF] = useState({ email:'', password:'', confirmPassword:'', title:'', firstName:'', lastName:'', idType:'RSA ID', idNumber:'', passportNumber:'', dob:'', gender:'', occupation:'', mobile:'', address1:'', address2:'', city:'', postalCode:'', country:'South Africa', emergencyName:'', emergencyRelationship:'', emergencyPhone:'', medium:'', style:'', instagram:'', website:'', bio:'', message:'' });
  const s = (k,v) => setF(p=>({...p,[k]:v}));

  const [idFront, setIdFront] = useState(null);
  const [idBack, setIdBack] = useState(null);
  const [selfie, setSelfie] = useState(null);
  const [signature, setSignature] = useState(null);
  const [terms, setTerms] = useState(false);

  const age = f.dob ? Math.floor((new Date()-new Date(f.dob))/(365.25*24*3600*1000)) : '';

  // Password strength checks
  const pwChecks = [f.password.length>=8, /[A-Z]/.test(f.password), /[0-9]/.test(f.password), f.password===f.confirmPassword&&f.confirmPassword.length>0];

  const validate = () => {
    if (step===0) {
      if (!f.email) return 'Email is required.';
      if (f.password.length<8) return 'Password must be at least 8 characters.';
      if (!/[A-Z]/.test(f.password)) return 'Password needs an uppercase letter.';
      if (!/[0-9]/.test(f.password)) return 'Password needs a number.';
      if (f.password!==f.confirmPassword) return 'Passwords do not match.';
    }
    if (step===1) {
      if (!f.title) return 'Please select a title.';
      if (!f.firstName||!f.lastName) return 'Full name is required.';
      if (!f.idNumber&&!f.passportNumber) return 'ID or passport number is required.';
      if (!f.dob) return 'Date of birth is required.';
      if (!f.gender) return 'Gender is required.';
      if (!f.mobile) return 'Phone number is required.';
      if (role==='artist'&&!f.medium) return 'Primary medium is required.';
    }
    if (step===2) {
      if (!f.address1||!f.city||!f.postalCode) return 'Please complete your address.';
      if (!f.emergencyName||!f.emergencyPhone||!f.emergencyRelationship) return 'Emergency contact required.';
      if (!idFront) return 'Please upload your ID / passport front photo.';
      if (!selfie) return 'Please upload a selfie photo.';
    }
    if (step===3) {
      if (!signature) return 'Please draw your signature.';
      if (!terms) return 'Please accept the Terms & Conditions.';
    }
    return null;
  };

  const next = async () => {
    const err = validate();
    if (err) { setError(err); window.scrollTo({top:0,behavior:'smooth'}); return; }
    setError('');
    if (step<3) { setStep(s=>s+1); window.scrollTo({top:0,behavior:'smooth'}); return; }

    // Submit
    setLoading(true);
    try {
      const { data:authData, error:authErr } = await supabase.auth.signUp({ email:f.email, password:f.password });
      if (authErr) throw authErr;
      const userId = authData.user?.id;
      const base = `${role}/${userId}`;

      const uploadDoc = async (fileObj, path) => {
        if (!fileObj?.file) return null;
        await supabase.storage.from('kyc-documents').upload(path, fileObj.file, { upsert:true, contentType:fileObj.type });
        const { data:u } = supabase.storage.from('kyc-documents').getPublicUrl(path);
        return u?.publicUrl||null;
      };

      const [frontUrl, backUrl, selfieUrl] = await Promise.all([
        uploadDoc(idFront,`${base}/id-front`),
        uploadDoc(idBack,`${base}/id-back`),
        uploadDoc(selfie,`${base}/selfie`),
      ]);
      if (signature) {
        const blob = await (await fetch(signature)).blob();
        await supabase.storage.from('kyc-documents').upload(`${base}/signature.png`, blob, { upsert:true, contentType:'image/png' });
      }

      const msg = [
        `ID Type: ${f.idType}`,
        f.idNumber&&`ID: ${f.idNumber}`,
        f.passportNumber&&`Passport: ${f.passportNumber}`,
        f.dob&&`DOB: ${f.dob}`,
        age&&`Age: ${age}`,
        f.gender&&`Gender: ${f.gender}`,
        f.occupation&&`Occupation: ${f.occupation}`,
        `Address: ${f.address1}${f.address2?', '+f.address2:''}, ${f.city}, ${f.postalCode}, ${f.country}`,
        `Emergency: ${f.emergencyName} (${f.emergencyRelationship}) ${f.emergencyPhone}`,
        frontUrl&&`ID Front: ${frontUrl}`,
        backUrl&&`ID Back: ${backUrl}`,
        selfieUrl&&`Selfie: ${selfieUrl}`,
        role==='artist'&&f.medium&&`Medium: ${f.medium}`,
        role==='artist'&&f.style&&`Style: ${f.style}`,
        role==='artist'&&f.instagram&&`Instagram: ${f.instagram}`,
        f.message&&`Note: ${f.message}`,
      ].filter(Boolean).join(' | ');

      await supabase.from('portal_requests').insert({ id:userId, email:f.email, full_name:`${f.firstName} ${f.lastName}`, mobile:f.mobile, role, message:msg, status:'pending' });
      onComplete(f.email);
    } catch(e) {
      setError(e.message||'Registration failed. Please try again.');
    }
    setLoading(false);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300&family=DM+Sans:wght@300;400;500;600&display=swap');
        *{box-sizing:border-box;}
        input:focus,select:focus,textarea:focus{border-color:${C.gold}!important;box-shadow:0 0 0 3px rgba(182,139,46,0.10)!important;outline:none;}
        @keyframes slideUp{from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:translateY(0);}}
      `}</style>

      <div style={{minHeight:'100vh',background:'#f5f3ef',fontFamily:"'DM Sans',sans-serif",color:C.dark}}>

        {/* Top bar */}
        <div style={{background:C.white,borderBottom:`1px solid ${C.goldB}`,padding:'0 24px',height:58,display:'flex',alignItems:'center',justifyContent:'space-between',position:'sticky',top:0,zIndex:10}}>
          <a href="/" style={{textDecoration:'none',display:'flex',alignItems:'center',gap:14}}>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:18,fontWeight:300,letterSpacing:'0.22em',color:C.dark}}>
              VOLLARD <span style={{color:C.gold}}>BLACK</span>
            </div>
            <div style={{width:1,height:18,background:C.goldB}}/>
            <span style={{fontSize:10,letterSpacing:'0.18em',textTransform:'uppercase',color:rc.color,fontWeight:600}}>{rc.portal}</span>
          </a>
          <button onClick={onSignIn} style={{background:'none',border:`1px solid ${C.goldB}`,borderRadius:7,color:C.mid,cursor:'pointer',padding:'7px 16px',fontSize:12,fontFamily:"'DM Sans',sans-serif",fontWeight:500}}>
            Already registered? Sign In →
          </button>
        </div>

        <div style={{maxWidth:660,margin:'0 auto',padding:'36px 20px 72px'}}>

          {/* Page title */}
          <div style={{marginBottom:32,animation:'slideUp 0.45s ease'}}>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:28,fontWeight:300,color:C.dark,marginBottom:4}}>
              {rc.label} Registration
            </div>
            <div style={{fontSize:13,color:C.light}}>All fields marked <span style={{color:C.red}}>*</span> are required. Your data is kept confidential.</div>
          </div>

          <StepBar step={step}/>

          {/* Error */}
          {error&&<div style={{padding:'12px 16px',background:'rgba(196,92,74,0.08)',border:`1px solid rgba(196,92,74,0.25)`,borderRadius:10,fontSize:13,color:C.red,marginBottom:20,display:'flex',gap:10,alignItems:'flex-start',animation:'slideUp 0.3s ease'}}>
            <span style={{fontSize:16,flexShrink:0,marginTop:1}}>⚠</span>{error}
          </div>}

          {/* Card */}
          <div style={{background:C.white,border:`1px solid ${C.goldB}`,borderRadius:16,padding:'28px 28px 24px',boxShadow:'0 4px 28px rgba(0,0,0,0.06)',animation:'slideUp 0.4s ease'}}>

            {/* STEP 0 */}
            {step===0&&(
              <div>
                <Sect title="Account Details">
                  <F label="Email Address" required>
                    <input type="email" value={f.email} onChange={e=>s('email',e.target.value)} style={inp} placeholder="you@email.com" autoComplete="email"/>
                  </F>
                  <Row>
                    <F label="Password" required hint="Min 8 chars · uppercase · number">
                      <div style={{position:'relative'}}>
                        <input type={showPw?'text':'password'} value={f.password} onChange={e=>s('password',e.target.value)} style={{...inp,paddingRight:54}} autoComplete="new-password"/>
                        <button type="button" onClick={()=>setShowPw(p=>!p)} style={{position:'absolute',right:14,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',color:C.light,cursor:'pointer',fontSize:11,fontFamily:"'DM Sans',sans-serif"}}>{showPw?'Hide':'Show'}</button>
                      </div>
                    </F>
                    <F label="Confirm Password" required>
                      <input type="password" value={f.confirmPassword} onChange={e=>s('confirmPassword',e.target.value)} style={inp} autoComplete="new-password"/>
                    </F>
                  </Row>
                  {f.password.length>0&&(
                    <div style={{marginTop:-8,marginBottom:16}}>
                      <div style={{display:'flex',gap:5,marginBottom:6}}>
                        {pwChecks.map((ok,i)=>(
                          <div key={i} style={{flex:1,height:3,borderRadius:2,background:ok?C.green:'rgba(182,139,46,0.18)',transition:'background 0.3s'}}/>
                        ))}
                      </div>
                      <div style={{display:'flex',gap:12,flexWrap:'wrap'}}>
                        {[['8+ chars',pwChecks[0]],['Uppercase',pwChecks[1]],['Number',pwChecks[2]],['Passwords match',pwChecks[3]]].map(([t,ok])=>(
                          <span key={t} style={{fontSize:10,color:ok?C.green:C.light,fontWeight:ok?600:400}}>
                            {ok?'✓':'○'} {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </Sect>
              </div>
            )}

            {/* STEP 1 */}
            {step===1&&(
              <div>
                <Sect title="Personal Information">
                  <Row cols="110px 1fr 1fr">
                    <F label="Title" required>
                      <select value={f.title} onChange={e=>s('title',e.target.value)} style={inp}>
                        <option value="">—</option>
                        {['Mr','Mrs','Miss','Ms','Dr','Prof'].map(t=><option key={t}>{t}</option>)}
                      </select>
                    </F>
                    <F label="First Name" required>
                      <input value={f.firstName} onChange={e=>s('firstName',e.target.value)} style={inp}/>
                    </F>
                    <F label="Surname" required>
                      <input value={f.lastName} onChange={e=>s('lastName',e.target.value)} style={inp}/>
                    </F>
                  </Row>
                  <Row>
                    <F label="ID Type" required>
                      <select value={f.idType} onChange={e=>s('idType',e.target.value)} style={inp}>
                        <option>RSA ID</option>
                        <option>Passport</option>
                        <option>Foreign National ID</option>
                      </select>
                    </F>
                    <F label={f.idType==='Passport'?'Passport Number':'ID Number'} required>
                      <input value={f.idType==='Passport'?f.passportNumber:f.idNumber} onChange={e=>f.idType==='Passport'?s('passportNumber',e.target.value):s('idNumber',e.target.value)} style={inp} placeholder={f.idType==='RSA ID'?'13 digit ID number':''}/>
                    </F>
                  </Row>
                  <Row cols="1fr 80px 1fr">
                    <F label="Date of Birth" required>
                      <input type="date" value={f.dob} onChange={e=>s('dob',e.target.value)} style={inp} max={new Date().toISOString().split('T')[0]}/>
                    </F>
                    <F label="Age">
                      <input value={age} readOnly style={{...inp,background:'#e8e4dd',color:C.light,textAlign:'center',fontWeight:700}}/>
                    </F>
                    <F label="Gender" required>
                      <select value={f.gender} onChange={e=>s('gender',e.target.value)} style={inp}>
                        <option value="">— Select</option>
                        {['Male','Female','Non-binary','Prefer not to say'].map(g=><option key={g}>{g}</option>)}
                      </select>
                    </F>
                  </Row>
                  <Row>
                    <F label="Mobile / Phone" required>
                      <input type="tel" value={f.mobile} onChange={e=>s('mobile',e.target.value)} style={inp} placeholder="+27 82 000 0000"/>
                    </F>
                    <F label="Occupation">
                      <input value={f.occupation} onChange={e=>s('occupation',e.target.value)} style={inp} placeholder="e.g. Art Collector"/>
                    </F>
                  </Row>
                </Sect>

                {role==='artist'&&(
                  <Sect title="Artist Details">
                    <Row>
                      <F label="Primary Medium" required>
                        <input value={f.medium} onChange={e=>s('medium',e.target.value)} style={inp} placeholder="e.g. Oil on Canvas"/>
                      </F>
                      <F label="Style">
                        <input value={f.style} onChange={e=>s('style',e.target.value)} style={inp} placeholder="e.g. Contemporary Realism"/>
                      </F>
                    </Row>
                    <Row>
                      <F label="Instagram">
                        <input value={f.instagram} onChange={e=>s('instagram',e.target.value)} style={inp} placeholder="@yourhandle"/>
                      </F>
                      <F label="Website">
                        <input value={f.website} onChange={e=>s('website',e.target.value)} style={inp} placeholder="https://..."/>
                      </F>
                    </Row>
                    <F label="Artist Statement / Bio">
                      <textarea value={f.bio} onChange={e=>s('bio',e.target.value)} style={{...inp,minHeight:80,resize:'vertical'}} placeholder="Tell us about your work and practice…"/>
                    </F>
                  </Sect>
                )}

                <Sect title="Additional Notes">
                  <F label="Message (optional)">
                    <textarea value={f.message} onChange={e=>s('message',e.target.value)} style={{...inp,minHeight:60,resize:'vertical'}} placeholder="Anything you'd like Vollard Black to know…"/>
                  </F>
                </Sect>
              </div>
            )}

            {/* STEP 2 */}
            {step===2&&(
              <div>
                <Sect title="Address">
                  <F label="Address Line 1" required>
                    <input value={f.address1} onChange={e=>s('address1',e.target.value)} style={inp} placeholder="Street number and name"/>
                  </F>
                  <F label="Address Line 2">
                    <input value={f.address2} onChange={e=>s('address2',e.target.value)} style={inp} placeholder="Suburb / Complex / Unit number"/>
                  </F>
                  <Row cols="1fr 110px">
                    <F label="City" required>
                      <input value={f.city} onChange={e=>s('city',e.target.value)} style={inp}/>
                    </F>
                    <F label="Postal Code" required>
                      <input value={f.postalCode} onChange={e=>s('postalCode',e.target.value)} style={inp}/>
                    </F>
                  </Row>
                  <F label="Country" required>
                    <select value={f.country} onChange={e=>s('country',e.target.value)} style={inp}>
                      {COUNTRIES.map(c=><option key={c}>{c}</option>)}
                    </select>
                  </F>
                </Sect>

                <Sect title="Emergency Contact">
                  <Row>
                    <F label="Full Name" required>
                      <input value={f.emergencyName} onChange={e=>s('emergencyName',e.target.value)} style={inp}/>
                    </F>
                    <F label="Relationship" required>
                      <select value={f.emergencyRelationship} onChange={e=>s('emergencyRelationship',e.target.value)} style={inp}>
                        <option value="">— Select</option>
                        {RELATIONSHIPS.map(r=><option key={r}>{r}</option>)}
                      </select>
                    </F>
                  </Row>
                  <F label="Phone Number" required>
                    <input type="tel" value={f.emergencyPhone} onChange={e=>s('emergencyPhone',e.target.value)} style={inp} placeholder="+27 82 000 0000"/>
                  </F>
                </Sect>

                <Sect title="Identity Documents">
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
                    <UpBox label={`${f.idType} — Front`} required value={idFront} onChange={setIdFront} hint="All corners visible"/>
                    <UpBox label={f.idType==='RSA ID'?'RSA ID — Back':'Passport Photo Page'} value={idBack} onChange={setIdBack} hint={f.idType==='RSA ID'?'Back of card':'Page with photo & details'}/>
                  </div>
                  <UpBox label="Selfie Photo" required value={selfie} onChange={setSelfie} hint="Clear face photo — holding your ID next to your face is preferred" accept="image/*"/>
                </Sect>
              </div>
            )}

            {/* STEP 3 */}
            {step===3&&(
              <div>
                <Sect title="Signature">
                  <div style={{padding:'14px 16px',background:C.goldL,border:`1px solid ${C.goldB}`,borderRadius:10,fontSize:13,color:'#5a4820',lineHeight:1.7,marginBottom:20}}>
                    I, <strong>{f.firstName} {f.lastName}</strong>, confirm that all information provided is accurate and I agree to the{' '}
                    <a href="/terms" target="_blank" rel="noreferrer" style={{color:C.gold,fontWeight:600}}>Vollard Black Terms & Conditions</a>.
                  </div>
                  <SigPad onChange={setSignature}/>
                </Sect>

                <div style={{padding:'16px',background:C.cream,borderRadius:10,border:`1px solid ${C.goldB}`,marginTop:16}}>
                  <label style={{display:'flex',alignItems:'flex-start',gap:12,cursor:'pointer'}}>
                    <input type="checkbox" checked={terms} onChange={e=>setTerms(e.target.checked)} style={{width:18,height:18,marginTop:2,accentColor:C.gold,flexShrink:0}}/>
                    <span style={{fontSize:13,color:'#4a4440',lineHeight:1.75}}>
                      I confirm I have read and agree to the{' '}
                      <a href="/terms" target="_blank" rel="noreferrer" style={{color:C.gold,fontWeight:600}}>Terms & Conditions</a>.
                      I consent to my personal information being processed in accordance with POPIA.
                    </span>
                  </label>
                </div>

                {/* Summary card */}
                <div style={{marginTop:20,padding:'16px',background:C.white,border:`1px solid ${C.goldB}`,borderRadius:10}}>
                  <div style={{fontSize:10,fontWeight:700,letterSpacing:'0.18em',textTransform:'uppercase',color:C.mid,marginBottom:12}}>Summary</div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,fontSize:13,marginBottom:12}}>
                    {[['Name',`${f.title} ${f.firstName} ${f.lastName}`],['Email',f.email],['ID',f.idType==='Passport'?f.passportNumber:f.idNumber],['DOB',f.dob?`${f.dob} (Age ${age})`:'—'],['Phone',f.mobile],['Location',`${f.city}, ${f.country}`]].map(([k,v])=>(
                      <div key={k}><span style={{color:C.light}}>{k}: </span><span style={{fontWeight:500}}>{v||'—'}</span></div>
                    ))}
                  </div>
                  <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                    {[idFront&&'ID Front',idBack&&'ID Back',selfie&&'Selfie',signature&&'Signed'].filter(Boolean).map(t=>(
                      <span key={t} style={{fontSize:11,color:C.green,background:'rgba(74,158,107,0.10)',padding:'3px 10px',borderRadius:20,fontWeight:600}}>✓ {t}</span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Nav buttons */}
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:20}}>
            <button onClick={step===0?onSignIn:()=>{setStep(s=>Math.max(0,s-1));setError('');window.scrollTo({top:0,behavior:'smooth'});}} style={{padding:'12px 22px',borderRadius:8,border:`1px solid ${C.goldB}`,background:'transparent',color:C.mid,cursor:'pointer',fontSize:13,fontWeight:500,fontFamily:"'DM Sans',sans-serif"}}>
              {step===0?'← Sign In':'← Back'}
            </button>
            <div style={{fontSize:12,color:C.light}}>Step {step+1} of 4</div>
            <button onClick={next} disabled={loading} style={{padding:'12px 32px',borderRadius:8,border:'none',background:`linear-gradient(135deg,${C.gold},#8a6a1e)`,color:'#fff',cursor:loading?'not-allowed':'pointer',fontSize:13,fontWeight:600,fontFamily:"'DM Sans',sans-serif",opacity:loading?0.7:1,minWidth:150,boxShadow:'0 4px 14px rgba(182,139,46,0.28)'}}>
              {loading?'Submitting…':step===3?'Submit Registration':'Next →'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
