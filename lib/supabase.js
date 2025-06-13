// lib/supabase.js
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY // service_role key dari supabase (atau anon jika public upload)
);

module.exports = supabase;