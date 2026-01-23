/* ==================================================
   Oria • Home (Resumo geral integrado com Supabase)
   Exibe valores reais da tabela "transactions"
================================================== */

/* ===== Aguarda Supabase carregar ===== */
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

/* ===== Constantes e utilitários ===== */
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

/* ===== Renderização do mês ===== */
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

/* ==================================================
   🔄 Carrega resumo financeiro do mês atual
================================================== */
async function carregarResumo() {
  await waitSupabase();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  // 🔍 Busca todas as transações do usuário no mês
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

  // 🧮 Calcula totais
  const gastos = data.filter(t => t.type === "gasto");
  const rendas = data.filter(t => t.type === "renda");
  const cartoes = data.filter(t => t.type === "cartao");

  const totalGastos = gastos.reduce((acc, cur) => acc + Number(cur.amount || 0), 0);
  const totalRendas = rendas.reduce((acc, cur) => acc + Number(cur.amount || 0), 0);
  const totalCartoes = cartoes.reduce((acc, cur) => acc + Number(cur.amount || 0), 0);
  const saldo = totalRendas - totalGastos;

  // 🧾 Exibe na tela
  document.getElementById("incomeValue").innerText = formatBRL(totalRendas);
  document.getElementById("expenseValue").innerText = formatBRL(totalGastos);
  document.getElementById("creditValue").innerText = formatBRL(totalCartoes);
  document.getElementById("balanceValue").innerText = formatBRL(saldo);

  console.log("[Resumo carregado]", { totalGastos, totalRendas, totalCartoes, saldo });
}

/* ==================================================
   ⚡ Atalhos de navegação (caminhos corretos)
================================================== */

// Contas da Casa
document.getElementById("btnExpenses").onclick = () => {
  window.location.href = "../../expenses/expenses.html";
};

// Renda
document.getElementById("btnIncome").onclick = () => {
  window.location.href = "../../income/income.html";
};

// Porquinho
document.getElementById("btnPiggy").onclick = () => {
  window.location.href = "../../piggy/piggy.html";
};

// Cartões
document.getElementById("btnCards").onclick = () => {
  window.location.href = "../../cards/cards.html";
};
