document.addEventListener('DOMContentLoaded', () => {
  const splash = document.getElementById('splash');
  const loginContainer = document.getElementById('loginContainer');

  // Splash fica mais tempo visível
  setTimeout(() => {
    splash.style.transition = 'transform 1s ease, opacity 1s ease';
    splash.style.transform = 'translateY(-100%)';
    splash.style.opacity = '0';

    setTimeout(() => {
      splash.remove();
      loginContainer.classList.add('login-visible');
    }, 1000);
  }, 2800);
});
