'use client';
import { useState, useEffect, useCallback } from "react";

// ─── Constants (FAIS Compliant — no investment claims) ───
const VB_SPLIT = 0.40;
const COLLECTOR_SPLIT = 0.60;
const GALLERY_BACK = 0.40;
const VB_BACK = 0.30;
const ARTIST_BACK = 0.30;
const MAX_TERM = 24;

const fmt = (n) => Number(n||0).toLocaleString("en-ZA",{minimumFractionDigits:2,maximumFractionDigits:2});
const uid = () => "VB"+Date.now().toString(36)+Math.random().toString(36).slice(2,6);
const td = () => new Date().toISOString().slice(0,10);
const SK = "vollard_black_v3";
const load = () => { try { const d=JSON.parse(localStorage.getItem(SK)); return d?.artworks?d:fresh(); } catch{return fresh();} };
const fresh = () => ({artworks:[],artists:[],collectors:[],invoices:[],payments:[],sales:[]});

// ─── Icons ───
const I={
  dash:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
  art:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>,
  ppl:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>,
  calc:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/></svg>,
  bill:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
  sale:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>,
  star:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="8" r="4"/><path d="M4 21v-1a6 6 0 0112 0v1"/><path d="M16 11l2 2 4-4"/></svg>,
  plus:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  x:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  edit:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  del:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>,
  ok:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>,
  menu:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
  up:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>,
  ai:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>,
};

const stC={Available:{bg:"rgba(74,158,107,0.12)",c:"#4a9e6b"},Reserved:{bg:"rgba(182,139,46,0.12)",c:"#b68b2e"},"In Gallery":{bg:"rgba(100,140,200,0.12)",c:"#648cc8"},Sold:{bg:"rgba(196,92,74,0.12)",c:"#c45c4a"}};
const payM=["EFT / Bank Transfer","PayFast","Crypto (USDT)","Cash","Other"];

// ─── UI Components ───
const is={width:"100%",padding:"12px 14px",background:"#1e1d1a",border:"1px solid rgba(182,139,46,0.1)",borderRadius:8,color:"#f5f0e8",fontFamily:"'DM Sans',sans-serif",fontSize:14,outline:"none"};
const ss={...is,cursor:"pointer",appearance:"none",WebkitAppearance:"none"};
const Card=({children,style:s})=><div style={{background:"#151412",border:"1px solid rgba(182,139,46,0.1)",borderRadius:14,padding:24,...s}}>{children}</div>;
const Btn=({children,gold,ghost,small,onClick,style:s,disabled:d})=><button disabled={d} onClick={onClick} style={{display:"inline-flex",alignItems:"center",gap:6,padding:small?"8px 14px":"12px 22px",borderRadius:8,border:ghost?"1px solid rgba(182,139,46,0.2)":"none",cursor:d?"not-allowed":"pointer",fontSize:small?11:12,fontWeight:600,letterSpacing:1,textTransform:"uppercase",fontFamily:"'DM Sans',sans-serif",transition:"all 0.2s",opacity:d?0.4:1,background:gold?"linear-gradient(135deg,#b68b2e,#8a6a1e)":ghost?"transparent":"#1e1d1a",color:gold?"#0c0b09":ghost?"#b68b2e":"#e8e2d6",...s}}>{children}</button>;
const Badge=({status})=>{const s=stC[status]||{bg:"#1e1d1a",c:"#8a8477"};return<span style={{display:"inline-block",padding:"4px 10px",borderRadius:6,fontSize:11,fontWeight:600,background:s.bg,color:s.c}}>{status}</span>;};
const Field=({label,children,style:s})=><div style={{marginBottom:16,...s}}><label style={{display:"block",fontSize:10,fontWeight:500,letterSpacing:2,textTransform:"uppercase",color:"#8a8477",marginBottom:6}}>{label}</label>{children}</div>;
const Stat=({label,value,gold,green})=><Card style={{padding:18,textAlign:"center"}}><div style={{fontSize:10,letterSpacing:2,textTransform:"uppercase",color:"#5a564e",marginBottom:6}}>{label}</div><div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:26,fontWeight:600,color:gold?"#b68b2e":green?"#4a9e6b":"#f5f0e8"}}>{value}</div></Card>;
const Empty=({msg,action})=><div style={{textAlign:"center",padding:"48px 20px",color:"#5a564e"}}><div style={{fontSize:42,marginBottom:12,opacity:0.3}}>◆</div><p style={{fontSize:14,marginBottom:16}}>{msg}</p>{action}</div>;
const Modal=({title,onClose,children,wide})=><div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}><div style={{background:"#151412",border:"1px solid rgba(182,139,46,0.15)",borderRadius:16,width:"100%",maxWidth:wide?700:520,maxHeight:"90vh",overflow:"auto",padding:28}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}><h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,fontWeight:400,color:"#f5f0e8",margin:0}}>{title}</h2><button onClick={onClose} style={{background:"none",border:"none",color:"#8a8477",cursor:"pointer"}}>{I.x}</button></div>{children}</div></div>;
const PT=({title,sub,action})=><div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:28,flexWrap:"wrap",gap:12}}><div><h1 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:28,fontWeight:400,color:"#f5f0e8",letterSpacing:1,margin:0}}>{title}</h1>{sub&&<p style={{fontSize:12,color:"#5a564e",marginTop:4,letterSpacing:1}}>{sub}</p>}</div>{action}</div>;
const Tbl=({cols,data:rows})=><div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse"}}><thead><tr>{cols.map((c,i)=><th key={i} style={{fontSize:10,fontWeight:600,letterSpacing:1.5,textTransform:"uppercase",color:"#5a564e",padding:"10px 12px",textAlign:c.right?"right":"left",borderBottom:"1px solid rgba(182,139,46,0.08)",whiteSpace:"nowrap"}}>{c.label}</th>)}</tr></thead><tbody>{rows.map((row,ri)=><tr key={ri} onMouseEnter={e=>e.currentTarget.style.background="rgba(182,139,46,0.03)"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>{cols.map((c,ci)=><td key={ci} style={{fontSize:13,color:c.gold?"#b68b2e":c.green?"#4a9e6b":"#e8e2d6",fontWeight:c.bold?600:400,padding:"12px",textAlign:c.right?"right":"left",borderBottom:"1px solid rgba(182,139,46,0.04)",whiteSpace:"nowrap"}}>{c.render?c.render(row):row[c.key]}</td>)}</tr>)}</tbody></table></div>;

// ═══════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════
export default function App() {
  const [data,setData]=useState(load);
  const [page,setPage]=useState("dashboard");
  const [sb,setSb]=useState(false);
  useEffect(()=>{localStorage.setItem(SK,JSON.stringify(data));},[data]);
  const up=useCallback((k,v)=>setData(p=>({...p,[k]:typeof v==="function"?v(p[k]):v})),[]);

  const nav=[
    {id:"dashboard",label:"Dashboard",icon:I.dash},
    {id:"catalogue",label:"Art Catalogue",icon:I.art},
    {id:"artists",label:"Artists",icon:I.star},
    {id:"collectors",label:"Collectors",icon:I.ppl},
    {id:"calculator",label:"Calculator",icon:I.calc},
    {id:"invoices",label:"Invoicing",icon:I.bill},
    {id:"sales",label:"Sales",icon:I.sale},
  ];

  const pg={
    dashboard:<Dashboard data={data} setPage={setPage}/>,
    catalogue:<Catalogue data={data} up={up}/>,
    artists:<ArtistsPage data={data} up={up}/>,
    collectors:<CollectorsPage data={data} up={up}/>,
    calculator:<CalcPage/>,
    invoices:<InvoicePage data={data} up={up}/>,
    sales:<SalesPage data={data} up={up}/>,
  };

  return(
    <div style={{display:"flex",minHeight:"100vh",background:"#0c0b09",fontFamily:"'DM Sans',sans-serif",color:"#e8e2d6"}}>
      {sb&&<div onClick={()=>setSb(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",zIndex:98}}/>}
      <aside style={{width:240,minHeight:"100vh",background:"#111010",borderRight:"1px solid rgba(182,139,46,0.1)",display:"flex",flexDirection:"column",position:"fixed",left:sb?0:"-240px",top:0,bottom:0,zIndex:99,transition:"left 0.3s",...(typeof window!=="undefined"&&window.innerWidth>900?{position:"relative",left:0}:{})}}>
        <div style={{padding:"28px 24px 20px",borderBottom:"1px solid rgba(182,139,46,0.08)"}}>
          <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,fontWeight:300,letterSpacing:6,color:"#f5f0e8"}}>VOLLARD <span style={{color:"#b68b2e"}}>BLACK</span></div>
          <div style={{fontSize:9,letterSpacing:3,textTransform:"uppercase",color:"#5a564e",marginTop:4}}>Fine Art Acquisitions</div>
        </div>
        <nav style={{flex:1,padding:"16px 12px"}}>
          {nav.map(n=><button key={n.id} onClick={()=>{setPage(n.id);setSb(false);}} style={{display:"flex",alignItems:"center",gap:12,width:"100%",padding:"12px 14px",background:page===n.id?"rgba(182,139,46,0.1)":"transparent",border:"none",borderRadius:10,color:page===n.id?"#b68b2e":"#8a8477",fontSize:13,fontWeight:page===n.id?600:400,cursor:"pointer",marginBottom:4,fontFamily:"'DM Sans',sans-serif"}}>{n.icon}<span>{n.label}</span></button>)}
        </nav>
        <div style={{padding:"16px 24px",borderTop:"1px solid rgba(182,139,46,0.08)",fontSize:10,color:"#5a564e",letterSpacing:2}}>
          <div>VB 40% · COLLECTOR 60%</div>
          <div style={{marginTop:4}}>GALLERY 40 · VB 30 · ARTIST 30</div>
        </div>
      </aside>
      <main style={{flex:1,minWidth:0}}>
        <div style={{display:typeof window!=="undefined"&&window.innerWidth>900?"none":"flex",alignItems:"center",padding:"16px 20px",borderBottom:"1px solid rgba(182,139,46,0.08)",background:"#111010"}}>
          <button onClick={()=>setSb(true)} style={{background:"none",border:"none",color:"#b68b2e",cursor:"pointer",padding:4}}>{I.menu}</button>
          <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:16,letterSpacing:4,marginLeft:12,color:"#f5f0e8"}}>VOLLARD <span style={{color:"#b68b2e"}}>BLACK</span></span>
        </div>
        <div style={{padding:"32px 28px",maxWidth:1200,margin:"0 auto"}}>{pg[page]}</div>
      </main>
    </div>
  );
}

// ═══════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════
function Dashboard({data,setPage}){
  const totalPay=data.payments.reduce((s,p)=>s+(p.amount||0),0);
  const totalSaleVB=data.sales.reduce((s,x)=>s+(x.vbShare||0),0);
  // Monthly revenue
  const md={};
  data.payments.forEach(p=>{const k=(p.date||"").slice(0,7);if(k)md[k]=(md[k]||0)+(p.amount||0);});
  const sm=Object.keys(md).sort();
  const mx=Math.max(...Object.values(md),1);
  const months=["","Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  // Upcoming
  const now=td();
  const in30=new Date();in30.setDate(in30.getDate()+30);
  const upcoming=data.invoices.filter(i=>i.status!=="Paid"&&i.dueDate>=now&&i.dueDate<=in30.toISOString().slice(0,10)).sort((a,b)=>a.dueDate.localeCompare(b.dueDate)).slice(0,8);
  const overdue=data.invoices.filter(i=>i.status==="Overdue");

  return(<div>
    <PT title="Dashboard" sub="Vollard Black — Art Acquisition & Sales Platform"/>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:14,marginBottom:28}}>
      <Stat label="Artworks" value={data.artworks.length}/><Stat label="Artists" value={data.artists.length}/><Stat label="Collectors" value={data.collectors.length}/><Stat label="Sales" value={data.sales.length} gold/><Stat label="Payments In" value={"R "+fmt(totalPay)} green/><Stat label="Sale Revenue" value={"R "+fmt(totalSaleVB)} gold/>
    </div>
    <Card style={{marginBottom:20}}>
      <div style={{fontSize:14,fontWeight:600,color:"#f5f0e8",marginBottom:16}}>Monthly Revenue</div>
      {sm.length===0?<div style={{textAlign:"center",padding:"32px 0",color:"#5a564e",fontSize:13}}>No payment data yet.</div>:
      <div style={{display:"flex",alignItems:"flex-end",gap:6,height:180,padding:"0 8px"}}>
        {sm.map(m=>{const v=md[m];const h=Math.max((v/mx)*150,4);return(
          <div key={m} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4,maxWidth:60}}>
            <div style={{fontSize:10,color:"#b68b2e",fontWeight:600}}>R{(v/1000).toFixed(0)}k</div>
            <div style={{width:"100%",height:h,background:"linear-gradient(180deg,#b68b2e,#8a6a1e)",borderRadius:"4px 4px 0 0",minWidth:20}}/>
            <div style={{fontSize:9,color:"#5a564e"}}>{months[parseInt(m.slice(5))]||m.slice(5)}</div>
          </div>);
        })}
      </div>}
    </Card>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
      <Card>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <div style={{fontSize:14,fontWeight:600,color:"#f5f0e8"}}>Upcoming Payments</div>
          {overdue.length>0&&<span style={{fontSize:11,color:"#c45c4a",fontWeight:600,background:"rgba(196,92,74,0.12)",padding:"4px 10px",borderRadius:6}}>{overdue.length} overdue</span>}
        </div>
        {upcoming.length===0?<p style={{fontSize:13,color:"#5a564e"}}>No payments due in the next 30 days.</p>:
        upcoming.map(inv=><div key={inv.id} style={{display:"flex",justifyContent:"space-between",padding:"10px 0",borderBottom:"1px solid rgba(182,139,46,0.04)",fontSize:13}}>
          <div><div style={{color:"#e8e2d6",fontWeight:500}}>{inv.collectorName}</div><div style={{fontSize:11,color:"#5a564e"}}>{inv.artworkTitle} · {inv.type}</div></div>
          <div style={{textAlign:"right"}}><div style={{color:"#b68b2e",fontWeight:600}}>R {fmt(inv.amount)}</div><div style={{fontSize:11,color:"#8a8477"}}>{inv.dueDate}</div></div>
        </div>)}
      </Card>
      <Card>
        <div style={{fontSize:14,fontWeight:600,color:"#f5f0e8",marginBottom:16}}>Recent Activity</div>
        {data.sales.length===0&&data.payments.length===0?<p style={{fontSize:13,color:"#5a564e"}}>No activity yet.</p>:
        [...data.sales.slice(-3).reverse().map(s=><div key={s.id} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:"1px solid rgba(182,139,46,0.04)",fontSize:13}}><span>Sale: {s.artworkTitle}</span><span style={{color:"#4a9e6b",fontWeight:600}}>R {fmt(s.salePrice)}</span></div>),
        ...data.payments.slice(-3).reverse().map(p=><div key={p.id} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:"1px solid rgba(182,139,46,0.04)",fontSize:13}}><span>{p.collectorName}</span><span style={{color:"#b68b2e",fontWeight:600}}>R {fmt(p.amount)}</span></div>)]}
      </Card>
    </div>
    <div style={{display:"flex",gap:10,marginTop:24}}>
      <Btn gold onClick={()=>setPage("catalogue")}>{I.plus} Add Artwork</Btn>
      <Btn ghost onClick={()=>setPage("collectors")}>{I.plus} Add Collector</Btn>
      <Btn ghost onClick={()=>setPage("calculator")}>Calculator</Btn>
    </div>
  </div>);
}

// ═══════════════════════════════════════════
// CATALOGUE
// ═══════════════════════════════════════════
function Catalogue({data,up}){
  const [modal,setModal]=useState(null);const [search,setSearch]=useState("");
  const blank={id:"",title:"",artist:"",artistId:"",medium:"",dimensions:"",year:"",recommendedPrice:"",imageUrl:"",status:"Available",description:"",galleryName:"",insuranceMonthly:""};
  const save=(a)=>{if(a.id)up("artworks",p=>p.map(x=>x.id===a.id?a:x));else up("artworks",p=>[{...a,id:uid(),createdAt:td()},...p]);setModal(null);};
  const del=(id)=>{if(confirm("Delete?"))up("artworks",p=>p.filter(x=>x.id!==id));};
  const f=data.artworks.filter(a=>(a.title+a.artist+a.status).toLowerCase().includes(search.toLowerCase()));
  return(<div>
    <PT title="Art Catalogue" sub={`${data.artworks.length} artworks`} action={<Btn gold onClick={()=>setModal("add")}>{I.plus} Add Artwork</Btn>}/>
    <Card>
      <div style={{marginBottom:16}}><input placeholder="Search..." value={search} onChange={e=>setSearch(e.target.value)} style={{...is,maxWidth:360}}/></div>
      {f.length===0?<Empty msg="No artworks yet." action={<Btn gold onClick={()=>setModal("add")}>{I.plus} Add</Btn>}/>:
      <Tbl cols={[
        {label:"",render:r=>r.imageUrl?<div style={{width:44,height:44,borderRadius:6,overflow:"hidden",background:"#1e1d1a"}}><img src={r.imageUrl} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/></div>:<div style={{width:44,height:44,borderRadius:6,background:"rgba(182,139,46,0.08)",display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:16,color:"#5a564e"}}>◆</span></div>},
        {label:"Title",key:"title",bold:true},{label:"Artist",key:"artist"},
        {label:"Price",right:true,render:r=>"R "+fmt(r.recommendedPrice)},
        {label:"Collector 40%",right:true,gold:true,render:r=>"R "+fmt(r.recommendedPrice*VB_SPLIT)},
        {label:"Collector 60%",right:true,green:true,render:r=>"R "+fmt(r.recommendedPrice*COLLECTOR_SPLIT)},
        {label:"Status",render:r=><Badge status={r.status}/>},
        {label:"",render:r=><div style={{display:"flex",gap:6}}><button onClick={e=>{e.stopPropagation();setModal(r);}} style={{background:"none",border:"none",color:"#8a8477",cursor:"pointer"}}>{I.edit}</button><button onClick={e=>{e.stopPropagation();del(r.id);}} style={{background:"none",border:"none",color:"#5a564e",cursor:"pointer"}}>{I.del}</button></div>},
      ]} data={f}/>}
    </Card>
    {modal&&<ArtModal art={modal==="add"?blank:modal} artists={data.artists||[]} onSave={save} onClose={()=>setModal(null)}/>}
  </div>);
}

function ArtModal({art,artists,onSave,onClose}){
  const [f,sF]=useState({...art});const s=(k,v)=>sF(p=>({...p,[k]:v}));
  const [aiLoad,setAiLoad]=useState(false);
  const hFile=(file)=>{if(!file?.type.startsWith("image/"))return;if(file.size>5242880)return alert("Max 5MB");const r=new FileReader();r.onload=e=>s("imageUrl",e.target.result);r.readAsDataURL(file);};
  const aiDesc=async()=>{
    setAiLoad(true);
    try{
      const imgData=f.imageUrl?.startsWith("data:")?f.imageUrl.split(",")[1]:null;
      const mt=f.imageUrl?.startsWith("data:image/png")?"image/png":f.imageUrl?.startsWith("data:image/webp")?"image/webp":"image/jpeg";
      const msg=[{role:"user",content:imgData?[
        {type:"image",source:{type:"base64",media_type:mt,data:imgData}},
        {type:"text",text:`You are a fine art expert for Vollard Black. Describe this artwork in 2-3 compelling sentences for collectors. Focus on technique, composition, mood. Also identify medium and style if possible. Respond ONLY in JSON: {"description":"...","medium":"...","style":"..."}`}
      ]:[{type:"text",text:`Artwork: "${f.title||"Untitled"}" by ${f.artist||"Unknown"}${f.medium?", "+f.medium:""}. Write 2-3 sentences for collectors. JSON only: {"description":"...","medium":"...","style":""}`}]}];
      const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1000,messages:msg})});
      const d=await res.json();const txt=d.content?.map(i=>i.text||"").join("")||"";
      try{const p=JSON.parse(txt.replace(/```json|```/g,"").trim());if(p.description)s("description",p.description);if(p.medium&&!f.medium)s("medium",p.medium);}catch{if(txt.length>10)s("description",txt);}
    }catch(e){console.error(e);}
    setAiLoad(false);
  };
  return(
    <Modal title={art.id?"Edit Artwork":"Add Artwork"} onClose={onClose} wide>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
        <Field label="Title" style={{gridColumn:"1/-1"}}><input value={f.title} onChange={e=>s("title",e.target.value)} style={is}/></Field>
        <Field label="Artist (profile)"><select value={f.artistId||""} onChange={e=>{s("artistId",e.target.value);const a=artists.find(x=>x.id===e.target.value);if(a)s("artist",a.name);}} style={ss}><option value="">—</option>{artists.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}</select></Field>
        <Field label="Artist (manual)"><input value={f.artist} onChange={e=>s("artist",e.target.value)} style={is}/></Field>
        <Field label="Medium"><input value={f.medium} onChange={e=>s("medium",e.target.value)} style={is}/></Field>
        <Field label="Dimensions"><input value={f.dimensions} onChange={e=>s("dimensions",e.target.value)} style={is}/></Field>
        <Field label="Year"><input value={f.year} onChange={e=>s("year",e.target.value)} style={is}/></Field>
        <Field label="Price (R)"><input type="number" value={f.recommendedPrice} onChange={e=>s("recommendedPrice",Number(e.target.value))} style={is}/></Field>
        <Field label="Insurance/mo (R)"><input type="number" value={f.insuranceMonthly} onChange={e=>s("insuranceMonthly",Number(e.target.value))} style={is}/></Field>
        <Field label="Gallery"><input value={f.galleryName} onChange={e=>s("galleryName",e.target.value)} style={is}/></Field>
        <Field label="Status"><select value={f.status} onChange={e=>s("status",e.target.value)} style={ss}><option>Available</option><option>Reserved</option><option>In Gallery</option><option>Sold</option></select></Field>
        <Field label="Image" style={{gridColumn:"1/-1"}}>
          <div style={{display:"flex",gap:14,alignItems:"flex-start"}}>
            <div style={{flex:1,display:"flex",flexDirection:"column",gap:8}}>
              <Btn ghost onClick={()=>document.getElementById("imgUp").click()} style={{justifyContent:"center",width:"100%",padding:"14px"}}>{I.up} {f.imageUrl?"Change Image":"Upload Image"}</Btn>
              <input id="imgUp" type="file" accept="image/*" onChange={e=>hFile(e.target.files[0])} style={{display:"none"}}/>
              <div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:9,color:"#5a564e",letterSpacing:1,textTransform:"uppercase",whiteSpace:"nowrap"}}>URL:</span><input value={f.imageUrl?.startsWith("data:")?"":f.imageUrl||""} onChange={e=>s("imageUrl",e.target.value)} style={{...is,marginBottom:0,fontSize:12}} placeholder="https://..."/></div>
            </div>
            {f.imageUrl&&<div style={{position:"relative",flexShrink:0}}><div style={{width:140,height:140,borderRadius:10,overflow:"hidden",border:"1px solid rgba(182,139,46,0.15)"}}><img src={f.imageUrl} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/></div><button onClick={()=>s("imageUrl","")} style={{position:"absolute",top:4,right:4,width:22,height:22,borderRadius:6,background:"rgba(0,0,0,0.7)",border:"none",color:"#c45c4a",cursor:"pointer",fontSize:14}}>×</button></div>}
          </div>
        </Field>
        <Field label="Description" style={{gridColumn:"1/-1"}}>
          <textarea value={f.description} onChange={e=>s("description",e.target.value)} style={{...is,minHeight:80,resize:"vertical"}} placeholder="Describe the artwork or use AI..."/>
          <div style={{display:"flex",gap:8,marginTop:8}}>
            <button onClick={aiDesc} disabled={aiLoad} style={{display:"inline-flex",alignItems:"center",gap:8,padding:"10px 18px",borderRadius:8,background:"linear-gradient(135deg,rgba(100,80,200,0.15),rgba(182,139,46,0.1))",border:"1px solid rgba(100,80,200,0.3)",color:"#a090e0",fontSize:12,fontWeight:600,cursor:aiLoad?"not-allowed":"pointer",fontFamily:"'DM Sans',sans-serif",opacity:aiLoad?0.6:1}}>{I.ai} {aiLoad?"Analyzing...":f.imageUrl?"AI Describe from Image":"AI Describe from Title"}</button>
          </div>
        </Field>
      </div>
      <div style={{display:"flex",gap:10,marginTop:20,justifyContent:"flex-end"}}><Btn ghost onClick={onClose}>Cancel</Btn><Btn gold onClick={()=>{if(!f.title||!f.recommendedPrice)return alert("Title & price required");onSave(f);}}>{art.id?"Save":"Add"}</Btn></div>
    </Modal>
  );
}

// ═══════════════════════════════════════════
// ARTISTS
// ═══════════════════════════════════════════
function ArtistsPage({data,up}){
  const [modal,setModal]=useState(null);const [search,setSearch]=useState("");
  const blank={id:"",name:"",email:"",mobile:"",bio:"",medium:"",style:"",website:"",instagram:"",profileImageUrl:"",bankName:"",accountHolder:"",accountNumber:"",branchCode:"",accountType:"",city:"",country:"South Africa",notes:""};
  const save=(a)=>{if(a.id)up("artists",p=>p.map(x=>x.id===a.id?a:x));else up("artists",p=>[{...a,id:uid(),createdAt:td()},...p]);setModal(null);};
  const del=(id)=>{if(confirm("Delete?"))up("artists",p=>p.filter(x=>x.id!==id));};
  const arts=data.artists||[];const f=arts.filter(a=>(a.name+a.medium+a.city).toLowerCase().includes(search.toLowerCase()));
  const cnt=(id)=>data.artworks.filter(a=>a.artistId===id).length;
  const val=(id)=>data.artworks.filter(a=>a.artistId===id).reduce((s,a)=>s+(a.recommendedPrice||0),0);
  return(<div>
    <PT title="Artists" sub={`${arts.length} artists`} action={<Btn gold onClick={()=>setModal("add")}>{I.plus} Add Artist</Btn>}/>
    <Card>
      <div style={{marginBottom:16}}><input placeholder="Search..." value={search} onChange={e=>setSearch(e.target.value)} style={{...is,maxWidth:400}}/></div>
      {f.length===0?<Empty msg="No artists yet." action={<Btn gold onClick={()=>setModal("add")}>{I.plus} Add</Btn>}/>:
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:16}}>
        {f.map(a=><div key={a.id} style={{background:"#1e1d1a",border:"1px solid rgba(182,139,46,0.08)",borderRadius:12,padding:20,cursor:"pointer"}} onMouseEnter={e=>e.currentTarget.style.borderColor="rgba(182,139,46,0.25)"} onMouseLeave={e=>e.currentTarget.style.borderColor="rgba(182,139,46,0.08)"}>
          <div style={{display:"flex",gap:14}}>
            <div style={{width:56,height:56,borderRadius:12,flexShrink:0,background:"linear-gradient(135deg,rgba(182,139,46,0.2),rgba(182,139,46,0.05))",display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden"}}>
              {a.profileImageUrl?<img src={a.profileImageUrl} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,color:"#b68b2e",fontWeight:600}}>{a.name.split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase()}</span>}
            </div>
            <div style={{flex:1}}><div style={{fontSize:16,fontWeight:600,color:"#f5f0e8"}}>{a.name}</div><div style={{fontSize:12,color:"#8a8477"}}>{[a.medium,a.city].filter(Boolean).join(" · ")}</div><div style={{display:"flex",gap:12,marginTop:8,fontSize:11}}><span style={{color:"#b68b2e"}}>{cnt(a.id)} works</span><span style={{color:"#8a8477"}}>R {fmt(val(a.id))}</span></div></div>
            <div style={{display:"flex",gap:4}}><button onClick={e=>{e.stopPropagation();setModal(a);}} style={{background:"none",border:"none",color:"#8a8477",cursor:"pointer"}}>{I.edit}</button><button onClick={e=>{e.stopPropagation();del(a.id);}} style={{background:"none",border:"none",color:"#5a564e",cursor:"pointer"}}>{I.del}</button></div>
          </div>
        </div>)}
      </div>}
    </Card>
    {modal&&<ArtistMdl artist={modal==="add"?blank:modal} onSave={save} onClose={()=>setModal(null)}/>}
  </div>);
}

function ArtistMdl({artist,onSave,onClose}){
  const [f,sF]=useState({...artist});const s=(k,v)=>sF(p=>({...p,[k]:v}));const [tab,setTab]=useState("personal");
  return(
    <Modal title={artist.id?"Edit Artist":"Add Artist"} onClose={onClose} wide>
      <div style={{display:"flex",gap:4,marginBottom:20,borderBottom:"1px solid rgba(182,139,46,0.08)",paddingBottom:12}}>
        {[["personal","Personal"],["art","Artistic"],["bank","Banking"]].map(([id,l])=><button key={id} onClick={()=>setTab(id)} style={{padding:"8px 16px",borderRadius:6,border:"none",cursor:"pointer",fontSize:12,fontWeight:tab===id?600:400,fontFamily:"'DM Sans',sans-serif",background:tab===id?"rgba(182,139,46,0.12)":"transparent",color:tab===id?"#b68b2e":"#8a8477"}}>{l}</button>)}
      </div>
      {tab==="personal"&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
        <Field label="Full Name" style={{gridColumn:"1/-1"}}><input value={f.name} onChange={e=>s("name",e.target.value)} style={is}/></Field>
        <Field label="Email"><input value={f.email} onChange={e=>s("email",e.target.value)} style={is}/></Field>
        <Field label="Mobile"><input value={f.mobile} onChange={e=>s("mobile",e.target.value)} style={is}/></Field>
        <Field label="City"><input value={f.city} onChange={e=>s("city",e.target.value)} style={is}/></Field>
        <Field label="Country"><input value={f.country} onChange={e=>s("country",e.target.value)} style={is}/></Field>
        <Field label="Profile Image URL" style={{gridColumn:"1/-1"}}><input value={f.profileImageUrl} onChange={e=>s("profileImageUrl",e.target.value)} style={is}/></Field>
      </div>}
      {tab==="art"&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
        <Field label="Medium"><input value={f.medium} onChange={e=>s("medium",e.target.value)} style={is}/></Field>
        <Field label="Style"><input value={f.style} onChange={e=>s("style",e.target.value)} style={is}/></Field>
        <Field label="Website"><input value={f.website} onChange={e=>s("website",e.target.value)} style={is}/></Field>
        <Field label="Instagram"><input value={f.instagram} onChange={e=>s("instagram",e.target.value)} style={is}/></Field>
        <Field label="Bio" style={{gridColumn:"1/-1"}}><textarea value={f.bio} onChange={e=>s("bio",e.target.value)} style={{...is,minHeight:100,resize:"vertical"}}/></Field>
      </div>}
      {tab==="bank"&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
        <Field label="Bank"><input value={f.bankName} onChange={e=>s("bankName",e.target.value)} style={is}/></Field>
        <Field label="Account Holder"><input value={f.accountHolder} onChange={e=>s("accountHolder",e.target.value)} style={is}/></Field>
        <Field label="Account No"><input value={f.accountNumber} onChange={e=>s("accountNumber",e.target.value)} style={is}/></Field>
        <Field label="Branch Code"><input value={f.branchCode} onChange={e=>s("branchCode",e.target.value)} style={is}/></Field>
        <Field label="Type"><select value={f.accountType} onChange={e=>s("accountType",e.target.value)} style={ss}><option value="">—</option><option>Cheque</option><option>Savings</option><option>Business</option></select></Field>
      </div>}
      <div style={{display:"flex",gap:10,marginTop:24,justifyContent:"flex-end"}}><Btn ghost onClick={onClose}>Cancel</Btn><Btn gold onClick={()=>{if(!f.name)return alert("Name required");onSave(f);}}>{artist.id?"Save":"Add"}</Btn></div>
    </Modal>
  );
}

// ═══════════════════════════════════════════
// COLLECTORS
// ═══════════════════════════════════════════
function CollectorsPage({data,up}){
  const [modal,setModal]=useState(null);const [link,setLink]=useState(null);const [search,setSearch]=useState("");
  const blank={id:"",type:"individual",firstName:"",lastName:"",companyName:"",email:"",mobile:"",idNumber:"",nationality:"",address:"",linkedArtworks:[]};
  const save=(inv)=>{if(inv.id)up("collectors",p=>p.map(x=>x.id===inv.id?inv:x));else up("collectors",p=>[{...inv,id:uid(),createdAt:td()},...p]);setModal(null);};
  const del=(id)=>{if(confirm("Delete?"))up("collectors",p=>p.filter(x=>x.id!==id));};
  const gn=(i)=>i.type==="company"?i.companyName:`${i.firstName} ${i.lastName}`;
  const f=data.collectors.filter(i=>gn(i).toLowerCase().includes(search.toLowerCase()));

  const handleLink=(cId,artId,model)=>{
    up("collectors",p=>p.map(i=>{if(i.id!==cId)return i;const l=[...(i.linkedArtworks||[])];if(!l.find(x=>x.artworkId===artId))l.push({artworkId:artId,model,linkedAt:td()});return{...i,linkedArtworks:l};}));
    const art=data.artworks.find(a=>a.id===artId);const col=data.collectors.find(i=>i.id===cId);if(!art||!col)return;
    const name=gn(col);const t40=art.recommendedPrice*VB_SPLIT;const ins=art.insuranceMonthly||0;const invoices=[];
    if(model==="outright"){invoices.push({id:uid(),collectorId:cId,collectorName:name,artworkId:artId,artworkTitle:art.title,type:"Outright",amount:t40,dueDate:td(),status:"Unpaid",createdAt:td()});}
    else if(model==="deposit"){const dep=art.recommendedPrice*0.10;const mo=(t40-dep)/MAX_TERM;invoices.push({id:uid(),collectorId:cId,collectorName:name,artworkId:artId,artworkTitle:art.title,type:"Deposit",amount:dep,dueDate:td(),status:"Unpaid",createdAt:td()});for(let m=1;m<=MAX_TERM;m++){const d=new Date();d.setMonth(d.getMonth()+m);invoices.push({id:uid(),collectorId:cId,collectorName:name,artworkId:artId,artworkTitle:art.title,type:`Month ${m}`,amount:mo+ins,dueDate:d.toISOString().slice(0,10),status:"Unpaid",createdAt:td()});}}
    else{const mo=t40/MAX_TERM;for(let m=1;m<=MAX_TERM;m++){const d=new Date();d.setMonth(d.getMonth()+m);invoices.push({id:uid(),collectorId:cId,collectorName:name,artworkId:artId,artworkTitle:art.title,type:`Month ${m}`,amount:mo+ins,dueDate:d.toISOString().slice(0,10),status:"Unpaid",createdAt:td()});}}
    up("invoices",p=>[...p,...invoices]);up("artworks",p=>p.map(a=>a.id===artId?{...a,status:"Reserved"}:a));setLink(null);
  };

  return(<div>
    <PT title="Collectors" sub={`${data.collectors.length} registered`} action={<Btn gold onClick={()=>setModal("add")}>{I.plus} Add Collector</Btn>}/>
    <Card>
      <div style={{marginBottom:16}}><input placeholder="Search..." value={search} onChange={e=>setSearch(e.target.value)} style={{...is,maxWidth:360}}/></div>
      {f.length===0?<Empty msg="No collectors yet." action={<Btn gold onClick={()=>setModal("add")}>{I.plus} Add</Btn>}/>:
      <Tbl cols={[
        {label:"Name",bold:true,render:r=>gn(r)},{label:"Type",key:"type"},{label:"Email",key:"email"},{label:"Linked",render:r=>(r.linkedArtworks||[]).length},
        {label:"",render:r=><div style={{display:"flex",gap:6}}><Btn small ghost onClick={e=>{e.stopPropagation();setLink(r);}}>Link Art</Btn><button onClick={e=>{e.stopPropagation();setModal(r);}} style={{background:"none",border:"none",color:"#8a8477",cursor:"pointer"}}>{I.edit}</button><button onClick={e=>{e.stopPropagation();del(r.id);}} style={{background:"none",border:"none",color:"#5a564e",cursor:"pointer"}}>{I.del}</button></div>},
      ]} data={f}/>}
    </Card>
    {modal&&<ColMdl col={modal==="add"?blank:modal} onSave={save} onClose={()=>setModal(null)}/>}
    {link&&<LinkMdl col={link} arts={data.artworks.filter(a=>a.status==="Available")} onLink={handleLink} onClose={()=>setLink(null)} gn={gn}/>}
  </div>);
}

function ColMdl({col,onSave,onClose}){
  const [f,sF]=useState({...col});const s=(k,v)=>sF(p=>({...p,[k]:v}));
  return(
    <Modal title={col.id?"Edit Collector":"Add Collector"} onClose={onClose} wide>
      <Field label="Type"><select value={f.type} onChange={e=>s("type",e.target.value)} style={ss}><option value="individual">Individual</option><option value="company">Company</option></select></Field>
      {f.type==="company"?<Field label="Company"><input value={f.companyName} onChange={e=>s("companyName",e.target.value)} style={is}/></Field>:
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}><Field label="First Name"><input value={f.firstName} onChange={e=>s("firstName",e.target.value)} style={is}/></Field><Field label="Last Name"><input value={f.lastName} onChange={e=>s("lastName",e.target.value)} style={is}/></Field></div>}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}><Field label="Email"><input value={f.email} onChange={e=>s("email",e.target.value)} style={is}/></Field><Field label="Mobile"><input value={f.mobile} onChange={e=>s("mobile",e.target.value)} style={is}/></Field><Field label="ID/Passport"><input value={f.idNumber} onChange={e=>s("idNumber",e.target.value)} style={is}/></Field><Field label="Nationality"><input value={f.nationality} onChange={e=>s("nationality",e.target.value)} style={is}/></Field></div>
      <Field label="Address"><textarea value={f.address} onChange={e=>s("address",e.target.value)} style={{...is,minHeight:60,resize:"vertical"}}/></Field>
      <div style={{display:"flex",gap:10,marginTop:20,justifyContent:"flex-end"}}><Btn ghost onClick={onClose}>Cancel</Btn><Btn gold onClick={()=>{if(f.type==="company"?!f.companyName:!f.firstName||!f.lastName)return alert("Name required");onSave(f);}}>{col.id?"Save":"Add"}</Btn></div>
    </Modal>
  );
}

function LinkMdl({col,arts,onLink,onClose,gn}){
  const [artId,setArtId]=useState("");const [model,setModel]=useState("deposit");
  const art=arts.find(a=>a.id===artId);const t40=art?art.recommendedPrice*VB_SPLIT:0;
  return(
    <Modal title={`Link — ${gn(col)}`} onClose={onClose}>
      <Field label="Artwork"><select value={artId} onChange={e=>setArtId(e.target.value)} style={ss}><option value="">—</option>{arts.map(a=><option key={a.id} value={a.id}>{a.title} — R {fmt(a.recommendedPrice)}</option>)}</select></Field>
      <Field label="Payment Model"><div style={{display:"flex",gap:8}}>{[["outright","Outright 40%"],["deposit","10% Deposit"],["monthly","Monthly"]].map(([id,l])=><button key={id} onClick={()=>setModel(id)} style={{flex:1,padding:12,borderRadius:8,border:model===id?"2px solid #b68b2e":"1px solid rgba(182,139,46,0.15)",background:model===id?"rgba(182,139,46,0.08)":"#1e1d1a",color:model===id?"#b68b2e":"#8a8477",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>{l}</button>)}</div></Field>
      {art&&<Card style={{background:"#1e1d1a",marginTop:8}}><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,fontSize:13}}>
        <span style={{color:"#8a8477"}}>Price:</span><span style={{textAlign:"right"}}>R {fmt(art.recommendedPrice)}</span>
        <span style={{color:"#8a8477"}}>Collector pays 40%:</span><span style={{textAlign:"right",color:"#b68b2e"}}>R {fmt(t40)}</span>
        <span style={{color:"#8a8477"}}>Collector receives 60%:</span><span style={{textAlign:"right",color:"#4a9e6b"}}>R {fmt(art.recommendedPrice*COLLECTOR_SPLIT)}</span>
        {model==="deposit"&&<><span style={{color:"#8a8477"}}>Deposit 10%:</span><span style={{textAlign:"right"}}>R {fmt(art.recommendedPrice*0.10)}</span><span style={{color:"#8a8477"}}>Monthly ×24:</span><span style={{textAlign:"right",fontWeight:600}}>R {fmt((t40-art.recommendedPrice*0.10)/MAX_TERM)}</span></>}
        {model==="monthly"&&<><span style={{color:"#8a8477"}}>Monthly ×24:</span><span style={{textAlign:"right",fontWeight:600}}>R {fmt(t40/MAX_TERM)}</span></>}
      </div></Card>}
      <div style={{display:"flex",gap:10,marginTop:20,justifyContent:"flex-end"}}><Btn ghost onClick={onClose}>Cancel</Btn><Btn gold disabled={!artId} onClick={()=>onLink(col.id,artId,model)}>Link & Invoice</Btn></div>
    </Modal>
  );
}

// ═══════════════════════════════════════════
// CALCULATOR
// ═══════════════════════════════════════════
function CalcPage(){
  const [price,setPrice]=useState(100000);const [model,setModel]=useState("deposit");const [soldMonth,setSoldMonth]=useState("");const [actualPrice,setActualPrice]=useState("");
  const [depPct,setDepPct]=useState(10);const [insurance,setInsurance]=useState(0);const [term,setTerm]=useState(24);
  const p=Number(price)||0;const ins=Number(insurance)||0;const t=Number(term)||24;const dRate=(Number(depPct)||0)/100;
  const t40=p*VB_SPLIT;const dep=model==="deposit"?p*dRate:model==="outright"?t40:0;
  const moBase=model==="outright"?0:model==="deposit"?(t40-dep)/t:t40/t;
  const moTotal=moBase+ins;
  const sp=Number(actualPrice)||p;const col60=sp*COLLECTOR_SPLIT;const vb40=sp*VB_SPLIT;
  const isSold=soldMonth!=="";const soldM=Number(soldMonth)||0;

  const rows=[];
  if(p>0){
    for(let m=0;m<=(model==="outright"?0:t);m++){
      let paid=model==="outright"?t40:model==="deposit"?dep+moTotal*m:moTotal*m;
      if(model==="monthly"&&m===0)paid=0;
      const ret=col60-paid;
      const retPct=paid>0?((ret/paid)*100).toFixed(0):"∞";
      const payment=model==="outright"?t40:m===0?dep:moTotal;
      rows.push({m,payment,paid,ret,retPct});
      if(isSold&&m===soldM)break;
    }
  }
  const sr=isSold?rows[rows.length-1]:null;
  const maxPaid=model==="outright"?t40:model==="deposit"?dep+moTotal*t:moTotal*t;

  return(<div>
    <PT title="Acquisition Calculator" sub="Model collector contributions & returns across all payment options"/>
    <div style={{display:"grid",gridTemplateColumns:"400px 1fr",gap:24,alignItems:"start"}}>
      <Card>
        <Field label="Selling Price (R)"><input type="number" value={price} onChange={e=>setPrice(e.target.value)} style={is}/></Field>
        <Field label="Payment Model"><div style={{display:"flex",gap:6}}>{[["outright","Outright"],["deposit","Deposit"],["monthly","Monthly"]].map(([id,l])=><button key={id} onClick={()=>{setModel(id);setSoldMonth("");}} style={{flex:1,padding:10,borderRadius:8,border:model===id?"2px solid #b68b2e":"1px solid rgba(182,139,46,0.15)",background:model===id?"rgba(182,139,46,0.08)":"#1e1d1a",color:model===id?"#b68b2e":"#8a8477",fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>{l}</button>)}</div></Field>
        {model==="deposit"&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <Field label="Deposit %"><input type="number" value={depPct} onChange={e=>setDepPct(e.target.value)} style={is} min="1" max="39"/></Field>
          <Field label="Deposit (R)"><input value={p>0?fmt(dep):""} readOnly style={{...is,opacity:0.6}}/></Field>
        </div>}
        {model!=="outright"&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <Field label="Term"><select value={term} onChange={e=>setTerm(Number(e.target.value))} style={ss}><option value={6}>6 mo</option><option value={12}>12 mo</option><option value={18}>18 mo</option><option value={24}>24 mo</option><option value={36}>36 mo</option></select></Field>
          <Field label="Insurance/mo (R)"><input type="number" value={insurance} onChange={e=>setInsurance(e.target.value)} style={is} placeholder="0"/></Field>
        </div>}
        {p>0&&<Card style={{background:"#1e1d1a",padding:16,marginBottom:16}}><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,fontSize:13}}>
          <span style={{color:"#8a8477"}}>Collector pays (40%):</span><span style={{textAlign:"right",color:"#b68b2e",fontWeight:600}}>R {fmt(t40)}</span>
          <span style={{color:"#8a8477"}}>Collector receives (60%):</span><span style={{textAlign:"right",color:"#4a9e6b",fontWeight:600}}>R {fmt(col60)}</span>
          {model==="deposit"&&<><span style={{color:"#8a8477"}}>Deposit ({depPct}%):</span><span style={{textAlign:"right"}}>R {fmt(dep)}</span></>}
          {model!=="outright"&&<><span style={{color:"#8a8477"}}>Base monthly:</span><span style={{textAlign:"right"}}>R {fmt(moBase)}</span></>}
          {ins>0&&model!=="outright"&&<><span style={{color:"#8a8477"}}>Insurance/mo:</span><span style={{textAlign:"right"}}>R {fmt(ins)}</span></>}
          {model!=="outright"&&<><span style={{color:"#8a8477",fontWeight:600}}>Total monthly:</span><span style={{textAlign:"right",fontWeight:600,color:"#b68b2e"}}>R {fmt(moTotal)}</span></>}
          <span style={{color:"#8a8477"}}>Max contribution:</span><span style={{textAlign:"right"}}>R {fmt(maxPaid)}</span>
          <span style={{color:"#8a8477"}}>Min return:</span><span style={{textAlign:"right",color:col60-maxPaid>0?"#4a9e6b":"#c45c4a"}}>R {fmt(col60-maxPaid)}</span>
        </div></Card>}
        <div style={{borderTop:"1px solid rgba(182,139,46,0.1)",paddingTop:16}}>
          <Field label="⬥ Sold in Month"><select value={soldMonth} onChange={e=>setSoldMonth(e.target.value)} style={ss}><option value="">Not sold</option>{model==="outright"?<option value="0">Immediate</option>:Array.from({length:t+1},(_,i)=><option key={i} value={i}>{i===0?(model==="deposit"?"Deposit month":"Month 0"):`Month ${i}`}</option>)}</select></Field>
          {isSold&&<Field label="Actual Sale Price (R)"><input type="number" value={actualPrice} onChange={e=>setActualPrice(e.target.value)} style={is} placeholder={fmt(p)}/></Field>}
        </div>
      </Card>
      <div>
        {p>0&&sr&&isSold&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14,marginBottom:20}}>
          <Card style={{padding:16,textAlign:"center",border:"1px solid rgba(74,158,107,0.2)"}}><div style={{fontSize:9,letterSpacing:2,color:"#5a564e",marginBottom:4}}>COLLECTOR RETURN</div><div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:28,fontWeight:600,color:sr.ret>=0?"#4a9e6b":"#c45c4a"}}>R {fmt(sr.ret)}</div><div style={{fontSize:12,color:sr.ret>=0?"#4a9e6b":"#c45c4a",marginTop:4}}>{sr.retPct}%</div></Card>
          <Card style={{padding:16,textAlign:"center",border:"1px solid rgba(182,139,46,0.2)"}}><div style={{fontSize:9,letterSpacing:2,color:"#5a564e",marginBottom:4}}>VB TOTAL</div><div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:28,fontWeight:600,color:"#b68b2e"}}>R {fmt(vb40+sr.paid)}</div><div style={{fontSize:11,color:"#8a8477",marginTop:4}}>Payments + Sale</div></Card>
          <Card style={{padding:16,textAlign:"center"}}><div style={{fontSize:9,letterSpacing:2,color:"#5a564e",marginBottom:4}}>SALE PRICE</div><div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:28,fontWeight:600,color:"#f5f0e8"}}>R {fmt(sp)}</div></Card>
        </div>}
        {p>0&&sr&&isSold&&<Card style={{marginBottom:20}}>
          <div style={{fontSize:14,fontWeight:600,color:"#f5f0e8",marginBottom:12}}>Backend Split — VB 40% = R{fmt(vb40)}</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}>
            <div style={{background:"#1e1d1a",borderRadius:8,padding:14,textAlign:"center"}}><div style={{fontSize:9,letterSpacing:2,color:"#5a564e",marginBottom:4}}>GALLERY 40%</div><div style={{fontSize:18,fontWeight:600,color:"#648cc8"}}>R {fmt(vb40*GALLERY_BACK)}</div></div>
            <div style={{background:"#1e1d1a",borderRadius:8,padding:14,textAlign:"center"}}><div style={{fontSize:9,letterSpacing:2,color:"#5a564e",marginBottom:4}}>VOLLARD BLACK 30%</div><div style={{fontSize:18,fontWeight:600,color:"#b68b2e"}}>R {fmt(vb40*VB_BACK)}</div></div>
            <div style={{background:"#1e1d1a",borderRadius:8,padding:14,textAlign:"center"}}><div style={{fontSize:9,letterSpacing:2,color:"#5a564e",marginBottom:4}}>ARTIST 30%</div><div style={{fontSize:18,fontWeight:600,color:"#4a9e6b"}}>R {fmt(vb40*ARTIST_BACK)}</div></div>
          </div>
        </Card>}
        {p>0&&<Card><div style={{fontSize:14,fontWeight:600,color:"#f5f0e8",marginBottom:16}}>Payment Timeline</div>
          <Tbl cols={[
            {label:"Month",render:r=>model==="outright"?"Outright":r.m===0?(model==="deposit"?"Deposit":"—"):`Month ${r.m}`},
            {label:"Payment",right:true,render:r=>"R "+fmt(r.payment)},
            {label:"Total Paid",right:true,render:r=>"R "+fmt(r.paid)},
            {label:"Gets 60%",right:true,green:true,render:r=>"R "+fmt(col60)},
            {label:"Return",right:true,bold:true,render:r=><span style={{color:r.ret>=0?"#4a9e6b":"#c45c4a"}}>R {fmt(r.ret)}</span>},
            {label:"Return %",right:true,gold:true,bold:true,render:r=>r.retPct+"%"},
          ]} data={rows}/>
        </Card>}
        {p===0&&<Card><Empty msg="Enter a price to begin."/></Card>}
      </div>
    </div>
  </div>);
}

// ═══════════════════════════════════════════
// INVOICING
// ═══════════════════════════════════════════
function InvoicePage({data,up}){
  const [payMdl,setPayMdl]=useState(null);const [filter,setFilter]=useState("all");
  const filtered=data.invoices.filter(i=>filter==="all"||i.status===filter).sort((a,b)=>new Date(a.dueDate)-new Date(b.dueDate));
  useEffect(()=>{const t=td();const u=data.invoices.map(i=>i.status==="Unpaid"&&i.dueDate<t?{...i,status:"Overdue"}:i);if(JSON.stringify(u)!==JSON.stringify(data.invoices))up("invoices",u);},[]);
  const pay=(inv,method)=>{up("invoices",p=>p.map(i=>i.id===inv.id?{...i,status:"Paid",paidDate:td(),paymentMethod:method}:i));up("payments",p=>[...p,{id:uid(),invoiceId:inv.id,collectorId:inv.collectorId,collectorName:inv.collectorName,artworkId:inv.artworkId,artworkTitle:inv.artworkTitle,amount:inv.amount,method,date:td()}]);setPayMdl(null);};
  return(<div>
    <PT title="Invoicing" sub={`${data.invoices.length} invoices`}/>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:14,marginBottom:24}}>
      <Stat label="Unpaid" value={data.invoices.filter(i=>i.status==="Unpaid").length}/><Stat label="Overdue" value={data.invoices.filter(i=>i.status==="Overdue").length}/><Stat label="Paid" value={data.invoices.filter(i=>i.status==="Paid").length} green/><Stat label="Collected" value={"R "+fmt(data.payments.reduce((s,p)=>s+p.amount,0))} gold/>
    </div>
    <Card>
      <div style={{display:"flex",gap:8,marginBottom:16}}>{["all","Unpaid","Overdue","Paid"].map(f=><Btn key={f} small ghost={filter!==f} gold={filter===f} onClick={()=>setFilter(f)}>{f==="all"?"All":f}</Btn>)}</div>
      {filtered.length===0?<Empty msg="No invoices."/>:
      <Tbl cols={[
        {label:"Type",render:r=>r.type},{label:"Collector",key:"collectorName",bold:true},{label:"Artwork",key:"artworkTitle"},
        {label:"Amount",right:true,gold:true,render:r=>"R "+fmt(r.amount)},{label:"Due",key:"dueDate"},
        {label:"Status",render:r=><Badge status={r.status==="Paid"?"Available":r.status==="Overdue"?"Sold":"Reserved"}/>},
        {label:"",render:r=>r.status!=="Paid"?<Btn small gold onClick={e=>{e.stopPropagation();setPayMdl(r);}}>{I.ok} Pay</Btn>:<span style={{fontSize:11,color:"#4a9e6b"}}>✓ {r.paymentMethod}</span>},
      ]} data={filtered}/>}
    </Card>
    {payMdl&&<Modal title="Record Payment" onClose={()=>setPayMdl(null)}>
      <Card style={{background:"#1e1d1a",marginBottom:16}}><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,fontSize:13}}><span style={{color:"#8a8477"}}>Invoice:</span><span>{payMdl.type}</span><span style={{color:"#8a8477"}}>Amount:</span><span style={{color:"#b68b2e",fontWeight:600}}>R {fmt(payMdl.amount)}</span></div></Card>
      {payM.map(m=><button key={m} onClick={()=>pay(payMdl,m)} style={{display:"block",width:"100%",padding:12,marginBottom:8,borderRadius:8,border:"1px solid rgba(182,139,46,0.15)",background:"#1e1d1a",color:"#e8e2d6",cursor:"pointer",fontSize:13,fontFamily:"'DM Sans',sans-serif",textAlign:"left"}}>{m}</button>)}
    </Modal>}
  </div>);
}

// ═══════════════════════════════════════════
// SALES
// ═══════════════════════════════════════════
function SalesPage({data,up}){
  const [modal,setModal]=useState(false);
  const sellable=data.artworks.filter(a=>a.status==="Reserved"||a.status==="In Gallery");
  const handleSale=(sale)=>{up("sales",p=>[...p,{...sale,id:uid(),date:td()}]);up("artworks",p=>p.map(a=>a.id===sale.artworkId?{...a,status:"Sold"}:a));setModal(false);};
  return(<div>
    <PT title="Sales" sub={`${data.sales.length} completed`} action={<Btn gold onClick={()=>setModal(true)}>{I.plus} Record Sale</Btn>}/>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:14,marginBottom:24}}>
      <Stat label="Sales" value={data.sales.length}/><Stat label="Total Value" value={"R "+fmt(data.sales.reduce((s,x)=>s+x.salePrice,0))}/><Stat label="Collector 60%" value={"R "+fmt(data.sales.reduce((s,x)=>s+x.collectorShare,0))} green/><Stat label="VB 40%" value={"R "+fmt(data.sales.reduce((s,x)=>s+x.vbShare,0))} gold/>
    </div>
    <Card>
      {data.sales.length===0?<Empty msg="No sales yet." action={<Btn gold onClick={()=>setModal(true)}>{I.plus} Record Sale</Btn>}/>:
      <Tbl cols={[
        {label:"Date",key:"date"},{label:"Artwork",key:"artworkTitle",bold:true},{label:"Collector",key:"collectorName"},
        {label:"Sale Price",right:true,render:r=>"R "+fmt(r.salePrice)},
        {label:"Collector 60%",right:true,green:true,render:r=>"R "+fmt(r.collectorShare)},
        {label:"VB 40%",right:true,gold:true,render:r=>"R "+fmt(r.vbShare)},
        {label:"Gallery",right:true,render:r=>"R "+fmt(r.galleryShare)},
        {label:"Artist",right:true,render:r=>"R "+fmt(r.artistShare)},
      ]} data={[...data.sales].reverse()}/>}
    </Card>
    {modal&&<SaleMdl data={data} sellable={sellable} onSale={handleSale} onClose={()=>setModal(false)}/>}
  </div>);
}

function SaleMdl({data,sellable,onSale,onClose}){
  const [artId,setArtId]=useState("");const [salePrice,setSalePrice]=useState("");
  const art=data.artworks.find(a=>a.id===artId);
  const col=art?data.collectors.find(i=>(i.linkedArtworks||[]).some(l=>l.artworkId===artId)):null;
  const gn=i=>i?(i.type==="company"?i.companyName:`${i.firstName} ${i.lastName}`):"";
  const totalPaid=art?data.payments.filter(p=>p.artworkId===artId).reduce((s,p)=>s+p.amount,0):0;
  const sp=Number(salePrice)||(art?art.recommendedPrice:0);
  const collectorShare=sp*COLLECTOR_SPLIT;const vbShare=sp*VB_SPLIT;
  const galleryShare=vbShare*GALLERY_BACK;const vbNet=vbShare*VB_BACK;const artistShare=vbShare*ARTIST_BACK;
  return(
    <Modal title="Record Sale" onClose={onClose} wide>
      <Field label="Artwork"><select value={artId} onChange={e=>setArtId(e.target.value)} style={ss}><option value="">—</option>{sellable.map(a=><option key={a.id} value={a.id}>{a.title} — R {fmt(a.recommendedPrice)}</option>)}</select></Field>
      {art&&<><Field label="Sale Price (R)"><input type="number" value={salePrice} onChange={e=>setSalePrice(e.target.value)} style={is} placeholder={fmt(art.recommendedPrice)}/></Field>
        <Card style={{background:"#1e1d1a",marginTop:12}}><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,fontSize:14}}>
          <span style={{color:"#8a8477"}}>Sale Price:</span><span style={{fontWeight:600}}>R {fmt(sp)}</span>
          <span style={{color:"#8a8477"}}>Collector:</span><span>{gn(col)||"—"}</span>
          <span style={{color:"#8a8477"}}>Payments received:</span><span>R {fmt(totalPaid)}</span>
          <div style={{gridColumn:"1/-1",height:1,background:"rgba(182,139,46,0.1)",margin:"4px 0"}}/>
          <span style={{color:"#4a9e6b",fontWeight:600}}>Collector 60%:</span><span style={{color:"#4a9e6b",fontWeight:700,fontSize:18,fontFamily:"'Cormorant Garamond',serif"}}>R {fmt(collectorShare)}</span>
          <span style={{color:"#b68b2e",fontWeight:600}}>VB 40%:</span><span style={{color:"#b68b2e",fontWeight:700,fontSize:18,fontFamily:"'Cormorant Garamond',serif"}}>R {fmt(vbShare)}</span>
          <div style={{gridColumn:"1/-1",height:1,background:"rgba(182,139,46,0.06)",margin:"4px 0"}}/>
          <span style={{color:"#8a8477",fontSize:12}}>Gallery 40%:</span><span style={{fontSize:12}}>R {fmt(galleryShare)}</span>
          <span style={{color:"#8a8477",fontSize:12}}>VB 30%:</span><span style={{fontSize:12}}>R {fmt(vbNet)}</span>
          <span style={{color:"#8a8477",fontSize:12}}>Artist 30%:</span><span style={{fontSize:12}}>R {fmt(artistShare)}</span>
        </div></Card>
      </>}
      <div style={{display:"flex",gap:10,marginTop:20,justifyContent:"flex-end"}}><Btn ghost onClick={onClose}>Cancel</Btn><Btn gold disabled={!artId} onClick={()=>onSale({artworkId:artId,artworkTitle:art.title,collectorId:col?.id,collectorName:gn(col),salePrice:sp,totalPaid,collectorShare,vbShare,galleryShare,vbNet,artistShare})}>Confirm Sale</Btn></div>
    </Modal>
  );
}
