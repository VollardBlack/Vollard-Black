// TermsPage.jsx — Vollard Black Terms & Conditions
// Used in Renter, Artist, and Buyer portals
// Place at: src/app/TermsPage.jsx
// Import and render in each portal's tab system

'use client';

const S = {
  page: { minHeight:'100vh', background:'#f5f3ef', fontFamily:"'DM Sans',sans-serif", color:'#2a2622' },
  card: { background:'#fff', border:'1px solid rgba(182,139,46,0.18)', borderRadius:12, padding:24, marginBottom:16 },
  h2: { fontFamily:"'Cormorant Garamond',serif", fontSize:20, fontWeight:400, color:'#1a1714', marginBottom:10, marginTop:20 },
  p: { fontSize:13, color:'#4a4440', lineHeight:1.8, marginBottom:12 },
  li: { fontSize:13, color:'#4a4440', lineHeight:1.8, marginBottom:6 },
};

export function TermsRenter() {
  return (
    <div style={S.card}>
      <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:26,fontWeight:300,color:'#1a1714',marginBottom:4}}>Display License Agreement</div>
      <div style={{fontSize:12,color:'#8a8070',marginBottom:20}}>Vollard Black (Pty) Ltd · Hermanus, South Africa</div>

      <h2 style={S.h2}>1. The Display License</h2>
      <p style={S.p}>By registering as a License Holder ("Renter") with Vollard Black, you agree to the following terms governing the display and potential sale of fine artworks placed in your care.</p>

      <h2 style={S.h2}>2. License Fee Structure</h2>
      <p style={S.p}>The display license fee is calculated as 50% of the declared artwork value, payable in monthly instalments over the agreed term (Standard 6 months / Extended 12 months / Premium 24 months). Monthly fees are due on the <strong>25th of each calendar month</strong>.</p>
      <ul style={{paddingLeft:20,marginBottom:12}}>
        <li style={S.li}>Payment window: 25th of the month to the 7th of the following month</li>
        <li style={S.li}>Payments outside this window are considered late and may result in a strike</li>
        <li style={S.li}>Three consecutive missed payments will result in automatic cancellation of this agreement</li>
      </ul>

      <h2 style={S.h2}>3. On Sale of the Artwork</h2>
      <p style={S.p}>Upon sale of the displayed artwork, the following settlement applies:</p>
      <ul style={{paddingLeft:20,marginBottom:12}}>
        <li style={S.li}>Vollard Black retains the outstanding balance of the license fee from the sale proceeds</li>
        <li style={S.li}>The License Holder receives the remainder of the sale price after the license fee balance is settled</li>
        <li style={S.li}>Any surplus above the original artwork value is split 50/50 between the License Holder and Vollard Black</li>
        <li style={S.li}>An introducer fee may be deducted if applicable, as agreed separately</li>
      </ul>

      <h2 style={S.h2}>4. Care of Artwork</h2>
      <p style={S.p}>The License Holder agrees to:</p>
      <ul style={{paddingLeft:20,marginBottom:12}}>
        <li style={S.li}>Display the artwork in a suitable environment, protected from direct sunlight, excessive humidity, and physical damage</li>
        <li style={S.li}>Not remove the artwork from the agreed display location without written consent from Vollard Black</li>
        <li style={S.li}>Notify Vollard Black immediately of any damage, theft, or loss</li>
        <li style={S.li}>Return the artwork in its original condition if the agreement is cancelled</li>
      </ul>

      <h2 style={S.h2}>5. Title of Ownership</h2>
      <p style={S.p}>Title of the artwork remains with the original artist and/or Vollard Black until the full license fee is paid and a sale is concluded. The License Holder does not acquire ownership rights through the display agreement.</p>

      <h2 style={S.h2}>6. Cancellation</h2>
      <p style={S.p}>Either party may cancel this agreement with 30 days written notice. Upon cancellation, the artwork must be returned to Vollard Black at the License Holder's expense. Any payments made are non-refundable.</p>

      <h2 style={S.h2}>7. Governing Law</h2>
      <p style={S.p}>This agreement is governed by the laws of the Republic of South Africa. Disputes shall be referred to the Western Cape High Court.</p>

      <div style={{marginTop:20,padding:'12px 16px',background:'rgba(182,139,46,0.06)',border:'1px solid rgba(182,139,46,0.20)',borderRadius:8,fontSize:12,color:'#8a6a1e'}}>
        For questions, contact: <strong>concierge@vollardblack.com</strong> · Vollard Black (Pty) Ltd, Hermanus, Western Cape
      </div>
    </div>
  );
}

export function TermsArtist() {
  return (
    <div style={S.card}>
      <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:26,fontWeight:300,color:'#1a1714',marginBottom:4}}>Artist Representation Agreement</div>
      <div style={{fontSize:12,color:'#8a8070',marginBottom:20}}>Vollard Black (Pty) Ltd · Hermanus, South Africa</div>

      <h2 style={S.h2}>1. Representation</h2>
      <p style={S.p}>By registering as an Artist with Vollard Black, you authorise Vollard Black to display, market, and sell your artworks through its platform, gallery network, and auction services.</p>

      <h2 style={S.h2}>2. Commission Structure</h2>
      <p style={S.p}>On each sale facilitated by Vollard Black, the proceeds are distributed as follows:</p>
      <ul style={{paddingLeft:20,marginBottom:12}}>
        <li style={S.li}><strong>Artist Share: 30%</strong> of the gallery commission (i.e. 30% of 50% of sale price)</li>
        <li style={S.li}><strong>Gallery Partner Share: 40%</strong> of the gallery commission</li>
        <li style={S.li}><strong>Vollard Black Share: 30%</strong> of the gallery commission</li>
      </ul>
      <p style={S.p}>These percentages apply to the license fee portion. Where the sale price exceeds the declared artwork value, the surplus is split equally between Vollard Black and the License Holder.</p>

      <h2 style={S.h2}>3. Artwork Submission</h2>
      <p style={S.p}>All artwork submissions are subject to approval by Vollard Black. Vollard Black reserves the right to decline artworks that do not meet quality standards or are unsuitable for the platform. Approved artworks will be listed in the gallery and made available to license holders and auction buyers.</p>

      <h2 style={S.h2}>4. Intellectual Property</h2>
      <p style={S.p}>You retain full copyright and intellectual property rights to your artworks. By submitting, you grant Vollard Black a non-exclusive licence to reproduce images of your artwork for marketing and promotional purposes.</p>

      <h2 style={S.h2}>5. Authenticity</h2>
      <p style={S.p}>You warrant that all submitted artworks are original works created by you, are free from third-party claims, and that you have full right to sell them.</p>

      <h2 style={S.h2}>6. Payment</h2>
      <p style={S.p}>Artist shares will be paid to the bank account on file within 14 business days of a confirmed sale. Vollard Black is not liable for payment delays caused by incorrect banking details.</p>

      <div style={{marginTop:20,padding:'12px 16px',background:'rgba(182,139,46,0.06)',border:'1px solid rgba(182,139,46,0.20)',borderRadius:8,fontSize:12,color:'#8a6a1e'}}>
        For questions, contact: <strong>concierge@vollardblack.com</strong> · Vollard Black (Pty) Ltd, Hermanus, Western Cape
      </div>
    </div>
  );
}

export function TermsBuyer() {
  return (
    <div style={S.card}>
      <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:26,fontWeight:300,color:'#1a1714',marginBottom:4}}>Buyer Terms & Conditions</div>
      <div style={{fontSize:12,color:'#8a8070',marginBottom:20}}>Vollard Black (Pty) Ltd · Hermanus, South Africa</div>

      <h2 style={S.h2}>1. Registration & KYC</h2>
      <p style={S.p}>All buyers are required to complete KYC (Know Your Customer) verification before purchasing or bidding. This includes providing a valid government-issued ID and proof of address where required.</p>

      <h2 style={S.h2}>2. Auction Participation</h2>
      <p style={S.p}>Auction access requires separate approval from Vollard Black. By requesting and receiving auction access, you agree that:</p>
      <ul style={{paddingLeft:20,marginBottom:12}}>
        <li style={S.li}>All bids placed are binding and constitute a legal offer to purchase</li>
        <li style={S.li}>The winning bidder is obligated to complete the purchase at the winning bid price</li>
        <li style={S.li}>Payment must be made directly to the License Holder as per the auction settlement report</li>
        <li style={S.li}>The artwork will only be released once full payment is confirmed and all outstanding license fees are settled</li>
      </ul>

      <h2 style={S.h2}>3. Direct Purchases</h2>
      <p style={S.p}>Enquiries submitted through the gallery portal are expressions of interest only. A sale is only concluded upon written confirmation from Vollard Black and receipt of full payment.</p>

      <h2 style={S.h2}>4. Condition of Artworks</h2>
      <p style={S.p}>Vollard Black takes reasonable care to accurately represent artworks. Buyers are encouraged to view artworks in person before purchase. Vollard Black is not liable for minor variations between photographic representations and the physical artwork.</p>

      <h2 style={S.h2}>5. Transfers & Refunds</h2>
      <p style={S.p}>All sales are final. Refunds are not available unless the artwork is materially misrepresented. Title passes to the buyer only upon full payment.</p>

      <h2 style={S.h2}>6. Governing Law</h2>
      <p style={S.p}>These terms are governed by South African law. Any disputes shall be resolved in the Western Cape High Court.</p>

      <div style={{marginTop:20,padding:'12px 16px',background:'rgba(182,139,46,0.06)',border:'1px solid rgba(182,139,46,0.20)',borderRadius:8,fontSize:12,color:'#8a6a1e'}}>
        For questions, contact: <strong>concierge@vollardblack.com</strong> · Vollard Black (Pty) Ltd, Hermanus, Western Cape
      </div>
    </div>
  );
}
