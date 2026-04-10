'use client';
import { useState, useEffect, useCallback, useMemo } from "react";
import { db } from "./supabase";

// ─── Constants ───
// MODEL A: VB 40%, Collector 60%, 24 months
// MODEL B: VB 30%, Collector 70%, 12 months
// Both: VB balance collected from sale proceeds. Unsold = collector takes artwork.
const MODELS = {
  A: { vbPct: 0.40, colPct: 0.60, term: 24, label: "Model A" },
  B: { vbPct: 0.30, colPct: 0.70, term: 12, label: "Model B" },
};
const GALLERY_BACK = 0.40;
const VB_BACK = 0.30;
const ARTIST_BACK = 0.30;
const ADMIN_EMAIL = "concierge@vollardblack.com";
const PAGE_SIZE = 50;

// ─── Maths Engine ───
// MODEL A: VB fee = 40% of artwork value. Collector gets 60% at sale.
// MODEL B: VB fee = 30% of artwork value. Collector gets 70% at sale.
// VB fee is paid monthly. Any balance unpaid at sale is deducted from sale proceeds.
// If sale price < artwork value: collector gets colPct% of ACTUAL sale price (less, proportionally).
// If sale price > artwork value: surplus split 50/50 on top of base split.
// Collector profit at recommended price is always (colPct - vbPct) × artworkValue regardless of month.
const calcDeal = (artworkValue, salePrice, model, monthsPaid, galleryPct, vbPct, artistPct, introFeePct) => {
  const m = MODELS[model];
  const vbFee = artworkValue * m.vbPct;
  const monthly = vbFee / m.term;
  const paid = monthly * monthsPaid;
  const vbBalance = Math.max(0, vbFee - paid);

  // Surplus / deficit vs recommended price
  const surplus = Math.max(0, salePrice - artworkValue);
  const deficit = Math.max(0, artworkValue - salePrice);
  const surplusCol = surplus * 0.50;
  const surplusVB = surplus * 0.50;

  // Collector base = colPct% of actual sale price (not artwork value)
  // This means if it sells for less, collector gets less
  const colBase = salePrice * m.colPct;

  // Add surplus bonus if above recommended
  const colTotal = colBase + surplusCol;

  // Deduct VB balance still owed
  const colAfterBalance = colTotal - vbBalance;

  // Introducer fee on what collector receives
  const introFee = Math.max(0, colAfterBalance) * (introFeePct / 100);
  const colNet = colAfterBalance - introFee;

  // Collector profit = what they receive minus what they paid monthly
  const colProfit = colNet - paid;
  const colROI = paid > 0 ? (colProfit / paid) * 100 : 0;

  // VB total = their fee + surplus share
  const vbTotal = vbFee + surplusVB;

  // Backend split on VB's total
  const gPct = galleryPct / 100;
  const vPct2 = vbPct / 100;
  const aPct = artistPct / 100;
  const galleryAmt = vbTotal * gPct;
  const vbAmt = vbTotal * vPct2;
  const artistAmt = vbTotal * aPct;

  return {
    vbFee, monthly, paid, vbBalance,
    surplus, deficit, surplusCol, surplusVB,
    colBase, colTotal, colAfterBalance,
    introFee, colNet, colProfit, colROI,
    vbTotal, galleryAmt, vbAmt, artistAmt,
  };
};

const fmt = (n) => Number(n||0).toLocaleString("en-ZA",{minimumFractionDigits:2,maximumFractionDigits:2});
const uid = () => "VB"+Date.now().toString(36)+Math.random().toString(36).slice(2,6);
const td = () => new Date().toISOString().slice(0,10);
const SK = "vollard_black_v6";
const TABLES = ["artworks","artists","collectors","schedules","payments","sales","reports","buyers"];
const fresh = () => ({artworks:[],artists:[],collectors:[],schedules:[],payments:[],sales:[],reports:[],buyers:[]});
const loadLocal = () => { try { const d=JSON.parse(localStorage.getItem(SK)); return d?.artworks?d:fresh(); } catch{return fresh();} };

// ─── Date Helpers ───
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

// ─── Strike Engine ───
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

// ─── Email Templates ───
const monthLabel=()=>new Date().toLocaleDateString("en-ZA",{month:"long",year:"numeric"});
const TEMPLATES={
  upcoming:(n,a,amt,due)=>({subject:`Vollard Black — Payment Reminder | ${monthLabel()}`,body:`Dear ${n},\n\nThis is a friendly reminder that your payment of R ${fmt(amt)} for "${a}" is due on ${due}.\n\nPayment window: 25th – 7th of following month.\n\nKind regards,\nVollard Black\n${ADMIN_EMAIL}`}),
  missed:(n,a,amt)=>({subject:`Vollard Black — Missed Payment | ${monthLabel()}`,body:`Dear ${n},\n\nYour payment of R ${fmt(amt)} for "${a}" has not been received.\n\nPlease arrange payment urgently.\n\nVollard Black\n${ADMIN_EMAIL}`}),
  dispute:(n,a,amt)=>({subject:`Vollard Black — Account In Dispute | ${monthLabel()}`,body:`Dear ${n},\n\nYour account for "${a}" is In Dispute with two missed payments totalling R ${fmt(amt)}.\n\nContact us urgently.\n\nVollard Black\n${ADMIN_EMAIL}`}),
  cancelled:(n,a)=>({subject:`Vollard Black — Agreement Cancellation | ${monthLabel()}`,body:`Dear ${n},\n\nYour acquisition agreement for "${a}" has been cancelled.\n\nPlease contact us urgently.\n\nVollard Black\n${ADMIN_EMAIL}`}),
  individual_missed:(n,a,amt)=>({subject:`Missed Payment — ${a} | ${n}`,body:`Dear ${n},\n\nYour payment of R ${fmt(amt)} for "${a}" is outstanding.\n\nKind regards,\nVollard Black\n${ADMIN_EMAIL}`}),
  individual_dispute:(n,a,amt)=>({subject:`Account In Dispute — ${a} | ${n}`,body:`Dear ${n},\n\nYour account for "${a}" is In Dispute.\n\nImmediate action required.\n\nVollard Black\n${ADMIN_EMAIL}`}),
  individual_cancelled:(n,a)=>({subject:`Agreement Cancelled — ${a} | ${n}`,body:`Dear ${n},\n\nYour acquisition agreement for "${a}" has been cancelled.\n\nVollard Black\n${ADMIN_EMAIL}`}),
};
const openGmail=(emails,subject,body)=>{
  const bcc=[ADMIN_EMAIL,...emails.slice(1)].filter(Boolean).join(",");
  window.open(`https://mail.google.com/mail/?view=cm&to=${encodeURIComponent(emails[0]||"")}&bcc=${encodeURIComponent(bcc)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`,"_blank");
};

// ─── PDF Generator ───
const generatePDF=(report)=>{
  const snap=report.snapshot;
  const html=`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Vollard Black — ${getMonthLabel(report.month)}</title>
<style>body{font-family:Georgia,serif;color:#1a1a1a;max-width:900px;margin:0 auto;padding:40px;}h1{font-size:28px;font-weight:300;letter-spacing:4px;}h2{font-size:16px;font-weight:400;color:#8a6a1e;margin:28px 0 12px;border-bottom:1px solid #ddd;padding-bottom:6px;}.header{border-bottom:2px solid #b68b2e;padding-bottom:16px;margin-bottom:24px;}.grid{display:grid;grid-template-columns:repeat(5,1fr);gap:12px;margin-bottom:24px;}.stat{background:#f9f7f3;border:1px solid #e8e0d0;border-radius:6px;padding:14px;text-align:center;}.stat-val{font-size:22px;font-weight:600;color:#b68b2e;}.stat-lbl{font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#999;margin-top:4px;}table{width:100%;border-collapse:collapse;font-size:12px;margin-bottom:20px;}th{background:#f5f0e8;padding:8px 10px;text-align:left;font-size:10px;letter-spacing:1.5px;text-transform:uppercase;color:#666;border-bottom:1px solid #ddd;}td{padding:8px 10px;border-bottom:1px solid #f0ece4;}.gold{color:#b68b2e;font-weight:600;}.green{color:#2d7a4a;font-weight:600;}.red{color:#c45c4a;font-weight:600;}.footer{margin-top:40px;padding-top:16px;border-top:1px solid #ddd;font-size:11px;color:#999;display:flex;justify-content:space-between;}</style></head><body>
<div class="header"><h1>VOLLARD <span style="color:#b68b2e">BLACK</span></h1><div style="font-size:13px;color:#666;letter-spacing:2px;">Monthly Report — ${getMonthLabel(report.month)}</div><div style="font-size:11px;color:#999;margin-top:6px;">Generated: ${report.generatedAt} · ${report.locked?"LOCKED":"Draft"}</div></div>
<div class="grid"><div class="stat"><div class="stat-val green">${snap.activeCount||0}</div><div class="stat-lbl">Active</div></div><div class="stat"><div class="stat-val" style="color:#e6be32">${snap.chasingCount||0}</div><div class="stat-lbl">Chasing</div></div><div class="stat"><div class="stat-val" style="color:#dc7828">${snap.disputeCount||0}</div><div class="stat-lbl">In Dispute</div></div><div class="stat"><div class="stat-val red">${snap.cancelledCount||0}</div><div class="stat-lbl">Cancelled</div></div><div class="stat"><div class="stat-val gold">R ${fmt(snap.totalCollected||0)}</div><div class="stat-lbl">Collected</div></div></div>
<h2>Payments Received</h2>${snap.payments&&snap.payments.length>0?`<table><thead><tr><th>Collector</th><th>Artwork</th><th>Model</th><th>Month</th><th>Method</th><th style="text-align:right">Amount</th></tr></thead><tbody>${snap.payments.map(p=>`<tr><td>${p.collectorName}</td><td>${p.artworkTitle}</td><td>${p.model||"A"}</td><td>Mo ${p.monthNumber}</td><td>${p.method}</td><td style="text-align:right" class="gold">R ${fmt(p.amount)}</td></tr>`).join("")}<tr><td colspan="5" style="font-weight:700;padding-top:12px">Total</td><td style="text-align:right;font-weight:700" class="green">R ${fmt(snap.totalCollected||0)}</td></tr></tbody></table>`:`<p style="color:#999;font-size:13px">No payments this month.</p>`}
${snap.chasing&&snap.chasing.length>0?`<h2>Chasing</h2><table><thead><tr><th>Collector</th><th>Artwork</th><th>Model</th><th>Email</th><th style="text-align:right">Outstanding</th></tr></thead><tbody>${snap.chasing.map(s=>`<tr><td>${s.collectorName}</td><td>${s.artworkTitle}</td><td>${s.model||"A"}</td><td>${s.collectorEmail||"—"}</td><td style="text-align:right" class="red">R ${fmt((s.totalDue||0)-(s.totalPaid||0))}</td></tr>`).join("")}</tbody></table>`:""}
${snap.salesPayout&&snap.salesPayout.length>0?`<h2>Sales & Payouts</h2><table><thead><tr><th>Artwork</th><th>Collector</th><th>Buyer</th><th>Model</th><th style="text-align:right">Sale</th><th style="text-align:right">Collector</th><th style="text-align:right">VB</th></tr></thead><tbody>${snap.salesPayout.map(s=>`<tr><td>${s.artworkTitle}</td><td>${s.collectorName}</td><td>${s.buyerName||"—"}</td><td>${s.acquisitionModel||"A"}</td><td style="text-align:right">R ${fmt(s.salePrice)}</td><td style="text-align:right" class="green">R ${fmt(s.collectorNet)}</td><td style="text-align:right" class="gold">R ${fmt(s.vbTotal)}</td></tr>`).join("")}</tbody></table>`:""}
<div class="footer"><span>VOLLARD BLACK — Fine Art Acquisitions</span><span>${ADMIN_EMAIL}</span><span>© ${new Date().getFullYear()}</span></div>
</body></html>`;
  const w=window.open("","_blank");w.document.write(html);w.document.close();w.focus();setTimeout(()=>w.print(),800);
};

// ─── Settlement Sheet PDF ───
const generateSettlementPDF=(sale,artworkValue,monthsPaid,acquisitionModel,galleryPct,vbPct,artistPct,introFeePct)=>{
  const m=MODELS[acquisitionModel||"A"];
  const deal=calcDeal(artworkValue,sale.salePrice,acquisitionModel||"A",monthsPaid,galleryPct||40,vbPct||30,artistPct||30,introFeePct||0);
  const html=`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Settlement Sheet — ${sale.artworkTitle}</title>
<style>body{font-family:Georgia,serif;color:#1a1a1a;max-width:800px;margin:0 auto;padding:40px;}h1{font-size:26px;font-weight:300;letter-spacing:4px;}.header{border-bottom:2px solid #b68b2e;padding-bottom:16px;margin-bottom:28px;}.section{margin-bottom:24px;}.section-title{font-size:13px;letter-spacing:2px;text-transform:uppercase;color:#8a6a1e;margin-bottom:12px;border-bottom:1px solid #f0e8d0;padding-bottom:6px;}table{width:100%;border-collapse:collapse;font-size:13px;}td{padding:8px 12px;border-bottom:1px solid #f0ece4;}td:last-child{text-align:right;font-weight:600;}.label{color:#666;font-weight:400;}.gold{color:#8a6a1e;}.green{color:#2d7a4a;}.red{color:#c45c4a;}.total-row td{border-top:2px solid #b68b2e;border-bottom:none;font-size:15px;padding-top:12px;}.badge{display:inline-block;background:#f5f0e8;border:1px solid #d4b86a;border-radius:4px;padding:3px 10px;font-size:12px;color:#8a6a1e;margin-left:8px;}.footer{margin-top:40px;padding-top:16px;border-top:1px solid #ddd;font-size:11px;color:#999;text-align:center;}</style></head><body>
<div class="header"><h1>VOLLARD <span style="color:#b68b2e">BLACK</span></h1><div style="font-size:12px;color:#666;letter-spacing:2px;margin-top:4px;">Deal Settlement Sheet</div><div style="margin-top:12px;display:flex;justify-content:space-between;font-size:13px;"><div><strong>${sale.artworkTitle}</strong><span class="badge">${m.label}</span></div><div style="color:#666;">Date: ${sale.date||td()}</div></div><div style="font-size:13px;margin-top:6px;color:#666;">Collector: ${sale.collectorName||"—"} &nbsp;·&nbsp; Buyer: ${sale.buyerName||"—"}</div></div>
<div class="section"><div class="section-title">Acquisition summary</div><table>
<tr><td class="label">Artwork value</td><td>R ${fmt(artworkValue)}</td></tr>
<tr><td class="label">VB fee (${Math.round(m.vbPct*100)}%)</td><td class="gold">R ${fmt(deal.vbFee)}</td></tr>
<tr><td class="label">Monthly payment</td><td>R ${fmt(deal.monthly)}/mo × ${m.term} months</td></tr>
<tr><td class="label">Months paid before sale</td><td>${monthsPaid} of ${m.term}</td></tr>
<tr><td class="label">Collected via monthly payments</td><td class="gold">R ${fmt(deal.paid)}</td></tr>
<tr><td class="label">VB balance at sale</td><td class="${deal.vbBalance>0?"red":"green"}">R ${fmt(deal.vbBalance)}</td></tr>
</table></div>
<div class="section"><div class="section-title">Sale proceeds</div><table>
<tr><td class="label">Sale price</td><td>R ${fmt(sale.salePrice)}</td></tr>
<tr><td class="label">Artwork recommended value</td><td>R ${fmt(artworkValue)}</td></tr>
${deal.surplus>0?`<tr><td class="label">Surplus above recommended</td><td class="gold">R ${fmt(deal.surplus)}</td></tr><tr><td class="label">Collector surplus bonus (50%)</td><td class="green">R ${fmt(deal.surplusCol)}</td></tr><tr><td class="label">VB surplus bonus (50%)</td><td class="gold">R ${fmt(deal.surplusVB)}</td></tr>`:""}
</table></div>
<div class="section"><div class="section-title">Collector settlement</div><table>
<tr><td class="label">Collector ${Math.round(m.colPct*100)}% of artwork value</td><td class="green">R ${fmt(deal.colBase)}</td></tr>
${deal.surplusCol>0?`<tr><td class="label">Surplus bonus</td><td class="green">R ${fmt(deal.surplusCol)}</td></tr>`:""}
<tr><td class="label">Less VB balance collected at sale</td><td class="red">− R ${fmt(deal.vbBalance)}</td></tr>
${deal.introFee>0?`<tr><td class="label">Less introducer fee</td><td class="red">− R ${fmt(deal.introFee)}</td></tr>`:""}
<tr class="total-row"><td><strong>Collector receives</strong></td><td class="green"><strong>R ${fmt(deal.colNet)}</strong></td></tr>
<tr><td class="label" style="padding-top:8px;">Collector total paid in</td><td>R ${fmt(deal.paid)}</td></tr>
<tr><td class="label">Collector profit</td><td class="green">R ${fmt(deal.colProfit)}</td></tr>
<tr><td class="label">Collector ROI</td><td class="green">${Math.round(deal.colROI)}%</td></tr>
</table></div>
<div class="section"><div class="section-title">VB settlement</div><table>
<tr><td class="label">VB total income (fee + surplus)</td><td class="gold">R ${fmt(deal.vbTotal)}</td></tr>
<tr><td class="label">Received via monthly payments</td><td>R ${fmt(deal.paid)}</td></tr>
<tr><td class="label">Collected at sale</td><td>R ${fmt(deal.vbBalance+deal.surplusVB)}</td></tr>
</table></div>
<div class="section"><div class="section-title">Backend split</div><table>
<tr><td class="label">Gallery (${galleryPct||40}%)</td><td class="gold">R ${fmt(deal.galleryAmt)}</td></tr>
<tr><td class="label">Vollard Black (${vbPct||30}%)</td><td class="gold">R ${fmt(deal.vbAmt)}</td></tr>
<tr><td class="label">Artist (${artistPct||30}%)</td><td class="gold">R ${fmt(deal.artistAmt)}</td></tr>
<tr class="total-row"><td><strong>Total</strong></td><td class="gold"><strong>R ${fmt(deal.vbTotal)}</strong></td></tr>
</table></div>
<div class="footer">VOLLARD BLACK · Fine Art Acquisitions · ${ADMIN_EMAIL} · FAIS Compliant · © ${new Date().getFullYear()}</div>
</body></html>`;
  const w=window.open("","_blank");w.document.write(html);w.document.close();w.focus();setTimeout(()=>w.print(),800);
};

const buyerName=(b)=>b?(b.type==="company"?b.companyName:`${b.firstName} ${b.lastName}`):"";

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
};

const stC={Available:{bg:"rgba(74,158,107,0.12)",c:"#4a9e6b"},Reserved:{bg:"rgba(182,139,46,0.12)",c:"#b68b2e"},"In Gallery":{bg:"rgba(100,140,200,0.12)",c:"#648cc8"},Sold:{bg:"rgba(196,92,74,0.12)",c:"#c45c4a"},"In Dispute":{bg:"rgba(196,92,74,0.12)",c:"#c45c4a"}};
const schedC={Active:{bg:"rgba(74,158,107,0.12)",c:"#4a9e6b"},Chasing:{bg:"rgba(230,190,50,0.15)",c:"#e6be32"},"In Dispute":{bg:"rgba(220,120,40,0.15)",c:"#dc7828"},Cancelled:{bg:"rgba(196,92,74,0.15)",c:"#c45c4a"},Complete:{bg:"rgba(100,140,200,0.12)",c:"#648cc8"},Override:{bg:"rgba(160,100,220,0.12)",c:"#a064dc"}};
const modelC={A:{bg:"rgba(74,158,107,0.12)",c:"#4a9e6b",label:"Model A"},B:{bg:"rgba(182,139,46,0.12)",c:"#b68b2e",label:"Model B"}};
const payM=["EFT / Bank Transfer","PayFast","Crypto (USDT)","Cash","Other"];

// ─── UI ───
const is={width:"100%",padding:"12px 14px",background:"#1e1d1a",border:"1px solid rgba(182,139,46,0.1)",borderRadius:8,color:"#f5f0e8",fontFamily:"DM Sans,sans-serif",fontSize:14,outline:"none"};
const ss={...is,cursor:"pointer",appearance:"none",WebkitAppearance:"none"};
const Card=({children,style:s})=><div style={{background:"#151412",border:"1px solid rgba(182,139,46,0.1)",borderRadius:14,padding:24,...s}}>{children}</div>;
const Btn=({children,gold,ghost,small,danger,warn,onClick,style:s,disabled:d})=>{
  const bg=gold?"linear-gradient(135deg,#b68b2e,#8a6a1e)":danger?"rgba(196,92,74,0.15)":warn?"rgba(220,120,40,0.12)":ghost?"transparent":"#1e1d1a";
  const cl=gold?"#0c0b09":danger?"#c45c4a":warn?"#dc7828":ghost?"#b68b2e":"#e8e2d6";
  const br=ghost?"1px solid rgba(182,139,46,0.2)":danger?"1px solid rgba(196,92,74,0.3)":warn?"1px solid rgba(220,120,40,0.3)":"none";
  return<button disabled={d} onClick={onClick} style={{display:"inline-flex",alignItems:"center",gap:6,padding:small?"8px 14px":"12px 22px",borderRadius:8,border:br,cursor:d?"not-allowed":"pointer",fontSize:small?11:12,fontWeight:600,letterSpacing:1,textTransform:"uppercase",fontFamily:"DM Sans,sans-serif",transition:"all 0.2s",opacity:d?0.4:1,background:bg,color:cl,...s}}>{children}</button>;
};
const Badge=({status,sched,model})=>{
  const cfg=model?modelC:sched?schedC:stC;
  const key=model||status;
  const s=cfg[key]||{bg:"#1e1d1a",c:"#8a8477"};
  return<span style={{display:"inline-block",padding:"4px 10px",borderRadius:6,fontSize:11,fontWeight:600,background:s.bg,color:s.c}}>{model?s.label:status}</span>;
};
const Field=({label,children,style:s})=><div style={{marginBottom:16,...s}}><label style={{display:"block",fontSize:10,fontWeight:500,letterSpacing:2,textTransform:"uppercase",color:"#8a8477",marginBottom:6}}>{label}</label>{children}</div>;
const Stat=({label,value,gold,green,red,orange})=><Card style={{padding:18,textAlign:"center"}}><div style={{fontSize:10,letterSpacing:2,textTransform:"uppercase",color:"#5a564e",marginBottom:6}}>{label}</div><div style={{fontFamily:"Cormorant Garamond,serif",fontSize:26,fontWeight:600,color:gold?"#b68b2e":green?"#4a9e6b":red?"#c45c4a":orange?"#dc7828":"#f5f0e8"}}>{value}</div></Card>;
const Empty=({msg,action})=><div style={{textAlign:"center",padding:"48px 20px",color:"#5a564e"}}><div style={{fontSize:42,marginBottom:12,opacity:0.3}}>◆</div><p style={{fontSize:14,marginBottom:16}}>{msg}</p>{action}</div>;
const Modal=({title,onClose,children,wide})=><div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}><div style={{background:"#151412",border:"1px solid rgba(182,139,46,0.15)",borderRadius:16,width:"100%",maxWidth:wide?780:520,maxHeight:"90vh",overflow:"auto",padding:28}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}><h2 style={{fontFamily:"Cormorant Garamond,serif",fontSize:22,fontWeight:400,color:"#f5f0e8",margin:0}}>{title}</h2><button onClick={onClose} style={{background:"none",border:"none",color:"#8a8477",cursor:"pointer"}}>{I.x}</button></div>{children}</div></div>;
const PT=({title,sub,action})=><div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:28,flexWrap:"wrap",gap:12}}><div><h1 style={{fontFamily:"Cormorant Garamond,serif",fontSize:28,fontWeight:400,color:"#f5f0e8",letterSpacing:1,margin:0}}>{title}</h1>{sub&&<p style={{fontSize:12,color:"#5a564e",marginTop:4,letterSpacing:1}}>{sub}</p>}</div>{action}</div>;
const Tbl=({cols,data:rows})=><div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse"}}><thead><tr>{cols.map((c,i)=><th key={i} style={{fontSize:10,fontWeight:600,letterSpacing:1.5,textTransform:"uppercase",color:"#5a564e",padding:"10px 12px",textAlign:c.right?"right":"left",borderBottom:"1px solid rgba(182,139,46,0.08)",whiteSpace:"nowrap"}}>{c.label}</th>)}</tr></thead><tbody>{rows.map((row,ri)=><tr key={ri} onMouseEnter={e=>e.currentTarget.style.background="rgba(182,139,46,0.03)"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>{cols.map((c,ci)=><td key={ci} style={{fontSize:13,color:c.gold?"#b68b2e":c.green?"#4a9e6b":"#e8e2d6",fontWeight:c.bold?600:400,padding:"12px",textAlign:c.right?"right":"left",borderBottom:"1px solid rgba(182,139,46,0.04)",whiteSpace:"nowrap"}}>{c.render?c.render(row):row[c.key]}</td>)}</tr>)}</tbody></table></div>;
const ProgressBar=({pct,color})=><div style={{height:4,background:"rgba(182,139,46,0.1)",borderRadius:2,overflow:"hidden",marginTop:6}}><div style={{height:"100%",width:`${Math.min(pct,100)}%`,background:color||"linear-gradient(90deg,#b68b2e,#8a6a1e)",borderRadius:2,transition:"width 0.4s"}}/></div>;
const Banner=({type,count,label,onClick})=>{const cfg={yellow:{bg:"rgba(230,190,50,0.1)",border:"rgba(230,190,50,0.3)",c:"#e6be32"},orange:{bg:"rgba(220,120,40,0.1)",border:"rgba(220,120,40,0.3)",c:"#dc7828"},red:{bg:"rgba(196,92,74,0.1)",border:"rgba(196,92,74,0.3)",c:"#c45c4a"}};const s=cfg[type];return<div onClick={onClick} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 18px",background:s.bg,border:`1px solid ${s.border}`,borderRadius:10,cursor:"pointer",marginBottom:10}}><span style={{color:s.c}}>{I.warn}</span><span style={{fontSize:13,color:s.c,fontWeight:600}}>{count} {label}</span><span style={{fontSize:11,color:s.c,marginLeft:"auto",opacity:0.7}}>Click to view →</span></div>;};

// ═══════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════
export default function App(){
  const [data,setData]=useState(fresh);
  const [page,setPage]=useState("dashboard");
  const [sb,setSb]=useState(false);
  const [loading,setLoading]=useState(true);
  const [dbMode,setDbMode]=useState(false);
  const [invoiceFilter,setInvoiceFilter]=useState(null);

  useEffect(()=>{
    async function init(){
      if(db.isConnected()){
        try{
          const results={};
          for(const t of TABLES){const d=await db.getAll(t);if(d)results[t]=d;}
          if(Object.keys(results).length>0){
            const safe={...fresh()};
            for(const t of TABLES){safe[t]=Array.isArray(results[t])?results[t]:[];}
            safe.collectors=safe.collectors.map(c=>({...c,linkedArtworks:c.linkedArtworks||[]}));
            setData(safe);setDbMode(true);
          } else setData(loadLocal());
        }catch(e){console.error(e);setData(loadLocal());}
      } else setData(loadLocal());
      setLoading(false);
    }
    init();
  },[]);

  useEffect(()=>{if(!loading)localStorage.setItem(SK,JSON.stringify(data));},[data,loading]);

  const up=useCallback((table,valOrFn)=>{
    setData(prev=>{
      const oldArr=prev[table]||[];
      const newArr=typeof valOrFn==="function"?valOrFn(oldArr):valOrFn;
      if(dbMode&&Array.isArray(oldArr)&&Array.isArray(newArr)){
        const added=newArr.filter(n=>!oldArr.find(o=>o.id===n.id));
        const removed=oldArr.filter(o=>!newArr.find(n=>n.id===o.id));
        const updated=newArr.filter(n=>{const o=oldArr.find(x=>x.id===n.id);return o&&JSON.stringify(o)!==JSON.stringify(n);});
        added.forEach(item=>db.insert(table,item));
        removed.forEach(item=>db.remove(table,item.id));
        updated.forEach(item=>db.update(table,item.id,item));
      }
      return{...prev,[table]:newArr};
    });
  },[dbMode]);

  const dbUp=useCallback((table,id,fields)=>{if(dbMode&&id)db.update(table,id,fields);},[dbMode]);
  const bulkDelete=useCallback(async(table,ids)=>{
    if(dbMode){for(const id of ids)await db.remove(table,id);}
    setData(prev=>({...prev,[table]:(prev[table]||[]).filter(x=>!ids.includes(x.id))}));
  },[dbMode]);

  const liveSchedules=useMemo(()=>(data.schedules||[]).map(s=>computeStrikes(s,data.payments||[])),[data.schedules,data.payments]);
  const chasing=liveSchedules.filter(s=>s.status==="Chasing");
  const inDispute=liveSchedules.filter(s=>s.status==="In Dispute");
  const cancelled=liveSchedules.filter(s=>s.status==="Cancelled");

  const actions={
    linkArtwork:async(collectorId,artworkId,acquisitionModel)=>{
      const art=data.artworks.find(a=>a.id===artworkId);
      const col=data.collectors.find(c=>c.id===collectorId);
      if(!art||!col)return;
      const m=MODELS[acquisitionModel];
      const gn=col.type==="company"?col.companyName:`${col.firstName} ${col.lastName}`;
      const vbFee=art.recommendedPrice*m.vbPct;
      const monthly=vbFee/m.term;
      const schedule={id:uid(),collectorId,collectorName:gn,collectorEmail:col.email||"",artworkId,artworkTitle:art.title,acquisitionModel,model:acquisitionModel,totalDue:vbFee,monthlyAmount:monthly+(art.insuranceMonthly||0),insuranceMonthly:art.insuranceMonthly||0,termMonths:m.term,startDate:td(),monthsPaid:0,totalPaid:0,status:"Active",strikes:0,missedMonths:[],graceOverride:null,graceMonth:null,graceNote:"",createdAt:td()};
      up("schedules",p=>[...p,schedule]);
      up("collectors",p=>p.map(c=>{if(c.id!==collectorId)return c;const la=[...(c.linkedArtworks||[])];if(!la.find(x=>x.artworkId===artworkId))la.push({artworkId,model:acquisitionModel,linkedAt:td()});return{...c,linkedArtworks:la};}));
      up("artworks",p=>p.map(a=>a.id===artworkId?{...a,status:"Reserved"}:a));
      dbUp("artworks",artworkId,{status:"Reserved"});
    },
    recordPayment:(schedule,monthNumber,method,amount)=>{
      const payment={id:uid(),scheduleId:schedule.id,collectorId:schedule.collectorId,collectorName:schedule.collectorName,artworkId:schedule.artworkId,artworkTitle:schedule.artworkTitle,model:schedule.acquisitionModel||"A",monthNumber,amount,method,date:td(),createdAt:td()};
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
      const sched=data.schedules.find(s=>s.id===scheduleId);if(!sched)return;
      up("schedules",p=>p.filter(s=>s.id!==scheduleId));
      up("collectors",p=>p.map(c=>{if(c.id!==sched.collectorId)return c;return{...c,linkedArtworks:(c.linkedArtworks||[]).filter(l=>l.artworkId!==sched.artworkId)};}));
      const hasSale=(data.sales||[]).some(s=>s.artworkId===sched.artworkId);
      if(!hasSale){up("artworks",p=>p.map(a=>a.id===sched.artworkId?{...a,status:"Available"}:a));dbUp("artworks",sched.artworkId,{status:"Available"});}
    },
    forceDeleteArtwork:async(artworkId)=>{
      const schedIds=(data.schedules||[]).filter(s=>s.artworkId===artworkId).map(s=>s.id);
      const payIds=(data.payments||[]).filter(p=>p.artworkId===artworkId).map(p=>p.id);
      if(schedIds.length>0)await bulkDelete("schedules",schedIds);
      if(payIds.length>0)await bulkDelete("payments",payIds);
      up("collectors",p=>p.map(c=>({...c,linkedArtworks:(c.linkedArtworks||[]).filter(l=>l.artworkId!==artworkId)})));
      up("artworks",p=>p.filter(a=>a.id!==artworkId));
    },
    recordSale:(saleData)=>{
      // Auto-register new buyer if provided
      if(saleData.newBuyerData){
        up("buyers",p=>[...p,{...saleData.newBuyerData,createdAt:td()}]);
      }
      const sale={...saleData,id:uid(),date:td()};
      delete sale.newBuyerData;
      up("sales",p=>[...p,sale]);
      up("artworks",p=>p.map(a=>a.id===saleData.artworkId?{...a,status:"Sold"}:a));
      dbUp("artworks",saleData.artworkId,{status:"Sold"});
      up("schedules",p=>p.map(s=>{if(s.artworkId===saleData.artworkId&&s.status!=="Complete"){dbUp("schedules",s.id,{status:"Complete"});return{...s,status:"Complete"};}return s;}));
    },
    deleteSale:(saleId)=>{
      const sale=(data.sales||[]).find(s=>s.id===saleId);if(!sale)return;
      up("sales",p=>p.filter(s=>s.id!==saleId));
      const hasCollector=(data.collectors||[]).some(c=>(c.linkedArtworks||[]).some(l=>l.artworkId===sale.artworkId));
      up("artworks",p=>p.map(a=>a.id===sale.artworkId?{...a,status:hasCollector?"Reserved":"Available"}:a));
      dbUp("artworks",sale.artworkId,{status:hasCollector?"Reserved":"Available"});
    },
    saveBuyer:(buyer)=>{
      if(buyer.id)up("buyers",p=>p.map(b=>b.id===buyer.id?buyer:b));
      else up("buyers",p=>[{...buyer,id:uid(),createdAt:td()},...p]);
    },
    deleteBuyer:(id)=>{up("buyers",p=>p.filter(b=>b.id!==id));},
    generateReport:(yearMonth)=>{
      const locked=isReportLocked(yearMonth);
      const existing=(data.reports||[]).find(r=>r.month===yearMonth);
      if(existing&&locked){if(!confirm(`${getMonthLabel(yearMonth)} is locked (past 8th).\n\nOverride and regenerate?`))return;}
      const monthPayments=(data.payments||[]).filter(p=>(p.date||"").startsWith(yearMonth));
      const monthSales=(data.sales||[]).filter(s=>(s.date||"").startsWith(yearMonth));
      const snap={
        activeCount:liveSchedules.filter(s=>s.status==="Active").length,
        chasingCount:liveSchedules.filter(s=>s.status==="Chasing").length,
        disputeCount:liveSchedules.filter(s=>s.status==="In Dispute").length,
        cancelledCount:liveSchedules.filter(s=>s.status==="Cancelled").length,
        totalCollected:monthPayments.reduce((s,p)=>s+(p.amount||0),0),
        payments:monthPayments,
        chasing:liveSchedules.filter(s=>s.status==="Chasing").map(s=>{const col=data.collectors.find(c=>c.id===s.collectorId);return{...s,mobile:col?.mobile||""};}),
        dispute:liveSchedules.filter(s=>s.status==="In Dispute").map(s=>{const col=data.collectors.find(c=>c.id===s.collectorId);return{...s,mobile:col?.mobile||""};}),
        cancelled:liveSchedules.filter(s=>s.status==="Cancelled").map(s=>{const col=data.collectors.find(c=>c.id===s.collectorId);return{...s,mobile:col?.mobile||""};}),
        salesPayout:monthSales,
      };
      const report={id:existing?.id||uid(),month:yearMonth,generatedAt:td(),locked,snapshot:snap,totalCollected:snap.totalCollected,activeCount:snap.activeCount,chasingCount:snap.chasingCount,disputeCount:snap.disputeCount,cancelledCount:snap.cancelledCount};
      if(existing)up("reports",p=>p.map(r=>r.month===yearMonth?report:r));
      else up("reports",p=>[...p,report]);
    },
  };

  const nav=[
    {id:"dashboard",label:"Dashboard",icon:I.dash},
    {id:"catalogue",label:"Art Catalogue",icon:I.art},
    {id:"artists",label:"Artists",icon:I.star},
    {id:"collectors",label:"Collectors",icon:I.ppl},
    {id:"buyers",label:"Buyers",icon:I.buyer},
    {id:"calculator",label:"Calculator",icon:I.calc},
    {id:"gallery",label:"Gallery",icon:I.gallery},
    {id:"invoices",label:"Invoicing",icon:I.bill},
    {id:"sales",label:"Sales",icon:I.sale},
    {id:"reports",label:"Reports",icon:I.report},
  ];

  const d={artworks:Array.isArray(data.artworks)?data.artworks:[],artists:Array.isArray(data.artists)?data.artists:[],collectors:Array.isArray(data.collectors)?data.collectors:[],buyers:Array.isArray(data.buyers)?data.buyers:[],schedules:liveSchedules,payments:Array.isArray(data.payments)?data.payments:[],sales:Array.isArray(data.sales)?data.sales:[],reports:Array.isArray(data.reports)?data.reports:[]};
  const navTo=(p,filter)=>{setPage(p);if(filter)setInvoiceFilter(filter);setSb(false);};

  const pg={
    dashboard:<Dashboard data={d} navTo={navTo} chasing={chasing} inDispute={inDispute} cancelled={cancelled}/>,
    catalogue:<Catalogue data={d} up={up} actions={actions}/>,
    artists:<ArtistsPage data={d} up={up}/>,
    collectors:<CollectorsPage data={d} up={up} actions={actions}/>,
    buyers:<BuyersPage data={d} actions={actions}/>,
    calculator:<CalcPage/>,
    gallery:<GalleryPage/>,
    invoices:<InvoicePage data={d} actions={actions} initialFilter={invoiceFilter} clearFilter={()=>setInvoiceFilter(null)}/>,
    sales:<SalesPage data={d} actions={actions}/>,
    reports:<ReportsPage data={d} actions={actions}/>,
  };

  if(loading)return<div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"100vh",background:"#0c0b09"}}><div style={{textAlign:"center"}}><div style={{fontFamily:"Cormorant Garamond,serif",fontSize:32,fontWeight:300,letterSpacing:8,color:"#f5f0e8",marginBottom:12}}>VOLLARD <span style={{color:"#b68b2e"}}>BLACK</span></div><div style={{fontSize:13,color:"#5a564e",letterSpacing:2}}>Loading platform...</div></div></div>;

  return(
    <div style={{display:"flex",minHeight:"100vh",background:"#0c0b09",fontFamily:"DM Sans,sans-serif",color:"#e8e2d6"}}>
      {sb&&<div onClick={()=>setSb(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",zIndex:98}}/>}
      <aside style={{width:240,minHeight:"100vh",background:"#111010",borderRight:"1px solid rgba(182,139,46,0.1)",display:"flex",flexDirection:"column",position:"fixed",left:sb?0:"-240px",top:0,bottom:0,zIndex:99,transition:"left 0.3s",...(typeof window!=="undefined"&&window.innerWidth>900?{position:"relative",left:0}:{})}}>
        <div style={{padding:"28px 24px 20px",borderBottom:"1px solid rgba(182,139,46,0.08)"}}>
          <div style={{fontFamily:"Cormorant Garamond,serif",fontSize:22,fontWeight:300,letterSpacing:6,color:"#f5f0e8"}}>VOLLARD <span style={{color:"#b68b2e"}}>BLACK</span></div>
          <div style={{fontSize:9,letterSpacing:3,textTransform:"uppercase",color:"#5a564e",marginTop:4}}>Fine Art Acquisitions</div>
        </div>
        <nav style={{flex:1,padding:"16px 12px",overflowY:"auto"}}>
          {nav.map(n=>{const alertCount=n.id==="invoices"?chasing.length+inDispute.length+cancelled.length:0;return<button key={n.id} onClick={()=>navTo(n.id)} style={{display:"flex",alignItems:"center",gap:12,width:"100%",padding:"12px 14px",background:page===n.id?"rgba(182,139,46,0.1)":"transparent",border:"none",borderRadius:10,color:page===n.id?"#b68b2e":"#8a8477",fontSize:13,fontWeight:page===n.id?600:400,cursor:"pointer",marginBottom:4,fontFamily:"DM Sans,sans-serif"}}>{n.icon}<span style={{flex:1,textAlign:"left"}}>{n.label}</span>{alertCount>0&&<span style={{fontSize:10,background:"rgba(196,92,74,0.2)",color:"#c45c4a",padding:"2px 6px",borderRadius:8,fontWeight:700}}>{alertCount}</span>}</button>;})}
        </nav>
        <div style={{padding:"16px 24px",borderTop:"1px solid rgba(182,139,46,0.08)",fontSize:10,color:"#5a564e",letterSpacing:2}}>
          <div>MODEL A: 40/60 · 24 MO</div>
          <div style={{marginTop:4}}>MODEL B: 30/70 · 12 MO</div>
          <div style={{marginTop:4}}>GALLERY 40 · VB 30 · ARTIST 30</div>
          <div style={{marginTop:8,display:"flex",alignItems:"center",gap:6}}><div style={{width:6,height:6,borderRadius:"50%",background:dbMode?"#4a9e6b":"#b68b2e"}}/><span style={{fontSize:9}}>{dbMode?"Supabase Connected":"Local Storage"}</span></div>
        </div>
      </aside>
      <main style={{flex:1,minWidth:0}}>
        <div style={{display:typeof window!=="undefined"&&window.innerWidth>900?"none":"flex",alignItems:"center",padding:"16px 20px",borderBottom:"1px solid rgba(182,139,46,0.08)",background:"#111010"}}>
          <button onClick={()=>setSb(true)} style={{background:"none",border:"none",color:"#b68b2e",cursor:"pointer",padding:4}}>{I.menu}</button>
          <span style={{fontFamily:"Cormorant Garamond,serif",fontSize:16,letterSpacing:4,marginLeft:12,color:"#f5f0e8"}}>VOLLARD <span style={{color:"#b68b2e"}}>BLACK</span></span>
        </div>
        <div style={{padding:"32px 28px",maxWidth:1200,margin:"0 auto"}}>{pg[page]}</div>
      </main>
    </div>
  );
}

// ═══════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════
function Dashboard({data,navTo,chasing,inDispute,cancelled}){
  const totalPay=data.payments.reduce((s,p)=>s+(p.amount||0),0);
  const md={};data.payments.forEach(p=>{const k=(p.date||"").slice(0,7);if(k)md[k]=(md[k]||0)+(p.amount||0);});
  const sm=Object.keys(md).sort();const mx=Math.max(...Object.values(md),1);
  const months=["","Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const daysTo25=25-new Date().getDate();
  const upcomingSchedules=data.schedules.filter(s=>s.status==="Active"&&s.monthsPaid<s.termMonths).slice(0,6);
  return(<div>
    <PT title="Dashboard" sub="Vollard Black — Fine Art Acquisitions"/>
    {cancelled.length>0&&<Banner type="red" count={cancelled.length} label="agreements cancelled" onClick={()=>navTo("invoices","Cancelled")}/>}
    {inDispute.length>0&&<Banner type="orange" count={inDispute.length} label="accounts in dispute" onClick={()=>navTo("invoices","In Dispute")}/>}
    {chasing.length>0&&<Banner type="yellow" count={chasing.length} label="collectors being chased" onClick={()=>navTo("invoices","Chasing")}/>}
    {daysTo25>0&&daysTo25<=7&&<div style={{padding:"12px 18px",background:"rgba(74,158,107,0.08)",border:"1px solid rgba(74,158,107,0.2)",borderRadius:10,marginBottom:10,fontSize:13,color:"#4a9e6b"}}>Payment window opens in {daysTo25} days (25th).</div>}
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(145px,1fr))",gap:14,marginBottom:28}}>
      <Stat label="Artworks" value={data.artworks.length}/>
      <Stat label="Active" value={data.schedules.filter(s=>s.status==="Active").length} green/>
      <Stat label="Collectors" value={data.collectors.length}/>
      <Stat label="Buyers" value={data.buyers.length} gold/>
      <Stat label="Sales" value={data.sales.length} gold/>
      <Stat label="Collected" value={"R "+fmt(totalPay)} green/>
    </div>
    <Card style={{marginBottom:20}}>
      <div style={{fontSize:14,fontWeight:600,color:"#f5f0e8",marginBottom:16}}>Monthly Revenue</div>
      {sm.length===0?<div style={{textAlign:"center",padding:"32px 0",color:"#5a564e",fontSize:13}}>No payment data yet.</div>:
      <div style={{display:"flex",alignItems:"flex-end",gap:6,height:160,padding:"0 8px"}}>
        {sm.map(m=>{const v=md[m];const h=Math.max((v/mx)*130,4);return<div key={m} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4,maxWidth:60}}><div style={{fontSize:10,color:"#b68b2e",fontWeight:600}}>R{(v/1000).toFixed(0)}k</div><div style={{width:"100%",height:h,background:"linear-gradient(180deg,#b68b2e,#8a6a1e)",borderRadius:"4px 4px 0 0",minWidth:20}}/><div style={{fontSize:9,color:"#5a564e"}}>{months[parseInt(m.slice(5))]||m.slice(5)}</div></div>;})}
      </div>}
    </Card>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
      <Card><div style={{fontSize:14,fontWeight:600,color:"#f5f0e8",marginBottom:16}}>Active Schedules</div>
        {upcomingSchedules.length===0?<p style={{fontSize:13,color:"#5a564e"}}>No active schedules.</p>:upcomingSchedules.map(s=>{const pct=s.termMonths>0?(s.monthsPaid/s.termMonths)*100:0;return<div key={s.id} style={{padding:"10px 0",borderBottom:"1px solid rgba(182,139,46,0.04)"}}><div style={{display:"flex",justifyContent:"space-between",fontSize:13,alignItems:"center"}}><span style={{fontWeight:500}}>{s.collectorName}</span><div style={{display:"flex",alignItems:"center",gap:8}}><Badge model={s.acquisitionModel||"A"}/><span style={{color:"#b68b2e",fontWeight:600}}>R {fmt(s.monthlyAmount)}/mo</span></div></div><div style={{fontSize:11,color:"#5a564e",marginBottom:4}}>{s.artworkTitle} · Month {s.monthsPaid} of {s.termMonths}</div><ProgressBar pct={pct}/></div>;})}
      </Card>
      <Card><div style={{fontSize:14,fontWeight:600,color:"#f5f0e8",marginBottom:16}}>Recent Activity</div>
        {data.sales.length===0&&data.payments.length===0?<p style={{fontSize:13,color:"#5a564e"}}>No activity yet.</p>:
        [...data.sales.slice(-3).reverse().map(s=><div key={s.id} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:"1px solid rgba(182,139,46,0.04)",fontSize:13}}><div><div>{s.artworkTitle}</div>{s.buyerName&&<div style={{fontSize:11,color:"#5a564e"}}>Buyer: {s.buyerName}</div>}</div><span style={{color:"#4a9e6b",fontWeight:600}}>R {fmt(s.salePrice)}</span></div>),
        ...data.payments.slice(-3).reverse().map(p=><div key={p.id} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:"1px solid rgba(182,139,46,0.04)",fontSize:13}}><span>{p.collectorName} · Mo {p.monthNumber}</span><span style={{color:"#b68b2e",fontWeight:600}}>R {fmt(p.amount)}</span></div>)]}
      </Card>
    </div>
    <div style={{display:"flex",gap:10,marginTop:24,flexWrap:"wrap"}}>
      <Btn gold onClick={()=>navTo("catalogue")}>{I.plus} Add Artwork</Btn>
      <Btn ghost onClick={()=>navTo("collectors")}>{I.plus} Add Collector</Btn>
      <Btn ghost onClick={()=>navTo("buyers")}>{I.plus} Add Buyer</Btn>
      <Btn ghost onClick={()=>navTo("reports")}>{I.report} Reports</Btn>
    </div>
  </div>);
}

// ═══════════════════════════════════════════
// CATALOGUE
// ═══════════════════════════════════════════
function Catalogue({data,up,actions}){
  const [modal,setModal]=useState(null);const [search,setSearch]=useState("");const [delModal,setDelModal]=useState(null);
  const blank={id:"",title:"",artist:"",artistId:"",medium:"",dimensions:"",year:"",recommendedPrice:"",imageUrl:"",status:"Available",description:"",galleryName:"",insuranceMonthly:""};
  const save=(a)=>{if(a.id)up("artworks",p=>p.map(x=>x.id===a.id?a:x));else up("artworks",p=>[{...a,id:uid(),createdAt:td()},...p]);setModal(null);};
  const f=data.artworks.filter(a=>(a.title+a.artist+a.status).toLowerCase().includes(search.toLowerCase()));
  const handleDelete=(art)=>{const has=(data.schedules||[]).some(s=>s.artworkId===art.id)||(data.sales||[]).some(s=>s.artworkId===art.id);if(has)setDelModal(art);else{if(confirm("Delete this artwork?"))up("artworks",p=>p.filter(a=>a.id!==art.id));}};
  return(<div>
    <PT title="Art Catalogue" sub={`${data.artworks.length} artworks`} action={<Btn gold onClick={()=>setModal("add")}>{I.plus} Add Artwork</Btn>}/>
    <Card>
      <div style={{marginBottom:16}}><input placeholder="Search..." value={search} onChange={e=>setSearch(e.target.value)} style={{...is,maxWidth:360}}/></div>
      {f.length===0?<Empty msg="No artworks yet." action={<Btn gold onClick={()=>setModal("add")}>{I.plus} Add</Btn>}/>:
      <Tbl cols={[
        {label:"",render:r=>r.imageUrl?<div style={{width:44,height:44,borderRadius:6,overflow:"hidden"}}><img src={r.imageUrl} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/></div>:<div style={{width:44,height:44,borderRadius:6,background:"rgba(182,139,46,0.08)",display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:16,color:"#5a564e"}}>◆</span></div>},
        {label:"Title",key:"title",bold:true},{label:"Artist",key:"artist"},
        {label:"Price",right:true,render:r=>"R "+fmt(r.recommendedPrice)},
        {label:"Model A · 40%",right:true,gold:true,render:r=>"R "+fmt(r.recommendedPrice*0.40)},
        {label:"Model B · 30%",right:true,render:r=><span style={{color:"#4a9e6b"}}>R {fmt(r.recommendedPrice*0.30)}</span>},
        {label:"Status",render:r=><Badge status={r.status}/>},
        {label:"",render:r=><div style={{display:"flex",gap:6}}><button onClick={e=>{e.stopPropagation();setModal(r);}} style={{background:"none",border:"none",color:"#8a8477",cursor:"pointer"}}>{I.edit}</button><button onClick={e=>{e.stopPropagation();handleDelete(r);}} style={{background:"none",border:"none",color:"#5a564e",cursor:"pointer"}}>{I.del}</button></div>},
      ]} data={f}/>}
    </Card>
    {modal&&<ArtModal art={modal==="add"?blank:modal} artists={data.artists||[]} onSave={save} onClose={()=>setModal(null)}/>}
    {delModal&&<Modal title="Force Delete Artwork" onClose={()=>setDelModal(null)}><p style={{fontSize:14,color:"#e8e2d6",marginBottom:8}}>This artwork has active schedules or sales history.</p><p style={{fontSize:13,color:"#8a8477",marginBottom:20}}>Deleting will permanently remove all associated data. Cannot be undone.</p><div style={{display:"flex",gap:10,justifyContent:"flex-end"}}><Btn ghost onClick={()=>setDelModal(null)}>Cancel</Btn><Btn danger onClick={()=>{actions.forceDeleteArtwork(delModal.id);setDelModal(null);}}>Force Delete</Btn></div></Modal>}
  </div>);
}

function ArtModal({art,artists,onSave,onClose}){
  const [f,sF]=useState({...art});const s=(k,v)=>sF(p=>({...p,[k]:v}));
  const hFile=(file)=>{if(!file?.type.startsWith("image/"))return;if(file.size>5242880)return alert("Max 5MB");const r=new FileReader();r.onload=e=>s("imageUrl",e.target.result);r.readAsDataURL(file);};
  return(<Modal title={art.id?"Edit Artwork":"Add Artwork"} onClose={onClose} wide>
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
            <Btn ghost onClick={()=>document.getElementById("imgUp").click()} style={{justifyContent:"center",width:"100%",padding:"14px"}}>{I.up} {f.imageUrl?"Change":"Upload"}</Btn>
            <input id="imgUp" type="file" accept="image/*" onChange={e=>hFile(e.target.files[0])} style={{display:"none"}}/>
            <div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:9,color:"#5a564e",letterSpacing:1,textTransform:"uppercase",whiteSpace:"nowrap"}}>URL:</span><input value={f.imageUrl?.startsWith("data:")?"":f.imageUrl||""} onChange={e=>s("imageUrl",e.target.value)} style={{...is,marginBottom:0,fontSize:12}} placeholder="https://..."/></div>
          </div>
          {f.imageUrl&&<div style={{position:"relative",flexShrink:0}}><div style={{width:130,height:130,borderRadius:10,overflow:"hidden",border:"1px solid rgba(182,139,46,0.15)"}}><img src={f.imageUrl} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/></div><button onClick={()=>s("imageUrl","")} style={{position:"absolute",top:4,right:4,width:22,height:22,borderRadius:6,background:"rgba(0,0,0,0.7)",border:"none",color:"#c45c4a",cursor:"pointer",fontSize:14}}>×</button></div>}
        </div>
      </Field>
      <Field label="Description" style={{gridColumn:"1/-1"}}><textarea value={f.description} onChange={e=>s("description",e.target.value)} style={{...is,minHeight:80,resize:"vertical"}} placeholder="Describe the artwork..."/></Field>
    </div>
    <div style={{display:"flex",gap:10,marginTop:20,justifyContent:"flex-end"}}><Btn ghost onClick={onClose}>Cancel</Btn><Btn gold onClick={()=>{if(!f.title||!f.recommendedPrice)return alert("Title & price required");onSave(f);}}>{art.id?"Save":"Add"}</Btn></div>
  </Modal>);
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
    <Card><div style={{marginBottom:16}}><input placeholder="Search..." value={search} onChange={e=>setSearch(e.target.value)} style={{...is,maxWidth:400}}/></div>
      {f.length===0?<Empty msg="No artists yet." action={<Btn gold onClick={()=>setModal("add")}>{I.plus} Add</Btn>}/>:
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:16}}>
        {f.map(a=><div key={a.id} style={{background:"#1e1d1a",border:"1px solid rgba(182,139,46,0.08)",borderRadius:12,padding:20}} onMouseEnter={e=>e.currentTarget.style.borderColor="rgba(182,139,46,0.25)"} onMouseLeave={e=>e.currentTarget.style.borderColor="rgba(182,139,46,0.08)"}>
          <div style={{display:"flex",gap:14}}>
            <div style={{width:56,height:56,borderRadius:12,flexShrink:0,background:"linear-gradient(135deg,rgba(182,139,46,0.2),rgba(182,139,46,0.05))",display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden"}}>{a.profileImageUrl?<img src={a.profileImageUrl} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<span style={{fontFamily:"Cormorant Garamond,serif",fontSize:22,color:"#b68b2e",fontWeight:600}}>{a.name.split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase()}</span>}</div>
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
  return(<Modal title={artist.id?"Edit Artist":"Add Artist"} onClose={onClose} wide>
    <div style={{display:"flex",gap:4,marginBottom:20,borderBottom:"1px solid rgba(182,139,46,0.08)",paddingBottom:12}}>
      {[["personal","Personal"],["art","Artistic"],["bank","Banking"]].map(([id,l])=><button key={id} onClick={()=>setTab(id)} style={{padding:"8px 16px",borderRadius:6,border:"none",cursor:"pointer",fontSize:12,fontWeight:tab===id?600:400,fontFamily:"DM Sans,sans-serif",background:tab===id?"rgba(182,139,46,0.12)":"transparent",color:tab===id?"#b68b2e":"#8a8477"}}>{l}</button>)}
    </div>
    {tab==="personal"&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}><Field label="Full Name" style={{gridColumn:"1/-1"}}><input value={f.name} onChange={e=>s("name",e.target.value)} style={is}/></Field><Field label="Email"><input value={f.email} onChange={e=>s("email",e.target.value)} style={is}/></Field><Field label="Mobile"><input value={f.mobile} onChange={e=>s("mobile",e.target.value)} style={is}/></Field><Field label="City"><input value={f.city} onChange={e=>s("city",e.target.value)} style={is}/></Field><Field label="Country"><input value={f.country} onChange={e=>s("country",e.target.value)} style={is}/></Field><Field label="Profile Image URL" style={{gridColumn:"1/-1"}}><input value={f.profileImageUrl} onChange={e=>s("profileImageUrl",e.target.value)} style={is}/></Field></div>}
    {tab==="art"&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}><Field label="Medium"><input value={f.medium} onChange={e=>s("medium",e.target.value)} style={is}/></Field><Field label="Style"><input value={f.style} onChange={e=>s("style",e.target.value)} style={is}/></Field><Field label="Website"><input value={f.website} onChange={e=>s("website",e.target.value)} style={is}/></Field><Field label="Instagram"><input value={f.instagram} onChange={e=>s("instagram",e.target.value)} style={is}/></Field><Field label="Bio" style={{gridColumn:"1/-1"}}><textarea value={f.bio} onChange={e=>s("bio",e.target.value)} style={{...is,minHeight:100,resize:"vertical"}}/></Field></div>}
    {tab==="bank"&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}><Field label="Bank"><input value={f.bankName} onChange={e=>s("bankName",e.target.value)} style={is}/></Field><Field label="Account Holder"><input value={f.accountHolder} onChange={e=>s("accountHolder",e.target.value)} style={is}/></Field><Field label="Account No"><input value={f.accountNumber} onChange={e=>s("accountNumber",e.target.value)} style={is}/></Field><Field label="Branch Code"><input value={f.branchCode} onChange={e=>s("branchCode",e.target.value)} style={is}/></Field><Field label="Type"><select value={f.accountType} onChange={e=>s("accountType",e.target.value)} style={ss}><option value="">—</option><option>Cheque</option><option>Savings</option><option>Business</option></select></Field></div>}
    <div style={{display:"flex",gap:10,marginTop:24,justifyContent:"flex-end"}}><Btn ghost onClick={onClose}>Cancel</Btn><Btn gold onClick={()=>{if(!f.name)return alert("Name required");onSave(f);}}>{artist.id?"Save":"Add"}</Btn></div>
  </Modal>);
}

// ═══════════════════════════════════════════
// COLLECTORS
// ═══════════════════════════════════════════
function CollectorsPage({data,up,actions}){
  const [modal,setModal]=useState(null);const [link,setLink]=useState(null);const [search,setSearch]=useState("");
  const blank={id:"",type:"individual",firstName:"",lastName:"",companyName:"",email:"",mobile:"",idNumber:"",nationality:"",address:"",linkedArtworks:[]};
  const save=(inv)=>{if(inv.id)up("collectors",p=>p.map(x=>x.id===inv.id?inv:x));else up("collectors",p=>[{...inv,id:uid(),createdAt:td()},...p]);setModal(null);};
  const del=(id)=>{if(confirm("Delete?"))up("collectors",p=>p.filter(x=>x.id!==id));};
  const gn=(i)=>i.type==="company"?i.companyName:`${i.firstName} ${i.lastName}`;
  const f=data.collectors.filter(i=>gn(i).toLowerCase().includes(search.toLowerCase()));
  const handleLink=async(cId,artId,model)=>{await actions.linkArtwork(cId,artId,model);setLink(null);};
  const handleUnlink=(schedId)=>{if(confirm("Cancel this schedule?"))actions.unlinkArtwork(schedId);};
  return(<div>
    <PT title="Collectors" sub={`${data.collectors.length} registered`} action={<Btn gold onClick={()=>setModal("add")}>{I.plus} Add Collector</Btn>}/>
    <Card><div style={{marginBottom:16}}><input placeholder="Search..." value={search} onChange={e=>setSearch(e.target.value)} style={{...is,maxWidth:360}}/></div>
      {f.length===0?<Empty msg="No collectors yet." action={<Btn gold onClick={()=>setModal("add")}>{I.plus} Add</Btn>}/>:
      <Tbl cols={[
        {label:"Name",bold:true,render:r=>gn(r)},{label:"Type",key:"type"},{label:"Email",key:"email"},
        {label:"Schedules",render:r=>{const scheds=data.schedules.filter(s=>s.collectorId===r.id);if(scheds.length===0)return<span style={{color:"#5a564e"}}>None</span>;return<div>{scheds.map(s=><div key={s.id} style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}><span style={{fontSize:12}}>{s.artworkTitle}</span><Badge model={s.acquisitionModel||"A"}/><Badge status={s.status} sched/><button onClick={e=>{e.stopPropagation();handleUnlink(s.id);}} style={{background:"none",border:"none",color:"#c45c4a",cursor:"pointer",fontSize:10,textDecoration:"underline"}}>cancel</button></div>)}</div>;}},
        {label:"",render:r=><div style={{display:"flex",gap:6}}><Btn small ghost onClick={e=>{e.stopPropagation();setLink(r);}}>Link Art</Btn><button onClick={e=>{e.stopPropagation();setModal(r);}} style={{background:"none",border:"none",color:"#8a8477",cursor:"pointer"}}>{I.edit}</button><button onClick={e=>{e.stopPropagation();del(r.id);}} style={{background:"none",border:"none",color:"#5a564e",cursor:"pointer"}}>{I.del}</button></div>},
      ]} data={f}/>}
    </Card>
    {modal&&<ColMdl col={modal==="add"?blank:modal} onSave={save} onClose={()=>setModal(null)}/>}
    {link&&<LinkMdl col={link} arts={data.artworks.filter(a=>a.status==="Available")} onLink={handleLink} onClose={()=>setLink(null)} gn={gn}/>}
  </div>);
}

function ColMdl({col,onSave,onClose}){
  const [f,sF]=useState({...col});const s=(k,v)=>sF(p=>({...p,[k]:v}));
  return(<Modal title={col.id?"Edit Collector":"Add Collector"} onClose={onClose} wide>
    <Field label="Type"><select value={f.type} onChange={e=>s("type",e.target.value)} style={ss}><option value="individual">Individual</option><option value="company">Company</option></select></Field>
    {f.type==="company"?<Field label="Company"><input value={f.companyName} onChange={e=>s("companyName",e.target.value)} style={is}/></Field>:<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}><Field label="First Name"><input value={f.firstName} onChange={e=>s("firstName",e.target.value)} style={is}/></Field><Field label="Last Name"><input value={f.lastName} onChange={e=>s("lastName",e.target.value)} style={is}/></Field></div>}
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}><Field label="Email"><input value={f.email} onChange={e=>s("email",e.target.value)} style={is}/></Field><Field label="Mobile"><input value={f.mobile} onChange={e=>s("mobile",e.target.value)} style={is}/></Field><Field label="ID/Passport"><input value={f.idNumber} onChange={e=>s("idNumber",e.target.value)} style={is}/></Field><Field label="Nationality"><input value={f.nationality} onChange={e=>s("nationality",e.target.value)} style={is}/></Field></div>
    <Field label="Address"><textarea value={f.address} onChange={e=>s("address",e.target.value)} style={{...is,minHeight:60,resize:"vertical"}}/></Field>
    <div style={{display:"flex",gap:10,marginTop:20,justifyContent:"flex-end"}}><Btn ghost onClick={onClose}>Cancel</Btn><Btn gold onClick={()=>{if(f.type==="company"?!f.companyName:!f.firstName||!f.lastName)return alert("Name required");onSave(f);}}>{col.id?"Save":"Add"}</Btn></div>
  </Modal>);
}

function LinkMdl({col,arts,onLink,onClose,gn}){
  const [artId,setArtId]=useState("");const [acqModel,setAcqModel]=useState("A");
  const art=arts.find(a=>a.id===artId);
  const m=MODELS[acqModel];
  const vbFee=art?art.recommendedPrice*m.vbPct:0;
  const monthly=art?vbFee/m.term:0;
  return(<Modal title={`Link Artwork — ${gn(col)}`} onClose={onClose}>
    <Field label="Artwork"><select value={artId} onChange={e=>setArtId(e.target.value)} style={ss}><option value="">—</option>{arts.map(a=><option key={a.id} value={a.id}>{a.title} — R {fmt(a.recommendedPrice)}</option>)}</select></Field>
    <Field label="Acquisition Model">
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        {["A","B"].map(k=>{const mod=MODELS[k];return<button key={k} onClick={()=>setAcqModel(k)} style={{padding:14,borderRadius:10,border:acqModel===k?"2px solid #b68b2e":"1px solid rgba(182,139,46,0.15)",background:acqModel===k?"rgba(182,139,46,0.08)":"#1e1d1a",color:acqModel===k?"#b68b2e":"#8a8477",cursor:"pointer",fontFamily:"DM Sans,sans-serif",textAlign:"left"}}>
          <div style={{fontSize:13,fontWeight:600,marginBottom:4}}>{mod.label}</div>
          <div style={{fontSize:11,opacity:0.8}}>VB {Math.round(mod.vbPct*100)}% · Collector {Math.round(mod.colPct*100)}%</div>
          <div style={{fontSize:11,opacity:0.8}}>{mod.term} months</div>
          {art&&<div style={{fontSize:12,marginTop:6,color:acqModel===k?"#b68b2e":"#8a8477",fontWeight:600}}>R {fmt(art.recommendedPrice*mod.vbPct/mod.term)}/mo</div>}
        </button>;})}
      </div>
    </Field>
    {art&&<Card style={{background:"#1e1d1a",marginTop:8}}><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,fontSize:13}}>
      <span style={{color:"#8a8477"}}>Artwork value:</span><span style={{textAlign:"right"}}>R {fmt(art.recommendedPrice)}</span>
      <span style={{color:"#8a8477"}}>VB fee ({Math.round(m.vbPct*100)}%):</span><span style={{textAlign:"right",color:"#b68b2e",fontWeight:600}}>R {fmt(vbFee)}</span>
      <span style={{color:"#8a8477"}}>Collector receives ({Math.round(m.colPct*100)}%):</span><span style={{textAlign:"right",color:"#4a9e6b"}}>R {fmt(art.recommendedPrice*m.colPct)}</span>
      <span style={{color:"#8a8477"}}>Monthly over {m.term} mo:</span><span style={{textAlign:"right",fontWeight:600}}>R {fmt(monthly)}</span>
      <span style={{color:"#8a8477"}}>Collector profit:</span><span style={{textAlign:"right",color:"#4a9e6b",fontWeight:600}}>R {fmt(art.recommendedPrice*(m.colPct-m.vbPct))} ({Math.round((m.colPct-m.vbPct)/m.vbPct*100)}% ROI)</span>
      <span style={{color:"#8a8477"}}>If unsold:</span><span style={{textAlign:"right",fontSize:11}}>Collector takes artwork</span>
    </div></Card>}
    <div style={{display:"flex",gap:10,marginTop:20,justifyContent:"flex-end"}}><Btn ghost onClick={onClose}>Cancel</Btn><Btn gold disabled={!artId} onClick={()=>onLink(col.id,artId,acqModel)}>Create Schedule</Btn></div>
  </Modal>);
}

// ═══════════════════════════════════════════
// BUYERS
// ═══════════════════════════════════════════
function BuyersPage({data,actions}){
  const [modal,setModal]=useState(null);const [search,setSearch]=useState("");const [selected,setSelected]=useState(null);
  const blank={id:"",type:"individual",firstName:"",lastName:"",companyName:"",email:"",mobile:"",idNumber:"",nationality:"",address:"",city:"",country:"South Africa",notes:""};
  const f=data.buyers.filter(b=>buyerName(b).toLowerCase().includes(search.toLowerCase())||(b.email||"").toLowerCase().includes(search.toLowerCase()));
  const getPurchases=(buyerId)=>data.sales.filter(s=>s.buyerId===buyerId);
  const getTotalSpend=(buyerId)=>getPurchases(buyerId).reduce((s,x)=>s+(x.salePrice||0),0);
  return(<div>
    <PT title="Buyers" sub={`${data.buyers.length} registered buyers`} action={<Btn gold onClick={()=>setModal("add")}>{I.plus} Register Buyer</Btn>}/>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:14,marginBottom:28}}>
      <Stat label="Total Buyers" value={data.buyers.length} gold/>
      <Stat label="Repeat Buyers" value={data.buyers.filter(b=>getPurchases(b.id).length>1).length} green/>
      <Stat label="Total Purchases" value={data.sales.filter(s=>s.buyerId).length}/>
      <Stat label="Total Spend" value={"R "+fmt(data.sales.filter(s=>s.buyerId).reduce((s,x)=>s+(x.salePrice||0),0))} gold/>
    </div>
    <div style={{display:"grid",gridTemplateColumns:selected?"1fr 380px":"1fr",gap:20}}>
      <Card>
        <div style={{marginBottom:16}}><input placeholder="Search buyers..." value={search} onChange={e=>setSearch(e.target.value)} style={{...is,maxWidth:400}}/></div>
        {f.length===0?<Empty msg="No buyers yet." action={<Btn gold onClick={()=>setModal("add")}>{I.plus} Register</Btn>}/>:
        <Tbl cols={[
          {label:"Name",bold:true,render:r=><button onClick={()=>setSelected(selected?.id===r.id?null:r)} style={{background:"none",border:"none",color:"#b68b2e",cursor:"pointer",fontSize:13,fontWeight:600,textDecoration:"underline"}}>{buyerName(r)}</button>},
          {label:"Type",render:r=>r.type==="company"?"Company":"Individual"},
          {label:"Email",key:"email"},{label:"Nationality",key:"nationality"},
          {label:"Purchases",render:r=><span style={{color:"#b68b2e",fontWeight:600}}>{getPurchases(r.id).length}</span>},
          {label:"Total Spend",right:true,gold:true,render:r=>"R "+fmt(getTotalSpend(r.id))},
          {label:"",render:r=><div style={{display:"flex",gap:6}}><button onClick={e=>{e.stopPropagation();setModal(r);}} style={{background:"none",border:"none",color:"#8a8477",cursor:"pointer"}}>{I.edit}</button><button onClick={e=>{e.stopPropagation();if(confirm("Delete buyer?"))actions.deleteBuyer(r.id);}} style={{background:"none",border:"none",color:"#5a564e",cursor:"pointer"}}>{I.del}</button></div>},
        ]} data={f}/>}
      </Card>
      {selected&&<BuyerProfile buyer={selected} purchases={getPurchases(selected.id)} artworks={data.artworks} collectors={data.collectors} onClose={()=>setSelected(null)} onEdit={()=>setModal(selected)}/>}
    </div>
    {modal&&<BuyerModal buyer={modal==="add"?blank:modal} onSave={(b)=>{actions.saveBuyer(b);setModal(null);if(selected?.id===b.id)setSelected(b);}} onClose={()=>setModal(null)}/>}
  </div>);
}

function BuyerProfile({buyer,purchases,artworks,collectors,onClose,onEdit}){
  return<Card style={{position:"sticky",top:20}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20}}>
      <div><div style={{fontFamily:"Cormorant Garamond,serif",fontSize:20,fontWeight:400,color:"#f5f0e8"}}>{buyerName(buyer)}</div><div style={{fontSize:11,color:"#5a564e",marginTop:2,letterSpacing:1,textTransform:"uppercase"}}>{buyer.type==="company"?"Company":"Individual"} · {buyer.nationality||"—"}</div></div>
      <div style={{display:"flex",gap:6}}><Btn small ghost onClick={onEdit}>{I.edit}</Btn><button onClick={onClose} style={{background:"none",border:"none",color:"#8a8477",cursor:"pointer"}}>{I.x}</button></div>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,fontSize:12,marginBottom:16}}>
      {[["Email",buyer.email],["Mobile",buyer.mobile],["ID",buyer.idNumber],["City",buyer.city],["Country",buyer.country]].map(([l,v])=>v?<div key={l}><div style={{fontSize:9,letterSpacing:2,textTransform:"uppercase",color:"#5a564e",marginBottom:2}}>{l}</div><div style={{color:"#e8e2d6"}}>{v}</div></div>:null)}
    </div>
    <div style={{fontSize:11,letterSpacing:2,textTransform:"uppercase",color:"#5a564e",marginBottom:10}}>Purchase History ({purchases.length})</div>
    {purchases.length===0?<p style={{fontSize:13,color:"#5a564e"}}>No purchases yet.</p>:purchases.map(sale=>{
      const art=artworks.find(a=>a.id===sale.artworkId);
      const col=collectors.find(c=>c.id===sale.collectorId);
      const colName=col?(col.type==="company"?col.companyName:`${col.firstName} ${col.lastName}`):"—";
      return<div key={sale.id} style={{padding:12,background:"#1e1d1a",borderRadius:8,marginBottom:8}}>
        <div style={{display:"flex",gap:10}}>
          {art?.imageUrl&&<div style={{width:40,height:40,borderRadius:6,overflow:"hidden",flexShrink:0}}><img src={art.imageUrl} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/></div>}
          <div style={{flex:1}}>
            <div style={{fontSize:13,fontWeight:600,color:"#f5f0e8"}}>{sale.artworkTitle}</div>
            <div style={{fontSize:11,color:"#5a564e",marginTop:2}}>{sale.date} · Collector: {colName}</div>
            <div style={{display:"flex",gap:12,marginTop:4,fontSize:12}}>
              <span style={{color:"#b68b2e",fontWeight:600}}>R {fmt(sale.salePrice)}</span>
              <Badge model={sale.acquisitionModel||"A"}/>
            </div>
          </div>
        </div>
      </div>;
    })}
    {purchases.length>0&&<div style={{borderTop:"1px solid rgba(182,139,46,0.08)",paddingTop:10,marginTop:4,display:"flex",justifyContent:"space-between",fontSize:13}}><span style={{color:"#8a8477"}}>Total spend:</span><span style={{color:"#b68b2e",fontWeight:700}}>R {fmt(purchases.reduce((s,x)=>s+(x.salePrice||0),0))}</span></div>}
    {buyer.notes&&<div style={{marginTop:12,fontSize:12,color:"#8a8477",padding:"10px 12px",background:"#1e1d1a",borderRadius:8}}>{buyer.notes}</div>}
  </Card>;
}

function BuyerModal({buyer,onSave,onClose}){
  const [f,sF]=useState({...buyer});const s=(k,v)=>sF(p=>({...p,[k]:v}));const isNew=!buyer.id;
  return(<Modal title={isNew?"Register Buyer":"Edit Buyer"} onClose={onClose} wide>
    <Field label="Type"><div style={{display:"flex",gap:8}}>{[["individual","Individual"],["company","Company"]].map(([id,l])=><button key={id} onClick={()=>s("type",id)} style={{flex:1,padding:10,borderRadius:8,border:f.type===id?"2px solid #b68b2e":"1px solid rgba(182,139,46,0.15)",background:f.type===id?"rgba(182,139,46,0.08)":"#1e1d1a",color:f.type===id?"#b68b2e":"#8a8477",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"DM Sans,sans-serif"}}>{l}</button>)}</div></Field>
    {f.type==="company"?<Field label="Company Name"><input value={f.companyName||""} onChange={e=>s("companyName",e.target.value)} style={is}/></Field>:<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}><Field label="First Name"><input value={f.firstName||""} onChange={e=>s("firstName",e.target.value)} style={is}/></Field><Field label="Last Name"><input value={f.lastName||""} onChange={e=>s("lastName",e.target.value)} style={is}/></Field></div>}
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
      <Field label="Email"><input value={f.email||""} onChange={e=>s("email",e.target.value)} style={is}/></Field>
      <Field label="Mobile"><input value={f.mobile||""} onChange={e=>s("mobile",e.target.value)} style={is}/></Field>
      <Field label="ID / Passport"><input value={f.idNumber||""} onChange={e=>s("idNumber",e.target.value)} style={is}/></Field>
      <Field label="Nationality"><input value={f.nationality||""} onChange={e=>s("nationality",e.target.value)} style={is}/></Field>
      <Field label="City"><input value={f.city||""} onChange={e=>s("city",e.target.value)} style={is}/></Field>
      <Field label="Country"><input value={f.country||""} onChange={e=>s("country",e.target.value)} style={is}/></Field>
    </div>
    <Field label="Address"><textarea value={f.address||""} onChange={e=>s("address",e.target.value)} style={{...is,minHeight:60,resize:"vertical"}}/></Field>
    <Field label="Notes"><textarea value={f.notes||""} onChange={e=>s("notes",e.target.value)} style={{...is,minHeight:60,resize:"vertical"}} placeholder="Additional notes..."/></Field>
    <div style={{display:"flex",gap:10,marginTop:20,justifyContent:"flex-end"}}><Btn ghost onClick={onClose}>Cancel</Btn><Btn gold onClick={()=>{const name=f.type==="company"?f.companyName:`${f.firstName} ${f.lastName}`;if(!name?.trim())return alert("Name required");onSave(f);}}>{isNew?"Register":"Save"} Buyer</Btn></div>
  </Modal>);
}

// ═══════════════════════════════════════════
// CALCULATOR — Model A & B
// ═══════════════════════════════════════════
function CalcPage(){
  const [artVal,setArtVal]=useState("");
  const [saleVal,setSaleVal]=useState("");
  const [acqModel,setAcqModel]=useState("A");
  const [monthsSold,setMonthsSold]=useState("");
  const [galleryPct,setGalleryPct]=useState(40);
  const [vbPct2,setVbPct2]=useState(30);
  const [artistPct,setArtistPct]=useState(30);
  const [introPct,setIntroPct]=useState(0);

  const av=parseFloat(artVal)||0;
  const sp=parseFloat(saleVal)||av;
  const mo=Math.max(1,Math.min(parseInt(monthsSold)||1,MODELS[acqModel].term));
  const m=MODELS[acqModel];
  const deal=av>0?calcDeal(av,sp,acqModel,mo,galleryPct,vbPct2,artistPct,introPct):{};
  const splitTotal=Number(galleryPct)+Number(vbPct2)+Number(artistPct);
  const splitOk=Math.round(splitTotal)===100;
  const scenarioMonths=[1,3,6,9,12,15,18,21,24].filter(x=>x<=m.term);
  const belowValue=av>0&&sp>0&&sp<av;
  const aboveValue=av>0&&sp>0&&sp>av;

  const row=(label,val,color,bold,size)=><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 0",borderBottom:"1px solid rgba(182,139,46,0.05)"}}>
    <span style={{fontSize:13,color:"#8a8477"}}>{label}</span>
    <span style={{fontSize:size||13,fontWeight:bold?700:500,color:color||"#e8e2d6",fontFamily:bold?"Cormorant Garamond,serif":"DM Sans,sans-serif"}}>{val}</span>
  </div>;
  const divider=<div style={{height:1,background:"rgba(182,139,46,0.12)",margin:"6px 0"}}/>;

  return(<div>
    <PT title="Acquisition Calculator" sub="Model A · Model B · Deal Scenarios"/>

    {/* Responsive grid - stacks on mobile */}
    <div style={{display:"grid",gridTemplateColumns:"minmax(0,340px) minmax(0,1fr)",gap:20,alignItems:"start"}}>

      {/* LEFT — Inputs */}
      <div>
        {/* Model selector */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
          {["A","B"].map(k=>{const mod=MODELS[k];const active=acqModel===k;return<button key={k} onClick={()=>{setAcqModel(k);setMonthsSold("");}} style={{padding:14,borderRadius:10,border:active?"2px solid #b68b2e":"1px solid rgba(182,139,46,0.15)",background:active?"rgba(182,139,46,0.08)":"#1e1d1a",color:active?"#b68b2e":"#8a8477",cursor:"pointer",fontFamily:"DM Sans,sans-serif",textAlign:"left",transition:"all 0.15s"}}>
            <div style={{fontSize:14,fontWeight:600,marginBottom:6}}>{mod.label}</div>
            <div style={{fontSize:11,opacity:0.8}}>VB {Math.round(mod.vbPct*100)}% · Collector {Math.round(mod.colPct*100)}%</div>
            <div style={{fontSize:11,opacity:0.8,marginTop:2}}>{mod.term} month term</div>
            {av>0&&<div style={{fontSize:12,marginTop:8,color:active?"#b68b2e":"#8a8477",fontWeight:600}}>R {fmt(av*mod.vbPct/mod.term)}/mo</div>}
          </button>;})}
        </div>

        <Card style={{marginBottom:14}}>
          <Field label="Artwork Value (R)">
            <input type="number" value={artVal} onChange={e=>setArtVal(e.target.value)} style={is} placeholder="e.g. 100000"/>
          </Field>
          <Field label="Actual Sale Price (R)">
            <input type="number" value={saleVal} onChange={e=>setSaleVal(e.target.value)} style={is} placeholder={artVal||"e.g. 100000"}/>
            {belowValue&&<div style={{fontSize:11,color:"#e6be32",marginTop:4}}>Below artwork value — collector receives less</div>}
            {aboveValue&&<div style={{fontSize:11,color:"#4a9e6b",marginTop:4}}>Above artwork value — surplus split 50/50</div>}
          </Field>
          <Field label={`Month Sold (1 – ${m.term})`} style={{marginBottom:0}}>
            <input type="number" value={monthsSold} onChange={e=>setMonthsSold(e.target.value)} onBlur={e=>{const v=parseInt(e.target.value)||1;setMonthsSold(Math.max(1,Math.min(v,m.term)));}} style={is} placeholder={`1 – ${m.term}`} min={1} max={m.term}/>
          </Field>
        </Card>

        <Card style={{marginBottom:14}}>
          <div style={{fontSize:11,letterSpacing:2,textTransform:"uppercase",color:"#5a564e",marginBottom:12}}>Introducer Fee</div>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <input type="number" value={introPct||""} onChange={e=>setIntroPct(parseFloat(e.target.value)||0)} style={{...is,flex:1}} placeholder="0" min={0} max={50}/>
            <span style={{fontSize:13,color:"#5a564e",flexShrink:0}}>% of payout</span>
            {av>0&&deal.introFee>0&&<span style={{fontSize:13,color:"#c45c4a",fontWeight:600,flexShrink:0}}>R {fmt(deal.introFee)}</span>}
          </div>
        </Card>

        <Card>
          <div style={{fontSize:11,letterSpacing:2,textTransform:"uppercase",color:"#5a564e",marginBottom:4}}>Backend Split — VB's fee</div>
          {!splitOk&&<div style={{fontSize:11,color:"#c45c4a",marginBottom:10}}>⚠ Must total 100% (currently {Math.round(splitTotal)}%)</div>}
          {!splitOk&&<div style={{fontSize:11,color:"#5a564e",marginBottom:10}}>Applies to VB's {Math.round(m.vbPct*100)}% fee only — not visible to collectors</div>}
          {[["Gallery",galleryPct,setGalleryPct],["Vollard Black",vbPct2,setVbPct2],["Artist",artistPct,setArtistPct]].map(([l,v,sv])=><div key={l} style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
            <span style={{fontSize:13,color:"#e8e2d6",minWidth:90,flexShrink:0}}>{l}</span>
            <input type="number" value={v||""} onChange={e=>sv(parseFloat(e.target.value)||0)} style={{...is,width:64,padding:"8px 10px",fontSize:13,flexShrink:0}} min={0} max={100} placeholder="0"/>
            <span style={{fontSize:12,color:"#5a564e",flexShrink:0}}>%</span>
            {av>0&&deal.vbTotal>0&&splitOk&&<span style={{fontSize:12,color:"#b68b2e",marginLeft:"auto",flexShrink:0}}>R {fmt(deal.vbTotal*(v/100))}</span>}
          </div>)}
          {splitOk&&av>0&&deal.vbTotal>0&&<div style={{borderTop:"1px solid rgba(182,139,46,0.08)",paddingTop:10,marginTop:4,display:"flex",justifyContent:"space-between",fontSize:12}}><span style={{color:"#5a564e"}}>Total VB fee split</span><span style={{color:"#b68b2e",fontWeight:600}}>R {fmt(deal.vbTotal)}</span></div>}
        </Card>
      </div>

      {/* RIGHT — Results */}
      <div>
        {av===0?<Card style={{padding:32,textAlign:"center"}}><div style={{fontSize:32,color:"#5a564e",marginBottom:12}}>◆</div><p style={{color:"#5a564e",fontSize:14}}>Enter artwork value to see deal scenarios.</p></Card>:
        <>
          {/* 3 key numbers */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:16}}>
            <Card style={{padding:14,textAlign:"center",border:"1px solid rgba(74,158,107,0.2)"}}>
              <div style={{fontSize:9,letterSpacing:2,color:"#5a564e",marginBottom:6}}>COLLECTOR RECEIVES</div>
              <div style={{fontFamily:"Cormorant Garamond,serif",fontSize:24,fontWeight:600,color:"#4a9e6b"}}>R {fmt(deal.colNet||0)}</div>
              <div style={{fontSize:10,color:"#4a9e6b",marginTop:4}}>Profit R {fmt(deal.colProfit||0)} · {Math.round(deal.colROI||0)}% ROI</div>
            </Card>
            <Card style={{padding:14,textAlign:"center",border:"1px solid rgba(182,139,46,0.2)"}}>
              <div style={{fontSize:9,letterSpacing:2,color:"#5a564e",marginBottom:6}}>VB TOTAL</div>
              <div style={{fontFamily:"Cormorant Garamond,serif",fontSize:24,fontWeight:600,color:"#b68b2e"}}>R {fmt(deal.vbTotal||0)}</div>
              <div style={{fontSize:10,color:"#8a8477",marginTop:4}}>R {fmt(deal.paid||0)} collected</div>
            </Card>
            <Card style={{padding:14,textAlign:"center"}}>
              <div style={{fontSize:9,letterSpacing:2,color:"#5a564e",marginBottom:6}}>SALE PRICE</div>
              <div style={{fontFamily:"Cormorant Garamond,serif",fontSize:24,fontWeight:600,color:"#f5f0e8"}}>R {fmt(sp)}</div>
              {aboveValue&&<div style={{fontSize:10,color:"#4a9e6b",marginTop:4}}>+R {fmt(deal.surplus||0)} surplus</div>}
              {belowValue&&<div style={{fontSize:10,color:"#e6be32",marginTop:4}}>−R {fmt(deal.deficit||0)} below value</div>}
            </Card>
          </div>

          {/* Settlement */}
          <Card style={{marginBottom:14}}>
            <div style={{fontSize:12,fontWeight:600,color:"#f5f0e8",marginBottom:2}}>Settlement — Month {mo} · {m.label}</div>
            <div style={{fontSize:11,color:"#5a564e",marginBottom:14}}>What happens at point of sale</div>
            {row("Monthly payment",`R ${fmt(deal.monthly)}/mo`)}
            {row(`Collected (${mo} month${mo>1?"s":""})`,`R ${fmt(deal.paid)}`,`#b68b2e`)}
            {row("VB balance at sale",`R ${fmt(deal.vbBalance)}`,deal.vbBalance>0?"#c45c4a":"#4a9e6b")}
            {aboveValue&&row("Surplus above value",`R ${fmt(deal.surplus)}`,`#4a9e6b`)}
            {aboveValue&&row("Collector surplus bonus (50%)",`+ R ${fmt(deal.surplusCol)}`,`#4a9e6b`)}
            {divider}
            {row(`Collector ${Math.round(m.colPct*100)}% of sale price`,`R ${fmt(deal.colBase)}`,`#4a9e6b`)}
            {deal.surplusCol>0&&row("Plus surplus bonus",`+ R ${fmt(deal.surplusCol)}`,`#4a9e6b`)}
            {deal.vbBalance>0&&row("Less VB balance",`− R ${fmt(deal.vbBalance)}`,`#c45c4a`)}
            {deal.introFee>0&&row("Less introducer fee",`− R ${fmt(deal.introFee)}`,`#c45c4a`)}
            {divider}
            {row("Collector net payout",`R ${fmt(deal.colNet)}`,`#4a9e6b`,true,20)}
            {row("Collector paid in total",`R ${fmt(deal.paid)}`)}
            {row("Collector profit",`R ${fmt(deal.colProfit)}`,deal.colProfit>=0?"#4a9e6b":"#c45c4a",true)}
            {row("Collector ROI",`${Math.round(deal.colROI)}%`,deal.colROI>=0?"#b68b2e":"#c45c4a",true)}
          </Card>

          {/* All scenarios */}
          <Card>
            <div style={{fontSize:12,fontWeight:600,color:"#f5f0e8",marginBottom:2}}>All Scenarios — {m.label}</div>
            <div style={{fontSize:11,color:"#5a564e",marginBottom:14}}>Sale price R {fmt(sp)} · same result regardless of month</div>
            <div style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                <thead><tr>{["Month","Paid In","VB Balance","Receives","Profit","ROI"].map(h=><th key={h} style={{fontSize:10,fontWeight:600,letterSpacing:1,textTransform:"uppercase",color:"#5a564e",padding:"8px 10px",textAlign:"right",borderBottom:"1px solid rgba(182,139,46,0.08)",whiteSpace:"nowrap",textAlign:h==="Month"?"left":"right"}}>{h}</th>)}</tr></thead>
                <tbody>{scenarioMonths.map(mo2=>{const d=calcDeal(av,sp,acqModel,mo2,galleryPct,vbPct2,artistPct,introPct);const isSelected=mo2===mo;return<tr key={mo2} style={{background:isSelected?"rgba(182,139,46,0.06)":"transparent"}}>
                  <td style={{padding:"9px 10px",borderBottom:"1px solid rgba(182,139,46,0.04)",fontWeight:isSelected?600:400,color:isSelected?"#b68b2e":"#e8e2d6"}}>Mo {mo2}{isSelected?<span style={{fontSize:9,marginLeft:4,color:"#b68b2e"}}>◆</span>:""}</td>
                  <td style={{padding:"9px 10px",borderBottom:"1px solid rgba(182,139,46,0.04)",textAlign:"right",color:"#8a8477"}}>R {fmt(d.paid)}</td>
                  <td style={{padding:"9px 10px",borderBottom:"1px solid rgba(182,139,46,0.04)",textAlign:"right",color:d.vbBalance>0?"#c45c4a":"#4a9e6b"}}>R {fmt(d.vbBalance)}</td>
                  <td style={{padding:"9px 10px",borderBottom:"1px solid rgba(182,139,46,0.04)",textAlign:"right",color:"#4a9e6b",fontWeight:600}}>R {fmt(d.colNet)}</td>
                  <td style={{padding:"9px 10px",borderBottom:"1px solid rgba(182,139,46,0.04)",textAlign:"right",color:d.colProfit>=0?"#4a9e6b":"#c45c4a"}}>R {fmt(d.colProfit)}</td>
                  <td style={{padding:"9px 10px",borderBottom:"1px solid rgba(182,139,46,0.04)",textAlign:"right",color:"#b68b2e",fontWeight:600}}>{Math.round(d.colROI)}%</td>
                </tr>;})}
                </tbody>
              </table>
            </div>
            {sp===av&&<div style={{fontSize:11,color:"#5a564e",marginTop:10,padding:"8px 10px",background:"rgba(182,139,46,0.04)",borderRadius:6}}>At recommended price, collector profit is always R {fmt(av*(m.colPct-m.vbPct))} — timing only changes the ROI %.</div>}
            {belowValue&&<div style={{fontSize:11,color:"#e6be32",marginTop:10,padding:"8px 10px",background:"rgba(230,190,50,0.06)",borderRadius:6}}>Sale below recommended price — collector receives less than their full {Math.round(m.colPct*100)}% entitlement.</div>}
          </Card>
        </>}
      </div>
    </div>

    {/* Mobile media query via inline style on wrapper */}
    <style>{`
      @media (max-width: 700px) {
        .calc-grid { grid-template-columns: 1fr !important; }
      }
    `}</style>
  </div>);
}

// ═══════════════════════════════════════════
// INVOICING
// ═══════════════════════════════════════════
function InvoicePage({data,actions,initialFilter,clearFilter}){
  const [activeTab,setActiveTab]=useState("all");
  const [statusFilter,setStatusFilter]=useState(initialFilter||"all");
  const [payModal,setPayModal]=useState(null);
  const [missModal,setMissModal]=useState(null);
  const [overrideModal,setOverrideModal]=useState(null);
  const [graceModal,setGraceModal]=useState(null);
  const [emailModal,setEmailModal]=useState(null);
  const [reportTab,setReportTab]=useState(null);
  const [expanded,setExpanded]=useState({});
  const [search,setSearch]=useState("");
  const [pg,setPg]=useState(0);

  useEffect(()=>{if(initialFilter){setStatusFilter(initialFilter);clearFilter();}},[initialFilter]);
  const gn=c=>c?c.type==="company"?c.companyName:`${c.firstName} ${c.lastName}`:"";
  const collectorsWithSchedules=data.collectors.filter(c=>data.schedules.some(s=>s.collectorId===c.id));
  const allSchedules=data.schedules;
  const tabSchedules=activeTab==="all"?allSchedules:allSchedules.filter(s=>s.collectorId===activeTab);
  const filteredSchedules=tabSchedules.filter(s=>{const matchStatus=statusFilter==="all"||s.status===statusFilter;const matchSearch=!search||(s.collectorName+s.artworkTitle).toLowerCase().includes(search.toLowerCase());return matchStatus&&matchSearch;});
  const pagedSchedules=activeTab==="all"?filteredSchedules.slice(pg*PAGE_SIZE,(pg+1)*PAGE_SIZE):filteredSchedules;
  const totalPages=Math.ceil(filteredSchedules.length/PAGE_SIZE);
  const active=allSchedules.filter(s=>s.status==="Active").length;
  const chasing=allSchedules.filter(s=>s.status==="Chasing").length;
  const dispute=allSchedules.filter(s=>s.status==="In Dispute").length;
  const cancelledCount=allSchedules.filter(s=>s.status==="Cancelled").length;
  const totalCollected=data.payments.reduce((s,p)=>s+(p.amount||0),0);
  const toggleExpand=(id)=>setExpanded(p=>({...p,[id]:!p[id]}));
  const getNextUnpaid=(sched)=>{const paidMonths=new Set(data.payments.filter(p=>p.scheduleId===sched.id).map(p=>p.monthNumber));const missedMonths=new Set(sched.missedMonths||[]);for(let m=1;m<=sched.termMonths;m++){if(!paidMonths.has(m)&&!missedMonths.has(m))return m;}return null;};
  const getHistory=(schedId)=>data.payments.filter(p=>p.scheduleId===schedId).sort((a,b)=>a.monthNumber-b.monthNumber);
  const reportData={Chasing:allSchedules.filter(s=>s.status==="Chasing").map(s=>({...s,col:data.collectors.find(c=>c.id===s.collectorId)})),"In Dispute":allSchedules.filter(s=>s.status==="In Dispute").map(s=>({...s,col:data.collectors.find(c=>c.id===s.collectorId)})),Cancelled:allSchedules.filter(s=>s.status==="Cancelled").map(s=>({...s,col:data.collectors.find(c=>c.id===s.collectorId)}))};
  const statusBtnCfg=[{key:"all",label:"All"},{key:"Active",label:"Active",color:"#4a9e6b"},{key:"Chasing",label:"Chasing",color:"#e6be32"},{key:"In Dispute",label:"In Dispute",color:"#dc7828"},{key:"Cancelled",label:"Cancelled",color:"#c45c4a"},{key:"Complete",label:"Complete",color:"#648cc8"}];
  const buildEmailTargets=(status)=>{const scheds=allSchedules.filter(s=>s.status===status);const by={};scheds.forEach(s=>{const col=data.collectors.find(c=>c.id===s.collectorId);if(!by[s.collectorId])by[s.collectorId]={id:s.collectorId,name:s.collectorName,email:col?.email||"",schedules:[]};by[s.collectorId].schedules.push(s);});return Object.values(by);};

  return(<div>
    <PT title="Invoicing" sub={`${allSchedules.length} schedules · ${data.collectors.length} collectors`}/>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))",gap:14,marginBottom:24}}>
      <Stat label="Active" value={active} green/><Stat label="Chasing" value={chasing} orange/><Stat label="In Dispute" value={dispute} orange/><Stat label="Cancelled" value={cancelledCount} red/><Stat label="Collected" value={"R "+fmt(totalCollected)} gold/>
    </div>
    <Card style={{marginBottom:20,padding:16}}>
      <div style={{fontSize:11,letterSpacing:2,textTransform:"uppercase",color:"#5a564e",marginBottom:12}}>Mass Email Actions</div>
      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
        <Btn small ghost onClick={()=>setEmailModal({status:"Active",templateKey:"upcoming",targets:buildEmailTargets("Active")})} style={{borderColor:"rgba(74,158,107,0.3)",color:"#4a9e6b"}}>{I.mail} Remind Active</Btn>
        <Btn small ghost onClick={()=>setEmailModal({status:"Chasing",templateKey:"missed",targets:buildEmailTargets("Chasing")})} style={{borderColor:"rgba(230,190,50,0.3)",color:"#e6be32"}}>{I.mail} Chase All</Btn>
        <Btn small ghost onClick={()=>setEmailModal({status:"In Dispute",templateKey:"dispute",targets:buildEmailTargets("In Dispute")})} style={{borderColor:"rgba(220,120,40,0.3)",color:"#dc7828"}}>{I.mail} Dispute All</Btn>
        <Btn small ghost onClick={()=>setEmailModal({status:"Cancelled",templateKey:"cancelled",targets:buildEmailTargets("Cancelled")})} style={{borderColor:"rgba(196,92,74,0.3)",color:"#c45c4a"}}>{I.mail} Cancellation All</Btn>
        <Btn small ghost onClick={()=>setEmailModal({status:"custom",templateKey:"upcoming",targets:[]})}>{I.mail} Custom Email</Btn>
      </div>
    </Card>
    <Card style={{marginBottom:20,padding:16}}>
      <div style={{fontSize:11,letterSpacing:2,textTransform:"uppercase",color:"#5a564e",marginBottom:12}}>Monthly Report</div>
      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
        {["Chasing","In Dispute","Cancelled"].map(k=><Btn key={k} small ghost onClick={()=>setReportTab(reportTab===k?null:k)} style={{borderColor:k==="Chasing"?"rgba(230,190,50,0.3)":k==="In Dispute"?"rgba(220,120,40,0.3)":"rgba(196,92,74,0.3)",color:k==="Chasing"?"#e6be32":k==="In Dispute"?"#dc7828":"#c45c4a"}}>{I.report} {k} ({reportData[k].length})</Btn>)}
      </div>
      {reportTab&&<div style={{marginTop:16,borderTop:"1px solid rgba(182,139,46,0.08)",paddingTop:16}}>
        <div style={{fontSize:13,fontWeight:600,color:"#f5f0e8",marginBottom:12}}>{reportTab} — {reportData[reportTab].length}</div>
        {reportData[reportTab].length===0?<p style={{fontSize:13,color:"#5a564e"}}>None.</p>:
        <Tbl cols={[{label:"Collector",bold:true,render:r=>r.collectorName},{label:"Model",render:r=><Badge model={r.acquisitionModel||"A"}/>},{label:"Email",render:r=>r.col?.email||"—"},{label:"Mobile",render:r=>r.col?.mobile||"—"},{label:"Artwork",key:"artworkTitle"},{label:"Strikes",render:r=><span style={{color:"#c45c4a",fontWeight:700}}>{r.strikes}</span>},{label:"Outstanding",right:true,render:r=>"R "+fmt((r.totalDue||0)-(r.totalPaid||0))},{label:"",render:r=>{const col=data.collectors.find(c=>c.id===r.collectorId);const tplKey=reportTab==="Chasing"?"individual_missed":reportTab==="In Dispute"?"individual_dispute":"individual_cancelled";const tpl=TEMPLATES[tplKey](r.collectorName,r.artworkTitle,(r.totalDue||0)-(r.totalPaid||0));return<Btn small ghost onClick={()=>openGmail([col?.email||""],tpl.subject,tpl.body)} style={{fontSize:10}}>{I.mail}</Btn>;}}]} data={reportData[reportTab]}/>}
      </div>}
    </Card>

    {/* Collector tabs */}
    <div style={{display:"flex",gap:0,marginBottom:20,borderBottom:"1px solid rgba(182,139,46,0.1)",overflowX:"auto"}}>
      <button onClick={()=>{setActiveTab("all");setPg(0);}} style={{padding:"12px 20px",border:"none",borderBottom:activeTab==="all"?"2px solid #b68b2e":"2px solid transparent",background:"transparent",color:activeTab==="all"?"#b68b2e":"#8a8477",fontSize:12,fontWeight:activeTab==="all"?600:400,cursor:"pointer",fontFamily:"DM Sans,sans-serif",whiteSpace:"nowrap"}}>
        All <span style={{marginLeft:6,fontSize:10,background:"rgba(182,139,46,0.1)",color:"#b68b2e",padding:"2px 7px",borderRadius:10}}>{allSchedules.length}</span>
      </button>
      {collectorsWithSchedules.map(c=>{const cScheds=allSchedules.filter(s=>s.collectorId===c.id);const alerts=cScheds.filter(s=>["Chasing","In Dispute","Cancelled"].includes(s.status)).length;const isActive=activeTab===c.id;return<button key={c.id} onClick={()=>{setActiveTab(c.id);setPg(0);}} style={{padding:"12px 20px",border:"none",borderBottom:isActive?"2px solid #b68b2e":"2px solid transparent",background:"transparent",color:isActive?"#b68b2e":"#8a8477",fontSize:12,fontWeight:isActive?600:400,cursor:"pointer",fontFamily:"DM Sans,sans-serif",whiteSpace:"nowrap",display:"inline-flex",alignItems:"center",gap:6}}>{gn(c)}{alerts>0&&<span style={{fontSize:10,background:"rgba(196,92,74,0.15)",color:"#c45c4a",padding:"2px 7px",borderRadius:10,fontWeight:700}}>{alerts}</span>}</button>;})}
    </div>

    <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap",alignItems:"center"}}>
      {statusBtnCfg.map(b=><button key={b.key} onClick={()=>{setStatusFilter(b.key);setPg(0);}} style={{padding:"7px 14px",borderRadius:8,border:`1px solid ${statusFilter===b.key?(b.color||"#b68b2e"):"rgba(182,139,46,0.15)"}`,background:statusFilter===b.key?"rgba(182,139,46,0.08)":"transparent",color:statusFilter===b.key?(b.color||"#b68b2e"):"#8a8477",fontSize:11,fontWeight:statusFilter===b.key?600:400,cursor:"pointer",fontFamily:"DM Sans,sans-serif"}}>{b.label}</button>)}
      <input placeholder="Search..." value={search} onChange={e=>{setSearch(e.target.value);setPg(0);}} style={{...is,maxWidth:260,marginLeft:"auto",padding:"8px 12px",fontSize:12}}/>
    </div>

    {pagedSchedules.length===0?<Empty msg="No schedules match this filter."/>:
    pagedSchedules.map(sched=>{
      const m=MODELS[sched.acquisitionModel||"A"];
      const pct=sched.termMonths>0?(sched.monthsPaid/sched.termMonths)*100:100;
      const nextMonth=getNextUnpaid(sched);const nextDue=nextMonth?getNextDueDate(sched.startDate,nextMonth):null;
      const outstanding=(sched.totalDue||0)-(sched.totalPaid||0);
      const history=getHistory(sched.id);const isExpanded=expanded[sched.id];
      const sc=schedC[sched.status]||{bg:"#1e1d1a",c:"#8a8477"};
      const art=data.artworks.find(a=>a.id===sched.artworkId);
      const missedSet=new Set(sched.missedMonths||[]);
      return<Card key={sched.id} style={{marginBottom:12,padding:0,overflow:"hidden"}}>
        <div style={{height:3,background:sc.c,opacity:0.6}}/>
        <div style={{padding:20}}>
          <div style={{display:"flex",gap:16,alignItems:"flex-start"}}>
            <div style={{width:52,height:52,borderRadius:8,flexShrink:0,overflow:"hidden",background:"rgba(182,139,46,0.08)",display:"flex",alignItems:"center",justifyContent:"center"}}>{art?.imageUrl?<img src={art.imageUrl} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<span style={{fontSize:18,color:"#5a564e"}}>◆</span>}</div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap",marginBottom:4}}>
                {activeTab==="all"&&<span style={{fontSize:15,fontWeight:700,color:"#f5f0e8"}}>{sched.collectorName}</span>}
                <span style={{fontSize:13,color:"#8a8477"}}>{sched.artworkTitle}</span>
                <Badge model={sched.acquisitionModel||"A"}/>
                <Badge status={sched.status} sched/>
                {sched.strikes>0&&<span style={{fontSize:11,color:"#c45c4a",fontWeight:700}}>⚠ {sched.strikes} strike{sched.strikes>1?"s":""}</span>}
              </div>
              <div style={{display:"flex",gap:16,fontSize:12,color:"#8a8477",marginBottom:8,flexWrap:"wrap"}}>
                <span>Month <strong style={{color:"#f5f0e8"}}>{sched.monthsPaid}</strong> of {sched.termMonths}</span>
                <span style={{color:"#b68b2e",fontWeight:600}}>R {fmt(sched.monthlyAmount)}/mo</span>
                <span>VB {Math.round(m.vbPct*100)}% · Collector {Math.round(m.colPct*100)}%</span>
                {nextDue&&<span>Next due: <strong style={{color:"#f5f0e8"}}>{nextDue}</strong></span>}
              </div>
              <div style={{display:"flex",gap:20,fontSize:12,marginBottom:8}}>
                <span>Paid: <strong style={{color:"#4a9e6b"}}>R {fmt(sched.totalPaid||0)}</strong></span>
                <span>Outstanding: <strong style={{color:"#b68b2e"}}>R {fmt(outstanding)}</strong></span>
                <span>Total fee: <strong style={{color:"#f5f0e8"}}>R {fmt(sched.totalDue)}</strong></span>
              </div>
              <ProgressBar pct={pct} color={sc.c}/>
              {missedSet.size>0&&<div style={{marginTop:8,display:"flex",gap:6,flexWrap:"wrap"}}>{[...missedSet].map(m=><span key={m} style={{fontSize:10,background:"rgba(196,92,74,0.12)",color:"#c45c4a",padding:"3px 8px",borderRadius:5,fontWeight:600}}>Mo {m} missed</span>)}</div>}
            </div>
            <div style={{display:"flex",gap:6,flexShrink:0,flexWrap:"wrap",justifyContent:"flex-end",maxWidth:300}}>
              {nextMonth&&sched.status!=="Cancelled"&&sched.status!=="Complete"&&<>
                <Btn small gold onClick={()=>setPayModal({sched,nextMonth,nextDue})}>{I.ok} Pay Mo {nextMonth}</Btn>
                <Btn small danger onClick={()=>setMissModal({sched,nextMonth})}>Miss Mo {nextMonth}</Btn>
              </>}
              {["Chasing","In Dispute","Cancelled"].includes(sched.status)&&<Btn small ghost onClick={()=>setOverrideModal(sched)} style={{borderColor:"rgba(160,100,220,0.3)",color:"#a064dc"}}>Override</Btn>}
              <Btn small ghost onClick={()=>setGraceModal(sched)}>Grace</Btn>
              <button onClick={()=>toggleExpand(sched.id)} style={{background:"none",border:"1px solid rgba(182,139,46,0.15)",borderRadius:6,color:"#8a8477",cursor:"pointer",padding:"6px 10px",display:"flex",alignItems:"center",gap:4,fontSize:11}}>
                <span style={{transform:isExpanded?"rotate(180deg)":"none",transition:"0.2s",display:"inline-flex"}}>{I.chevron}</span>{history.length} paid
              </button>
            </div>
          </div>
          {isExpanded&&<div style={{marginTop:16,borderTop:"1px solid rgba(182,139,46,0.06)",paddingTop:16}}>
            {history.length===0?<p style={{fontSize:13,color:"#5a564e"}}>No payments recorded yet.</p>:
            <Tbl cols={[{label:"Month",render:r=>`Month ${r.monthNumber}`},{label:"Date",key:"date"},{label:"Method",key:"method"},{label:"Amount",right:true,gold:true,render:r=>"R "+fmt(r.amount)}]} data={history}/>}
            {sched.graceNote&&<p style={{fontSize:12,color:"#a064dc",marginTop:8}}>Grace: {sched.graceNote}</p>}
            {sched.overrideNote&&<p style={{fontSize:12,color:"#a064dc",marginTop:4}}>Override: {sched.overrideNote}</p>}
          </div>}
        </div>
      </Card>;
    })}

    {activeTab==="all"&&totalPages>1&&<div style={{display:"flex",justifyContent:"center",gap:8,marginTop:20}}><Btn small ghost disabled={pg===0} onClick={()=>setPg(p=>p-1)}>← Prev</Btn><span style={{padding:"8px 16px",fontSize:13,color:"#8a8477"}}>Page {pg+1} of {totalPages}</span><Btn small ghost disabled={pg>=totalPages-1} onClick={()=>setPg(p=>p+1)}>Next →</Btn></div>}

    {payModal&&<Modal title={`Record Payment — Month ${payModal.nextMonth}`} onClose={()=>setPayModal(null)}>
      <Card style={{background:"#1e1d1a",marginBottom:16}}><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,fontSize:13}}>
        <span style={{color:"#8a8477"}}>Collector:</span><span style={{fontWeight:600}}>{payModal.sched.collectorName}</span>
        <span style={{color:"#8a8477"}}>Artwork:</span><span>{payModal.sched.artworkTitle}</span>
        <span style={{color:"#8a8477"}}>Model:</span><span><Badge model={payModal.sched.acquisitionModel||"A"}/></span>
        <span style={{color:"#8a8477"}}>Month:</span><span>{payModal.nextMonth} of {payModal.sched.termMonths}</span>
        <span style={{color:"#8a8477"}}>Amount:</span><span style={{color:"#b68b2e",fontWeight:700,fontSize:16}}>R {fmt(payModal.sched.monthlyAmount)}</span>
      </div></Card>
      <div style={{fontSize:11,letterSpacing:2,textTransform:"uppercase",color:"#5a564e",marginBottom:10}}>Payment Method</div>
      {payM.map(m=>{const bs={display:"block",width:"100%",padding:12,marginBottom:8,borderRadius:8,border:"1px solid rgba(182,139,46,0.15)",background:"#1e1d1a",color:"#e8e2d6",cursor:"pointer",fontSize:13,fontFamily:"DM Sans,sans-serif",textAlign:"left"};return<button key={m} onClick={()=>{actions.recordPayment(payModal.sched,payModal.nextMonth,m,payModal.sched.monthlyAmount);setPayModal(null);}} style={bs} onMouseEnter={e=>{e.currentTarget.style.borderColor="rgba(182,139,46,0.4)";e.currentTarget.style.background="#252320";}} onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(182,139,46,0.15)";e.currentTarget.style.background="#1e1d1a";}}>{m}</button>;})}
    </Modal>}

    {missModal&&<Modal title={`Mark Month ${missModal.nextMonth} as Missed`} onClose={()=>setMissModal(null)}>
      <div style={{padding:16,background:"rgba(196,92,74,0.08)",border:"1px solid rgba(196,92,74,0.2)",borderRadius:10,marginBottom:20}}>
        <div style={{fontSize:13,color:"#e8e2d6",marginBottom:6}}><strong>{missModal.sched.collectorName}</strong> — {missModal.sched.artworkTitle}</div>
        <div style={{fontSize:12,color:"#8a8477",marginTop:4}}>Strikes: {missModal.sched.strikes} → {Math.min((missModal.sched.strikes||0)+1,3)} · New status: <strong style={{color:"#c45c4a"}}>{(missModal.sched.strikes||0)+1===1?"Chasing":(missModal.sched.strikes||0)+1===2?"In Dispute":"Cancelled"}</strong></div>
      </div>
      <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}><Btn ghost onClick={()=>setMissModal(null)}>Cancel</Btn><Btn danger onClick={()=>{actions.recordMissed(missModal.sched,missModal.nextMonth);setMissModal(null);}}>Confirm Miss Mo {missModal.nextMonth}</Btn></div>
    </Modal>}

    {overrideModal&&<OverrideModal sched={overrideModal} onSave={(note)=>{actions.overrideSchedule(overrideModal.id,note);setOverrideModal(null);}} onClose={()=>setOverrideModal(null)}/>}
    {graceModal&&<GraceModal sched={graceModal} onSave={(date,month,note)=>{actions.setGraceException(graceModal.id,date,month,note);setGraceModal(null);}} onClose={()=>setGraceModal(null)}/>}
    {emailModal&&<EmailReviewModal config={emailModal} collectors={data.collectors} schedules={data.schedules} onClose={()=>setEmailModal(null)}/>}
  </div>);
}

function OverrideModal({sched,onSave,onClose}){const [note,setNote]=useState("");return<Modal title="Override Status" onClose={onClose}><p style={{fontSize:13,color:"#8a8477",marginBottom:16}}>Resets to Active and clears all strikes.</p><Field label="Note"><textarea value={note} onChange={e=>setNote(e.target.value)} style={{...is,minHeight:80,resize:"vertical"}} placeholder="e.g. Collector settled balance on 2026-04-09"/></Field><div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:16}}><Btn ghost onClick={onClose}>Cancel</Btn><Btn gold onClick={()=>onSave(note)} disabled={!note}>Apply Override</Btn></div></Modal>;}
function GraceModal({sched,onSave,onClose}){const [graceDate,setGraceDate]=useState("");const [month,setMonth]=useState(sched.monthsPaid+1);const [note,setNote]=useState("");return<Modal title="Set Grace Exception" onClose={onClose}><Field label="Month Number"><input type="number" value={month} onChange={e=>setMonth(Number(e.target.value))} style={is} min={1} max={sched.termMonths}/></Field><Field label="Extended Grace Date"><input type="date" value={graceDate} onChange={e=>setGraceDate(e.target.value)} style={is}/></Field><Field label="Reason"><textarea value={note} onChange={e=>setNote(e.target.value)} style={{...is,minHeight:60,resize:"vertical"}}/></Field><div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:16}}><Btn ghost onClick={onClose}>Cancel</Btn><Btn gold onClick={()=>onSave(graceDate,month,note)} disabled={!graceDate||!note}>Set Exception</Btn></div></Modal>;}

function EmailReviewModal({config,collectors,schedules,onClose}){
  const isCustom=config.status==="custom";
  const [selected,setSelected]=useState(isCustom?[]:config.targets.map(t=>t.id));
  const [templateKey,setTemplateKey]=useState(config.templateKey||"upcoming");
  const [subject,setSubject]=useState("");const [body,setBody]=useState("");
  const gn=c=>c.type==="company"?c.companyName:`${c.firstName} ${c.lastName}`;
  const targets=isCustom?collectors.filter(c=>c.email).map(c=>{const s=schedules.find(x=>x.collectorId===c.id);return{id:c.id,name:gn(c),email:c.email,schedules:s?[s]:[]};})  :config.targets;
  const toggle=(id)=>setSelected(p=>p.includes(id)?p.filter(x=>x!==id):[...p,id]);
  const firstSelected=targets.find(t=>selected.includes(t.id));
  useEffect(()=>{if(!firstSelected)return;const s=firstSelected.schedules[0];const tpl=s?TEMPLATES[templateKey]?.(firstSelected.name,s.artworkTitle,s.monthlyAmount,getNextDueDate(s.startDate,s.monthsPaid+1)):TEMPLATES[templateKey]?.(firstSelected.name,"",0,"");if(tpl){setSubject(tpl.subject||"");setBody(tpl.body||"");}},[templateKey,firstSelected?.id]);
  const send=()=>{const emails=selected.map(id=>targets.find(t=>t.id===id)?.email).filter(Boolean);if(emails.length===0)return alert("No recipients.");openGmail(emails,subject,body);onClose();};
  return<Modal title="Review & Send Email" onClose={onClose} wide>
    <div style={{display:"grid",gridTemplateColumns:"280px 1fr",gap:20}}>
      <div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}><div style={{fontSize:11,letterSpacing:2,textTransform:"uppercase",color:"#5a564e"}}>Recipients ({selected.length})</div><div style={{display:"flex",gap:8}}><button onClick={()=>setSelected(targets.map(t=>t.id))} style={{background:"none",border:"none",color:"#b68b2e",cursor:"pointer",fontSize:11}}>All</button><button onClick={()=>setSelected([])} style={{background:"none",border:"none",color:"#8a8477",cursor:"pointer",fontSize:11}}>None</button></div></div>
        <div style={{maxHeight:300,overflowY:"auto",border:"1px solid rgba(182,139,46,0.1)",borderRadius:8}}>
          {targets.length===0?<div style={{padding:16,fontSize:13,color:"#5a564e",textAlign:"center"}}>No collectors.</div>:
          targets.map(t=><label key={t.id} style={{display:"flex",alignItems:"flex-start",gap:10,padding:"10px 12px",cursor:"pointer",borderBottom:"1px solid rgba(182,139,46,0.04)"}}>
            <input type="checkbox" checked={selected.includes(t.id)} onChange={()=>toggle(t.id)} style={{accentColor:"#b68b2e",marginTop:2,flexShrink:0}}/>
            <div style={{minWidth:0}}><div style={{fontSize:13,fontWeight:600,color:"#f5f0e8"}}>{t.name}</div><div style={{fontSize:11,color:"#5a564e",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.email}</div></div>
          </label>)}
        </div>
        <div style={{fontSize:11,color:"#5a564e",marginTop:8}}>All BCC'd — nobody sees each other's address.</div>
      </div>
      <div>
        <Field label="Template"><select value={templateKey} onChange={e=>setTemplateKey(e.target.value)} style={ss}><option value="upcoming">Upcoming Reminder</option><option value="missed">Missed Payment</option><option value="dispute">Dispute Escalation</option><option value="cancelled">Cancellation Notice</option></select></Field>
        <Field label="Subject"><input value={subject} onChange={e=>setSubject(e.target.value)} style={is}/></Field>
        <Field label="Message"><textarea value={body} onChange={e=>setBody(e.target.value)} style={{...is,minHeight:160,resize:"vertical"}}/></Field>
      </div>
    </div>
    <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:16,borderTop:"1px solid rgba(182,139,46,0.08)",paddingTop:16}}><Btn ghost onClick={onClose}>Cancel</Btn><Btn gold disabled={selected.length===0||!subject} onClick={send}>{I.mail} Open Gmail ({selected.length})</Btn></div>
  </Modal>;
}

// ═══════════════════════════════════════════
// SALES
// ═══════════════════════════════════════════
function SalesPage({data,actions}){
  const [modal,setModal]=useState(false);const [settlementModal,setSettlementModal]=useState(null);
  const sellable=data.artworks.filter(a=>["Reserved","In Gallery","Available"].includes(a.status));
  const handleSale=(sd)=>{actions.recordSale(sd);setModal(false);};
  const handleDelete=(id)=>{if(confirm("Delete sale?"))actions.deleteSale(id);};
  return(<div>
    <PT title="Sales" sub={`${data.sales.length} completed`} action={<Btn gold onClick={()=>setModal(true)}>{I.plus} Record Sale</Btn>}/>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:14,marginBottom:24}}>
      <Stat label="Sales" value={data.sales.length}/>
      <Stat label="Total Value" value={"R "+fmt(data.sales.reduce((s,x)=>s+(x.salePrice||0),0))}/>
      <Stat label="Model A Sales" value={data.sales.filter(s=>(!s.acquisitionModel||s.acquisitionModel==="A")).length} green/>
      <Stat label="Model B Sales" value={data.sales.filter(s=>s.acquisitionModel==="B").length} gold/>
      <Stat label="Collector Payouts" value={"R "+fmt(data.sales.reduce((s,x)=>s+(x.colNet||x.collectorShare||0),0))} green/>
    </div>
    <Card>
      {data.sales.length===0?<Empty msg="No sales yet." action={<Btn gold onClick={()=>setModal(true)}>{I.plus} Record Sale</Btn>}/>:
      <Tbl cols={[
        {label:"Date",key:"date"},
        {label:"Artwork",key:"artworkTitle",bold:true},
        {label:"Model",render:r=><Badge model={r.acquisitionModel||"A"}/>},
        {label:"Collector",key:"collectorName"},
        {label:"Buyer",render:r=>r.buyerName?<span style={{color:"#b68b2e"}}>{r.buyerName}</span>:<span style={{color:"#5a564e"}}>—</span>},
        {label:"Sale Price",right:true,render:r=>"R "+fmt(r.salePrice)},
        {label:"Collector Net",right:true,render:r=><span style={{color:"#4a9e6b",fontWeight:600}}>R {fmt(r.colNet||r.collectorShare||0)}</span>},
        {label:"VB Total",right:true,gold:true,render:r=>"R "+fmt(r.vbTotal||r.vbShare||0)},
        {label:"",render:r=><div style={{display:"flex",gap:6}}>
          <button onClick={e=>{e.stopPropagation();setSettlementModal(r);}} style={{background:"none",border:"none",color:"#b68b2e",cursor:"pointer",fontSize:11,textDecoration:"underline"}}>Sheet</button>
          <button onClick={e=>{e.stopPropagation();handleDelete(r.id);}} style={{background:"none",border:"none",color:"#5a564e",cursor:"pointer"}}>{I.del}</button>
        </div>},
      ]} data={[...data.sales].reverse()}/>}
    </Card>
    {modal&&<SaleMdl data={data} sellable={sellable} onSale={handleSale} onClose={()=>setModal(false)}/>}
    {settlementModal&&<SettlementModal sale={settlementModal} data={data} onClose={()=>setSettlementModal(null)}/>}
  </div>);
}

function SettlementModal({sale,data,onClose}){
  const [galleryPct,setGalleryPct]=useState(40);
  const [vbPct,setVbPct]=useState(30);
  const [artistPct,setArtistPct]=useState(30);
  const [introPct,setIntroPct]=useState(0);
  const sched=data.schedules.find(s=>s.artworkId===sale.artworkId);
  const art=data.artworks.find(a=>a.id===sale.artworkId);
  const acqModel=sched?.acquisitionModel||sale.acquisitionModel||"A";
  const artworkValue=art?.recommendedPrice||sale.salePrice;
  const monthsPaid=sched?.monthsPaid||0;
  const splitOk=Math.round(galleryPct+vbPct+artistPct)===100;
  const deal=calcDeal(artworkValue,sale.salePrice,acqModel,monthsPaid,galleryPct,vbPct,artistPct,introPct);

  return<Modal title="Deal Settlement Sheet" onClose={onClose} wide>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,marginBottom:20}}>
      <div>
        <div style={{fontSize:12,color:"#8a8477",marginBottom:4}}>Artwork</div>
        <div style={{fontSize:15,fontWeight:600,color:"#f5f0e8"}}>{sale.artworkTitle}</div>
        <div style={{fontSize:12,color:"#8a8477",marginTop:8}}>Collector: {sale.collectorName||"—"}</div>
        <div style={{fontSize:12,color:"#8a8477"}}>Buyer: {sale.buyerName||"—"}</div>
        <div style={{display:"flex",gap:8,marginTop:8,alignItems:"center"}}><Badge model={acqModel}/><span style={{fontSize:12,color:"#8a8477"}}>{monthsPaid} months paid before sale</span></div>
      </div>
      <div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,fontSize:13}}>
          <span style={{color:"#8a8477"}}>Artwork value:</span><span style={{textAlign:"right"}}>R {fmt(artworkValue)}</span>
          <span style={{color:"#8a8477"}}>Sale price:</span><span style={{textAlign:"right",fontWeight:600}}>R {fmt(sale.salePrice)}</span>
          {deal.surplus>0&&<><span style={{color:"#8a8477"}}>Surplus:</span><span style={{textAlign:"right",color:"#b68b2e"}}>R {fmt(deal.surplus)}</span></>}
        </div>
      </div>
    </div>

    {/* Settlement */}
    <Card style={{background:"#1e1d1a",marginBottom:16}}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,fontSize:14}}>
        <span style={{color:"#8a8477"}}>VB fee ({Math.round(MODELS[acqModel].vbPct*100)}%):</span><span style={{textAlign:"right",color:"#b68b2e"}}>R {fmt(deal.vbFee)}</span>
        <span style={{color:"#8a8477"}}>Already collected:</span><span style={{textAlign:"right"}}>R {fmt(deal.paid)}</span>
        <span style={{color:"#8a8477"}}>VB balance at sale:</span><span style={{textAlign:"right",color:"#c45c4a"}}>R {fmt(deal.vbBalance)}</span>
        <div style={{gridColumn:"1/-1",height:1,background:"rgba(182,139,46,0.1)",margin:"4px 0"}}/>
        <span style={{color:"#4a9e6b",fontWeight:600}}>Collector {Math.round(MODELS[acqModel].colPct*100)}%:</span><span style={{textAlign:"right",color:"#4a9e6b"}}>R {fmt(deal.colBase+deal.surplusCol)}</span>
        <span style={{color:"#8a8477"}}>Less VB balance:</span><span style={{textAlign:"right",color:"#c45c4a"}}>− R {fmt(deal.vbBalance)}</span>
        {deal.introFee>0&&<><span style={{color:"#8a8477"}}>Less intro fee ({introPct}%):</span><span style={{textAlign:"right",color:"#c45c4a"}}>− R {fmt(deal.introFee)}</span></>}
        <span style={{color:"#4a9e6b",fontWeight:700,fontSize:16}}>Collector receives:</span><span style={{textAlign:"right",color:"#4a9e6b",fontWeight:700,fontFamily:"Cormorant Garamond,serif",fontSize:22}}>R {fmt(deal.colNet)}</span>
        <span style={{color:"#8a8477",fontSize:12}}>Collector profit:</span><span style={{textAlign:"right",fontSize:12,color:"#4a9e6b"}}>R {fmt(deal.colProfit)} ({Math.round(deal.colROI)}% ROI)</span>
      </div>
    </Card>

    {/* Backend split */}
    <div style={{marginBottom:16}}>
      <div style={{fontSize:11,letterSpacing:2,textTransform:"uppercase",color:"#5a564e",marginBottom:10}}>Backend Split — VB's R {fmt(deal.vbTotal)}</div>
      {!splitOk&&<div style={{fontSize:11,color:"#c45c4a",marginBottom:8}}>⚠ Must total 100%</div>}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        {[["Gallery",galleryPct,setGalleryPct],["Vollard Black",vbPct,setVbPct],["Artist",artistPct,setArtistPct]].map(([l,v,sv])=><div key={l} style={{background:"#1e1d1a",borderRadius:8,padding:12}}>
          <div style={{fontSize:11,color:"#5a564e",marginBottom:6}}>{l}</div>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <input type="number" value={v} onChange={e=>sv(Number(e.target.value))} style={{...is,width:60,padding:"6px 8px",fontSize:13}} min={0} max={100}/>
            <span style={{fontSize:12,color:"#5a564e"}}>%</span>
            <span style={{fontSize:14,fontWeight:600,color:"#b68b2e",marginLeft:"auto"}}>R {fmt(deal.vbTotal*(v/100))}</span>
          </div>
        </div>)}
        <div style={{background:"#1e1d1a",borderRadius:8,padding:12}}>
          <div style={{fontSize:11,color:"#5a564e",marginBottom:6}}>Introducer Fee</div>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <input type="number" value={introPct} onChange={e=>setIntroPct(Number(e.target.value))} style={{...is,width:60,padding:"6px 8px",fontSize:13}} min={0} max={50}/>
            <span style={{fontSize:12,color:"#5a564e"}}>%</span>
            <span style={{fontSize:14,fontWeight:600,color:"#c45c4a",marginLeft:"auto"}}>R {fmt(deal.introFee)}</span>
          </div>
        </div>
      </div>
    </div>

    <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
      <Btn ghost onClick={onClose}>Close</Btn>
      <Btn gold onClick={()=>generateSettlementPDF(sale,artworkValue,monthsPaid,acqModel,galleryPct,vbPct,artistPct,introPct)}>{I.pdf} Download PDF</Btn>
    </div>
  </Modal>;
}

function SaleMdl({data,sellable,onSale,onClose}){
  const [artId,setArtId]=useState("");const [salePrice,setSalePrice]=useState("");
  const [buyerId,setBuyerId]=useState("");const [newBuyer,setNewBuyer]=useState(false);
  const [nb,setNb]=useState({type:"individual",firstName:"",lastName:"",companyName:"",email:"",mobile:"",nationality:"",idNumber:""});
  const art=data.artworks.find(a=>a.id===artId);
  const sched=art?data.schedules.find(s=>s.artworkId===artId&&s.status!=="Cancelled"):null;
  const col=sched?data.collectors.find(c=>c.id===sched.collectorId):null;
  const gn=c=>c?(c.type==="company"?c.companyName:`${c.firstName} ${c.lastName}`):"—";
  const acqModel=sched?.acquisitionModel||"A";
  const m=MODELS[acqModel];
  const artworkValue=art?.recommendedPrice||0;
  const sp=Number(salePrice)||artworkValue;
  const monthsPaid=sched?.monthsPaid||0;
  const deal=artworkValue>0?calcDeal(artworkValue,sp,acqModel,monthsPaid,40,30,30,0):{};
  const resolvedBuyerName=newBuyer?(nb.type==="company"?nb.companyName:`${nb.firstName} ${nb.lastName}`):data.buyers.find(b=>b.id===buyerId)?buyerName(data.buyers.find(b=>b.id===buyerId)):"";

  return(<Modal title="Record Sale" onClose={onClose} wide>
    <Field label="Artwork"><select value={artId} onChange={e=>setArtId(e.target.value)} style={ss}><option value="">—</option>{sellable.map(a=>{const s=data.schedules.find(x=>x.artworkId===a.id);return<option key={a.id} value={a.id}>{a.title} — R {fmt(a.recommendedPrice)} {s?`(${MODELS[s.acquisitionModel||"A"].label})`:""}</option>;})} </select></Field>

    {art&&<>
      {sched&&<div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16,padding:"10px 14px",background:"#1e1d1a",borderRadius:8}}>
        <Badge model={acqModel}/>
        <span style={{fontSize:13,color:"#8a8477"}}>{monthsPaid} months paid · R {fmt(sched.totalPaid||0)} collected</span>
        <span style={{fontSize:13,color:"#b68b2e",marginLeft:"auto"}}>VB balance: R {fmt(deal.vbBalance||0)}</span>
      </div>}

      <Field label="Sale Price (R)"><input type="number" value={salePrice} onChange={e=>setSalePrice(e.target.value)} style={is} placeholder={fmt(artworkValue)}/></Field>

      {/* Buyer */}
      <div style={{marginBottom:16}}>
        <label style={{display:"block",fontSize:10,fontWeight:500,letterSpacing:2,textTransform:"uppercase",color:"#8a8477",marginBottom:8}}>End Buyer</label>
        <div style={{display:"flex",gap:8,marginBottom:10}}>
          <button onClick={()=>setNewBuyer(false)} style={{flex:1,padding:10,borderRadius:8,border:!newBuyer?"2px solid #b68b2e":"1px solid rgba(182,139,46,0.15)",background:!newBuyer?"rgba(182,139,46,0.08)":"#1e1d1a",color:!newBuyer?"#b68b2e":"#8a8477",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"DM Sans,sans-serif"}}>Existing Buyer</button>
          <button onClick={()=>{setNewBuyer(true);setBuyerId("");}} style={{flex:1,padding:10,borderRadius:8,border:newBuyer?"2px solid #b68b2e":"1px solid rgba(182,139,46,0.15)",background:newBuyer?"rgba(182,139,46,0.08)":"#1e1d1a",color:newBuyer?"#b68b2e":"#8a8477",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"DM Sans,sans-serif"}}>Register New</button>
        </div>
        {!newBuyer&&<select value={buyerId} onChange={e=>setBuyerId(e.target.value)} style={ss}><option value="">— No buyer / select later</option>{data.buyers.map(b=><option key={b.id} value={b.id}>{buyerName(b)}{b.email?` · ${b.email}`:""}</option>)}</select>}
        {newBuyer&&<div style={{background:"#1e1d1a",border:"1px solid rgba(182,139,46,0.1)",borderRadius:10,padding:14}}>
          <div style={{fontSize:11,color:"#b68b2e",marginBottom:10,letterSpacing:1}}>NEW BUYER</div>
          <div style={{display:"flex",gap:8,marginBottom:10}}>{[["individual","Individual"],["company","Company"]].map(([id,l])=><button key={id} onClick={()=>setNb(p=>({...p,type:id}))} style={{flex:1,padding:8,borderRadius:8,border:nb.type===id?"2px solid #b68b2e":"1px solid rgba(182,139,46,0.15)",background:nb.type===id?"rgba(182,139,46,0.08)":"transparent",color:nb.type===id?"#b68b2e":"#8a8477",fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"DM Sans,sans-serif"}}>{l}</button>)}</div>
          {nb.type==="company"?<input value={nb.companyName} onChange={e=>setNb(p=>({...p,companyName:e.target.value}))} placeholder="Company Name" style={{...is,marginBottom:8}}/>:<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}><input value={nb.firstName} onChange={e=>setNb(p=>({...p,firstName:e.target.value}))} placeholder="First Name" style={is}/><input value={nb.lastName} onChange={e=>setNb(p=>({...p,lastName:e.target.value}))} placeholder="Last Name" style={is}/></div>}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}><input value={nb.email} onChange={e=>setNb(p=>({...p,email:e.target.value}))} placeholder="Email" style={is}/><input value={nb.mobile} onChange={e=>setNb(p=>({...p,mobile:e.target.value}))} placeholder="Mobile" style={is}/></div>
        </div>}
      </div>

      {/* Settlement preview */}
      {artworkValue>0&&<Card style={{background:"#1e1d1a",marginTop:4}}><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,fontSize:14}}>
        <span style={{color:"#8a8477"}}>Sale price:</span><span style={{fontWeight:600}}>R {fmt(sp)}</span>
        <span style={{color:"#8a8477"}}>Collector:</span><span>{gn(col)}</span>
        {resolvedBuyerName&&<><span style={{color:"#8a8477"}}>Buyer:</span><span style={{color:"#b68b2e"}}>{resolvedBuyerName}</span></>}
        <div style={{gridColumn:"1/-1",height:1,background:"rgba(182,139,46,0.1)",margin:"4px 0"}}/>
        <span style={{color:"#4a9e6b",fontWeight:600}}>Collector {Math.round(m.colPct*100)}%:</span><span style={{color:"#4a9e6b"}}>R {fmt(deal.colBase+(deal.surplusCol||0))}</span>
        <span style={{color:"#8a8477"}}>Less VB balance:</span><span style={{color:"#c45c4a"}}>− R {fmt(deal.vbBalance||0)}</span>
        <span style={{color:"#4a9e6b",fontWeight:700}}>Collector receives:</span><span style={{color:"#4a9e6b",fontWeight:700,fontFamily:"Cormorant Garamond,serif",fontSize:18}}>R {fmt(deal.colNet||0)}</span>
        <div style={{gridColumn:"1/-1",height:1,background:"rgba(182,139,46,0.06)",margin:"4px 0"}}/>
        <span style={{color:"#b68b2e",fontWeight:600}}>VB total income:</span><span style={{color:"#b68b2e",fontWeight:700,fontFamily:"Cormorant Garamond,serif",fontSize:18}}>R {fmt(deal.vbTotal||0)}</span>
        <span style={{color:"#8a8477",fontSize:12}}>Collector profit:</span><span style={{fontSize:12,color:"#4a9e6b"}}>R {fmt(deal.colProfit||0)} · {Math.round(deal.colROI||0)}% ROI</span>
      </div></Card>}
    </>}

    <div style={{display:"flex",gap:10,marginTop:20,justifyContent:"flex-end"}}>
      <Btn ghost onClick={onClose}>Cancel</Btn>
      <Btn gold disabled={!artId} onClick={()=>{
        let finalBuyerId=buyerId;let finalBuyerName=resolvedBuyerName;
        let newBuyerData=null;
        if(newBuyer&&resolvedBuyerName.trim()){finalBuyerId=uid();finalBuyerName=resolvedBuyerName;newBuyerData={...nb,id:finalBuyerId};}
        onSale({artworkId:artId,artworkTitle:art.title,acquisitionModel:acqModel,collectorId:col?.id,collectorName:gn(col),buyerId:finalBuyerId||null,buyerName:finalBuyerName||null,newBuyerData,salePrice:sp,artworkValue,monthsPaid,colNet:deal.colNet||0,colProfit:deal.colProfit||0,colROI:deal.colROI||0,vbTotal:deal.vbTotal||0,vbBalance:deal.vbBalance||0,collectorShare:deal.colBase||0,vbShare:deal.vbFee||0,galleryShare:deal.galleryAmt||0,vbNet:deal.vbAmt||0,artistShare:deal.artistAmt||0});
      }}>Confirm Sale</Btn>
    </div>
  </Modal>);
}

// ═══════════════════════════════════════════
// REPORTS
// ═══════════════════════════════════════════
function ReportsPage({data,actions}){
  const [selectedMonth,setSelectedMonth]=useState(null);
  const [yearFilter,setYearFilter]=useState(new Date().getFullYear().toString());
  const generateMonthList=()=>{const months=[];const now=new Date();let start=new Date(now.getFullYear()-1,0,1);const earliest=(data.schedules||[]).reduce((min,s)=>(!min||s.startDate<min)?s.startDate:min,null);if(earliest)start=new Date(earliest.slice(0,7)+"-01");const cur=new Date(start);while(cur<=now){months.push(cur.toISOString().slice(0,7));cur.setMonth(cur.getMonth()+1);}return months.reverse();};
  const monthList=generateMonthList();
  const years=[...new Set(monthList.map(m=>m.slice(0,4)))];
  const filteredMonths=monthList.filter(m=>m.startsWith(yearFilter));
  const getReport=(ym)=>data.reports.find(r=>r.month===ym);
  const locked=(ym)=>isReportLocked(ym);
  return(<div>
    <PT title="Reports" sub="Monthly snapshots — permanent record of each period"/>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:14,marginBottom:28}}>
      <Stat label="Generated" value={data.reports.length} gold/>
      <Stat label="Locked" value={data.reports.filter(r=>r.locked).length}/>
      <Stat label="Total Collected" value={"R "+fmt(data.reports.reduce((s,r)=>s+(r.totalCollected||0),0))} green/>
    </div>
    <div style={{display:"flex",gap:8,marginBottom:20,flexWrap:"wrap",alignItems:"center"}}>
      {years.map(y=><button key={y} onClick={()=>setYearFilter(y)} style={{padding:"8px 18px",borderRadius:8,border:yearFilter===y?"2px solid #b68b2e":"1px solid rgba(182,139,46,0.15)",background:yearFilter===y?"rgba(182,139,46,0.08)":"transparent",color:yearFilter===y?"#b68b2e":"#8a8477",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"DM Sans,sans-serif"}}>{y}</button>)}
      <Btn small gold onClick={()=>actions.generateReport(getCurrentMonth())} style={{marginLeft:"auto"}}>{I.report} Generate Now</Btn>
    </div>
    {filteredMonths.length===0?<Empty msg="No months available yet."/>:
    filteredMonths.map(ym=>{
      const report=getReport(ym);const isLocked=locked(ym);const {lock}=getReportWindow(ym);const isCurrent=ym===getCurrentMonth();
      return<Card key={ym} style={{marginBottom:12,padding:0,overflow:"hidden"}}>
        <div style={{height:3,background:isLocked?"#648cc8":report?"#b68b2e":"rgba(182,139,46,0.2)"}}/>
        <div style={{padding:20}}>
          <div style={{display:"flex",alignItems:"center",gap:16,flexWrap:"wrap"}}>
            <div style={{flex:1,minWidth:200}}>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:4,flexWrap:"wrap"}}>
                <span style={{fontFamily:"Cormorant Garamond,serif",fontSize:20,fontWeight:400,color:"#f5f0e8"}}>{getMonthLabel(ym)}</span>
                {isCurrent&&<span style={{fontSize:10,background:"rgba(182,139,46,0.15)",color:"#b68b2e",padding:"3px 8px",borderRadius:6,fontWeight:600}}>CURRENT</span>}
                {isLocked&&<span style={{fontSize:10,background:"rgba(100,140,200,0.15)",color:"#648cc8",padding:"3px 8px",borderRadius:6,fontWeight:600,display:"inline-flex",alignItems:"center",gap:4}}>{I.lock} LOCKED</span>}
              </div>
              {isLocked?<div style={{fontSize:11,color:"#5a564e"}}>Permanently locked — final record</div>:<div style={{fontSize:11,color:"#5a564e"}}>Editable until {lock} · Generate anytime</div>}
            </div>
            {report&&<div style={{display:"flex",gap:16,fontSize:12,flexWrap:"wrap"}}>
              <span>Collected: <strong style={{color:"#4a9e6b"}}>R {fmt(report.totalCollected)}</strong></span>
              <span>Active: <strong style={{color:"#4a9e6b"}}>{report.activeCount}</strong></span>
              {report.chasingCount>0&&<span>Chasing: <strong style={{color:"#e6be32"}}>{report.chasingCount}</strong></span>}
              {report.disputeCount>0&&<span>Dispute: <strong style={{color:"#dc7828"}}>{report.disputeCount}</strong></span>}
              <span style={{fontSize:11,color:"#5a564e"}}>Generated: {report.generatedAt}</span>
            </div>}
            <div style={{display:"flex",gap:8,flexShrink:0}}>
              {!isLocked&&<Btn small gold onClick={()=>actions.generateReport(ym)}>{report?"Regenerate":"Generate"}</Btn>}
              {isLocked&&<Btn small warn onClick={()=>actions.generateReport(ym)}>{I.warn} Override</Btn>}
              {report&&<Btn small ghost onClick={()=>generatePDF(report)}>{I.dl} PDF</Btn>}
            </div>
          </div>
          {report&&<>
            <button onClick={()=>setSelectedMonth(selectedMonth===ym?null:ym)} style={{background:"none",border:"none",color:"#5a564e",cursor:"pointer",fontSize:11,marginTop:10,display:"flex",alignItems:"center",gap:4}}>
              <span style={{transform:selectedMonth===ym?"rotate(180deg)":"none",transition:"0.2s",display:"inline-flex"}}>{I.chevron}</span>
              {selectedMonth===ym?"Hide":"Show"} details
            </button>
            {selectedMonth===ym&&<div style={{marginTop:10,borderTop:"1px solid rgba(182,139,46,0.06)",paddingTop:10}}>
              {report.snapshot.payments&&report.snapshot.payments.length>0?<Tbl cols={[{label:"Collector",bold:true,render:r=>r.collectorName},{label:"Artwork",key:"artworkTitle"},{label:"Model",render:r=><Badge model={r.model||"A"}/>},{label:"Month",render:r=>`Mo ${r.monthNumber}`},{label:"Method",key:"method"},{label:"Amount",right:true,gold:true,render:r=>"R "+fmt(r.amount)}]} data={report.snapshot.payments}/>:<p style={{fontSize:13,color:"#5a564e"}}>No payments this month.</p>}
            </div>}
          </>}
        </div>
      </Card>;
    })}
  </div>);
}

// ═══════════════════════════════════════════
// GALLERY BREAK-EVEN
// ═══════════════════════════════════════════
function GalleryPage(){
  const [costs,setCosts]=useState("");
  const [price,setPrice]=useState("");
  const [galPct,setGalPct]=useState(40);
  const [sales,setSales]=useState(1);

  const c=parseFloat(costs)||0;
  const p=parseFloat(price)||0;
  const gp=(parseFloat(galPct)||0)/100;
  const s=parseFloat(sales)||0;

  const vbFee=p*0.40;
  const moPerArt=vbFee/24*gp;
  const saleIncome=vbFee*gp;
  const totalSalesIncome=saleIncome*s;
  const costsAfterSales=Math.max(0,c-totalSalesIncome);
  const neededNoSales=moPerArt>0?Math.ceil(c/moPerArt):0;
  const neededWithSales=moPerArt>0?Math.ceil(costsAfterSales/moPerArt):0;
  const diff=neededNoSales-neededWithSales;
  const ready=c>0&&p>0;

  const F=({label,value,onChange,suffix,prefix})=><Field label={label}>
    <div style={{display:"flex",alignItems:"center",background:"#1e1d1a",border:"1px solid rgba(182,139,46,0.12)",borderRadius:10,overflow:"hidden"}}>
      {prefix&&<span style={{padding:"0 14px",fontSize:13,color:"#5a564e",borderRight:"1px solid rgba(182,139,46,0.08)",height:48,display:"flex",alignItems:"center",flexShrink:0}}>{prefix}</span>}
      <input type="number" value={value} onChange={e=>onChange(e.target.value)} min={0} placeholder="0" style={{flex:1,padding:"0 16px",height:48,background:"transparent",border:"none",color:"#f5f0e8",fontFamily:"DM Sans,sans-serif",fontSize:16,fontWeight:500,outline:"none",textAlign:"right"}}/>
      {suffix&&<span style={{padding:"0 14px",fontSize:13,color:"#5a564e",borderLeft:"1px solid rgba(182,139,46,0.08)",height:48,display:"flex",alignItems:"center",flexShrink:0,whiteSpace:"nowrap"}}>{suffix}</span>}
    </div>
  </Field>;

  const Row=({label,val,green})=><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 0",borderBottom:"1px solid rgba(182,139,46,0.05)"}}><span style={{fontSize:13,color:"#5a564e"}}>{label}</span><span style={{fontSize:13,fontWeight:500,color:green?"#4a9e6b":"#b68b2e"}}>{val}</span></div>;

  return(<div>
    <PT title="Gallery Break-Even" sub="How many artworks under management cover your monthly costs"/>
    <div style={{display:"grid",gridTemplateColumns:"minmax(0,420px) minmax(0,1fr)",gap:24,alignItems:"start"}}>

      {/* Inputs */}
      <Card>
        <F label="Monthly Costs (R)" value={costs} onChange={setCosts} prefix="R"/>
        <F label="Artwork Price (R)" value={price} onChange={setPrice} prefix="R"/>
        <F label="Gallery Fee" value={galPct} onChange={setGalPct} suffix="% of VB fee"/>
        <F label="Expected Sales per Month" value={sales} onChange={setSales} suffix="sales / mo"/>

        {ready&&<>
          <div style={{height:1,background:"rgba(182,139,46,0.1)",margin:"20px 0"}}/>
          <Row label="VB fee (40% of artwork)" val={"R "+fmt(vbFee)}/>
          <Row label="Gallery earns per artwork /mo" val={"R "+fmt(moPerArt)}/>
          <Row label="Gallery earns per sale" val={"R "+fmt(saleIncome)}/>
          <Row label={`${s} sale${s!==1?"s":""}/mo income`} val={"R "+fmt(totalSalesIncome)} green/>
        </>}
      </Card>

      {/* Results */}
      <div>
        {!ready?<Card style={{padding:48,textAlign:"center"}}><div style={{fontSize:36,color:"#5a564e",marginBottom:12}}>◆</div><p style={{color:"#5a564e",fontSize:14}}>Enter your monthly costs and artwork price.</p></Card>:
        <>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:16}}>
            {/* Without sales */}
            <Card style={{textAlign:"center",padding:28,border:"1px solid rgba(182,139,46,0.08)"}}>
              <div style={{fontSize:9,letterSpacing:2,textTransform:"uppercase",color:"#5a564e",marginBottom:14}}>Without sales</div>
              <div style={{fontFamily:"Cormorant Garamond,serif",fontSize:64,fontWeight:300,lineHeight:1,color:"#f5f0e8"}}>{neededNoSales||"—"}</div>
              <div style={{fontSize:11,color:"#5a564e",marginTop:10,letterSpacing:1}}>artworks needed</div>
            </Card>
            {/* With sales */}
            <Card style={{textAlign:"center",padding:28,border:"1px solid rgba(182,139,46,0.35)",position:"relative",overflow:"hidden"}}>
              <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:"linear-gradient(90deg,transparent,#b68b2e,transparent)"}}/>
              <div style={{fontSize:9,letterSpacing:2,textTransform:"uppercase",color:"#b68b2e",marginBottom:14}}>With {s} sale{s!==1?"s":""}/mo</div>
              <div style={{fontFamily:"Cormorant Garamond,serif",fontSize:64,fontWeight:300,lineHeight:1,color:"#4a9e6b"}}>{neededWithSales||"—"}</div>
              <div style={{fontSize:11,color:"#5a564e",marginTop:10,letterSpacing:1}}>artworks needed</div>
            </Card>
          </div>

          {/* Saving strip */}
          <Card style={{textAlign:"center",padding:18,marginBottom:14,border:diff>0?"1px solid rgba(74,158,107,0.2)":"1px solid rgba(182,139,46,0.1)",background:diff>0?"rgba(74,158,107,0.04)":"rgba(182,139,46,0.02)"}}>
            <div style={{fontSize:14,fontWeight:500,color:diff>0?"#4a9e6b":"#b68b2e"}}>
              {diff>0
                ?`${s} sale${s!==1?"s":""}/mo saves you ${diff} artwork${diff!==1?"s":""} under management`
                :`${neededNoSales} collectors × R ${fmt(moPerArt)}/mo = R ${fmt(moPerArt*neededNoSales)}/mo`}
            </div>
          </Card>

          {/* What this looks like */}
          <Card>
            <div style={{fontSize:11,letterSpacing:2,textTransform:"uppercase",color:"#5a564e",marginBottom:14}}>What This Looks Like</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              {[
                {label:"Monthly income at break-even",val:"R "+fmt(moPerArt*neededNoSales),color:"#4a9e6b"},
                {label:"Monthly costs",val:"R "+fmt(c),color:"#c45c4a"},
                {label:"Total VB fee per artwork",val:"R "+fmt(vbFee),color:"#b68b2e"},
                {label:"Gallery earns per artwork (24mo)",val:"R "+fmt(vbFee*gp),color:"#b68b2e"},
              ].map((x,i)=><div key={i} style={{background:"#1e1d1a",borderRadius:8,padding:14}}>
                <div style={{fontSize:10,color:"#5a564e",letterSpacing:1,textTransform:"uppercase",marginBottom:6}}>{x.label}</div>
                <div style={{fontFamily:"Cormorant Garamond,serif",fontSize:22,fontWeight:400,color:x.color}}>{x.val}</div>
              </div>)}
            </div>
            <div style={{fontSize:11,color:"#3a3832",marginTop:14,textAlign:"center",letterSpacing:1}}>
              Model A · VB fee 40% · 24 month term · Gallery income = monthly collector payments × gallery %
            </div>
          </Card>
        </>}
      </div>
    </div>
  </div>);
}
