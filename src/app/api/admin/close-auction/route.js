import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { isAuthorized } from '@/lib/adminAuth';

export async function POST(request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_request' }, { status: 400 });
  }

  const { auctionId } = body || {};
  if (!auctionId) {
    return NextResponse.json({ ok: false, error: 'missing_fields' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin.rpc('close_auction_v2', { p_auction_id: auctionId });

  if (error) {
    console.error('close_auction_v2 error:', error);
    return NextResponse.json({ ok: false, error: 'server_error' }, { status: 500 });
  }

  return NextResponse.json(data);
}
