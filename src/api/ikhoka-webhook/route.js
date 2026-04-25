import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const APP_ID      = process.env.IKHOKA_APP_ID;
const SIGN_SECRET = process.env.IKHOKA_SIGN_SECRET;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function verifySignature(payloadString, receivedSig) {
  if (!SIGN_SECRET || !receivedSig) return true; // skip if not configured
  const expected = crypto
    .createHmac('sha256', SIGN_SECRET)
    .update(payloadString)
    .digest('base64');
  return expected === receivedSig;
}

export async function POST(request) {
  try {
    const sig = request.headers.get('Signature') || request.headers.get('signature') || '';
    const rawBody = await request.text();

    if (!verifySignature(rawBody, sig)) {
      console.error('iKhoka webhook: invalid signature');
      return new Response('Invalid signature', { status: 401 });
    }

    let body;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return new Response('Invalid JSON', { status: 400 });
    }

    console.log('iKhoka webhook received:', JSON.stringify(body));

    // Only process successful payments
    if (body.status !== 'SUCCESS') {
      console.log('iKhoka webhook: non-success status:', body.status);
      return new Response('OK', { status: 200 });
    }

    const ref = body.externalTransactionID || '';
    const refMatch = ref.match(/^VB-([A-Za-z0-9]+)-M(\d+)$/i);
    const scheduleRef = refMatch ? refMatch[1] : null;
    const monthNumber = refMatch ? parseInt(refMatch[2]) : null;
    const amountRands = (body.amount || 0) / 100;

    // 1. Log to ikhoka_payments table
    const { error: logError } = await supabase.from('ikhoka_payments').insert({
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

    if (logError) {
      console.error('ikhoka_payments insert error:', logError);
    }

    // 2. Update schedule and record payment
    if (scheduleRef && monthNumber) {
      const { data: schedules, error: schedErr } = await supabase
        .from('schedules')
        .select('id, months_paid, collector_id')
        .ilike('id', `%${scheduleRef}%`)
        .limit(1);

      if (schedErr) {
        console.error('Schedule lookup error:', schedErr);
      }

      if (schedules && schedules.length > 0) {
        const schedule = schedules[0];
        const newMonthsPaid = Math.max(schedule.months_paid || 0, monthNumber);

        const { error: updateErr } = await supabase
          .from('schedules')
          .update({
            months_paid: newMonthsPaid,
            updated_at: new Date().toISOString(),
          })
          .eq('id', schedule.id);

        if (updateErr) {
          console.error('Schedule update error:', updateErr);
        }

        const { error: payErr } = await supabase.from('payments').insert({
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

        if (payErr) {
          console.error('Payment insert error:', payErr);
        }

        console.log('Payment processed successfully:', ref, 'R', amountRands);
      } else {
        console.warn('No schedule found for ref:', scheduleRef);
      }
    }

    return new Response('OK', { status: 200 });

  } catch (err) {
    console.error('iKhoka webhook error:', err);
    return new Response('Server Error', { status: 500 });
  }
}
