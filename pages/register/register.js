// pages/register/register.js

const form = document.querySelector(".register-form");
const errorBox = document.getElementById("error");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  errorBox.textContent = "";

  const name = form.querySelector("#name").value.trim();
  const email = form.querySelector("#email").value.trim();
  const password = form.querySelector("#password").value;

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

  // Cadastro OK → volta para login
  window.location.href = "../login/login.html";
});
