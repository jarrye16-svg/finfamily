/* ==================================================
   Oria • Home (Resumo geral integrado com Supabase)
   Caminho do botão "Contas da Casa" corrigido
================================================== */

async function waitSupabase() {
  return new Promise((resolve) => {
    const i = setInterval(() => {
      if (window.supabase) {
        clearInterval(i);
        resolve();
      }
    }, 50);
  });
}

const MONTHS = [
  "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
  "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"
];

let currentDate = new Date();

function formatBRL(v) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(v || 0);
}

function formatMonth(date) {
  return `${MONTHS[date.getMonth()]} de ${date.getFullYear()}`;
}

function renderMonth() {
  document.getElementById("currentMonth").innerText = formatMonth(currentDate);
}

document.addEventListener("DOMContentLoaded", () => {
  renderMonth();
  carregarResumo();
});

document.getElementById("prevMonth").onclick = () => {
  currentDate.setMonth(currentDate.getMonth() - 1);
  renderMonth();
  carregarResumo();
};

document.getElementById("nextMonth").onclick = () => {
  currentDate.setMonth(currentDate.getMonth() + 1);
  renderMonth();
  carregarResumo();
};

async function carregarResumo() {
  await waitSupabase();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .eq("user_id", user.id)
    .eq("year", year)
    .eq("month", month);

  if (error) {
    console.error("[carregarResumo]", error);
    return;
  }

  if (!data || data.length === 0) {
    document.getElementById("incomeValue").innerText = "R$ 0,00";
    document.getElementById("expenseValue").innerText = "R$ 0,00";
    document.getElementById("creditValue").innerText = "R$ 0,00";
    document.getElementById("balanceValue").innerText = "R$ 0,00";
    return;
  }

  const gastos = data.filter(t => t.type === "gasto");
  const rendas = data.filter(t => t.type === "renda");
  const cartoes = data.filter(t => t.type === "cartao");

  const totalGastos = gastos.reduce((acc, cur) => acc + Number(cur.amount || 0), 0);
  const totalRendas = rendas.reduce((acc, cur) => acc + Number(cur.amount || 0), 0);
  const totalCartoes = cartoes.reduce((acc, cur) => acc + Number(cur.amount || 0), 0);
  const saldo = totalRendas - totalGastos;

  document.getElementById("incomeValue").innerText = formatBRL(totalRendas);
  document.getElementById("expenseValue").innerText = formatBRL(totalGastos);
  document.getElementById("creditValue").innerText = formatBRL(totalCartoes);
  document.getElementById("balanceValue").innerText = formatBRL(saldo);
}

/* ==================================================
   Atalhos da Home — Caminhos corrigidos
================================================== */

// Contas da Casa
document.getElementById("btnExpenses").onclick = () => {
  // Caminho correto: home está em /app/home/ → volta uma pasta → entra em /expenses/
  window.location.href = "../expenses/expenses.html";
};

// Renda
document.getElementById("btnIncome").onclick = () => {
  window.location.href = "../income/income.html";
};

// Porquinho
document.getElementById("btnPiggy").onclick = () => {
  window.location.href = "../piggy/piggy.html";
};

// Cartões
document.getElementById("btnCards").onclick = () => {
  window.location.href = "../cards/cards.html";
};
