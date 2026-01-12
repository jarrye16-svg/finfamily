document.addEventListener('DOMContentLoaded', () => {
  const splash = document.getElementById('splash');
  const loginContainer = document.getElementById('loginContainer');

  // Tempo total de presença da marca
  setTimeout(() => {
    splash.style.transition = 'transform 1.1s cubic-bezier(0.4, 0, 0.2, 1), opacity 1.1s ease';
    splash.style.transform = 'translateY(-110%)';
    splash.style.opacity = '0';

    setTimeout(() => {
      splash.remove();
      loginContainer.classList.add('login-visible');
    }, 1100);
  }, 3200); // ⬅️ tempo de exposição maior
});
