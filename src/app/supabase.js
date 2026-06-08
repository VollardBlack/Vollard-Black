import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not found. Running in localStorage mode.');
}

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    })
  : null;

const BUCKET = 'artwork-images';

// ─── Auth helpers ────────────────────────────────────────────────────────────
export const auth = {
  async signIn(email, password) {
    if (!supabase) return { error: 'Not connected' };
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    return { data, error };
  },
  async signOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
  },
  async getSession() {
    if (!supabase) return null;
    const { data } = await supabase.auth.getSession();
    return data?.session || null;
  },
  async getUser() {
    if (!supabase) return null;
    const { data } = await supabase.auth.getUser();
    return data?.user || null;
  },
  async isAdmin() {
    if (!supabase) return true; // local mode = always admin
    const { data } = await supabase.from('admin_profiles').select('id').single();
    return !!data;
  },
  onAuthStateChange(callback) {
    if (!supabase) return { data: { subscription: { unsubscribe: () => {} } } };
    return supabase.auth.onAuthStateChange(callback);
  },
};

// ─── Storage helpers ─────────────────────────────────────────────────────────
export const storage = {
  async uploadArtworkImage(file, artworkId) {
    if (!supabase) return null;
    const ext = file.name ? file.name.split('.').pop().toLowerCase() : 'jpg';
    const path = `artworks/${artworkId}.${ext}`;
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { upsert: true, contentType: file.type });
    if (error) {
      console.error('Image upload failed:', error.message);
      return null;
    }
    return storage.getPublicUrl(path);
  },
  getPublicUrl(path) {
    if (!supabase) return null;
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    return data?.publicUrl || null;
  },
  async deleteArtworkImage(artworkId) {
    if (!supabase) return;
    for (const ext of ['jpg', 'jpeg', 'png', 'webp', 'gif']) {
      await supabase.storage
        .from(BUCKET)
        .remove([`artworks/${artworkId}.${ext}`]);
    }
  },
};

// ─── Case converters ─────────────────────────────────────────────────────────
const toSnake = (obj) => {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return obj;
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    out[k.replace(/[A-Z]/g, (m) => '_' + m.toLowerCase())] = v;
  }
  return out;
};
const toCamel = (obj) => {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return obj;
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    out[k.replace(/_([a-z])/g, (_, c) => c.toUpperCase())] = v;
  }
  return out;
};

// ─── Database helpers ─────────────────────────────────────────────────────────
export const db = {
  async getAll(table) {
    if (!supabase) return null;
    const { data, error } = await supabase
      .from(table).select('*').order('created_at', { ascending: false });
    if (error) { console.error(`getAll ${table}:`, error.message); return null; }
    return data.map(toCamel);
  },
  async insert(table, record) {
    if (!supabase) return null;
    const snake = toSnake(record);
    // Remove auto-generated UUID fields for UUID-primary-key tables
    // Keep IDs for text-primary-key tables (auctions, bids, reports, schedules, payments, sales)
    // Keep all IDs - app now generates proper UUIDs for UUID tables
    // and VB-prefixed IDs for text-ID tables
    // Only strip if no ID provided at all
    if (!snake.id) delete snake.id;
    const { data, error } = await supabase
      .from(table).insert(snake).select().single();
    if (error) { console.error(`insert ${table}:`, error.message); return null; }
    return toCamel(data);
  },
  async insertMany(table, records) {
    if (!supabase) return null;
    const { data, error } = await supabase
      .from(table).insert(records.map(toSnake)).select();
    if (error) { console.error(`insertMany ${table}:`, error.message); return null; }
    return data.map(toCamel);
  },
  async update(table, id, changes) {
    if (!supabase) return null;
    const snake = toSnake(changes);
    delete snake.id;
    const { data, error } = await supabase
      .from(table).update(snake).eq('id', id).select().single();
    if (error) { console.error(`update ${table}:`, error.message); return null; }
    return toCamel(data);
  },
  async remove(table, id) {
    if (!supabase) return null;
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) { console.error(`remove ${table}:`, error.message); return null; }
    return true;
  },
  isConnected() { return !!supabase; },
};
