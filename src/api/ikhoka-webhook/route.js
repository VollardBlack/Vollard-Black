// ═══════════════════════════════════════════════════════════════
// VOLLARD BLACK — iKhoka Webhook Handler
// File: src/app/api/ikhoka-webhook/route.js
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
      return new Response('OK', { status: 200 });
    }

    // Parse reference: VB-{scheduleId8}-M{monthNumber}
    const ref = body.externalTransactionID || '';
    const refMatch = ref.match(/^VB-([A-Za-z0-9]+)-M(\d+)$/);
    const scheduleRef = refMatch ? refMatch[1] : null;
    const monthNumber = refMatch ? parseInt(refMatch[2]) : null;
    const amountRands = (body.amount || 0) / 100;

    // 1. Log payment to ikhoka_payments table
    await supabase.from('ikhoka_payments').insert({
      id: crypto.randomUUID(),
      payment_ref: ref,
      pf_payment_id: body.paylinkID || body.transactionID || '',
      payment_status: body.status,
      amount_gross: amountRands,
      amount_fee: 0,
      amount_net: amountRands,
      item_name: body.description || '',
      email_address: body.customerEmail || '',
      schedule_ref: scheduleRef,
      month_number: monthNumber,
      confirmed: true,
      raw_data: body,
      created_at: new Date().toISOString(),
    });

    // 2. Find the schedule by partial ID match and update months_paid
    if (scheduleRef && monthNumber) {
      const { data: schedules } = await supabase
        .from('schedules')
        .select('id, months_paid, collector_id')
        .ilike('id', `%${scheduleRef}%`)
        .limit(1);

      if (schedules && schedules.length > 0) {
        const schedule = schedules[0];
        const newMonthsPaid = Math.max(schedule.months_paid || 0, monthNumber);
        
        // Update schedule months_paid
        await supabase
          .from('schedules')
          .update({ months_paid: newMonthsPaid, updated_at: new Date().toISOString() })
          .eq('id', schedule.id);

        // Record in payments table
        await supabase.from('payments').insert({
          id: crypto.randomUUID(),
          collector_id: schedule.collector_id,
          schedule_id: schedule.id,
          amount: amountRands,
          method: 'iKhoka',
          month_number: monthNumber,
          date: new Date().toISOString().slice(0, 10),
          reference: ref,
          created_at: new Date().toISOString(),
        });
      }
    }

    console.log('iKhoka payment processed:', ref, amountRands);
    return new Response('OK', { status: 200 });

  } catch (err) {
    console.error('iKhoka webhook error:', err);
    return new Response('Server Error', { status: 500 });
  }
}
