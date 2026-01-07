/* ============================================
   FinFamily - JavaScript Puro
   ============================================ */

// Storage Keys
const STORAGE_KEYS = {
  USERS: 'finance_users',
  CURRENT_USER: 'finance_current_user',
  INCOMES: 'finance_incomes',
  EXPENSES: 'finance_expenses',
  FIXED_EXPENSES: 'finance_fixed_expenses',
};

// State
let currentUser = null;
let users = [];
let currentMonth = new Date();
let activeTab = 'home';
let incomes = [];
let expenses = [];
let fixedExpenses = [];
let confirmCallback = null;

// Month names in Portuguese
const MONTH_NAMES = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
];

const INCOME_LABELS = {
  salary: 'Salário',
  commission: 'Comissão',
  extra: 'Extra'
};

const PAYMENT_LABELS = {
  pix: 'Pix',
  debit: 'Débito',
  cash: 'Dinheiro',
  boleto: 'Boleto',
  other: 'Outro'
};

// ============================================
// Utility Functions
// ============================================

function generateId() {
  return Math.random().toString(36).substring(2, 15);
}

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

function formatDate(dateStr) {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

function getMonthKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

function getMonthName(date) {
  return `${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;
}

function parseAmount(str) {
  return parseFloat(str.replace(',', '.')) || 0;
}

function formatAmountInput(value) {
  return value.replace(/[^\d,]/g, '').replace(/(,.*),/g, '$1');
}

// ============================================
// Storage Functions
// ============================================

function loadData() {
  if (!currentUser) return;
  try {
    const prefix = `${currentUser.id}_`;
    const storedIncomes = localStorage.getItem(prefix + STORAGE_KEYS.INCOMES);
    const storedExpenses = localStorage.getItem(prefix + STORAGE_KEYS.EXPENSES);
    const storedFixed = localStorage.getItem(prefix + STORAGE_KEYS.FIXED_EXPENSES);

    incomes = storedIncomes ? JSON.parse(storedIncomes) : [];
    expenses = storedExpenses ? JSON.parse(storedExpenses) : [];
    fixedExpenses = storedFixed ? JSON.parse(storedFixed) : [];
  } catch (error) {
    console.error('Error loading data:', error);
  }
}

function saveData(key, data) {
  if (!currentUser) return;
  try {
    const prefix = `${currentUser.id}_`;
    localStorage.setItem(prefix + key, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving data:', error);
  }
}

// ============================================
// Authentication Functions
// ============================================

function hashPassword(password) {
  // Simple hash for demo - in production use proper hashing
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString();
}

function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

function validatePassword(password) {
  return password && password.length >= 6;
}

function login(email, password) {
  if (!email || !password) {
    showToast('Preencha todos os campos', 'error');
    return false;
  }
  
  if (!validateEmail(email)) {
    showToast('E-mail inválido', 'error');
    return false;
  }

  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user) {
    showToast('Usuário não encontrado', 'error');
    return false;
  }

  if (user.passwordHash !== hashPassword(password)) {
    showToast('Senha incorreta', 'error');
    return false;
  }

  currentUser = user;
  saveUsers();
  loadData();
  showMainApp();
  showToast(`Bem-vindo, ${user.name}!`, 'success');
  return true;
}

function register(name, email, password, confirmPassword) {
  // Validation
  if (!name || !email || !password || !confirmPassword) {
    showToast('Preencha todos os campos', 'error');
    return false;
  }

  if (name.length < 2 || name.length > 50) {
    showToast('Nome deve ter entre 2 e 50 caracteres', 'error');
    return false;
  }

  if (!validateEmail(email)) {
    showToast('E-mail inválido', 'error');
    return false;
  }

  if (!validatePassword(password)) {
    showToast('Senha deve ter no mínimo 6 caracteres', 'error');
    return false;
  }

  if (password !== confirmPassword) {
    showToast('As senhas não coincidem', 'error');
    return false;
  }

  if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
    showToast('E-mail já cadastrado', 'error');
    return false;
  }

  const newUser = {
    id: generateId(),
    name: name.trim(),
    email: email.trim().toLowerCase(),
    passwordHash: hashPassword(password),
    createdAt: new Date().toISOString()
  };

  users.push(newUser);
  currentUser = newUser;
  saveUsers();
  
  // Initialize empty data for new user
  incomes = [];
  expenses = [];
  fixedExpenses = [];

  showMainApp();
  showToast('Conta criada com sucesso!', 'success');
  return true;
}

function logout() {
  currentUser = null;
  incomes = [];
  expenses = [];
  fixedExpenses = [];
  localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  activeTab = 'home';
  showLoginScreen();
  showToast('Você saiu da conta', 'info');
}

function updateProfile(name, email) {
  if (!currentUser) return false;

  if (!name || !email) {
    showToast('Preencha todos os campos', 'error');
    return false;
  }

  if (name.length < 2 || name.length > 50) {
    showToast('Nome deve ter entre 2 e 50 caracteres', 'error');
    return false;
  }

  if (!validateEmail(email)) {
    showToast('E-mail inválido', 'error');
    return false;
  }

  // Check if email is taken by another user
  const existingUser = users.find(u => 
    u.email.toLowerCase() === email.toLowerCase() && u.id !== currentUser.id
  );
  if (existingUser) {
    showToast('E-mail já está em uso', 'error');
    return false;
  }

  // Update user
  const userIndex = users.findIndex(u => u.id === currentUser.id);
  if (userIndex !== -1) {
    users[userIndex].name = name.trim();
    users[userIndex].email = email.trim().toLowerCase();
    currentUser = users[userIndex];
    saveUsers();
    showToast('Perfil atualizado!', 'success');
    render();
    return true;
  }
  return false;
}

function changePassword(currentPassword, newPassword, confirmPassword) {
  if (!currentUser) return false;

  if (!currentPassword || !newPassword || !confirmPassword) {
    showToast('Preencha todos os campos', 'error');
    return false;
  }

  const user = users.find(u => u.id === currentUser.id);
  if (!user) return false;

  if (user.passwordHash !== hashPassword(currentPassword)) {
    showToast('Senha atual incorreta', 'error');
    return false;
  }

  if (!validatePassword(newPassword)) {
    showToast('Nova senha deve ter no mínimo 6 caracteres', 'error');
    return false;
  }

  if (newPassword !== confirmPassword) {
    showToast('As senhas não coincidem', 'error');
    return false;
  }

  user.passwordHash = hashPassword(newPassword);
  currentUser = user;
  saveUsers();
  showToast('Senha alterada com sucesso!', 'success');
  return true;
}

function clearAllData() {
  if (!currentUser) return;
  
  const prefix = `${currentUser.id}_`;
  localStorage.removeItem(prefix + STORAGE_KEYS.INCOMES);
  localStorage.removeItem(prefix + STORAGE_KEYS.EXPENSES);
  localStorage.removeItem(prefix + STORAGE_KEYS.FIXED_EXPENSES);
  
  incomes = [];
  expenses = [];
  fixedExpenses = [];
  
  render();
  showToast('Todos os dados foram apagados', 'success');
}

function exportData() {
  if (!currentUser) return;

  const data = {
    user: {
      name: currentUser.name,
      email: currentUser.email
    },
    incomes,
    expenses,
    fixedExpenses,
    exportedAt: new Date().toISOString()
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `financas_${currentUser.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showToast('Dados exportados!', 'success');
}

// ============================================
// Screen Management
// ============================================

function showLoginScreen() {
  document.getElementById('login-screen').classList.remove('hidden');
  document.getElementById('app').classList.add('hidden');
  document.getElementById('loading').classList.add('hidden');
  
  // Reset forms
  document.getElementById('login-form').reset();
  document.getElementById('register-form').reset();
  document.getElementById('register-form').classList.add('hidden');
  document.getElementById('login-form').classList.remove('hidden');
}

function showMainApp() {
  document.getElementById('login-screen').classList.add('hidden');
  document.getElementById('app').classList.remove('hidden');
  document.getElementById('loading').classList.add('hidden');
  
  // Update greeting
  if (currentUser) {
    const firstName = currentUser.name.split(' ')[0];
    document.getElementById('user-greeting').textContent = `Olá, ${firstName}`;
  }
  
  render();
}

// ============================================
// Data Filtering
// ============================================

function getFilteredIncomes() {
  const monthKey = getMonthKey(currentMonth);
  return incomes.filter(i => i.date.substring(0, 7) === monthKey);
}

function getFilteredExpenses() {
  const monthKey = getMonthKey(currentMonth);
  return expenses.filter(e => e.date.substring(0, 7) === monthKey);
}

function getFilteredFixedExpenses() {
  const monthKey = getMonthKey(currentMonth);
  return fixedExpenses.filter(f => f.month === monthKey);
}

// ============================================
// Calculations
// ============================================

function calculateTotals() {
  const filteredIncomes = getFilteredIncomes();
  const filteredExpenses = getFilteredExpenses();
  const filteredFixed = getFilteredFixedExpenses();

  const totalIncome = filteredIncomes.reduce((sum, i) => sum + i.amount, 0);
  const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalFixed = filteredFixed.reduce((sum, f) => sum + f.amount, 0);
  const totalFixedPaid = filteredFixed.filter(f => f.isPaid).reduce((sum, f) => sum + f.amount, 0);
  const totalFixedPending = totalFixed - totalFixedPaid;
  const totalAllExpenses = totalExpenses + totalFixedPaid;
  const balance = totalIncome - totalAllExpenses;

  return {
    totalIncome,
    totalExpenses,
    totalFixed,
    totalFixedPaid,
    totalFixedPending,
    totalAllExpenses,
    balance
  };
}

function getRecentTransactions(limit = 5) {
  const filteredIncomes = getFilteredIncomes();
  const filteredExpenses = getFilteredExpenses();
  const filteredFixed = getFilteredFixedExpenses();

  const all = [
    ...filteredIncomes.map(i => ({
      id: i.id,
      type: 'income',
      description: i.type === 'extra' ? (i.description || 'Extra') : INCOME_LABELS[i.type],
      amount: i.amount,
      date: i.date
    })),
    ...filteredExpenses.map(e => ({
      id: e.id,
      type: 'expense',
      description: e.description,
      amount: e.amount,
      date: e.date
    })),
    ...filteredFixed.map(f => ({
      id: f.id,
      type: 'fixed',
      description: f.name,
      amount: f.amount,
      date: `${f.month}-${String(f.dueDay || 1).padStart(2, '0')}`,
      isPaid: f.isPaid
    }))
  ];

  return all.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, limit);
}

// ============================================
// CRUD Operations
// ============================================

function addIncome(income) {
  const newIncome = {
    ...income,
    id: generateId(),
    userId: 'user1',
    createdAt: new Date().toISOString()
  };
  incomes.push(newIncome);
  saveData(STORAGE_KEYS.INCOMES, incomes);
  showToast('Entrada adicionada!', 'success');
  render();
}

function deleteIncome(id) {
  incomes = incomes.filter(i => i.id !== id);
  saveData(STORAGE_KEYS.INCOMES, incomes);
  showToast('Entrada removida', 'success');
  render();
}

function addExpense(expense) {
  const newExpense = {
    ...expense,
    id: generateId(),
    userId: 'user1',
    createdAt: new Date().toISOString()
  };
  expenses.push(newExpense);
  saveData(STORAGE_KEYS.EXPENSES, expenses);
  showToast('Gasto registrado!', 'success');
  render();
}

function deleteExpense(id) {
  expenses = expenses.filter(e => e.id !== id);
  saveData(STORAGE_KEYS.EXPENSES, expenses);
  showToast('Gasto removido', 'success');
  render();
}

function addFixedExpense(fixed) {
  const newFixed = {
    ...fixed,
    id: generateId(),
    userId: 'user1',
    createdAt: new Date().toISOString()
  };
  fixedExpenses.push(newFixed);
  saveData(STORAGE_KEYS.FIXED_EXPENSES, fixedExpenses);
  showToast('Despesa fixa adicionada!', 'success');
  render();
}

function deleteFixedExpense(id) {
  fixedExpenses = fixedExpenses.filter(f => f.id !== id);
  saveData(STORAGE_KEYS.FIXED_EXPENSES, fixedExpenses);
  showToast('Despesa fixa removida', 'success');
  render();
}

function toggleFixedPaid(id) {
  const fixed = fixedExpenses.find(f => f.id === id);
  if (fixed) {
    fixed.isPaid = !fixed.isPaid;
    saveData(STORAGE_KEYS.FIXED_EXPENSES, fixedExpenses);
    render();
  }
}

// ============================================
// UI Rendering
// ============================================

function renderMonthSelector(containerId) {
  const container = document.getElementById(containerId);
  container.innerHTML = `
    <button onclick="previousMonth()">
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="m15 18-6-6 6-6"/>
      </svg>
    </button>
    <div class="month-display">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M8 2v4"/>
        <path d="M16 2v4"/>
        <rect width="18" height="18" x="3" y="4" rx="2"/>
        <path d="M3 10h18"/>
      </svg>
      <span>${getMonthName(currentMonth)}</span>
    </div>
    <button onclick="nextMonth()">
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="m9 18 6-6-6-6"/>
      </svg>
    </button>
  `;
}

function renderBalanceCard() {
  const container = document.getElementById('balance-card');
  const totals = calculateTotals();
  const isPositive = totals.balance >= 0;

  container.innerHTML = `
    <div class="balance-card">
      <div class="balance-header">
        <span class="balance-label">Saldo do mês</span>
      </div>
      <div class="balance-value ${isPositive ? 'positive' : 'negative'}">
        ${formatCurrency(totals.balance)}
      </div>
      <div class="balance-details">
        <div class="balance-item">
          <div class="balance-item-label">Entradas</div>
          <div class="balance-item-value income">${formatCurrency(totals.totalIncome)}</div>
        </div>
        <div class="balance-item">
          <div class="balance-item-label">Saídas</div>
          <div class="balance-item-value expense">${formatCurrency(totals.totalAllExpenses)}</div>
        </div>
      </div>
    </div>
  `;
}

function renderQuickActions() {
  const container = document.getElementById('quick-actions');
  container.innerHTML = `
    <div class="quick-actions">
      <button class="btn btn-income" onclick="openModal('income')">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
          <polyline points="16 7 22 7 22 13"/>
        </svg>
        Entrada
      </button>
      <button class="btn btn-expense" onclick="openModal('expense')">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="22 17 13.5 8.5 8.5 13.5 2 7"/>
          <polyline points="16 17 22 17 22 11"/>
        </svg>
        Gasto
      </button>
    </div>
  `;
}

function renderTransactionList() {
  const container = document.getElementById('transactions-list');
  const transactions = getRecentTransactions(5);

  if (transactions.length === 0) {
    container.innerHTML = `
      <div class="card">
        <div class="card-header">
          <span class="card-title">Últimas Movimentações</span>
        </div>
        <div class="empty-state">
          <svg class="empty-icon" xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" x2="12" y1="2" y2="22"/>
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
          </svg>
          <p class="empty-text">Nenhuma movimentação este mês</p>
        </div>
      </div>
    `;
    return;
  }

  const transactionsHTML = transactions.map(t => {
    const isPaid = t.type === 'fixed' && t.isPaid;
    const iconClass = t.type === 'fixed' ? (isPaid ? 'fixed paid' : 'fixed') : t.type;
    const amountClass = t.type === 'fixed' ? (isPaid ? 'fixed paid' : 'fixed') : t.type;
    const prefix = t.type === 'income' ? '+' : '-';

    return `
      <div class="transaction-item">
        <div class="transaction-icon ${iconClass}">
          ${getTransactionIcon(t.type, isPaid)}
        </div>
        <div class="transaction-info">
          <div class="transaction-description">${t.description}</div>
          <div class="transaction-date">${formatDate(t.date)}</div>
        </div>
        <div class="transaction-amount ${amountClass}">
          ${prefix} ${formatCurrency(t.amount)}
        </div>
      </div>
    `;
  }).join('');

  container.innerHTML = `
    <div class="card">
      <div class="card-header">
        <span class="card-title">Últimas Movimentações</span>
      </div>
      <div class="transaction-list">
        ${transactionsHTML}
      </div>
      <button class="view-all-btn" onclick="switchTab('expenses')">Ver todas</button>
    </div>
  `;
}

function getTransactionIcon(type, isPaid) {
  if (type === 'income') {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
      <polyline points="16 7 22 7 22 13"/>
    </svg>`;
  } else if (type === 'expense') {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="22 17 13.5 8.5 8.5 13.5 2 7"/>
      <polyline points="16 17 22 17 22 11"/>
    </svg>`;
  } else {
    if (isPaid) {
      return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
        <polyline points="22 4 12 14.01 9 11.01"/>
      </svg>`;
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>`;
  }
}

function renderIncomeList() {
  const container = document.getElementById('income-list');
  const filteredIncomes = getFilteredIncomes();
  const total = filteredIncomes.reduce((sum, i) => sum + i.amount, 0);

  const summaryHTML = `
    <div class="summary-card">
      <div class="summary-info">
        <h3>Total de Entradas</h3>
        <div class="summary-value income">${formatCurrency(total)}</div>
      </div>
      <button class="btn btn-primary" onclick="openModal('income')">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M5 12h14"/>
          <path d="M12 5v14"/>
        </svg>
        Nova
      </button>
    </div>
  `;

  if (filteredIncomes.length === 0) {
    container.innerHTML = summaryHTML + `
      <div class="card">
        <div class="empty-state">
          <svg class="empty-icon" xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
            <polyline points="16 7 22 7 22 13"/>
          </svg>
          <p class="empty-text">Nenhuma entrada este mês</p>
          <button class="btn btn-outline" onclick="openModal('income')">Adicionar entrada</button>
        </div>
      </div>
    `;
    return;
  }

  const incomesHTML = filteredIncomes.map(i => `
    <div class="transaction-item">
      <div class="transaction-icon income">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
          <polyline points="16 7 22 7 22 13"/>
        </svg>
      </div>
      <div class="transaction-info">
        <div class="transaction-description">${i.type === 'extra' ? (i.description || 'Extra') : INCOME_LABELS[i.type]}</div>
        <div class="transaction-date">${formatDate(i.date)}</div>
      </div>
      <div class="transaction-amount income">+ ${formatCurrency(i.amount)}</div>
      <button class="delete-btn" onclick="deleteIncome('${i.id}')">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 6h18"/>
          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
        </svg>
      </button>
    </div>
  `).join('');

  container.innerHTML = summaryHTML + `
    <div class="card">
      <div class="transaction-list">
        ${incomesHTML}
      </div>
    </div>
  `;
}

function renderExpenseList() {
  const container = document.getElementById('expense-list');
  const filteredExpenses = getFilteredExpenses();
  const total = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  const summaryHTML = `
    <div class="summary-card">
      <div class="summary-info">
        <h3>Total de Gastos</h3>
        <div class="summary-value expense">${formatCurrency(total)}</div>
      </div>
      <button class="btn btn-primary" onclick="openModal('expense')">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M5 12h14"/>
          <path d="M12 5v14"/>
        </svg>
        Novo
      </button>
    </div>
  `;

  if (filteredExpenses.length === 0) {
    container.innerHTML = summaryHTML + `
      <div class="card">
        <div class="empty-state">
          <svg class="empty-icon" xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect width="20" height="14" x="2" y="5" rx="2"/>
            <line x1="2" x2="22" y1="10" y2="10"/>
          </svg>
          <p class="empty-text">Nenhum gasto este mês</p>
          <button class="btn btn-outline" onclick="openModal('expense')">Adicionar gasto</button>
        </div>
      </div>
    `;
    return;
  }

  const expensesHTML = filteredExpenses.map(e => `
    <div class="transaction-item">
      <div class="transaction-icon expense">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="22 17 13.5 8.5 8.5 13.5 2 7"/>
          <polyline points="16 17 22 17 22 11"/>
        </svg>
      </div>
      <div class="transaction-info">
        <div class="transaction-description">${e.description}</div>
        <div class="transaction-date">${formatDate(e.date)} • ${PAYMENT_LABELS[e.paymentMethod]}</div>
      </div>
      <div class="transaction-amount expense">- ${formatCurrency(e.amount)}</div>
      <button class="delete-btn" onclick="deleteExpense('${e.id}')">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 6h18"/>
          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
        </svg>
      </button>
    </div>
  `).join('');

  container.innerHTML = summaryHTML + `
    <div class="card">
      <div class="transaction-list">
        ${expensesHTML}
      </div>
    </div>
  `;
}

function renderFixedList() {
  const container = document.getElementById('fixed-list');
  const filteredFixed = getFilteredFixedExpenses();
  const totals = calculateTotals();
  const paidPercent = totals.totalFixed > 0 ? (totals.totalFixedPaid / totals.totalFixed) * 100 : 0;

  const summaryHTML = `
    <div class="card">
      <div class="summary-card" style="border: none; padding: 0; margin: 0;">
        <div class="summary-info">
          <h3>Despesas Fixas</h3>
          <div class="summary-value expense">${formatCurrency(totals.totalFixed)}</div>
        </div>
        <button class="btn btn-primary" onclick="openModal('fixed')">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M5 12h14"/>
            <path d="M12 5v14"/>
          </svg>
          Nova
        </button>
      </div>
      <div class="fixed-progress">
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${paidPercent}%"></div>
        </div>
        <div class="progress-labels">
          <span class="progress-paid">Pago: ${formatCurrency(totals.totalFixedPaid)}</span>
          <span class="progress-pending">Pendente: ${formatCurrency(totals.totalFixedPending)}</span>
        </div>
      </div>
    </div>
  `;

  if (filteredFixed.length === 0) {
    container.innerHTML = summaryHTML + `
      <div class="card">
        <div class="empty-state">
          <svg class="empty-icon" xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/>
            <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/>
            <path d="M12 17.5v-11"/>
          </svg>
          <p class="empty-text">Nenhuma despesa fixa este mês</p>
          <button class="btn btn-outline" onclick="openModal('fixed')">Adicionar despesa fixa</button>
        </div>
      </div>
    `;
    return;
  }

  const fixedHTML = filteredFixed.map(f => `
    <div class="fixed-item">
      <div class="fixed-checkbox ${f.isPaid ? 'checked' : ''}" onclick="toggleFixedPaid('${f.id}')">
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      </div>
      <div class="fixed-info">
        <div class="fixed-name ${f.isPaid ? 'paid' : ''}">${f.name}</div>
        ${f.dueDay ? `<div class="fixed-due">Vence dia ${f.dueDay}</div>` : ''}
      </div>
      <div class="fixed-amount">${formatCurrency(f.amount)}</div>
      <button class="delete-btn" onclick="deleteFixedExpense('${f.id}')">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 6h18"/>
          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
        </svg>
      </button>
    </div>
  `).join('');

  container.innerHTML = summaryHTML + `
    <div class="card" style="padding: 0.5rem;">
      ${fixedHTML}
    </div>
  `;
}

function renderProfile() {
  const container = document.getElementById('tab-profile');
  if (!currentUser) return;

  // Calculate stats
  const totalIncome = incomes.reduce((sum, i) => sum + i.amount, 0);
  const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalTransactions = incomes.length + expenses.length;
  
  // Get unique months
  const months = new Set();
  [...incomes, ...expenses].forEach(item => {
    if (item.date) {
      months.add(item.date.substring(0, 7));
    }
  });

  container.innerHTML = `
    <div class="profile-section animate-slide-up">
      <!-- Profile Card -->
      <div class="profile-card">
        <div class="profile-avatar">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
        </div>
        <div class="profile-info">
          <h3>${currentUser.name}</h3>
          <p>${currentUser.email}</p>
        </div>
      </div>

      <!-- Account Settings -->
      <div class="card">
        <h4 class="section-title">Conta</h4>
        <button class="profile-menu-item" onclick="openEditProfileModal()">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
          <span>Editar Perfil</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg>
        </button>
        <button class="profile-menu-item" onclick="openModal('password')">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
          <span>Alterar Senha</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg>
        </button>
      </div>

      <!-- Data Management -->
      <div class="card">
        <h4 class="section-title">Dados</h4>
        <button class="profile-menu-item" onclick="exportData()">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" x2="12" y1="15" y2="3"/>
          </svg>
          <span>Exportar Dados</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg>
        </button>
        <button class="profile-menu-item danger" onclick="confirmClearData()">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 6h18"/>
            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
          </svg>
          <span>Limpar Todos os Dados</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg>
        </button>
      </div>

      <!-- Statistics -->
      <div class="card">
        <h4 class="section-title">Estatísticas</h4>
        <div class="stats-grid">
          <div class="stat-card">
            <span class="stat-value">${formatCurrency(totalIncome)}</span>
            <span class="stat-label">Total de Receitas</span>
          </div>
          <div class="stat-card">
            <span class="stat-value" style="color: var(--expense);">${formatCurrency(totalExpense)}</span>
            <span class="stat-label">Total de Despesas</span>
          </div>
          <div class="stat-card">
            <span class="stat-value">${totalTransactions}</span>
            <span class="stat-label">Transações</span>
          </div>
          <div class="stat-card">
            <span class="stat-value">${months.size}</span>
            <span class="stat-label">Meses Registrados</span>
          </div>
        </div>
      </div>

      <!-- Logout -->
      <button class="logout-btn" onclick="confirmLogout()">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 0.5rem;">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
          <polyline points="16 17 21 12 16 7"/>
          <line x1="21" x2="9" y1="12" y2="12"/>
        </svg>
        Sair da Conta
      </button>

      <p class="app-version">FinFamily v1.0.0 • Dados salvos localmente</p>
    </div>
  `;
}

function openEditProfileModal() {
  if (!currentUser) return;
  document.getElementById('profile-name').value = currentUser.name;
  document.getElementById('profile-email').value = currentUser.email;
  openModal('profile');
}

function confirmLogout() {
  document.getElementById('confirm-title').textContent = 'Sair da Conta';
  document.getElementById('confirm-message').textContent = 'Tem certeza que deseja sair?';
  confirmCallback = logout;
  openModal('confirm');
}

function confirmClearData() {
  document.getElementById('confirm-title').textContent = 'Limpar Dados';
  document.getElementById('confirm-message').textContent = 'Tem certeza que deseja apagar todos os seus dados? Esta ação não pode ser desfeita.';
  confirmCallback = clearAllData;
  openModal('confirm');
}

// ============================================
// Navigation
// ============================================

function switchTab(tabId) {
  activeTab = tabId;
  
  // Update nav items
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.tab === tabId);
  });

  // Update tab content visibility
  document.querySelectorAll('.tab-content').forEach(tab => {
    tab.classList.add('hidden');
  });
  document.getElementById(`tab-${tabId}`).classList.remove('hidden');

  render();
}

function previousMonth() {
  currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
  render();
}

function nextMonth() {
  currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
  render();
}

// ============================================
// Modal Functions
// ============================================

function openModal(type) {
  const modal = document.getElementById(`modal-${type}`);
  modal.classList.remove('hidden');
  
  // Set default date to today
  const today = new Date().toISOString().split('T')[0];
  if (type === 'income') {
    document.getElementById('income-date').value = today;
  } else if (type === 'expense') {
    document.getElementById('expense-date').value = today;
  }
}

function closeModal(type) {
  const modal = document.getElementById(`modal-${type}`);
  modal.classList.add('hidden');
  
  // Reset form
  const form = document.getElementById(`form-${type}`);
  if (form) form.reset();
  
  // Hide description for income
  if (type === 'income') {
    document.getElementById('income-description-group').classList.add('hidden');
  }
}

function setFixedName(name) {
  document.getElementById('fixed-name').value = name;
}

// ============================================
// Toast
// ============================================

function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  
  setTimeout(() => {
    toast.remove();
  }, 3000);
}

// ============================================
// Main Render Function
// ============================================

function render() {
  // Prepare containers based on tab
  const homeTab = document.getElementById('tab-home');
  const incomeTab = document.getElementById('tab-income');
  const expensesTab = document.getElementById('tab-expenses');
  const fixedTab = document.getElementById('tab-fixed');

  switch (activeTab) {
    case 'home':
      homeTab.innerHTML = `
        <div id="month-selector-home" class="month-selector glass animate-slide-up"></div>
        <div id="balance-card" class="animate-slide-up" style="animation-delay: 0.05s"></div>
        <div id="quick-actions" class="animate-slide-up" style="animation-delay: 0.1s"></div>
        <div id="transactions-list" class="animate-slide-up" style="animation-delay: 0.15s"></div>
      `;
      renderMonthSelector('month-selector-home');
      renderBalanceCard();
      renderQuickActions();
      renderTransactionList();
      break;
    case 'income':
      incomeTab.innerHTML = `
        <div id="month-selector-income" class="month-selector glass animate-slide-up"></div>
        <div id="income-list" class="animate-slide-up" style="animation-delay: 0.05s"></div>
      `;
      renderMonthSelector('month-selector-income');
      renderIncomeList();
      break;
    case 'expenses':
      expensesTab.innerHTML = `
        <div id="month-selector-expenses" class="month-selector glass animate-slide-up"></div>
        <div id="expense-list" class="animate-slide-up" style="animation-delay: 0.05s"></div>
      `;
      renderMonthSelector('month-selector-expenses');
      renderExpenseList();
      break;
    case 'fixed':
      fixedTab.innerHTML = `
        <div id="month-selector-fixed" class="month-selector glass animate-slide-up"></div>
        <div id="fixed-list" class="animate-slide-up" style="animation-delay: 0.05s"></div>
      `;
      renderMonthSelector('month-selector-fixed');
      renderFixedList();
      break;
    case 'profile':
      renderProfile();
      break;
  }
}

// ============================================
// Form Handlers
// ============================================

function setupFormHandlers() {
  // Income form
  document.getElementById('form-income').addEventListener('submit', (e) => {
    e.preventDefault();
    const type = document.querySelector('input[name="income-type"]:checked').value;
    const amount = parseAmount(document.getElementById('income-amount').value);
    const date = document.getElementById('income-date').value;
    const description = document.getElementById('income-description').value;

    if (!amount || !date) {
      showToast('Preencha todos os campos', 'error');
      return;
    }

    addIncome({ type, amount, date, description });
    closeModal('income');
  });

  // Toggle description field for extra income
  document.querySelectorAll('input[name="income-type"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      const descGroup = document.getElementById('income-description-group');
      descGroup.classList.toggle('hidden', e.target.value !== 'extra');
    });
  });

  // Expense form
  document.getElementById('form-expense').addEventListener('submit', (e) => {
    e.preventDefault();
    const description = document.getElementById('expense-description').value;
    const amount = parseAmount(document.getElementById('expense-amount').value);
    const paymentMethod = document.getElementById('expense-method').value;
    const date = document.getElementById('expense-date').value;

    if (!description || !amount || !date) {
      showToast('Preencha todos os campos', 'error');
      return;
    }

    addExpense({ description, amount, paymentMethod, date });
    closeModal('expense');
  });

  // Fixed expense form
  document.getElementById('form-fixed').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('fixed-name').value;
    const amount = parseAmount(document.getElementById('fixed-amount').value);
    const dueDay = parseInt(document.getElementById('fixed-due-day').value) || undefined;

    if (!name || !amount) {
      showToast('Preencha todos os campos obrigatórios', 'error');
      return;
    }

    addFixedExpense({
      name,
      amount,
      dueDay,
      isPaid: false,
      month: getMonthKey(currentMonth)
    });
    closeModal('fixed');
  });

  // Format amount inputs
  ['income-amount', 'expense-amount', 'fixed-amount'].forEach(id => {
    const input = document.getElementById(id);
    input.addEventListener('input', (e) => {
      e.target.value = formatAmountInput(e.target.value);
    });
  });

  // Close modal on overlay click
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', () => {
      const modal = overlay.closest('.modal');
      const type = modal.id.replace('modal-', '');
      closeModal(type);
    });
  });
}

// ============================================
// Navigation Setup
// ============================================

function setupNavigation() {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
      switchTab(item.dataset.tab);
    });
  });
}

// ============================================
// Auth Form Handlers
// ============================================

function setupAuthHandlers() {
  // Toggle forms
  document.getElementById('show-register').addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('login-form').classList.add('hidden');
    document.getElementById('register-form').classList.remove('hidden');
  });

  document.getElementById('show-login').addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('register-form').classList.add('hidden');
    document.getElementById('login-form').classList.remove('hidden');
  });

  // Login form
  document.getElementById('login-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    login(email, password);
  });

  // Register form
  document.getElementById('register-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const confirm = document.getElementById('register-confirm').value;
    register(name, email, password, confirm);
  });

  // Profile form
  document.getElementById('form-profile').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('profile-name').value;
    const email = document.getElementById('profile-email').value;
    if (updateProfile(name, email)) {
      closeModal('profile');
    }
  });

  // Password form
  document.getElementById('form-password').addEventListener('submit', (e) => {
    e.preventDefault();
    const current = document.getElementById('current-password').value;
    const newPass = document.getElementById('new-password').value;
    const confirm = document.getElementById('confirm-password').value;
    if (changePassword(current, newPass, confirm)) {
      e.target.reset();
      closeModal('password');
    }
  });

  // Confirm button
  document.getElementById('confirm-btn').addEventListener('click', () => {
    if (confirmCallback) {
      confirmCallback();
      confirmCallback = null;
    }
    closeModal('confirm');
  });
}

// ============================================
// Initialize App
// ============================================

function init() {
  loadUsers();
  
  setupAuthHandlers();
  setupNavigation();
  setupFormHandlers();

  // Check if user is logged in
  if (currentUser) {
    loadData();
    showMainApp();
  } else {
    showLoginScreen();
  }
}

// Start the app
document.addEventListener('DOMContentLoaded', init);
