/* ==================================================
   Oria • Home / Visão Geral (Supabase FINAL)
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
  document.getElementById("monthLabel").innerText = formatMonth(currentDate);
}

window.changeMonth = (delta) => {
  currentDate.setMonth(currentDate.getMonth() + delta);
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
  if (data?.family_id) return data.family_id;

  throw new Error("Família não encontrada");
}

/* ========= carregar resumo ========= */
async function loadSummary() {
  await waitSupabase();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  const familyId = await getFamilyId(user.id);

  const { data, error } = await supabase
    .from("transactions")
    .select("amount, type")
    .eq("family_id", familyId)
    .eq("year", year)
    .eq("month", month);

  if (error) {
    console.error("[home loadSummary]", error);
    return;
  }

  let income = 0;
  let expense = 0;

  data.forEach((t) => {
    if (t.type === "entrada") income += Number(t.amount || 0);
    if (t.type === "gasto") expense += Number(t.amount || 0);
  });

  const balance = income - expense;

  document.getElementById("incomeValue").innerText = formatBRL(income);
  document.getElementById("expenseValue").innerText = formatBRL(expense);
  document.getElementById("balanceValue").innerText = formatBRL(balance);
  document.getElementById("cardValue").innerText = formatBRL(0);
}

/* ========= init ========= */
renderMonth();
loadSummary();
