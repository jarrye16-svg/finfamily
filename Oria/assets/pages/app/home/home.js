// ===============================
// CONTROLE DE MÊS (HOME)
// ===============================
let currentDate = new Date();

const monthNames = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

const currentMonthEl = document.getElementById("currentMonth");

function updateMonth() {
  if (!currentMonthEl) return;

  currentMonthEl.textContent =
    `${monthNames[currentDate.getMonth()]} de ${currentDate.getFullYear()}`;
}

const prevBtn = document.getElementById("prevMonth");
const nextBtn = document.getElementById("nextMonth");

if (prevBtn) {
  prevBtn.onclick = () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    updateMonth();
  };
}

if (nextBtn) {
  nextBtn.onclick = () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    updateMonth();
  };
}

// ===============================
// DADOS MOCK (HOME)
// ===============================
const income = 0;
const expense = 0;
const credit = 0;
const balance = income - expense - credit;

const setValue = (id, value, color) => {
  const el = document.getElementById(id);
  if (!el) return;

  el.textContent = value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });

  if (color) el.style.color = color;
};

setValue("incomeValue", income, "#16a34a");
setValue("expenseValue", expense, "#dc2626");
setValue("creditValue", credit);
setValue("balanceValue", balance, balance >= 0 ? "#16a34a" : "#dc2626");

// ===============================
// NAVEGAÇÃO (USANDO TELAS REAIS)
// ===============================

const btnExpenses = document.getElementById("btnExpenses");
const btnIncome = document.getElementById("btnIncome");
const btnPiggy = document.getElementById("btnPiggy");
const btnCards = document.getElementById("btnCards");

if (btnExpenses) {
  btnExpenses.onclick = () => {
    window.location.href = "../../expenses/expenses.html";
  };
}

if (btnIncome) {
  btnIncome.onclick = () => {
    window.location.href = "../../income/income.html";
  };
}

if (btnPiggy) {
  btnPiggy.onclick = () => {
    window.location.href = "../../piggy/piggy.html";
  };
}

if (btnCards) {
  btnCards.onclick = () => {
    window.location.href = "../../cards/cards.html";
  };
}

// ===============================
updateMonth();
