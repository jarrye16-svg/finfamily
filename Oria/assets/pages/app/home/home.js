/* ==================================================
   Oria • Home (Resumo geral integrado com Supabase)
================================================== */

/* ===== aguarda Supabase ===== */
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

/* ===== meses ===== */
const MONTHS = [
  "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
  "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"
];

let currentDate = new Date();

/* ===== formatadores ===== */
function formatBRL(v) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(v || 0);
}

function formatMonth(date) {
  return `${MONTHS[date.getMonth()]} de ${date.getFullYear()}`;
}

/* ===== renderiza cabeçalho de mês ===== */
function renderMonth() {
  const label = formatMonth(currentDate);
  document.getElementById("currentMonth").innerText = label;
}

window.addEventListener("DOMContentLoaded", () => {
  renderMonth();
  carregarResumo();
});

/* ===== navegação de mês ===== */
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

/* ===== carregar resumo ===== */
async function carregarResumo() {
  await waitSupabase();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  // === Busca transações do mês atual ===
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

  // === Separa por tipo ===
  const gastos = data.filter(i => i.type === "gasto");
  const rendas = data.filter(i => i.type === "renda"); // caso existam rendas
  const cartoes = data.filter(i => i.type === "cartao"); // se futuramente usar cartões

  // === Calcula totais ===
  const totalGastos = gastos.reduce((acc, cur) => acc + Number(cur.amount || 0), 0);
  const totalRendas = rendas.reduce((acc, cur) => acc + Number(cur.amount || 0), 0);
  const totalCartoes = cartoes.reduce((acc, cur) => acc + Number(cur.amount || 0), 0);
  const saldo = totalRendas - totalGastos;

  // === Atualiza no HTML ===
  document.getElementById("incomeValue").innerText = formatBRL(totalRendas);
  document.getElementById("expenseValue").innerText = formatBRL(totalGastos);
  document.getElementById("creditValue").innerText = formatBRL(totalCartoes);
  document.getElementById("balanceValue").innerText = formatBRL(saldo);
}

/* ===== atalhos de navegação ===== */
document.getElementById("btnExpenses").onclick = () => {
  window.location.href = "../../../assets/pages/expenses/expenses.html";
};
document.getElementById("btnIncome").onclick = () => {
  alert("Página de renda ainda não configurada.");
};
document.getElementById("btnPiggy").onclick = () => {
  alert("Página do porquinho ainda não configurada.");
};
document.getElementById("btnCards").onclick = () => {
  alert("Página de cartões ainda não configurada.");
};
