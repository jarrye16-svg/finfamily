/* ==================================================
   Oria • Home (Supabase FINAL)
   Copiar e substituir o arquivo inteiro
================================================== */

/* ========= garantia supabase ========= */
async function waitSupabase() {
  return new Promise((resolve) => {
    const t = setInterval(() => {
      if (window.supabase) {
        clearInterval(t);
        resolve();
      }
    }, 50);
  });
}

/* ========= constantes ========= */
const MONTHS = [
  "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
  "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"
];

let currentDate = new Date();

/* ========= utils ========= */
function formatMonth(date) {
  return `${MONTHS[date.getMonth()]} de ${date.getFullYear()}`;
}

function formatBRL(v) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(v || 0);
}

/* ========= mês ========= */
function renderMonth() {
  document.getElementById("currentMonth").innerText =
    formatMonth(currentDate);
}

window.changeMonth = (delta) => {
  currentDate.setMonth(currentDate.getMonth() + delta);
  renderMonth();
  loadHomeData();
};

/* ========= carregar dados ========= */
async function loadHomeData() {
  await waitSupabase();

  const { data: { user }, error: userErr } = await supabase.auth.getUser();
  if (userErr || !user) return;

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  const { data, error } = await supabase
    .from("transactions")
    .select("type, amount, paid")
    .eq("user_id", user.id)
    .eq("year", year)
    .eq("month", month);

  if (error) {
    console.error("[home load]", error);
    return;
  }

  let entrada = 0;
  let saida = 0;
  let cartoes = 0;

  data.forEach(t => {
    const value = Number(t.amount || 0);

    if (t.type === "entrada") entrada += value;
    if (t.type === "gasto") saida += value;
    if (t.type === "cartao") cartoes += value;
  });

  const saldo = entrada - saida - cartoes;

  /* ========= UI ========= */
  document.getElementById("incomeValue").innerText = formatBRL(entrada);
  document.getElementById("expenseValue").innerText = formatBRL(saida);
  document.getElementById("creditValue").innerText = formatBRL(cartoes);

  const balanceEl = document.getElementById("balanceValue");
  balanceEl.innerText = formatBRL(saldo);
  balanceEl.style.color = saldo >= 0 ? "#16a34a" : "#dc2626";
}

/* ========= navegação ========= */
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

/* ========= init ========= */
renderMonth();
loadHomeData();
