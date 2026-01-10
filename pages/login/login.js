// pages/login/login.js

const form = document.querySelector(".login-form");
const errorBox = document.getElementById("error");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  errorBox.textContent = "";

  const email = form.querySelector('input[type="email"]').value.trim();
  const password = form.querySelector('input[type="password"]').value;

  if (!email || !password) {
    errorBox.textContent = "Preencha email e senha.";
    return;
  }

  const { error } = await window.supabaseClient.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    errorBox.textContent = "Email ou senha inválidos.";
    return;
  }

  // Login OK → redireciona (dashboard vem depois)
  window.location.href = "../app/dashboard/dashboard.html";
});
