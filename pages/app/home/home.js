/* =========================
   FinFamily - Home
   Modal Nova Entrada
========================= */

document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("entradaModal");
  const closeBtn = document.getElementById("closeEntrada");
  const cancelBtn = document.getElementById("cancelEntrada");

  // Botão "Entrada" (grande verde)
  const entradaBtn = [...document.querySelectorAll("button")]
    .find(btn => btn.textContent.trim() === "Entrada");

  // Abrir modal
  if (entradaBtn) {
    entradaBtn.addEventListener("click", () => {
      modal.classList.add("active");
    });
  }

  // Fechar modal (X)
  closeBtn.addEventListener("click", () => {
    modal.classList.remove("active");
  });

  // Fechar modal (Cancelar)
  cancelBtn.addEventListener("click", () => {
    modal.classList.remove("active");
  });

  // Seleção do tipo de entrada
  const typeButtons = document.querySelectorAll(".type");

  typeButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      typeButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
    });
  });

  // Submit (por enquanto só visual / teste)
  const form = document.getElementById("entradaForm");

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const tipo =
      document.querySelector(".type.active")?.dataset.type || "salary";

    const valor = document.getElementById("entradaValor").value;
    const data = document.getElementById("entradaData").value;

    if (!valor || !data) {
      alert("Preencha valor e data");
      return;
    }

    console.log("Nova entrada:", {
      tipo,
      valor,
      data
    });

    // FECHA MODAL
    modal.classList.remove("active");

    // LIMPA CAMPOS
    form.reset();
    typeButtons.forEach(b => b.classList.remove("active"));
    typeButtons[0].classList.add("active");
  });
});
