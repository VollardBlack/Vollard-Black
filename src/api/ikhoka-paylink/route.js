// ═══════════════════════════════════════════════════════════════
// VOLLARD BLACK — iKhoka Payment API Route
// File: src/app/api/ikhoka-paylink/route.js
//
// Creates an iKhoka paylink for renter monthly license fee payments.
// Called by RenterPortal when collector clicks "Pay Now".
//
// ENV VARS required in Vercel:
//   IKHOKA_APP_ID       — your Application ID from iKhoka dashboard
//   IKHOKA_SIGN_SECRET  — your Sign Secret from iKhoka dashboard
//   IKHOKA_ENTITY_ID    — same as IKHOKA_APP_ID (your merchant entity)
// ═══════════════════════════════════════════════════════════════

import crypto from 'crypto';

const APP_ID       = process.env.IKHOKA_APP_ID;
const SIGN_SECRET  = process.env.IKHOKA_SIGN_SECRET;
const ENTITY_ID    = process.env.IKHOKA_ENTITY_ID || process.env.IKHOKA_APP_ID;
const BASE_URL     = 'https://api.ikhokha.com';
const SITE_URL     = process.env.NEXT_PUBLIC_SITE_URL || 'https://vollard-black.vercel.app';

function generateSignature(appId, secret, payload) {
  // iKhoka signs: appId + JSON.stringify(payload)
  const message = appId + JSON.stringify(payload);
  return crypto.createHmac('sha256', secret).update(message).digest('hex');
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { amount, description, scheduleId, monthNumber, collectorEmail, collectorName } = body;

    if (!amount || !scheduleId) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }
    if (!APP_ID || !SIGN_SECRET) {
      return Response.json({ error: 'iKhoka credentials not configured' }, { status: 500 });
    }

    // Payment reference: VB-{8 chars of scheduleId}-M{monthNumber}
    const externalTransactionID = `VB-${scheduleId.slice(-8)}-M${monthNumber}`;

    const payload = {
      entityID: ENTITY_ID,
      amount: Math.round(amount * 100), // iKhoka uses cents
      currency: 'ZAR',
      requesterUrl: SITE_URL + '/renter',
      mode: 'test', // Change to 'live' when bank account confirmed // change to 'test' for sandbox
      description: description || `Vollard Black License Fee - Month ${monthNumber}`,
      externalTransactionID,
      urls: {
        callbackUrl:    SITE_URL + '/api/ikhoka-webhook',
        successPageUrl: SITE_URL + '/' + (body.portalType||'renter') + '?payment=success&ref=' + externalTransactionID,
        failurePageUrl: SITE_URL + '/' + (body.portalType||'renter') + '?payment=failed',
        cancelUrl:      SITE_URL + '/' + (body.portalType||'renter') + '?payment=cancelled',
      },
    };

    const signature = generateSignature(APP_ID, SIGN_SECRET, payload);

    const response = await fetch(`${BASE_URL}/applications/${APP_ID}/payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'ApplicationId': APP_ID,
        'Signature': signature,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok || data.responseCode !== '00') {
      console.error('iKhoka error response:', JSON.stringify(data));
      console.error('iKhoka HTTP status:', response.status);
      const errorMsg = data.message || data.description || data.responseDescription || JSON.stringify(data);
      return Response.json({ error: errorMsg, details: data }, { status: 400 });
    }

    return Response.json({
      paylinkUrl: data.paylinkUrl,
      paylinkID: data.paylinkID,
      externalTransactionID: data.externalTransactionID,
    });

  } catch (err) {
    console.error('iKhoka route error:', err);
    return Response.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
