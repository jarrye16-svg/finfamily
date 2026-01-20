let currentDate = new Date();

const monthNames = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

const currentMonthEl = document.getElementById("currentMonth");

function updateMonth() {
  const month = monthNames[currentDate.getMonth()];
  const year = currentDate.getFullYear();
  currentMonthEl.textContent = `${month} de ${year}`;
}

document.getElementById("prevMonth").onclick = () => {
  currentDate.setMonth(currentDate.getMonth() - 1);
  updateMonth();
};

document.getElementById("nextMonth").onclick = () => {
  currentDate.setMonth(currentDate.getMonth() + 1);
  updateMonth();
};

// MOCK — depois substituímos por Supabase
const income = 0;
const expense = 0;
const credit = 0;

const balance = income - expense - credit;

document.getElementById("incomeValue").textContent = income.toLocaleString("pt-BR", {
  style: "currency",
  currency: "BRL"
});

document.getElementById("expenseValue").textContent = expense.toLocaleString("pt-BR", {
  style: "currency",
  currency: "BRL"
});

document.getElementById("creditValue").textContent = credit.toLocaleString("pt-BR", {
  style: "currency",
  currency: "BRL"
});

const balanceEl = document.getElementById("balanceValue");
balanceEl.textContent = balance.toLocaleString("pt-BR", {
  style: "currency",
  currency: "BRL"
});

balanceEl.style.color = balance >= 0 ? "#16a34a" : "#dc2626";

updateMonth();
