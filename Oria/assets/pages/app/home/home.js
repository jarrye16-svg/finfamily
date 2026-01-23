/* ==================================================
   Oria • Home (Supabase FINAL)
   Copiar e substituir o arquivo inteiro
================================================== */

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
  document.getElementById("monthLabel").innerText = formatMonth(currentDate);
}

document.getElementById("prevMonth").onclick = () => {
  currentDate.setMonth(currentDate.getMonth() - 1);
  renderMonth();
  loadSummary();
};

document.getElementById("nextMonth").onclick = () => {
  currentDate.setMonth(currentDate.getMonth() + 1);
  renderMonth();
  loadSummary();
};

/* ========= family ========= */
async function getFamilyId(userId) {
  const { data, error } = await supabase
    .from("family_members")
    .select("family_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error("Família não encontrada");

  return data.family_id;
}

/* ========= resumo ========= */
async function loadSummary() {
  await waitSupabase();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const familyId = await getFamilyId(user.id);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  const { data, error } = await supabase
    .from("transactions")
    .select("amount, type")
    .eq("family_id", familyId)
    .eq("year", year)
    .eq("month", month);

  if (error) {
    console.error(error);
    return;
  }

  let income = 0;
  let expense = 0;

  data.forEach(t => {
    if (t.type === "entrada") income += Number(t.amount || 0);
    if (t.type === "gasto") expense += Number(t.amount || 0);
  });

  document.getElementById("incomeValue").innerText = formatBRL(income);
  document.getElementById("expenseValue").innerText = formatBRL(expense);
  document.getElementById("balanceValue").innerText = formatBRL(income - expense);
  document.getElementById("cardValue").innerText = formatBRL(0);
}

/* ========= init ========= */
renderMonth();
loadSummary();
