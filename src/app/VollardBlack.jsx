'use client';
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { db, storage, auth, supabase } from "./supabase";

// ─── Constants ───
const MODELS = {
  O1: { vbPct: 0.50, colPct: 0.50, term: 6,  label: "Standard · 6mo",  short: "6M" },
  O2: { vbPct: 0.50, colPct: 0.50, term: 12, label: "Extended · 12mo", short: "12M" },
  O3: { vbPct: 0.50, colPct: 0.50, term: 24, label: "Premium · 24mo",  short: "24M" },
};
const DEFAULT_MODEL = "O3"; // 50/50 across all — only the rental term differs
const ADMIN_EMAIL = "concierge@vollardblack.com";
const PAGE_SIZE = 50;

const COUNTRIES=["Afghanistan","Albania","Algeria","Angola","Argentina","Armenia","Australia","Austria","Azerbaijan","Bahrain","Bangladesh","Belarus","Belgium","Belize","Benin","Bolivia","Bosnia","Botswana","Brazil","Bulgaria","Burkina Faso","Burundi","Cambodia","Cameroon","Canada","Chad","Chile","China","Colombia","Congo","Costa Rica","Croatia","Cuba","Cyprus","Czech Republic","Denmark","Dominican Republic","DR Congo","Ecuador","Egypt","El Salvador","Estonia","Ethiopia","Finland","France","Gabon","Georgia","Germany","Ghana","Greece","Guatemala","Guinea","Haiti","Honduras","Hungary","India","Indonesia","Iran","Iraq","Ireland","Israel","Italy","Jamaica","Japan","Jordan","Kazakhstan","Kenya","Kosovo","Kuwait","Kyrgyzstan","Laos","Latvia","Lebanon","Libya","Lithuania","Luxembourg","Madagascar","Malawi","Malaysia","Mali","Malta","Mauritius","Mexico","Moldova","Mongolia","Montenegro","Morocco","Mozambique","Namibia","Nepal","Netherlands","New Zealand","Nicaragua","Niger","Nigeria","North Korea","Norway","Oman","Pakistan","Palestine","Panama","Paraguay","Peru","Philippines","Poland","Portugal","Qatar","Romania","Russia","Rwanda","Saudi Arabia","Senegal","Serbia","Sierra Leone","Singapore","Slovakia","Slovenia","Somalia","South Africa","South Korea","South Sudan","Spain","Sri Lanka","Sudan","Sweden","Switzerland","Syria","Taiwan","Tanzania","Thailand","Togo","Tunisia","Turkey","Uganda","Ukraine","United Arab Emirates","United Kingdom","United States","Uruguay","Uzbekistan","Venezuela","Vietnam","Yemen","Zambia","Zimbabwe"];
const SA_BANKS=["ABSA","African Bank","Bidvest Bank","Capitec Bank","Discovery Bank","FNB (First National Bank)","Grindrod Bank","Investec","Mercantile Bank","Nedbank","Old Mutual","Sasfin Bank","Standard Bank","TymeBank","Ubank","Other"];
const ART_MEDIUMS=["Oil on Canvas","Watercolour","Mixed Media","Acrylic","3D Bas Relief","Serigraph","Lithograph","Charcoal","Pastel","Digital Art","Photography","Sculpture","Bronze","Ceramic","Textile","Woodcut","Etching","Screen Print","Collage","Gouache","Tempera","Fresco","Encaustic","Glass","Installation","Video Art","Other"];

const calcDeal = (artworkValue, salePrice, model, monthsPaid, galleryPct, vbBackPct, artistPct, introFeePct, depositType="none", depositPct=0) => {
  const m = MODELS[model];
  const vbFee = artworkValue * m.vbPct;
  const depositAmt = artworkValue * (depositPct / 100);
  let monthly, totalCollected;
  if(depositType === "toward") {
    const remaining = Math.max(0, vbFee - depositAmt);
    monthly = remaining / m.term;
    totalCollected = depositAmt + (monthly * monthsPaid);
  } else {
    monthly = vbFee / m.term;
    totalCollected = monthly * monthsPaid;
  }
  const vbBalance = Math.max(0, vbFee - totalCollected);
  const vbAtSale = Math.min(vbBalance, salePrice);
  const collectorAtSale = Math.max(0, salePrice - vbBalance);
  const surplus = Math.max(0, salePrice - artworkValue);
  const surplusCol = surplus * 0.50;
  const surplusVB = surplus * 0.50;
  const introFee = collectorAtSale * ((introFeePct || 0) / 100);
  const colNet = collectorAtSale - introFee;
  const colProfit = colNet - totalCollected;
  const colROI = totalCollected > 0 ? (colProfit / totalCollected) * 100 : 0;
  const vbTotal = totalCollected + vbAtSale;
  const gPct = (galleryPct || 40) / 100;
  const vPct = (vbBackPct || 30) / 100;
  const aPct = (artistPct || 30) / 100;
  const galleryAmt = vbFee * gPct;
  const vbAmt = vbFee * vPct;
  const artistAmt = vbFee * aPct;
  return { vbFee, monthly, depositAmt, totalCollected, vbBalance, vbAtSale, collectorAtSale, surplus, surplusCol, surplusVB, introFee, colNet, colProfit, colROI, vbTotal, galleryAmt, vbAmt, artistAmt };
};

const fmt = (n) => Number(n||0).toLocaleString("en-ZA",{minimumFractionDigits:2,maximumFractionDigits:2});
const uid = () => "VB"+Date.now().toString(36)+Math.random().toString(36).slice(2,6);
const uuidv4 = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
};
// UUID tables need real UUIDs; text tables use VB-prefixed IDs
const UUID_TABLES = ['artworks','artists','collectors','buyers'];
const newId = (table) => UUID_TABLES.includes(table) ? uuidv4() : uid();
const td = () => new Date().toISOString().slice(0,10);
const SK = "vollard_black_v16";
const TABLES = ["artworks","artists","collectors","schedules","payments","sales","reports","buyers","auctions","bids","enquiries"];
const fresh = () => ({artworks:[],artists:[],collectors:[],schedules:[],payments:[],sales:[],reports:[],buyers:[],auctions:[],bids:[],enquiries:[]});
const loadLocal = () => { try { const d=JSON.parse(localStorage.getItem(SK)); return d?.artworks?d:fresh(); } catch{return fresh();} };

const getNextDueDate = (startDate, monthNumber) => {
  const d = new Date(startDate);
  d.setMonth(d.getMonth() + monthNumber);
  return new Date(d.getFullYear(), d.getMonth(), 25).toISOString().slice(0,10);
};
const getGraceEnd = (dueDate) => {
  const d = new Date(dueDate);
  return new Date(d.getFullYear(), d.getMonth()+1, 7).toISOString().slice(0,10);
};
const getReportWindow = (yearMonth) => {
  const [y,m] = yearMonth.split("-").map(Number);
  const lastDay = new Date(y, m, 0).getDate();
  return { open:`${yearMonth}-${String(lastDay).padStart(2,"0")}`, lock:new Date(y,m,8).toISOString().slice(0,10) };
};
const isReportLocked = (ym) => td() > getReportWindow(ym).lock;
const getCurrentMonth = () => new Date().toISOString().slice(0,7);
const getMonthLabel = (ym) => { const [y,m]=ym.split("-"); return new Date(y,m-1,1).toLocaleDateString("en-ZA",{month:"long",year:"numeric"}); };

const computeStrikes = (schedule, payments) => {
  if(schedule.status==="Complete"||schedule.status==="Cancelled") return schedule;
  const today=td();
  const paid=payments.filter(p=>p.scheduleId===schedule.id);
  const paidMonths=new Set(paid.map(p=>p.monthNumber));
  const missedMonths=new Set(schedule.missedMonths||[]);
  let strikes=missedMonths.size;
  for(let m=1;m<=Math.max(schedule.monthsPaid+2,3);m++){
    const due=getNextDueDate(schedule.startDate,m);
    const grace=(schedule.graceOverride&&schedule.graceMonth===m)?schedule.graceOverride:getGraceEnd(due);
    if(today>grace&&!paidMonths.has(m)&&!missedMonths.has(m))strikes++;
  }
  strikes=Math.min(strikes,3);
  let status=schedule.status;
  if(!["Cancelled","Complete","Override"].includes(schedule.status)){
    if(strikes===0)status="Active";
    else if(strikes===1)status="Chasing";
    else if(strikes===2)status="In Dispute";
    else status="Cancelled";
  }
  return {...schedule,strikes,status};
};

const monthLabel=()=>new Date().toLocaleDateString("en-ZA",{month:"long",year:"numeric"});
const TEMPLATES={
  upcoming:(n,a,amt,due)=>({subject:`Vollard Black — Payment Reminder | ${monthLabel()}`,body:`Dear ${n},\n\nThis is a friendly reminder that your license fee of R ${fmt(amt)} for "${a}" is due on ${due}.\n\nPayment window: 25th – 7th of following month.\n\nKind regards,\nVollard Black\n${ADMIN_EMAIL}`}),
  missed:(n,a,amt)=>({subject:`Vollard Black — Missed Payment | ${monthLabel()}`,body:`Dear ${n},\n\nYour license fee of R ${fmt(amt)} for "${a}" has not been received.\n\nVollard Black\n${ADMIN_EMAIL}`}),
  dispute:(n,a,amt)=>({subject:`Vollard Black — Account In Dispute | ${monthLabel()}`,body:`Dear ${n},\n\nYour account for "${a}" is In Dispute.\n\nContact us urgently.\n\nVollard Black\n${ADMIN_EMAIL}`}),
  cancelled:(n,a)=>({subject:`Vollard Black — Agreement Cancellation | ${monthLabel()}`,body:`Dear ${n},\n\nYour display license agreement for "${a}" has been cancelled.\n\nVollard Black\n${ADMIN_EMAIL}`}),
  individual_missed:(n,a,amt)=>({subject:`Missed Payment — ${a} | ${n}`,body:`Dear ${n},\n\nYour license fee of R ${fmt(amt)} for "${a}" is outstanding.\n\nVollard Black\n${ADMIN_EMAIL}`}),
  individual_dispute:(n,a,amt)=>({subject:`Account In Dispute — ${a} | ${n}`,body:`Dear ${n},\n\nYour account for "${a}" is In Dispute.\n\nVollard Black\n${ADMIN_EMAIL}`}),
  individual_cancelled:(n,a)=>({subject:`Agreement Cancelled — ${a} | ${n}`,body:`Dear ${n},\n\nYour display license agreement for "${a}" has been cancelled.\n\nVollard Black\n${ADMIN_EMAIL}`}),
};
const openGmail=(emails,subject,body)=>{
  const bcc=[ADMIN_EMAIL,...emails.slice(1)].filter(Boolean).join(",");
  window.open(`https://mail.google.com/mail/?view=cm&to=${encodeURIComponent(emails[0]||"")}&bcc=${encodeURIComponent(bcc)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`,"_blank");
};

const generatePDF=(report)=>{
  const snap=report.snapshot;
  const html=`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Vollard Black — ${getMonthLabel(report.month)}</title>
<style>body{font-family:Georgia,serif;color:#1a1a1a;max-width:900px;margin:0 auto;padding:40px;}h2{font-size:16px;font-weight:400;color:#8a6a1e;margin:28px 0 12px;border-bottom:1px solid #ddd;padding-bottom:6px;}.header{border-bottom:2px solid #b68b2e;padding-bottom:16px;margin-bottom:24px;}table{width:100%;border-collapse:collapse;font-size:12px;margin-bottom:20px;}th{background:#f5f0e8;padding:8px 10px;text-align:left;font-size:10px;letter-spacing:1.5px;text-transform:uppercase;color:#666;border-bottom:1px solid #ddd;}td{padding:8px 10px;border-bottom:1px solid #f0ece4;}.gold{color:#b68b2e;font-weight:600;}.green{color:#2d7a4a;font-weight:600;}.footer{margin-top:40px;padding-top:16px;border-top:1px solid #ddd;font-size:11px;color:#999;display:flex;justify-content:space-between;}</style></head><body>
<div class="header"><h1 style="font-size:28px;font-weight:300;letter-spacing:4px;">VOLLARD <span style="color:#b68b2e">BLACK</span></h1><div style="font-size:13px;color:#666;">Monthly Report — ${getMonthLabel(report.month)}</div></div>
${snap.payments&&snap.payments.length>0?`<h2>Payments Received</h2><table><thead><tr><th>License Holder</th><th>Artwork</th><th>Month</th><th>Method</th><th style="text-align:right">Amount</th></tr></thead><tbody>${snap.payments.map(p=>`<tr><td>${p.collectorName}</td><td>${p.artworkTitle}</td><td>Mo ${p.monthNumber}</td><td>${p.method}</td><td style="text-align:right" class="gold">R ${fmt(p.amount)}</td></tr>`).join("")}</tbody></table>`:""}
<div class="footer"><span>VOLLARD BLACK</span><span>${ADMIN_EMAIL}</span><span>© ${new Date().getFullYear()}</span></div>
</body></html>`;
  const w=window.open("","_blank");w.document.write(html);w.document.close();w.focus();setTimeout(()=>w.print(),800);
};

const generateSettlementPDF=(sale,artworkValue,monthsPaid,acquisitionModel,galleryPct,vbPct,artistPct,introFeePct)=>{
  const m=MODELS[acquisitionModel||"O1"];
  const deal=calcDeal(artworkValue,sale.salePrice,acquisitionModel||"O1",monthsPaid,galleryPct||40,vbPct||30,artistPct||30,introFeePct||0);
  const html=`<!DOCTYPE html><html><head><meta charset="utf-8"><title>VB Settlement — ${sale.artworkTitle}</title>
<style>body{font-family:Arial,sans-serif;color:#1a1a1a;max-width:820px;margin:0 auto;padding:48px 40px;font-size:13px;}.header{display:flex;justify-content:space-between;border-bottom:2px solid #b68b2e;padding-bottom:20px;margin-bottom:32px;}.gold{color:#8a6a1e;}.green{color:#2d7a4a;}.red{color:#c45c4a;}.footer{margin-top:40px;padding-top:14px;border-top:1px solid #ddd;font-size:11px;color:#aaa;display:flex;justify-content:space-between;}</style></head><body>
<div class="header"><div><div style="font-size:28px;font-weight:300;letter-spacing:6px;">VOLLARD <span style="color:#b68b2e">BLACK</span></div></div><div style="text-align:right"><div>Deal Settlement Sheet</div><div style="font-size:12px;color:#999">${sale.date||td()}</div></div></div>
<h2>${sale.artworkTitle} — ${m.label}</h2>
<p>License Holder: ${sale.collectorName||"—"} · Buyer: ${sale.buyerName||"—"} · Sale: R ${fmt(sale.salePrice)}</p>
<p>Gallery commission: R ${fmt(deal.vbFee)} · Collected: R ${fmt(deal.totalCollected)} · Balance at sale: R ${fmt(deal.vbBalance)}</p>
<p><strong class="green">License Holder receives: R ${fmt(deal.colNet)}</strong> · Profit: R ${fmt(deal.colProfit)} · ROI: ${Math.round(deal.colROI)}%</p>
<p><strong class="gold">Gallery total income: R ${fmt(deal.vbTotal)}</strong></p>
<div class="footer"><span>VOLLARD BLACK</span><span>${ADMIN_EMAIL}</span></div>
</body></html>`;
  const w=window.open("","_blank");w.document.write(html);w.document.close();w.focus();setTimeout(()=>w.print(),800);
};

// ─── AUCTION REPORT ───
const generateAuctionReport=(auction,winnerBuyer,renter,allBids)=>{
  const bids=allBids.filter(b=>b.auctionId===auction.id).sort((a,b)=>new Date(b.timestamp)-new Date(a.timestamp));
  const reserveMet=(auction.currentBid||0)>=(auction.reservePrice||0);
  const html=`<!DOCTYPE html><html><head><meta charset="utf-8"><title>VB Auction Report — ${auction.title}</title>
<style>body{font-family:Arial,sans-serif;color:#1a1714;max-width:800px;margin:0 auto;padding:48px 40px;font-size:13px;line-height:1.7}.header{display:flex;justify-content:space-between;border-bottom:2px solid #b68b2e;padding-bottom:20px;margin-bottom:32px}.gold{color:#b68b2e;font-weight:600}.green{color:#2d7a4a;font-weight:600}.red{color:#c45c4a;font-weight:600}table{width:100%;border-collapse:collapse;font-size:12px;margin-bottom:20px}th{background:#f5f0e8;padding:8px 10px;text-align:left;font-size:10px;letter-spacing:1.5px;text-transform:uppercase;color:#666;border-bottom:1px solid #ddd}td{padding:8px 10px;border-bottom:1px solid #f0ece4}.result{background:${reserveMet?"#f0faf4":"#fdf0ee"};border:1px solid ${reserveMet?"#4a9e6b":"#c45c4a"};border-radius:8px;padding:20px;margin-bottom:28px;text-align:center}.footer{margin-top:40px;padding-top:14px;border-top:1px solid #ddd;font-size:11px;color:#aaa;display:flex;justify-content:space-between}</style></head><body>
<div class="header"><div><div style="font-size:28px;font-weight:300;letter-spacing:6px">VOLLARD <span style="color:#b68b2e">BLACK</span></div><div style="font-size:11px;color:#999;margin-top:4px">FINE ART AUCTIONS</div></div><div style="text-align:right"><div style="font-size:14px;text-transform:uppercase;letter-spacing:2px;color:#666">Auction Settlement Report</div><div style="font-size:12px;color:#999">${auction.closedAt||td()}</div></div></div>
<div class="result"><div style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:${reserveMet?"#4a9e6b":"#c45c4a"};margin-bottom:8px">${reserveMet?"SOLD — RESERVE MET":"NO SALE — RESERVE NOT MET"}</div><div style="font-size:32px;font-weight:300;color:${reserveMet?"#2d7a4a":"#c45c4a"}">${reserveMet?`R ${fmt(auction.currentBid)}`:auction.currentBid>0?`Highest Bid: R ${fmt(auction.currentBid)}`:"No Bids"}</div><div style="font-size:12px;color:#666;margin-top:6px">${auction.title}</div></div>
<table><thead><tr><th>Field</th><th>Detail</th></tr></thead><tbody>
<tr><td>Artwork</td><td>${auction.title}</td></tr>
<tr><td>Artist</td><td>${auction.artist||"—"}</td></tr>
<tr><td>Gallery</td><td>${auction.galleryName||"—"}</td></tr>
<tr><td>Declared Value</td><td>R ${fmt(auction.artworkValue)}</td></tr>
<tr><td>Reserve Price</td><td>R ${fmt(auction.reservePrice)}</td></tr>
<tr><td>Final Bid</td><td class="gold">R ${fmt(auction.currentBid||0)}</td></tr>
<tr><td>Total Bids</td><td>${bids.length}</td></tr>
<tr><td>Bid Increment</td><td>${auction.incrementLabel||"—"}</td></tr>
</tbody></table>
${reserveMet&&winnerBuyer?`<h3 style="color:#b68b2e;margin-bottom:12px">Winning Buyer — KYC Verified</h3>
<table><thead><tr><th>Field</th><th>Detail</th></tr></thead><tbody>
<tr><td>Name</td><td>${winnerBuyer.type==="company"?winnerBuyer.companyName:`${winnerBuyer.firstName} ${winnerBuyer.lastName}`}</td></tr>
<tr><td>ID / Reg</td><td>${winnerBuyer.idNumber||"—"}</td></tr>
<tr><td>Email</td><td>${winnerBuyer.email||"—"}</td></tr>
<tr><td>Mobile</td><td>${winnerBuyer.mobile||"—"}</td></tr>
<tr><td>KYC Status</td><td class="green">✓ Auction Approved</td></tr>
</tbody></table>
<h3 style="color:#b68b2e;margin-bottom:12px">Payment Instructions — Renter Bank Details</h3>
<p style="margin-bottom:12px">The winning buyer must pay the renter directly. Vollard Black does not process sale proceeds.</p>
${renter?`<table><thead><tr><th>Field</th><th>Detail</th></tr></thead><tbody>
<tr><td>Account Holder</td><td>${renter.firstName||""} ${renter.lastName||renter.companyName||""}</td></tr>
<tr><td>Bank</td><td>${renter.bankName||"To be provided by Renter"}</td></tr>
<tr><td>Account Number</td><td>${renter.accountNumber||"To be provided by Renter"}</td></tr>
<tr><td>Branch Code</td><td>${renter.branchCode||"—"}</td></tr>
<tr><td>Reference</td><td>${auction.id}</td></tr>
</tbody></table>`:"<p style='color:#c45c4a'>Renter bank details not on file — VB to obtain and forward separately.</p>"}
<p style="font-size:11px;color:#999;margin-top:8px">⚠ Artwork will not be released until: (1) full payment confirmed by Renter, and (2) all outstanding rental fees settled with Vollard Black.</p>`:""}
${bids.length>0?`<h3 style="color:#b68b2e;margin-bottom:12px">Bid History</h3><table><thead><tr><th>#</th><th>Bidder</th><th>Amount</th><th>Time</th><th>Status</th></tr></thead><tbody>${bids.map((b,i)=>`<tr><td>${bids.length-i}</td><td>${b.buyerName}</td><td class="${i===0?"gold":""}">R ${fmt(b.amount)}</td><td>${b.timestamp.slice(0,16).replace("T"," ")}</td><td>${i===0?"WINNER":"Outbid"}</td></tr>`).join("")}</tbody></table>`:"<p style='color:#999'>No bids recorded.</p>"}
<div class="footer"><span>VOLLARD BLACK — Fine Art Auctions</span><span>${ADMIN_EMAIL}</span><span>© ${new Date().getFullYear()}</span></div>
</body></html>`;
  const w=window.open("","_blank");w.document.write(html);w.document.close();w.focus();setTimeout(()=>w.print(),800);
};

const buyerName=(b)=>b?(b.type==="company"?b.companyName:`${b.firstName} ${b.lastName}`):"";

// ─── AUCTION HELPERS ───
const BID_INCREMENTS=[
  {label:"2.5%",type:"pct",value:0.025},
  {label:"5%",type:"pct",value:0.05},
  {label:"R250",type:"flat",value:250},
  {label:"R500",type:"flat",value:500},
  {label:"R1,000",type:"flat",value:1000},
];
const calcMinBid=(currentBid,increment)=>{
  if(!increment)return currentBid;
  const base=currentBid||0;
  if(increment.type==="pct")return Math.ceil(base+base*increment.value);
  return base+increment.value;
};
const auctionStatusColor={
  Draft:{bg:"rgba(182,139,46,0.15)",c:"#b68b2e"},
  Live:{bg:"rgba(74,158,107,0.15)",c:"#4a9e6b"},
  Frozen:{bg:"rgba(100,140,200,0.15)",c:"#648cc8"},
  Sold:{bg:"rgba(74,158,107,0.15)",c:"#4a9e6b"},
  "No Sale":{bg:"rgba(196,92,74,0.15)",c:"#c45c4a"},
};
function useCountdown(endTime,status){
  const[remaining,setRemaining]=useState(null);
  useEffect(()=>{
    if(status!=="Live"||!endTime){setRemaining(null);return;}
    const tick=()=>{const diff=new Date(endTime)-new Date();setRemaining(diff>0?diff:0);};
    tick();const t=setInterval(tick,1000);return()=>clearInterval(t);
  },[endTime,status]);
  return remaining;
}
function formatCountdown(ms){
  if(ms===null)return null;
  if(ms<=0)return"ENDED";
  const s=Math.floor(ms/1000);
  const d=Math.floor(s/86400);
  const h=Math.floor((s%86400)/3600);
  const m=Math.floor((s%3600)/60);
  const sec=s%60;
  if(d>0)return`${d}d ${h}h ${m}m`;
  if(h>0)return`${h}h ${m}m ${sec}s`;
  return`${m}m ${sec}s`;
}
function sendPushNotification(title,body){
  if(!("Notification"in window))return;
  if(Notification.permission==="granted")new Notification(title,{body});
  else if(Notification.permission!=="denied")Notification.requestPermission().then(p=>{if(p==="granted")new Notification(title,{body});});
}

// ─── Icons ───
const I={
  dash:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
  art:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>,
  ppl:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>,
  buyer:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2"/><path d="M16 3.13a4 4 0 010 7.75"/><path d="M21 21v-2a4 4 0 00-3-3.87"/></svg>,
  calc:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/></svg>,
  bill:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
  sale:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>,
  star:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="8" r="4"/><path d="M4 21v-1a6 6 0 0112 0v1"/><path d="M16 11l2 2 4-4"/></svg>,
  report:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
  plus:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  x:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  edit:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  del:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>,
  ok:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>,
  menu:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
  up:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>,
  mail:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
  warn:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  chevron:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>,
  lock:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>,
  dl:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  pdf:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
  gallery:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  gavel:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2L2 14"/><path d="M5 11l6 6"/><path d="M16 8l4 4"/><path d="M14 14l4 4"/><rect x="2" y="18" width="4" height="4" rx="1"/></svg>,
};

const stC={Available:{bg:"rgba(74,158,107,0.12)",c:"#4a9e6b"},Reserved:{bg:"rgba(182,139,46,0.25)",c:"#b68b2e"},"In Gallery":{bg:"rgba(100,140,200,0.12)",c:"#648cc8"},Sold:{bg:"rgba(196,92,74,0.12)",c:"#c45c4a"},"In Dispute":{bg:"rgba(196,92,74,0.12)",c:"#c45c4a"}};
const schedC={Active:{bg:"rgba(74,158,107,0.12)",c:"#4a9e6b"},Chasing:{bg:"rgba(230,190,50,0.15)",c:"#e6be32"},"In Dispute":{bg:"rgba(220,120,40,0.15)",c:"#dc7828"},Cancelled:{bg:"rgba(196,92,74,0.15)",c:"#c45c4a"},Complete:{bg:"rgba(100,140,200,0.12)",c:"#648cc8"},Override:{bg:"rgba(160,100,220,0.12)",c:"#a064dc"}};
const modelC={O1:{bg:"rgba(182,139,46,0.25)",c:"#b68b2e",label:"Standard"},O2:{bg:"rgba(74,158,107,0.12)",c:"#4a9e6b",label:"Extended"},O3:{bg:"rgba(100,140,200,0.12)",c:"#648cc8",label:"Premium"}};
const payM=["EFT / Bank Transfer","PayFast","Crypto (USDT)","Cash","Other"];

const is={width:"100%",padding:"12px 14px",background:"#e8e4dd",border:"1px solid rgba(182,139,46,0.20)",borderRadius:8,color:"#1a1714",fontFamily:"DM Sans,sans-serif",fontSize:14,outline:"none"};
const ss={...is,cursor:"pointer",appearance:"none",WebkitAppearance:"none"};
const Card=({children,style:s})=><div style={{background:"#f7f5f1",border:"1px solid rgba(182,139,46,0.20)",borderRadius:14,padding:24,...s}}>{children}</div>;
const Btn=({children,gold,ghost,small,danger,warn,onClick,style:s,disabled:d})=>{
  const bg=gold?"linear-gradient(135deg,#b68b2e,#8a6a1e)":danger?"rgba(196,92,74,0.15)":warn?"rgba(220,120,40,0.12)":ghost?"transparent":"#e8e4dd";
  const cl=gold?"#f5f3ef":danger?"#c45c4a":warn?"#dc7828":ghost?"#b68b2e":"#2a2622";
  const br=ghost?"1px solid rgba(182,139,46,0.50)":danger?"1px solid rgba(196,92,74,0.3)":warn?"1px solid rgba(220,120,40,0.3)":"none";
  return<button disabled={d} onClick={onClick} style={{display:"inline-flex",alignItems:"center",gap:6,padding:small?"8px 14px":"12px 22px",borderRadius:8,border:br,cursor:d?"not-allowed":"pointer",fontSize:small?11:12,fontWeight:600,letterSpacing:1,textTransform:"uppercase",fontFamily:"DM Sans,sans-serif",transition:"all 0.2s",opacity:d?0.4:1,background:bg,color:cl,...s}}>{children}</button>;
};
const Badge=({status,sched,model})=>{const cfg=model?modelC:sched?schedC:stC;const key=model||status;const s=cfg[key]||{bg:"#e8e4dd",c:"#6b635a"};return<span style={{display:"inline-block",padding:"4px 10px",borderRadius:6,fontSize:11,fontWeight:600,background:s.bg,color:s.c}}>{model?s.label:status}</span>;};
const Field=({label,children,style:s})=><div style={{marginBottom:16,...s}}><label style={{display:"block",fontSize:10,fontWeight:500,letterSpacing:2,textTransform:"uppercase",color:"#6b635a",marginBottom:6}}>{label}</label>{children}</div>;
const Stat=({label,value,gold,green,red,orange})=><Card style={{padding:18,textAlign:"center"}}><div style={{fontSize:10,letterSpacing:2,textTransform:"uppercase",color:"#8a8070",marginBottom:6}}>{label}</div><div style={{fontFamily:"Cormorant Garamond,serif",fontSize:26,fontWeight:600,color:gold?"#b68b2e":green?"#4a9e6b":red?"#c45c4a":orange?"#dc7828":"#1a1714"}}>{value}</div></Card>;
const Empty=({msg,action})=><div style={{textAlign:"center",padding:"48px 20px",color:"#8a8070"}}><div style={{fontSize:42,marginBottom:12,opacity:0.3}}>◆</div><p style={{fontSize:14,marginBottom:16}}>{msg}</p>{action}</div>;
const Modal=({title,onClose,children,wide})=><div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:"12px 8px"}}><div style={{background:"#f7f5f1",border:"1px solid rgba(182,139,46,0.30)",borderRadius:16,width:"100%",maxWidth:wide?780:520,maxHeight:"94vh",overflow:"auto",padding:"20px 16px"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}><h2 style={{fontFamily:"Cormorant Garamond,serif",fontSize:22,fontWeight:400,color:"#1a1714",margin:0}}>{title}</h2><button onClick={onClose} style={{background:"none",border:"none",color:"#6b635a",cursor:"pointer"}}>{I.x}</button></div>{children}</div></div>;
const PT=({title,sub,action})=><div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20,flexWrap:"wrap",gap:10}}><div><h1 style={{fontFamily:"Cormorant Garamond,serif",fontSize:28,fontWeight:400,color:"#1a1714",letterSpacing:1,margin:0}}>{title}</h1>{sub&&<p style={{fontSize:12,color:"#8a8070",marginTop:4,letterSpacing:1}}>{sub}</p>}</div>{action}</div>;
const Tbl=({cols,data:rows})=><div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse"}}><thead><tr>{cols.map((c,i)=><th key={i} style={{fontSize:10,fontWeight:600,letterSpacing:1.5,textTransform:"uppercase",color:"#8a8070",padding:"10px 12px",textAlign:c.right?"right":"left",borderBottom:"1px solid rgba(182,139,46,0.18)",whiteSpace:"nowrap"}}>{c.label}</th>)}</tr></thead><tbody>{rows.map((row,ri)=><tr key={ri} onMouseEnter={e=>e.currentTarget.style.background="rgba(182,139,46,0.03)"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>{cols.map((c,ci)=><td key={ci} style={{fontSize:13,color:c.gold?"#b68b2e":c.green?"#4a9e6b":"#2a2622",fontWeight:c.bold?600:400,padding:"12px",textAlign:c.right?"right":"left",borderBottom:"1px solid rgba(182,139,46,0.10)",whiteSpace:"nowrap"}}>{c.render?c.render(row):row[c.key]}</td>)}</tr>)}</tbody></table></div>;
const ProgressBar=({pct,color})=><div style={{height:4,background:"rgba(182,139,46,0.20)",borderRadius:2,overflow:"hidden",marginTop:6}}><div style={{height:"100%",width:`${Math.min(pct,100)}%`,background:color||"linear-gradient(90deg,#b68b2e,#8a6a1e)",borderRadius:2,transition:"width 0.4s"}}/></div>;
const Banner=({type,count,label,onClick})=>{const cfg={yellow:{bg:"rgba(230,190,50,0.1)",border:"rgba(230,190,50,0.3)",c:"#e6be32"},orange:{bg:"rgba(220,120,40,0.1)",border:"rgba(220,120,40,0.3)",c:"#dc7828"},red:{bg:"rgba(196,92,74,0.1)",border:"rgba(196,92,74,0.3)",c:"#c45c4a"}};const s=cfg[type];return<div onClick={onClick} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 18px",background:s.bg,border:`1px solid ${s.border}`,borderRadius:10,cursor:"pointer",marginBottom:10}}><span style={{color:s.c}}>{I.warn}</span><span style={{fontSize:13,color:s.c,fontWeight:600}}>{count} {label}</span><span style={{fontSize:11,color:s.c,marginLeft:"auto",opacity:0.7}}>Click to view →</span></div>;};


// ═══════════════════════════════════════════
// LOGIN SCREEN
// ═══════════════════════════════════════════
function LoginScreen({onLogin}){
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");
  const [showPw,setShowPw]=useState(false);

  const handleLogin=async(e)=>{
    e.preventDefault();
    if(!email||!password)return setError("Enter your email and password.");
    setLoading(true);setError("");
    const {data,error:err}=await auth.signIn(email,password);
    setLoading(false);
    if(err)return setError("Incorrect email or password. Please try again.");
    if(data?.session)onLogin(data.session);
  };

  return(
    <div style={{minHeight:"100vh",background:"#f5f3ef",display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{width:"100%",maxWidth:420}}>
        {/* Logo */}
        <div style={{textAlign:"center",marginBottom:48}}>
          <div style={{fontFamily:"Cormorant Garamond,serif",fontSize:38,fontWeight:300,letterSpacing:10,color:"#1a1714"}}>
            VOLLARD <span style={{color:"#b68b2e"}}>BLACK</span>
          </div>
          <div style={{fontSize:10,letterSpacing:4,textTransform:"uppercase",color:"#8a8070",marginTop:6}}>
            Fine Art Acquisitions · Admin
          </div>
          <div style={{width:40,height:1,background:"rgba(182,139,46,0.4)",margin:"20px auto 0"}}/>
        </div>

        {/* Card */}
        <div style={{background:"#ffffff",border:"1px solid rgba(182,139,46,0.20)",borderRadius:16,padding:36,boxShadow:"0 8px 32px rgba(0,0,0,0.06)"}}>
          <div style={{fontFamily:"Cormorant Garamond,serif",fontSize:22,fontWeight:400,color:"#1a1714",marginBottom:6}}>
            Sign in
          </div>
          <div style={{fontSize:12,color:"#8a8070",marginBottom:28}}>
            Admin access only
          </div>

          <form onSubmit={handleLogin}>
            <div style={{marginBottom:16}}>
              <label style={{display:"block",fontSize:10,fontWeight:500,letterSpacing:2,textTransform:"uppercase",color:"#6b635a",marginBottom:6}}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e=>{setEmail(e.target.value);setError("");}}
                placeholder="concierge@vollardblack.com"
                autoComplete="email"
                style={{width:"100%",padding:"12px 14px",background:"#f5f3ef",border:"1px solid rgba(182,139,46,0.25)",borderRadius:8,color:"#1a1714",fontFamily:"DM Sans,sans-serif",fontSize:14,outline:"none",boxSizing:"border-box"}}
              />
            </div>

            <div style={{marginBottom:24}}>
              <label style={{display:"block",fontSize:10,fontWeight:500,letterSpacing:2,textTransform:"uppercase",color:"#6b635a",marginBottom:6}}>
                Password
              </label>
              <div style={{position:"relative"}}>
                <input
                  type={showPw?"text":"password"}
                  value={password}
                  onChange={e=>{setPassword(e.target.value);setError("");}}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  style={{width:"100%",padding:"12px 44px 12px 14px",background:"#f5f3ef",border:"1px solid rgba(182,139,46,0.25)",borderRadius:8,color:"#1a1714",fontFamily:"DM Sans,sans-serif",fontSize:14,outline:"none",boxSizing:"border-box"}}
                />
                <button
                  type="button"
                  onClick={()=>setShowPw(p=>!p)}
                  style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:"#8a8070",cursor:"pointer",fontSize:12,fontFamily:"DM Sans,sans-serif"}}
                >
                  {showPw?"Hide":"Show"}
                </button>
              </div>
            </div>

            {error&&(
              <div style={{padding:"10px 14px",background:"rgba(196,92,74,0.08)",border:"1px solid rgba(196,92,74,0.2)",borderRadius:8,fontSize:13,color:"#c45c4a",marginBottom:16}}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{width:"100%",padding:"14px",background:loading?"rgba(182,139,46,0.5)":"linear-gradient(135deg,#b68b2e,#8a6a1e)",border:"none",borderRadius:8,color:"#f5f3ef",fontSize:13,fontWeight:600,letterSpacing:1,textTransform:"uppercase",fontFamily:"DM Sans,sans-serif",cursor:loading?"not-allowed":"pointer",transition:"opacity 0.2s"}}
            >
              {loading?"Signing in…":"Sign In"}
            </button>
          </form>
        </div>

        <div style={{textAlign:"center",marginTop:24,fontSize:11,color:"#a09890"}}>
          Vollard Black (Pty) Ltd · Hermanus, South Africa
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════
export default function App(){
  const [session,setSession]=useState(undefined);
  const [isAdminUser,setIsAdminUser]=useState(false);
  const [isAdminChecked,setIsAdminChecked]=useState(false);
  const [pendingPortalCount,setPendingPortalCount]=useState(0);
  const [data,setData]=useState(fresh);
  const [page,setPage]=useState("dashboard");
  const [sb,setSb]=useState(false);
  const [loading,setLoading]=useState(true);
  const [dbMode,setDbMode]=useState(false);
  const [isMobile,setIsMobile]=useState(false);
  const dbModeRef=useRef(false);
  const dataRef=useRef(fresh());
  const [invoiceFilter,setInvoiceFilter]=useState(null);

  // ── Mobile detection ──
  useEffect(()=>{
    const check=()=>setIsMobile(window.innerWidth<900);
    check();
    window.addEventListener('resize',check);
    return()=>window.removeEventListener('resize',check);
  },[]);

  // ── Auth: check session on mount, listen for changes ──
  useEffect(()=>{
    if(!db.isConnected()){
      // No Supabase — run in local mode without login
      setSession(null);
      return;
    }
    auth.getSession().then(s=>{
      setSession(s);
      if(s){
        auth.isAdmin().then(a=>{setIsAdminUser(a);setIsAdminChecked(true);});
        if(supabase)supabase.from('portal_requests').select('id',{count:'exact'}).eq('status','pending').then(({count})=>setPendingPortalCount(count||0));
      }
    });
    const {data:{subscription}}=auth.onAuthStateChange((_event,s)=>{
      setSession(s);
      if(s){
        auth.isAdmin().then(a=>{setIsAdminUser(a);setIsAdminChecked(true);});
      } else {
        setIsAdminUser(false);setIsAdminChecked(false);
      }
    });
    return()=>subscription.unsubscribe();
  },[]);

  useEffect(()=>{
    if("Notification"in window&&Notification.permission==="default")Notification.requestPermission();
    // Don't load data until we have a session (or confirmed no supabase)
    if(session===undefined)return;
    async function init(){
      if(db.isConnected()){
        try{
          const results={};
          for(const t of TABLES){
            try{const d=await db.getAll(t);if(d)results[t]=d;}
            catch(e){console.warn(`Table '${t}' not found, skipping.`);results[t]=[];}
          }
          const safe={...fresh()};
          for(const t of TABLES){safe[t]=Array.isArray(results[t])?results[t]:[];}
          safe.collectors=safe.collectors.map(c=>({...c,linkedArtworks:c.linkedArtworks||[]}));
          console.log("Supabase connected, loaded tables:",Object.keys(results).map(t=>t+":"+results[t].length));setData(safe);setDbMode(true);dbModeRef.current=true;
          if(supabase)supabase.from('portal_requests').select('id',{count:'exact'}).eq('status','pending').then(({count})=>setPendingPortalCount(count||0));
        }catch(e){console.error(e);setData(loadLocal());}
      } else setData(loadLocal());
      setLoading(false);
    }
    init();

    // Real-time listeners — update data instantly when DB changes
    if(!supabase||!session)return;
    const channels=TABLES.map(table=>{
      return supabase.channel('realtime:'+table)
        .on('postgres_changes',{event:'*',schema:'public',table},(payload)=>{
          const toCamelKey=(k)=>k.replace(/_([a-z])/g,(_,c)=>c.toUpperCase());
          const toCamel=(obj)=>{if(!obj||typeof obj!=='object')return obj;const out={};for(const[k,v]of Object.entries(obj))out[toCamelKey(k)]=v;return out;};
          const rec=toCamel(payload.new||{});
          const oldRec=toCamel(payload.old||{});
          setData(prev=>{
            const arr=prev[table]||[];
            if(payload.eventType==='INSERT')return{...prev,[table]:[rec,...arr.filter(x=>x.id!==rec.id)]};
            if(payload.eventType==='UPDATE')return{...prev,[table]:arr.map(x=>x.id===rec.id?{...x,...rec}:x)};
            if(payload.eventType==='DELETE')return{...prev,[table]:arr.filter(x=>x.id!==oldRec.id)};
            return prev;
          });
          // Refresh portal count when portal_requests changes
          if(table==='portal_requests'||table.includes('request')){
            supabase.from('portal_requests').select('id',{count:'exact'}).eq('status','pending').then(({count})=>setPendingPortalCount(count||0));
          }
        })
        .subscribe();
    });

    // Also listen for portal_requests specifically
    const portalChannel=supabase.channel('realtime:portal_requests')
      .on('postgres_changes',{event:'*',schema:'public',table:'portal_requests'},(payload)=>{
        supabase.from('portal_requests').select('id',{count:'exact'}).eq('status','pending').then(({count})=>setPendingPortalCount(count||0));
      })
      .subscribe();

    return()=>{
      channels.forEach(c=>supabase.removeChannel(c));
      supabase.removeChannel(portalChannel);
    };
  },[session]);

  useEffect(()=>{
    if(!loading){
      dataRef.current=data;
      try{
        const slim={...data,artworks:data.artworks.map(a=>({...a,imageUrl:a.imageUrl?.startsWith("data:")?null:a.imageUrl||null}))};
        localStorage.setItem(SK,JSON.stringify(slim));
      }catch(e){console.warn("localStorage save skipped:",e.message);}
    }
  },[data,loading]);

  const up=useCallback((table,valOrFn)=>{
    setData(prev=>{
      const oldArr=prev[table]||[];
      const newArr=typeof valOrFn==="function"?valOrFn(oldArr):valOrFn;
      if(dbModeRef.current&&Array.isArray(oldArr)&&Array.isArray(newArr)){
        const added=newArr.filter(n=>!oldArr.find(o=>o.id===n.id));
        const removed=oldArr.filter(o=>!newArr.find(n=>n.id===o.id));
        const updated=newArr.filter(n=>{const o=oldArr.find(x=>x.id===n.id);return o&&JSON.stringify(o)!==JSON.stringify(n);});
        added.forEach(item=>db.insert(table,item).catch(e=>console.error('DB insert failed:',table,e)));
        removed.forEach(item=>db.remove(table,item.id).catch(e=>console.error('DB remove failed:',table,e)));
        updated.forEach(item=>db.update(table,item.id,item).catch(e=>console.error('DB update failed:',table,e)));
      }
      return{...prev,[table]:newArr};
    });
  },[]);

  const dbUp=useCallback((table,id,fields)=>{if(dbModeRef.current&&id)db.update(table,id,fields);},[]);
  const bulkDelete=useCallback(async(table,ids)=>{
    if(dbModeRef.current){for(const id of ids)await db.remove(table,id);}
    setData(prev=>({...prev,[table]:(prev[table]||[]).filter(x=>!ids.includes(x.id))}));
  },[dbMode]);

  const liveSchedules=useMemo(()=>(data.schedules||[]).map(s=>computeStrikes(s,data.payments||[])),[data.schedules,data.payments]);
  const chasing=liveSchedules.filter(s=>s.status==="Chasing");
  const inDispute=liveSchedules.filter(s=>s.status==="In Dispute");
  const cancelled=liveSchedules.filter(s=>s.status==="Cancelled");

  const actions={
    linkArtwork:async(collectorId,artworkId,acquisitionModel,depositType,depositPct)=>{
      const art=dataRef.current.artworks.find(a=>a.id===artworkId);
      const col=dataRef.current.collectors.find(c=>c.id===collectorId);
      if(!art||!col)return;
      const m=MODELS[acquisitionModel];
      const gn=col.type==="company"?col.companyName:`${col.firstName} ${col.lastName}`;
      const vbFee=art.recommendedPrice*m.vbPct;
      const depositAmt=art.recommendedPrice*(depositPct/100);
      const remainingFee=depositType==="toward"?Math.max(0,vbFee-depositAmt):vbFee;
      const monthly=remainingFee/m.term;
      const schedule={id:uid(),collectorId,collectorName:gn,collectorEmail:col.email||"",artworkId,artworkTitle:art.title,acquisitionModel,model:acquisitionModel,depositType:depositType||"none",depositPct:depositPct||0,depositAmount:depositAmt,depositPaid:false,totalDue:depositType==="separate"?vbFee+depositAmt:vbFee,monthlyAmount:monthly+(art.insuranceMonthly||0),insuranceMonthly:art.insuranceMonthly||0,termMonths:m.term,startDate:td(),monthsPaid:0,totalPaid:0,status:"Active",strikes:0,missedMonths:[],graceOverride:null,graceMonth:null,graceNote:"",createdAt:td()};
      up("schedules",p=>[...p,schedule]);
      up("collectors",p=>p.map(c=>{if(c.id!==collectorId)return c;const la=[...(c.linkedArtworks||[])];if(!la.find(x=>x.artworkId===artworkId))la.push({artworkId,model:acquisitionModel,linkedAt:td()});return{...c,linkedArtworks:la};}));
      up("artworks",p=>p.map(a=>a.id===artworkId?{...a,status:"Reserved"}:a));
      dbUp("artworks",artworkId,{status:"Reserved"});
    },
    recordPayment:(schedule,monthNumber,method,amount)=>{
      const payment={id:uid(),scheduleId:schedule.id,collectorId:schedule.collectorId,collectorName:schedule.collectorName,artworkId:schedule.artworkId,artworkTitle:schedule.artworkTitle,model:schedule.acquisitionModel||"O1",monthNumber,amount,method,date:td(),createdAt:td()};
      up("payments",p=>[...p,payment]);
      const newPaid=schedule.monthsPaid+1;const newTotal=(schedule.totalPaid||0)+amount;
      const newStatus=newPaid>=schedule.termMonths?"Complete":"Active";
      const newMissed=(schedule.missedMonths||[]).filter(m=>m!==monthNumber);
      up("schedules",p=>p.map(s=>s.id===schedule.id?{...s,monthsPaid:newPaid,totalPaid:newTotal,status:newStatus,strikes:Math.max(0,(s.strikes||0)-1),missedMonths:newMissed}:s));
      dbUp("schedules",schedule.id,{monthsPaid:newPaid,totalPaid:newTotal,status:newStatus,missedMonths:newMissed});
      if(newStatus==="Complete"){up("artworks",p=>p.map(a=>a.id===schedule.artworkId?{...a,status:"In Gallery"}:a));dbUp("artworks",schedule.artworkId,{status:"In Gallery"});}
    },
    recordMissed:(schedule,monthNumber)=>{
      const newMissed=[...new Set([...(schedule.missedMonths||[]),monthNumber])];
      const newStrikes=Math.min(newMissed.length,3);
      const newStatus=newStrikes===1?"Chasing":newStrikes===2?"In Dispute":"Cancelled";
      up("schedules",p=>p.map(s=>s.id===schedule.id?{...s,missedMonths:newMissed,strikes:newStrikes,status:newStatus}:s));
      dbUp("schedules",schedule.id,{missedMonths:newMissed,strikes:newStrikes,status:newStatus});
    },
    overrideSchedule:(scheduleId,note)=>{up("schedules",p=>p.map(s=>s.id===scheduleId?{...s,status:"Active",strikes:0,missedMonths:[],overrideNote:note}:s));dbUp("schedules",scheduleId,{status:"Active",strikes:0,missedMonths:[],overrideNote:note});},
    setGraceException:(scheduleId,graceDate,month,note)=>{up("schedules",p=>p.map(s=>s.id===scheduleId?{...s,graceOverride:graceDate,graceMonth:month,graceNote:note}:s));dbUp("schedules",scheduleId,{graceOverride:graceDate,graceMonth:month,graceNote:note});},
    unlinkArtwork:async(scheduleId)=>{
      const sched=dataRef.current.schedules.find(s=>s.id===scheduleId);if(!sched)return;
      up("schedules",p=>p.filter(s=>s.id!==scheduleId));
      up("collectors",p=>p.map(c=>{if(c.id!==sched.collectorId)return c;return{...c,linkedArtworks:(c.linkedArtworks||[]).filter(l=>l.artworkId!==sched.artworkId)};}));
      const hasSale=(dataRef.current.sales||[]).some(s=>s.artworkId===sched.artworkId);
      if(!hasSale){up("artworks",p=>p.map(a=>a.id===sched.artworkId?{...a,status:"Available"}:a));dbUp("artworks",sched.artworkId,{status:"Available"});}
    },
    forceDeleteArtwork:async(artworkId)=>{
      const schedIds=(dataRef.current.schedules||[]).filter(s=>s.artworkId===artworkId).map(s=>s.id);
      const payIds=(dataRef.current.payments||[]).filter(p=>p.artworkId===artworkId).map(p=>p.id);
      if(schedIds.length>0)await bulkDelete("schedules",schedIds);
      if(payIds.length>0)await bulkDelete("payments",payIds);
      up("collectors",p=>p.map(c=>({...c,linkedArtworks:(c.linkedArtworks||[]).filter(l=>l.artworkId!==artworkId)})));
      up("artworks",p=>p.filter(a=>a.id!==artworkId));
      if(storage)storage.deleteArtworkImage(artworkId).catch(()=>{});
    },
    recordSale:(saleData)=>{
      if(saleData.newBuyerData){up("buyers",p=>[...p,{...saleData.newBuyerData,id:saleData.newBuyerData.id||uuidv4(),createdAt:td()}]);}
      const sale={...saleData,id:uid(),date:td()};delete sale.newBuyerData;
      up("sales",p=>[...p,sale]);
      up("artworks",p=>p.map(a=>a.id===saleData.artworkId?{...a,status:"Sold"}:a));
      dbUp("artworks",saleData.artworkId,{status:"Sold"});
      up("schedules",p=>p.map(s=>{if(s.artworkId===saleData.artworkId&&s.status!=="Complete"){dbUp("schedules",s.id,{status:"Complete"});return{...s,status:"Complete"};}return s;}));
    },
    deleteSale:(saleId)=>{
      const sale=(dataRef.current.sales||[]).find(s=>s.id===saleId);if(!sale)return;
      up("sales",p=>p.filter(s=>s.id!==saleId));
      const hasCollector=(dataRef.current.collectors||[]).some(c=>(c.linkedArtworks||[]).some(l=>l.artworkId===sale.artworkId));
      up("artworks",p=>p.map(a=>a.id===sale.artworkId?{...a,status:hasCollector?"Reserved":"Available"}:a));
      dbUp("artworks",sale.artworkId,{status:hasCollector?"Reserved":"Available"});
    },
    saveBuyer:(buyer)=>{
      if(buyer.id)up("buyers",p=>p.map(b=>b.id===buyer.id?buyer:b));
      else up("buyers",p=>[{...buyer,id:uuidv4(),createdAt:td()},...p]);
    },
    deleteBuyer:(id)=>{up("buyers",p=>p.filter(b=>b.id!==id));},
    // ─── AUCTION ACTIONS ───
    createAuction:async(auctionData)=>{
      const auction={...auctionData,id:uid(),createdAt:td(),status:"Draft",currentBid:0,leadBidderId:null,leadBidderName:null,bidsCount:0};
      up("auctions",p=>[...p,auction]);
      // Save to Supabase immediately
      const toSnake=(obj)=>{const out={};for(const[k,v]of Object.entries(obj))out[k.replace(/[A-Z]/g,m=>'_'+m.toLowerCase())]=v;return out;};
      try{await db.insert("auctions",toSnake(auction));}catch(e){console.error("Auction save failed:",e);}
    },
    updateAuction:(id,fields)=>{up("auctions",p=>p.map(a=>a.id===id?{...a,...fields}:a));dbUp("auctions",id,fields);},
    launchAuction:(id)=>{
      const now=new Date().toISOString();
      up("auctions",p=>p.map(a=>a.id===id?{...a,status:"Live",startedAt:now}:a));
      dbUp("auctions",id,{status:"Live",startedAt:now});
      sendPushNotification("🔴 Auction Live — Vollard Black","A new auction has just gone live. Place your bid now.");
    },
    freezeAuction:(id)=>{up("auctions",p=>p.map(a=>a.id===id?{...a,status:"Frozen"}:a));dbUp("auctions",id,{status:"Frozen"});sendPushNotification("⏸ Auction Paused","The auction has been temporarily paused.");},
    resumeAuction:(id)=>{up("auctions",p=>p.map(a=>a.id===id?{...a,status:"Live"}:a));dbUp("auctions",id,{status:"Live"});sendPushNotification("▶ Auction Resumed","Bidding has resumed.");},
    closeAuction:(id)=>{
      const auction=(dataRef.current.auctions||[]).find(a=>a.id===id);if(!auction)return;
      const reserveMet=(auction.currentBid||0)>=(auction.reservePrice||0);
      const newStatus=reserveMet?"Sold":"No Sale";
      up("auctions",p=>p.map(a=>a.id===id?{...a,status:newStatus,closedAt:td()}:a));
      dbUp("auctions",id,{status:newStatus,closedAt:td()});
      if(reserveMet&&auction.artworkId){up("artworks",p=>p.map(a=>a.id===auction.artworkId?{...a,status:"Sold"}:a));}
      sendPushNotification(reserveMet?"✓ Auction Sold":"Auction Closed",reserveMet?`${auction.title} sold for R ${fmt(auction.currentBid)}`:`${auction.title} — reserve not met.`);
    },
    placeBid:(auctionId,buyerId,buyerName,amount)=>{
      const bid={id:uid(),auctionId,buyerId,buyerName,amount,timestamp:new Date().toISOString()};
      up("bids",p=>[...p,bid]);
      const auction=(dataRef.current.auctions||[]).find(a=>a.id===auctionId);
      up("auctions",p=>p.map(a=>a.id===auctionId?{...a,currentBid:amount,leadBidderId:buyerId,leadBidderName:buyerName,bidsCount:(a.bidsCount||0)+1}:a));
      dbUp("auctions",auctionId,{currentBid:amount,leadBidderId:buyerId,leadBidderName:buyerName});
      sendPushNotification("New Bid — Vollard Black",`${buyerName} bid R ${amount.toLocaleString("en-ZA")} on ${auction?.title||"artwork"}`);
    },
    approveForAuction:(buyerId)=>{up("buyers",p=>p.map(b=>b.id===buyerId?{...b,auctionApproved:true,auctionApprovedAt:td()}:b));dbUp("buyers",buyerId,{auctionApproved:true,auctionApprovedAt:td()});},
    revokeAuctionApproval:(buyerId)=>{up("buyers",p=>p.map(b=>b.id===buyerId?{...b,auctionApproved:false,auctionRequested:false}:b));dbUp("buyers",buyerId,{auctionApproved:false});},
    updateBuyerAuctionRequest:(buyerId)=>{up("buyers",p=>p.map(b=>b.id===buyerId?{...b,auctionRequested:true,auctionRequestedAt:td()}:b));dbUp("buyers",buyerId,{auctionRequested:true,auctionRequestedAt:td()});},
    generateReport:(yearMonth)=>{
      const locked=isReportLocked(yearMonth);
      const existing=(dataRef.current.reports||[]).find(r=>r.month===yearMonth);
      if(existing&&locked){if(!confirm(`${getMonthLabel(yearMonth)} is locked.\n\nOverride?`))return;}
      const monthPayments=(dataRef.current.payments||[]).filter(p=>(p.date||"").startsWith(yearMonth));
      const monthSales=(dataRef.current.sales||[]).filter(s=>(s.date||"").startsWith(yearMonth));
      const snap={activeCount:liveSchedules.filter(s=>s.status==="Active").length,chasingCount:liveSchedules.filter(s=>s.status==="Chasing").length,disputeCount:liveSchedules.filter(s=>s.status==="In Dispute").length,cancelledCount:liveSchedules.filter(s=>s.status==="Cancelled").length,totalCollected:monthPayments.reduce((s,p)=>s+(p.amount||0),0),payments:monthPayments,chasing:liveSchedules.filter(s=>s.status==="Chasing").map(s=>{const col=dataRef.current.collectors.find(c=>c.id===s.collectorId);return{...s,mobile:col?.mobile||""};}),dispute:liveSchedules.filter(s=>s.status==="In Dispute").map(s=>{const col=dataRef.current.collectors.find(c=>c.id===s.collectorId);return{...s,mobile:col?.mobile||""};}),cancelled:liveSchedules.filter(s=>s.status==="Cancelled").map(s=>{const col=dataRef.current.collectors.find(c=>c.id===s.collectorId);return{...s,mobile:col?.mobile||""};}),salesPayout:monthSales,auctionResults:(dataRef.current.auctions||[]).filter(a=>(a.closedAt||a.createdAt||"").startsWith(yearMonth))};
      const report={id:existing?.id||uid(),month:yearMonth,generatedAt:td(),locked,snapshot:snap,totalCollected:snap.totalCollected,activeCount:snap.activeCount,chasingCount:snap.chasingCount,disputeCount:snap.disputeCount,cancelledCount:snap.cancelledCount};
      if(existing)up("reports",p=>p.map(r=>r.month===yearMonth?report:r));
      else up("reports",p=>[...p,report]);
    },
  };

  const nav=[
    {id:"dashboard",label:"Dashboard",icon:I.dash},
    {id:"catalogue",label:"Art Catalogue",icon:I.art},
    {id:"artists",label:"Artists",icon:I.star},
    {id:"collectors",label:"License Holders",icon:I.ppl},
    {id:"buyers",label:"Buyers",icon:I.buyer},
    {id:"renters",label:"Renters Fee",icon:I.calc},
    {id:"gallery",label:"Gallery",icon:I.gallery},
    {id:"invoices",label:"Invoicing",icon:I.bill},
    {id:"sales",label:"Sales",icon:I.sale},
    {id:"auction",label:"Auction Platform",icon:I.gavel},
    {id:"reports",label:"Reports",icon:I.report},
    {id:"portals",label:"Portal Users",icon:I.ppl},
  ];

  const d={artworks:Array.isArray(data.artworks)?data.artworks:[],artists:Array.isArray(data.artists)?data.artists:[],collectors:Array.isArray(data.collectors)?data.collectors:[],buyers:Array.isArray(data.buyers)?data.buyers:[],schedules:liveSchedules,payments:Array.isArray(data.payments)?data.payments:[],sales:Array.isArray(data.sales)?data.sales:[],reports:Array.isArray(data.reports)?data.reports:[],auctions:Array.isArray(data.auctions)?data.auctions:[],bids:Array.isArray(data.bids)?data.bids:[]};
  const navTo=(p,filter)=>{setPage(p);if(filter)setInvoiceFilter(filter);setSb(false);};

  const liveAuctionCount=(d.auctions||[]).filter(a=>a.status==="Live").length;
  const pendingApprovalCount=(d.buyers||[]).filter(b=>b.auctionRequested&&!b.auctionApproved).length;

  const pg={
    dashboard:<Dashboard data={d} navTo={navTo} chasing={chasing} inDispute={inDispute} cancelled={cancelled} pendingPortalRequests={pendingPortalCount}/>,
    catalogue:<Catalogue data={d} up={up} actions={actions}/>,
    artists:<ArtistsPage data={d} up={up}/>,
    collectors:<CollectorsPage data={d} up={up} actions={actions}/>,
    buyers:<BuyersPage data={d} actions={actions}/>,
    renters:<CalcPage data={d} actions={actions}/>,
    gallery:<GalleryPage data={d} actions={actions}/>,
    invoices:<InvoicePage data={d} actions={actions} initialFilter={invoiceFilter} clearFilter={()=>setInvoiceFilter(null)}/>,
    sales:<SalesPage data={d} actions={actions}/>,
    auction:<AuctionPage data={d} actions={actions}/>,
    reports:<ReportsPage data={d} actions={actions}/>,
    portals:<PortalsPage data={d} setPendingPortalCount={setPendingPortalCount}/>,
  };

  // ── Session gate ──
  if(session===undefined)return<div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"100vh",background:"#f5f3ef"}}><div style={{fontFamily:"Cormorant Garamond,serif",fontSize:24,fontWeight:300,letterSpacing:8,color:"#b68b2e",opacity:0.5}}>VOLLARD BLACK</div></div>;
  if(session===null&&db.isConnected())return<LoginScreen onLogin={s=>setSession(s)}/>;
  if(session&&db.isConnected()&&isAdminChecked&&!isAdminUser)return(
    <div style={{minHeight:"100vh",background:"#f5f3ef",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:16,padding:20}}>
      <div style={{fontFamily:"Cormorant Garamond,serif",fontSize:28,color:"#1a1714"}}>Access Denied</div>
      <div style={{fontSize:14,color:"#8a8070",textAlign:"center"}}>This portal is for administrators only.<br/>Please use your renter or artist portal instead.</div>
      <button onClick={()=>auth.signOut()} style={{padding:"12px 24px",background:"linear-gradient(135deg,#b68b2e,#8a6a1e)",border:"none",borderRadius:8,color:"#fff",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"DM Sans,sans-serif"}}>Sign Out</button>
    </div>
  );

  if(loading)return<div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"100vh",background:"#f5f3ef"}}><div style={{textAlign:"center"}}><div style={{fontFamily:"Cormorant Garamond,serif",fontSize:36,fontWeight:300,letterSpacing:10,color:"#1a1714",marginBottom:10}}>VOLLARD <span style={{color:"#b68b2e"}}>BLACK</span></div><div style={{fontFamily:"Cormorant Garamond,serif",fontSize:14,fontWeight:300,letterSpacing:4,color:"#b68b2e",marginBottom:20,fontStyle:"italic"}}>Licensed Display Position Platform</div><div style={{width:32,height:1,background:"rgba(182,139,46,0.3)",margin:"0 auto 20px"}}/><div style={{fontSize:11,color:"#a09890",letterSpacing:3,textTransform:"uppercase"}}>Loading platform...</div></div></div>;

  return(
    <div style={{display:"flex",minHeight:"100vh",background:"#f5f3ef",fontFamily:"DM Sans,sans-serif",color:"#2a2622"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600&family=DM+Sans:wght@300;400;500;600&display=swap');
        *{box-sizing:border-box;-webkit-tap-highlight-color:transparent;}
        input,select,textarea,button{font-family:'DM Sans',sans-serif;}
        @media(max-width:900px){
          table{display:block;overflow-x:auto;-webkit-overflow-scrolling:touch;}
          .vb-grid-2{grid-template-columns:1fr!important;}
          .vb-grid-3{grid-template-columns:1fr 1fr!important;}
          .vb-grid-4{grid-template-columns:1fr 1fr!important;}
          .vb-grid-5{grid-template-columns:1fr 1fr!important;}
          .vb-hide-mobile{display:none!important;}
          .vb-full-mobile{width:100%!important;max-width:100%!important;}
        }
        @media(max-width:480px){
          .vb-grid-2,.vb-grid-3,.vb-grid-4,.vb-grid-5{grid-template-columns:1fr!important;}
        }
        input[type="datetime-local"]{font-size:14px;}
        ::-webkit-scrollbar{width:4px;height:4px;}
        ::-webkit-scrollbar-track{background:transparent;}
        ::-webkit-scrollbar-thumb{background:rgba(182,139,46,0.3);border-radius:2px;}
      `}</style>
      {sb&&<div onClick={()=>setSb(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.4)",zIndex:98}}/>}
      <aside style={{width:240,minHeight:"100vh",background:"#ffffff",borderRight:"1px solid rgba(182,139,46,0.20)",display:"flex",flexDirection:"column",position:"fixed",left:sb?0:"-240px",top:0,bottom:0,zIndex:99,transition:"left 0.3s",...(typeof window!=="undefined"&&window.innerWidth>900?{position:"relative",left:0}:{})}}>
        <div style={{padding:"28px 24px 20px",borderBottom:"1px solid rgba(182,139,46,0.18)"}}>
          <div style={{fontFamily:"Cormorant Garamond,serif",fontSize:22,fontWeight:300,letterSpacing:6,color:"#1a1714"}}>VOLLARD <span style={{color:"#b68b2e"}}>BLACK</span></div>
          <div style={{fontSize:9,letterSpacing:3,textTransform:"uppercase",color:"#8a8070",marginTop:4}}>Fine Art Acquisitions</div>
        </div>
        <nav style={{flex:1,padding:"16px 12px",overflowY:"auto"}}>
          {nav.map(n=>{
            const alertCount=n.id==="invoices"?chasing.length+inDispute.length+cancelled.length:n.id==="auction"?(liveAuctionCount>0?liveAuctionCount:0)+(pendingApprovalCount>0?pendingApprovalCount:0):n.id==="portals"?pendingPortalCount:0;
            return<button key={n.id} onClick={()=>navTo(n.id)} style={{display:"flex",alignItems:"center",gap:12,width:"100%",padding:"12px 14px",background:page===n.id?"rgba(182,139,46,0.20)":"transparent",border:"none",borderRadius:10,color:page===n.id?"#b68b2e":"#6b635a",fontSize:13,fontWeight:page===n.id?600:400,cursor:"pointer",marginBottom:4,fontFamily:"DM Sans,sans-serif"}}>{n.icon}<span style={{flex:1,textAlign:"left"}}>{n.label}</span>{alertCount>0&&<span style={{fontSize:10,background:n.id==="auction"&&liveAuctionCount>0?"rgba(74,158,107,0.2)":"rgba(196,92,74,0.2)",color:n.id==="auction"&&liveAuctionCount>0?"#4a9e6b":"#c45c4a",padding:"2px 6px",borderRadius:8,fontWeight:700}}>{alertCount}</span>}</button>;
          })}
        </nav>
        <div style={{padding:"16px 24px",borderTop:"1px solid rgba(182,139,46,0.18)",fontSize:10,color:"#8a8070",letterSpacing:2}}>
          <div>STANDARD: 50/50 · 6 MO</div>
          <div style={{marginTop:4}}>EXTENDED: 50/50 · 12 MO</div>
          <div style={{marginTop:4}}>PREMIUM: 50/50 · 24 MO</div>
          <div style={{marginTop:8,display:"flex",alignItems:"center",gap:6}}><div style={{width:6,height:6,borderRadius:"50%",background:dbMode?"#4a9e6b":"#b68b2e"}}/><span style={{fontSize:9}}>{dbMode?"Supabase Connected":"Local Storage"}</span></div>
          {session&&<button onClick={()=>auth.signOut()} style={{marginTop:10,width:"100%",padding:"7px 0",background:"transparent",border:"1px solid rgba(182,139,46,0.25)",borderRadius:6,color:"#8a8070",fontSize:10,letterSpacing:1,textTransform:"uppercase",cursor:"pointer",fontFamily:"DM Sans,sans-serif"}}>Sign Out</button>}
        </div>
      </aside>
      <main style={{flex:1,minWidth:0}}>
        <div style={{display:isMobile?"flex":"none",alignItems:"center",padding:"16px 20px",borderBottom:"1px solid rgba(182,139,46,0.18)",background:"#ffffff"}}>
          <button onClick={()=>setSb(true)} style={{background:"none",border:"none",color:"#b68b2e",cursor:"pointer",padding:4}}>{I.menu}</button>
          <span style={{fontFamily:"Cormorant Garamond,serif",fontSize:16,letterSpacing:4,marginLeft:12,color:"#1a1714"}}>VOLLARD <span style={{color:"#b68b2e"}}>BLACK</span></span>
        </div>
        <div style={{padding:isMobile?"16px 14px":"32px 28px",maxWidth:1200,margin:"0 auto",paddingBottom:isMobile?"80px":"32px"}}>{pg[page]}</div>
      </main>
      {isMobile&&<nav style={{position:"fixed",bottom:0,left:0,right:0,background:"#ffffff",borderTop:"1px solid rgba(182,139,46,0.20)",display:"flex",zIndex:97,paddingBottom:"env(safe-area-inset-bottom,0px)"}}>
        {[
          {id:"dashboard",icon:I.dash,label:"Home"},
          {id:"catalogue",icon:I.art,label:"Art"},
          {id:"invoices",icon:I.bill,label:"Invoicing"},
          {id:"auction",icon:I.gavel,label:"Auction"},
          {id:"reports",icon:I.report,label:"Reports"},
        ].map(n=>{
          const active=page===n.id;
          const alertCount=n.id==="invoices"?chasing.length+inDispute.length+cancelled.length:n.id==="auction"?(liveAuctionCount>0?liveAuctionCount:0)+(pendingApprovalCount>0?pendingApprovalCount:0):n.id==="portals"?pendingPortalCount:0;
          return<button key={n.id} onClick={()=>navTo(n.id)} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"8px 0",background:"transparent",border:"none",color:active?"#b68b2e":"#8a8070",cursor:"pointer",position:"relative",gap:3}}>
            <div style={{color:active?"#b68b2e":"#8a8070"}}>{n.icon}</div>
            <span style={{fontSize:9,letterSpacing:0.5,fontWeight:active?600:400}}>{n.label}</span>
            {alertCount>0&&<div style={{position:"absolute",top:4,right:"50%",transform:"translateX(12px)",width:8,height:8,borderRadius:"50%",background:"#c45c4a"}}/>}
          </button>;
        })}
        <button onClick={()=>setSb(true)} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"8px 0",background:"transparent",border:"none",color:"#8a8070",cursor:"pointer",gap:3}}>
          {I.menu}
          <span style={{fontSize:9,letterSpacing:0.5}}>More</span>
        </button>
      </nav>}
    </div>
  );
}

// ═══════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════
function Dashboard({data,navTo,chasing,inDispute,cancelled,pendingPortalRequests}){
  const totalPay=data.payments.reduce((s,p)=>s+(p.amount||0),0);
  const md={};data.payments.forEach(p=>{const k=(p.date||"").slice(0,7);if(k)md[k]=(md[k]||0)+(p.amount||0);});
  const sm=Object.keys(md).sort();const mx=Math.max(...Object.values(md),1);
  const months=["","Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const daysTo25=25-new Date().getDate();
  const upcomingSchedules=data.schedules.filter(s=>s.status==="Active"&&s.monthsPaid<s.termMonths).slice(0,6);
  const liveAuctions=(data.auctions||[]).filter(a=>a.status==="Live");
  return(<div>
    <PT title="Dashboard" sub="Vollard Black — Fine Art Acquisitions"/>
    {data.artworks.filter(a=>a.approvalStatus==="pending").length>0&&<div onClick={()=>navTo("catalogue")} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 18px",background:"rgba(182,139,46,0.08)",border:"1px solid rgba(182,139,46,0.25)",borderRadius:10,cursor:"pointer",marginBottom:10}}><span style={{color:"#b68b2e",fontSize:16}}>◆</span><span style={{fontSize:13,color:"#b68b2e",fontWeight:600}}>● {data.artworks.filter(a=>a.approvalStatus==="pending").length} artwork{data.artworks.filter(a=>a.approvalStatus==="pending").length>1?"s":""} submitted by artists awaiting approval</span><span style={{fontSize:11,color:"#b68b2e",marginLeft:"auto",opacity:0.7}}>Review now →</span></div>}
    {pendingPortalRequests>0&&<div onClick={()=>navTo("portals")} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 18px",background:"rgba(182,139,46,0.08)",border:"1px solid rgba(182,139,46,0.25)",borderRadius:10,cursor:"pointer",marginBottom:10}}><span style={{color:"#b68b2e",fontSize:16}}>◆</span><span style={{fontSize:13,color:"#b68b2e",fontWeight:600}}>● {pendingPortalRequests} portal access request{pendingPortalRequests>1?"s":""} awaiting approval</span><span style={{fontSize:11,color:"#b68b2e",marginLeft:"auto",opacity:0.7}}>Review now →</span></div>}
    {(data.enquiries||[]).filter(e=>!e.read).length>0&&(
      <div style={{padding:"12px 18px",background:"rgba(100,140,200,0.08)",border:"1px solid rgba(100,140,200,0.25)",borderRadius:10,marginBottom:10,display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:16}}>💬</span>
          <div>
            <div style={{fontSize:13,fontWeight:600,color:"#648cc8"}}>{(data.enquiries||[]).filter(e=>!e.read).length} new artwork enquir{(data.enquiries||[]).filter(e=>!e.read).length>1?"ies":"y"} from buyers</div>
            <div style={{fontSize:11,color:"#6b635a",marginTop:2}}>{(data.enquiries||[]).filter(e=>!e.read).slice(0,2).map(e=>`"${e.artworkTitle}" — ${e.buyerName}`).join(" · ")}</div>
          </div>
        </div>
        <div style={{display:"flex",gap:8"}}>
          <button onClick={()=>navTo("enquiries")} style={{padding:"8px 16px",borderRadius:6,border:"1px solid rgba(100,140,200,0.30)",background:"transparent",color:"#648cc8",cursor:"pointer",fontSize:11,fontWeight:600,fontFamily:"DM Sans,sans-serif"}}>View All</button>
          <button onClick={()=>{up("enquiries",p=>p.map(e=>({...e,read:true})));}} style={{padding:"8px 16px",borderRadius:6,border:"none",background:"rgba(100,140,200,0.15)",color:"#648cc8",cursor:"pointer",fontSize:11,fontWeight:600,fontFamily:"DM Sans,sans-serif"}}>Mark Read</button>
        </div>
      </div>
    )}
    {cancelled.length>0&&<Banner type="red" count={cancelled.length} label="agreements cancelled" onClick={()=>navTo("invoices","Cancelled")}/>}
    {inDispute.length>0&&<Banner type="orange" count={inDispute.length} label="accounts in dispute" onClick={()=>navTo("invoices","In Dispute")}/>}
    {chasing.length>0&&<Banner type="yellow" count={chasing.length} label="license holders being chased" onClick={()=>navTo("invoices","Chasing")}/>}
    {liveAuctions.length>0&&<div onClick={()=>navTo("auction")} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 18px",background:"rgba(74,158,107,0.08)",border:"1px solid rgba(74,158,107,0.25)",borderRadius:10,cursor:"pointer",marginBottom:10}}><span style={{color:"#4a9e6b",fontSize:16}}>⚖</span><span style={{fontSize:13,color:"#4a9e6b",fontWeight:600}}>● {liveAuctions.length} auction{liveAuctions.length>1?"s":""} live now</span><span style={{fontSize:11,color:"#4a9e6b",marginLeft:"auto",opacity:0.7}}>Go to Auction Platform →</span></div>}
    {daysTo25>0&&daysTo25<=7&&<div style={{padding:"12px 18px",background:"rgba(74,158,107,0.08)",border:"1px solid rgba(74,158,107,0.2)",borderRadius:10,marginBottom:10,fontSize:13,color:"#4a9e6b"}}>Payment window opens in {daysTo25} days (25th).</div>}
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(145px,1fr))",gap:14,marginBottom:28}}>
      <Stat label="Artworks" value={data.artworks.length}/>
      <Stat label="Active" value={data.schedules.filter(s=>s.status==="Active").length} green/>
      <Stat label="License Holders" value={data.collectors.length}/>
      <Stat label="Buyers" value={data.buyers.length} gold/>
      <Stat label="Auctions" value={(data.auctions||[]).length} gold/>
      <Stat label="Collected" value={"R "+fmt(totalPay)} green/>
    </div>
    <Card style={{marginBottom:20}}>
      <div style={{fontSize:14,fontWeight:600,color:"#1a1714",marginBottom:16}}>Monthly Revenue</div>
      {sm.length===0?<div style={{textAlign:"center",padding:"32px 0",color:"#8a8070",fontSize:13}}>No payment data yet.</div>:<div style={{display:"flex",alignItems:"flex-end",gap:6,height:160,padding:"0 8px"}}>
        {sm.map(m=>{const v=md[m];const h=Math.max((v/mx)*130,4);return<div key={m} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4,maxWidth:60}}><div style={{fontSize:10,color:"#b68b2e",fontWeight:600}}>R{(v/1000).toFixed(0)}k</div><div style={{width:"100%",height:h,background:"linear-gradient(180deg,#b68b2e,#8a6a1e)",borderRadius:"4px 4px 0 0",minWidth:20}}/><div style={{fontSize:9,color:"#8a8070"}}>{months[parseInt(m.slice(5))]||m.slice(5)}</div></div>;})}
      </div>}
    </Card>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
      <Card><div style={{fontSize:14,fontWeight:600,color:"#1a1714",marginBottom:16}}>Active License Agreements</div>
        {upcomingSchedules.length===0?<p style={{fontSize:13,color:"#8a8070"}}>No active agreements.</p>:upcomingSchedules.map(s=>{const pct=s.termMonths>0?(s.monthsPaid/s.termMonths)*100:0;return<div key={s.id} style={{padding:"10px 0",borderBottom:"1px solid rgba(182,139,46,0.10)"}}><div style={{display:"flex",justifyContent:"space-between",fontSize:13,alignItems:"center"}}><span style={{fontWeight:500}}>{s.collectorName}</span><div style={{display:"flex",alignItems:"center",gap:8}}><Badge model={s.acquisitionModel||"O1"}/><span style={{color:"#b68b2e",fontWeight:600}}>R {fmt(s.monthlyAmount)} per month</span></div></div><div style={{fontSize:11,color:"#8a8070",marginBottom:4}}>{s.artworkTitle} · Month {s.monthsPaid} of {s.termMonths}</div><ProgressBar pct={pct}/></div>;})}
      </Card>
      <Card><div style={{fontSize:14,fontWeight:600,color:"#1a1714",marginBottom:16}}>Recent Activity</div>
        {data.sales.length===0&&data.payments.length===0?<p style={{fontSize:13,color:"#8a8070"}}>No activity yet.</p>:
        [...data.sales.slice(-3).reverse().map(s=><div key={s.id} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:"1px solid rgba(182,139,46,0.10)",fontSize:13}}><span>{s.artworkTitle}</span><span style={{color:"#4a9e6b",fontWeight:600}}>R {fmt(s.salePrice)}</span></div>),
        ...data.payments.slice(-3).reverse().map(p=><div key={p.id} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:"1px solid rgba(182,139,46,0.10)",fontSize:13}}><span>{p.collectorName} · Mo {p.monthNumber}</span><span style={{color:"#b68b2e",fontWeight:600}}>R {fmt(p.amount)}</span></div>)]}
      </Card>
    </div>
    <div style={{display:"flex",gap:10,marginTop:24,flexWrap:"wrap"}}>
      <Btn gold onClick={()=>navTo("catalogue")}>{I.plus} Add Artwork</Btn>
      <Btn ghost onClick={()=>navTo("collectors")}>{I.plus} Add License Holder</Btn>
      <Btn ghost onClick={()=>navTo("auction")}>{I.gavel} Auction Platform</Btn>
      <Btn ghost onClick={()=>navTo("reports")}>{I.report} Reports</Btn>
    </div>
  </div>);
}

// ─── CATALOGUE, ARTISTS, COLLECTORS, BUYERS, CALCULATOR, GALLERY, INVOICING, SALES, REPORTS ───
// These components are unchanged from your working v16 platform.
// Paste them here from your existing VollardBlack.jsx file.
// The Auction Platform page is fully new and appears below.

// ═══════════════════════════════════════════
// AUCTION PAGE — FULL IMPLEMENTATION
// ═══════════════════════════════════════════
function AuctionPage({data,actions}){
  const [view,setView]=useState("dashboard");
  const [createModal,setCreateModal]=useState(false);
  const [bidModal,setBidModal]=useState(null);
  const [notifModal,setNotifModal]=useState(null);

  const auctions=data.auctions||[];
  const bids=data.bids||[];
  const buyers=data.buyers||[];
  const artworks=data.artworks||[];
  const collectors=data.collectors||[];

  const liveAuctions=auctions.filter(a=>a.status==="Live");
  const draftAuctions=auctions.filter(a=>a.status==="Draft");
  const frozenAuctions=auctions.filter(a=>a.status==="Frozen");
  const closedAuctions=auctions.filter(a=>["Sold","No Sale"].includes(a.status));
  const approvedBuyers=buyers.filter(b=>b.auctionApproved);
  const pendingApproval=buyers.filter(b=>b.auctionRequested&&!b.auctionApproved);

  const tabs=[
    {id:"dashboard",label:"Dashboard"},
    {id:"manage",label:`Active ${liveAuctions.length+frozenAuctions.length+draftAuctions.length>0?`(${liveAuctions.length+frozenAuctions.length+draftAuctions.length})`:""}`},
    {id:"history",label:"History"},
    {id:"buyers",label:`Buyer Approvals${pendingApproval.length>0?` (${pendingApproval.length})`:""}`},
  ];

  return(<div>
    <style>{`@keyframes auc-pulse{0%,100%{opacity:1}50%{opacity:0.3}}`}</style>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:28,flexWrap:"wrap",gap:12}}>
      <div>
        <div style={{fontSize:10,letterSpacing:4,textTransform:"uppercase",color:"#b68b2e",marginBottom:6}}>Vollard Black</div>
        <h1 style={{fontFamily:"Cormorant Garamond,serif",fontSize:32,fontWeight:300,color:"#1a1714",margin:0,letterSpacing:1}}>Auction Platform</h1>
        <p style={{fontSize:12,color:"#8a8070",marginTop:4}}>Live timed auctions · KYC verified buyers · Reserve price protection</p>
      </div>
      <div style={{display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"}}>
        {pendingApproval.length>0&&<div onClick={()=>setView("buyers")} style={{padding:"8px 14px",background:"rgba(220,120,40,0.1)",border:"1px solid rgba(220,120,40,0.3)",borderRadius:8,fontSize:12,color:"#dc7828",fontWeight:600,cursor:"pointer"}}>{pendingApproval.length} approval{pendingApproval.length>1?"s":""} pending</div>}
        <Btn ghost onClick={()=>setNotifModal(true)}>🔔 Push Notification</Btn>
        <Btn gold onClick={()=>setCreateModal(true)}>{I.plus} Create Auction</Btn>
      </div>
    </div>

    {/* Live banners */}
    {liveAuctions.map(a=><AucLiveBanner key={a.id} auction={a} bids={bids} fmt={fmt} onClick={()=>setView("manage")}/>)}

    {/* Stats */}
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:14,marginBottom:28}}>
      <Stat label="Total" value={auctions.length}/>
      <Stat label="Live" value={liveAuctions.length} green/>
      <Stat label="Draft" value={draftAuctions.length} gold/>
      <Stat label="Total Bids" value={bids.length}/>
      <Stat label="Sold" value={auctions.filter(a=>a.status==="Sold").length} green/>
      <Stat label="KYC Approved" value={approvedBuyers.length} gold/>
    </div>

    {/* Tabs */}
    <div style={{display:"flex",gap:0,marginBottom:24,borderBottom:"1px solid rgba(182,139,46,0.20)",overflowX:"auto"}}>
      {tabs.map(t=><button key={t.id} onClick={()=>setView(t.id)} style={{padding:"12px 20px",border:"none",borderBottom:view===t.id?"2px solid #b68b2e":"2px solid transparent",background:"transparent",color:view===t.id?"#b68b2e":"#6b635a",fontSize:12,fontWeight:view===t.id?600:400,cursor:"pointer",fontFamily:"DM Sans,sans-serif",whiteSpace:"nowrap"}}>{t.label}</button>)}
    </div>

    {/* Dashboard view */}
    {view==="dashboard"&&<div>
      {auctions.length===0?<Empty msg="No auctions yet. Create your first auction." action={<Btn gold onClick={()=>setCreateModal(true)}>{I.plus} Create First Auction</Btn>}/>:<div>
        {draftAuctions.length>0&&<div style={{marginBottom:24}}>
          <div style={{fontSize:11,letterSpacing:2,textTransform:"uppercase",color:"#8a8070",marginBottom:14}}>Draft — Ready to Launch</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))",gap:14}}>
            {draftAuctions.map(a=><AucCard key={a.id} auction={a} bids={bids} fmt={fmt} actions={actions} onBid={()=>setBidModal(a)} artworks={data.artworks}/>)}
          </div>
        </div>}
        {[...liveAuctions,...frozenAuctions].length>0&&<div>
          <div style={{fontSize:11,letterSpacing:2,textTransform:"uppercase",color:"#4a9e6b",marginBottom:14}}>● Active</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))",gap:14}}>
            {[...liveAuctions,...frozenAuctions].map(a=><AucCard key={a.id} auction={a} bids={bids} fmt={fmt} actions={actions} onBid={()=>setBidModal(a)} artworks={data.artworks}/>)}
          </div>
        </div>}
      </div>}
    </div>}

    {/* Manage view */}
    {view==="manage"&&<div>
      {[...liveAuctions,...frozenAuctions,...draftAuctions].length===0?<Empty msg="No active auctions."/>:<div style={{display:"grid",gap:16}}>
        {[...liveAuctions,...frozenAuctions,...draftAuctions].map(a=>(
          <AucManageRow key={a.id} auction={a} bids={bids} buyers={buyers} collectors={collectors} schedules={data.schedules||[]} fmt={fmt} actions={actions} onBid={()=>setBidModal(a)}
            onReport={()=>{const winner=buyers.find(b=>b.id===a.leadBidderId);const sched=(data.schedules||[]).find(s=>s.artworkId===a.artworkId);const renter=sched?collectors.find(c=>c.id===sched.collectorId):null;generateAuctionReport(a,winner,renter,bids);}}
          />
        ))}
      </div>}
    </div>}

    {/* History view */}
    {view==="history"&&<div>
      {closedAuctions.length===0?<Empty msg="No completed auctions yet."/>:<Card><div style={{overflowX:"auto"}}>
        <table style={{width:"100%",borderCollapse:"collapse"}}>
          <thead><tr>{["Date","Artwork","Gallery","Reserve","Final Bid","Bids","Result",""].map((h,i)=><th key={i} style={{fontSize:10,fontWeight:600,letterSpacing:1.5,textTransform:"uppercase",color:"#8a8070",padding:"10px 12px",textAlign:i>3?"right":"left",borderBottom:"1px solid rgba(182,139,46,0.18)",whiteSpace:"nowrap"}}>{h}</th>)}</tr></thead>
          <tbody>{[...closedAuctions].reverse().map(a=>{
            const sc=auctionStatusColor[a.status]||{bg:"#e8e4dd",c:"#6b635a"};
            const winner=buyers.find(b=>b.id===a.leadBidderId);
            const sched=(data.schedules||[]).find(s=>s.artworkId===a.artworkId);
            const renter=sched?collectors.find(c=>c.id===sched.collectorId):null;
            return<tr key={a.id} onMouseEnter={e=>e.currentTarget.style.background="rgba(182,139,46,0.03)"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
              <td style={{padding:"12px",borderBottom:"1px solid rgba(182,139,46,0.10)",fontSize:12,color:"#6b635a"}}>{a.closedAt||"—"}</td>
              <td style={{padding:"12px",borderBottom:"1px solid rgba(182,139,46,0.10)",fontSize:13,fontWeight:600,color:"#1a1714"}}>{a.title}</td>
              <td style={{padding:"12px",borderBottom:"1px solid rgba(182,139,46,0.10)",fontSize:12,color:"#6b635a"}}>{a.galleryName||"—"}</td>
              <td style={{padding:"12px",borderBottom:"1px solid rgba(182,139,46,0.10)",fontSize:12,textAlign:"right"}}>R {fmt(a.reservePrice)}</td>
              <td style={{padding:"12px",borderBottom:"1px solid rgba(182,139,46,0.10)",fontSize:13,fontWeight:600,color:"#b68b2e",textAlign:"right"}}>R {fmt(a.currentBid)}</td>
              <td style={{padding:"12px",borderBottom:"1px solid rgba(182,139,46,0.10)",textAlign:"right"}}>{bids.filter(b=>b.auctionId===a.id).length}</td>
              <td style={{padding:"12px",borderBottom:"1px solid rgba(182,139,46,0.10)",textAlign:"right"}}><span style={{padding:"3px 10px",borderRadius:6,fontSize:11,fontWeight:600,background:sc.bg,color:sc.c}}>{a.status}</span></td>
              <td style={{padding:"12px",borderBottom:"1px solid rgba(182,139,46,0.10)",textAlign:"right"}}><button onClick={()=>generateAuctionReport(a,winner,renter,bids)} style={{background:"none",border:"1px solid rgba(182,139,46,0.3)",borderRadius:6,color:"#b68b2e",cursor:"pointer",padding:"4px 10px",fontSize:11,fontFamily:"DM Sans,sans-serif"}}>Report</button></td>
            </tr>;
          })}</tbody>
        </table>
      </div></Card>}
    </div>}

    {/* Buyer approvals view */}
    {view==="buyers"&&<AucBuyerApproval buyers={buyers} actions={actions} fmt={fmt}/>}

    {/* Modals */}
    {createModal&&<AucCreateModal artworks={artworks} onSave={(d)=>{actions.createAuction(d);}} onClose={()=>setCreateModal(false)} fmt={fmt}/>}
    {bidModal&&<AucBidModal auction={bidModal} buyers={approvedBuyers} bids={bids.filter(b=>b.auctionId===bidModal.id)} onBid={(buyerId,buyerName,amount)=>{actions.placeBid(bidModal.id,buyerId,buyerName,amount);setBidModal(null);}} onClose={()=>setBidModal(null)} fmt={fmt}/>}
    {notifModal&&<AucNotifModal onSend={(t,b)=>{sendPushNotification(t,b);setNotifModal(false);}} onClose={()=>setNotifModal(false)}/>}
  </div>);
}

function AucLiveBanner({auction,bids,fmt,onClick}){
  const remaining=useCountdown(auction.endTime,auction.status);
  const urgent=remaining!==null&&remaining<300000;
  const count=bids.filter(b=>b.auctionId===auction.id).length;
  return<div onClick={onClick} style={{display:"flex",alignItems:"center",gap:16,padding:"14px 20px",background:urgent?"rgba(196,92,74,0.08)":"rgba(74,158,107,0.08)",border:`1px solid ${urgent?"rgba(196,92,74,0.3)":"rgba(74,158,107,0.25)"}`,borderRadius:10,cursor:"pointer",marginBottom:12,flexWrap:"wrap"}}>
    <div style={{width:8,height:8,borderRadius:"50%",background:urgent?"#c45c4a":"#4a9e6b",boxShadow:`0 0 0 3px ${urgent?"rgba(196,92,74,0.2)":"rgba(74,158,107,0.2)"}`,animation:"auc-pulse 1.5s infinite",flexShrink:0}}/>
    <div style={{flex:1,minWidth:180}}><div style={{fontSize:13,fontWeight:600,color:"#1a1714"}}>🔴 LIVE: {auction.title}</div><div style={{fontSize:11,color:"#6b635a",marginTop:2}}>{auction.galleryName} · {count} bid{count!==1?"s":""}</div></div>
    <div style={{textAlign:"center"}}><div style={{fontSize:9,letterSpacing:2,textTransform:"uppercase",color:"#8a8070"}}>Current Bid</div><div style={{fontFamily:"Cormorant Garamond,serif",fontSize:22,fontWeight:600,color:"#b68b2e"}}>R {fmt(auction.currentBid||0)}</div></div>
    <div style={{textAlign:"center"}}><div style={{fontSize:9,letterSpacing:2,textTransform:"uppercase",color:"#8a8070"}}>Time Left</div><div style={{fontFamily:"Cormorant Garamond,serif",fontSize:22,fontWeight:600,color:urgent?"#c45c4a":"#4a9e6b"}}>{formatCountdown(remaining)||"—"}</div></div>
    <span style={{fontSize:11,color:"#8a8070",marginLeft:"auto"}}>Manage →</span>
  </div>;
}

function AucCard({auction,bids,fmt,actions,onBid,artworks}){
  const remaining=useCountdown(auction.endTime,auction.status);
  const artImg=(artworks||[]).find(a=>a.id===auction.artworkId)?.imageUrl||null;
  const sc=auctionStatusColor[auction.status]||{bg:"#e8e4dd",c:"#6b635a"};
  const count=bids.filter(b=>b.auctionId===auction.id).length;
  const reserveMet=(auction.currentBid||0)>=(auction.reservePrice||0);
  return<div style={{background:"#f7f5f1",border:"1px solid rgba(182,139,46,0.20)",borderRadius:14,overflow:"hidden"}}>
    <div style={{height:3,background:sc.c}}/>
    <div style={{padding:18}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
        <div style={{flex:1,minWidth:0}}><div style={{display:"flex",gap:10,alignItems:"flex-start"}}>{artImg&&<div style={{width:48,height:48,borderRadius:6,overflow:"hidden",flexShrink:0,border:"1px solid rgba(182,139,46,0.20)"}}><img src={artImg} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/></div>}<div style={{flex:1}}><div style={{fontFamily:"Cormorant Garamond,serif",fontSize:17,color:"#1a1714"}}>{auction.title}</div><div style={{fontSize:11,color:"#8a8070",marginTop:2}}>{auction.artist} · {auction.galleryName}</div></div></div></div>
        <span style={{padding:"3px 10px",borderRadius:6,fontSize:11,fontWeight:600,background:sc.bg,color:sc.c,flexShrink:0}}>{auction.status}</span>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
        <div style={{background:"#e8e4dd",borderRadius:8,padding:"8px 12px"}}><div style={{fontSize:9,letterSpacing:2,textTransform:"uppercase",color:"#8a8070",marginBottom:2}}>Current Bid</div><div style={{fontFamily:"Cormorant Garamond,serif",fontSize:18,fontWeight:600,color:"#b68b2e"}}>R {fmt(auction.currentBid||0)}</div></div>
        <div style={{background:"#e8e4dd",borderRadius:8,padding:"8px 12px"}}><div style={{fontSize:9,letterSpacing:2,textTransform:"uppercase",color:"#8a8070",marginBottom:2}}>Reserve</div><div style={{fontFamily:"Cormorant Garamond,serif",fontSize:18,fontWeight:600,color:reserveMet?"#4a9e6b":"#c45c4a"}}>R {fmt(auction.reservePrice||0)}</div></div>
      </div>
      {auction.status==="Live"&&remaining!==null&&<div style={{textAlign:"center",padding:"6px",background:"rgba(182,139,46,0.08)",borderRadius:8,marginBottom:10,fontFamily:"Cormorant Garamond,serif",fontSize:20,color:remaining<300000?"#c45c4a":"#1a1714"}}>{formatCountdown(remaining)}</div>}
      <div style={{fontSize:11,color:"#6b635a",marginBottom:12}}>{count} bid{count!==1?"s":""} · {auction.incrementLabel}</div>
      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
        {auction.status==="Draft"&&<Btn small gold onClick={()=>actions.launchAuction(auction.id)}>🚀 Launch</Btn>}
        {auction.status==="Live"&&<><Btn small gold onClick={onBid}>Place Bid</Btn><Btn small ghost onClick={()=>actions.freezeAuction(auction.id)} style={{borderColor:"rgba(100,140,200,0.4)",color:"#648cc8"}}>⏸ Freeze</Btn><Btn small danger onClick={()=>{if(confirm("Close auction?"))actions.closeAuction(auction.id);}}>Close</Btn></>}
        {auction.status==="Frozen"&&<><Btn small gold onClick={()=>actions.resumeAuction(auction.id)}>▶ Resume</Btn><Btn small danger onClick={()=>{if(confirm("Close auction?"))actions.closeAuction(auction.id);}}>Close</Btn></>}
      </div>
    </div>
  </div>;
}

function AucManageRow({auction,bids,buyers,collectors,schedules,fmt,actions,onBid,onReport}){
  const [expanded,setExpanded]=useState(true);
  const remaining=useCountdown(auction.endTime,auction.status);
  const auctionBids=bids.filter(b=>b.auctionId===auction.id).sort((a,b)=>new Date(b.timestamp)-new Date(a.timestamp));
  const sc=auctionStatusColor[auction.status]||{bg:"#e8e4dd",c:"#6b635a"};
  const reserveMet=(auction.currentBid||0)>=(auction.reservePrice||0);
  const winner=buyers.find(b=>b.id===auction.leadBidderId);
  const bn=b=>b.type==="company"?b.companyName:`${b.firstName} ${b.lastName}`;
  return<div style={{background:"#f7f5f1",border:"1px solid rgba(182,139,46,0.20)",borderRadius:14,overflow:"hidden"}}>
    <div style={{height:4,background:sc.c}}/>
    <div style={{padding:20}}>
      <div style={{display:"flex",gap:16,alignItems:"flex-start",flexWrap:"wrap"}}>
        <div style={{flex:1,minWidth:200}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:4,flexWrap:"wrap"}}>
            <span style={{fontFamily:"Cormorant Garamond,serif",fontSize:20,color:"#1a1714"}}>{auction.title}</span>
            <span style={{padding:"3px 10px",borderRadius:6,fontSize:11,fontWeight:600,background:sc.bg,color:sc.c}}>{auction.status}</span>
          </div>
          <div style={{fontSize:12,color:"#6b635a"}}>{auction.artist} · {auction.galleryName}</div>
          <div style={{display:"flex",gap:16,fontSize:12,marginTop:8,flexWrap:"wrap"}}>
            <span>Reserve: <strong style={{color:reserveMet?"#4a9e6b":"#c45c4a"}}>R {fmt(auction.reservePrice||0)}</strong></span>
            <span>Current: <strong style={{color:"#b68b2e"}}>R {fmt(auction.currentBid||0)}</strong></span>
            <span>{auctionBids.length} bid{auctionBids.length!==1?"s":""}</span>
            {remaining!==null&&<span style={{color:remaining<300000?"#c45c4a":"#4a9e6b",fontWeight:600}}>⏱ {formatCountdown(remaining)}</span>}
          </div>
          {winner&&<div style={{marginTop:6,fontSize:12,color:"#4a9e6b"}}>🏆 Lead: <strong>{bn(winner)}</strong></div>}
        </div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          {auction.status==="Draft"&&<Btn small gold onClick={()=>actions.launchAuction(auction.id)}>🚀 Launch</Btn>}
          {auction.status==="Live"&&<><Btn small gold onClick={onBid}>Place Bid</Btn><Btn small ghost onClick={()=>actions.freezeAuction(auction.id)} style={{borderColor:"rgba(100,140,200,0.4)",color:"#648cc8"}}>⏸ Freeze</Btn><Btn small danger onClick={()=>{if(confirm("Close?"))actions.closeAuction(auction.id);}}>Close</Btn></>}
          {auction.status==="Frozen"&&<><Btn small gold onClick={()=>actions.resumeAuction(auction.id)}>▶ Resume</Btn><Btn small danger onClick={()=>{if(confirm("Close?"))actions.closeAuction(auction.id);}}>Close</Btn></>}
          <Btn small ghost onClick={onReport}>📄 Report</Btn>
          <button onClick={()=>setExpanded(p=>!p)} style={{background:"none",border:"1px solid rgba(182,139,46,0.3)",borderRadius:6,color:"#6b635a",cursor:"pointer",padding:"6px 12px",fontSize:11}}>{expanded?"▲":"▼"} {auctionBids.length}</button>
        </div>
      </div>
      {expanded&&<div style={{marginTop:16,borderTop:"1px solid rgba(182,139,46,0.12)",paddingTop:16}}>
        {auctionBids.length===0?<p style={{fontSize:13,color:"#8a8070"}}>No bids yet.</p>:<Tbl cols={[{label:"#",render:(r,i)=>auctionBids.length-auctionBids.indexOf(r)},{label:"Bidder",render:r=>r.buyerName},{label:"Amount",right:true,gold:true,render:r=>"R "+fmt(r.amount)},{label:"Time",right:true,render:r=>r.timestamp.slice(0,16).replace("T"," ")},{label:"Status",right:true,render:(r,i)=>auctionBids[0]===r?<span style={{fontSize:11,fontWeight:600,color:"#4a9e6b"}}>LEAD</span>:<span style={{fontSize:11,color:"#8a8070"}}>Outbid</span>}]} data={auctionBids}/>}
      </div>}
    </div>
  </div>;
}

function AucBuyerApproval({buyers,actions,fmt}){
  const pending=buyers.filter(b=>b.auctionRequested&&!b.auctionApproved);
  const approved=buyers.filter(b=>b.auctionApproved);
  const unapproved=buyers.filter(b=>!b.auctionApproved&&!b.auctionRequested);
  const bn=b=>b.type==="company"?b.companyName:`${b.firstName} ${b.lastName}`;
  const [sel,setSel]=useState("");
  return<div>
    <div style={{marginBottom:16,padding:"12px 16px",background:"rgba(182,139,46,0.06)",border:"1px solid rgba(182,139,46,0.15)",borderRadius:10,fontSize:13,color:"#6b635a"}}>Only KYC-verified, approved buyers may place bids. Review ID, email, and nationality before approving.</div>
    {pending.length>0&&<div style={{marginBottom:24}}>
      <div style={{fontSize:11,letterSpacing:2,textTransform:"uppercase",color:"#dc7828",marginBottom:14}}>Pending Approval ({pending.length})</div>
      {pending.map(b=><div key={b.id} style={{display:"flex",alignItems:"center",gap:16,padding:"14px 18px",background:"rgba(220,120,40,0.06)",border:"1px solid rgba(220,120,40,0.2)",borderRadius:10,marginBottom:10,flexWrap:"wrap"}}>
        <div style={{flex:1,minWidth:200}}>
          <div style={{fontSize:14,fontWeight:600,color:"#1a1714"}}>{bn(b)}</div>
          <div style={{fontSize:12,color:"#6b635a",marginTop:2}}>{b.email} · ID: {b.idNumber||"—"} · {b.nationality||"—"}</div>
          <div style={{fontSize:11,color:"#dc7828",marginTop:4}}>Requested: {b.auctionRequestedAt||"—"} · {b.idNumber?"✓ ID on file":"⚠ No ID"}</div>
        </div>
        <div style={{display:"flex",gap:8}}>
          <Btn small gold onClick={()=>actions.approveForAuction(b.id)}>✓ Approve</Btn>
          <Btn small danger onClick={()=>actions.revokeAuctionApproval(b.id)}>Decline</Btn>
        </div>
      </div>)}
    </div>}
    <div style={{marginBottom:24}}>
      <div style={{fontSize:11,letterSpacing:2,textTransform:"uppercase",color:"#4a9e6b",marginBottom:14}}>Approved ({approved.length})</div>
      {approved.length===0?<p style={{fontSize:13,color:"#8a8070"}}>No approved buyers yet.</p>:<Tbl cols={[{label:"Name",bold:true,render:r=>bn(r)},{label:"Email",key:"email"},{label:"ID",key:"idNumber"},{label:"Nationality",key:"nationality"},{label:"Approved",render:r=><span style={{fontSize:11,fontWeight:600,color:"#4a9e6b"}}>✓ {r.auctionApprovedAt||""}</span>},{label:"",render:r=><button onClick={()=>actions.revokeAuctionApproval(r.id)} style={{background:"none",border:"1px solid rgba(196,92,74,0.3)",borderRadius:6,color:"#c45c4a",cursor:"pointer",padding:"4px 10px",fontSize:11,fontFamily:"DM Sans,sans-serif"}}>Revoke</button>}]} data={approved}/>}
    </div>
    <div>
      <div style={{fontSize:11,letterSpacing:2,textTransform:"uppercase",color:"#8a8070",marginBottom:10}}>Mark Buyer as Requesting Access</div>
      <div style={{display:"flex",gap:10}}>
        <select value={sel} onChange={e=>setSel(e.target.value)} style={{...ss,flex:1}}>
          <option value="">— Select buyer</option>
          {unapproved.map(b=><option key={b.id} value={b.id}>{bn(b)}</option>)}
        </select>
        <Btn ghost disabled={!sel} onClick={()=>{if(sel){actions.updateBuyerAuctionRequest(sel);setSel("");}}} style={{flexShrink:0}}>Mark Requesting</Btn>
      </div>
    </div>
  </div>;
}

function AucCreateModal({artworks,onSave,onClose,fmt}){
  // Shared settings
  const [startTime,setStartTime]=useState("");
  const [endTime,setEndTime]=useState("");
  const [incType,setIncType]=useState("pct");
  const [incValue,setIncValue]=useState(0.025);
  const [incLabel,setIncLabel]=useState("2.5%");
  const [note,setNote]=useState("");
  const [reserveMode,setReserveMode]=useState("auto"); // auto = 100% of value, custom = per lot
  const [search,setSearch]=useState("");
  // Selected lots: {artworkId, overrideReserve}
  const [lots,setLots]=useState([]);

  const available=artworks.filter(a=>["Available","Reserved","In Gallery"].includes(a.status));
  const filtered=available.filter(a=>(a.title+a.artist+a.galleryName).toLowerCase().includes(search.toLowerCase()));
  const selectedIds=new Set(lots.map(l=>l.artworkId));

  const toggleArt=(art)=>{
    if(selectedIds.has(art.id)){
      setLots(p=>p.filter(l=>l.artworkId!==art.id));
    } else {
      if(lots.length>=100)return alert("Maximum 100 artworks per auction.");
      setLots(p=>[...p,{artworkId:art.id,overrideReserve:null}]);
    }
  };
  const selectAll=()=>{
    const toAdd=filtered.filter(a=>!selectedIds.has(a.id)).slice(0,100-lots.length);
    setLots(p=>[...p,...toAdd.map(a=>({artworkId:a.id,overrideReserve:null}))]);
  };
  const clearAll=()=>setLots([]);
  const setOverride=(artworkId,val)=>{const rv=val===""?null:Number(val);setLots(p=>p.map(l=>l.artworkId===artworkId?{...l,overrideReserve:rv}:l));};
  const endMin=()=>{const d=new Date();d.setMinutes(d.getMinutes()+30);return d.toISOString().slice(0,16);};

  const handleCreate=()=>{
    if(lots.length===0)return alert("Select at least one artwork.");
    if(!endTime)return alert("Set an auction end date and time.");
    if(!incLabel)return alert("Select a bid increment.");
    // Create one auction record per lot
    lots.forEach(lot=>{
      const art=artworks.find(a=>a.id===lot.artworkId);
      if(!art)return;
      const reserve=lot.overrideReserve!==null?lot.overrideReserve:art.recommendedPrice||0;
      onSave({
        title:art.title,
        artist:art.artist||"",
        artworkId:art.id,
        artworkValue:art.recommendedPrice||0,
        reservePrice:reserve,
        galleryName:art.galleryName||"",
        incrementType:incType,
        incrementValue:incValue,
        incrementLabel:incLabel,
        startTime:startTime||null,
        endTime,
        startNote:note,
      });
    });
    onClose();
  };

  return<Modal title={"Create Auction — "+lots.length+" lot"+(lots.length!==1?"s":"")} onClose={onClose} wide>
    {/* Shared settings row */}
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:16}}>
      <Field label="Start Date & Time (optional)">
        <input type="datetime-local" value={startTime} min={endMin()} onChange={e=>setStartTime(e.target.value)} style={is}/>
        <div style={{fontSize:10,color:"#8a8070",marginTop:4}}>Leave blank to launch manually</div>
      </Field>
      <Field label="End Date & Time">
        <input type="datetime-local" value={endTime} min={endMin()} onChange={e=>setEndTime(e.target.value)} style={is}/>
      </Field>
    </div>
    <Field label="Bid Increment (applies to all lots)">
      <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:8,marginBottom:8}}>
        {BID_INCREMENTS.map(inc=><button key={inc.label} onClick={()=>{setIncType(inc.type);setIncValue(inc.value);setIncLabel(inc.label);}} style={{padding:"10px 6px",borderRadius:8,border:incLabel===inc.label?"2px solid #b68b2e":"1px solid rgba(182,139,46,0.25)",background:incLabel===inc.label?"rgba(182,139,46,0.18)":"#e8e4dd",color:incLabel===inc.label?"#b68b2e":"#6b635a",cursor:"pointer",fontFamily:"DM Sans,sans-serif",fontSize:12,fontWeight:incLabel===inc.label?600:400}}>{inc.label}</button>)}
      </div>
    </Field>
    <div style={{display:"flex",gap:8,marginBottom:12}}>
      {[["auto","Reserve = 100% of value"],["custom","Set reserve per lot"]].map(([id,lbl])=>(
        <button key={id} onClick={()=>setReserveMode(id)} style={{flex:1,padding:"9px 12px",borderRadius:8,border:reserveMode===id?"2px solid #b68b2e":"1px solid rgba(182,139,46,0.25)",background:reserveMode===id?"rgba(182,139,46,0.18)":"#e8e4dd",color:reserveMode===id?"#b68b2e":"#6b635a",cursor:"pointer",fontFamily:"DM Sans,sans-serif",fontSize:12,fontWeight:reserveMode===id?600:400,textAlign:"left"}}>{lbl}</button>
      ))}
    </div>

    {/* Artwork selector */}
    <div style={{borderTop:"1px solid rgba(182,139,46,0.15)",paddingTop:14,marginBottom:8}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
        <div style={{fontSize:11,letterSpacing:2,textTransform:"uppercase",color:"#8a8070"}}>
          Select Artworks — {lots.length} selected (max 100)
        </div>
        <div style={{display:"flex",gap:8}}>
          <button onClick={selectAll} style={{background:"none",border:"none",color:"#b68b2e",cursor:"pointer",fontSize:12,fontFamily:"DM Sans,sans-serif",textDecoration:"underline"}}>Select all visible</button>
          <button onClick={clearAll} style={{background:"none",border:"none",color:"#8a8070",cursor:"pointer",fontSize:12,fontFamily:"DM Sans,sans-serif",textDecoration:"underline"}}>Clear all</button>
        </div>
      </div>
      <input placeholder="Search artworks..." value={search} onChange={e=>setSearch(e.target.value)} style={{...is,marginBottom:10}}/>
      <div style={{maxHeight:320,overflowY:"auto",border:"1px solid rgba(182,139,46,0.15)",borderRadius:10}}>
        {filtered.length===0?<div style={{padding:20,textAlign:"center",color:"#8a8070",fontSize:13}}>No artworks available</div>:
        filtered.map((art,i)=>{
          const selected=selectedIds.has(art.id);
          const lot=lots.find(l=>l.artworkId===art.id);
          return(
            <div key={art.id} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 14px",background:selected?"rgba(182,139,46,0.06)":"transparent",borderBottom:i<filtered.length-1?"1px solid rgba(182,139,46,0.08)":"none",cursor:"pointer"}} onClick={()=>toggleArt(art)}>
              {/* Checkbox */}
              <div style={{width:18,height:18,borderRadius:4,border:selected?"2px solid #b68b2e":"2px solid rgba(182,139,46,0.30)",background:selected?"#b68b2e":"transparent",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
                {selected&&<svg width="10" height="10" viewBox="0 0 12 12" fill="none"><polyline points="2,6 5,9 10,3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
              </div>
              {/* Thumbnail */}
              {art.imageUrl&&<div style={{width:36,height:36,borderRadius:6,overflow:"hidden",flexShrink:0}}><img src={art.imageUrl} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/></div>}
              {/* Info */}
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:13,fontWeight:500,color:"#1a1714",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{art.title}</div>
                <div style={{fontSize:11,color:"#8a8070"}}>{art.artist||"—"} · R {fmt(art.recommendedPrice)} · {art.galleryName||"No gallery"}</div>
              </div>
              {/* Reserve override if custom mode */}
              {selected&&reserveMode==="custom"&&(
                <div onClick={e=>e.stopPropagation()} style={{flexShrink:0}}>
                  <input
                    type="number"
                    value={lot.overrideReserve===null?"":lot.overrideReserve}
                    onChange={e=>setOverride(art.id,e.target.value)}
                    placeholder={"R "+fmt(art.recommendedPrice)}
                    style={{...is,width:120,padding:"6px 10px",fontSize:12}}
                  />
                </div>
              )}
              {/* Auto reserve display */}
              {selected&&reserveMode==="auto"&&(
                <div style={{flexShrink:0,fontSize:12,color:"#b68b2e",fontWeight:600}}>Reserve: R {fmt(art.recommendedPrice)}</div>
              )}
            </div>
          );
        })}
      </div>
    </div>

    {/* Selected lots summary */}
    {lots.length>0&&(
      <div style={{padding:"10px 14px",background:"rgba(74,158,107,0.06)",border:"1px solid rgba(74,158,107,0.2)",borderRadius:8,marginBottom:12,fontSize:12,color:"#4a9e6b"}}>
        ✓ {lots.length} lot{lots.length!==1?"s":""} will be created as separate auction listings, all with the same end time and bid increment.
      </div>
    )}

    <Field label="Notes (optional)">
      <textarea value={note} onChange={e=>setNote(e.target.value)} style={{...is,minHeight:50,resize:"vertical"}} placeholder="Internal notes for this auction session..."/>
    </Field>
    <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:8}}>
      <Btn ghost onClick={onClose}>Cancel</Btn>
      <Btn gold onClick={handleCreate}>Create {lots.length>0?lots.length+" Lot"+(lots.length!==1?"s":""):"Auction"}</Btn>
    </div>
  </Modal>;
}

function AucBidModal({auction,buyers,bids,onBid,onClose,fmt}){
  const [buyerId,setBuyerId]=useState("");
  const initBid=String(auction.currentBid>0?calcMinBid(auction.currentBid,BID_INCREMENTS.find(b=>b.label===auction.incrementLabel)||BID_INCREMENTS[2]):(auction.reservePrice||0));  // First bid = reserve price
  const [customAmount,setCustomAmount]=useState(initBid);
  const bn=b=>b.type==="company"?b.companyName:`${b.firstName} ${b.lastName}`;
  const minBid=auction.currentBid>0?calcMinBid(auction.currentBid,{type:auction.incrementType,value:auction.incrementValue}):(auction.reservePrice||0);
  const amount=Number(customAmount)||minBid;
  const buyer=buyers.find(b=>b.id===buyerId);
  const reserveMet=amount>=(auction.reservePrice||0);
  return<Modal title="Place Bid" onClose={onClose}>
    <Card style={{background:"#e8e4dd",marginBottom:16}}>
      <div style={{fontFamily:"Cormorant Garamond,serif",fontSize:17,color:"#1a1714",marginBottom:8}}>{auction.title}</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,fontSize:13}}>
        <span style={{color:"#6b635a"}}>Current bid:</span><span style={{fontWeight:600,color:"#b68b2e"}}>R {fmt(auction.currentBid||0)}</span>
        <span style={{color:"#6b635a"}}>Reserve:</span><span style={{color:"#c45c4a"}}>R {fmt(auction.reservePrice||0)}</span>
        <span style={{color:"#6b635a"}}>Min next bid:</span><span style={{fontWeight:600}}>R {fmt(minBid)}</span>
        <span style={{color:"#6b635a"}}>Increment:</span><span>{auction.incrementLabel}</span>
      </div>
    </Card>
    <Field label="Bidder (KYC Approved)">
      <select value={buyerId} onChange={e=>setBuyerId(e.target.value)} style={ss}><option value="">— Select approved buyer</option>{buyers.map(b=><option key={b.id} value={b.id}>{bn(b)} · {b.email||""}</option>)}</select>
      {buyers.length===0&&<div style={{fontSize:11,color:"#c45c4a",marginTop:6}}>⚠ No approved buyers. Go to Buyer Approvals tab first.</div>}
    </Field>
    <Field label="Bid Amount (R)">
      <input type="number" value={customAmount} onChange={e=>setCustomAmount(e.target.value)} placeholder={`Min R ${fmt(minBid)}`} style={{...is,border:`1px solid ${customAmount&&amount<minBid?"rgba(196,92,74,0.40)":"rgba(182,139,46,0.20)"}`}}/>
      {customAmount&&amount<minBid&&<div style={{fontSize:11,color:"#c45c4a",marginTop:6}}>⚠ Must be at least R {fmt(minBid)}</div>}
      {customAmount&&amount>=minBid&&<div style={{fontSize:11,marginTop:6,color:reserveMet?"#4a9e6b":"#c45c4a"}}>{reserveMet?"✓ Reserve met — qualifies for sale":`⚠ Below reserve (R ${fmt(auction.reservePrice)}) — will be recorded but artwork won't sell`}</div>}
    </Field>
    <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:16}}>
      <Btn ghost onClick={onClose}>Cancel</Btn>
      <Btn gold disabled={!buyerId||amount<minBid} onClick={()=>{if(!buyerId||amount<minBid)return;onBid(buyerId,bn(buyer),amount);}}>Confirm — R {fmt(amount)}</Btn>
    </div>
  </Modal>;
}

function AucNotifModal({onSend,onClose}){
  const [title,setTitle]=useState("Vollard Black Auction");
  const [body,setBody]=useState("");
  const [tmpl,setTmpl]=useState("");
  const templates=[
    {label:"Going Live",title:"🔴 Auction Now Live — Vollard Black",body:"A new auction is now live. Place your bid before time runs out."},
    {label:"Ending Soon",title:"⏱ Auction Ending Soon — Vollard Black",body:"This auction closes in under 30 minutes. Place your bid now."},
    {label:"Reserve Met",title:"✓ Reserve Met — Vollard Black",body:"The reserve price has been met. Current leading bid qualifies for sale."},
    {label:"New Artwork",title:"◆ New Artwork Listed — Vollard Black",body:"A new artwork has been listed. Register your interest to participate."},
    {label:"Auction Closed",title:"Auction Closed — Vollard Black",body:"The auction has closed. Settlement report is being prepared."},
  ];
  return<Modal title="🔔 Push Notification" onClose={onClose}>
    <div style={{fontSize:12,color:"#6b635a",marginBottom:14,padding:"10px 14px",background:"rgba(182,139,46,0.06)",borderRadius:8}}>Sends a browser push notification to anyone currently using the platform.</div>
    <div style={{marginBottom:14}}>
      <label style={{display:"block",fontSize:10,fontWeight:500,letterSpacing:2,textTransform:"uppercase",color:"#6b635a",marginBottom:8}}>Quick Templates</label>
      <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
        {templates.map(t=><button key={t.label} onClick={()=>{setTitle(t.title);setBody(t.body);setTmpl(t.label);}} style={{padding:"6px 12px",borderRadius:6,border:`1px solid ${tmpl===t.label?"#b68b2e":"rgba(182,139,46,0.25)"}`,background:tmpl===t.label?"rgba(182,139,46,0.18)":"transparent",color:tmpl===t.label?"#b68b2e":"#6b635a",fontSize:11,cursor:"pointer",fontFamily:"DM Sans,sans-serif"}}>{t.label}</button>)}
      </div>
    </div>
    <Field label="Title"><input value={title} onChange={e=>setTitle(e.target.value)} style={is}/></Field>
    <Field label="Message"><textarea value={body} onChange={e=>setBody(e.target.value)} style={{...is,minHeight:80,resize:"vertical"}} placeholder="Notification message..."/></Field>
    <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:16}}>
      <Btn ghost onClick={onClose}>Cancel</Btn>
      <Btn gold disabled={!title||!body} onClick={()=>onSend(title,body)}>🔔 Send</Btn>
    </div>
  </Modal>;
}


// ═══════════════════════════════════════════
// CATALOGUE
// ═══════════════════════════════════════════
function Catalogue({data,up,actions}){
  const [modal,setModal]=useState(null);
  const [search,setSearch]=useState("");
  const [delModal,setDelModal]=useState(null);
  const [expanded,setExpanded]=useState({});
  const [hoveredArt,setHoveredArt]=useState(null);
  const [lightbox,setLightbox]=useState(null);
  const blank={id:"",title:"",artist:"",artistId:"",medium:"",dimensions:"",year:"",recommendedPrice:"",imageUrl:"",status:"Available",description:"",galleryName:"",insuranceMonthly:""};
  const save=(a)=>{if(a.id)up("artworks",p=>p.map(x=>x.id===a.id?a:x));else up("artworks",p=>[{...a,id:uuidv4(),createdAt:td()},...p]);setModal(null);};
  const f=data.artworks.filter(a=>(a.title+a.artist+a.status).toLowerCase().includes(search.toLowerCase()));
  const handleDelete=(art)=>{const has=(data.schedules||[]).some(s=>s.artworkId===art.id)||(data.sales||[]).some(s=>s.artworkId===art.id);if(has)setDelModal(art);else{if(confirm("Delete this artwork?"))up("artworks",p=>p.filter(a=>a.id!==art.id));}};
  const groups={};f.forEach(a=>{const key=a.artist||"Unknown Artist";if(!groups[key])groups[key]=[];groups[key].push(a);});
  const artistNames=Object.keys(groups).sort();
  const isOpen=(name)=>expanded[name]!==false;
  const toggle=(name)=>setExpanded(p=>({...p,[name]:!isOpen(name)}));
  const statusDot={Available:"#4a9e6b",Reserved:"#b68b2e","In Gallery":"#648cc8",Sold:"#c45c4a","In Dispute":"#c45c4a"};
  return(<div>
    <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}@keyframes scaleIn{from{opacity:0;transform:scale(0.96)}to{opacity:1;transform:scale(1)}}.art-card{transition:transform 0.4s cubic-bezier(0.16,1,0.3,1),box-shadow 0.4s ease;}.art-card:hover{transform:translateY(-6px) scale(1.01);box-shadow:0 24px 48px rgba(0,0,0,0.12)!important;}.art-card:hover .art-overlay{opacity:1!important;}.art-card:hover .art-img{transform:scale(1.04);}.art-img{transition:transform 0.6s cubic-bezier(0.16,1,0.3,1);}.art-overlay{opacity:0;transition:opacity 0.3s ease;}.artist-row{transition:background 0.2s ease;}.artist-row:hover{background:rgba(182,139,46,0.04)!important;}.artist-row:hover .artist-name{color:#b68b2e!important;}.lb-close:hover{opacity:0.7;}`}</style>
    {lightbox&&<div onClick={()=>setLightbox(null)} style={{position:"fixed",inset:0,background:"rgba(15,12,8,0.96)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:40,cursor:"zoom-out"}}>
      <button className="lb-close" onClick={()=>setLightbox(null)} style={{position:"absolute",top:24,right:28,background:"none",border:"none",color:"rgba(255,255,255,0.7)",fontSize:32,cursor:"pointer",lineHeight:1,fontWeight:300}}>×</button>
      <div onClick={e=>e.stopPropagation()} style={{display:"flex",gap:48,alignItems:"center",maxWidth:1100,width:"100%",animation:"scaleIn 0.35s cubic-bezier(0.16,1,0.3,1)"}}>
        <div style={{flex:"0 0 auto",maxWidth:520}}>{lightbox.imageUrl?<img src={lightbox.imageUrl} alt={lightbox.title} style={{width:"100%",maxHeight:"75vh",objectFit:"contain",display:"block"}}/>:<div style={{width:420,height:420,background:"rgba(182,139,46,0.08)",display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:64,color:"rgba(182,139,46,0.3)"}}>◆</span></div>}</div>
        <div style={{flex:1,color:"#f5f0e8"}}>
          <div style={{fontSize:11,letterSpacing:4,textTransform:"uppercase",color:"#b68b2e",marginBottom:16}}>{lightbox.artist}</div>
          <div style={{fontFamily:"Cormorant Garamond,serif",fontSize:38,fontWeight:300,lineHeight:1.15,color:"#f5f0e8",marginBottom:8}}>{lightbox.title}</div>
          {lightbox.year&&<div style={{fontSize:13,color:"rgba(245,240,232,0.5)",marginBottom:28}}>{lightbox.year}{lightbox.medium?` · ${lightbox.medium}`:""}{lightbox.dimensions?` · ${lightbox.dimensions}`:""}</div>}
          <div style={{height:1,background:"rgba(182,139,46,0.2)",marginBottom:28}}/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,marginBottom:28}}>{[["Price",`R ${fmt(lightbox.recommendedPrice)}`],["Status",lightbox.status],["Gallery",lightbox.galleryName||"—"],["Premier (40%)",`R ${fmt(lightbox.recommendedPrice*0.40)}`],["Select (50%)",`R ${fmt(lightbox.recommendedPrice*0.50)}`]].map(([l,v])=><div key={l}><div style={{fontSize:10,letterSpacing:2,textTransform:"uppercase",color:"rgba(245,240,232,0.35)",marginBottom:4}}>{l}</div><div style={{fontSize:15,color:"#f5f0e8",fontWeight:500}}>{v}</div></div>)}</div>
          <div style={{display:"flex",gap:10}}><button onClick={()=>{setLightbox(null);setModal(lightbox);}} style={{padding:"10px 20px",background:"rgba(182,139,46,0.15)",border:"1px solid rgba(182,139,46,0.4)",borderRadius:8,color:"#b68b2e",fontSize:12,fontWeight:600,letterSpacing:1,textTransform:"uppercase",cursor:"pointer",fontFamily:"DM Sans,sans-serif"}}>Edit Artwork</button><button onClick={()=>setLightbox(null)} style={{padding:"10px 20px",background:"transparent",border:"1px solid rgba(245,240,232,0.15)",borderRadius:8,color:"rgba(245,240,232,0.5)",fontSize:12,letterSpacing:1,textTransform:"uppercase",cursor:"pointer",fontFamily:"DM Sans,sans-serif"}}>Close</button></div>
        </div>
      </div>
    </div>}
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:32,paddingBottom:20,borderBottom:"1px solid rgba(182,139,46,0.15)"}}>
      <div><div style={{fontSize:10,letterSpacing:4,textTransform:"uppercase",color:"#b68b2e",marginBottom:6}}>Vollard Black</div><h1 style={{fontFamily:"Cormorant Garamond,serif",fontSize:36,fontWeight:300,color:"#1a1714",margin:0,letterSpacing:1}}>Art Catalogue</h1><div style={{fontSize:12,color:"#8a8070",marginTop:4}}>{data.artworks.length} works · {artistNames.length} artists</div></div>
      {(data.artworks||[]).filter(a=>a.status==="Pending Approval").length>0&&(
        <div style={{padding:"12px 16px",background:"rgba(230,190,50,0.08)",border:"1px solid rgba(230,190,50,0.25)",borderRadius:10,marginBottom:14}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
            <span style={{color:"#e6be32",fontSize:16}}>⚠</span>
            <span style={{fontSize:13,color:"#8a6a1e",fontWeight:600}}>{(data.artworks||[]).filter(a=>a.status==="Pending Approval").length} artwork{(data.artworks||[]).filter(a=>a.status==="Pending Approval").length>1?"s":""} submitted by artists — approve to list in gallery</span>
          </div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            {(data.artworks||[]).filter(a=>a.status==="Pending Approval").map(a=>(
              <button key={a.id} onClick={()=>up("artworks",p=>p.map(x=>x.id===a.id?{...x,status:"Available"}:x))} style={{padding:"6px 14px",borderRadius:6,border:"none",background:"linear-gradient(135deg,#b68b2e,#8a6a1e)",color:"#fff",cursor:"pointer",fontSize:11,fontWeight:600,fontFamily:"DM Sans,sans-serif"}}>✓ Approve "{a.title}"</button>
            ))}
          </div>
        </div>
      )}
      <div style={{display:"flex",gap:10,alignItems:"center"}}><div style={{position:"relative"}}><input placeholder="Search artworks…" value={search} onChange={e=>setSearch(e.target.value)} style={{...is,width:240,paddingLeft:36,background:"#ffffff",border:"1px solid rgba(182,139,46,0.2)"}}/><span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",color:"#8a8070",fontSize:14,pointerEvents:"none"}}>⌕</span></div><Btn gold onClick={()=>setModal("add")}>{I.plus} Add Artwork</Btn></div>
    </div>
    {(()=>{const pending=data.artworks.filter(a=>a.approvalStatus==="pending");return pending.length>0&&<div style={{padding:"12px 16px",background:"rgba(182,139,46,0.08)",border:"1px solid rgba(182,139,46,0.25)",borderRadius:10,marginBottom:16}}>
      <div style={{fontSize:13,fontWeight:600,color:"#b68b2e",marginBottom:10}}>◆ {pending.length} artwork{pending.length>1?"s":""} submitted by artists — awaiting your approval</div>
      {pending.map(a=><div key={a.id} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:"1px solid rgba(182,139,46,0.12)",flexWrap:"wrap"}}>
        {a.imageUrl&&<div style={{width:40,height:40,borderRadius:6,overflow:"hidden",flexShrink:0}}><img src={a.imageUrl} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/></div>}
        <div style={{flex:1,minWidth:150}}><div style={{fontWeight:600,fontSize:13}}>{a.title}</div><div style={{fontSize:11,color:"#8a8070"}}>by {a.artist||a.submittedBy||"—"} · R {fmt(a.recommendedPrice)}</div></div>
        <div style={{display:"flex",gap:6}}>
          <button onClick={()=>{up("artworks",p=>p.map(x=>x.id===a.id?{...x,approvalStatus:"approved"}:x));db.update("artworks",a.id,{approval_status:"approved"});}} style={{padding:"6px 14px",borderRadius:6,border:"none",background:"linear-gradient(135deg,#b68b2e,#8a6a1e)",color:"#fff",cursor:"pointer",fontSize:11,fontWeight:600,fontFamily:"DM Sans,sans-serif"}}>✓ Approve</button>
          <button onClick={()=>{if(confirm("Reject and delete this artwork?"))up("artworks",p=>p.filter(x=>x.id!==a.id));}} style={{padding:"6px 14px",borderRadius:6,border:"1px solid rgba(196,92,74,0.3)",background:"transparent",color:"#c45c4a",cursor:"pointer",fontSize:11,fontFamily:"DM Sans,sans-serif"}}>✗ Reject</button>
        </div>
      </div>)}
    </div>})()}
    {f.length===0?<div style={{textAlign:"center",padding:"80px 20px"}}><div style={{fontFamily:"Cormorant Garamond,serif",fontSize:64,color:"rgba(182,139,46,0.15)",marginBottom:16}}>◆</div><p style={{color:"#8a8070",fontSize:15}}>No artworks yet.</p><div style={{marginTop:20}}><Btn gold onClick={()=>setModal("add")}>{I.plus} Add First Artwork</Btn></div></div>:<div>{artistNames.map((artistName,ai)=>{
      const artworks=groups[artistName];const artistProfile=data.artists?.find(a=>a.name===artistName);const totalVal=artworks.reduce((s,a)=>s+(a.recommendedPrice||0),0);const open=isOpen(artistName);const initials=artistName.split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase();
      return<div key={artistName} style={{marginBottom:8,animation:`fadeUp 0.5s ease ${ai*0.06}s both`}}>
        <button className="artist-row" onClick={()=>toggle(artistName)} style={{display:"flex",alignItems:"center",gap:20,width:"100%",padding:"18px 24px",background:"#ffffff",border:"1px solid rgba(182,139,46,0.2)",borderRadius:open?"14px 14px 0 0":"14px",cursor:"pointer",textAlign:"left",borderBottom:open?"1px solid rgba(182,139,46,0.08)":undefined}}>
          <div style={{width:52,height:52,borderRadius:12,flexShrink:0,overflow:"hidden",background:"linear-gradient(135deg,#f5f0e8,#ede8df)",display:"flex",alignItems:"center",justifyContent:"center",border:"1px solid rgba(182,139,46,0.2)"}}>{artistProfile?.profileImageUrl?<img src={artistProfile.profileImageUrl} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<span style={{fontFamily:"Cormorant Garamond,serif",fontSize:20,color:"#b68b2e",fontWeight:500,letterSpacing:1}}>{initials}</span>}</div>
          <div style={{flex:1,minWidth:0}}><div className="artist-name" style={{fontFamily:"Cormorant Garamond,serif",fontSize:22,fontWeight:400,color:"#1a1714",letterSpacing:0.5,transition:"color 0.2s"}}>{artistName}</div><div style={{fontSize:11,color:"#8a8070",marginTop:3,letterSpacing:0.5}}>{artworks.length} work{artworks.length!==1?"s":""} · R {fmt(totalVal)} total{artistProfile?.medium?` · ${artistProfile.medium}`:""}</div></div>
          <div style={{display:"flex",gap:6,flexShrink:0}}>{[["Available","#4a9e6b"],["Reserved","#b68b2e"],["Sold","#c45c4a"]].map(([st,col])=>{const count=artworks.filter(a=>a.status===st).length;return count>0?<span key={st} style={{fontSize:10,fontWeight:600,letterSpacing:1,textTransform:"uppercase",padding:"4px 10px",borderRadius:20,background:`${col}18`,color:col,border:`1px solid ${col}30`}}>{count} {st}</span>:null;})}</div>
          <span style={{color:"#b68b2e",opacity:0.6,transition:"transform 0.3s cubic-bezier(0.16,1,0.3,1)",transform:open?"rotate(180deg)":"rotate(0deg)",display:"inline-flex",flexShrink:0,marginLeft:8}}>{I.chevron}</span>
        </button>
        {open&&<div style={{background:"#faf8f5",border:"1px solid rgba(182,139,46,0.2)",borderTop:"none",borderRadius:"0 0 14px 14px",padding:24}}><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:16}}>{artworks.map((art,idx)=>(<div key={art.id} className="art-card" style={{borderRadius:12,overflow:"hidden",background:"#ffffff",border:"1px solid rgba(182,139,46,0.15)",cursor:"zoom-in",animation:`fadeUp 0.4s ease ${idx*0.05}s both`,boxShadow:"0 2px 8px rgba(0,0,0,0.04)"}} onClick={()=>setLightbox(art)} onMouseEnter={()=>setHoveredArt(art.id)} onMouseLeave={()=>setHoveredArt(null)}>
          <div style={{position:"relative",paddingBottom:"75%",overflow:"hidden",background:"linear-gradient(135deg,#f0ede8,#e8e4dd)"}}>{art.imageUrl?<img className="art-img" src={art.imageUrl} alt={art.title} style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover"}}/>:<div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontFamily:"Cormorant Garamond,serif",fontSize:40,color:"rgba(182,139,46,0.2)"}}>◆</span></div>}
          <div className="art-overlay" style={{position:"absolute",inset:0,background:"linear-gradient(to top,rgba(15,12,8,0.85) 0%,rgba(15,12,8,0.2) 50%,transparent 100%)",display:"flex",flexDirection:"column",justifyContent:"flex-end",padding:14}}><div style={{fontSize:9,letterSpacing:2,textTransform:"uppercase",color:"rgba(245,240,232,0.6)",marginBottom:4}}>View Details</div><div style={{display:"flex",gap:6}} onClick={e=>e.stopPropagation()}><button onClick={e=>{e.stopPropagation();setModal(art);}} style={{flex:1,padding:"6px 0",background:"rgba(182,139,46,0.2)",border:"1px solid rgba(182,139,46,0.4)",borderRadius:6,color:"#b68b2e",fontSize:10,fontWeight:600,letterSpacing:1,textTransform:"uppercase",cursor:"pointer",fontFamily:"DM Sans,sans-serif"}}>Edit</button><button onClick={e=>{e.stopPropagation();handleDelete(art);}} style={{padding:"6px 10px",background:"rgba(196,92,74,0.15)",border:"1px solid rgba(196,92,74,0.3)",borderRadius:6,color:"#c45c4a",fontSize:10,cursor:"pointer",fontFamily:"DM Sans,sans-serif"}}>✕</button></div></div>
          <div style={{position:"absolute",top:10,right:10,width:8,height:8,borderRadius:"50%",background:statusDot[art.status]||"#8a8070",boxShadow:`0 0 0 2px rgba(255,255,255,0.8)`}}/></div>
          <div style={{padding:"12px 14px"}}><div style={{fontFamily:"Cormorant Garamond,serif",fontSize:15,fontWeight:500,color:"#1a1714",marginBottom:2,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{art.title||"Untitled"}</div><div style={{fontSize:11,color:"#8a8070",marginBottom:8}}>{art.medium||""}{art.year?` · ${art.year}`:""}</div><div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><span style={{fontFamily:"Cormorant Garamond,serif",fontSize:15,fontWeight:500,color:"#b68b2e"}}>R {fmt(art.recommendedPrice)}</span><span style={{fontSize:10,fontWeight:600,letterSpacing:1,textTransform:"uppercase",padding:"3px 8px",borderRadius:20,background:`${statusDot[art.status]||"#8a8070"}18`,color:statusDot[art.status]||"#8a8070"}}>{art.status}</span></div></div>
        </div>))}</div></div>}
      </div>;
    })}</div>}
    {modal&&<ArtModal art={modal==="add"?blank:modal} artists={data.artists||[]} onSave={save} onClose={()=>setModal(null)}/>}
    {delModal&&<Modal title="Force Delete Artwork" onClose={()=>setDelModal(null)}><p style={{fontSize:14,color:"#2a2622",marginBottom:8}}>This artwork has active license agreements or sales history.</p><p style={{fontSize:13,color:"#6b635a",marginBottom:20}}>Deleting will permanently remove all associated data. Cannot be undone.</p><div style={{display:"flex",gap:10,justifyContent:"flex-end"}}><Btn ghost onClick={()=>setDelModal(null)}>Cancel</Btn><Btn danger onClick={()=>{actions.forceDeleteArtwork(delModal.id);setDelModal(null);}}>Force Delete</Btn></div></Modal>}
  </div>);}

function ArtModal({art,artists,onSave,onClose}){
  const [f,sF]=useState({...art});const s=(k,v)=>sF(p=>({...p,[k]:v}));
  const [uploading,setUploading]=useState(false);
  const hFile=async(file)=>{
    if(!file?.type.startsWith("image/"))return;
    if(file.size>10485760)return alert("Max 10MB");
    // If we have an artworkId already (editing), upload immediately
    const artId=art.id||("VB"+Date.now().toString(36));
    if(db.isConnected()&&storage){
      setUploading(true);
      const url=await storage.uploadArtworkImage(file,artId);
      setUploading(false);
      if(url){s("imageUrl",url);if(!art.id)s("_pendingId",artId);return;}
    }
    // Fallback: base64 for local mode
    const r=new FileReader();r.onload=e=>s("imageUrl",e.target.result);r.readAsDataURL(file);
  };
  return(<Modal title={art.id?"Edit Artwork":"Add Artwork"} onClose={onClose} wide>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
      <Field label="Title" style={{gridColumn:"1/-1"}}><input value={f.title} onChange={e=>s("title",e.target.value)} style={is}/></Field>
      <Field label="Artist (profile)"><select value={f.artistId||""} onChange={e=>{s("artistId",e.target.value);const a=artists.find(x=>x.id===e.target.value);if(a)s("artist",a.name);}} style={ss}><option value="">—</option>{artists.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}</select></Field>
      <Field label="Artist (manual)"><input value={f.artist} onChange={e=>s("artist",e.target.value)} style={is}/></Field>
      <Field label="Medium"><select value={f.medium||""} onChange={e=>s("medium",e.target.value)} style={ss}><option value="">— Select medium</option>{ART_MEDIUMS.map(m=><option key={m} value={m}>{m}</option>)}</select></Field>
      <Field label="Dimensions"><input value={f.dimensions} onChange={e=>s("dimensions",e.target.value)} style={is}/></Field>
      <Field label="Year"><input value={f.year} onChange={e=>s("year",e.target.value)} style={is}/></Field>
      <Field label="Price (R)"><input type="text" inputMode="decimal" value={f.recommendedPrice} onChange={e=>s("recommendedPrice",Number(e.target.value))} style={is}/></Field>
      <Field label="Insurance/mo (R)"><input type="text" inputMode="decimal" value={f.insuranceMonthly} onChange={e=>s("insuranceMonthly",Number(e.target.value))} style={is}/></Field>
      <Field label="Gallery"><input value={f.galleryName} onChange={e=>s("galleryName",e.target.value)} style={is}/></Field>
      <Field label="Status"><select value={f.status} onChange={e=>s("status",e.target.value)} style={ss}><option>Available</option><option>Reserved</option><option>In Gallery</option><option>Sold</option><option>Pending Approval</option></select></Field>
      <Field label="Image" style={{gridColumn:"1/-1"}}><div style={{display:"flex",gap:14,alignItems:"flex-start"}}><div style={{flex:1,display:"flex",flexDirection:"column",gap:8}}><Btn ghost onClick={()=>document.getElementById("imgUp").click()} style={{justifyContent:"center",width:"100%",padding:"14px"}} disabled={uploading}>{uploading?"Uploading...":f.imageUrl?<>{I.up} Change</>:<>{I.up} Upload</>}</Btn><input id="imgUp" type="file" accept="image/*" onChange={e=>hFile(e.target.files[0])} style={{display:"none"}}/><div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:9,color:"#8a8070",letterSpacing:1,textTransform:"uppercase",whiteSpace:"nowrap"}}>URL:</span><input value={f.imageUrl?.startsWith("data:")?"":f.imageUrl||""} onChange={e=>s("imageUrl",e.target.value)} style={{...is,marginBottom:0,fontSize:12}} placeholder="https://..."/></div></div>{f.imageUrl&&<div style={{position:"relative",flexShrink:0}}><div style={{width:130,height:130,borderRadius:10,overflow:"hidden",border:"1px solid rgba(182,139,46,0.30)"}}><img src={f.imageUrl} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/></div><button onClick={()=>s("imageUrl","")} style={{position:"absolute",top:4,right:4,width:22,height:22,borderRadius:6,background:"rgba(0,0,0,0.7)",border:"none",color:"#c45c4a",cursor:"pointer",fontSize:14}}>×</button></div>}</div></Field>
      <Field label="Description" style={{gridColumn:"1/-1"}}><textarea value={f.description} onChange={e=>s("description",e.target.value)} style={{...is,minHeight:80,resize:"vertical"}} placeholder="Describe the artwork..."/></Field>
    </div>
    <div style={{display:"flex",gap:10,marginTop:20,justifyContent:"flex-end"}}><Btn ghost onClick={onClose}>Cancel</Btn><Btn gold onClick={()=>{if(!f.title||!f.recommendedPrice)return alert("Title & price required");const sv={...f};delete sv._pendingId;if(f._pendingId&&!art.id)sv.id=f._pendingId;onSave(sv);}}>{art.id?"Save":"Add"}</Btn></div>
  </Modal>);}

// ═══════════════════════════════════════════
// ARTISTS
// ═══════════════════════════════════════════
function ArtistsPage({data,up}){
  const [modal,setModal]=useState(null);const [search,setSearch]=useState("");
  const blank={id:"",name:"",email:"",mobile:"",bio:"",medium:"",style:"",website:"",instagram:"",profileImageUrl:"",bankName:"",accountHolder:"",accountNumber:"",branchCode:"",accountType:"",city:"",country:"South Africa",notes:""};
  const save=(a)=>{if(a.id)up("artists",p=>p.map(x=>x.id===a.id?a:x));else up("artists",p=>[{...a,id:uuidv4(),createdAt:td()},...p]);setModal(null);};
  const del=(id)=>{if(confirm("Delete?"))up("artists",p=>p.filter(x=>x.id!==id));};
  const arts=data.artists||[];const f=arts.filter(a=>(a.name+a.medium+a.city).toLowerCase().includes(search.toLowerCase()));
  const cnt=(id)=>data.artworks.filter(a=>a.artistId===id).length;
  const val=(id)=>data.artworks.filter(a=>a.artistId===id).reduce((s,a)=>s+(a.recommendedPrice||0),0);
  const kycPendingArtists=data.artists.filter(a=>a.kycStatus!=="approved");
  return(<div>
    {kycPendingArtists.length>0&&<div style={{padding:"12px 16px",background:"rgba(230,190,50,0.08)",border:"1px solid rgba(230,190,50,0.25)",borderRadius:10,marginBottom:12,display:"flex",alignItems:"center",gap:10}}><span style={{color:"#e6be32",fontSize:16}}>⚠</span><span style={{fontSize:13,color:"#8a6a1e",fontWeight:600}}>{kycPendingArtists.length} artist{kycPendingArtists.length>1?"s":""} awaiting KYC approval</span></div>}
    <PT title="Artists" sub={`${arts.length} artists`} action={<Btn gold onClick={()=>setModal("add")}>{I.plus} Add Artist</Btn>}/>
    <Card><div style={{marginBottom:16}}><input placeholder="Search..." value={search} onChange={e=>setSearch(e.target.value)} style={{...is,maxWidth:400}}/></div>
      {f.length===0?<Empty msg="No artists yet." action={<Btn gold onClick={()=>setModal("add")}>{I.plus} Add</Btn>}/>:<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:16}}>
        {f.map(a=><div key={a.id} style={{background:"#e8e4dd",border:"1px solid rgba(182,139,46,0.18)",borderRadius:12,padding:20}} onMouseEnter={e=>e.currentTarget.style.borderColor="rgba(182,139,46,0.25)"} onMouseLeave={e=>e.currentTarget.style.borderColor="rgba(182,139,46,0.18)"}>
          <div style={{display:"flex",gap:14}}>
            <div style={{width:56,height:56,borderRadius:12,flexShrink:0,background:"linear-gradient(135deg,rgba(182,139,46,0.50),rgba(182,139,46,0.12))",display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden"}}>{a.profileImageUrl?<img src={a.profileImageUrl} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<span style={{fontFamily:"Cormorant Garamond,serif",fontSize:22,color:"#b68b2e",fontWeight:600}}>{a.name.split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase()}</span>}</div>
            <div style={{flex:1}}><div style={{fontSize:16,fontWeight:600,color:"#1a1714"}}>{a.name}</div><div style={{fontSize:12,color:"#6b635a"}}>{[a.medium,a.city].filter(Boolean).join(" · ")}</div><div style={{display:"flex",gap:8,marginTop:6,flexWrap:"wrap",alignItems:"center"}}><span style={{fontSize:11,color:"#b68b2e"}}>{cnt(a.id)} works</span><span style={{fontSize:11,color:"#6b635a"}}>R {fmt(val(a.id))}</span>{a.kycStatus==="approved"?<span style={{fontSize:10,fontWeight:600,color:"#4a9e6b",padding:"2px 8px",background:"rgba(74,158,107,0.12)",borderRadius:6}}>✓ KYC Approved</span>:<><span style={{fontSize:10,fontWeight:600,color:"#e6be32",padding:"2px 8px",background:"rgba(230,190,50,0.12)",borderRadius:6}}>⚠ KYC Pending</span><button onClick={e=>{e.stopPropagation();up("artists",p=>p.map(x=>x.id===a.id?{...x,kycStatus:"approved"}:x));db.update("artists",a.id,{kyc_status:"approved"});}} style={{fontSize:10,padding:"2px 10px",borderRadius:6,border:"none",background:"linear-gradient(135deg,#b68b2e,#8a6a1e)",color:"#fff",cursor:"pointer",fontWeight:600,fontFamily:"DM Sans,sans-serif"}}>Approve KYC</button></>}</div></div>
            <div style={{display:"flex",gap:4}}><button onClick={e=>{e.stopPropagation();setModal(a);}} style={{background:"none",border:"none",color:"#6b635a",cursor:"pointer"}}>{I.edit}</button><button onClick={e=>{e.stopPropagation();del(a.id);}} style={{background:"none",border:"none",color:"#8a8070",cursor:"pointer"}}>{I.del}</button></div>
          </div>
        </div>)}
      </div>}
    </Card>
    {modal&&<ArtistMdl artist={modal==="add"?blank:modal} onSave={save} onClose={()=>setModal(null)}/>}
  </div>);}

function ArtistMdl({artist,onSave,onClose}){
  const [f,sF]=useState({...artist});const s=(k,v)=>sF(p=>({...p,[k]:v}));const [tab,setTab]=useState("personal");
  return(<Modal title={artist.id?"Edit Artist":"Add Artist"} onClose={onClose} wide>
    <div style={{display:"flex",gap:4,marginBottom:20,borderBottom:"1px solid rgba(182,139,46,0.18)",paddingBottom:12}}>
      {[["personal","Personal"],["art","Artistic"],["bank","Banking"]].map(([id,l])=><button key={id} onClick={()=>setTab(id)} style={{padding:"8px 16px",borderRadius:6,border:"none",cursor:"pointer",fontSize:12,fontWeight:tab===id?600:400,fontFamily:"DM Sans,sans-serif",background:tab===id?"rgba(182,139,46,0.25)":"transparent",color:tab===id?"#b68b2e":"#6b635a"}}>{l}</button>)}
    </div>
    {tab==="personal"&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
      <Field label="Full Name" style={{gridColumn:"1/-1"}}><input value={f.name} onChange={e=>s("name",e.target.value)} style={is}/></Field>
      <Field label="Email"><input value={f.email} onChange={e=>s("email",e.target.value)} style={is}/></Field>
      <Field label="Mobile"><input value={f.mobile} onChange={e=>s("mobile",e.target.value)} style={is}/></Field>
      <Field label="ID / Passport"><input value={f.idNumber||""} onChange={e=>s("idNumber",e.target.value)} style={is}/></Field>
      <Field label="Nationality"><input value={f.nationality||""} onChange={e=>s("nationality",e.target.value)} style={is}/></Field>
      <Field label="City"><input value={f.city||""} onChange={e=>s("city",e.target.value)} style={is}/></Field>
      <Field label="Country"><select value={f.country||"South Africa"} onChange={e=>s("country",e.target.value)} style={ss}><option value="">— Select</option>{COUNTRIES.map(c=><option key={c} value={c}>{c}</option>)}</select></Field>
      <Field label="Address" style={{gridColumn:"1/-1"}}><textarea value={f.address||""} onChange={e=>s("address",e.target.value)} style={{...is,minHeight:60,resize:"vertical"}}/></Field>
      <Field label="Notes" style={{gridColumn:"1/-1"}}><textarea value={f.notes||""} onChange={e=>s("notes",e.target.value)} style={{...is,minHeight:60,resize:"vertical"}} placeholder="Additional notes..."/></Field>
      <Field label="Profile Image URL" style={{gridColumn:"1/-1"}}><input value={f.profileImageUrl||""} onChange={e=>s("profileImageUrl",e.target.value)} style={is}/></Field>
    </div>}
    {tab==="art"&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}><Field label="Medium"><select value={f.medium||""} onChange={e=>s("medium",e.target.value)} style={ss}><option value="">— Select</option>{ART_MEDIUMS.map(m=><option key={m} value={m}>{m}</option>)}</select></Field><Field label="Style"><input value={f.style} onChange={e=>s("style",e.target.value)} style={is}/></Field><Field label="Website"><input value={f.website} onChange={e=>s("website",e.target.value)} style={is}/></Field><Field label="Instagram"><input value={f.instagram} onChange={e=>s("instagram",e.target.value)} style={is}/></Field><Field label="Bio" style={{gridColumn:"1/-1"}}><textarea value={f.bio} onChange={e=>s("bio",e.target.value)} style={{...is,minHeight:100,resize:"vertical"}}/></Field></div>}
    {tab==="bank"&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}><Field label="Bank"><select value={f.bankName||""} onChange={e=>s("bankName",e.target.value)} style={ss}><option value="">— Select</option>{SA_BANKS.map(b=><option key={b} value={b}>{b}</option>)}</select></Field><Field label="Account Holder"><input value={f.accountHolder} onChange={e=>s("accountHolder",e.target.value)} style={is}/></Field><Field label="Account No"><input value={f.accountNumber} onChange={e=>s("accountNumber",e.target.value)} style={is}/></Field><Field label="Branch Code"><input value={f.branchCode} onChange={e=>s("branchCode",e.target.value)} style={is}/></Field><Field label="Type"><select value={f.accountType} onChange={e=>s("accountType",e.target.value)} style={ss}><option value="">—</option><option>Cheque</option><option>Savings</option><option>Business</option></select></Field></div>}
    <div style={{display:"flex",gap:10,marginTop:24,justifyContent:"flex-end"}}><Btn ghost onClick={onClose}>Cancel</Btn><Btn gold onClick={()=>{if(!f.name)return alert("Name required");onSave(f);}}>{artist.id?"Save":"Add"}</Btn></div>
  </Modal>);}

// ═══════════════════════════════════════════
// COLLECTORS
// ═══════════════════════════════════════════
function CollectorsPage({data,up,actions}){
  const [modal,setModal]=useState(null);const [link,setLink]=useState(null);const [search,setSearch]=useState("");
  const blank={id:"",type:"individual",firstName:"",lastName:"",companyName:"",email:"",mobile:"",idNumber:"",nationality:"",address:"",linkedArtworks:[]};
  const save=(inv)=>{if(inv.id)up("collectors",p=>p.map(x=>x.id===inv.id?inv:x));else up("collectors",p=>[{...inv,id:uuidv4(),createdAt:td()},...p]);setModal(null);};
  const del=(id)=>{if(confirm("Delete?"))up("collectors",p=>p.filter(x=>x.id!==id));};
  const gn=(i)=>i.type==="company"?i.companyName:`${i.firstName||""} ${i.lastName||""}`.trim()||i.email||"Unknown";
  const f=data.collectors.filter(i=>gn(i).toLowerCase().includes(search.toLowerCase()));
  const kycPending=data.collectors.filter(c=>c.kycStatus!=="approved");
  const handleLink=async(cId,artId,model,depositType,depositPct)=>{await actions.linkArtwork(cId,artId,model,depositType,depositPct);setLink(null);};
  const handleUnlink=(schedId)=>{if(confirm("Cancel this schedule?"))actions.unlinkArtwork(schedId);};
  return(<div>
    <PT title="Display License Agreement Holders" sub={`${data.collectors.length} registered`} action={<Btn gold onClick={()=>setModal("add")}>{I.plus} Add</Btn>}/>
    <Card><div style={{marginBottom:16}}><input placeholder="Search..." value={search} onChange={e=>setSearch(e.target.value)} style={{...is,maxWidth:360}}/></div>
      {f.length===0?<Empty msg="No collectors yet." action={<Btn gold onClick={()=>setModal("add")}>{I.plus} Add</Btn>}/>:<Tbl cols={[
        {label:"Name",bold:true,render:r=><div>
          <div style={{fontWeight:600,marginBottom:3}}>{gn(r)}</div>
          <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
            {r.kycStatus==="approved"
              ?<span style={{fontSize:10,fontWeight:600,color:"#4a9e6b",padding:"2px 8px",background:"rgba(74,158,107,0.12)",borderRadius:6}}>✓ KYC Approved</span>
              :<><span style={{fontSize:10,fontWeight:600,color:"#e6be32",padding:"2px 8px",background:"rgba(230,190,50,0.12)",borderRadius:6}}>⚠ KYC Pending</span>
              <button onClick={e=>{e.stopPropagation();up("collectors",p=>p.map(c=>c.id===r.id?{...c,kycStatus:"approved"}:c));db.update("collectors",r.id,{kyc_status:"approved"});}} style={{fontSize:10,padding:"2px 10px",borderRadius:6,border:"none",background:"linear-gradient(135deg,#b68b2e,#8a6a1e)",color:"#fff",cursor:"pointer",fontWeight:600,fontFamily:"DM Sans,sans-serif"}}>Approve KYC</button></>
            }
          </div>
        </div>},
        {label:"Email",key:"email"},
        {label:"Mobile",key:"mobile"},
        {label:"Schedules",render:r=>{const scheds=data.schedules.filter(s=>s.collectorId===r.id);if(scheds.length===0)return<span style={{color:"#8a8070"}}>None</span>;return<div>{scheds.map(s=><div key={s.id} style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}><span style={{fontSize:12}}>{s.artworkTitle}</span><Badge model={s.acquisitionModel||"O1"}/><Badge status={s.status} sched/><button onClick={e=>{e.stopPropagation();handleUnlink(s.id);}} style={{background:"none",border:"none",color:"#c45c4a",cursor:"pointer",fontSize:10,textDecoration:"underline"}}>cancel</button></div>)}</div>;}},
        {label:"",render:r=><div style={{display:"flex",gap:6}}><Btn small ghost onClick={e=>{e.stopPropagation();setLink(r);}}>Link Art</Btn><button onClick={e=>{e.stopPropagation();setModal(r);}} style={{background:"none",border:"none",color:"#6b635a",cursor:"pointer"}}>{I.edit}</button><button onClick={e=>{e.stopPropagation();del(r.id);}} style={{background:"none",border:"none",color:"#8a8070",cursor:"pointer"}}>{I.del}</button></div>},
      ]} data={f}/>}
    </Card>
    {modal&&<ColMdl col={modal==="add"?blank:modal} onSave={save} onClose={()=>setModal(null)}/>}
    {link&&<LinkMdl col={link} arts={data.artworks.filter(a=>a.status==="Available")} onLink={handleLink} onClose={()=>setLink(null)} gn={gn}/>}
  </div>);}

function ColMdl({col,onSave,onClose}){
  const [f,sF]=useState({...col,city:col.city||"",country:col.country||"South Africa",notes:col.notes||""});
  const s=(k,v)=>sF(p=>({...p,[k]:v}));const isNew=!col.id;
  return(<Modal title={isNew?"Add Display License Agreement Holder":"Edit"} onClose={onClose} wide>
    <Field label="Type"><div style={{display:"flex",gap:8}}>{[["individual","Individual"],["company","Company"]].map(([id,l])=><button key={id} onClick={()=>s("type",id)} style={{flex:1,padding:10,borderRadius:8,border:f.type===id?"2px solid #b68b2e":"1px solid rgba(182,139,46,0.30)",background:f.type===id?"rgba(182,139,46,0.18)":"#e8e4dd",color:f.type===id?"#b68b2e":"#6b635a",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"DM Sans,sans-serif"}}>{l}</button>)}</div></Field>
    {f.type==="company"?<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}><Field label="Company Name" style={{gridColumn:"1/-1"}}><input value={f.companyName||""} onChange={e=>s("companyName",e.target.value)} style={is}/></Field><Field label="Company Reg No"><input value={f.companyRegNo||""} onChange={e=>s("companyRegNo",e.target.value)} style={is} placeholder="e.g. 2024/123456/07"/></Field><Field label="Representative Name"><input value={f.repName||""} onChange={e=>s("repName",e.target.value)} style={is}/></Field><Field label="Representative ID"><input value={f.repId||""} onChange={e=>s("repId",e.target.value)} style={is}/></Field></div>:<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}><Field label="First Name"><input value={f.firstName||""} onChange={e=>s("firstName",e.target.value)} style={is}/></Field><Field label="Last Name"><input value={f.lastName||""} onChange={e=>s("lastName",e.target.value)} style={is}/></Field></div>}
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
      <Field label="Email"><input value={f.email||""} onChange={e=>s("email",e.target.value)} style={is}/></Field><Field label="Mobile"><input value={f.mobile||""} onChange={e=>s("mobile",e.target.value)} style={is}/></Field>
      <Field label="ID / Passport"><input value={f.idNumber||""} onChange={e=>s("idNumber",e.target.value)} style={is}/></Field><Field label="Nationality"><input value={f.nationality||""} onChange={e=>s("nationality",e.target.value)} style={is}/></Field>
      <Field label="City"><input value={f.city||""} onChange={e=>s("city",e.target.value)} style={is}/></Field><Field label="Country"><select value={f.country||"South Africa"} onChange={e=>s("country",e.target.value)} style={ss}><option value="">— Select</option>{COUNTRIES.map(c=><option key={c} value={c}>{c}</option>)}</select></Field>
    </div>
    <Field label="Address"><textarea value={f.address||""} onChange={e=>s("address",e.target.value)} style={{...is,minHeight:60,resize:"vertical"}}/></Field>
    <Field label="Notes"><textarea value={f.notes||""} onChange={e=>s("notes",e.target.value)} style={{...is,minHeight:60,resize:"vertical"}} placeholder="Additional notes..."/></Field>
    <Field label="Agreement Start Date"><input type="date" value={f.startDate||""} onChange={e=>s("startDate",e.target.value)} style={is}/></Field>
    <div style={{display:"flex",gap:10,marginTop:20,justifyContent:"flex-end"}}><Btn ghost onClick={onClose}>Cancel</Btn><Btn gold onClick={()=>{if(f.type==="company"?!f.companyName:!f.firstName||!f.lastName)return alert("Name required");onSave(f);}}>{isNew?"Add":"Save"}</Btn></div>
  </Modal>);}

function LinkMdl({col,arts,onLink,onClose,gn}){
  const [artId,setArtId]=useState("");const [acqModel,setAcqModel]=useState("O1");const [depositType,setDepositType]=useState("none");const [depositPct,setDepositPct]=useState("10");
  const art=arts.find(a=>a.id===artId);const m=MODELS[acqModel];const dp=parseFloat(depositPct)||0;
  const vbFee=art?art.recommendedPrice*m.vbPct:0;const depositAmt=art?art.recommendedPrice*(dp/100):0;
  const remainingFee=depositType==="toward"?Math.max(0,vbFee-depositAmt):vbFee;const monthly=art?remainingFee/m.term:0;
  const totalDue=depositType==="separate"?vbFee+depositAmt:vbFee;const colProfit=art?art.recommendedPrice*(m.colPct-m.vbPct)-(depositType==="separate"?depositAmt:0):0;
  const depTypes=[{id:"none",label:"No Deposit",sub:"Full fee paid monthly"},{id:"toward",label:"Deposit toward fee",sub:"Reduces license fees — same total"}];
  return(<Modal title={`Assign to Display — ${gn(col)}`} onClose={onClose} wide>
    <div style={{fontSize:10,letterSpacing:2,textTransform:"uppercase",color:"#8a8070",marginBottom:8}}>Step 1 — Artwork</div>
    <Field label=""><select value={artId} onChange={e=>setArtId(e.target.value)} style={{...ss,marginBottom:0}}><option value="">— Select artwork</option>{arts.map(a=><option key={a.id} value={a.id}>{a.title} — R {fmt(a.recommendedPrice)}</option>)}</select></Field>
    <div style={{fontSize:10,letterSpacing:2,textTransform:"uppercase",color:"#8a8070",margin:"16px 0 8px"}}>Step 2 — Display License Tier</div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:16}}>{["O1","O2","O3"].map(k=>{const mod=MODELS[k];const active=acqModel===k;return<button key={k} onClick={()=>setAcqModel(k)} style={{padding:12,borderRadius:10,border:active?"2px solid #b68b2e":"1px solid rgba(182,139,46,0.30)",background:active?"rgba(182,139,46,0.18)":"#e8e4dd",color:active?"#b68b2e":"#6b635a",cursor:"pointer",fontFamily:"DM Sans,sans-serif",textAlign:"left",transition:"all 0.15s"}}><div style={{fontSize:12,fontWeight:600,marginBottom:4}}>{mod.label}</div><div style={{fontSize:10,opacity:0.8}}>{mod.term} months</div>{art&&<div style={{fontSize:11,marginTop:6,color:active?"#b68b2e":"#8a8070",fontWeight:600}}>R {fmt(art.recommendedPrice*mod.vbPct/mod.term)} per month</div>}</button>;})}
    </div>
    <div style={{fontSize:10,letterSpacing:2,textTransform:"uppercase",color:"#8a8070",marginBottom:8}}>Step 3 — Deposit</div>
    <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:16}}>{depTypes.map(d=>{const active=depositType===d.id;return<button key={d.id} onClick={()=>setDepositType(d.id)} style={{padding:"12px 14px",borderRadius:10,border:active?"2px solid #b68b2e":"1px solid rgba(182,139,46,0.30)",background:active?"rgba(182,139,46,0.18)":"#e8e4dd",color:active?"#b68b2e":"#6b635a",cursor:"pointer",fontFamily:"DM Sans,sans-serif",textAlign:"left",display:"flex",alignItems:"center",justifyContent:"space-between",transition:"all 0.15s"}}><div><div style={{fontSize:13,fontWeight:600}}>{d.label}</div><div style={{fontSize:11,opacity:0.8,marginTop:2}}>{d.sub}</div></div>{active&&art&&depositType!=="none"&&<div style={{fontSize:13,fontWeight:600,color:"#b68b2e"}}>R {fmt(depositAmt)} upfront</div>}</button>;})}
    </div>
    {depositType!=="none"&&<Field label="Deposit Percentage"><div style={{display:"flex",alignItems:"center",gap:10}}><input type="text" inputMode="decimal" value={depositPct} onChange={e=>setDepositPct(e.target.value)} style={{...is,width:100}} placeholder="10"/><span style={{fontSize:13,color:"#8a8070"}}>% of artwork value</span>{art&&<span style={{fontSize:13,color:"#b68b2e",fontWeight:600,marginLeft:"auto"}}>= R {fmt(depositAmt)}</span>}</div></Field>}
    {art&&<Card style={{background:"#e8e4dd",marginTop:8}}><div style={{fontSize:10,letterSpacing:2,textTransform:"uppercase",color:"#8a8070",marginBottom:12}}>Agreement Summary</div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,fontSize:13}}><span style={{color:"#6b635a"}}>Artwork value:</span><span style={{textAlign:"right"}}>R {fmt(art.recommendedPrice)}</span><span style={{color:"#6b635a"}}>Gallery commission ({Math.round(m.vbPct*100)}%):</span><span style={{textAlign:"right",color:"#b68b2e",fontWeight:600}}>R {fmt(vbFee)}</span>{depositType!=="none"&&<><span style={{color:"#6b635a"}}>Deposit ({dp}%):</span><span style={{textAlign:"right",color:"#b68b2e"}}>R {fmt(depositAmt)}</span></>}<div style={{gridColumn:"1/-1",height:1,background:"rgba(182,139,46,0.20)",margin:"4px 0"}}/><span style={{color:"#b68b2e",fontWeight:600}}>License fee:</span><span style={{textAlign:"right",fontWeight:600,color:"#b68b2e"}}>R {fmt(monthly)} per month x {m.term}</span><span style={{color:"#4a9e6b",fontWeight:600}}>License Holder receives ({Math.round(m.colPct*100)}%):</span><span style={{textAlign:"right",color:"#4a9e6b"}}>R {fmt(art.recommendedPrice*m.colPct)}</span><span style={{color:"#4a9e6b",fontWeight:600}}>Profit:</span><span style={{textAlign:"right",color:"#4a9e6b",fontWeight:600}}>R {fmt(colProfit)}</span></div></Card>}
    <div style={{display:"flex",gap:10,marginTop:20,justifyContent:"flex-end"}}><Btn ghost onClick={onClose}>Cancel</Btn><Btn gold disabled={!artId} onClick={()=>onLink(col.id,artId,acqModel,depositType,dp)}>Create License</Btn></div>
  </Modal>);}

// ═══════════════════════════════════════════
// BUYERS
// ═══════════════════════════════════════════
function BuyersPage({data,actions}){
  const [modal,setModal]=useState(null);const [search,setSearch]=useState("");const [selected,setSelected]=useState(null);
  const blank={id:"",type:"individual",firstName:"",lastName:"",companyName:"",email:"",mobile:"",idNumber:"",nationality:"",address:"",city:"",country:"South Africa",notes:""};
  const f=data.buyers.filter(b=>buyerName(b).toLowerCase().includes(search.toLowerCase())||(b.email||"").toLowerCase().includes(search.toLowerCase()));
  const getPurchases=(buyerId)=>data.sales.filter(s=>s.buyerId===buyerId);
  const getTotalSpend=(buyerId)=>getPurchases(buyerId).reduce((s,x)=>s+(x.salePrice||0),0);
  const kycPendingBuyers=data.buyers.filter(b=>b.kycStatus!=="approved");
  return(<div>
    {kycPendingBuyers.length>0&&<div style={{padding:"12px 16px",background:"rgba(230,190,50,0.08)",border:"1px solid rgba(230,190,50,0.25)",borderRadius:10,marginBottom:12,display:"flex",alignItems:"center",gap:10}}><span style={{color:"#e6be32",fontSize:16}}>⚠</span><span style={{fontSize:13,color:"#8a6a1e",fontWeight:600}}>{kycPendingBuyers.length} buyer{kycPendingBuyers.length>1?"s":""} awaiting KYC approval</span></div>}
    <PT title="Buyers" sub={`${data.buyers.length} registered buyers`} action={<Btn gold onClick={()=>setModal("add")}>{I.plus} Register Buyer</Btn>}/>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:14,marginBottom:28}}>
      <Stat label="Total Buyers" value={data.buyers.length} gold/><Stat label="Repeat Buyers" value={data.buyers.filter(b=>getPurchases(b.id).length>1).length} green/><Stat label="Total Purchases" value={data.sales.filter(s=>s.buyerId).length}/><Stat label="Total Spend" value={"R "+fmt(data.sales.filter(s=>s.buyerId).reduce((s,x)=>s+(x.salePrice||0),0))} gold/>
    </div>
    <div style={{display:"grid",gridTemplateColumns:selected?"1fr 380px":"1fr",gap:20}}>
      <Card>
        <div style={{marginBottom:16}}><input placeholder="Search buyers..." value={search} onChange={e=>setSearch(e.target.value)} style={{...is,maxWidth:400}}/></div>
        {f.length===0?<Empty msg="No buyers yet." action={<Btn gold onClick={()=>setModal("add")}>{I.plus} Register</Btn>}/>:<Tbl cols={[
          {label:"Name",bold:true,render:r=><div>
            <button onClick={()=>setSelected(selected?.id===r.id?null:r)} style={{background:"none",border:"none",color:"#b68b2e",cursor:"pointer",fontSize:13,fontWeight:600,textDecoration:"underline",fontFamily:"DM Sans,sans-serif"}}>{buyerName(r)}</button>
            <div style={{display:"flex",gap:6,marginTop:4,flexWrap:"wrap",alignItems:"center"}}>
              {r.kycStatus==="approved"
                ?<span style={{fontSize:10,fontWeight:600,color:"#4a9e6b",padding:"2px 8px",background:"rgba(74,158,107,0.12)",borderRadius:6}}>✓ KYC Approved</span>
                :<><span style={{fontSize:10,fontWeight:600,color:"#e6be32",padding:"2px 8px",background:"rgba(230,190,50,0.12)",borderRadius:6}}>⚠ KYC Pending</span>
                <button onClick={e=>{e.stopPropagation();actions.saveBuyer({...r,kycStatus:"approved"});db.update("buyers",r.id,{kyc_status:"approved"});}} style={{fontSize:10,padding:"2px 10px",borderRadius:6,border:"none",background:"linear-gradient(135deg,#b68b2e,#8a6a1e)",color:"#fff",cursor:"pointer",fontWeight:600,fontFamily:"DM Sans,sans-serif"}}>Approve KYC</button></>
              }
            </div>
          </div>},
          {label:"Type",render:r=>r.type==="company"?"Company":"Individual"},{label:"Email",key:"email"},{label:"Nationality",key:"nationality"},
          {label:"Purchases",render:r=><span style={{color:"#b68b2e",fontWeight:600}}>{getPurchases(r.id).length}</span>},
          {label:"Total Spend",right:true,gold:true,render:r=>"R "+fmt(getTotalSpend(r.id))},
          {label:"",render:r=><div style={{display:"flex",gap:6}}><button onClick={e=>{e.stopPropagation();setModal(r);}} style={{background:"none",border:"none",color:"#6b635a",cursor:"pointer"}}>{I.edit}</button><button onClick={e=>{e.stopPropagation();if(confirm("Delete buyer?"))actions.deleteBuyer(r.id);}} style={{background:"none",border:"none",color:"#8a8070",cursor:"pointer"}}>{I.del}</button></div>},
        ]} data={f}/>}
      </Card>
      {selected&&<BuyerProfile buyer={selected} purchases={getPurchases(selected.id)} artworks={data.artworks} collectors={data.collectors} onClose={()=>setSelected(null)} onEdit={()=>setModal(selected)}/>}
    </div>
    {modal&&<BuyerModal buyer={modal==="add"?blank:modal} onSave={(b)=>{actions.saveBuyer(b);setModal(null);if(selected?.id===b.id)setSelected(b);}} onClose={()=>setModal(null)}/>}
  </div>);}

function BuyerProfile({buyer,purchases,artworks,collectors,onClose,onEdit}){
  return<Card style={{position:"sticky",top:20}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20}}>
      <div><div style={{fontFamily:"Cormorant Garamond,serif",fontSize:20,fontWeight:400,color:"#1a1714"}}>{buyerName(buyer)}</div><div style={{fontSize:11,color:"#8a8070",marginTop:2,letterSpacing:1,textTransform:"uppercase"}}>{buyer.type==="company"?"Company":"Individual"} · {buyer.nationality||"—"}</div></div>
      <div style={{display:"flex",gap:6}}><Btn small ghost onClick={onEdit}>{I.edit}</Btn><button onClick={onClose} style={{background:"none",border:"none",color:"#6b635a",cursor:"pointer"}}>{I.x}</button></div>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,fontSize:12,marginBottom:16}}>{[["Email",buyer.email],["Mobile",buyer.mobile],["ID",buyer.idNumber],["City",buyer.city],["Country",buyer.country]].map(([l,v])=>v?<div key={l}><div style={{fontSize:9,letterSpacing:2,textTransform:"uppercase",color:"#8a8070",marginBottom:2}}>{l}</div><div style={{color:"#2a2622"}}>{v}</div></div>:null)}</div>
    <div style={{fontSize:11,letterSpacing:2,textTransform:"uppercase",color:"#8a8070",marginBottom:10}}>Purchase History ({purchases.length})</div>
    {purchases.length===0?<p style={{fontSize:13,color:"#8a8070"}}>No purchases yet.</p>:purchases.map(sale=>{const art=artworks.find(a=>a.id===sale.artworkId);const col=collectors.find(c=>c.id===sale.collectorId);const colName=col?(col.type==="company"?col.companyName:`${col.firstName} ${col.lastName}`):"—";return<div key={sale.id} style={{padding:12,background:"#e8e4dd",borderRadius:8,marginBottom:8}}><div style={{display:"flex",gap:10}}>{art?.imageUrl&&<div style={{width:40,height:40,borderRadius:6,overflow:"hidden",flexShrink:0}}><img src={art.imageUrl} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/></div>}<div style={{flex:1}}><div style={{fontSize:13,fontWeight:600,color:"#1a1714"}}>{sale.artworkTitle}</div><div style={{fontSize:11,color:"#8a8070",marginTop:2}}>{sale.date} · LH: {colName}</div><div style={{display:"flex",gap:12,marginTop:4,fontSize:12}}><span style={{color:"#b68b2e",fontWeight:600}}>R {fmt(sale.salePrice)}</span><Badge model={sale.acquisitionModel||"O1"}/></div></div></div></div>;})}
    {purchases.length>0&&<div style={{borderTop:"1px solid rgba(182,139,46,0.18)",paddingTop:10,marginTop:4,display:"flex",justifyContent:"space-between",fontSize:13}}><span style={{color:"#6b635a"}}>Total spend:</span><span style={{color:"#b68b2e",fontWeight:700}}>R {fmt(purchases.reduce((s,x)=>s+(x.salePrice||0),0))}</span></div>}
    {buyer.notes&&<div style={{marginTop:12,fontSize:12,color:"#6b635a",padding:"10px 12px",background:"#e8e4dd",borderRadius:8}}>{buyer.notes}</div>}
  </Card>;}

function BuyerModal({buyer,onSave,onClose}){
  const [f,sF]=useState({...buyer});const s=(k,v)=>sF(p=>({...p,[k]:v}));const isNew=!buyer.id;
  return(<Modal title={isNew?"Register Buyer":"Edit Buyer"} onClose={onClose} wide>
    <Field label="Type"><div style={{display:"flex",gap:8}}>{[["individual","Individual"],["company","Company"]].map(([id,l])=><button key={id} onClick={()=>s("type",id)} style={{flex:1,padding:10,borderRadius:8,border:f.type===id?"2px solid #b68b2e":"1px solid rgba(182,139,46,0.30)",background:f.type===id?"rgba(182,139,46,0.18)":"#e8e4dd",color:f.type===id?"#b68b2e":"#6b635a",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"DM Sans,sans-serif"}}>{l}</button>)}</div></Field>
    {f.type==="company"?<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}><Field label="Company Name" style={{gridColumn:"1/-1"}}><input value={f.companyName||""} onChange={e=>s("companyName",e.target.value)} style={is}/></Field><Field label="Company Reg No"><input value={f.companyRegNo||""} onChange={e=>s("companyRegNo",e.target.value)} style={is} placeholder="e.g. 2024/123456/07"/></Field><Field label="Representative Name"><input value={f.repName||""} onChange={e=>s("repName",e.target.value)} style={is}/></Field><Field label="Representative ID"><input value={f.repId||""} onChange={e=>s("repId",e.target.value)} style={is}/></Field></div>:<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}><Field label="First Name"><input value={f.firstName||""} onChange={e=>s("firstName",e.target.value)} style={is}/></Field><Field label="Last Name"><input value={f.lastName||""} onChange={e=>s("lastName",e.target.value)} style={is}/></Field></div>}
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
      <Field label="Email"><input value={f.email||""} onChange={e=>s("email",e.target.value)} style={is}/></Field><Field label="Mobile"><input value={f.mobile||""} onChange={e=>s("mobile",e.target.value)} style={is}/></Field>
      <Field label="ID / Passport"><input value={f.idNumber||""} onChange={e=>s("idNumber",e.target.value)} style={is}/></Field><Field label="Nationality"><input value={f.nationality||""} onChange={e=>s("nationality",e.target.value)} style={is}/></Field>
      <Field label="City"><input value={f.city||""} onChange={e=>s("city",e.target.value)} style={is}/></Field><Field label="Country"><select value={f.country||"South Africa"} onChange={e=>s("country",e.target.value)} style={ss}><option value="">— Select</option>{COUNTRIES.map(c=><option key={c} value={c}>{c}</option>)}</select></Field>
    </div>
    <Field label="Address"><textarea value={f.address||""} onChange={e=>s("address",e.target.value)} style={{...is,minHeight:60,resize:"vertical"}}/></Field>
    <Field label="Notes"><textarea value={f.notes||""} onChange={e=>s("notes",e.target.value)} style={{...is,minHeight:60,resize:"vertical"}} placeholder="Additional notes..."/></Field>
    <div style={{display:"flex",gap:10,marginTop:20,justifyContent:"flex-end"}}><Btn ghost onClick={onClose}>Cancel</Btn><Btn gold onClick={()=>{const name=f.type==="company"?f.companyName:`${f.firstName} ${f.lastName}`;if(!name?.trim())return alert("Name required");onSave(f);}}>{isNew?"Register":"Save"} Buyer</Btn></div>
  </Modal>);}

// ═══════════════════════════════════════════
// CALCULATOR
// ═══════════════════════════════════════════
function CalcPage({data={},actions={}}){
  const [mode,setMode]=useState("manual");const [selectedScheduleId,setSelectedScheduleId]=useState("");const [newCollectorId,setNewCollectorId]=useState("");const [newArtworkId,setNewArtworkId]=useState("");const [linkOption,setLinkOption]=useState("O1");const [linkDeposit,setLinkDeposit]=useState("none");const [linkDepPct,setLinkDepPct]=useState("10");const [linkSaved,setLinkSaved]=useState(false);
  const schedules=data.schedules||[];const artworks=data.artworks||[];const collectors=data.collectors||[];
  const gn=c=>c?(c.type==="company"?c.companyName:`${c.firstName} ${c.lastName}`):"";
  const selectedSched=schedules.find(s=>s.id===selectedScheduleId);
  const [artVal,setArtVal]=useState("");const [saleVal,setSaleVal]=useState("");const [acqModel,setAcqModel]=useState("O1");const [monthsSold,setMonthsSold]=useState("");const [depositType,setDepositType]=useState("none");const [depositPct,setDepositPct]=useState("10");const [galleryPct,setGalleryPct]=useState("");const [vbPct2,setVbPct2]=useState("");const [artistPct,setArtistPct]=useState("");const [introPct,setIntroPct]=useState("");
  const av=parseFloat(artVal)||0;const sp=parseFloat(saleVal)||av;const mo=Math.max(1,Math.min(parseInt(monthsSold)||1,MODELS[acqModel].term));const m=MODELS[acqModel];
  const gN=parseFloat(galleryPct)||40;const vN=parseFloat(vbPct2)||30;const aN=parseFloat(artistPct)||30;const iN=parseFloat(introPct)||0;const dN=parseFloat(depositPct)||0;
  const deal=av>0?calcDeal(av,sp,acqModel,mo,gN,vN,aN,iN,depositType,dN):{};
  const splitTotal=gN+vN+aN;const splitOk=Math.round(splitTotal)===100;
  const scenarioMonths=Array.from({length:m.term},(_,i)=>i+1);const aboveValue=av>0&&sp>0&&sp>av;
  const SRow=({label,val,color,bold,sub})=><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:"1px solid rgba(182,139,46,0.12)"}}><span style={{fontSize:13,color:"#6b635a"}}>{label}{sub&&<span style={{fontSize:11,color:"#8a8070",marginLeft:6}}>{sub}</span>}</span><span style={{fontSize:bold?18:13,fontWeight:bold?600:500,color:color||"#2a2622",fontFamily:bold?"Cormorant Garamond,serif":"DM Sans,sans-serif"}}>{val}</span></div>;
  return(<div>
    <PT title="Renters Fee Agreement" sub="Standard · Extended · Premium · 50/50 across all tiers"/>
    <div style={{display:"flex",gap:8,marginBottom:20,borderBottom:"1px solid rgba(182,139,46,0.18)",paddingBottom:16}}>{[["manual","Manual Entry"],["lookup","Load License Holder Deal"],["new","Build & Link"]].map(([id,lbl])=><button key={id} onClick={()=>{setMode(id);setLinkSaved(false);}} style={{padding:"9px 18px",borderRadius:8,border:mode===id?"2px solid #b68b2e":"1px solid rgba(182,139,46,0.30)",background:mode===id?"rgba(182,139,46,0.18)":"transparent",color:mode===id?"#b68b2e":"#6b635a",fontSize:12,fontWeight:mode===id?600:400,cursor:"pointer",fontFamily:"DM Sans,sans-serif"}}>{lbl}</button>)}</div>
    {mode==="lookup"&&<Card style={{marginBottom:20}}><div style={{fontSize:11,letterSpacing:2,textTransform:"uppercase",color:"#8a8070",marginBottom:12}}>Select Collector & Artwork</div><select value={selectedScheduleId} onChange={e=>{const s=schedules.find(x=>x.id===e.target.value);setSelectedScheduleId(e.target.value);if(s){const art=artworks.find(a=>a.id===s.artworkId);if(art)setArtVal(String(art.recommendedPrice));setAcqModel(s.acquisitionModel||"O1");setMonthsSold(String(s.monthsPaid));setDepositType(s.depositType||"none");setDepositPct(String(s.depositPct||10));setSaleVal("");}}} style={ss}><option value="">— Select a collector schedule</option>{schedules.filter(s=>s.status!=="Complete"&&s.status!=="Cancelled").map(s=><option key={s.id} value={s.id}>{s.collectorName} · {s.artworkTitle} · Mo {s.monthsPaid}</option>)}</select>{selectedSched&&<div style={{marginTop:12,padding:"12px 14px",background:"#e8e4dd",borderRadius:8,fontSize:13}}><span style={{color:"#4a9e6b"}}>Deal loaded ↓ Enter a sale price to see settlement.</span></div>}</Card>}
    {mode==="new"&&<Card style={{marginBottom:20}}><div style={{fontSize:11,letterSpacing:2,textTransform:"uppercase",color:"#8a8070",marginBottom:12}}>Build & Link</div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}><Field label="Collector"><select value={newCollectorId} onChange={e=>setNewCollectorId(e.target.value)} style={ss}><option value="">— Select</option>{collectors.map(c=><option key={c.id} value={c.id}>{gn(c)}</option>)}</select></Field><Field label="Artwork"><select value={newArtworkId} onChange={e=>{setNewArtworkId(e.target.value);const art=artworks.find(a=>a.id===e.target.value);if(art)setArtVal(String(art.recommendedPrice));}} style={ss}><option value="">— Select</option>{artworks.filter(a=>a.status==="Available").map(a=><option key={a.id} value={a.id}>{a.title} — R {fmt(a.recommendedPrice)}</option>)}</select></Field></div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:14}}>{["O1","O2","O3"].map(k=>{const mod=MODELS[k];const on=linkOption===k;return<button key={k} onClick={()=>setLinkOption(k)} style={{padding:10,borderRadius:8,border:on?"2px solid #b68b2e":"1px solid rgba(182,139,46,0.25)",background:on?"rgba(182,139,46,0.18)":"#e8e4dd",color:on?"#b68b2e":"#6b635a",cursor:"pointer",fontFamily:"DM Sans,sans-serif",textAlign:"center",fontSize:11,fontWeight:on?600:400}}><div style={{fontWeight:600}}>{mod.label.split("·")[0].trim()}</div><div style={{fontSize:10,opacity:0.7}}>{mod.term} months</div></button>;})}
    </div>
    {linkSaved?<div style={{padding:"10px 14px",background:"rgba(74,158,107,0.08)",border:"1px solid rgba(74,158,107,0.2)",borderRadius:8,fontSize:13,color:"#4a9e6b"}}>✓ Schedule created. Check Invoicing.</div>:<Btn gold disabled={!newCollectorId||!newArtworkId} onClick={async()=>{await actions.linkArtwork(newCollectorId,newArtworkId,linkOption,linkDeposit,parseFloat(linkDepPct)||0);setAcqModel(linkOption);const art=artworks.find(a=>a.id===newArtworkId);if(art)setArtVal(String(art.recommendedPrice));setDepositType(linkDeposit);setDepositPct(linkDepPct);setMonthsSold("0");setLinkSaved(true);}}>Create License</Btn>}
    </Card>}
    <div style={{display:"grid",gridTemplateColumns:"300px 1fr",gap:24,alignItems:"start"}}>
      <div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:14}}>{["O1","O2","O3"].map(k=>{const mod=MODELS[k];const on=acqModel===k;return<button key={k} onClick={()=>{setAcqModel(k);setMonthsSold("");}} style={{padding:12,borderRadius:10,border:on?"2px solid #b68b2e":"1px solid rgba(182,139,46,0.30)",background:on?"rgba(182,139,46,0.18)":"#e8e4dd",color:on?"#b68b2e":"#6b635a",cursor:"pointer",fontFamily:"DM Sans,sans-serif",textAlign:"left"}}><div style={{fontSize:12,fontWeight:600}}>{mod.label}</div><div style={{fontSize:10,opacity:0.8,marginTop:2}}>{mod.term} months</div>{av>0&&<div style={{fontSize:11,color:on?"#b68b2e":"#8a8070",marginTop:4,fontWeight:600}}>R {fmt(av*mod.vbPct/mod.term)} per month</div>}</button>;})}
        </div>
        <Card style={{marginBottom:12}}><Field label="Artwork Value (R)"><input type="text" inputMode="decimal" value={artVal} onChange={e=>setArtVal(e.target.value)} style={is} placeholder="e.g. 100000"/></Field><Field label="Sale Price (R)"><input type="text" inputMode="decimal" value={saleVal} onChange={e=>setSaleVal(e.target.value)} style={is} placeholder={artVal||"same as artwork value"}/></Field><Field label={`Month Sold (1–${m.term})`} style={{marginBottom:0}}><input type="text" inputMode="decimal" value={monthsSold} onChange={e=>setMonthsSold(e.target.value)} onBlur={e=>{const v=parseInt(e.target.value)||1;setMonthsSold(Math.max(1,Math.min(v,m.term)));}} style={is} placeholder={`1–${m.term}`}/></Field></Card>
        <Card style={{marginBottom:12}}><div style={{fontSize:10,letterSpacing:2,textTransform:"uppercase",color:"#8a8070",marginBottom:10}}>Deposit</div><div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:depositType!=="none"?12:0}}>{[["none","No deposit"],["toward","Deposit toward fee"]].map(([id,lbl])=><button key={id} onClick={()=>setDepositType(id)} style={{padding:"9px 12px",borderRadius:8,border:depositType===id?"2px solid #b68b2e":"1px solid rgba(182,139,46,0.25)",background:depositType===id?"rgba(182,139,46,0.18)":"#e8e4dd",color:depositType===id?"#b68b2e":"#6b635a",cursor:"pointer",fontFamily:"DM Sans,sans-serif",textAlign:"left",fontSize:12,fontWeight:depositType===id?600:400}}>{lbl}</button>)}</div>{depositType!=="none"&&<div style={{display:"flex",alignItems:"center",gap:8}}><input type="text" inputMode="decimal" value={depositPct} onChange={e=>setDepositPct(e.target.value)} style={{...is,width:70}} placeholder="10"/><span style={{fontSize:13,color:"#8a8070"}}>%</span>{av>0&&<span style={{fontSize:12,color:"#b68b2e",fontWeight:600,marginLeft:"auto"}}>R {fmt(av*(dN/100))}</span>}</div>}</Card>
        <Card style={{marginBottom:12}}><div style={{fontSize:10,letterSpacing:2,textTransform:"uppercase",color:"#8a8070",marginBottom:10}}>Introducer Fee</div><div style={{display:"flex",alignItems:"center",gap:8}}><input type="text" inputMode="decimal" value={introPct} onChange={e=>setIntroPct(e.target.value)} style={{...is,flex:1}} placeholder="0"/><span style={{fontSize:13,color:"#8a8070",flexShrink:0}}>%</span>{deal.introFee>0&&<span style={{fontSize:12,color:"#c45c4a",fontWeight:600,flexShrink:0}}>R {fmt(deal.introFee)}</span>}</div></Card>
        <Card>{!splitOk&&<div style={{fontSize:11,color:"#c45c4a",marginBottom:8}}>⚠ Must total 100%</div>}{[["Gallery",galleryPct,setGalleryPct],["VB",vbPct2,setVbPct2],["Artist",artistPct,setArtistPct]].map(([l,v,sv])=><div key={l} style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}><span style={{fontSize:13,color:"#2a2622",minWidth:56,flexShrink:0}}>{l}</span><input type="text" inputMode="decimal" value={v} onChange={e=>sv(e.target.value)} style={{...is,width:60,padding:"7px 10px",fontSize:13}} placeholder="0"/><span style={{fontSize:12,color:"#8a8070"}}>%</span>{av>0&&splitOk&&<span style={{fontSize:12,color:"#b68b2e",marginLeft:"auto"}}>R {fmt(deal.vbFee*((parseFloat(v)||0)/100))}</span>}</div>)}</Card>
      </div>
      <div>
        {!av?<Card style={{padding:48,textAlign:"center"}}><div style={{fontSize:36,color:"#8a8070",marginBottom:12}}>◆</div><p style={{color:"#8a8070"}}>Enter artwork value to begin.</p></Card>:<>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:16}}>
            <Card style={{padding:16,textAlign:"center",border:"1px solid rgba(74,158,107,0.2)"}}><div style={{fontSize:9,letterSpacing:2,color:"#8a8070",marginBottom:8}}>COLLECTOR RECEIVES</div><div style={{fontFamily:"Cormorant Garamond,serif",fontSize:28,fontWeight:400,color:"#4a9e6b"}}>R {fmt(deal.colNet||0)}</div><div style={{fontSize:10,color:"#4a9e6b",marginTop:6}}>Renter profit: R {fmt(deal.colProfit||0)} · {Math.round(deal.colROI||0)}% ROI</div></Card>
            <Card style={{padding:16,textAlign:"center",border:"1px solid rgba(182,139,46,0.50)"}}><div style={{fontSize:9,letterSpacing:2,color:"#8a8070",marginBottom:8}}>VB TOTAL</div><div style={{fontFamily:"Cormorant Garamond,serif",fontSize:28,fontWeight:400,color:"#b68b2e"}}>R {fmt(deal.vbTotal||0)}</div><div style={{fontSize:10,color:"#6b635a",marginTop:6}}>Always R {fmt(deal.vbFee||0)}</div></Card>
            <Card style={{padding:16,textAlign:"center"}}><div style={{fontSize:9,letterSpacing:2,color:"#8a8070",marginBottom:8}}>SALE PRICE</div><div style={{fontFamily:"Cormorant Garamond,serif",fontSize:28,fontWeight:400,color:"#1a1714"}}>R {fmt(sp)}</div>{aboveValue&&<div style={{fontSize:10,color:"#4a9e6b",marginTop:6}}>+R {fmt(deal.surplus||0)} above value</div>}</Card>
          </div>
          <Card style={{marginBottom:14}}>
            <div style={{fontSize:13,fontWeight:600,color:"#1a1714",marginBottom:14}}>What happens at sale — Month {mo} · {m.label}</div>
            <div style={{background:"#f0ede8",borderRadius:10,padding:"14px 16px",marginBottom:14}}><div style={{fontSize:10,letterSpacing:2,textTransform:"uppercase",color:"#8a8070",marginBottom:10}}>What you already have</div>{depositType!=="none"&&<SRow label={`Deposit (${dN}%)`} val={`R ${fmt(deal.depositAmt)}`} color="#b68b2e"/>}<SRow label={`${mo} license fee${mo>1?"s":""}`} val={`R ${fmt(deal.monthly*mo)}`} color="#b68b2e"/><SRow label="Total in your bank" val={`R ${fmt(deal.totalCollected)}`} color="#b68b2e" bold/></div>
            <div style={{background:"#f0ede8",borderRadius:10,padding:"14px 16px",marginBottom:14}}><div style={{fontSize:10,letterSpacing:2,textTransform:"uppercase",color:"#8a8070",marginBottom:10}}>From the sale</div><SRow label="Gallery commission collected" val={`− R ${fmt(deal.vbBalance)}`} color="#c45c4a" sub={`(R${fmt(deal.vbFee)} fee − R${fmt(deal.totalCollected)} collected)`}/>{deal.introFee>0&&<SRow label="Introducer fee" val={`− R ${fmt(deal.introFee)}`} color="#c45c4a"/>}{aboveValue&&<SRow label="Surplus (50/50)" val={`R ${fmt(deal.surplus)}`} color="#4a9e6b"/>}<div style={{height:1,background:"rgba(182,139,46,0.30)",margin:"10px 0"}}/><SRow label="Renter receives" val={`R ${fmt(deal.colNet)}`} color="#4a9e6b" bold/><SRow label="VB keeps" val={`R ${fmt(deal.vbAtSale)}`} color="#b68b2e" bold/></div>
            <div style={{background:"rgba(182,139,46,0.12)",border:"1px solid rgba(182,139,46,0.25)",borderRadius:10,padding:"14px 16px"}}><div style={{fontSize:10,letterSpacing:2,textTransform:"uppercase",color:"#8a8070",marginBottom:10}}>Final tally</div><SRow label="Gallery total income" val={`R ${fmt(deal.vbTotal)}`} color="#b68b2e" bold/><SRow label="Renter net income" val={`R ${fmt(deal.colProfit)}`} color="#4a9e6b" bold/><SRow label="ROI" val={`${Math.round(deal.colROI)}%`} color="#b68b2e"/></div>
          </Card>
          <Card><div style={{fontSize:13,fontWeight:600,color:"#1a1714",marginBottom:14}}>All Scenarios — {m.label}</div><div style={{overflowX:"auto",maxHeight:360,overflowY:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}><thead style={{position:"sticky",top:0,background:"#f7f5f1"}}><tr>{[["Month","left"],["Monthly Paid","right"],["VB Balance","right"],["Collector Gets","right"],["Profit","right"],["ROI","right"]].map(([h,a])=><th key={h} style={{fontSize:10,fontWeight:600,letterSpacing:1,textTransform:"uppercase",color:"#8a8070",padding:"8px 10px",borderBottom:"1px solid rgba(182,139,46,0.25)",whiteSpace:"nowrap",textAlign:a}}>{h}</th>)}</tr></thead><tbody>{scenarioMonths.map(mo2=>{const d=calcDeal(av,sp,acqModel,mo2,gN,vN,aN,iN,depositType,dN);const on=mo2===mo;return<tr key={mo2} style={{background:on?"rgba(182,139,46,0.14)":"transparent"}}><td style={{padding:"8px 10px",borderBottom:"1px solid rgba(182,139,46,0.10)",fontWeight:on?600:400,color:on?"#b68b2e":"#2a2622"}}>Mo {mo2}{on?<span style={{fontSize:9,marginLeft:4}}>◆</span>:""}</td><td style={{padding:"8px 10px",borderBottom:"1px solid rgba(182,139,46,0.10)",textAlign:"right",color:"#6b635a"}}>R {fmt(d.totalCollected)}</td><td style={{padding:"8px 10px",borderBottom:"1px solid rgba(182,139,46,0.10)",textAlign:"right",color:d.vbBalance>0?"#c45c4a":"#4a9e6b"}}>R {fmt(d.vbBalance)}</td><td style={{padding:"8px 10px",borderBottom:"1px solid rgba(182,139,46,0.10)",textAlign:"right",color:"#4a9e6b",fontWeight:600}}>R {fmt(d.colNet)}</td><td style={{padding:"8px 10px",borderBottom:"1px solid rgba(182,139,46,0.10)",textAlign:"right",color:d.colProfit>=0?"#4a9e6b":"#c45c4a"}}>R {fmt(d.colProfit)}</td><td style={{padding:"8px 10px",borderBottom:"1px solid rgba(182,139,46,0.10)",textAlign:"right",color:"#b68b2e",fontWeight:600}}>{Math.round(d.colROI)}%</td></tr>;})}
          </tbody></table></div></Card>
        </>}
      </div>
    </div>
  </div>);}

// ═══════════════════════════════════════════
// ═══════════════════════════════════════════
// INVOICING
// ═══════════════════════════════════════════
function InvoicePage({data,actions,initialFilter,clearFilter}){
  const [activeTab,setActiveTab]=useState("all");const [statusFilter,setStatusFilter]=useState(initialFilter||"all");const [payModal,setPayModal]=useState(null);const [missModal,setMissModal]=useState(null);const [overrideModal,setOverrideModal]=useState(null);const [graceModal,setGraceModal]=useState(null);const [emailModal,setEmailModal]=useState(null);const [reportTab,setReportTab]=useState(null);const [expanded,setExpanded]=useState({});const [search,setSearch]=useState("");const [pg,setPg]=useState(0);
  useEffect(()=>{if(initialFilter){setStatusFilter(initialFilter);clearFilter();}},[initialFilter]);
  const gn=c=>c?c.type==="company"?c.companyName:`${c.firstName} ${c.lastName}`:"";
  const collectorsWithSchedules=data.collectors.filter(c=>data.schedules.some(s=>s.collectorId===c.id));
  const allSchedules=data.schedules;const tabSchedules=activeTab==="all"?allSchedules:allSchedules.filter(s=>s.collectorId===activeTab);
  const filteredSchedules=tabSchedules.filter(s=>{const matchStatus=statusFilter==="all"||s.status===statusFilter;const matchSearch=!search||(s.collectorName+s.artworkTitle).toLowerCase().includes(search.toLowerCase());return matchStatus&&matchSearch;});
  const pagedSchedules=activeTab==="all"?filteredSchedules.slice(pg*PAGE_SIZE,(pg+1)*PAGE_SIZE):filteredSchedules;
  const totalPages=Math.ceil(filteredSchedules.length/PAGE_SIZE);
  const active=allSchedules.filter(s=>s.status==="Active").length;const chasing=allSchedules.filter(s=>s.status==="Chasing").length;const dispute=allSchedules.filter(s=>s.status==="In Dispute").length;const cancelledCount=allSchedules.filter(s=>s.status==="Cancelled").length;
  const totalCollected=data.payments.reduce((s,p)=>s+(p.amount||0),0);
  const toggleExpand=(id)=>setExpanded(p=>({...p,[id]:!p[id]}));
  const getNextUnpaid=(sched)=>{const paidMonths=new Set(data.payments.filter(p=>p.scheduleId===sched.id).map(p=>p.monthNumber));const missedMonths=new Set(sched.missedMonths||[]);for(let m=1;m<=sched.termMonths;m++){if(!paidMonths.has(m)&&!missedMonths.has(m))return m;}return null;};
  const getHistory=(schedId)=>data.payments.filter(p=>p.scheduleId===schedId).sort((a,b)=>a.monthNumber-b.monthNumber);
  const reportData={Chasing:allSchedules.filter(s=>s.status==="Chasing").map(s=>({...s,col:data.collectors.find(c=>c.id===s.collectorId)})),"In Dispute":allSchedules.filter(s=>s.status==="In Dispute").map(s=>({...s,col:data.collectors.find(c=>c.id===s.collectorId)})),Cancelled:allSchedules.filter(s=>s.status==="Cancelled").map(s=>({...s,col:data.collectors.find(c=>c.id===s.collectorId)}))};
  const statusBtnCfg=[{key:"all",label:"All"},{key:"Active",label:"Active",color:"#4a9e6b"},{key:"Chasing",label:"Chasing",color:"#e6be32"},{key:"In Dispute",label:"In Dispute",color:"#dc7828"},{key:"Cancelled",label:"Cancelled",color:"#c45c4a"},{key:"Complete",label:"Complete",color:"#648cc8"}];
  const buildEmailTargets=(status)=>{const scheds=allSchedules.filter(s=>s.status===status);const by={};scheds.forEach(s=>{const col=data.collectors.find(c=>c.id===s.collectorId);if(!by[s.collectorId])by[s.collectorId]={id:s.collectorId,name:s.collectorName,email:col?.email||"",schedules:[]};by[s.collectorId].schedules.push(s);});return Object.values(by);};
  const TEMPLATES_LOCAL={upcoming:(n,a,amt,due)=>({subject:`Vollard Black — Payment Reminder`,body:`Dear ${n},\n\nYour license fee of R ${fmt(amt)} for "${a}" is due on ${due}.\n\nVollard Black\nconcierge@vollardblack.com`}),missed:(n,a,amt)=>({subject:`Vollard Black — Missed Payment`,body:`Dear ${n},\n\nYour license fee of R ${fmt(amt)} for "${a}" has not been received.\n\nVollard Black\nconcierge@vollardblack.com`}),dispute:(n,a,amt)=>({subject:`Vollard Black — In Dispute`,body:`Dear ${n},\n\nYour account for "${a}" is In Dispute.\n\nVollard Black\nconcierge@vollardblack.com`}),cancelled:(n,a)=>({subject:`Vollard Black — Cancelled`,body:`Dear ${n},\n\nYour agreement for "${a}" has been cancelled.\n\nVollard Black\nconcierge@vollardblack.com`}),individual_missed:(n,a,amt)=>({subject:`Missed Payment — ${a}`,body:`Dear ${n},\n\nYour fee of R ${fmt(amt)} for "${a}" is outstanding.\n\nVollard Black`}),individual_dispute:(n,a,amt)=>({subject:`In Dispute — ${a}`,body:`Dear ${n},\n\nYour account for "${a}" is In Dispute.\n\nVollard Black`}),individual_cancelled:(n,a)=>({subject:`Cancelled — ${a}`,body:`Dear ${n},\n\nYour agreement for "${a}" has been cancelled.\n\nVollard Black`})};
  return(<div>
    <PT title="License Invoicing" sub={`${allSchedules.length} agreements · ${data.collectors.length} License Holders`}/>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))",gap:14,marginBottom:24}}><Stat label="Active" value={active} green/><Stat label="Chasing" value={chasing} orange/><Stat label="In Dispute" value={dispute} orange/><Stat label="Cancelled" value={cancelledCount} red/><Stat label="Collected" value={"R "+fmt(totalCollected)} gold/></div>
    <Card style={{marginBottom:20,padding:16}}><div style={{fontSize:11,letterSpacing:2,textTransform:"uppercase",color:"#8a8070",marginBottom:12}}>Mass Email Actions</div><div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
      <Btn small ghost onClick={()=>setEmailModal({status:"Active",templateKey:"upcoming",targets:buildEmailTargets("Active")})} style={{borderColor:"rgba(74,158,107,0.3)",color:"#4a9e6b"}}>{I.mail} Remind Active</Btn>
      <Btn small ghost onClick={()=>setEmailModal({status:"Chasing",templateKey:"missed",targets:buildEmailTargets("Chasing")})} style={{borderColor:"rgba(230,190,50,0.3)",color:"#e6be32"}}>{I.mail} Chase All</Btn>
      <Btn small ghost onClick={()=>setEmailModal({status:"In Dispute",templateKey:"dispute",targets:buildEmailTargets("In Dispute")})} style={{borderColor:"rgba(220,120,40,0.3)",color:"#dc7828"}}>{I.mail} Dispute All</Btn>
      <Btn small ghost onClick={()=>setEmailModal({status:"Cancelled",templateKey:"cancelled",targets:buildEmailTargets("Cancelled")})} style={{borderColor:"rgba(196,92,74,0.3)",color:"#c45c4a"}}>{I.mail} Cancellation All</Btn>
    </div></Card>
    <Card style={{marginBottom:20,padding:16}}><div style={{fontSize:11,letterSpacing:2,textTransform:"uppercase",color:"#8a8070",marginBottom:12}}>Monthly Report</div><div style={{display:"flex",gap:8,flexWrap:"wrap"}}>{["Chasing","In Dispute","Cancelled"].map(k=><Btn key={k} small ghost onClick={()=>setReportTab(reportTab===k?null:k)} style={{borderColor:k==="Chasing"?"rgba(230,190,50,0.3)":k==="In Dispute"?"rgba(220,120,40,0.3)":"rgba(196,92,74,0.3)",color:k==="Chasing"?"#e6be32":k==="In Dispute"?"#dc7828":"#c45c4a"}}>{I.report} {k} ({reportData[k].length})</Btn>)}</div>
    {reportTab&&<div style={{marginTop:16,borderTop:"1px solid rgba(182,139,46,0.18)",paddingTop:16}}><div style={{fontSize:13,fontWeight:600,color:"#1a1714",marginBottom:12}}>{reportTab} — {reportData[reportTab].length}</div>{reportData[reportTab].length===0?<p style={{fontSize:13,color:"#8a8070"}}>None.</p>:<Tbl cols={[{label:"Collector",bold:true,render:r=>r.collectorName},{label:"Model",render:r=><Badge model={r.acquisitionModel||"O1"}/>},{label:"Email",render:r=>r.col?.email||"—"},{label:"Mobile",render:r=>r.col?.mobile||"—"},{label:"Artwork",key:"artworkTitle"},{label:"Strikes",render:r=><span style={{color:"#c45c4a",fontWeight:700}}>{r.strikes}</span>},{label:"Outstanding",right:true,render:r=>"R "+fmt((r.totalDue||0)-(r.totalPaid||0))},{label:"",render:r=>{const col=data.collectors.find(c=>c.id===r.collectorId);const tplKey=reportTab==="Chasing"?"individual_missed":reportTab==="In Dispute"?"individual_dispute":"individual_cancelled";const tpl=TEMPLATES_LOCAL[tplKey](r.collectorName,r.artworkTitle,(r.totalDue||0)-(r.totalPaid||0));return<Btn small ghost onClick={()=>openGmail([col?.email||""],tpl.subject,tpl.body)} style={{fontSize:10}}>{I.mail}</Btn>;}}]} data={reportData[reportTab]}/>}</div>}
    </Card>
    <div style={{display:"flex",gap:0,marginBottom:20,borderBottom:"1px solid rgba(182,139,46,0.20)",overflowX:"auto"}}>
      <button onClick={()=>{setActiveTab("all");setPg(0);}} style={{padding:"12px 20px",border:"none",borderBottom:activeTab==="all"?"2px solid #b68b2e":"2px solid transparent",background:"transparent",color:activeTab==="all"?"#b68b2e":"#6b635a",fontSize:12,fontWeight:activeTab==="all"?600:400,cursor:"pointer",fontFamily:"DM Sans,sans-serif",whiteSpace:"nowrap"}}>All <span style={{marginLeft:6,fontSize:10,background:"rgba(182,139,46,0.20)",color:"#b68b2e",padding:"2px 7px",borderRadius:10}}>{allSchedules.length}</span></button>
      {collectorsWithSchedules.map(c=>{const cScheds=allSchedules.filter(s=>s.collectorId===c.id);const alerts=cScheds.filter(s=>["Chasing","In Dispute","Cancelled"].includes(s.status)).length;const isActive=activeTab===c.id;return<button key={c.id} onClick={()=>{setActiveTab(c.id);setPg(0);}} style={{padding:"12px 20px",border:"none",borderBottom:isActive?"2px solid #b68b2e":"2px solid transparent",background:"transparent",color:isActive?"#b68b2e":"#6b635a",fontSize:12,fontWeight:isActive?600:400,cursor:"pointer",fontFamily:"DM Sans,sans-serif",whiteSpace:"nowrap",display:"inline-flex",alignItems:"center",gap:6}}>{gn(c)}{alerts>0&&<span style={{fontSize:10,background:"rgba(196,92,74,0.15)",color:"#c45c4a",padding:"2px 7px",borderRadius:10,fontWeight:700}}>{alerts}</span>}</button>;})}
    </div>
    <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap",alignItems:"center"}}>{statusBtnCfg.map(b=><button key={b.key} onClick={()=>{setStatusFilter(b.key);setPg(0);}} style={{padding:"7px 14px",borderRadius:8,border:`1px solid ${statusFilter===b.key?(b.color||"#b68b2e"):"rgba(182,139,46,0.30)"}`,background:statusFilter===b.key?"rgba(182,139,46,0.18)":"transparent",color:statusFilter===b.key?(b.color||"#b68b2e"):"#6b635a",fontSize:11,fontWeight:statusFilter===b.key?600:400,cursor:"pointer",fontFamily:"DM Sans,sans-serif"}}>{b.label}</button>)}<input placeholder="Search..." value={search} onChange={e=>{setSearch(e.target.value);setPg(0);}} style={{...is,maxWidth:260,marginLeft:"auto",padding:"8px 12px",fontSize:12}}/></div>
    {pagedSchedules.length===0?<Empty msg="No schedules match this filter."/>:pagedSchedules.map(sched=>{
      const m=MODELS[sched.acquisitionModel||"O1"];const pct=sched.termMonths>0?(sched.monthsPaid/sched.termMonths)*100:100;const nextMonth=getNextUnpaid(sched);const nextDue=nextMonth?getNextDueDate(sched.startDate,nextMonth):null;const outstanding=(sched.totalDue||0)-(sched.totalPaid||0);const history=getHistory(sched.id);const isExpanded=expanded[sched.id];const sc=schedC[sched.status]||{bg:"#e8e4dd",c:"#6b635a"};const art=data.artworks.find(a=>a.id===sched.artworkId);const missedSet=new Set(sched.missedMonths||[]);
      return<Card key={sched.id} style={{marginBottom:12,padding:0,overflow:"hidden"}}>
        <div style={{height:3,background:sc.c,opacity:0.6}}/>
        <div style={{padding:20}}>
          <div style={{display:"flex",gap:16,alignItems:"flex-start"}}>
            <div style={{width:52,height:52,borderRadius:8,flexShrink:0,overflow:"hidden",background:"rgba(182,139,46,0.18)",display:"flex",alignItems:"center",justifyContent:"center"}}>{art?.imageUrl?<img src={art.imageUrl} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<span style={{fontSize:18,color:"#8a8070"}}>◆</span>}</div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap",marginBottom:4}}>{activeTab==="all"&&<span style={{fontSize:15,fontWeight:700,color:"#1a1714"}}>{sched.collectorName}</span>}<span style={{fontSize:13,color:"#6b635a"}}>{sched.artworkTitle}</span><Badge model={sched.acquisitionModel||"O1"}/><Badge status={sched.status} sched/>{sched.strikes>0&&<span style={{fontSize:11,color:"#c45c4a",fontWeight:700}}>⚠ {sched.strikes} strike{sched.strikes>1?"s":""}</span>}</div>
              <div style={{display:"flex",gap:16,fontSize:12,color:"#6b635a",marginBottom:8,flexWrap:"wrap"}}><span>Month <strong style={{color:"#1a1714"}}>{sched.monthsPaid}</strong> of {sched.termMonths}</span><span style={{color:"#b68b2e",fontWeight:600}}>R {fmt(sched.monthlyAmount)} per month</span>{nextDue&&<span>Next due: <strong style={{color:"#1a1714"}}>{nextDue}</strong></span>}</div>
              <div style={{display:"flex",gap:20,fontSize:12,marginBottom:8}}><span>Paid: <strong style={{color:"#4a9e6b"}}>R {fmt(sched.totalPaid||0)}</strong></span><span>Outstanding: <strong style={{color:"#b68b2e"}}>R {fmt(outstanding)}</strong></span><span>Total: <strong style={{color:"#1a1714"}}>R {fmt(sched.totalDue)}</strong></span></div>
              <ProgressBar pct={pct} color={sc.c}/>
              {missedSet.size>0&&<div style={{marginTop:8,display:"flex",gap:6,flexWrap:"wrap"}}>{[...missedSet].map(m=><span key={m} style={{fontSize:10,background:"rgba(196,92,74,0.12)",color:"#c45c4a",padding:"3px 8px",borderRadius:5,fontWeight:600}}>Mo {m} missed</span>)}</div>}
            </div>
            <div style={{display:"flex",gap:6,flexShrink:0,flexWrap:"wrap",justifyContent:"flex-end",maxWidth:300}}>
              {nextMonth&&sched.status!=="Cancelled"&&sched.status!=="Complete"&&<><Btn small gold onClick={()=>setPayModal({sched,nextMonth,nextDue})}>{I.ok} Pay Mo {nextMonth}</Btn><Btn small danger onClick={()=>setMissModal({sched,nextMonth})}>Miss Mo {nextMonth}</Btn></>}
              {["Chasing","In Dispute","Cancelled"].includes(sched.status)&&<Btn small ghost onClick={()=>setOverrideModal(sched)} style={{borderColor:"rgba(160,100,220,0.3)",color:"#a064dc"}}>Override</Btn>}
              <Btn small ghost onClick={()=>setGraceModal(sched)}>Grace</Btn>
              <button onClick={()=>toggleExpand(sched.id)} style={{background:"none",border:"1px solid rgba(182,139,46,0.30)",borderRadius:6,color:"#6b635a",cursor:"pointer",padding:"6px 10px",display:"flex",alignItems:"center",gap:4,fontSize:11}}><span style={{transform:isExpanded?"rotate(180deg)":"none",transition:"0.2s",display:"inline-flex"}}>{I.chevron}</span>{history.length} paid</button>
            </div>
          </div>
          {isExpanded&&<div style={{marginTop:16,borderTop:"1px solid rgba(182,139,46,0.14)",paddingTop:16}}>{history.length===0?<p style={{fontSize:13,color:"#8a8070"}}>No payments recorded yet.</p>:<Tbl cols={[{label:"Month",render:r=>`Month ${r.monthNumber}`},{label:"Date",key:"date"},{label:"Method",key:"method"},{label:"Amount",right:true,gold:true,render:r=>"R "+fmt(r.amount)}]} data={history}/>}{sched.graceNote&&<p style={{fontSize:12,color:"#a064dc",marginTop:8}}>Grace: {sched.graceNote}</p>}{sched.overrideNote&&<p style={{fontSize:12,color:"#a064dc",marginTop:4}}>Override: {sched.overrideNote}</p>}</div>}
        </div>
      </Card>;})}
    {activeTab==="all"&&totalPages>1&&<div style={{display:"flex",justifyContent:"center",gap:8,marginTop:20}}><Btn small ghost disabled={pg===0} onClick={()=>setPg(p=>p-1)}>← Prev</Btn><span style={{padding:"8px 16px",fontSize:13,color:"#6b635a"}}>Page {pg+1} of {totalPages}</span><Btn small ghost disabled={pg>=totalPages-1} onClick={()=>setPg(p=>p+1)}>Next →</Btn></div>}
    {payModal&&<Modal title={`Record Payment — Month ${payModal.nextMonth}`} onClose={()=>setPayModal(null)}><Card style={{background:"#e8e4dd",marginBottom:16}}><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,fontSize:13}}><span style={{color:"#6b635a"}}>License Holder:</span><span style={{fontWeight:600}}>{payModal.sched.collectorName}</span><span style={{color:"#6b635a"}}>Artwork:</span><span>{payModal.sched.artworkTitle}</span><span style={{color:"#6b635a"}}>Month:</span><span>{payModal.nextMonth} of {payModal.sched.termMonths}</span><span style={{color:"#6b635a"}}>Amount:</span><span style={{color:"#b68b2e",fontWeight:700,fontSize:16}}>R {fmt(payModal.sched.monthlyAmount)}</span></div></Card><div style={{fontSize:11,letterSpacing:2,textTransform:"uppercase",color:"#8a8070",marginBottom:10}}>Payment Method</div>{["EFT / Bank Transfer","PayFast","Crypto (USDT)","Cash","Other"].map(m=><button key={m} onClick={()=>{actions.recordPayment(payModal.sched,payModal.nextMonth,m,payModal.sched.monthlyAmount);setPayModal(null);}} style={{display:"block",width:"100%",padding:12,marginBottom:8,borderRadius:8,border:"1px solid rgba(182,139,46,0.30)",background:"#e8e4dd",color:"#2a2622",cursor:"pointer",fontSize:13,fontFamily:"DM Sans,sans-serif",textAlign:"left"}} onMouseEnter={e=>{e.currentTarget.style.background="#252320";}} onMouseLeave={e=>{e.currentTarget.style.background="#e8e4dd";}}>{m}</button>)}</Modal>}
    {missModal&&<Modal title={`Mark Month ${missModal.nextMonth} as Missed`} onClose={()=>setMissModal(null)}><div style={{padding:16,background:"rgba(196,92,74,0.08)",border:"1px solid rgba(196,92,74,0.2)",borderRadius:10,marginBottom:20}}><div style={{fontSize:13,color:"#2a2622",marginBottom:6}}><strong>{missModal.sched.collectorName}</strong> — {missModal.sched.artworkTitle}</div><div style={{fontSize:12,color:"#6b635a",marginTop:4}}>Strikes: {missModal.sched.strikes} → {Math.min((missModal.sched.strikes||0)+1,3)} · New status: <strong style={{color:"#c45c4a"}}>{(missModal.sched.strikes||0)+1===1?"Chasing":(missModal.sched.strikes||0)+1===2?"In Dispute":"Cancelled"}</strong></div></div><div style={{display:"flex",gap:10,justifyContent:"flex-end"}}><Btn ghost onClick={()=>setMissModal(null)}>Cancel</Btn><Btn danger onClick={()=>{actions.recordMissed(missModal.sched,missModal.nextMonth);setMissModal(null);}}>Confirm Miss Mo {missModal.nextMonth}</Btn></div></Modal>}
    {overrideModal&&<OverrideModal sched={overrideModal} onSave={(note)=>{actions.overrideSchedule(overrideModal.id,note);setOverrideModal(null);}} onClose={()=>setOverrideModal(null)}/>}
    {graceModal&&<GraceModal sched={graceModal} onSave={(date,month,note)=>{actions.setGraceException(graceModal.id,date,month,note);setGraceModal(null);}} onClose={()=>setGraceModal(null)}/>}
    {emailModal&&<EmailReviewModal config={emailModal} collectors={data.collectors} schedules={data.schedules} onClose={()=>setEmailModal(null)} TEMPLATES_LOCAL={TEMPLATES_LOCAL}/>}
  </div>);}

function OverrideModal({sched,onSave,onClose}){const [note,setNote]=useState("");return<Modal title="Override Status" onClose={onClose}><p style={{fontSize:13,color:"#6b635a",marginBottom:16}}>Resets to Active and clears all strikes.</p><Field label="Note"><textarea value={note} onChange={e=>setNote(e.target.value)} style={{...is,minHeight:80,resize:"vertical"}} placeholder="e.g. Collector settled balance"/></Field><div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:16}}><Btn ghost onClick={onClose}>Cancel</Btn><Btn gold onClick={()=>onSave(note)} disabled={!note}>Apply Override</Btn></div></Modal>;}
function GraceModal({sched,onSave,onClose}){const [graceDate,setGraceDate]=useState("");const [month,setMonth]=useState(sched.monthsPaid+1);const [note,setNote]=useState("");return<Modal title="Set Grace Exception" onClose={onClose}><Field label="Month Number"><input type="text" inputMode="decimal" value={month} onChange={e=>setMonth(Number(e.target.value))} style={is}/></Field><Field label="Extended Grace Date"><input type="date" value={graceDate} onChange={e=>setGraceDate(e.target.value)} style={is}/></Field><Field label="Reason"><textarea value={note} onChange={e=>setNote(e.target.value)} style={{...is,minHeight:60,resize:"vertical"}}/></Field><div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:16}}><Btn ghost onClick={onClose}>Cancel</Btn><Btn gold onClick={()=>onSave(graceDate,month,note)} disabled={!graceDate||!note}>Set Exception</Btn></div></Modal>;}

function EmailReviewModal({config,collectors,schedules,onClose,TEMPLATES_LOCAL}){
  const isCustom=config.status==="custom";const [selected,setSelected]=useState(isCustom?[]:config.targets.map(t=>t.id));const [templateKey,setTemplateKey]=useState(config.templateKey||"upcoming");const [subject,setSubject]=useState("");const [body,setBody]=useState("");
  const gn=c=>c.type==="company"?c.companyName:`${c.firstName} ${c.lastName}`;
  const targets=isCustom?collectors.filter(c=>c.email).map(c=>{const s=schedules.find(x=>x.collectorId===c.id);return{id:c.id,name:gn(c),email:c.email,schedules:s?[s]:[]};})  :config.targets;
  const toggle=(id)=>setSelected(p=>p.includes(id)?p.filter(x=>x!==id):[...p,id]);
  const firstSelected=targets.find(t=>selected.includes(t.id));
  useEffect(()=>{if(!firstSelected)return;const s=firstSelected.schedules[0];const tpl=s?TEMPLATES_LOCAL[templateKey]?.(firstSelected.name,s.artworkTitle,s.monthlyAmount,getNextDueDate(s.startDate,s.monthsPaid+1)):TEMPLATES_LOCAL[templateKey]?.(firstSelected.name,"",0,"");if(tpl){setSubject(tpl.subject||"");setBody(tpl.body||"");}},[templateKey,firstSelected?.id]);
  const send=()=>{const emails=selected.map(id=>targets.find(t=>t.id===id)?.email).filter(Boolean);if(emails.length===0)return alert("No recipients.");openGmail(emails,subject,body);onClose();};
  return<Modal title="Review & Send Email" onClose={onClose} wide><div style={{display:"grid",gridTemplateColumns:"280px 1fr",gap:20}}><div><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}><div style={{fontSize:11,letterSpacing:2,textTransform:"uppercase",color:"#8a8070"}}>Recipients ({selected.length})</div><div style={{display:"flex",gap:8}}><button onClick={()=>setSelected(targets.map(t=>t.id))} style={{background:"none",border:"none",color:"#b68b2e",cursor:"pointer",fontSize:11}}>All</button><button onClick={()=>setSelected([])} style={{background:"none",border:"none",color:"#6b635a",cursor:"pointer",fontSize:11}}>None</button></div></div><div style={{maxHeight:300,overflowY:"auto",border:"1px solid rgba(182,139,46,0.20)",borderRadius:8}}>{targets.length===0?<div style={{padding:16,fontSize:13,color:"#8a8070",textAlign:"center"}}>No collectors.</div>:targets.map(t=><label key={t.id} style={{display:"flex",alignItems:"flex-start",gap:10,padding:"10px 12px",cursor:"pointer",borderBottom:"1px solid rgba(182,139,46,0.10)"}}><input type="checkbox" checked={selected.includes(t.id)} onChange={()=>toggle(t.id)} style={{accentColor:"#b68b2e",marginTop:2,flexShrink:0}}/><div style={{minWidth:0}}><div style={{fontSize:13,fontWeight:600,color:"#1a1714"}}>{t.name}</div><div style={{fontSize:11,color:"#8a8070",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.email}</div></div></label>)}</div><div style={{fontSize:11,color:"#8a8070",marginTop:8}}>All BCC'd.</div></div><div><Field label="Template"><select value={templateKey} onChange={e=>setTemplateKey(e.target.value)} style={ss}><option value="upcoming">Upcoming Reminder</option><option value="missed">Missed Payment</option><option value="dispute">Dispute Escalation</option><option value="cancelled">Cancellation Notice</option></select></Field><Field label="Subject"><input value={subject} onChange={e=>setSubject(e.target.value)} style={is}/></Field><Field label="Message"><textarea value={body} onChange={e=>setBody(e.target.value)} style={{...is,minHeight:160,resize:"vertical"}}/></Field></div></div><div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:16,borderTop:"1px solid rgba(182,139,46,0.18)",paddingTop:16}}><Btn ghost onClick={onClose}>Cancel</Btn><Btn gold disabled={selected.length===0||!subject} onClick={send}>{I.mail} Open Gmail ({selected.length})</Btn></div></Modal>;}

// ═══════════════════════════════════════════
// SALES
// ═══════════════════════════════════════════
function SalesPage({data,actions}){
  const [modal,setModal]=useState(false);const [settlementModal,setSettlementModal]=useState(null);
  const sellable=data.artworks.filter(a=>["Reserved","In Gallery","Available"].includes(a.status));
  return(<div>
    <PT title="Sales" sub={`${data.sales.length} completed`} action={<Btn gold onClick={()=>setModal(true)}>{I.plus} Record Sale</Btn>}/>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:14,marginBottom:24}}><Stat label="Sales" value={data.sales.length}/><Stat label="Total Value" value={"R "+fmt(data.sales.reduce((s,x)=>s+(x.salePrice||0),0))}/><Stat label="Signature" value={data.sales.filter(s=>s.acquisitionModel==="O1").length} gold/><Stat label="Premier" value={data.sales.filter(s=>s.acquisitionModel==="O2").length} green/><Stat label="Select" value={data.sales.filter(s=>s.acquisitionModel==="O3").length}/><Stat label="Collector Payouts" value={"R "+fmt(data.sales.reduce((s,x)=>s+(x.colNet||x.collectorShare||0),0))} green/></div>
    <Card>{data.sales.length===0?<Empty msg="No sales yet." action={<Btn gold onClick={()=>setModal(true)}>{I.plus} Record Sale</Btn>}/>:<Tbl cols={[{label:"Date",key:"date"},{label:"Artwork",key:"artworkTitle",bold:true},{label:"Model",render:r=><Badge model={r.acquisitionModel||"O1"}/>},{label:"Collector",key:"collectorName"},{label:"Buyer",render:r=>r.buyerName?<span style={{color:"#b68b2e"}}>{r.buyerName}</span>:<span style={{color:"#8a8070"}}>—</span>},{label:"Sale Price",right:true,render:r=>"R "+fmt(r.salePrice)},{label:"Collector Net",right:true,render:r=><span style={{color:"#4a9e6b",fontWeight:600}}>R {fmt(r.colNet||r.collectorShare||0)}</span>},{label:"VB Total",right:true,gold:true,render:r=>"R "+fmt(r.vbTotal||r.vbShare||0)},{label:"",render:r=><div style={{display:"flex",gap:6}}><button onClick={e=>{e.stopPropagation();setSettlementModal(r);}} style={{background:"none",border:"none",color:"#b68b2e",cursor:"pointer",fontSize:11,textDecoration:"underline"}}>Sheet</button><button onClick={e=>{e.stopPropagation();if(confirm("Delete sale?"))actions.deleteSale(r.id);}} style={{background:"none",border:"none",color:"#8a8070",cursor:"pointer"}}>{I.del}</button></div>}]} data={[...data.sales].reverse()}/>}</Card>
    {modal&&<SaleMdl data={data} sellable={sellable} onSale={(sd)=>{actions.recordSale(sd);setModal(false);}} onClose={()=>setModal(false)}/>}
    {settlementModal&&<SettlementModal sale={settlementModal} data={data} onClose={()=>setSettlementModal(null)}/>}
  </div>);}

function SettlementModal({sale,data,onClose}){
  const [galleryPct,setGalleryPct]=useState("40");const [vbPct,setVbPct]=useState("30");const [artistPct,setArtistPct]=useState("30");const [introPct,setIntroPct]=useState("0");
  const sched=data.schedules.find(s=>s.artworkId===sale.artworkId);const art=data.artworks.find(a=>a.id===sale.artworkId);
  const acqModel=sched?.acquisitionModel||sale.acquisitionModel||"O1";const artworkValue=art?.recommendedPrice||sale.salePrice;const monthsPaid=sched?.monthsPaid||0;
  const gN=parseFloat(galleryPct)||0;const vN=parseFloat(vbPct)||0;const aN=parseFloat(artistPct)||0;const iN=parseFloat(introPct)||0;
  const splitOk=Math.round(gN+vN+aN)===100;const deal=calcDeal(artworkValue,sale.salePrice,acqModel,monthsPaid,gN,vN,aN,iN);
  return<Modal title="Deal Settlement Sheet" onClose={onClose} wide>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,marginBottom:20}}>
      <div><div style={{fontSize:15,fontWeight:600,color:"#1a1714"}}>{sale.artworkTitle}</div><div style={{fontSize:12,color:"#6b635a",marginTop:8}}>License Holder: {sale.collectorName||"—"}</div><div style={{fontSize:12,color:"#6b635a"}}>Buyer: {sale.buyerName||"—"}</div><div style={{display:"flex",gap:8,marginTop:8,alignItems:"center"}}><Badge model={acqModel}/><span style={{fontSize:12,color:"#6b635a"}}>{monthsPaid} months paid</span></div></div>
      <div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,fontSize:13}}><span style={{color:"#6b635a"}}>Artwork value:</span><span style={{textAlign:"right"}}>R {fmt(artworkValue)}</span><span style={{color:"#6b635a"}}>Sale price:</span><span style={{textAlign:"right",fontWeight:600}}>R {fmt(sale.salePrice)}</span>{deal.surplus>0&&<><span style={{color:"#6b635a"}}>Surplus:</span><span style={{textAlign:"right",color:"#b68b2e"}}>R {fmt(deal.surplus)}</span></>}</div></div>
    </div>
    <Card style={{background:"#e8e4dd",marginBottom:16}}><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,fontSize:14}}><span style={{color:"#6b635a"}}>Gallery commission ({Math.round(MODELS[acqModel].vbPct*100)}%):</span><span style={{textAlign:"right",color:"#b68b2e"}}>R {fmt(deal.vbFee)}</span><span style={{color:"#6b635a"}}>Already collected:</span><span style={{textAlign:"right"}}>R {fmt(deal.totalCollected)}</span><span style={{color:"#6b635a"}}>Balance at sale:</span><span style={{textAlign:"right",color:"#c45c4a"}}>R {fmt(deal.vbBalance)}</span><div style={{gridColumn:"1/-1",height:1,background:"rgba(182,139,46,0.20)",margin:"4px 0"}}/><span style={{color:"#4a9e6b",fontWeight:700,fontSize:16}}>License Holder receives:</span><span style={{textAlign:"right",color:"#4a9e6b",fontWeight:700,fontFamily:"Cormorant Garamond,serif",fontSize:22}}>R {fmt(deal.colNet)}</span><span style={{color:"#6b635a",fontSize:12}}>Profit:</span><span style={{textAlign:"right",fontSize:12,color:"#4a9e6b"}}>R {fmt(deal.colProfit)} ({Math.round(deal.colROI)}% ROI)</span></div></Card>
    <div style={{marginBottom:16}}><div style={{fontSize:11,letterSpacing:2,textTransform:"uppercase",color:"#8a8070",marginBottom:10}}>Internal Split — VB's R {fmt(deal.vbTotal)}</div>{!splitOk&&<div style={{fontSize:11,color:"#c45c4a",marginBottom:8}}>⚠ Must total 100%</div>}<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>{[["Gallery",galleryPct,setGalleryPct],["Vollard Black",vbPct,setVbPct],["Artist",artistPct,setArtistPct]].map(([l,v,sv])=><div key={l} style={{background:"#e8e4dd",borderRadius:8,padding:12}}><div style={{fontSize:11,color:"#8a8070",marginBottom:6}}>{l}</div><div style={{display:"flex",alignItems:"center",gap:8}}><input type="text" inputMode="decimal" value={v} onChange={e=>sv(e.target.value)} style={{...is,width:60,padding:"6px 8px",fontSize:13}} placeholder="0"/><span style={{fontSize:12,color:"#8a8070"}}>%</span><span style={{fontSize:14,fontWeight:600,color:"#b68b2e",marginLeft:"auto"}}>R {fmt(deal.vbTotal*((parseFloat(v)||0)/100))}</span></div></div>)}<div style={{background:"#e8e4dd",borderRadius:8,padding:12}}><div style={{fontSize:11,color:"#8a8070",marginBottom:6}}>Introducer Fee</div><div style={{display:"flex",alignItems:"center",gap:8}}><input type="text" inputMode="decimal" value={introPct} onChange={e=>setIntroPct(e.target.value)} style={{...is,width:60,padding:"6px 8px",fontSize:13}} placeholder="0"/><span style={{fontSize:12,color:"#8a8070"}}>%</span><span style={{fontSize:14,fontWeight:600,color:"#c45c4a",marginLeft:"auto"}}>R {fmt(deal.introFee)}</span></div></div></div></div>
    <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}><Btn ghost onClick={onClose}>Close</Btn><Btn gold onClick={()=>generateSettlementPDF(sale,artworkValue,monthsPaid,acqModel,gN,vN,aN,iN)}>{I.pdf} Download PDF</Btn></div>
  </Modal>;}

function SaleMdl({data,sellable,onSale,onClose}){
  const [artId,setArtId]=useState("");const [salePrice,setSalePrice]=useState("");const [buyerId,setBuyerId]=useState("");const [newBuyer,setNewBuyer]=useState(false);const [nb,setNb]=useState({type:"individual",firstName:"",lastName:"",companyName:"",email:"",mobile:"",nationality:"",idNumber:""});
  const art=data.artworks.find(a=>a.id===artId);const sched=art?data.schedules.find(s=>s.artworkId===artId&&s.status!=="Cancelled"):null;const col=sched?data.collectors.find(c=>c.id===sched.collectorId):null;
  const gn=c=>c?(c.type==="company"?c.companyName:`${c.firstName} ${c.lastName}`):"—";const acqModel=sched?.acquisitionModel||"O1";const m=MODELS[acqModel];const artworkValue=art?.recommendedPrice||0;const sp=Number(salePrice)||artworkValue;const monthsPaid=sched?.monthsPaid||0;
  const deal=artworkValue>0?calcDeal(artworkValue,sp,acqModel,monthsPaid,40,30,30,0):{};
  const resolvedBuyerName=newBuyer?(nb.type==="company"?nb.companyName:`${nb.firstName} ${nb.lastName}`):data.buyers.find(b=>b.id===buyerId)?buyerName(data.buyers.find(b=>b.id===buyerId)):"";
  return(<Modal title="Record Sale" onClose={onClose} wide>
    <Field label="Artwork"><select value={artId} onChange={e=>setArtId(e.target.value)} style={ss}><option value="">—</option>{sellable.map(a=>{const s=data.schedules.find(x=>x.artworkId===a.id);return<option key={a.id} value={a.id}>{a.title} — R {fmt(a.recommendedPrice)} {s?`(${MODELS[s.acquisitionModel||"O1"].label})`:""}</option>;})}</select></Field>
    {art&&<>{sched&&<div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16,padding:"10px 14px",background:"#e8e4dd",borderRadius:8}}><Badge model={acqModel}/><span style={{fontSize:13,color:"#6b635a"}}>{monthsPaid} months paid · R {fmt(sched.totalPaid||0)} collected</span><span style={{fontSize:13,color:"#b68b2e",marginLeft:"auto"}}>VB balance: R {fmt(deal.vbBalance||0)}</span></div>}
    <Field label="Sale Price (R)"><input type="text" inputMode="decimal" value={salePrice} onChange={e=>setSalePrice(e.target.value)} style={is} placeholder={fmt(artworkValue)}/></Field>
    <div style={{marginBottom:16}}><label style={{display:"block",fontSize:10,fontWeight:500,letterSpacing:2,textTransform:"uppercase",color:"#6b635a",marginBottom:8}}>End Buyer</label><div style={{display:"flex",gap:8,marginBottom:10}}><button onClick={()=>setNewBuyer(false)} style={{flex:1,padding:10,borderRadius:8,border:!newBuyer?"2px solid #b68b2e":"1px solid rgba(182,139,46,0.30)",background:!newBuyer?"rgba(182,139,46,0.18)":"#e8e4dd",color:!newBuyer?"#b68b2e":"#6b635a",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"DM Sans,sans-serif"}}>Existing Buyer</button><button onClick={()=>{setNewBuyer(true);setBuyerId("");}} style={{flex:1,padding:10,borderRadius:8,border:newBuyer?"2px solid #b68b2e":"1px solid rgba(182,139,46,0.30)",background:newBuyer?"rgba(182,139,46,0.18)":"#e8e4dd",color:newBuyer?"#b68b2e":"#6b635a",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"DM Sans,sans-serif"}}>Register New</button></div>
    {!newBuyer&&<select value={buyerId} onChange={e=>setBuyerId(e.target.value)} style={ss}><option value="">— No buyer / select later</option>{data.buyers.map(b=><option key={b.id} value={b.id}>{buyerName(b)}{b.email?` · ${b.email}`:""}</option>)}</select>}
    {newBuyer&&<div style={{background:"#e8e4dd",border:"1px solid rgba(182,139,46,0.20)",borderRadius:10,padding:14}}><div style={{fontSize:11,color:"#b68b2e",marginBottom:10,letterSpacing:1}}>NEW BUYER</div><div style={{display:"flex",gap:8,marginBottom:10}}>{[["individual","Individual"],["company","Company"]].map(([id,l])=><button key={id} onClick={()=>setNb(p=>({...p,type:id}))} style={{flex:1,padding:8,borderRadius:8,border:nb.type===id?"2px solid #b68b2e":"1px solid rgba(182,139,46,0.30)",background:nb.type===id?"rgba(182,139,46,0.18)":"transparent",color:nb.type===id?"#b68b2e":"#6b635a",fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"DM Sans,sans-serif"}}>{l}</button>)}</div>{nb.type==="company"?<input value={nb.companyName} onChange={e=>setNb(p=>({...p,companyName:e.target.value}))} placeholder="Company Name" style={{...is,marginBottom:8}}/>:<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}><input value={nb.firstName} onChange={e=>setNb(p=>({...p,firstName:e.target.value}))} placeholder="First Name" style={is}/><input value={nb.lastName} onChange={e=>setNb(p=>({...p,lastName:e.target.value}))} placeholder="Last Name" style={is}/></div>}<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}><input value={nb.email} onChange={e=>setNb(p=>({...p,email:e.target.value}))} placeholder="Email" style={is}/><input value={nb.mobile} onChange={e=>setNb(p=>({...p,mobile:e.target.value}))} placeholder="Mobile" style={is}/></div></div>}
    </div>
    {artworkValue>0&&<Card style={{background:"#e8e4dd",marginTop:4}}><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,fontSize:14}}><span style={{color:"#6b635a"}}>Sale price:</span><span style={{fontWeight:600}}>R {fmt(sp)}</span><span style={{color:"#6b635a"}}>License Holder:</span><span>{gn(col)}</span><div style={{gridColumn:"1/-1",height:1,background:"rgba(182,139,46,0.20)",margin:"4px 0"}}/><span style={{color:"#4a9e6b",fontWeight:700}}>LH receives:</span><span style={{color:"#4a9e6b",fontWeight:700,fontFamily:"Cormorant Garamond,serif",fontSize:18}}>R {fmt(deal.colNet||0)}</span><span style={{color:"#b68b2e",fontWeight:600}}>Gallery total:</span><span style={{color:"#b68b2e",fontWeight:700,fontFamily:"Cormorant Garamond,serif",fontSize:18}}>R {fmt(deal.vbTotal||0)}</span></div></Card>}
    </>}
    <div style={{display:"flex",gap:10,marginTop:20,justifyContent:"flex-end"}}><Btn ghost onClick={onClose}>Cancel</Btn><Btn gold disabled={!artId} onClick={()=>{let finalBuyerId=buyerId;let finalBuyerName=resolvedBuyerName;let newBuyerData=null;if(newBuyer&&resolvedBuyerName.trim()){finalBuyerId=uid();finalBuyerName=resolvedBuyerName;newBuyerData={...nb,id:finalBuyerId};}onSale({artworkId:artId,artworkTitle:art.title,acquisitionModel:acqModel,collectorId:col?.id,collectorName:gn(col),buyerId:finalBuyerId||null,buyerName:finalBuyerName||null,newBuyerData,salePrice:sp,artworkValue,monthsPaid,colNet:deal.colNet||0,colProfit:deal.colProfit||0,colROI:deal.colROI||0,vbTotal:deal.vbTotal||0,vbBalance:deal.vbBalance||0,collectorShare:deal.colNet||0,vbShare:deal.vbFee||0,galleryShare:deal.galleryAmt||0,vbNet:deal.vbAmt||0,artistShare:deal.artistAmt||0});}}>Confirm Sale</Btn></div>
  </Modal>);}

// ═══════════════════════════════════════════
// REPORTS
// ═══════════════════════════════════════════
function ReportsPage({data,actions}){
  const [selectedMonth,setSelectedMonth]=useState(null);const [yearFilter,setYearFilter]=useState(new Date().getFullYear().toString());
  const generateMonthList=()=>{const months=[];const now=new Date();let start=new Date(now.getFullYear()-1,0,1);const earliest=(data.schedules||[]).reduce((min,s)=>(!min||s.startDate<min)?s.startDate:min,null);if(earliest)start=new Date(earliest.slice(0,7)+"-01");const cur=new Date(start);while(cur<=now){months.push(cur.toISOString().slice(0,7));cur.setMonth(cur.getMonth()+1);}return months.reverse();};
  const monthList=generateMonthList();const years=[...new Set(monthList.map(m=>m.slice(0,4)))];const filteredMonths=monthList.filter(m=>m.startsWith(yearFilter));const getReport=(ym)=>data.reports.find(r=>r.month===ym);const locked=(ym)=>isReportLocked(ym);
  return(<div>
    <PT title="Reports" sub="Monthly snapshots — permanent record"/>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:14,marginBottom:28}}><Stat label="Generated" value={data.reports.length} gold/><Stat label="Locked" value={data.reports.filter(r=>r.locked).length}/><Stat label="Total Collected" value={"R "+fmt(data.reports.reduce((s,r)=>s+(r.totalCollected||0),0))} green/></div>
    <div style={{display:"flex",gap:8,marginBottom:20,flexWrap:"wrap",alignItems:"center"}}>{years.map(y=><button key={y} onClick={()=>setYearFilter(y)} style={{padding:"8px 18px",borderRadius:8,border:yearFilter===y?"2px solid #b68b2e":"1px solid rgba(182,139,46,0.30)",background:yearFilter===y?"rgba(182,139,46,0.18)":"transparent",color:yearFilter===y?"#b68b2e":"#6b635a",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"DM Sans,sans-serif"}}>{y}</button>)}<Btn small gold onClick={()=>actions.generateReport(getCurrentMonth())} style={{marginLeft:"auto"}}>{I.report} Generate Now</Btn></div>
    {filteredMonths.length===0?<Empty msg="No months available yet."/>:filteredMonths.map(ym=>{
      const report=getReport(ym);const isLocked=locked(ym);const {lock}=getReportWindow(ym);const isCurrent=ym===getCurrentMonth();
      return<Card key={ym} style={{marginBottom:12,padding:0,overflow:"hidden"}}>
        <div style={{height:3,background:isLocked?"#648cc8":report?"#b68b2e":"rgba(182,139,46,0.50)"}}/>
        <div style={{padding:20}}>
          <div style={{display:"flex",alignItems:"center",gap:16,flexWrap:"wrap"}}>
            <div style={{flex:1,minWidth:200}}><div style={{display:"flex",alignItems:"center",gap:10,marginBottom:4,flexWrap:"wrap"}}><span style={{fontFamily:"Cormorant Garamond,serif",fontSize:20,fontWeight:400,color:"#1a1714"}}>{getMonthLabel(ym)}</span>{isCurrent&&<span style={{fontSize:10,background:"rgba(182,139,46,0.30)",color:"#b68b2e",padding:"3px 8px",borderRadius:6,fontWeight:600}}>CURRENT</span>}{isLocked&&<span style={{fontSize:10,background:"rgba(100,140,200,0.15)",color:"#648cc8",padding:"3px 8px",borderRadius:6,fontWeight:600,display:"inline-flex",alignItems:"center",gap:4}}>{I.lock} LOCKED</span>}</div>{isLocked?<div style={{fontSize:11,color:"#8a8070"}}>Permanently locked</div>:<div style={{fontSize:11,color:"#8a8070"}}>Editable until {lock}</div>}</div>
            {report&&<div style={{display:"flex",gap:16,fontSize:12,flexWrap:"wrap"}}><span>Collected: <strong style={{color:"#4a9e6b"}}>R {fmt(report.totalCollected)}</strong></span><span>Active: <strong style={{color:"#4a9e6b"}}>{report.activeCount}</strong></span>{report.chasingCount>0&&<span>Chasing: <strong style={{color:"#e6be32"}}>{report.chasingCount}</strong></span>}<span style={{fontSize:11,color:"#8a8070"}}>Generated: {report.generatedAt}</span></div>}
            <div style={{display:"flex",gap:8,flexShrink:0}}>{!isLocked&&<Btn small gold onClick={()=>actions.generateReport(ym)}>{report?"Regenerate":"Generate"}</Btn>}{isLocked&&<Btn small warn onClick={()=>actions.generateReport(ym)}>{I.warn} Override</Btn>}{report&&<Btn small ghost onClick={()=>generatePDF(report)}>{I.dl} PDF</Btn>}</div>
          </div>
          {report&&<><button onClick={()=>setSelectedMonth(selectedMonth===ym?null:ym)} style={{background:"none",border:"none",color:"#8a8070",cursor:"pointer",fontSize:11,marginTop:10,display:"flex",alignItems:"center",gap:4}}><span style={{transform:selectedMonth===ym?"rotate(180deg)":"none",transition:"0.2s",display:"inline-flex"}}>{I.chevron}</span>{selectedMonth===ym?"Hide":"Show"} details</button>{selectedMonth===ym&&<div style={{marginTop:10,borderTop:"1px solid rgba(182,139,46,0.14)",paddingTop:10}}>{report.snapshot.payments&&report.snapshot.payments.length>0?<Tbl cols={[{label:"Collector",bold:true,render:r=>r.collectorName},{label:"Artwork",key:"artworkTitle"},{label:"Model",render:r=><Badge model={r.model||"O1"}/>},{label:"Month",render:r=>`Mo ${r.monthNumber}`},{label:"Method",key:"method"},{label:"Amount",right:true,gold:true,render:r=>"R "+fmt(r.amount)}]} data={report.snapshot.payments}/>:<p style={{fontSize:13,color:"#8a8070"}}>No payments this month.</p>}</div>}</>}
        </div>
      </Card>;})}
  </div>);}


// ═══════════════════════════════════════════
// PORTAL USERS MANAGEMENT
// ═══════════════════════════════════════════
function PortalsPage({data,setPendingPortalCount}){
  const [tab,setTab]=useState("pending");
  const [requests,setRequests]=useState([]);
  const [loadingReqs,setLoadingReqs]=useState(true);
  const [approving,setApproving]=useState(null);
  const [rejecting,setRejecting]=useState(null);

  useEffect(()=>{loadRequests();},[]);

  const loadRequests=async()=>{
    setLoadingReqs(true);
    try{
      const {data:reqs}=await supabase.from("portal_requests").select("*").order("created_at",{ascending:false});
      setRequests(reqs||[]);
    }catch(e){console.error(e);}
    setLoadingReqs(false);
  };

  const approve=async(req)=>{
    setApproving(req.id);
    // 1. Approve the request
    await supabase.from("portal_requests").update({status:"approved",reviewed_at:new Date().toISOString()}).eq("id",req.id);

    // 2. Auto-create in the right table based on role
    if(req.role==="renter"){
      // Check if collector already exists with this email
      const {data:existing}=await supabase.from("collectors").select("id").eq("email",req.email).single();
      if(!existing){
        const nameParts=(req.full_name||"").trim().split(" ");
        const lastName=nameParts.length>1?nameParts.slice(1).join(" "):"";
        const firstName=nameParts[0]||req.full_name;
        // Parse extra fields from message
        const msgFields={};
        (req.message||"").split(" | ").forEach(part=>{
          const [key,...val]=part.split(": ");
          if(key&&val.length)msgFields[key.toLowerCase()]=val.join(": ");
        });
        await supabase.from("collectors").insert({
          id: crypto.randomUUID(),
          type: "individual",
          first_name: firstName,
          last_name: lastName,
          email: req.email,
          mobile: req.mobile||"",
          id_number: msgFields["id"]||"",
          nationality: msgFields["nationality"]||"",
          city: msgFields["city"]||"",
          country: msgFields["country"]||"South Africa",
          address: msgFields["address"]||"",
          kyc_status: "pending",
          notes: "Portal registration. Link artwork to activate.",
          linked_artworks: "[]",
          created_at: new Date().toISOString(),
        });
      }
    } else if(req.role==="buyer"){
      const {data:existingB}=await supabase.from("buyers").select("id").eq("email",req.email).single();
      if(!existingB){
        const msgFieldsB={};
        (req.message||"").split(" | ").forEach(part=>{const [key,...val]=part.split(": ");if(key&&val.length)msgFieldsB[key.toLowerCase()]=val.join(": ");});
        const namePartsB=(req.full_name||"").trim().split(" ");
        await supabase.from("buyers").insert({
          id: crypto.randomUUID(),
          type: "individual",
          first_name: namePartsB[0]||req.full_name,
          last_name: namePartsB.slice(1).join(" ")||"",
          email: req.email,
          mobile: req.mobile||"",
          id_number: msgFieldsB["id"]||"",
          nationality: msgFieldsB["nationality"]||"",
          city: msgFieldsB["city"]||"",
          country: msgFieldsB["country"]||"South Africa",
          address: msgFieldsB["address"]||"",
          kyc_status: "pending",
          auction_approved: false,
          created_at: new Date().toISOString(),
        });
      }
    } else if(req.role==="artist"){
      const {data:existing}=await supabase.from("artists").select("id").eq("email",req.email).single();
      if(!existing){
        // Parse extra fields from message
        const msgFieldsA={};
        (req.message||"").split(" | ").forEach(part=>{
          const [key,...val]=part.split(": ");
          if(key&&val.length)msgFieldsA[key.toLowerCase()]=val.join(": ");
        });
        await supabase.from("artists").insert({
          id: crypto.randomUUID(),
          name: req.full_name,
          email: req.email,
          mobile: req.mobile||"",
          id_number: msgFieldsA["id"]||"",
          nationality: msgFieldsA["nationality"]||"",
          city: msgFieldsA["city"]||"",
          country: msgFieldsA["country"]||"South Africa",
          address: msgFieldsA["address"]||"",
          medium: msgFieldsA["medium"]||"",
          instagram: msgFieldsA["instagram"]||"",
          kyc_status: "pending",
          notes: "Portal registration.",
          created_at: new Date().toISOString(),
        });
      }
    }

    await loadRequests();
    supabase.from('portal_requests').select('id',{count:'exact'}).eq('status','pending').then(({count})=>setPendingPortalCount&&setPendingPortalCount(count||0));
    setApproving(null);
    alert(req.role==="renter"
      ?"✓ Approved. "+req.full_name+" has been added to License Holders. Go there to link their artwork."
      :req.role==="buyer"?"✓ Approved. "+req.full_name+" has been added to Buyers. Go there to complete KYC and grant auction access.":"✓ Approved. "+req.full_name+" has been added to Artists.");
  };

  const reject=async(req)=>{
    setRejecting(req.id);
    await supabase.from("portal_requests").update({status:"rejected",reviewed_at:new Date().toISOString()}).eq("id",req.id);
    await loadRequests();
    setRejecting(null);
  };

  const deleteUser=async(req)=>{
    if(!confirm("Permanently delete "+req.full_name+"? This removes their portal request and auth account."))return;
    // Delete portal request
    await supabase.from("portal_requests").delete().eq("id",req.id);
    // Delete auth user via admin - we can only do this from SQL
    // Show SQL instruction
    alert("Portal request deleted.\n\nTo fully remove their login, run this in Supabase SQL Editor:\n\nDELETE FROM auth.users WHERE email = '"+req.email+"';");
    await loadRequests();
  };

  const renterUrl=typeof window!=="undefined"?window.location.origin+"/renter":"";
  const artistUrl=typeof window!=="undefined"?window.location.origin+"/artist":"";
  const buyerUrl=typeof window!=="undefined"?window.location.origin+"/buyer":"";
  const pending=requests.filter(r=>r.status==="pending");
  const approved=requests.filter(r=>r.status==="approved");
  const rejected=requests.filter(r=>r.status==="rejected");

  return(<div>
    <PT title="Portal Users" sub="Manage renter and artist access requests"/>

    {/* Share Links */}
    <Card style={{marginBottom:20}}>
      <div style={{fontSize:11,letterSpacing:2,textTransform:"uppercase",color:"#8a8070",marginBottom:12}}>Share these links with your renters and artists</div>
      <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
        {[["Renter Portal",renterUrl],["Artist Portal",artistUrl],["Buyer Portal",buyerUrl]].map(([label,url])=>(
          <div key={label} style={{flex:1,minWidth:220,padding:"14px 16px",background:"#f5f3ef",border:"1px solid rgba(182,139,46,0.20)",borderRadius:10}}>
            <div style={{fontSize:11,color:"#8a8070",marginBottom:4,letterSpacing:1,textTransform:"uppercase"}}>{label}</div>
            <div style={{fontSize:13,color:"#b68b2e",fontWeight:600,marginBottom:10,wordBreak:"break-all"}}>{url}</div>
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>navigator.clipboard.writeText(url).then(()=>alert("Link copied!"))} style={{flex:1,padding:"8px 0",background:"transparent",border:"1px solid rgba(182,139,46,0.30)",borderRadius:6,color:"#b68b2e",cursor:"pointer",fontSize:11,fontWeight:600,fontFamily:"DM Sans,sans-serif"}}>Copy Link</button>
              <button onClick={()=>window.open("https://wa.me/?text="+encodeURIComponent("Hi, here is your Vollard Black portal link: "+url),"_blank")} style={{flex:1,padding:"8px 0",background:"rgba(37,211,102,0.10)",border:"1px solid rgba(37,211,102,0.30)",borderRadius:6,color:"#25d366",cursor:"pointer",fontSize:11,fontWeight:600,fontFamily:"DM Sans,sans-serif"}}>WhatsApp</button>
            </div>
          </div>
        ))}
      </div>
      <div style={{marginTop:12,padding:"10px 14px",background:"rgba(182,139,46,0.06)",borderRadius:8,fontSize:12,color:"#6b635a",lineHeight:1.7}}>
        <strong>How it works:</strong> You share the link → they register with their name, email and password → you see their request here → you approve or reject it → if approved they can log in and see their data.
      </div>
    </Card>

    {/* Tabs */}
    <div style={{display:"flex",borderBottom:"1px solid rgba(182,139,46,0.15)",marginBottom:20,gap:4}}>
      {[
        ["pending","Pending ("+pending.length+")",pending.length>0?"#c45c4a":null],
        ["approved","Approved ("+approved.length+")","#4a9e6b"],
        ["rejected","Rejected ("+rejected.length+")",null],
      ].map(([id,lbl,color])=>(
        <button key={id} onClick={()=>setTab(id)} style={{padding:"10px 18px",border:"none",borderBottom:tab===id?"2px solid #b68b2e":"2px solid transparent",background:"transparent",color:tab===id?"#b68b2e":"#6b635a",fontSize:13,fontWeight:tab===id?600:400,cursor:"pointer",fontFamily:"DM Sans,sans-serif",display:"flex",alignItems:"center",gap:6}}>
          {lbl}
          {color&&pending.length>0&&id==="pending"&&<div style={{width:8,height:8,borderRadius:"50%",background:color}}/>}
        </button>
      ))}
    </div>

    {loadingReqs&&<div style={{textAlign:"center",padding:40,color:"#8a8070",fontSize:13}}>Loading requests...</div>}

    {!loadingReqs&&tab==="pending"&&(
      pending.length===0
        ?<Card style={{textAlign:"center",padding:40}}><div style={{fontSize:32,marginBottom:12}}>◆</div><div style={{fontSize:14,color:"#8a8070"}}>No pending requests.</div><div style={{fontSize:12,color:"#8a8070",marginTop:4}}>Share your portal links above and requests will appear here.</div></Card>
        :pending.map(r=>(
          <Card key={r.id} style={{marginBottom:12}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:12}}>
              <div>
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:4}}>
                  <div style={{fontFamily:"Cormorant Garamond,serif",fontSize:20,color:"#1a1714"}}>{r.full_name}</div>
                  <span style={{padding:"3px 10px",borderRadius:6,fontSize:10,fontWeight:600,background:r.role==="renter"?"rgba(182,139,46,0.15)":"rgba(100,140,200,0.15)",color:r.role==="renter"?"#b68b2e":"#648cc8",textTransform:"uppercase",letterSpacing:1}}>{r.role}</span>
                </div>
                <div style={{fontSize:13,color:"#6b635a"}}>{r.email}</div>
                {r.mobile&&<div style={{fontSize:12,color:"#8a8070",marginTop:2}}>{r.mobile}</div>}
                {r.message&&<div style={{fontSize:12,color:"#8a8070",marginTop:4,fontStyle:"italic"}}>"{r.message}"</div>}
                <div style={{fontSize:11,color:"#a09890",marginTop:4}}>Requested: {r.created_at?.slice(0,10)||"—"}</div>
              </div>
              <div style={{display:"flex",gap:8,flexShrink:0,flexWrap:"wrap"}}>
                <button onClick={()=>deleteUser(r)} style={{padding:"10px 14px",borderRadius:8,border:"1px solid rgba(196,92,74,0.20)",background:"transparent",color:"#c45c4a",cursor:"pointer",fontSize:11,fontFamily:"DM Sans,sans-serif"}}>🗑 Delete</button>
                <button onClick={()=>reject(r)} disabled={rejecting===r.id} style={{padding:"10px 18px",borderRadius:8,border:"1px solid rgba(196,92,74,0.30)",background:"transparent",color:"#c45c4a",cursor:"pointer",fontSize:12,fontWeight:600,fontFamily:"DM Sans,sans-serif"}}>{rejecting===r.id?"...":"Decline"}</button>
                <button onClick={()=>approve(r)} disabled={approving===r.id} style={{padding:"10px 18px",borderRadius:8,border:"none",background:"linear-gradient(135deg,#b68b2e,#8a6a1e)",color:"#fff",cursor:"pointer",fontSize:12,fontWeight:600,fontFamily:"DM Sans,sans-serif"}}>{approving===r.id?"Approving...":"Approve"}</button>
              </div>
            </div>
          </Card>
        ))
    )}

    {!loadingReqs&&tab==="approved"&&(
      approved.length===0
        ?<Card style={{textAlign:"center",padding:40}}><div style={{fontSize:14,color:"#8a8070"}}>No approved users yet.</div></Card>
        :<div>
          {/* Renters Section */}
          {approved.filter(r=>r.role==="renter").length>0&&<div>
            <div style={{fontSize:11,letterSpacing:2,textTransform:"uppercase",color:"#b68b2e",marginBottom:10,marginTop:4}}>Renters ({approved.filter(r=>r.role==="renter").length})</div>
            {approved.filter(r=>r.role==="renter").map(r=>(
              <Card key={r.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:10,borderLeft:"3px solid rgba(182,139,46,0.40)"}}>
                <div>
                  <div style={{fontWeight:600,fontSize:14,color:"#1a1714"}}>{r.full_name}</div>
                  <div style={{fontSize:12,color:"#8a8070"}}>{r.email}</div>
                  <div style={{fontSize:11,color:"#4a9e6b",marginTop:2}}>✓ Approved {r.reviewed_at?.slice(0,10)||""}</div>
                </div>
                <div style={{display:"flex",gap:8}}>
                  <button onClick={()=>deleteUser(r)} style={{padding:"8px 12px",borderRadius:6,border:"1px solid rgba(196,92,74,0.20)",background:"transparent",color:"#c45c4a",cursor:"pointer",fontSize:11,fontFamily:"DM Sans,sans-serif"}}>🗑 Delete</button>
                  <button onClick={()=>reject(r)} style={{padding:"8px 14px",borderRadius:6,border:"1px solid rgba(196,92,74,0.25)",background:"transparent",color:"#c45c4a",cursor:"pointer",fontSize:11,fontFamily:"DM Sans,sans-serif"}}>Revoke</button>
                </div>
              </Card>
            ))}
          </div>}
          {/* Buyers Section */}
          {approved.filter(r=>r.role==="buyer").length>0&&<div style={{marginTop:16}}>
            <div style={{fontSize:11,letterSpacing:2,textTransform:"uppercase",color:"#4a9e6b",marginBottom:10}}>Buyers ({approved.filter(r=>r.role==="buyer").length})</div>
            {approved.filter(r=>r.role==="buyer").map(r=>(
              <Card key={r.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:10,borderLeft:"3px solid rgba(74,158,107,0.40)"}}>
                <div>
                  <div style={{fontWeight:600,fontSize:14,color:"#1a1714"}}>{r.full_name}</div>
                  <div style={{fontSize:12,color:"#8a8070"}}>{r.email}</div>
                  <div style={{fontSize:11,color:"#4a9e6b",marginTop:2}}>✓ Approved {r.reviewed_at?.slice(0,10)||""}</div>
                </div>
                <div style={{display:"flex",gap:8}}>
                  <button onClick={()=>deleteUser(r)} style={{padding:"8px 12px",borderRadius:6,border:"1px solid rgba(196,92,74,0.20)",background:"transparent",color:"#c45c4a",cursor:"pointer",fontSize:11,fontFamily:"DM Sans,sans-serif"}}>🗑 Delete</button>
                  <button onClick={()=>reject(r)} style={{padding:"8px 14px",borderRadius:6,border:"1px solid rgba(196,92,74,0.25)",background:"transparent",color:"#c45c4a",cursor:"pointer",fontSize:11,fontFamily:"DM Sans,sans-serif"}}>Revoke</button>
                </div>
              </Card>
            ))}
          </div>}
          {/* Artists Section */}
          {approved.filter(r=>r.role==="artist").length>0&&<div style={{marginTop:approved.filter(r=>r.role==="renter").length>0?16:0}}>
            <div style={{fontSize:11,letterSpacing:2,textTransform:"uppercase",color:"#648cc8",marginBottom:10}}>Artists ({approved.filter(r=>r.role==="artist").length})</div>
            {approved.filter(r=>r.role==="artist").map(r=>(
              <Card key={r.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:10,borderLeft:"3px solid rgba(100,140,200,0.40)"}}>
                <div>
                  <div style={{fontWeight:600,fontSize:14,color:"#1a1714"}}>{r.full_name}</div>
                  <div style={{fontSize:12,color:"#8a8070"}}>{r.email}</div>
                  <div style={{fontSize:11,color:"#4a9e6b",marginTop:2}}>✓ Approved {r.reviewed_at?.slice(0,10)||""}</div>
                </div>
                <div style={{display:"flex",gap:8}}>
                  <button onClick={()=>deleteUser(r)} style={{padding:"8px 12px",borderRadius:6,border:"1px solid rgba(196,92,74,0.20)",background:"transparent",color:"#c45c4a",cursor:"pointer",fontSize:11,fontFamily:"DM Sans,sans-serif"}}>🗑 Delete</button>
                  <button onClick={()=>reject(r)} style={{padding:"8px 14px",borderRadius:6,border:"1px solid rgba(196,92,74,0.25)",background:"transparent",color:"#c45c4a",cursor:"pointer",fontSize:11,fontFamily:"DM Sans,sans-serif"}}>Revoke</button>
                </div>
              </Card>
            ))}
          </div>}
        </div>
    )}

    {!loadingReqs&&tab==="rejected"&&(
      rejected.length===0
        ?<Card style={{textAlign:"center",padding:40}}><div style={{fontSize:14,color:"#8a8070"}}>No rejected requests.</div></Card>
        :rejected.map(r=>(
          <Card key={r.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:10}}>
            <div>
              <div style={{fontWeight:600,fontSize:14,color:"#1a1714"}}>{r.full_name}</div>
              <div style={{fontSize:12,color:"#8a8070"}}>{r.email} · {r.role}</div>
              <div style={{fontSize:11,color:"#c45c4a",marginTop:2}}>✗ Declined {r.reviewed_at?.slice(0,10)||""}</div>
            </div>
            <button onClick={()=>approve(r)} style={{padding:"8px 14px",borderRadius:6,border:"1px solid rgba(74,158,107,0.25)",background:"transparent",color:"#4a9e6b",cursor:"pointer",fontSize:11,fontFamily:"DM Sans,sans-serif"}}>Approve</button>
          </Card>
        ))
    )}
  </div>);}


// ═══════════════════════════════════════════
// GALLERY BREAK-EVEN
// ═══════════════════════════════════════════
function GalleryPage(){
  const [costs,setCosts]=useState("");
  const [price,setPrice]=useState("");
  const [galPct,setGalPct]=useState("");
  const [sales,setSales]=useState("");
  const [option,setOption]=useState("O1");
  const c=parseFloat(costs)||0;
  const p=parseFloat(price)||0;
  const gp=(parseFloat(galPct)||40)/100;
  const s=parseFloat(sales)||0;
  const m=MODELS[option];
  const vbFee=p*m.vbPct;
  const moPerArt=vbFee/m.term*gp;
  const saleIncome=vbFee*gp;
  const totalSalesIncome=saleIncome*s;
  const costsAfterSales=Math.max(0,c-totalSalesIncome);
  const neededNoSales=moPerArt>0?Math.ceil(c/moPerArt):0;
  const neededWithSales=moPerArt>0?Math.ceil(costsAfterSales/moPerArt):0;
  const diff=neededNoSales-neededWithSales;
  const ready=c>0&&p>0;
  const salePlural=s!==1?"s":"";
  const diffPlural=diff!==1?"s":"";
  const summaryText=diff>0
    ?(s+" sale"+salePlural+" per month saves you "+diff+" artwork"+diffPlural)
    :(neededNoSales+" renters at R "+fmt(moPerArt)+" per month = R "+fmt(moPerArt*neededNoSales));
  const summaryColor=diff>0?"#4a9e6b":"#b68b2e";
  const tileData=[
    {label:"Monthly income at break-even",val:"R "+fmt(moPerArt*neededNoSales),color:"#4a9e6b"},
    {label:"Monthly costs",val:"R "+fmt(c),color:"#c45c4a"},
    {label:"Rental fee per artwork ("+Math.round(m.vbPct*100)+"%)",val:"R "+fmt(vbFee),color:"#b68b2e"},
    {label:"Gallery earns ("+m.term+" months)",val:"R "+fmt(vbFee*gp),color:"#b68b2e"},
  ];
  const numFilter=v=>v.replace(/[^0-9.]/g,"");
  return(
    <div>
      <PT title="Gallery Break-Even" sub="How many artworks cover your monthly costs"/>
      <div style={{display:"grid",gridTemplateColumns:"minmax(0,420px) minmax(0,1fr)",gap:24,alignItems:"start"}}>
        <Card>
          <div style={{fontSize:10,letterSpacing:2,textTransform:"uppercase",color:"#8a8070",marginBottom:10}}>Rental Term</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:20}}>
            {["O1","O2","O3"].map(k=>{
              const mod=MODELS[k];const on=option===k;
              return(
                <button key={k} onClick={()=>setOption(k)} style={{padding:10,borderRadius:8,border:on?"2px solid #b68b2e":"1px solid rgba(182,139,46,0.25)",background:on?"rgba(182,139,46,0.18)":"#e8e4dd",color:on?"#b68b2e":"#6b635a",cursor:"pointer",fontFamily:"DM Sans,sans-serif",textAlign:"center",fontSize:11,fontWeight:on?600:400}}>
                  <div style={{fontWeight:600,marginBottom:2}}>{mod.label.split("·")[0].trim()}</div>
                  <div style={{fontSize:10,opacity:0.7}}>50/50 · {mod.term}mo</div>
                </button>
              );
            })}
          </div>
          <div style={{marginBottom:16}}>
            <Field label="Monthly Costs (R)">
              <div style={{display:"flex",alignItems:"center",background:"#e8e4dd",border:"1px solid rgba(182,139,46,0.25)",borderRadius:10,overflow:"hidden"}}>
                <span style={{padding:"0 14px",fontSize:13,color:"#8a8070",borderRight:"1px solid rgba(182,139,46,0.18)",height:48,display:"flex",alignItems:"center"}}>R</span>
                <input type="text" inputMode="decimal" value={costs} onChange={e=>setCosts(numFilter(e.target.value))} placeholder="0" style={{flex:1,padding:"0 16px",height:48,background:"transparent",border:"none",color:"#1a1714",fontFamily:"DM Sans,sans-serif",fontSize:16,fontWeight:500,outline:"none",textAlign:"right"}}/>
              </div>
            </Field>
            <Field label="Artwork Price (R)">
              <div style={{display:"flex",alignItems:"center",background:"#e8e4dd",border:"1px solid rgba(182,139,46,0.25)",borderRadius:10,overflow:"hidden"}}>
                <span style={{padding:"0 14px",fontSize:13,color:"#8a8070",borderRight:"1px solid rgba(182,139,46,0.18)",height:48,display:"flex",alignItems:"center"}}>R</span>
                <input type="text" inputMode="decimal" value={price} onChange={e=>setPrice(numFilter(e.target.value))} placeholder="0" style={{flex:1,padding:"0 16px",height:48,background:"transparent",border:"none",color:"#1a1714",fontFamily:"DM Sans,sans-serif",fontSize:16,fontWeight:500,outline:"none",textAlign:"right"}}/>
              </div>
            </Field>
            <Field label="Gallery Fee">
              <div style={{display:"flex",alignItems:"center",background:"#e8e4dd",border:"1px solid rgba(182,139,46,0.25)",borderRadius:10,overflow:"hidden"}}>
                <input type="text" inputMode="decimal" value={galPct} onChange={e=>setGalPct(numFilter(e.target.value))} placeholder="0" style={{flex:1,padding:"0 16px",height:48,background:"transparent",border:"none",color:"#1a1714",fontFamily:"DM Sans,sans-serif",fontSize:16,fontWeight:500,outline:"none",textAlign:"right"}}/>
                <span style={{padding:"0 14px",fontSize:13,color:"#8a8070",borderLeft:"1px solid rgba(182,139,46,0.18)",height:48,display:"flex",alignItems:"center",whiteSpace:"nowrap"}}>% of rental fee</span>
              </div>
            </Field>
            <Field label="Expected Sales per Month">
              <div style={{display:"flex",alignItems:"center",background:"#e8e4dd",border:"1px solid rgba(182,139,46,0.25)",borderRadius:10,overflow:"hidden"}}>
                <input type="text" inputMode="decimal" value={sales} onChange={e=>setSales(numFilter(e.target.value))} placeholder="0" style={{flex:1,padding:"0 16px",height:48,background:"transparent",border:"none",color:"#1a1714",fontFamily:"DM Sans,sans-serif",fontSize:16,fontWeight:500,outline:"none",textAlign:"right"}}/>
                <span style={{padding:"0 14px",fontSize:13,color:"#8a8070",borderLeft:"1px solid rgba(182,139,46,0.18)",height:48,display:"flex",alignItems:"center",whiteSpace:"nowrap"}}>sales</span>
              </div>
            </Field>
          </div>
          {ready&&(
            <div>
              <div style={{height:1,background:"rgba(182,139,46,0.20)",margin:"20px 0"}}/>
              {[
                {label:"Rental fee ("+Math.round(m.vbPct*100)+"%)",val:"R "+fmt(vbFee)},
                {label:"Gallery earns per artwork per month",val:"R "+fmt(moPerArt)},
                {label:"Gallery earns per sale",val:"R "+fmt(saleIncome)},
                {label:(s||0)+" sale"+salePlural+" per month income",val:"R "+fmt(totalSalesIncome),green:true},
              ].map((row,ri)=>(
                <div key={ri} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 0",borderBottom:"1px solid rgba(182,139,46,0.12)"}}>
                  <span style={{fontSize:13,color:"#8a8070"}}>{row.label}</span>
                  <span style={{fontSize:13,fontWeight:500,color:row.green?"#4a9e6b":"#b68b2e"}}>{row.val}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
        <div>
          {!ready&&(
            <Card style={{padding:48,textAlign:"center"}}>
              <div style={{fontSize:36,color:"#8a8070",marginBottom:12}}>◆</div>
              <p style={{color:"#8a8070",fontSize:14}}>Enter your monthly costs and artwork price.</p>
            </Card>
          )}
          {ready&&(
            <div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:16}}>
                <Card style={{textAlign:"center",padding:28}}>
                  <div style={{fontSize:9,letterSpacing:2,textTransform:"uppercase",color:"#8a8070",marginBottom:14}}>Without sales</div>
                  <div style={{fontFamily:"Cormorant Garamond,serif",fontSize:64,fontWeight:300,lineHeight:1,color:"#1a1714"}}>{neededNoSales||"—"}</div>
                  <div style={{fontSize:11,color:"#8a8070",marginTop:10}}>artworks needed</div>
                </Card>
                <Card style={{textAlign:"center",padding:28,border:"1px solid rgba(182,139,46,0.50)",position:"relative",overflow:"hidden"}}>
                  <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:"linear-gradient(90deg,transparent,#b68b2e,transparent)"}}/>
                  <div style={{fontSize:9,letterSpacing:2,textTransform:"uppercase",color:"#b68b2e",marginBottom:14}}>With {s||0} sale{salePlural} per month</div>
                  <div style={{fontFamily:"Cormorant Garamond,serif",fontSize:64,fontWeight:300,lineHeight:1,color:"#4a9e6b"}}>{neededWithSales||"—"}</div>
                  <div style={{fontSize:11,color:"#8a8070",marginTop:10}}>artworks needed</div>
                </Card>
              </div>
              <Card style={{textAlign:"center",padding:18,marginBottom:14}}>
                <div style={{fontSize:14,fontWeight:500,color:summaryColor}}>{summaryText}</div>
              </Card>
              <Card>
                <div style={{fontSize:11,letterSpacing:2,textTransform:"uppercase",color:"#8a8070",marginBottom:14}}>What This Looks Like</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                  {tileData.map((x,i)=>(
                    <div key={i} style={{background:"#e8e4dd",borderRadius:8,padding:14}}>
                      <div style={{fontSize:10,color:"#8a8070",letterSpacing:1,textTransform:"uppercase",marginBottom:6}}>{x.label}</div>
                      <div style={{fontFamily:"Cormorant Garamond,serif",fontSize:22,fontWeight:400,color:x.color}}>{x.val}</div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
