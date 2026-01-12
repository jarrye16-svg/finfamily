document.addEventListener('DOMContentLoaded', () => {
  const splash = document.getElementById('splash');
  const loginContainer = document.getElementById('loginContainer');

  // Tempo maior e transição suave
  setTimeout(() => {
    splash.style.transition = 'transform 0.8s ease, opacity 0.8s ease';
    splash.style.transform = 'translateY(-100%)';
    splash.style.opacity = '0';

    setTimeout(() => {
      splash.remove();
      loginContainer.classList.add('login-visible');
    }, 800);
  }, 1600);
});
