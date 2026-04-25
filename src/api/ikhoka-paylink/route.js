import crypto from 'crypto';

const APP_ID      = process.env.IKHOKA_APP_ID;
const SIGN_SECRET = process.env.IKHOKA_SIGN_SECRET;
const ENTITY_ID   = process.env.IKHOKA_ENTITY_ID || process.env.IKHOKA_APP_ID;
const BASE_URL    = 'https://api.ikhokha.com';
const SITE_URL    = process.env.NEXT_PUBLIC_SITE_URL || 'https://vollard-black.vercel.app';

function generateSignature(secret, payloadString) {
  return crypto
    .createHmac('sha256', secret)
    .update(payloadString)
    .digest('base64');
}

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      amount,
      description,
      scheduleId,
      monthNumber,
      collectorEmail,
      portalType,
      paymentType,
    } = body;

    if (!amount || !scheduleId) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!APP_ID || !SIGN_SECRET) {
      return Response.json({ error: 'iKhoka credentials not configured' }, { status: 500 });
    }

    const portal = portalType || 'renter';
    const externalTransactionID = `VB-${String(scheduleId).slice(-8).toUpperCase()}-M${monthNumber || 1}`;
    const amountCents = Math.round(Number(amount) * 100);

    const payload = {
      entityID: ENTITY_ID,
      amount: amountCents,
      currency: 'ZAR',
      requesterUrl: `${SITE_URL}/${portal}`,
      description: description || `Vollard Black - ${paymentType || 'License Fee'} Month ${monthNumber || 1}`,
      externalTransactionID,
      urls: {
        callbackUrl:    `${SITE_URL}/api/ikhoka-webhook`,
        successPageUrl: `${SITE_URL}/${portal}?payment=success&ref=${externalTransactionID}`,
        failurePageUrl: `${SITE_URL}/${portal}?payment=failed`,
        cancelUrl:      `${SITE_URL}/${portal}?payment=cancelled`,
      },
    };

    const payloadString = JSON.stringify(payload);
    const signature = generateSignature(SIGN_SECRET, payloadString);

    console.log('iKhoka request to:', `${BASE_URL}/applications/${APP_ID}/payment`);
    console.log('iKhoka payload:', payloadString);

    const response = await fetch(`${BASE_URL}/applications/${APP_ID}/payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'ApplicationId': APP_ID,
        'Signature': signature,
      },
      body: payloadString,
    });

    const responseText = await response.text();
    console.log('iKhoka raw response:', responseText);

    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      return Response.json({
        error: 'iKhoka returned non-JSON response',
        details: responseText,
      }, { status: 502 });
    }

    if (!response.ok) {
      console.error('iKhoka HTTP error:', response.status, data);
      return Response.json({
        error: data.message || data.description || data.responseDescription || 'iKhoka request failed',
        details: data,
      }, { status: 400 });
    }

    if (data.responseCode && data.responseCode !== '00') {
      console.error('iKhoka responseCode error:', data);
      return Response.json({
        error: data.message || data.responseDescription || `iKhoka error code: ${data.responseCode}`,
        details: data,
      }, { status: 400 });
    }

    return Response.json({
      paylinkUrl: data.paylinkUrl,
      paylinkID: data.paylinkID,
      externalTransactionID: data.externalTransactionID || externalTransactionID,
    });

  } catch (err) {
    console.error('iKhoka route error:', err);
    return Response.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
