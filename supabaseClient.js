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

  const {
    title,
    artistName,
    description,
    imageUrl,
    startingPrice,
    bidIncrement,
    startsAt,
    endsAt,
  } = body || {};

  if (!title || !artistName || !startingPrice || !endsAt) {
    return NextResponse.json({ ok: false, error: 'missing_fields' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('artworks')
    .insert({
      title,
      artist_name: artistName,
      description: description || null,
      image_url: imageUrl || null,
      starting_price: Number(startingPrice),
      current_price: Number(startingPrice),
      bid_increment: bidIncrement ? Number(bidIncrement) : 100,
      starts_at: startsAt || new Date().toISOString(),
      ends_at: endsAt,
      status: 'upcoming',
    })
    .select()
    .single();

  if (error) {
    console.error('create artwork error:', error);
    return NextResponse.json({ ok: false, error: 'server_error' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, artwork: data });
}

export async function GET(request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabaseAdmin
    .from('artworks')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ ok: false, error: 'server_error' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, artworks: data });
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

  const { error } = await supabaseAdmin.from('artworks').update({ status }).eq('id', id);

  if (error) {
    return NextResponse.json({ ok: false, error: 'server_error' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
