document.addEventListener('DOMContentLoaded', () => {
  const splash = document.getElementById('splash');
  const loginContainer = document.getElementById('loginContainer');
  const form = document.getElementById('loginForm');

  /* =========================
     SPLASH – NUNCA TRAVA
     ========================= */

  setTimeout(() => {
    if (splash) {
      splash.style.transition =
        'opacity 0.6s ease, transform 0.6s ease';
      splash.style.opacity = '0';
      splash.style.transform = 'translateY(-40px)';
      splash.style.pointerEvents = 'none';

      setTimeout(() => splash.remove(), 700);
    }

    if (loginContainer) {
      loginContainer.classList.add('login-visible');
    }
  }, 1800);

  /* =========================
     LOGIN (BLINDADO)
     ========================= */

  if (!form) {
    console.warn('[Login] Formulário não encontrado (#loginForm)');
    return; // não quebra a página
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!window.supabase) {
      alert('Serviço indisponível no momento.');
      return;
    }

    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');

    if (!emailInput || !passwordInput) {
      alert('Campos de login não encontrados.');
      return;
    }

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    const { error } = await window.supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      alert(error.message);
      return;
    }

    // Login OK
    window.location.href = '/finfamily/Oria/index.html';
  });
});
