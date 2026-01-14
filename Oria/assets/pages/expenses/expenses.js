/* ======================================
   Oria • Contas da Casa (UI)
   Month é estado central
   ====================================== */

const MONTHS = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'
];

let currentMonth = new Date();

let expenses = [
  { name: 'Aluguel', amount: 1800, type: 'fixed', paid: true },
  { name: 'Internet', amount: 129.9, type: 'fixed', paid: false },
  { name: 'Energia Elétrica', amount: 320, type: 'one', paid: false }
];

function formatBRL(v) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(v);
}

function renderMonth() {
  const text = `${MONTHS[currentMonth.getMonth()]} de ${currentMonth.getFullYear()}`;
  document.getElementById('monthText').innerText = text;
  document.getElementById('monthLabel').innerText = text;
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

  expenses.forEach((e, index) => {
    const card = document.createElement('div');
    card.className = 'card';

    card.innerHTML = `
      <div class="card-info">
        <strong contenteditable="true"
          onblur="updateName(${index}, this.innerText)">
          ${e.name}
        </strong>
        <span contenteditable="true"
          onblur="updateAmount(${index}, this.innerText)">
          ${formatBRL(e.amount)}
        </span>
      </div>
      <div class="status ${e.paid ? 'paid' : ''}"
        onclick="togglePaid(${index})"></div>
    `;

    (e.type === 'fixed' ? fixed : one).appendChild(card);
  });
}

function updateName(i, value) {
  expenses[i].name = value.trim();
}

function updateAmount(i, value) {
  const n = Number(value.replace(/[^\d,]/g,'').replace(',','.'));
  if (!isNaN(n)) expenses[i].amount = n;
  renderExpenses();
}

function togglePaid(i) {
  expenses[i].paid = !expenses[i].paid;
  renderExpenses();
}

document.getElementById('addBtn').onclick = () => {
  expenses.push({ name: 'Nova conta', amount: 0, type: 'fixed', paid: false });
  renderExpenses();
};

document.getElementById('prevMonth').onclick = () => changeMonth(-1);
document.getElementById('nextMonth').onclick = () => changeMonth(1);

// INIT
renderMonth();
renderExpenses();
