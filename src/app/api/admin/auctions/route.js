import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { isAuthorized } from '@/lib/adminAuth';
import { randomUUID } from 'crypto';

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

  const { title, artist, imageUrl, description, reservePrice, incrementValue, galleryName, endTime } = body || {};
  if (!title || !artist || !reservePrice || !endTime) {
    return NextResponse.json({ ok: false, error: 'missing_fields' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('auctions')
    .insert({
      id: randomUUID(),
      title,
      artist,
      image_url: imageUrl || null,
      description: description || null,
      artwork_value: Number(reservePrice),
      reserve_price: Number(reservePrice),
      current_bid: 0,
      increment_type: 'fixed',
      increment_value: incrementValue ? Number(incrementValue) : 100,
      increment_label: `R${incrementValue || 100}`,
      status: 'Draft',
      gallery_name: galleryName || 'The Winelands Art Gallery',
      end_time: endTime,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('create auction error:', error);
    return NextResponse.json({ ok: false, error: 'server_error' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, auction: data });
}

export async function GET(request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabaseAdmin
    .from('auctions')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ ok: false, error: 'server_error' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, auctions: data });
}

export async function PATCH(request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_request' }, { status: 400 });
  }

  const { id, status } = body || {};
  if (!id || !status) {
    return NextResponse.json({ ok: false, error: 'missing_fields' }, { status: 400 });
  }

  const patch = { status };
  if (status === 'Live') patch.started_at = new Date().toISOString();

  const { error } = await supabaseAdmin.from('auctions').update(patch).eq('id', id);

  if (error) {
    return NextResponse.json({ ok: false, error: 'server_error' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
