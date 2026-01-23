/* ==================================================
   Oria • Contas da Casa (Supabase FINAL)
   BASE VALIDADA COM SEU BANCO
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
let expenses = [];

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

function formatDateBR(iso) {
  if (!iso) return "--";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

/* ========= mês ========= */
function renderMonth() {
  const label = formatMonth(currentDate);
  document.getElementById("monthText").innerText = label;
  document.getElementById("monthLabel").innerText = label;
}

window.changeMonth = (delta) => {
  currentDate.setMonth(currentDate.getMonth() + delta);
  renderMonth();
  loadExpenses();
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

  throw new Error("Usuário sem família vinculada");
}

/* ========= carregar despesas ========= */
async function loadExpenses() {
  await waitSupabase();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  const { data, error } = await supabase
    .from("transactions")
    .select("id, title, amount, date, paid")
    .eq("user_id", user.id)
    .eq("type", "gasto")       // ✅ CORRETO
    .eq("year", year)
    .eq("month", month)
    .order("date", { ascending: true });

  if (error) {
    console.error("[loadExpenses]", error);
    return;
  }

  expenses = data || [];
  renderExpenses();
}

/* ========= render ========= */
function renderExpenses() {
  const list = document.getElementById("expensesList");
  list.innerHTML = "";

  let total = 0;
  let open = 0;

  expenses.forEach((e) => {
    total += Number(e.amount || 0);
    if (!e.paid) open += Number(e.amount || 0);

    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <div class="card-info">
        <strong>${e.title}</strong>
        <span>Vence: ${formatDateBR(e.date)}</span>
      </div>
      <div class="card-right">
        <span class="${e.paid ? "paid" : "open"}">${formatBRL(e.amount)}</span>
        <button class="pay-btn" onclick="togglePaid('${e.id}', ${e.paid})">
          ${e.paid ? "Pago" : "Marcar pago"}
        </button>
      </div>
    `;

    list.appendChild(card);
  });

  document.getElementById("totalValue").innerText = formatBRL(total);
  document.getElementById("openValue").innerText = formatBRL(open);
}

/* ========= modal ========= */
window.openNew = () => {
  document.getElementById("inputName").value = "";
  document.getElementById("inputAmount").value = "";
  document.getElementById("inputDueDate").value = "";
  document.getElementById("modal").style.display = "flex";
};

window.closeModal = () => {
  document.getElementById("modal").style.display = "none";
};

/* ========= salvar ========= */
window.saveExpense = async () => {
  await waitSupabase();

  const title = document.getElementById("inputName").value.trim();
  const amount = Number(document.getElementById("inputAmount").value);
  const date = document.getElementById("inputDueDate").value;

  if (!title || !amount || !date) {
    alert("Preencha todos os campos");
    return;
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    alert("Usuário não autenticado");
    return;
  }

  const familyId = await getFamilyId(user.id);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  const { error } = await supabase
    .from("transactions")
    .insert({
      user_id: user.id,
      family_id: familyId,
      type: "gasto",        // ✅ AQUI ESTAVA O ERRO
      title,
      amount,
      date,
      year,
      month,
      paid: false
    });

  if (error) {
    console.error("[saveExpense]", error);
    alert(error.message);
    return;
  }

  closeModal();
  loadExpenses();
};

/* ========= pago ========= */
window.togglePaid = async (id, paid) => {
  await supabase
    .from("transactions")
    .update({ paid: !paid })
    .eq("id", id);

  loadExpenses();
};

/* ========= init ========= */
renderMonth();
loadExpenses();
