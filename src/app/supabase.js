import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: { autoRefreshToken: true, persistSession: true }
    })
  : null;

export const db = {
  isConnected: () => !!supabase,
  getAll: async (table) => {
    if (!supabase) return [];
    const { data, error } = await supabase.from(table).select('*');
    if (error) throw error;
    return (data || []).map(toCamel);
  },
  insert: async (table, item) => {
    if (!supabase) return item;
    const snake = toSnake(item);
    const { data, error } = await supabase.from(table).insert(snake).select().single();
    if (error) { console.error('DB insert error:', table, error); return null; }
    return toCamel(data);
  },
  update: async (table, id, fields) => {
    if (!supabase) return;
    const snake = toSnake(fields);
    delete snake.id;
    const { error } = await supabase.from(table).update(snake).eq('id', id);
    if (error) console.error('DB update error:', table, error);
  },
  remove: async (table, id) => {
    if (!supabase) return;
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) console.error('DB remove error:', table, error);
  },
};

export const auth = {
  signIn: async (email, password) => {
    if (!supabase) return { data: null, error: new Error('Supabase not configured') };
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    return { data, error };
  },
  signOut: async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    window.location.reload();
  },
  getSession: async () => {
    if (!supabase) return null;
    const { data } = await supabase.auth.getSession();
    return data?.session || null;
  },
  onAuthStateChange: (callback) => {
    if (!supabase) return { data: { subscription: { unsubscribe: () => {} } } };
    return supabase.auth.onAuthStateChange(callback);
  },
  isAdmin: async () => {
    if (!supabase) return true;
    const { data } = await supabase.auth.getUser();
    if (!data?.user) return false;
    return data.user.email === 'concierge@vollardblack.com';
  },
};

export const storage = {
  uploadArtworkImage: async (file, artworkId) => {
    if (!supabase) return null;
    const ext = file.name.split('.').pop().toLowerCase();
    const path = `artworks/${artworkId}.${ext}`;
    const { error } = await supabase.storage
      .from('artwork-images')
      .upload(path, file, { upsert: true, contentType: file.type });
    if (error) { console.error('Storage upload error:', error); return null; }
    const { data } = supabase.storage.from('artwork-images').getPublicUrl(path);
    return data?.publicUrl || null;
  },
  deleteArtworkImage: async (artworkId) => {
    if (!supabase) return;
    await supabase.storage.from('artwork-images').remove([`artworks/${artworkId}`]);
  },
};

function toCamel(obj) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return obj;
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    out[k.replace(/_([a-z])/g, (_, c) => c.toUpperCase())] = v;
  }
  return out;
}

function toSnake(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    out[k.replace(/[A-Z]/g, m => '_' + m.toLowerCase())] = v;
  }
  return out;
}
