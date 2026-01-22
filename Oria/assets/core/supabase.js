// ======================================
// Oria - Supabase Client (OFICIAL)
// ======================================

// 🔑 Credenciais reais do projeto Oria
const SUPABASE_URL = "https://gelhizmssqlexlxkvufc.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_AstKmfIU-pBBXXfPDlw9HA_hQYfLqcb";

// Carrega o SDK do Supabase (v2)
(function () {
  const script = document.createElement("script");
  script.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
  script.defer = true;

  script.onload = () => {
    window.supabase = window.supabase.createClient(
      SUPABASE_URL,
      SUPABASE_ANON_KEY
    );

    // Flag global (IMPORTANTE)
    window.__SUPABASE_READY__ = true;

    console.log("[Supabase] Client carregado com sucesso");
  };

  script.onerror = () => {
    console.error("[Supabase] Erro ao carregar SDK do Supabase");
  };

  document.head.appendChild(script);
})();
