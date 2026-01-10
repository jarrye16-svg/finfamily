document.querySelector('.login-form').addEventListener('submit', e => {
  e.preventDefault();

  const inputs = e.target.querySelectorAll('input');
  const password = inputs[1].value;
  const confirm = inputs[2].value;
  const button = e.target.querySelector('button');

  if (password !== confirm) {
    button.innerText = 'Senhas não conferem';
    button.style.background = '#dc2626';

    setTimeout(() => {
      button.innerText = 'Criar conta';
      button.style.background = '';
    }, 2000);

    return;
  }

  button.innerText = 'Criando conta...';
  button.disabled = true;

  setTimeout(() => {
    // aqui entra Supabase/Auth depois
    window.location.href = '/auth/login.html';
  }, 1500);
});
