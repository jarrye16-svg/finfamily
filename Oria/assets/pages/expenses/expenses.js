/* ==================================================
   Oria • Contas da Casa
   UI + Supabase REAL
================================================== */

// ===== ESPERA SUPABASE =====
async function waitSupabase() {
  while (!window.__SUPABASE_READY__) {
    await new Promise(r => setTimeout(r, 50));
  }
}

// ===== MESES =====
const MONTHS = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'
];

let currentYear;
let currentMonth;
let familyId;
let expenses = [];
let editingId = null;
let selectedType = 'fixed';

// ===== UTILS =====
function formatMonth(year, month) {
  return `${MONTHS[month]} de ${year}`;
}

function formatBRL(v) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(v);
}

// ===== AUTH / FAMILY / MÊS =====
async function getUser() {
  const { data } = await supabase.auth.getUser();
  return data.user;
}

async function getFamilyId() {
  const user = await getUser();

  const { data } = await supabase
    .from("family_members")
    .select("family_id")
    .eq("user_id", user.id)
    .single();

  return data.family_id;
}

async function getCurrentMonth() {
  const user = await getUser();

  const { data } = await supabase
    .from("user_settings")
    .select("current_year, current_month")
    .eq("user_id", user.id)
    .single();

  return data;
}

async function setCurrentMonth(year, month) {
  const user = await getUser();

  await supabase
    .from("user_settings")
    .update({ current_year: year, current_month: month })
    .eq("user_id", user.id);
}

// ===== MÊS =====
async function renderMonth() {
  const label = formatMonth(currentYear, currentMonth);
  document.getElementById('monthText').innerText = label;
  document.getElementById('monthLabel').innerText = label;
}

async function changeMonth(delta) {
  const newDate = new Date(currentYear, currentMonth + delta);

  await setCurrentMonth(newDate.getFullYear(), newDate.getMonth());

  currentYear = newDate.getFullYear();
  currentMonth = newDate.getMonth();

  await loadExpenses();
}

// ===== CARREGAR DESPESAS =====
async function loadExpenses() {
  const { data } = await supabase
    .from("transactions")
    .select("*")
    .eq("family_id", familyId)
    .eq("type", "expense")
    .eq("year", currentYear)
    .eq("month", currentMonth)
    .order("date", { ascending: true });

  expenses = data || [];
  renderExpenses();
  renderMonth();
}

// ===== RENDER =====
function renderExpenses() {
  const list = document.getElementById('expensesList');
  list.innerHTML = '';

  let total = 0;
  let open = 0;

  expenses.forEach((e) => {
    total += e.amount;
    if (!e.paid) open += e.amount;

    const card = document.createElement('div');
    card.className = 'card';

    card.innerHTML = `
      <div class="card-info">
        <strong>${e.title}</strong>
        <span>Vence: ${e.date || '--'}</span>
      </div>

      <div class="card-right">
        <span class="${e.paid ? 'paid' : 'open'}">
          ${formatBRL(e.amount)}
        </span>
        <button class="pay-btn" onclick="togglePaid('${e.id}')">
          ${e.paid ? 'Pago' : 'Marcar pago'}
        </button>
        <button class="edit-btn" onclick="openEdit('${e.id}')">Editar</button>
      </div>
    `;

    list.appendChild(card);
  });

  document.getElementById('totalValue').innerText = formatBRL(total);
  document.getElementById('openValue').innerText = formatBRL(open);
}

// ===== MODAL =====
function openNew() {
  editingId = null;
  document.getElementById('modalTitle').innerText = 'Nova Conta';
  document.getElementById('inputName').value = '';
  document.getElementById('inputAmount').value = '';
  document.getElementById('inputDueDate').value = '';
  document.getElementById('replicateNext').checked = false;
  document.getElementById('deleteBtn').style.display = 'none';
  setType('fixed');
  openModal();
}

function openEdit(id) {
  editingId = id;
  const e = expenses.find(x => x.id === id);

  document.getElementById('modalTitle').innerText = 'Editar Conta';
  document.getElementById('inputName').value = e.title;
  document.getElementById('inputAmount').value = e.amount;
  document.getElementById('inputDueDate').value = e.date;
  document.getElementById('deleteBtn').style.display = 'block';

  setType(e.type || 'fixed');
  openModal();
}

function openModal() {
  document.getElementById('modal').style.display = 'flex';
}

function closeModal() {
  document.getElementById('modal').style.display = 'none';
}

// ===== TIPO =====
function setType(type) {
  selectedType = type;
  document.querySelectorAll('.type-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.type === type);
  });
  document.getElementById('replicateBox').style.display =
    type === 'fixed' ? 'flex' : 'none';
}

// ===== SALVAR =====
async function saveExpense() {
  const title = document.getElementById('inputName').value.trim();
  const amount = Number(document.getElementById('inputAmount').value);
  const date = document.getElementById('inputDueDate').value;

  if (!title || !amount || !date) return;

  const user = await getUser();

  const payload = {
    user_id: user.id,
    family_id: familyId,
    type: "expense",
    title,
    amount,
    date,
    year: currentYear,
    month: currentMonth,
    paid: false
  };

  if (editingId) {
    await supabase
      .from("transactions")
      .update(payload)
      .eq("id", editingId);
  } else {
    await supabase
      .from("transactions")
      .insert(payload);
  }

  closeModal();
  await loadExpenses();
}

// ===== DELETAR =====
async function deleteExpense() {
  await supabase
    .from("transactions")
    .delete()
    .eq("id", editingId);

  closeModal();
  await loadExpenses();
}

// ===== PAGO =====
async function togglePaid(id) {
  const e = expenses.find(x => x.id === id);

  await supabase
    .from("transactions")
    .update({ paid: !e.paid })
    .eq("id", id);

  await loadExpenses();
}

// ===== INIT =====
async function initExpenses() {
  await waitSupabase();

  familyId = await getFamilyId();
  const settings = await getCurrentMonth();

  currentYear = settings.current_year;
  currentMonth = settings.current_month;

  document.getElementById("prevMonth").onclick = () => changeMonth(-1);
  document.getElementById("nextMonth").onclick = () => changeMonth(1);

  document.getElementById("goHome").onclick = () => {
    window.location.href = "../home/home.html";
  };

  await loadExpenses();
}

initExpenses();
