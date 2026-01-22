// ===============================
// ORIA • HOME (SUPABASE REAL)
// ===============================

// ===== ESPERA SUPABASE =====
async function waitSupabase() {
  while (!window.__SUPABASE_READY__) {
    await new Promise(r => setTimeout(r, 50));
  }
}

// ===== MESES =====
const monthNames = [
  "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
  "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"
];

const currentMonthEl = document.getElementById("currentMonth");

// ===== AUTH =====
async function getUser() {
  const { data } = await supabase.auth.getUser();
  return data.user;
}

// ===== FAMILY =====
async function getFamilyId() {
  const user = await getUser();

  const { data } = await supabase
    .from("family_members")
    .select("family_id")
    .eq("user_id", user.id)
    .single();

  return data.family_id;
}

// ===== MÊS ATIVO =====
async function getCurrentMonth() {
  const user = await getUser();

  let { data } = await supabase
    .from("user_settings")
    .select("current_year, current_month")
    .eq("user_id", user.id)
    .single();

  if (!data) {
    const now = new Date();

    const { data: created } = await supabase
      .from("user_settings")
      .insert({
        user_id: user.id,
        current_year: now.getFullYear(),
        current_month: now.getMonth()
      })
      .select()
      .single();

    return created;
  }

  return data;
}

async function setCurrentMonth(year, month) {
  const user = await getUser();

  await supabase
    .from("user_settings")
    .update({
      current_year: year,
      current_month: month
    })
    .eq("user_id", user.id);
}

// ===== ATUALIZA HOME =====
async function refreshHome() {
  const familyId = await getFamilyId();
  const { current_year, current_month } = await getCurrentMonth();

  currentMonthEl.textContent =
    `${monthNames[current_month]} de ${current_year}`;

  const { data } = await supabase
    .from("transactions")
    .select("amount, type")
    .eq("family_id", familyId)
    .eq("year", current_year)
    .eq("month", current_month);

  const sum = (type) =>
    (data || [])
      .filter(t => t.type === type)
      .reduce((s, i) => s + Number(i.amount), 0);

  const income = sum("income");
  const expense = sum("expense");
  const cards = sum("card");
  const balance = income - expense - cards;

  document.getElementById("incomeValue").textContent =
    income.toLocaleString("pt-BR",{style:"currency",currency:"BRL"});

  document.getElementById("expenseValue").textContent =
    expense.toLocaleString("pt-BR",{style:"currency",currency:"BRL"});

  document.getElementById("creditValue").textContent =
    cards.toLocaleString("pt-BR",{style:"currency",currency:"BRL"});

  const balanceEl = document.getElementById("balanceValue");
  balanceEl.textContent =
    balance.toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
  balanceEl.style.color = balance >= 0 ? "#16a34a" : "#dc2626";
}

// ===== TROCA DE MÊS =====
async function changeMonth(direction) {
  const { current_year, current_month } = await getCurrentMonth();

  const newDate = new Date(current_year, current_month + direction);

  await setCurrentMonth(
    newDate.getFullYear(),
    newDate.getMonth()
  );

  refreshHome();
}

// ===== NAVEGAÇÃO =====
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

// ===== INIT =====
async function initHome() {
  await waitSupabase();
  await refreshHome();

  document.getElementById("prevMonth").onclick = () => changeMonth(-1);
  document.getElementById("nextMonth").onclick = () => changeMonth(1);
}

initHome();
