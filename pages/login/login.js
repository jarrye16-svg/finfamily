document.querySelector('.login-form').addEventListener('submit', e => {
  e.preventDefault();

  const btn = e.target.querySelector('button');
  btn.innerText = 'Entrando...';
  btn.disabled = true;

  setTimeout(() => {
    // aqui entra autenticação real
    btn.innerText = 'Entrar';
    btn.disabled = false;
  }, 1500);
});
