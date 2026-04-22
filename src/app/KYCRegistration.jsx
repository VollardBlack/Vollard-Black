'use client';
import { useState, useRef, useEffect, useCallback } from 'react';

const C = {
  gold:'#b68b2e', goldL:'rgba(182,139,46,0.12)', goldB:'rgba(182,139,46,0.22)',
  cream:'#f5f3ef', dark:'#1a1714', mid:'#6b635a', light:'#8a8070',
  red:'#c45c4a', green:'#4a9e6b', white:'#ffffff',
};
const inp = { width:'100%', padding:'15px 16px', background:C.white, border:`1.5px solid ${C.goldB}`, borderRadius:12, color:C.dark, fontFamily:"'DM Sans',sans-serif", fontSize:15, outline:'none', boxSizing:'border-box', WebkitAppearance:'none', appearance:'none' };
const lbl = { display:'block', fontSize:11, fontWeight:700, letterSpacing:'0.14em', textTransform:'uppercase', color:C.mid, marginBottom:8 };

const RELATIONSHIPS = ['Spouse','Mother','Father','Son','Daughter','Sister','Brother','Aunt','Uncle','Niece','Nephew','Cousin','Grandmother','Grandfather','Friend','Colleague','Other'];
const COUNTRIES = ["South Africa","Afghanistan","Albania","Algeria","Angola","Argentina","Armenia","Australia","Austria","Azerbaijan","Bahrain","Bangladesh","Belarus","Belgium","Bolivia","Bosnia","Botswana","Brazil","Bulgaria","Cambodia","Cameroon","Canada","Chile","China","Colombia","Croatia","Cuba","Cyprus","Czech Republic","Denmark","Ecuador","Egypt","Ethiopia","Finland","France","Germany","Ghana","Greece","Hungary","India","Indonesia","Iran","Iraq","Ireland","Israel","Italy","Jamaica","Japan","Jordan","Kazakhstan","Kenya","Kuwait","Latvia","Lebanon","Lithuania","Luxembourg","Malaysia","Mali","Malta","Mauritius","Mexico","Morocco","Mozambique","Namibia","Netherlands","New Zealand","Nigeria","Norway","Oman","Pakistan","Palestine","Panama","Peru","Philippines","Poland","Portugal","Qatar","Romania","Russia","Rwanda","Saudi Arabia","Senegal","Serbia","Singapore","Slovakia","Somalia","South Korea","South Sudan","Spain","Sri Lanka","Sudan","Sweden","Switzerland","Syria","Taiwan","Tanzania","Thailand","Tunisia","Turkey","Uganda","Ukraine","United Arab Emirates","United Kingdom","United States","Uruguay","Venezuela","Vietnam","Yemen","Zambia","Zimbabwe"];

function F({ label:lb, required, hint, children }) {
  return (
    <div style={{marginBottom:22}}>
      <label style={lbl}>{lb}{required&&<span style={{color:C.red,marginLeft:3}}>*</span>}</label>
      {children}
      {hint&&<div style={{fontSize:12,color:C.light,marginTop:6,lineHeight:1.6}}>{hint}</div>}
    </div>
  );
}
function Grid({ children, cols='1fr 1fr' }) {
  return <div style={{display:'grid',gridTemplateColumns:cols,gap:16}}>{children}</div>;
}
function Sect({ title }) {
  return <div style={{fontSize:11,fontWeight:700,letterSpacing:'0.22em',textTransform:'uppercase',color:C.gold,paddingBottom:12,marginBottom:20,marginTop:8,borderBottom:`1.5px solid ${C.goldB}`}}>{title}</div>;
}

// UpBox — NO camera logic here, just displays preview and triggers parent callback
function UpBox({ label:lb, required, value, onChange, hint, onOpenCamera }) {
  const fileRef = useRef();
  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = '';
    const base64 = await new Promise(res => { const r = new FileReader(); r.onload = () => res(r.result); r.readAsDataURL(file); });
    onChange({ file, base64, name: file.name, type: file.type });
  };
  const clear = (e) => { e.stopPropagation(); onChange(null); };
  return (
    <div style={{marginBottom:20}}>
      <label style={lbl}>{lb}{required&&<span style={{color:C.red,marginLeft:3}}>*</span>}</label>
      {value?.base64 ? (
        <div style={{border:'2px solid rgba(74,158,107,0.5)',borderRadius:14,overflow:'hidden',marginBottom:8,position:'relative'}}>
          <img src={value.base64} alt="" style={{width:'100%',maxHeight:180,objectFit:'cover',display:'block'}}/>
          <button type="button" onClick={clear} style={{position:'absolute',top:8,right:8,background:'rgba(196,92,74,0.85)',border:'none',borderRadius:20,color:'#fff',padding:'4px 12px',fontSize:11,fontWeight:700,cursor:'pointer',fontFamily:"'DM Sans',sans-serif"}}>✕ Redo</button>
        </div>
      ) : (
        <div style={{border:`2px dashed ${C.goldB}`,borderRadius:14,background:C.cream,padding:'16px',textAlign:'center',marginBottom:8}}>
          <div style={{fontSize:26,marginBottom:4}}>📎</div>
          <div style={{fontSize:12,color:C.mid}}>{hint||'Take a photo or upload a file'}</div>
        </div>
      )}
      <div style={{display:'flex',gap:8}}>
        <button type="button" onClick={onOpenCamera} style={{flex:1,padding:'11px 6px',borderRadius:10,border:`1px solid ${C.goldB}`,background:'transparent',color:C.gold,cursor:'pointer',fontSize:13,fontWeight:600,fontFamily:"'DM Sans',sans-serif"}}>📸 Camera</button>
        <button type="button" onClick={()=>fileRef.current?.click()} style={{flex:1,padding:'11px 6px',borderRadius:10,border:`1px solid ${C.goldB}`,background:'transparent',color:C.gold,cursor:'pointer',fontSize:13,fontWeight:600,fontFamily:"'DM Sans',sans-serif"}}>📁 Upload</button>
      </div>
      <input ref={fileRef} type="file" accept="image/*,.pdf" onChange={handleFile} style={{display:'none'}}/>
    </div>
  );
}

// Camera lives at TOP LEVEL — never unmounts, never resets form
function CameraModal({ facingMode, onCapture, onClose }) {
  const videoRef = useRef();
  const canvasRef = useRef();
  const streamRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    let active = true;
    setErr(''); setReady(false);
    navigator.mediaDevices.getUserMedia({
      video: { facingMode: facingMode||'environment', width:{ideal:1280}, height:{ideal:720} },
      audio: false
    }).then(s => {
      if (!active) { s.getTracks().forEach(t=>t.stop()); return; }
      streamRef.current = s;
      if (videoRef.current) {
        videoRef.current.srcObject = s;
        videoRef.current.play().then(()=>setReady(true)).catch(()=>setReady(true));
      }
    }).catch(() => {
      if (active) setErr('Camera not available. Please use Upload instead.');
    });
    return () => {
      active = false;
      if (streamRef.current) { streamRef.current.getTracks().forEach(t=>t.stop()); streamRef.current = null; }
    };
  }, [facingMode]);

  const capture = () => {
    const v = videoRef.current, c = canvasRef.current;
    if (!v||!c) return;
    c.width = v.videoWidth||1280; c.height = v.videoHeight||720;
    c.getContext('2d').drawImage(v,0,0);
    const base64 = c.toDataURL('image/jpeg', 0.9);
    c.toBlob(blob => {
      onCapture({ file: new File([blob],'photo.jpg',{type:'image/jpeg'}), base64, name:'photo.jpg', type:'image/jpeg' });
    }, 'image/jpeg', 0.9);
  };

  const close = () => {
    if (streamRef.current) { streamRef.current.getTracks().forEach(t=>t.stop()); streamRef.current = null; }
    onClose();
  };

  return (
    <div style={{position:'fixed',inset:0,background:'#000',zIndex:9999,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}}>
      {err ? (
        <div style={{padding:24,textAlign:'center',maxWidth:320}}>
          <div style={{fontSize:40,marginBottom:12}}>📷</div>
          <div style={{color:'#fff',fontSize:14,marginBottom:20,lineHeight:1.6}}>{err}</div>
          <button onClick={close} style={{padding:'12px 32px',borderRadius:10,border:'none',background:C.gold,color:'#fff',fontSize:14,fontWeight:700,cursor:'pointer',fontFamily:"'DM Sans',sans-serif"}}>Close</button>
        </div>
      ) : (
        <div style={{width:'100%',maxWidth:480,padding:'0 0 24px'}}>
          <video ref={videoRef} autoPlay playsInline muted style={{width:'100%',display:'block',background:'#111'}}/>
          <canvas ref={canvasRef} style={{display:'none'}}/>
          {!ready && <div style={{color:'rgba(255,255,255,0.5)',textAlign:'center',padding:12,fontSize:13}}>Starting camera…</div>}
          <div style={{display:'flex',gap:12,padding:'16px 16px 0'}}>
            <button onClick={close} style={{flex:1,padding:14,borderRadius:12,border:'2px solid rgba(255,255,255,0.25)',background:'transparent',color:'#fff',fontSize:14,fontWeight:600,cursor:'pointer',fontFamily:"'DM Sans',sans-serif"}}>Cancel</button>
            <button onClick={capture} disabled={!ready} style={{flex:2,padding:14,borderRadius:12,border:'none',background:ready?C.gold:'rgba(182,139,46,0.4)',color:'#fff',fontSize:15,fontWeight:700,cursor:ready?'pointer':'not-allowed',fontFamily:"'DM Sans',sans-serif"}}>📸 Capture</button>
          </div>
        </div>
      )}
    </div>
  );
}

function SigPad({ onChange }) {
  const canvasRef = useRef();
  const drawing = useRef(false);
  const last = useRef(null);
  const [signed, setSigned] = useState(false);
  const pos = (e) => { const c=canvasRef.current,r=c.getBoundingClientRect(),t=e.touches?.[0]||e; return{x:(t.clientX-r.left)*(c.width/r.width),y:(t.clientY-r.top)*(c.height/r.height)}; };
  const start = (e) => { e.preventDefault(); drawing.current=true; last.current=pos(e); };
  const move = useCallback((e) => { e.preventDefault(); if(!drawing.current)return; const c=canvasRef.current,ctx=c.getContext('2d'),p=pos(e); ctx.beginPath();ctx.moveTo(last.current.x,last.current.y);ctx.lineTo(p.x,p.y);ctx.strokeStyle=C.dark;ctx.lineWidth=2;ctx.lineCap='round';ctx.lineJoin='round';ctx.stroke();last.current=p;setSigned(true); },[]);
  const end = useCallback((e) => { e.preventDefault(); if(!drawing.current)return; drawing.current=false; onChange(canvasRef.current.toDataURL()); },[onChange]);
  useEffect(()=>{ const c=canvasRef.current; if(!c)return; c.addEventListener('mousemove',move);c.addEventListener('touchmove',move,{passive:false});c.addEventListener('mouseup',end);c.addEventListener('touchend',end); return()=>{c.removeEventListener('mousemove',move);c.removeEventListener('touchmove',move);c.removeEventListener('mouseup',end);c.removeEventListener('touchend',end);}; },[move,end]);
  const clear = () => { canvasRef.current.getContext('2d').clearRect(0,0,700,180); setSigned(false); onChange(null); };
  return (
    <div>
      <label style={lbl}>Signature<span style={{color:C.red,marginLeft:3}}>*</span></label>
      <div style={{border:`2px solid ${signed?'rgba(74,158,107,0.5)':C.goldB}`,borderRadius:14,overflow:'hidden',background:C.white,position:'relative'}}>
        <canvas ref={canvasRef} width={700} height={180} style={{width:'100%',height:160,cursor:'crosshair',display:'block',touchAction:'none'}} onMouseDown={start} onTouchStart={start}/>
        {!signed&&<div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',pointerEvents:'none'}}><span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,color:'rgba(182,139,46,0.25)',fontStyle:'italic'}}>Sign here…</span></div>}
      </div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:10}}>
        <span style={{fontSize:13,color:signed?C.green:C.light,fontWeight:signed?700:400}}>{signed?'✓ Signature captured':'Use your finger to sign'}</span>
        <button type="button" onClick={clear} style={{background:'none',border:`1px solid ${C.goldB}`,borderRadius:8,color:C.light,cursor:'pointer',padding:'6px 14px',fontSize:12,fontFamily:"'DM Sans',sans-serif"}}>Clear</button>
      </div>
    </div>
  );
}

function StepBar({ step }) {
  const steps = ['Account','Personal','Documents','Sign'];
  return (
    <div style={{display:'flex',alignItems:'center',marginBottom:32}}>
      {steps.map((s,i)=>(
        <div key={i} style={{display:'flex',alignItems:'center',flex:i<steps.length-1?1:'none'}}>
          <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:6,flexShrink:0}}>
            <div style={{width:38,height:38,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,fontWeight:700,background:i<step?C.green:i===step?`linear-gradient(135deg,${C.gold},#8a6a1e)`:C.goldL,color:i<=step?'#fff':C.gold,border:i>step?`1.5px solid ${C.goldB}`:'none'}}>{i<step?'✓':i+1}</div>
            <div style={{fontSize:9,fontWeight:700,letterSpacing:'0.12em',textTransform:'uppercase',color:i===step?C.gold:i<step?C.green:C.light,whiteSpace:'nowrap'}}>{s}</div>
          </div>
          {i<steps.length-1&&<div style={{flex:1,height:2,background:i<step?C.green:C.goldB,margin:'0 6px',marginBottom:22}}/>}
        </div>
      ))}
    </div>
  );
}

function SuccessScreen({ name, role, onLogin }) {
  const roleLabel = role==='buyer'?'Buyer':role==='renter'?'License Holder':'Artist';
  return (
    <div style={{minHeight:'100vh',background:C.cream,display:'flex',alignItems:'center',justifyContent:'center',padding:24,fontFamily:"'DM Sans',sans-serif"}}>
      <div style={{maxWidth:480,width:'100%',textAlign:'center'}}>
        <div style={{width:80,height:80,borderRadius:'50%',background:'rgba(74,158,107,0.12)',border:'2px solid rgba(74,158,107,0.3)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:36,margin:'0 auto 24px'}}>✓</div>
        <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:32,fontWeight:300,color:C.dark,marginBottom:8}}>Registration Complete</div>
        <div style={{fontSize:15,color:C.mid,marginBottom:28,lineHeight:1.8}}>Thank you, <strong>{name}</strong>.<br/>Your {roleLabel} application is submitted.<br/>Vollard Black will review and approve — you'll be notified once access is granted.</div>
        <div style={{padding:'16px 20px',background:'rgba(182,139,46,0.08)',border:`1px solid ${C.goldB}`,borderRadius:12,marginBottom:28,fontSize:13,color:'#5a4820',lineHeight:1.7}}>⏳ Approval typically takes <strong>1 business day</strong>.<br/>Sign in at any time to check your status.</div>
        <button onClick={onLogin} style={{width:'100%',padding:'16px',borderRadius:12,border:'none',background:`linear-gradient(135deg,${C.gold},#8a6a1e)`,color:'#fff',fontSize:15,fontWeight:700,cursor:'pointer',fontFamily:"'DM Sans',sans-serif",boxShadow:'0 6px 20px rgba(182,139,46,0.30)'}}>Sign In to Your Portal →</button>
      </div>
    </div>
  );
}

export default function KYCRegistration({ role, supabase, onComplete, onSignIn }) {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [done, setDone] = useState(false);
  const [submittedName, setSubmittedName] = useState('');

  // Camera state lives HERE at top level — never causes form reset
  const [cam, setCam] = useState(null); // null | { target:'idFront'|'idBack'|'selfie', facingMode:'environment'|'user' }

  const rc = { buyer:{label:'Buyer',portal:'Buyer Portal',color:'#c45c4a'}, renter:{label:'License Holder',portal:'Renter Portal',color:C.gold}, artist:{label:'Artist',portal:'Artist Portal',color:'#648cc8'} }[role]||{label:'Register',portal:'Portal',color:C.gold};

  const [f, setF] = useState({ email:'', password:'', confirmPassword:'', title:'', firstName:'', lastName:'', idType:'RSA ID', idNumber:'', passportNumber:'', dob:'', gender:'', occupation:'', mobile:'', address1:'', address2:'', city:'', postalCode:'', country:'South Africa', emergencyName:'', emergencyRelationship:'', emergencyPhone:'', medium:'', style:'', instagram:'', website:'', bio:'', message:'' });
  const s = (k,v) => setF(p=>({...p,[k]:v}));

  const [idFront, setIdFront] = useState(null);
  const [idBack, setIdBack] = useState(null);
  const [selfie, setSelfie] = useState(null);
  const [signature, setSignature] = useState(null);
  const [terms, setTerms] = useState(false);

  const age = f.dob ? Math.floor((new Date()-new Date(f.dob))/(365.25*24*3600*1000)) : '';
  const pwChecks = [f.password.length>=8,/[A-Z]/.test(f.password),/[0-9]/.test(f.password),f.password===f.confirmPassword&&f.confirmPassword.length>0];

  // Camera capture — sets the right state without touching anything else
  const handleCapture = (fileObj) => {
    if (cam?.target === 'idFront') setIdFront(fileObj);
    else if (cam?.target === 'idBack') setIdBack(fileObj);
    else if (cam?.target === 'selfie') setSelfie(fileObj);
    setCam(null);
  };

  const validate = () => {
    if(step===0){if(!f.email)return'Email is required.';if(f.password.length<8)return'Password must be at least 8 characters.';if(!/[A-Z]/.test(f.password))return'Password needs an uppercase letter.';if(!/[0-9]/.test(f.password))return'Password needs a number.';if(f.password!==f.confirmPassword)return'Passwords do not match.';}
    if(step===1){if(!f.title)return'Please select a title.';if(!f.firstName||!f.lastName)return'Full name is required.';if(!f.idNumber&&!f.passportNumber)return'ID or passport number is required.';if(!f.dob)return'Date of birth is required.';if(!f.gender)return'Gender is required.';if(!f.mobile)return'Phone number is required.';if(role==='artist'&&!f.medium)return'Primary medium is required.';}
    if(step===2){if(!f.address1||!f.city||!f.postalCode)return'Please complete your address.';if(!f.emergencyName||!f.emergencyPhone||!f.emergencyRelationship)return'Emergency contact required.';if(!idFront)return'Please upload your ID / passport front.';if(!selfie)return'Please take a selfie photo.';}
    if(step===3){if(!signature)return'Please draw your signature.';if(!terms)return'Please accept the Terms & Conditions.';}
    return null;
  };

  const next = async () => {
    const err = validate();
    if(err){setError(err);window.scrollTo({top:0,behavior:'smooth'});return;}
    setError('');
    if(step<3){setStep(s=>s+1);window.scrollTo({top:0,behavior:'smooth'});return;}
    setLoading(true);
    try {
      let userId = null;
      const {data:authData,error:authErr} = await supabase.auth.signUp({email:f.email,password:f.password});
      if(authErr && (authErr.message?.includes('already registered')||authErr.message?.includes('already been registered')||authErr.status===400)){
        const {data:signInData,error:signInErr} = await supabase.auth.signInWithPassword({email:f.email,password:f.password});
        if(signInErr) throw new Error('This email is already registered. Please sign in instead.');
        userId = signInData.user?.id;
      } else if(authErr){
        throw authErr;
      } else {
        userId = authData.user?.id;
      }
      if(!userId) throw new Error('Could not create account. Please try again.');
      const base = `${role}/${userId}`;
      const uploadDoc = async(fileObj,path)=>{
        if(!fileObj?.file)return null;
        await supabase.storage.from('kyc-documents').upload(path,fileObj.file,{upsert:true,contentType:fileObj.type});
        const{data:u}=supabase.storage.from('kyc-documents').getPublicUrl(path);
        return u?.publicUrl||null;
      };
      const[frontUrl,backUrl,selfieUrl]=await Promise.all([uploadDoc(idFront,`${base}/id-front`),uploadDoc(idBack,`${base}/id-back`),uploadDoc(selfie,`${base}/selfie`)]);
      if(signature){const blob=await(await fetch(signature)).blob();await supabase.storage.from('kyc-documents').upload(`${base}/signature.png`,blob,{upsert:true,contentType:'image/png'});}
      const msg=[`ID Type: ${f.idType}`,f.idNumber&&`ID: ${f.idNumber}`,f.passportNumber&&`Passport: ${f.passportNumber}`,f.dob&&`DOB: ${f.dob}`,age&&`Age: ${age}`,f.gender&&`Gender: ${f.gender}`,f.occupation&&`Occupation: ${f.occupation}`,`Address: ${f.address1}${f.address2?', '+f.address2:''}, ${f.city}, ${f.postalCode}, ${f.country}`,`Emergency: ${f.emergencyName} (${f.emergencyRelationship}) ${f.emergencyPhone}`,frontUrl&&`ID Front: ${frontUrl}`,backUrl&&`ID Back: ${backUrl}`,selfieUrl&&`Selfie: ${selfieUrl}`,role==='artist'&&f.medium&&`Medium: ${f.medium}`,role==='artist'&&f.style&&`Style: ${f.style}`,role==='artist'&&f.instagram&&`Instagram: ${f.instagram}`,f.message&&`Note: ${f.message}`].filter(Boolean).join(' | ');
      const {data:existingReq} = await supabase.from('portal_requests').select('id,status').eq('email',f.email).eq('role',role).single();
      if(existingReq){
        await supabase.from('portal_requests').update({full_name:`${f.firstName} ${f.lastName}`,mobile:f.mobile,message:msg,status:'pending',id_document_url:frontUrl,selfie_url:selfieUrl}).eq('id',existingReq.id);
      } else {
        await supabase.from('portal_requests').insert({id:crypto.randomUUID(),email:f.email,full_name:`${f.firstName} ${f.lastName}`,mobile:f.mobile,role,message:msg,status:'pending',id_document_url:frontUrl,selfie_url:selfieUrl});
      }
      await supabase.auth.signInWithPassword({email:f.email,password:f.password});
      setSubmittedName(f.firstName);
      setDone(true);
      window.scrollTo({top:0,behavior:'smooth'});
    }catch(e){setError(e.message||'Registration failed. Please try again.');}
    setLoading(false);
  };

  if(done) return <SuccessScreen name={submittedName} role={role} onLogin={onSignIn}/>;

  return(
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500&family=DM+Sans:wght@300;400;500;600&display=swap');
        *{box-sizing:border-box;}
        input:focus,select:focus,textarea:focus{border-color:${C.gold}!important;box-shadow:0 0 0 3px rgba(182,139,46,0.10)!important;outline:none;}
        @keyframes slideUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        select{background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%238a8070' stroke-width='1.5' fill='none'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 14px center;padding-right:40px!important;}
      `}</style>

      {/* Camera modal — always at root level, never causes form remount */}
      {cam && (
        <CameraModal
          facingMode={cam.facingMode}
          onCapture={handleCapture}
          onClose={()=>setCam(null)}
        />
      )}

      <div style={{minHeight:'100vh',background:C.cream,fontFamily:"'DM Sans',sans-serif",color:C.dark}}>
        <div style={{background:C.white,borderBottom:`1px solid ${C.goldB}`,padding:'0 20px',height:56,display:'flex',alignItems:'center',justifyContent:'space-between',position:'sticky',top:0,zIndex:10,boxShadow:'0 1px 12px rgba(0,0,0,0.06)'}}>
          <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:17,fontWeight:300,letterSpacing:'0.22em',color:C.dark}}>VOLLARD <span style={{color:C.gold}}>BLACK</span></div>
          <button onClick={onSignIn} style={{background:'none',border:`1px solid ${C.goldB}`,borderRadius:8,color:C.mid,cursor:'pointer',padding:'8px 14px',fontSize:12,fontFamily:"'DM Sans',sans-serif",fontWeight:500}}>Sign In →</button>
        </div>

        <div style={{maxWidth:560,margin:'0 auto',padding:'28px 16px 80px'}}>
          <div style={{marginBottom:28}}>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:30,fontWeight:300,color:C.dark,marginBottom:4}}>{rc.label} Registration</div>
            <div style={{fontSize:13,color:C.light}}>Fields marked <span style={{color:C.red}}>*</span> are required. Your data is kept confidential.</div>
          </div>

          <StepBar step={step}/>

          {error&&<div style={{padding:'14px 16px',background:'rgba(196,92,74,0.08)',border:'1px solid rgba(196,92,74,0.25)',borderRadius:12,fontSize:14,color:C.red,marginBottom:20,display:'flex',gap:10,alignItems:'flex-start'}}><span style={{fontSize:18,flexShrink:0}}>⚠</span>{error}</div>}

          <div style={{background:C.white,border:`1px solid ${C.goldB}`,borderRadius:18,padding:'24px 20px 20px',boxShadow:'0 4px 24px rgba(0,0,0,0.07)'}}>

            {/* STEP 0 — Account */}
            {step===0&&<div>
              <Sect title="Account Details"/>
              <F label="Email Address" required>
                <input type="email" value={f.email} onChange={e=>s('email',e.target.value)} style={inp} placeholder="you@email.com" autoComplete="email" inputMode="email"/>
              </F>
              <F label="Password" required hint="Min 8 characters, one uppercase, one number">
                <div style={{position:'relative'}}>
                  <input type={showPw?'text':'password'} value={f.password} onChange={e=>s('password',e.target.value)} style={{...inp,paddingRight:60}} autoComplete="new-password"/>
                  <button type="button" onClick={()=>setShowPw(p=>!p)} style={{position:'absolute',right:14,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',color:C.light,cursor:'pointer',fontSize:12,fontFamily:"'DM Sans',sans-serif",fontWeight:600}}>{showPw?'Hide':'Show'}</button>
                </div>
                <div style={{display:'flex',gap:8,marginTop:10,flexWrap:'wrap'}}>
                  {['8+ chars','Uppercase','Number','Passwords match'].map((t,i)=>(
                    <span key={t} style={{fontSize:11,padding:'3px 10px',borderRadius:20,background:pwChecks[i]?'rgba(74,158,107,0.12)':'rgba(182,139,46,0.08)',color:pwChecks[i]?C.green:C.light,fontWeight:600}}>{pwChecks[i]?'✓':''} {t}</span>
                  ))}
                </div>
              </F>
              <F label="Confirm Password" required>
                <input type={showPw?'text':'password'} value={f.confirmPassword} onChange={e=>s('confirmPassword',e.target.value)} style={inp} autoComplete="new-password"/>
              </F>
            </div>}

            {/* STEP 1 — Personal */}
            {step===1&&<div>
              <Sect title="Personal Details"/>
              <Grid cols="80px 1fr 1fr">
                <F label="Title" required>
                  <select value={f.title} onChange={e=>s('title',e.target.value)} style={inp}>
                    <option value="">—</option>
                    {['Mr','Mrs','Ms','Dr','Prof'].map(t=><option key={t}>{t}</option>)}
                  </select>
                </F>
                <F label="First Name" required><input value={f.firstName} onChange={e=>s('firstName',e.target.value)} style={inp} autoCapitalize="words"/></F>
                <F label="Last Name" required><input value={f.lastName} onChange={e=>s('lastName',e.target.value)} style={inp} autoCapitalize="words"/></F>
              </Grid>
              <F label="ID Type" required>
                <select value={f.idType} onChange={e=>s('idType',e.target.value)} style={inp}>
                  {["RSA ID","Driver's Licence","Passport"].map(t=><option key={t}>{t}</option>)}
                </select>
              </F>
              {f.idType==='Passport'?(
                <F label="Passport Number" required><input value={f.passportNumber} onChange={e=>s('passportNumber',e.target.value)} style={inp}/></F>
              ):(
                <F label="ID Number" required><input value={f.idNumber} onChange={e=>s('idNumber',e.target.value)} style={inp} inputMode="numeric"/></F>
              )}
              <Grid>
                <F label="Date of Birth" required><input type="date" value={f.dob} onChange={e=>s('dob',e.target.value)} style={inp}/></F>
                <F label="Gender" required>
                  <select value={f.gender} onChange={e=>s('gender',e.target.value)} style={inp}>
                    <option value="">— Select</option>
                    {['Male','Female','Non-binary','Prefer not to say'].map(g=><option key={g}>{g}</option>)}
                  </select>
                </F>
              </Grid>
              <Grid>
                <F label="Mobile Number" required><input type="tel" value={f.mobile} onChange={e=>s('mobile',e.target.value)} style={inp} placeholder="+27 82 000 0000" inputMode="tel"/></F>
                <F label="Occupation"><input value={f.occupation} onChange={e=>s('occupation',e.target.value)} style={inp} placeholder="e.g. Art Collector"/></F>
              </Grid>
              {role==='artist'&&<>
                <div style={{height:1,background:C.goldB,margin:'8px 0 24px'}}/>
                <Sect title="Artist Details"/>
                <F label="Primary Medium" required><input value={f.medium} onChange={e=>s('medium',e.target.value)} style={inp} placeholder="e.g. Oil on Canvas"/></F>
                <F label="Style"><input value={f.style} onChange={e=>s('style',e.target.value)} style={inp} placeholder="e.g. Contemporary Realism"/></F>
                <Grid>
                  <F label="Instagram"><input value={f.instagram} onChange={e=>s('instagram',e.target.value)} style={inp} placeholder="@yourhandle"/></F>
                  <F label="Website"><input value={f.website} onChange={e=>s('website',e.target.value)} style={inp} placeholder="https://..."/></F>
                </Grid>
                <F label="Artist Statement / Bio"><textarea value={f.bio} onChange={e=>s('bio',e.target.value)} style={{...inp,minHeight:90,resize:'vertical'}} placeholder="Tell us about your work…"/></F>
              </>}
              <F label="Additional Notes (optional)">
                <textarea value={f.message} onChange={e=>s('message',e.target.value)} style={{...inp,minHeight:70,resize:'vertical'}} placeholder="Anything you'd like Vollard Black to know…"/>
              </F>
            </div>}

            {/* STEP 2 — Documents */}
            {step===2&&<div>
              <Sect title="Address"/>
              <F label="Address Line 1" required><input value={f.address1} onChange={e=>s('address1',e.target.value)} style={inp} placeholder="Street number and name" autoCapitalize="words"/></F>
              <F label="Address Line 2"><input value={f.address2} onChange={e=>s('address2',e.target.value)} style={inp} placeholder="Suburb / Complex / Unit" autoCapitalize="words"/></F>
              <Grid cols="1fr 100px">
                <F label="City" required><input value={f.city} onChange={e=>s('city',e.target.value)} style={inp} autoCapitalize="words"/></F>
                <F label="Postal Code" required><input value={f.postalCode} onChange={e=>s('postalCode',e.target.value)} style={inp} inputMode="numeric"/></F>
              </Grid>
              <F label="Country" required>
                <select value={f.country} onChange={e=>s('country',e.target.value)} style={inp}>
                  {COUNTRIES.map(c=><option key={c}>{c}</option>)}
                </select>
              </F>
              <div style={{height:1,background:C.goldB,margin:'8px 0 24px'}}/>
              <Sect title="Emergency Contact"/>
              <F label="Full Name" required><input value={f.emergencyName} onChange={e=>s('emergencyName',e.target.value)} style={inp} autoCapitalize="words"/></F>
              <F label="Relationship" required>
                <select value={f.emergencyRelationship} onChange={e=>s('emergencyRelationship',e.target.value)} style={inp}>
                  <option value="">— Select relationship</option>
                  {RELATIONSHIPS.map(r=><option key={r}>{r}</option>)}
                </select>
              </F>
              <F label="Phone Number" required><input type="tel" value={f.emergencyPhone} onChange={e=>s('emergencyPhone',e.target.value)} style={inp} placeholder="+27 82 000 0000" inputMode="tel"/></F>
              <div style={{height:1,background:C.goldB,margin:'8px 0 24px'}}/>
              <Sect title="Identity Documents"/>
              <UpBox label={`${f.idType} — Front`} required value={idFront} onChange={setIdFront}
                hint="All four corners clearly visible"
                onOpenCamera={()=>setCam({target:'idFront',facingMode:'environment'})}/>
              <UpBox label={f.idType==='RSA ID'||f.idType==="Driver's Licence"?`${f.idType} — Back`:'Passport Photo Page'}
                value={idBack} onChange={setIdBack}
                hint={f.idType==='Passport'?'Page showing your photo and details':'Back of your card'}
                onOpenCamera={()=>setCam({target:'idBack',facingMode:'environment'})}/>
              <UpBox label="Selfie with ID" required value={selfie} onChange={setSelfie}
                hint="Hold your ID next to your face. Use front camera."
                onOpenCamera={()=>setCam({target:'selfie',facingMode:'user'})}/>
            </div>}

            {/* STEP 3 — Sign */}
            {step===3&&<div>
              <Sect title="Declaration & Signature"/>
              <div style={{padding:'16px',background:C.goldL,border:`1px solid ${C.goldB}`,borderRadius:12,fontSize:14,color:'#5a4820',lineHeight:1.8,marginBottom:24}}>
                I, <strong>{f.firstName} {f.lastName}</strong>, confirm that all information provided is accurate and I agree to the{' '}
                <a href="/terms" target="_blank" rel="noreferrer" style={{color:C.gold,fontWeight:700}}>Vollard Black Terms & Conditions</a>.
              </div>
              <SigPad onChange={setSignature}/>
              <div style={{marginTop:20,padding:'16px',background:C.cream,borderRadius:12,border:`1px solid ${C.goldB}`}}>
                <label style={{display:'flex',alignItems:'flex-start',gap:14,cursor:'pointer'}}>
                  <input type="checkbox" checked={terms} onChange={e=>setTerms(e.target.checked)} style={{width:20,height:20,marginTop:2,accentColor:C.gold,flexShrink:0}}/>
                  <span style={{fontSize:14,color:'#4a4440',lineHeight:1.75}}>I confirm I have read and agree to the <a href="/terms" target="_blank" rel="noreferrer" style={{color:C.gold,fontWeight:700}}>Terms & Conditions</a> and consent to my personal information being processed in accordance with POPIA.</span>
                </label>
              </div>
              <div style={{marginTop:20,padding:'16px',background:C.white,border:`1px solid ${C.goldB}`,borderRadius:12}}>
                <div style={{fontSize:10,fontWeight:700,letterSpacing:'0.18em',textTransform:'uppercase',color:C.mid,marginBottom:14}}>Registration Summary</div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,fontSize:13,marginBottom:14}}>
                  {[['Name',`${f.title} ${f.firstName} ${f.lastName}`],['Email',f.email],['ID',f.idType==='Passport'?f.passportNumber:f.idNumber],['DOB',f.dob?`${f.dob} (Age ${age})`:'—'],['Phone',f.mobile],['Location',`${f.city}, ${f.country}`]].map(([k,v])=>(
                    <div key={k}><span style={{color:C.light,display:'block',fontSize:10,marginBottom:2}}>{k}</span><span style={{fontWeight:600}}>{v||'—'}</span></div>
                  ))}
                </div>
                <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                  {[idFront&&'ID Front',idBack&&'ID Back',selfie&&'Selfie',signature&&'Signed'].filter(Boolean).map(t=>(
                    <span key={t} style={{fontSize:12,color:C.green,background:'rgba(74,158,107,0.10)',padding:'4px 12px',borderRadius:20,fontWeight:700}}>✓ {t}</span>
                  ))}
                </div>
              </div>
            </div>}
          </div>

          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:20}}>
            <button type="button" onClick={step===0?onSignIn:()=>{setStep(s=>Math.max(0,s-1));setError('');window.scrollTo({top:0,behavior:'smooth'});}} style={{padding:'14px 22px',borderRadius:12,border:`1px solid ${C.goldB}`,background:'transparent',color:C.mid,cursor:'pointer',fontSize:14,fontWeight:500,fontFamily:"'DM Sans',sans-serif"}}>
              {step===0?'← Sign In':'← Back'}
            </button>
            <div style={{fontSize:12,color:C.light}}>Step {step+1} of 4</div>
            <button type="button" onClick={next} disabled={loading} style={{padding:'14px 32px',borderRadius:12,border:'none',background:`linear-gradient(135deg,${C.gold},#8a6a1e)`,color:'#fff',cursor:loading?'not-allowed':'pointer',fontSize:14,fontWeight:700,fontFamily:"'DM Sans',sans-serif",opacity:loading?0.7:1,minWidth:140,boxShadow:'0 4px 16px rgba(182,139,46,0.30)'}}>
              {loading?'Submitting…':step===3?'Submit':'Next →'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
