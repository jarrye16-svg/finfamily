/* ==================================================
   Oria • Contas da Casa
   Supabase FINAL — com auto-family
================================================== */

/* ---------- Espera Supabase ---------- */
async function waitSupabase() {
  return new Promise(resolve => {
    const check = () => {
      if (window.supabase) return resolve();
      setTimeout(check, 50);
    };
    check();
  });
}

/* ---------- Constantes ---------- */
const MONTHS = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'
];

let currentDate = new Date();
let expenses = [];

/* ---------- Utils ---------- */
function formatMonth(date) {
  return `${MONTHS[date.getMonth()]} de ${date.getFullYear()}`;
}

function formatBRL(v) {
  return v.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
}

/* ---------- Mês ---------- */
function renderMonth() {
  const label = formatMonth(currentDate);
  document.getElementById('monthText').innerText = label;
  document.getElementById('monthLabel').innerText = label;
}

function changeMonth(delta) {
  currentDate.setMonth(currentDate.getMonth() + delta);
  renderMonth();
  loadExpenses();
}

/* ==================================================
   🔥 GARANTE FAMÍLIA (CORREÇÃO DEFINITIVA)
================================================== */
async function getOrCreateFamily(userId) {
  // tenta achar família
  let { data: member } = await supabase
    .from('family_members')
    .select('family_id')
    .eq('user_id', userId)
    .single();

  if (member) return member.family_id;

  // cria família
  const { data: family, error: famErr } = await supabase
    .from('families')
    .insert({ name: 'Minha Família' })
    .select()
    .single();

  if (famErr) {
    alert('Erro ao criar família');
    throw famErr;
  }

  // vincula usuário
  await supabase.from('family_members').insert({
    user_id: userId,
    family_id: family.id,
    role: 'owner'
  });

  return family.id;
}

/* ---------- Carregar despesas ---------- */
async function loadExpenses() {
  await waitSupabase();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const familyId = await getOrCreateFamily(user.id);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('family_id', familyId)
    .eq('type', 'expense')
    .eq('year', year)
    .eq('month', month)
    .order('date');

  if (error) {
    console.error(error);
    return;
  }

  expenses = data || [];
  renderExpenses();
}

/* ---------- Render ---------- */
function renderExpenses() {
  const list = document.getElementById('expensesList');
  list.innerHTML = '';

  let total = 0;
  let open = 0;

  expenses.forEach(e => {
    total += e.amount;
    if (!e.paid) open += e.amount;

    const card = document.createElement('div');
    card.className = 'card';

    card.innerHTML = `
      <div class="card-info">
        <strong>${e.title}</strong>
        <span>Vence: ${e.date}</span>
      </div>
      <div class="card-right">
        <span class="${e.paid ? 'paid' : 'open'}">
          ${formatBRL(e.amount)}
        </span>
        <button onclick="togglePaid('${e.id}', ${e.paid})">
          ${e.paid ? 'Pago' : 'Marcar pago'}
        </button>
      </div>
    `;

    list.appendChild(card);
  });

  document.getElementById('totalValue').innerText = formatBRL(total);
  document.getElementById('openValue').innerText = formatBRL(open);
}

/* ---------- Salvar ---------- */
async function saveExpense() {
  await waitSupabase();

  const title = inputName.value.trim();
  const amount = Number(inputAmount.value);
  const date = inputDueDate.value;

  if (!title || !amount || !date) {
    alert('Preencha tudo');
    return;
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const familyId = await getOrCreateFamily(user.id);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  const { error } = await supabase.from('transactions').insert({
    user_id: user.id,
    family_id: familyId,
    type: 'expense',
    title,
    amount,
    date,
    year,
    month,
    paid: false
  });

  if (error) {
    console.error(error);
    alert('Erro ao salvar');
    return;
  }

  closeModal();
  loadExpenses();
}

/* ---------- Pago ---------- */
async function togglePaid(id, paid) {
  await waitSupabase();
  await supabase
    .from('transactions')
    .update({ paid: !paid })
    .eq('id', id);
  loadExpenses();
}

/* ---------- Modal ---------- */
function openNew() {
  inputName.value = '';
  inputAmount.value = '';
  inputDueDate.value = '';
  modal.style.display = 'flex';
}

function closeModal() {
  modal.style.display = 'none';
}

/* ---------- Init ---------- */
renderMonth();
loadExpenses();
