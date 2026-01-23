/* ==================================================
   Oria • Contas da Casa (Supabase FINAL - base com coluna "data")
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
let expenses = [];

/* ========= utils ========= */
function formatMonth(date) {
  return `${MONTHS[date.getMonth()]} de ${date.getFullYear()}`;
}

function formatBRL(v) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);
}

function formatDateBR(iso) {
  if (!iso) return "--";
  // iso: "2026-01-22"
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
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

/* ========= family (pega a existente) ========= */
async function getFamilyId(userId) {
  // como você já vinculou, deve retornar 1 linha
  const { data, error } = await supabase
    .from("family_members")
    .select("family_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;

  if (data?.family_id) return data.family_id;

  // fallback (se algum usuário novo cair aqui)
  const { data: fam, error: famErr } = await supabase
    .from("families")
    .insert({ name: "Minha Família" })
    .select("id")
    .single();

  if (famErr) throw famErr;

  const { error: memErr } = await supabase
    .from("family_members")
    .insert({ user_id: userId, family_id: fam.id, role: "owner" });

  if (memErr) throw memErr;

  return fam.id;
}

/* ========= carregar despesas ========= */
async function loadExpenses() {
  await waitSupabase();

  const { data: { user }, error: userErr } = await supabase.auth.getUser();
  if (userErr) console.error(userErr);
  if (!user) return;

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1; // 1..12

  const { data, error } = await supabase
    .from("transactions")
    .select("id, title, amount, data, paid, type, year, month")
    .eq("user_id", user.id)
    .eq("type", "expense")
    .eq("year", year)
    .eq("month", month)
    .order("data", { ascending: true }); // ✅ coluna correta é "data"

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
        <strong>${e.title || "-"}</strong>
        <span>Vence: ${formatDateBR(e.data)}</span>
      </div>

      <div class="card-right">
        <span class="${e.paid ? "paid" : "open"}">${formatBRL(e.amount)}</span>
        <button class="pay-btn" onclick="togglePaid('${e.id}', ${e.paid ? "true" : "false"})">
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
  const due = document.getElementById("inputDueDate").value; // yyyy-mm-dd

  if (!title || !amount || !due) {
    alert("Preencha todos os campos.");
    return;
  }

  const { data: { user }, error: userErr } = await supabase.auth.getUser();
  if (userErr) {
    console.error(userErr);
    alert("Erro ao validar usuário.");
    return;
  }
  if (!user) {
    alert("Você precisa estar logado.");
    return;
  }

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  try {
    const familyId = await getFamilyId(user.id);

    const { error } = await supabase
      .from("transactions")
      .insert({
        user_id: user.id,
        family_id: familyId,
        type: "expense",
        title,
        amount,
        data: due,      // ✅ coluna correta
        year,
        month,
        paid: false
      });

    if (error) {
      console.error("[saveExpense insert]", error);
      alert(`Erro ao salvar: ${error.message}`);
      return;
    }

    closeModal();
    loadExpenses();
  } catch (err) {
    console.error("[saveExpense catch]", err);
    alert(`Erro ao salvar: ${err.message || "ver console"}`);
  }
};

/* ========= marcar pago ========= */
window.togglePaid = async (id, paid) => {
  await waitSupabase();

  const { error } = await supabase
    .from("transactions")
    .update({ paid: !paid })
    .eq("id", id);

  if (error) {
    console.error("[togglePaid]", error);
    alert(`Erro ao atualizar: ${error.message}`);
    return;
  }

  loadExpenses();
};

/* ========= init ========= */
renderMonth();
loadExpenses();
