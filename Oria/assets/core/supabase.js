/* ==================================================
   Oria • Supabase Client (GLOBAL)
   Arquivo JS PURO — usado em TODAS as telas
================================================== */

const SUPABASE_URL = 'https://gelhizmssqlexlxkvufc.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_AstKmfIU-pBBXXfPDlw9HA_hQYfLqcb';

/* ===============================
   Espera o Supabase carregar
   (EXPOSTO GLOBALMENTE)
================================ */
window.waitSupabase = function () {
  return new Promise(resolve => {
    const check = () => {
      if (window.supabase) return resolve();
      setTimeout(check, 50);
    };
    check();
  });
};

/* ===============================
   Carrega SDK e cria client
================================ */
(function loadSupabase() {
  if (window.supabase) return;

  const script = document.createElement('script');
  script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';

  script.onload = () => {
    window.supabase = supabase.createClient(
      SUPABASE_URL,
      SUPABASE_ANON_KEY
    );
    console.log('[Oria] Supabase conectado');
  };

  script.onerror = () => {
    console.error('[Oria] Erro ao carregar Supabase SDK');
  };

  document.head.appendChild(script);
})();
