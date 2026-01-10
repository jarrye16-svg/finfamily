// pages/register/register.js

const form = document.getElementById("registerForm");
const errorBox = document.getElementById("error");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  errorBox.textContent = "";

  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  if (!name || !email || !password) {
    errorBox.textContent = "Preencha todos os campos.";
    return;
  }

  const { data, error } = await window.supabaseClient.auth.signUp({
    email,
    password,
  });

  if (error) {
    errorBox.textContent = error.message;
    return;
  }

  const userId = data.user.id;

  const { error: profileError } = await window.supabaseClient
    .from("profiles")
    .insert({
      id: userId,
      name: name,
    });

  if (profileError) {
    errorBox.textContent = "Erro ao criar perfil.";
    return;
  }

  window.location.href = "../login/login.html";
});
