document.getElementById('registerForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const name = document.getElementById('name').value;
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name: name
      }
    }
  });

  if (error) {
    alert(error.message);
    return;
  }

  alert('Conta criada com sucesso! Verifique seu e-mail.');

  window.location.href =
    '/finfamily/Oria/assets/pages/login/login.html';
});
