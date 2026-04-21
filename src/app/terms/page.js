'use client';
import { useState } from 'react';
import { TermsRenter, TermsArtist, TermsBuyer } from '../TermsPage';

export default function TermsPage() {
  const [tab, setTab] = useState('renter');
  return (
    <div style={{maxWidth:800,margin:'0 auto',padding:'40px 20px',fontFamily:"'DM Sans',sans-serif"}}>
      <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:36,fontWeight:300,letterSpacing:8,color:'#1a1714',marginBottom:32,textAlign:'center'}}>
        VOLLARD <span style={{color:'#b68b2e'}}>BLACK</span>
      </div>
      <div style={{display:'flex',gap:8,marginBottom:24,borderBottom:'1px solid rgba(182,139,46,0.15)'}}>
        {[['renter','License Holders'],['artist','Artists'],['buyer','Buyers']].map(([id,lbl])=>(
          <button key={id} onClick={()=>setTab(id)} style={{padding:'10px 18px',border:'none',borderBottom:tab===id?'2px solid #b68b2e':'2px solid transparent',background:'transparent',color:tab===id?'#b68b2e':'#6b635a',fontSize:13,fontWeight:tab===id?600:400,cursor:'pointer',fontFamily:"'DM Sans',sans-serif"}}>
            {lbl}
          </button>
        ))}
      </div>
      {tab==='renter'&&<TermsRenter/>}
      {tab==='artist'&&<TermsArtist/>}
      {tab==='buyer'&&<TermsBuyer/>}
    </div>
  );
}
