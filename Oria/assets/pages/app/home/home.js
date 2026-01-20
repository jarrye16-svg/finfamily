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

// MOCK
document.getElementById("incomeValue").textContent = "R$ 0Reconnect";
document.getElementById("expenseValue").textContent = "R$ 0,00";
document.getElementById("creditBill").textContent = "R$ 0,00";
document.getElementById("balanceValue").textContent = "R$ 0,00";

updateMonth();
