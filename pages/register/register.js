(() => {
  const form = document.getElementById("registerForm");
  const errorBox = document.getElementById("error");

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    errorBox.textContent = "";

    // Cadastro fake por enquanto (base estável)
    alert("Conta criada com sucesso!");

    window.location.href = "/finfamily/pages/login/login.html";
  });
})();
