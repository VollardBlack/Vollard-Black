import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

function normalizeWhatsapp(raw) {
  const digits = String(raw).replace(/[^\d+]/g, '');
  if (digits.startsWith('+27')) return digits;
  if (digits.startsWith('0')) return '+27' + digits.slice(1);
  if (digits.startsWith('27')) return '+' + digits;
  return digits;
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_request' }, { status: 400 });
  }

  const { auctionId, whatsapp, amount } = body || {};
  if (!auctionId || !whatsapp || !amount || Number(amount) <= 0) {
    return NextResponse.json({ ok: false, error: 'missing_fields' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin.rpc('place_bid_v2', {
    p_auction_id: auctionId,
    p_whatsapp: normalizeWhatsapp(whatsapp),
    p_amount: Number(amount),
  });

  if (error) {
    console.error('place_bid_v2 error:', error);
    return NextResponse.json({ ok: false, error: 'server_error' }, { status: 500 });
  }

  return NextResponse.json(data);
}
