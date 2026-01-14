/* ==================================================
   Oria • Contas da Casa
   UI completa — Supabase entra depois
================================================== */

const MONTHS = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'
];

let currentMonth = new Date();
let selectedType = 'fixed';
let editingIndex = null;

/* mês começa vazio (correto) */
let expenses = [];

/* utils */
function formatMonth(date) {
  return `${MONTHS[date.getMonth()]} de ${date.getFullYear()}`;
}

function formatBRL(v) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(v);
}

/* mês */
function renderMonth() {
  const label = formatMonth(currentMonth);
  document.getElementById('monthText').innerText = label;
  document.getElementById('monthLabel').innerText = label;
}

function changeMonth(delta) {
  currentMonth.setMonth(currentMonth.getMonth() + delta);
  renderMonth();
  renderExpenses();
}

/* render */
function renderExpenses() {
  const list = document.getElementById('expensesList');
  list.innerHTML = '';

  let total = 0;
  let open = 0;

  expenses.forEach((e, i) => {
    total += e.amount;
    if (!e.paid) open += e.amount;

    const card = document.createElement('div');
    card.className = 'card';

    card.innerHTML = `
      <div class="card-info">
        <strong>${e.name}</strong>
        <span>Vence: ${e.dueDate || '--'}</span>
      </div>

      <div class="card-right">
        <span class="${e.paid ? 'paid' : 'open'}">
          ${formatBRL(e.amount)}
        </span>
        <button class="pay-btn" onclick="togglePaid(${i})">
          ${e.paid ? 'Pago' : 'Marcar pago'}
        </button>
        <button class="edit-btn" onclick="openEdit(${i})">Editar</button>
      </div>
    `;

    list.appendChild(card);
  });

  document.getElementById('totalValue').innerText = formatBRL(total);
  document.getElementById('openValue').innerText = formatBRL(open);
}

/* modal */
function openNew() {
  editingIndex = null;
  document.getElementById('modalTitle').innerText = 'Nova Conta';
  document.getElementById('inputName').value = '';
  document.getElementById('inputAmount').value = '';
  document.getElementById('inputDueDate').value = '';
  document.getElementById('replicateNext').checked = false;
  document.getElementById('deleteBtn').style.display = 'none';
  openModal();
}

function openEdit(index) {
  editingIndex = index;
  const e = expenses[index];

  document.getElementById('modalTitle').innerText = 'Editar Conta';
  document.getElementById('inputName').value = e.name;
  document.getElementById('inputAmount').value = e.amount;
  document.getElementById('inputDueDate').value = e.dueDate;
  document.getElementById('deleteBtn').style.display = 'block';

  setType(e.type);
  openModal();
}

function openModal() {
  document.getElementById('modal').style.display = 'flex';
}

function closeModal() {
  document.getElementById('modal').style.display = 'none';
}

/* tipo */
function setType(type) {
  selectedType = type;
  document.querySelectorAll('.type-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.type === type);
  });
  document.getElementById('replicateBox').style.display =
    type === 'fixed' ? 'flex' : 'none';
}

document.querySelectorAll('.type
