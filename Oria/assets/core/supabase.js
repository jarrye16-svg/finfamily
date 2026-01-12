// =====================================
// Oria - Supabase Client (Base Oficial)
// =====================================

// ⚠️ Public anon key (pode ficar no frontend)
const SUPABASE_URL = "https://gelhizmssqlexlxkvufc.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_AstKmfIU-pBBXXfPDlw9HA_hQYfLqcb";

// Criação do client Supabase
const supabase = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

// Export global (simples e direto)
window.oriaSupabase = supabase;
