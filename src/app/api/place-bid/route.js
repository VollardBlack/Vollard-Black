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

  const { artworkId, whatsapp, amount } = body || {};

  if (!artworkId || !whatsapp || !amount || Number(amount) <= 0) {
    return NextResponse.json({ ok: false, error: 'missing_fields' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin.rpc('place_bid', {
    p_artwork_id: artworkId,
    p_whatsapp: normalizeWhatsapp(whatsapp),
    p_amount: Number(amount),
  });

  if (error) {
    console.error('place_bid error:', error);
    return NextResponse.json({ ok: false, error: 'server_error' }, { status: 500 });
  }

  const status = data?.ok ? 200 : 200; // business-logic failures still return 200 with ok:false
  return NextResponse.json(data, { status });
}
