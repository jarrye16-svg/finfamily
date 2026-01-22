// ===== MÊS =====
let currentDate = new Date();

const monthNames = [
  "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
  "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"
];

const currentMonthEl = document.getElementById("currentMonth");

function updateMonth() {
  currentMonthEl.textContent =
    `${monthNames[currentDate.getMonth()]} de ${currentDate.getFullYear()}`;
}

document.getElementById("prevMonth").onclick = () => {
  currentDate.setMonth(currentDate.getMonth() - 1);
  updateMonth();
};

document.getElementById("nextMonth").onclick = () => {
  currentDate.setMonth(currentDate.getMonth() + 1);
  updateMonth();
};

// ===== MOCK =====
const income = 0;
const expense = 0;
const credit = 0;
const balance = income - expense - credit;

document.getElementById("incomeValue").textContent = income.toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
document.getElementById("expenseValue").textContent = expense.toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
document.getElementById("creditValue").textContent = credit.toLocaleString("pt-BR",{style:"currency",currency:"BRL"});

const balanceEl = document.getElementById("balanceValue");
balanceEl.textContent = balance.toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
balanceEl.style.color = balance >= 0 ? "#16a34a" : "#dc2626";

// ===== NAVEGAÇÃO =====
document.getElementById("btnExpenses").onclick = () => {
  window.location.href = "../../expenses/expenses.html";
};
document.getElementById("btnIncome").onclick = () => {
  window.location.href = "../../income/income.html";
};
document.getElementById("btnPiggy").onclick = () => {
  window.location.href = "../../piggy/piggy.html";
};
document.getElementById("btnCards").onclick = () => {
  window.location.href = "../../cards/cards.html";
};

updateMonth();
