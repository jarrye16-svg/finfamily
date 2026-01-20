// ===============================
// CONTROLE DE MÊS
// ===============================
let currentDate = new Date();

const monthNames = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

const currentMonthEl = document.getElementById("currentMonth");

function updateMonthLabel() {
  currentMonthEl.textContent = monthNames[currentDate.getMonth()];
}

document.getElementById("prevMonth").onclick = () => {
  currentDate.setMonth(currentDate.getMonth() - 1);
  updateMonthLabel();
  loadData();
};

document.getElementById("nextMonth").onclick = () => {
  currentDate.setMonth(currentDate.getMonth() + 1);
  updateMonthLabel();
  loadData();
};

// ===============================
// DADOS (MOCK TEMPORÁRIO)
// ===============================
function loadData() {
  const income = 5200;
  const expenses = 3100;
  const credit = 1550;

  document.getElementById("incomeValue").textContent =
    income.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  document.getElementById("expenseValue").textContent =
    expenses.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  document.getElementById("balanceValue").textContent =
    (income - expenses).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  document.getElementById("creditBill").textContent =
    credit.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// ===============================
// NAVEGAÇÃO
// ===============================
document.getElementById("card-income").onclick = () => {
  window.location.href = "../income/income.html";
};

document.getElementById("card-expenses").onclick = () => {
  window.location.href = "../expenses/expenses.html";
};

document.getElementById("addIncome").onclick = () => {
  window.location.href = "../income/income.html";
};

document.getElementById("addExpense").onclick = () => {
  window.location.href = "../expenses/expenses.html";
};

// ===============================
// INIT
// ===============================
updateMonthLabel();
loadData();
