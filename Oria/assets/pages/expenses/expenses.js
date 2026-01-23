/* ==================================================
   Oria • Contas da Casa (SUPABASE FINAL CORRETO)
================================================== */

/* ===== garante que o supabase carregou ===== */
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

/* ===== constantes ===== */
const MONTHS = [
  "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
  "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"
];

let currentDate = new Date();
let expenses = [];

/* ===== utils ===== */
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

/* ===== mês ===== */
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

/* ===== family ===== */
async function getFamilyId(userId) {
  const { data, error } = await supabase
    .from("family_members")
    .select("family_id")
    .eq("user_id", userId)
    .single();

  if (error) throw error;
  return data.family_id;
}

/* ===== carregar despesas ===== */
async function loadExpenses() {
  await waitSupabase();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .eq("user_id", user.id)
    .eq("type", "gasto")        // ✅ correto
    .eq("year", year)
    .eq("month", month)
    .order("date", { ascending: true }); // ✅ correto

  if (error) {
    console.error("[loadExpenses]", error);
    return;
  }

  expenses = data || [];
  renderExpenses();
}

/* ===== render ===== */
function renderExpenses() {
  const list = document.getElementById("expensesList");
  list.innerHTML = "";

  let total = 0;
  let open = 0;

  expenses.forEach((e) => {
    total += Number(e.amount);
    if (!e.paid) open += Number(e.amount);

    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <div class="card-info">
        <strong>${e.title}</strong>
        <span>Vence: ${formatDateBR(e.date)}</span>
      </div>

      <div class="card-right">
        <span class="${e.paid ? "paid" : "open"}">
          ${formatBRL(e.amount)}
        </span>
        <button class="pay-btn"
          onclick="togglePaid('${e.id}', ${e.paid})">
          ${e.paid ? "Pago" : "Marcar pago"}
        </button>
      </div>
    `;

    list.appendChild(card);
  });

  document.getElementById("totalValue").innerText = formatBRL(total);
  document.getElementById("openValue").innerText = formatBRL(open);
}

/* ===== modal ===== */
window.openNew = () => {
  inputName.value = "";
  inputAmount.value = "";
  inputDueDate.value = "";
  modal.style.display = "flex";
};

window.closeModal = () => {
  modal.style.display = "none";
};

/* ===== salvar ===== */
window.saveExpense = async () => {
  await waitSupabase();

  const title = inputName.value.trim();
  const amount = Number(inputAmount.value);
  const date = inputDueDate.value;

  if (!title || !amount || !date) {
    alert("Preencha todos os campos");
    return;
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    alert("Usuário não autenticado");
    return;
  }

  try {
    const familyId = await getFamilyId(user.id);

    const { error } = await supabase
      .from("transactions")
      .insert({
        user_id: user.id,
        family_id: familyId,
        type: "gasto",     // ✅ OBRIGATÓRIO
        title,
        amount,
        date,              // ✅ coluna correta
        year: currentDate.getFullYear(),
        month: currentDate.getMonth() + 1,
        paid: false
      });

    if (error) throw error;

    closeModal();
    loadExpenses();
  } catch (err) {
    console.error("[saveExpense]", err);
    alert(err.message);
  }
};

/* ===== pago ===== */
window.togglePaid = async (id, paid) => {
  await waitSupabase();

  const { error } = await supabase
    .from("transactions")
    .update({ paid: !paid })
    .eq("id", id);

  if (error) {
    alert(error.message);
    return;
  }

  loadExpenses();
};

/* ===== init ===== */
renderMonth();
loadExpenses();
