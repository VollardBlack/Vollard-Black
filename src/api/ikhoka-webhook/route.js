// ═══════════════════════════════════════════════════════════════
// VOLLARD BLACK — iKhoka Webhook Handler
// File: src/app/api/ikhoka-webhook/route.js
//
// iKhoka POSTs here when a payment completes.
// We log it to Supabase ikhoka_payments (reusing same table)
// and admin confirms via Invoicing page.
// ═══════════════════════════════════════════════════════════════

import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const APP_ID      = process.env.IKHOKA_APP_ID;
const SIGN_SECRET = process.env.IKHOKA_SIGN_SECRET;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function verifySignature(body, receivedSig) {
  const expected = crypto
    .createHmac('sha256', SIGN_SECRET)
    .update(APP_ID + JSON.stringify(body))
    .digest('hex');
  return expected === receivedSig;
}

export async function POST(request) {
  try {
    const sig = request.headers.get('Signature') || request.headers.get('signature') || '';
    const body = await request.json();

    // Verify signature
    if (SIGN_SECRET && sig && !verifySignature(body, sig)) {
      console.error('iKhoka webhook: invalid signature');
      return new Response('Invalid signature', { status: 401 });
    }

    // Only process successful payments
    if (body.status !== 'SUCCESS') {
      console.log('iKhoka webhook: non-success status:', body.status);
      return new Response('OK', { status: 200 });
    }

    // Parse reference: VB-{scheduleId8}-M{monthNumber}
    const ref = body.externalTransactionID || '';
    const refMatch = ref.match(/^VB-([A-Za-z0-9]+)-M(\d+)$/);

    const notification = {
      id: crypto.randomUUID(),
      payment_ref: ref,
      pf_payment_id: body.paylinkID || body.transactionID || '',
      payment_status: body.status,
      amount_gross: (body.amount || 0) / 100, // convert from cents
      amount_fee: 0,
      amount_net: (body.amount || 0) / 100,
      item_name: body.description || '',
      email_address: body.customerEmail || '',
      name_first: '',
      name_last: '',
      schedule_ref: refMatch ? refMatch[1] : null,
      month_number: refMatch ? parseInt(refMatch[2]) : null,
      confirmed: false,
      raw_data: body,
      created_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('ikhoka_payments')
      .insert(notification);

    if (error) {
      console.error('iKhoka webhook DB error:', error.message);
      return new Response('DB Error', { status: 500 });
    }

    console.log('iKhoka webhook received:', ref, body.status, body.amount);
    return new Response('OK', { status: 200 });

  } catch (err) {
    console.error('iKhoka webhook error:', err);
    return new Response('Server Error', { status: 500 });
  }
}
