import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not found. Running in localStorage mode.');
}

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

const BUCKET = 'artwork-images';

const toSnake = (obj) => {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return obj;
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    const sk = k.replace(/[A-Z]/g, (m) => '_' + m.toLowerCase());
    out[sk] = v;
  }
  return out;
};

const toCamel = (obj) => {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return obj;
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    const ck = k.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
    out[ck] = v;
  }
  return out;
};

// ─── Storage helpers ───────────────────────────────────────────────────────
export const storage = {
  /**
   * Upload a File or Blob to the artwork-images bucket.
   * Returns the public URL string, or null on failure.
   */
  async uploadArtworkImage(file, artworkId) {
    if (!supabase) return null;
    const ext = file.name ? file.name.split('.').pop().toLowerCase() : 'jpg';
    const path = `artworks/${artworkId}.${ext}`;
    // upsert: true replaces an existing file with the same path
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { upsert: true, contentType: file.type });
    if (error) {
      console.error('Image upload failed:', error.message);
      return null;
    }
    return storage.getPublicUrl(path);
  },

  /**
   * Get the permanent public URL for a stored path.
   */
  getPublicUrl(path) {
    if (!supabase) return null;
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    return data?.publicUrl || null;
  },

  /**
   * Delete an image by its full public URL or storage path.
   */
  async deleteArtworkImage(artworkId) {
    if (!supabase) return;
    // Try both common extensions
    for (const ext of ['jpg', 'jpeg', 'png', 'webp', 'gif']) {
      await supabase.storage
        .from(BUCKET)
        .remove([`artworks/${artworkId}.${ext}`]);
    }
  },
};

// ─── Database helpers ───────────────────────────────────────────────────────
export const db = {
  async getAll(table) {
    if (!supabase) return null;
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .order('created_at', { ascending: false });
    if (error) { console.error(`Error fetching ${table}:`, error); return null; }
    return data.map(toCamel);
  },

  async insert(table, record) {
    if (!supabase) return null;
    const snake = toSnake(record);
    if (snake.id && typeof snake.id === 'string' && snake.id.startsWith('VB')) delete snake.id;
    const { data, error } = await supabase
      .from(table)
      .insert(snake)
      .select()
      .single();
    if (error) { console.error(`Error inserting into ${table}:`, error); return null; }
    return toCamel(data);
  },

  async insertMany(table, records) {
    if (!supabase) return null;
    const snakes = records.map(r => {
      const s = toSnake(r);
      if (s.id && typeof s.id === 'string' && s.id.startsWith('VB')) delete s.id;
      return s;
    });
    const { data, error } = await supabase.from(table).insert(snakes).select();
    if (error) { console.error(`Error bulk inserting into ${table}:`, error); return null; }
    return data.map(toCamel);
  },

  async update(table, id, changes) {
    if (!supabase) return null;
    const snake = toSnake(changes);
    delete snake.id;
    const { data, error } = await supabase
      .from(table)
      .update(snake)
      .eq('id', id)
      .select()
      .single();
    if (error) { console.error(`Error updating ${table}:`, error); return null; }
    return toCamel(data);
  },

  async remove(table, id) {
    if (!supabase) return null;
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) { console.error(`Error deleting from ${table}:`, error); return null; }
    return true;
  },

  isConnected() {
    return !!supabase;
  },
};
