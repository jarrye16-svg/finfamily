/* ==================================================
   Oria • Supabase Client (OFICIAL)
   ================================================== */

const SUPABASE_URL = 'https://gelhizmssqlexlxkvufc.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_AstKmfIU-pBBXXfPDlw9HA_hQYfLqcb';

// Carrega o SDK do Supabase dinamicamente
(function () {
  const script = document.createElement('script');
  script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
  script.defer = true;

  script.onload = () => {
    window.supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('[Oria] Supabase conectado');
  };

  script.onerror = () => {
    console.error('[Oria] Erro ao carregar Supabase');
  };

  document.head.appendChild(script);
})();
