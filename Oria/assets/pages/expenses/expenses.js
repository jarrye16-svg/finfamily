/* ==================================================
   Oria • Contas da Casa (FINAL • Supabase)
   Copiar e substituir o arquivo inteiro
================================================== */

/* ===============================
   Constantes
================================ */
const MONTHS = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'
];

let currentDate = new Date();
let expenses = [];

/* ===============================
   Utils
================================ */
function formatMonth(date) {
  return `${MONTHS[date.getMonth()]} de ${date.getFullYear()}`;
}

function formatBRL(value) {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
}

/* ===============================
   Mês
================================ */
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

/* ===============================
   Carregar despesas (Supabase)
================================ */
async function loadExpenses() {
  await waitSupabase();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.warn('[Oria] Usuário não autenticado');
    return;
  }

  const { data: settings, error: settingsErr } = await supabase
    .from('user_settings')
    .select('current_year, current_month')
    .eq('user_id', user.id)
    .single();

  if (settingsErr || !settings) {
    console.error('[Oria] user_settings não encontrado', settingsErr);
    return;
  }

  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', user.id)
    .eq('type', 'expense')
    .eq('year', settings.current_year)
    .eq('month', settings.current_month)
    .order('date', { ascending: true });

  if (error) {
    console.error('[Oria] Erro ao carregar despesas', error);
    return;
  }

  expenses = data || [];
  renderExpenses();
}

/* ===============================
   Render
================================ */
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

/* ===============================
   Salvar nova conta
================================ */
async function saveExpense() {
  await waitSupabase();

  const title = document.getElementById('inputName').value.trim();
  const amount = Number(document.getElementById('inputAmount').value);
  const date = document.getElementById('inputDueDate').value;

  if (!title || !amount || !date) {
    alert('Preencha todos os campos');
    return;
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    alert('Usuário não autenticado');
    return;
  }

  const { data: family, error: famErr } = await supabase
    .from('family_members')
    .select('family_id')
    .eq('user_id', user.id)
    .single();

  if (famErr || !family) {
    alert('Família não encontrada');
    console.error(famErr);
    return;
  }

  const { data: settings, error: setErr } = await supabase
    .from('user_settings')
    .select('current_year, current_month')
    .eq('user_id', user.id)
    .single();

  if (setErr || !settings) {
    alert('Configuração de mês não encontrada');
    console.error(setErr);
    return;
  }

  const { error } = await supabase
    .from('transactions')
    .insert({
      user_id: user.id,
      family_id: family.family_id,
      type: 'expense',
      title,
      amount,
      date,
      year: settings.current_year,
      month: settings.current_month,
      paid: false
    });

  if (error) {
    console.error('[Oria] Erro ao salvar', error);
    alert('Erro ao salvar conta');
    return;
  }

  closeModal();
  loadExpenses();
}

/* ===============================
   Marcar pago
================================ */
async function togglePaid(id, paid) {
  await waitSupabase();

  const { error } = await supabase
    .from('transactions')
    .update({ paid: !paid })
    .eq('id', id);

  if (error) {
    console.error('[Oria] Erro ao atualizar pagamento', error);
    return;
  }

  loadExpenses();
}

/* ===============================
   Modal
================================ */
function openNew() {
  document.getElementById('inputName').value = '';
  document.getElementById('inputAmount').value = '';
  document.getElementById('inputDueDate').value = '';
  document.getElementById('modal').style.display = 'flex';
}

function closeModal() {
  document.getElementById('modal').style.display = 'none';
}

/* ===============================
   Init
================================ */
renderMonth();
loadExpenses();
