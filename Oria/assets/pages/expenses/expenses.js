/* =========================================
   Oria • Contas da Casa
   FASE 1 — MOCK (sem Supabase)
   ========================================= */

const expenses = [
  {
    name: "Aluguel",
    amount: 1800,
    type: "fixed",
    paid: true
  },
  {
    name: "Internet",
    amount: 129.90,
    type: "fixed",
    paid: false
  },
  {
    name: "Energia Elétrica",
    amount: 320,
    type: "one_time",
    paid: false
  }
];

function formatBRL(value) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(value);
}

function createCard(expense) {
  const card = document.createElement("div");
  card.className = "expense-card";

  card.innerHTML = `
    <div class="expense-info">
      <span class="expense-name">${expense.name}</span>
      <span class="expense-amount">${formatBRL(expense.amount)}</span>
    </div>

    <div class="expense-actions">
      <span class="expense-status ${expense.paid ? "paid" : ""}"></span>
    </div>
  `;

  return card;
}

function renderExpenses() {
  const fixedList = document.getElementById("fixedList");
  const oneTimeList = document.getElementById("oneTimeList");

  fixedList.innerHTML = "";
  oneTimeList.innerHTML = "";

  expenses.forEach(expense => {
    const card = createCard(expense);

    if (expense.type === "fixed") {
      fixedList.appendChild(card);
    } else {
      oneTimeList.appendChild(card);
    }
  });
}

document.addEventListener("DOMContentLoaded", renderExpenses);
