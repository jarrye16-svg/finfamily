/* ============================================
   FinFamily - JavaScript Puro com Supabase
   ============================================ */

// Supabase Configuration
const SUPABASE_URL = 'https://hdsnmhvhjyldpeztcamz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhkc25taHZoanlsZHBlenRjYW16Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4NzI3NjksImV4cCI6MjA4MzQ0ODc2OX0.cHieOovT5Wjw4WY2woe6nF6HWTu19A7dSqeFKBBaki0';

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// State
let currentUser = null;
let userProfile = null;
let currentMonth = new Date();
let activeTab = 'home';
let incomes = [];
let expenses = [];
let fixedExpenses = [];
let confirmCallback = null;
let currentFamily = null;
let familyMembers = [];

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
// Supabase Data Functions
// ============================================

async function loadDataFromSupabase() {
  if (!currentUser) return;
  
  try {
    const { data, error } = await supabase
      .from('financas')
      .select('*')
      .eq('user_id', currentUser.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error loading data:', error);
      return;
    }

    if (data) {
      incomes = data.renda || [];
      expenses = data.despesas || [];
      fixedExpenses = data.fixed_expenses || [];
    } else {
      incomes = [];
      expenses = [];
      fixedExpenses = [];
    }
  } catch (error) {
    console.error('Error loading data:', error);
  }
}

async function saveDataToSupabase() {
  if (!currentUser) return;

  try {
    const { error } = await supabase
      .from('financas')
      .upsert({
        user_id: currentUser.id,
        renda: incomes,
        despesas: expenses,
        fixed_expenses: fixedExpenses
      }, { onConflict: 'user_id' });

    if (error) {
      console.error('Error saving data:', error);
      showToast('Erro ao salvar dados', 'error');
    }
  } catch (error) {
    console.error('Error saving data:', error);
  }
}

// ============================================
// Profile Functions
// ============================================

async function loadUserProfile() {
  if (!currentUser) return;

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', currentUser.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error loading profile:', error);
      return;
    }

    if (data) {
      userProfile = data;
    } else {
      // Create profile if doesn't exist
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert({
          user_id: currentUser.id,
          display_name: currentUser.user_metadata?.name || null,
          notifications_enabled: true,
          email_notifications: true
        })
        .select()
        .single();

      if (!createError) {
        userProfile = newProfile;
      }
    }
  } catch (error) {
    console.error('Error loading profile:', error);
  }
}

async function updateUserProfile(updates) {
  if (!currentUser || !userProfile) return false;

  try {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('user_id', currentUser.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating profile:', error);
      showToast('Erro ao atualizar perfil', 'error');
      return false;
    }

    userProfile = data;
    return true;
  } catch (error) {
    console.error('Error updating profile:', error);
    return false;
  }
}

async function uploadAvatar(file) {
  if (!currentUser || !file) return null;

  const fileExt = file.name.split('.').pop();
  const fileName = `${currentUser.id}/avatar.${fileExt}`;

  try {
    // Delete old avatar if exists
    await supabase.storage.from('avatars').remove([fileName]);

    // Upload new avatar
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, { upsert: true });

    if (uploadError) {
      console.error('Error uploading avatar:', uploadError);
      showToast('Erro ao enviar foto', 'error');
      return null;
    }

    // Get public URL
    const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
    const avatarUrl = data.publicUrl + '?t=' + Date.now();

    // Update profile with new avatar URL
    await updateUserProfile({ avatar_url: avatarUrl });

    return avatarUrl;
  } catch (error) {
    console.error('Error uploading avatar:', error);
    showToast('Erro ao enviar foto', 'error');
    return null;
  }
}

// ============================================
// Family Functions
// ============================================

async function loadFamily() {
  if (!currentUser) return;

  try {
    // Get user's family membership
    const { data: membership, error: memberError } = await supabase
      .from('family_members')
      .select('*, families(*)')
      .eq('user_id', currentUser.id)
      .single();

    if (memberError && memberError.code !== 'PGRST116') {
      console.error('Error loading family:', memberError);
      return;
    }

    if (membership) {
      currentFamily = membership.families;
      await loadFamilyMembers(currentFamily.id);
    } else {
      currentFamily = null;
      familyMembers = [];
    }
  } catch (error) {
    console.error('Error loading family:', error);
  }
}

async function loadFamilyMembers(familyId) {
  try {
    const { data, error } = await supabase
      .from('family_members')
      .select('*, profiles:user_id(display_name, avatar_url)')
      .eq('family_id', familyId);

    if (error) {
      console.error('Error loading family members:', error);
      return;
    }

    familyMembers = data || [];
  } catch (error) {
    console.error('Error loading family members:', error);
  }
}

async function createFamily(name) {
  if (!currentUser || !name.trim()) {
    showToast('Digite um nome para a família', 'error');
    return false;
  }

  try {
    // Create family
    const { data: family, error: familyError } = await supabase
      .from('families')
      .insert({
        name: name.trim(),
        owner_id: currentUser.id
      })
      .select()
      .single();

    if (familyError) {
      console.error('Error creating family:', familyError);
      showToast('Erro ao criar família', 'error');
      return false;
    }

    // Add owner as member
    const { error: memberError } = await supabase
      .from('family_members')
      .insert({
        family_id: family.id,
        user_id: currentUser.id,
        role: 'owner'
      });

    if (memberError) {
      console.error('Error adding member:', memberError);
      showToast('Erro ao adicionar membro', 'error');
      return false;
    }

    currentFamily = family;
    await loadFamilyMembers(family.id);
    showToast('Família criada com sucesso!', 'success');
    render();
    return true;
  } catch (error) {
    console.error('Error creating family:', error);
    showToast('Erro ao criar família', 'error');
    return false;
  }
}

async function joinFamily(inviteCode) {
  if (!currentUser || !inviteCode.trim()) {
    showToast('Digite o código de convite', 'error');
    return false;
  }

  try {
    // Find family by invite code
    const { data: family, error: findError } = await supabase
      .from('families')
      .select('*')
      .eq('invite_code', inviteCode.trim().toLowerCase())
      .single();

    if (findError || !family) {
      showToast('Código de convite inválido', 'error');
      return false;
    }

    // Check if already a member
    const { data: existing } = await supabase
      .from('family_members')
      .select('id')
      .eq('family_id', family.id)
      .eq('user_id', currentUser.id)
      .single();

    if (existing) {
      showToast('Você já faz parte desta família', 'info');
      return false;
    }

    // Join family
    const { error: joinError } = await supabase
      .from('family_members')
      .insert({
        family_id: family.id,
        user_id: currentUser.id,
        role: 'member'
      });

    if (joinError) {
      console.error('Error joining family:', joinError);
      showToast('Erro ao entrar na família', 'error');
      return false;
    }

    currentFamily = family;
    await loadFamilyMembers(family.id);
    showToast(`Você entrou na família ${family.name}!`, 'success');
    render();
    return true;
  } catch (error) {
    console.error('Error joining family:', error);
    showToast('Erro ao entrar na família', 'error');
    return false;
  }
}

async function leaveFamily() {
  if (!currentUser || !currentFamily) return;

  try {
    // Check if owner
    if (currentFamily.owner_id === currentUser.id) {
      showToast('O dono não pode sair da família. Exclua a família ou transfira a propriedade.', 'error');
      return;
    }

    const { error } = await supabase
      .from('family_members')
      .delete()
      .eq('family_id', currentFamily.id)
      .eq('user_id', currentUser.id);

    if (error) {
      console.error('Error leaving family:', error);
      showToast('Erro ao sair da família', 'error');
      return;
    }

    currentFamily = null;
    familyMembers = [];
    showToast('Você saiu da família', 'success');
    render();
  } catch (error) {
    console.error('Error leaving family:', error);
  }
}

async function deleteFamily() {
  if (!currentUser || !currentFamily) return;

  if (currentFamily.owner_id !== currentUser.id) {
    showToast('Apenas o dono pode excluir a família', 'error');
    return;
  }

  try {
    const { error } = await supabase
      .from('families')
      .delete()
      .eq('id', currentFamily.id);

    if (error) {
      console.error('Error deleting family:', error);
      showToast('Erro ao excluir família', 'error');
      return;
    }

    currentFamily = null;
    familyMembers = [];
    showToast('Família excluída', 'success');
    render();
  } catch (error) {
    console.error('Error deleting family:', error);
  }
}

// ============================================
// Authentication Functions
// ============================================

function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

function validatePassword(password) {
  return password && password.length >= 6;
}

async function login(email, password) {
  if (!email || !password) {
    showToast('Preencha todos os campos', 'error');
    return false;
  }
  
  if (!validateEmail(email)) {
    showToast('E-mail inválido', 'error');
    return false;
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password: password
    });

    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        showToast('E-mail ou senha incorretos', 'error');
      } else {
        showToast('Erro ao fazer login', 'error');
      }
      return false;
    }

    currentUser = data.user;
    await loadUserProfile();
    await loadDataFromSupabase();
    await loadFamily();
    showMainApp();
    const userName = userProfile?.display_name || currentUser.user_metadata?.name || 'Usuário';
    showToast(`Bem-vindo, ${userName}!`, 'success');
    return true;
  } catch (error) {
    console.error('Login error:', error);
    showToast('Erro ao fazer login', 'error');
    return false;
  }
}

async function register(name, email, password, confirmPassword) {
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

  try {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password: password,
      options: {
        data: {
          name: name.trim()
        },
        emailRedirectTo: window.location.origin
      }
    });

    if (error) {
      if (error.message.includes('already registered')) {
        showToast('E-mail já cadastrado', 'error');
      } else {
        showToast('Erro ao criar conta', 'error');
      }
      return false;
    }

    currentUser = data.user;
    incomes = [];
    expenses = [];
    fixedExpenses = [];

    await loadUserProfile();
    showMainApp();
    showToast('Conta criada com sucesso!', 'success');
    return true;
  } catch (error) {
    console.error('Register error:', error);
    showToast('Erro ao criar conta', 'error');
    return false;
  }
}

async function logout() {
  try {
    await supabase.auth.signOut();
  } catch (error) {
    console.error('Logout error:', error);
  }
  
  currentUser = null;
  userProfile = null;
  incomes = [];
  expenses = [];
  fixedExpenses = [];
  currentFamily = null;
  familyMembers = [];
  activeTab = 'home';
  showLoginScreen();
  showToast('Você saiu da conta', 'info');
}

async function resetPassword(email) {
  if (!email) {
    showToast('Digite seu e-mail', 'error');
    return false;
  }

  if (!validateEmail(email)) {
    showToast('E-mail inválido', 'error');
    return false;
  }

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: window.location.origin + '?reset=true'
    });

    if (error) {
      console.error('Reset password error:', error);
      showToast('Erro ao enviar e-mail', 'error');
      return false;
    }

    showToast('E-mail de redefinição enviado!', 'success');
    return true;
  } catch (error) {
    console.error('Reset password error:', error);
    showToast('Erro ao enviar e-mail', 'error');
    return false;
  }
}

async function updatePassword(newPassword) {
  if (!validatePassword(newPassword)) {
    showToast('Senha deve ter no mínimo 6 caracteres', 'error');
    return false;
  }

  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) {
      showToast('Erro ao alterar senha', 'error');
      return false;
    }

    showToast('Senha alterada com sucesso!', 'success');
    return true;
  } catch (error) {
    console.error('Update password error:', error);
    showToast('Erro ao alterar senha', 'error');
    return false;
  }
}

async function updateDisplayName(name) {
  if (!name || name.length < 2 || name.length > 50) {
    showToast('Nome deve ter entre 2 e 50 caracteres', 'error');
    return false;
  }

  // Update auth metadata
  await supabase.auth.updateUser({
    data: { name: name.trim() }
  });

  // Update profile
  const success = await updateUserProfile({ display_name: name.trim() });
  
  if (success) {
    showToast('Nome atualizado!', 'success');
    render();
  }
  
  return success;
}

async function toggleNotifications(enabled) {
  const success = await updateUserProfile({ notifications_enabled: enabled });
  if (success) {
    showToast(enabled ? 'Notificações ativadas' : 'Notificações desativadas', 'success');
  }
  return success;
}

async function toggleEmailNotifications(enabled) {
  const success = await updateUserProfile({ email_notifications: enabled });
  if (success) {
    showToast(enabled ? 'Notificações por e-mail ativadas' : 'Notificações por e-mail desativadas', 'success');
  }
  return success;
}

async function clearAllData() {
  if (!currentUser) return;
  
  incomes = [];
  expenses = [];
  fixedExpenses = [];
  
  await saveDataToSupabase();
  render();
  showToast('Todos os dados foram apagados', 'success');
}

function exportData() {
  if (!currentUser) return;

  const userName = userProfile?.display_name || currentUser.user_metadata?.name || 'Usuario';
  const data = {
    user: {
      name: userName,
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
  a.download = `financas_${userName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;
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
  document.getElementById('forgot-form').reset();
  document.getElementById('register-form').classList.add('hidden');
  document.getElementById('forgot-form').classList.add('hidden');
  document.getElementById('login-form').classList.remove('hidden');
}

function showMainApp() {
  document.getElementById('login-screen').classList.add('hidden');
  document.getElementById('app').classList.remove('hidden');
  document.getElementById('loading').classList.add('hidden');
  
  // Update greeting
  if (currentUser) {
    const userName = userProfile?.display_name || currentUser.user_metadata?.name || 'Usuário';
    const firstName = userName.split(' ')[0];
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

async function addIncome(income) {
  const newIncome = {
    ...income,
    id: generateId(),
    createdAt: new Date().toISOString()
  };
  incomes.push(newIncome);
  await saveDataToSupabase();
  showToast('Entrada adicionada!', 'success');
  render();
}

async function deleteIncome(id) {
  incomes = incomes.filter(i => i.id !== id);
  await saveDataToSupabase();
  showToast('Entrada removida', 'success');
  render();
}

async function addExpense(expense) {
  const newExpense = {
    ...expense,
    id: generateId(),
    createdAt: new Date().toISOString()
  };
  expenses.push(newExpense);
  await saveDataToSupabase();
  showToast('Gasto registrado!', 'success');
  render();
}

async function deleteExpense(id) {
  expenses = expenses.filter(e => e.id !== id);
  await saveDataToSupabase();
  showToast('Gasto removido', 'success');
  render();
}

async function addFixedExpense(fixed) {
  const newFixed = {
    ...fixed,
    id: generateId(),
    createdAt: new Date().toISOString()
  };
  fixedExpenses.push(newFixed);
  await saveDataToSupabase();
  showToast('Despesa fixa adicionada!', 'success');
  render();
}

async function deleteFixedExpense(id) {
  fixedExpenses = fixedExpenses.filter(f => f.id !== id);
  await saveDataToSupabase();
  showToast('Despesa fixa removida', 'success');
  render();
}

async function toggleFixedPaid(id) {
  const fixed = fixedExpenses.find(f => f.id === id);
  if (fixed) {
    fixed.isPaid = !fixed.isPaid;
    await saveDataToSupabase();
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

  const userName = userProfile?.display_name || currentUser.user_metadata?.name || 'Usuário';
  const userEmail = currentUser.email || '';
  const avatarUrl = userProfile?.avatar_url || null;
  const notificationsEnabled = userProfile?.notifications_enabled !== false;
  const emailNotificationsEnabled = userProfile?.email_notifications !== false;

  // Calculate stats
  const totalIncome = incomes.reduce((sum, i) => sum + i.amount, 0);
  const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0) + fixedExpenses.filter(f => f.isPaid).reduce((sum, f) => sum + f.amount, 0);
  const totalTransactions = incomes.length + expenses.length + fixedExpenses.length;
  const months = new Set([...incomes.map(i => i.date.substring(0, 7)), ...expenses.map(e => e.date.substring(0, 7)), ...fixedExpenses.map(f => f.month)]);

  const avatarHTML = avatarUrl 
    ? `<img src="${avatarUrl}" alt="Avatar" class="profile-avatar-img" />`
    : `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
      </svg>`;

  container.innerHTML = `
    <div class="profile-section animate-slide-up">
      <!-- Profile Card -->
      <div class="profile-card">
        <div class="profile-avatar" onclick="document.getElementById('avatar-input').click()">
          ${avatarHTML}
          <div class="avatar-edit-overlay">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
              <circle cx="12" cy="13" r="4"/>
            </svg>
          </div>
          <input type="file" id="avatar-input" accept="image/*" hidden onchange="handleAvatarChange(event)">
        </div>
        <div class="profile-info">
          <h3>${userName}</h3>
          <p>${userEmail}</p>
        </div>
        <button class="btn btn-sm btn-ghost" onclick="openModal('edit-name')">Editar</button>
      </div>

      <!-- Family Card -->
      <div class="card">
        <h4 class="section-title">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 0.5rem; color: var(--primary);">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          Família
        </h4>
        ${currentFamily ? renderFamilyInfo() : renderFamilyEmpty()}
      </div>

      <!-- Notifications -->
      <div class="card">
        <h4 class="section-title">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 0.5rem; color: var(--primary);">
            <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/>
            <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
          </svg>
          Notificações
        </h4>
        <div class="settings-list">
          <div class="toggle-item">
            <div class="toggle-info">
              <span class="toggle-label">Notificações push</span>
              <span class="toggle-description">Receba alertas sobre vencimentos</span>
            </div>
            <label class="toggle-switch">
              <input type="checkbox" ${notificationsEnabled ? 'checked' : ''} onchange="toggleNotifications(this.checked)">
              <span class="toggle-slider"></span>
            </label>
          </div>
          <div class="toggle-item">
            <div class="toggle-info">
              <span class="toggle-label">Notificações por e-mail</span>
              <span class="toggle-description">Resumo semanal por e-mail</span>
            </div>
            <label class="toggle-switch">
              <input type="checkbox" ${emailNotificationsEnabled ? 'checked' : ''} onchange="toggleEmailNotifications(this.checked)">
              <span class="toggle-slider"></span>
            </label>
          </div>
        </div>
      </div>

      <!-- Security -->
      <div class="card">
        <h4 class="section-title">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 0.5rem; color: var(--primary);">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/>
          </svg>
          Segurança
        </h4>
        <div class="settings-list">
          <button class="profile-action-btn" onclick="openModal('password')">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            <span>Alterar Senha</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg>
          </button>
          <button class="profile-action-btn" onclick="openModal('reset-password-email')">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect width="20" height="16" x="2" y="4" rx="2"/>
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
            </svg>
            <span>Redefinir Senha por E-mail</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg>
          </button>
        </div>
      </div>

      <!-- Data Management -->
      <div class="card">
        <h4 class="section-title">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 0.5rem; color: var(--primary);">
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
          Configurações
        </h4>
        <div class="settings-list">
          <button class="profile-action-btn" onclick="exportData()">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" x2="12" y1="15" y2="3"/>
            </svg>
            <span>Exportar Dados</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg>
          </button>
          <button class="profile-action-btn danger" onclick="confirmClearData()">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 6h18"/>
              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
            </svg>
            <span>Limpar Todos os Dados</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg>
          </button>
        </div>
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

      <p class="app-version">FinFamily v1.0.0 • Dados salvos na nuvem</p>
    </div>
  `;
}

function renderFamilyEmpty() {
  return `
    <p class="family-description">Gerencie os membros da sua família e compartilhe o controle financeiro.</p>
    <div class="family-actions">
      <button class="btn btn-primary btn-sm" onclick="openModal('create-family')">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M5 12h14"/>
          <path d="M12 5v14"/>
        </svg>
        Criar Família
      </button>
      <button class="btn btn-outline btn-sm" onclick="openModal('join-family')">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <line x1="19" x2="19" y1="8" y2="14"/>
          <line x1="22" x2="16" y1="11" y2="11"/>
        </svg>
        Entrar com Código
      </button>
    </div>
  `;
}

function renderFamilyInfo() {
  const isOwner = currentFamily.owner_id === currentUser.id;
  
  const membersHTML = familyMembers.map(m => {
    const name = m.profiles?.display_name || 'Membro';
    const avatar = m.profiles?.avatar_url;
    const isMe = m.user_id === currentUser.id;
    const roleLabel = m.role === 'owner' ? 'Dono' : m.role === 'admin' ? 'Admin' : '';
    
    return `
      <div class="family-member">
        <div class="family-member-avatar">
          ${avatar ? `<img src="${avatar}" alt="${name}" />` : name.charAt(0).toUpperCase()}
        </div>
        <span class="family-member-name">${name}${isMe ? ' (você)' : ''}</span>
        ${roleLabel ? `<span class="family-member-role">${roleLabel}</span>` : ''}
      </div>
    `;
  }).join('');

  return `
    <div class="family-info">
      <div class="family-name-row">
        <h3 class="family-name">${currentFamily.name}</h3>
        <span class="family-badge">${familyMembers.length} membro${familyMembers.length !== 1 ? 's' : ''}</span>
      </div>
      <div class="invite-code-section">
        <span class="invite-label">Código de convite:</span>
        <div class="invite-code-box">
          <code class="invite-code">${currentFamily.invite_code}</code>
          <button class="btn-copy" onclick="copyInviteCode('${currentFamily.invite_code}')">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
              <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
            </svg>
          </button>
        </div>
      </div>
      <div class="family-members-list">
        <span class="family-members-label">Membros:</span>
        ${membersHTML}
      </div>
    </div>
    <div class="family-actions" style="margin-top: 1rem;">
      ${isOwner ? `
        <button class="btn btn-danger btn-sm" onclick="confirmDeleteFamily()">Excluir Família</button>
      ` : `
        <button class="btn btn-outline btn-sm" onclick="confirmLeaveFamily()">Sair da Família</button>
      `}
    </div>
  `;
}

function copyInviteCode(code) {
  navigator.clipboard.writeText(code).then(() => {
    showToast('Código copiado!', 'success');
  }).catch(() => {
    showToast('Erro ao copiar', 'error');
  });
}

async function handleAvatarChange(event) {
  const file = event.target.files[0];
  if (!file) return;

  if (file.size > 2 * 1024 * 1024) {
    showToast('Imagem muito grande. Máximo 2MB.', 'error');
    return;
  }

  showToast('Enviando foto...', 'info');
  const url = await uploadAvatar(file);
  if (url) {
    showToast('Foto atualizada!', 'success');
    render();
  }
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

function confirmLeaveFamily() {
  document.getElementById('confirm-title').textContent = 'Sair da Família';
  document.getElementById('confirm-message').textContent = `Tem certeza que deseja sair da família "${currentFamily.name}"?`;
  confirmCallback = leaveFamily;
  openModal('confirm');
}

function confirmDeleteFamily() {
  document.getElementById('confirm-title').textContent = 'Excluir Família';
  document.getElementById('confirm-message').textContent = `Tem certeza que deseja excluir a família "${currentFamily.name}"? Todos os membros serão removidos.`;
  confirmCallback = deleteFamily;
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
  if (!modal) return;
  
  modal.classList.remove('hidden');
  
  // Set default date to today
  const today = new Date().toISOString().split('T')[0];
  if (type === 'income') {
    document.getElementById('income-date').value = today;
  } else if (type === 'expense') {
    document.getElementById('expense-date').value = today;
  } else if (type === 'edit-name') {
    document.getElementById('edit-display-name').value = userProfile?.display_name || currentUser?.user_metadata?.name || '';
  }
}

function closeModal(type) {
  const modal = document.getElementById(`modal-${type}`);
  if (!modal) return;
  
  modal.classList.add('hidden');
  
  // Reset form
  const form = modal.querySelector('form');
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

  // Password form
  document.getElementById('form-password').addEventListener('submit', async (e) => {
    e.preventDefault();
    const newPass = document.getElementById('new-password').value;
    const confirm = document.getElementById('confirm-password').value;
    
    if (newPass !== confirm) {
      showToast('As senhas não coincidem', 'error');
      return;
    }
    
    if (await updatePassword(newPass)) {
      closeModal('password');
    }
  });

  // Edit name form
  document.getElementById('form-edit-name').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('edit-display-name').value;
    if (await updateDisplayName(name)) {
      closeModal('edit-name');
    }
  });

  // Create family form
  document.getElementById('form-create-family').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('family-name').value;
    if (await createFamily(name)) {
      closeModal('create-family');
    }
  });

  // Join family form
  document.getElementById('form-join-family').addEventListener('submit', async (e) => {
    e.preventDefault();
    const code = document.getElementById('invite-code').value;
    if (await joinFamily(code)) {
      closeModal('join-family');
    }
  });

  // Reset password email form
  document.getElementById('form-reset-email').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = currentUser?.email || '';
    if (await resetPassword(email)) {
      closeModal('reset-password-email');
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
    document.getElementById('forgot-form').classList.add('hidden');
    document.getElementById('register-form').classList.remove('hidden');
  });

  document.getElementById('show-login').addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('register-form').classList.add('hidden');
    document.getElementById('forgot-form').classList.add('hidden');
    document.getElementById('login-form').classList.remove('hidden');
  });

  document.getElementById('show-forgot').addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('login-form').classList.add('hidden');
    document.getElementById('register-form').classList.add('hidden');
    document.getElementById('forgot-form').classList.remove('hidden');
  });

  document.getElementById('back-to-login').addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('forgot-form').classList.add('hidden');
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

  // Forgot password form
  document.getElementById('forgot-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('forgot-email').value;
    if (await resetPassword(email)) {
      document.getElementById('forgot-form').classList.add('hidden');
      document.getElementById('login-form').classList.remove('hidden');
    }
  });
}

// ============================================
// Initialize App
// ============================================

async function init() {
  // Check for password reset
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('reset') === 'true') {
    // User is resetting password, they should be logged in via magic link
    showToast('Você pode alterar sua senha agora', 'info');
    window.history.replaceState({}, document.title, window.location.pathname);
  }

  // Setup auth state listener BEFORE getSession
  supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_IN' && session?.user) {
      currentUser = session.user;
      await loadUserProfile();
      await loadDataFromSupabase();
      await loadFamily();
      showMainApp();
    } else if (event === 'SIGNED_OUT') {
      currentUser = null;
      userProfile = null;
      incomes = [];
      expenses = [];
      fixedExpenses = [];
      currentFamily = null;
      familyMembers = [];
      showLoginScreen();
    }
  });

  setupAuthHandlers();
  setupNavigation();
  setupFormHandlers();

  // Check for existing session
  const { data: { session } } = await supabase.auth.getSession();
  
  if (session?.user) {
    currentUser = session.user;
    await loadUserProfile();
    await loadDataFromSupabase();
    await loadFamily();
    showMainApp();
  } else {
    showLoginScreen();
  }
}

// Start the app
document.addEventListener('DOMContentLoaded', init);
