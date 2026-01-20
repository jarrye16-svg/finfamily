// 🔴 SUPABASE CONFIG — SUBSTITUIR
const SUPABASE_URL = "https://SUA_URL.supabase.co";
const SUPABASE_KEY = "SUA_PUBLIC_ANON_KEY";

const supabase = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

// DATA ATUAL
let currentDate = new Date();

const monthNames = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

const currentMonthEl = document.getElementById("currentMonth");

function updateMonthLabel() {
  currentMonthEl.textContent = monthNames[currentDate.getMonth()];
}

// BOTÕES DE MÊS
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

// CARREGAR DADOS
async function loadData() {
  // 🔴 AQUI ENTRA A LÓGICA REAL COM SUPABASE
  // Exemplo fake temporário

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

// LINKS
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

// INIT
updateMonthLabel();
loadData();
