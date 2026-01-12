// ===============================
// Oria - Supabase Client
// ===============================

// ⚠️ COLOQUE AQUI SEUS DADOS REAIS
const SUPABASE_URL = 'https://SEU-PROJETO.supabase.co';
const SUPABASE_ANON_KEY = 'SUA-ANON-KEY';

// Carrega SDK se ainda não existir
(function loadSupabaseSDK() {
  if (window.supabase) return;

  const script = document.createElement('script');
  script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
  script.defer = true;

  script.onload = () => {
    window.supabase = supabase.createClient(
      SUPABASE_URL,
      SUPABASE_ANON_KEY
    );
    console.log('[Supabase] Client carregado com sucesso');
  };

  script.onerror = () => {
    console.error('[Supabase] Falha ao carregar SDK');
  };

  document.head.appendChild(script);
})();
