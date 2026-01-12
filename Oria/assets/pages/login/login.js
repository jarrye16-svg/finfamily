document.addEventListener('DOMContentLoaded', () => {
  const splash = document.getElementById('splash');
  const loginContainer = document.getElementById('loginContainer');
  const form = document.getElementById('loginForm');

  /* =========================
     SPLASH CONTROLADO POR TEMPO
     ========================= */

  // garante que o login SEMPRE apareça
  setTimeout(() => {
    splash.style.transition =
      'opacity 0.6s ease, transform 0.6s ease';
    splash.style.opacity = '0';
    splash.style.transform = 'translateY(-40px)';
    splash.style.pointerEvents = 'none';

    loginContainer.classList.add('login-visible');

    setTimeout(() => splash.remove(), 700);
  }, 1800); // tempo do splash (1.8s)

  /* =========================
     LOGIN (NÃO BLOQUEIA SPLASH)
     ========================= */

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!window.supabase) {
      alert('Serviço indisponível. Tente novamente.');
      return;
    }

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    const { error } = await window.supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      alert(error.message);
      return;
    }

    // login OK
    window.location.href = '/finfamily/Oria/index.html';
  });
});
