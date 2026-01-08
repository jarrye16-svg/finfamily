/* ============================================
   FinFamily - Versão Supabase (Auth + RLS + Realtime)
   ============================================ */

// Supabase Configuration
const SUPABASE_URL = 'https://gelhizmssqlexlxkvufc.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_AstKmfIU-pBBXXfPDlw9HA_hQYfLqcb';

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Global state
let currentUser = null;
let currentMonth = new Date();
let activeTab = 'home';
let incomes = [];
let expenses = [];
let fixedExpenses = [];
let confirmCallback = null;

/* ============================================
   Utility Functions
   ============================================ */

function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

function parseAmount(str) {
  return parseFloat(str.replace(',', '.')) || 0;
}

function getMonthKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/* ============================================
   Authentication
   ============================================ */

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePassword(password) {
  return password && password.length >= 6;
}

async function register(name, email, password, confirmPassword) {
  if (!name || !email || !password || !confirmPassword) {
    return showToast('Preencha todos os campos', 'error');
  }
  if (!validateEmail(email)) return showToast('E-mail inválido', 'error');
  if (!validatePassword(password)) return showToast('Senha muito curta', 'error');
  if (password !== confirmPassword) return showToast('As senhas não coincidem', 'error');

  const { data, error } = await supabase.auth.signUp({
    email: email.trim().toLowerCase(),
    password,
    options: { data: { name: name.trim() } }
  });
  if (error) return showToast(error.message, 'error');

  await supabase.from('profiles').upsert({ id: data.user.id, name });
  showToast('Conta criada com sucesso!', 'success');
}

async function login(email, password) {
  if (!email || !password) return showToast('Preencha todos os campos', 'error');
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password
  });
  if (error) return showToast('E-mail ou senha incorretos', 'error');

  currentUser = data.user;
  await loadDataFromSupabase();
  showMainApp();
  showToast(`Bem-vindo, ${currentUser.user_metadata?.name || 'usuário'}!`, 'success');
}

async function logout() {
  await supabase.auth.signOut();
  currentUser = null;
  incomes = [];
  expenses = [];
  fixedExpenses = [];
  activeTab = 'home';
  showLoginScreen();
  showToast('Você saiu da conta', 'info');
}

async function updateProfile(name, email) {
  if (!currentUser) return;
  if (!validateEmail(email)) return showToast('E-mail inválido', 'error');
  const { data, error } = await supabase.auth.updateUser({
    email,
    data: { name }
  });
  if (error) return showToast('Erro ao atualizar perfil', 'error');

  await supabase.from('profiles').upsert({ id: data.user.id, name });
  currentUser = data.user;
  showToast('Perfil atualizado!', 'success');
}

async function changePassword(newPassword, confirmPassword) {
  if (!validatePassword(newPassword)) return showToast('Senha muito curta', 'error');
  if (newPassword !== confirmPassword) return showToast('As senhas não coincidem', 'error');

  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) return showToast('Erro ao alterar senha', 'error');
  showToast('Senha alterada com sucesso!', 'success');
}

/* ============================================
   Initialization
   ============================================ */

async function init() {
  supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_IN' && session?.user) {
      currentUser = session.user;
      await loadDataFromSupabase();
      showMainApp();
    } else if (event === 'SIGNED_OUT') {
      currentUser = null;
      incomes = [];
      expenses = [];
      fixedExpenses = [];
      showLoginScreen();
    }
  });

  const { data: { session } } = await supabase.auth.getSession();
  if (session?.user) {
    currentUser = session.user;
    await loadDataFromSupabase();
    showMainApp();
  } else {
    showLoginScreen();
  }
}

document.addEventListener('DOMContentLoaded', init);

/* ============================================
   Supabase Data & Realtime
   ============================================ */

async function loadDataFromSupabase() {
  if (!currentUser) return;

  try {
    const [incomeRes, expenseRes, fixedRes] = await Promise.all([
      supabase.from('incomes').select('*').eq('user_id', currentUser.id).order('date', { ascending: false }),
      supabase.from('expenses').select('*').eq('user_id', currentUser.id).order('date', { ascending: false }),
      supabase.from('fixed_expenses').select('*').eq('user_id', currentUser.id).order('created_at', { ascending: false })
    ]);

    incomes = incomeRes.data || [];
    expenses = expenseRes.data || [];
    fixedExpenses = fixedRes.data || [];

    setupRealtimeListeners();
    render();
  } catch (error) {
    console.error('Erro ao carregar dados:', error);
    showToast('Erro ao carregar dados', 'error');
  }
}

async function addIncome(income) {
  if (!currentUser) return;
  const { error } = await supabase.from('incomes').insert([{ ...income, user_id: currentUser.id }]);
  if (error) showToast('Erro ao adicionar renda', 'error');
}

async function deleteIncome(id) {
  if (!currentUser) return;
  const { error } = await supabase.from('incomes').delete().eq('id', id).eq('user_id', currentUser.id);
  if (error) showToast('Erro ao remover renda', 'error');
}

async function addExpense(expense) {
  if (!currentUser) return;
  const { error } = await supabase.from('expenses').insert([{ ...expense, user_id: currentUser.id }]);
  if (error) showToast('Erro ao adicionar despesa', 'error');
}

async function deleteExpense(id) {
  if (!currentUser) return;
  const { error } = await supabase.from('expenses').delete().eq('id', id).eq('user_id', currentUser.id);
  if (error) showToast('Erro ao remover despesa', 'error');
}

async function addFixedExpense(fixed) {
  if (!currentUser) return;
  const { error } = await supabase.from('fixed_expenses').insert([{ ...fixed, user_id: currentUser.id }]);
  if (error) showToast('Erro ao adicionar despesa fixa', 'error');
}

async function deleteFixedExpense(id) {
  if (!currentUser) return;
  const { error } = await supabase.from('fixed_expenses').delete().eq('id', id).eq('user_id', currentUser.id);
  if (error) showToast('Erro ao remover despesa fixa', 'error');
}

async function toggleFixedPaid(id, isPaid) {
  if (!currentUser) return;
  const { error } = await supabase.from('fixed_expenses').update({ is_paid: isPaid }).eq('id', id);
  if (error) showToast('Erro ao atualizar status', 'error');
}

/* ============================================
   Supabase Realtime Listeners
   ============================================ */

function setupRealtimeListeners() {
  const tables = ['incomes', 'expenses', 'fixed_expenses'];
  tables.forEach(table => {
    supabase
      .channel(`public:${table}`)
      .on('postgres_changes', { event: '*', schema: 'public', table }, payload => {
        console.log('Realtime event:', payload);
        handleRealtimeEvent(table, payload);
      })
      .subscribe();
  });
}

function handleRealtimeEvent(table, payload) {
  if (!currentUser) return;

  switch (table) {
    case 'incomes':
      if (payload.eventType === 'INSERT') incomes.push(payload.new);
      if (payload.eventType === 'DELETE') incomes = incomes.filter(i => i.id !== payload.old.id);
      break;
    case 'expenses':
      if (payload.eventType === 'INSERT') expenses.push(payload.new);
      if (payload.eventType === 'DELETE') expenses = expenses.filter(e => e.id !== payload.old.id);
      break;
    case 'fixed_expenses':
      if (payload.eventType === 'INSERT') fixedExpenses.push(payload.new);
      if (payload.eventType === 'DELETE') fixedExpenses = fixedExpenses.filter(f => f.id !== payload.old.id);
      if (payload.eventType === 'UPDATE') {
        const idx = fixedExpenses.findIndex(f => f.id === payload.new.id);
        if (idx >= 0) fixedExpenses[idx] = payload.new;
      }
      break;
  }

  render();
}

/* ============================================
   Data Filtering and Calculations
   ============================================ */

function getFilteredIncomes() {
  const key = getMonthKey(currentMonth);
  return incomes.filter(i => i.date?.substring(0, 7) === key);
}

function getFilteredExpenses() {
  const key = getMonthKey(currentMonth);
  return expenses.filter(e => e.date?.substring(0, 7) === key);
}

function getFilteredFixedExpenses() {
  const key = getMonthKey(currentMonth);
  return fixedExpenses.filter(f => f.month === key);
}

function calculateTotals() {
  const filteredIncomes = getFilteredIncomes();
  const filteredExpenses = getFilteredExpenses();
  const filteredFixed = getFilteredFixedExpenses();

  const totalIncome = filteredIncomes.reduce((sum, i) => sum + (i.amount || 0), 0);
  const totalExpenses = filteredExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const totalFixed = filteredFixed.reduce((sum, f) => sum + (f.amount || 0), 0);
  const totalFixedPaid = filteredFixed.filter(f => f.is_paid).reduce((sum, f) => sum + f.amount, 0);

  const totalAllExpenses = totalExpenses + totalFixedPaid;
  const balance = totalIncome - totalAllExpenses;

  return {
    totalIncome,
    totalExpenses,
    totalFixed,
    totalFixedPaid,
    totalAllExpenses,
    balance
  };
}

/* ============================================
   Interface Management
   ============================================ */

function showLoginScreen() {
  document.getElementById('login-screen').classList.remove('hidden');
  document.getElementById('app').classList.add('hidden');
  document.getElementById('loading').classList.add('hidden');

  document.getElementById('login-form').reset();
  document.getElementById('register-form').reset();
  document.getElementById('register-form').classList.add('hidden');
  document.getElementById('login-form').classList.remove('hidden');
}

function showMainApp() {
  document.getElementById('login-screen').classList.add('hidden');
  document.getElementById('app').classList.remove('hidden');
  document.getElementById('loading').classList.add('hidden');

  if (currentUser) {
    const userName = currentUser.user_metadata?.name || 'Usuário';
    const firstName = userName.split(' ')[0];
    document.getElementById('user-greeting').textContent = `Olá, ${firstName}`;
  }

  render();
}

/* ============================================
   Navigation
   ============================================ */

function switchTab(tabId) {
  activeTab = tabId;
  document.querySelectorAll('.nav-item').forEach(i => {
    i.classList.toggle('active', i.dataset.tab === tabId);
  });
  document.querySelectorAll('.tab-content').forEach(tab => tab.classList.add('hidden'));
  document.getElementById(`tab-${tabId}`).classList.remove('hidden');
  render();
}

/* ============================================
   Modals
   ============================================ */

function openModal(type) {
  const modal = document.getElementById(`modal-${type}`);
  if (!modal) return;
  modal.classList.remove('hidden');

  const today = new Date().toISOString().split('T')[0];
  if (type === 'income') document.getElementById('income-date').value = today;
  if (type === 'expense') document.getElementById('expense-date').value = today;
}

function closeModal(type) {
  const modal = document.getElementById(`modal-${type}`);
  if (!modal) return;
  modal.classList.add('hidden');
  const form = document.getElementById(`form-${type}`);
  if (form) form.reset();
}

/* ============================================
   Rendering Helpers
   ============================================ */

function renderMonthSelector(containerId) {
  const container = document.getElementById(containerId);
  const monthName = currentMonth.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });

  container.innerHTML = `
    <button onclick="previousMonth()">◀</button>
    <span>${monthName.charAt(0).toUpperCase() + monthName.slice(1)}</span>
    <button onclick="nextMonth()">▶</button>
  `;
}

function renderBalance() {
  const totals = calculateTotals();
  const balanceElem = document.getElementById('balance-card');
  const isPositive = totals.balance >= 0;

  balanceElem.innerHTML = `
    <div class="balance-card">
      <h3>Saldo do mês</h3>
      <div class="balance-value ${isPositive ? 'positive' : 'negative'}">
        ${formatCurrency(totals.balance)}
      </div>
      <div class="balance-details">
        <p>Entradas: <strong class="income">${formatCurrency(totals.totalIncome)}</strong></p>
        <p>Saídas: <strong class="expense">${formatCurrency(totals.totalAllExpenses)}</strong></p>
      </div>
    </div>
  `;
}

function renderIncomes() {
  const list = document.getElementById('income-list');
  const items = getFilteredIncomes();
  if (!items.length) {
    list.innerHTML = `<p class="empty">Nenhuma entrada registrada neste mês.</p>`;
    return;
  }

  list.innerHTML = items.map(i => `
    <div class="transaction-item income">
      <div>
        <strong>${i.type || 'Entrada'}</strong><br>
        <small>${i.date}</small>
      </div>
      <span>${formatCurrency(i.amount)}</span>
      <button class="delete-btn" onclick="deleteIncome('${i.id}')">🗑</button>
    </div>
  `).join('');
}

function renderExpenses() {
  const list = document.getElementById('expense-list');
  const items = getFilteredExpenses();
  if (!items.length) {
    list.innerHTML = `<p class="empty">Nenhuma despesa registrada neste mês.</p>`;
    return;
  }

  list.innerHTML = items.map(e => `
    <div class="transaction-item expense">
      <div>
        <strong>${e.description}</strong><br>
        <small>${e.date}</small>
      </div>
      <span>${formatCurrency(e.amount)}</span>
      <button class="delete-btn" onclick="deleteExpense('${e.id}')">🗑</button>
    </div>
  `).join('');
}

function renderFixedExpenses() {
  const list = document.getElementById('fixed-list');
  const items = getFilteredFixedExpenses();
  if (!items.length) {
    list.innerHTML = `<p class="empty">Nenhuma despesa fixa registrada.</p>`;
    return;
  }

  list.innerHTML = items.map(f => `
    <div class="transaction-item fixed">
      <div>
        <strong>${f.name}</strong><br>
        <small>Venc: ${f.due_day || '-'}</small>
      </div>
      <span>${formatCurrency(f.amount)}</span>
      <label>
        <input type="checkbox" onchange="toggleFixedPaid('${f.id}', this.checked)" ${f.is_paid ? 'checked' : ''}/> Pago
      </label>
      <button class="delete-btn" onclick="deleteFixedExpense('${f.id}')">🗑</button>
    </div>
  `).join('');
}

/* ============================================
   Main Render Function
   ============================================ */

function render() {
  switch (activeTab) {
    case 'home':
      renderMonthSelector('month-selector-home');
      renderBalance();
      break;
    case 'income':
      renderMonthSelector('month-selector-income');
      renderIncomes();
      break;
    case 'expenses':
      renderMonthSelector('month-selector-expenses');
      renderExpenses();
      break;
    case 'fixed':
      renderMonthSelector('month-selector-fixed');
      renderFixedExpenses();
      break;
  }
}

/* ============================================
   Form Handlers
   ============================================ */

function setupFormHandlers() {
  document.getElementById('form-income').addEventListener('submit', e => {
    e.preventDefault();
    const type = document.getElementById('income-type').value || 'Outro';
    const amount = parseAmount(document.getElementById('income-amount').value);
    const date = document.getElementById('income-date').value;
    addIncome({ type, amount, date });
    closeModal('income');
  });

  document.getElementById('form-expense').addEventListener('submit', e => {
    e.preventDefault();
    const description = document.getElementById('expense-description').value;
    const amount = parseAmount(document.getElementById('expense-amount').value);
    const date = document.getElementById('expense-date').value;
    addExpense({ description, amount, date });
    closeModal('expense');
  });

  document.getElementById('form-fixed').addEventListener('submit', e => {
    e.preventDefault();
    const name = document.getElementById('fixed-name').value;
    const amount = parseAmount(document.getElementById('fixed-amount').value);
    const due_day = parseInt(document.getElementById('fixed-due-day').value) || null;
    const month = getMonthKey(currentMonth);
    addFixedExpense({ name, amount, due_day, month, is_paid: false });
    closeModal('fixed');
  });
}

/* ============================================
   Navigation Setup
   ============================================ */

function setupNavigation() {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => switchTab(item.dataset.tab));
  });
}

/* ============================================
   Month Navigation
   ============================================ */

function previousMonth() {
  currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
  render();
}

function nextMonth() {
  currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
  render();
}

/* ============================================
   Initialize UI
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  setupFormHandlers();
  setupNavigation();
});
