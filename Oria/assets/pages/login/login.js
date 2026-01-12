document.addEventListener('DOMContentLoaded', () => {
  const splash = document.getElementById('splash');
  const loginContainer = document.getElementById('loginContainer');

  setTimeout(() => {
    splash.style.transition = 'transform 0.6s ease, opacity 0.6s ease';
    splash.style.transform = 'translateY(-100%)';
    splash.style.opacity = '0';

    setTimeout(() => {
      splash.remove();
      loginContainer.classList.add('login-visible');
    }, 600);
  }, 1200);
});
