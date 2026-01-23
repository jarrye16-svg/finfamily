/* ==================================================
   Oria • Home (Resumo geral integrado com Supabase)
   Atualizado: Janeiro/2026
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

/* ===== Eventos de navegação de mês ===== */
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
   Função principal — Carrega resumo financeiro
================================================== */
async function carregarResumo() {
  await waitSupabase();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  // === Busca todas as transações do mês ===
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
    console.log("Nenhuma transação encontrada para o mês atual.");
    document.getElementById("incomeValue").innerText = "R$ 0,00";
    document.getElementById("expenseValue").innerText = "R$ 0,00";
    document.getElementById("creditValue").innerText = "R$ 0,00";
    document.getElementById("balanceValue").innerText = "R$ 0,00";
    return;
  }

  // === Filtra por tipo ===
  const gastos = data.filter(t => t.type === "gasto");
  const rendas = data.filter(t => t.type === "renda");
  const cartoes = data.filter(t => t.type === "cartao");

  // === Calcula totais ===
  const totalGastos = gastos.reduce((acc, cur) => acc + Number(cur.amount || 0), 0);
  const totalRendas = rendas.reduce((acc, cur) => acc + Number(cur.amount || 0), 0);
  const totalCartoes = cartoes.reduce((acc, cur) => acc + Number(cur.amount || 0), 0);
  const saldo = totalRendas - totalGastos;

  // === Atualiza valores na tela ===
  document.getElementById("incomeValue").innerText = formatBRL(totalRendas);
  document.getElementById("expenseValue").innerText = formatBRL(totalGastos);
  document.getElementById("creditValue").innerText = formatBRL(totalCartoes);
  document.getElementById("balanceValue").innerText = formatBRL(saldo);
}

/* ==================================================
   Atalhos da Home
================================================== */
document.getElementById("btnExpenses").onclick = () => {
  window.location.href = "../../../assets/pages/expenses/expenses.html";
};

document.getElementById("btnIncome").onclick = () => {
  alert("Página de Renda ainda não configurada.");
};

document.getElementById("btnPiggy").onclick = () => {
  alert("Página do Porquinho ainda não configurada.");
};

document.getElementById("btnCards").onclick = () => {
  alert("Página de Cartões ainda não configurada.");
};
