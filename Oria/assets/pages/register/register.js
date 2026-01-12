document.getElementById('registerForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  if (!window.supabase) {
    alert('Erro interno: Supabase não carregado.');
    return;
  }

  const name = document.getElementById('name').value.trim();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  if (password.length < 6) {
    alert('A senha deve ter no mínimo 6 caracteres.');
    return;
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name }
    }
  });

  if (error) {
    alert(error.message);
    return;
  }

  alert('Conta criada com sucesso! Verifique seu e-mail.');
  window.location.href = '/finfamily/Oria/assets/pages/login/login.html';
});
