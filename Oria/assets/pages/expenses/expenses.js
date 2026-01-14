/* ======================================
   Oria • Contas da Casa
   UI only — Supabase entra depois
====================================== */

const MONTHS = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'
];

let currentMonth = new Date();
let editingIndex = null;

let expenses = [
  { name: 'Aluguel', amount: 1800, type: 'fixed' },
  { name: 'Internet', amount: 129.9, type: 'fixed' },
  { name: 'Energia Elétrica', amount: 320, type: 'one' }
];

function formatBRL(v) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(v);
}

function renderMonth() {
  document.getElementById('monthText').innerText =
    `${MONTHS[currentMonth.getMonth()]} de ${currentMonth.getFullYear()}`;
}

function changeMonth(delta) {
  currentMonth.setMonth(currentMonth.getMonth() + delta);
  renderMonth();
  renderExpenses();
}

function renderExpenses() {
  const fixed = document.getElementById('fixedList');
  const one = document.getElementById('oneTimeList');
  fixed.innerHTML = '';
  one.innerHTML = '';

  expenses.forEach((e, i) => {
    const card = document.createElement('div');
    card.className = 'card';

    card.innerHTML = `
      <div class="card-info">
        <strong>${e.name}</strong>
        <span>${formatBRL(e.amount)}</span>
      </div>
      <div class="card-actions">
        <button class="edit-btn" onclick="openEdit(${i})">Editar</button>
      </div>
    `;

    (e.type === 'fixed' ? fixed : one).appendChild(card);
  });
}

/* MODAL */
function openEdit(index) {
  editingIndex = index;
  const e = expenses[index];

  document.getElementById('modalTitle').innerText = 'Editar conta';
  document.getElementById('inputName').value = e.name;
  document.getElementById('inputAmount').value = e.amount;
  document.getElementById('inputType').value = e.type;
  document.getElementById('deleteBtn').style.display = 'block';

  openModal();
}

function openNew() {
  editingIndex = null;
  document.getElementById('modalTitle').innerText = 'Nova conta';
  document.getElementById('inputName').value = '';
  document.getElementById('inputAmount').value = '';
  document.getElementById('inputType').value = 'fixed';
  document.getElementById('deleteBtn').style.display = 'none';

  openModal();
}

function openModal() {
  document.getElementById('modal').style.display = 'flex';
}

function closeModal() {
  document.getElementById('modal').style.display = 'none';
}

function saveExpense() {
  const name = document.getElementById('inputName').value;
  const amount = Number(document.getElementById('inputAmount').value);
  const type = document.getElementById('inputType').value;

  if (editingIndex === null) {
    expenses.push({ name, amount, type });
  } else {
    expenses[editingIndex] = { name, amount, type };
  }

  closeModal();
  renderExpenses();
}

function deleteExpense() {
  expenses.splice(editingIndex, 1);
  closeModal();
  renderExpenses();
}

/* EVENTS */
document.getElementById('addBtn').onclick = openNew;
document.getElementById('prevMonth').onclick = () => changeMonth(-1);
document.getElementById('nextMonth').onclick = () => changeMonth(1);

/* INIT */
renderMonth();
renderExpenses();
