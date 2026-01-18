// ========================================
// ORIA • HOME
// Visão Geral - Supabase Only
// ========================================

import { supabase } from '/Oria/assets/core/supabase.js';

// ----------------------------------------
// Estado
// ----------------------------------------
let currentMonth = new Date();
let userId = null;

// ----------------------------------------
// Utilitários
// ----------------------------------------
const monthNames = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril',
  'Maio', 'Junho', 'Julho', 'Agosto',
  'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

function formatCurrency(value = 0) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

function getMonthKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

function getMonthLabel(date) {
  return `${monthNames[date.getMonth()]} de ${date.getFullYear()}`;
}

// ----------------------------------------
// Autenticação
// ----------------------------------------
async function loadUser() {
  const { data, error } = await supabase.auth.getUser();

  if (error || !data?.user) {
    // Se quiser trocar o caminho do login, ajuste aqui:
    window.location.href = '/Oria/pages/login/login.html';
    return;
  }

  userId = data.user.id;
}

// ----------------------------------------
// Mês (Supabase)
// ----------------------------------------
async function loadSavedMonth() {
  const { data, error } = await supabase
    .from('user_settings')
    .select('current_month')
    .eq('user_id', userId)
    .single();

  // Se não existir settings ainda, segue com mês atual
  if (!error && data?.current_month) {
    const [year, month] = data.current_month.split('-');
    currentMonth = new Date(Number(year), Number(month) - 1, 1);
  }

  updateMonthDisplay();
}

async function saveCurrentMonth() {
  const monthKey = getMonthKey(currentMonth);

  await supabase
    .from('user_settings')
    .upsert({
      user_id: userId,
      current_month: monthKey
    });
}

// ----------------------------------------
// Navegação de mês
// ----------------------------------------
window.navigateMonth = async function (direction) {
  const newMonth = new Date(currentMonth);
  newMonth.setMonth(newMonth.getMonth() + direction);

  // Bloqueia mês futuro
  const now = new Date();
  const maxMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  if (newMonth > maxMonth) return;

  currentMonth = newMonth;

  updateMonthDisplay();
  await saveCurrentMonth();
  await loadMonthData();
};

function updateMonthDisplay() {
  const el = document.getElementById('monthName');
  if (el) el.textContent = getMonthLabel(currentMonth);
}

// ----------------------------------------
// Carregamento de dados
// ----------------------------------------
async function loadMonthData() {
  const monthKey = getMonthKey(currentMonth);

  // ✅ Rendas
  const { data: incomes } = await supabase
    .from('income')
    .select('amount')
    .eq('user_id', userId)
    .eq('month', monthKey);

  const totalIncome = incomes?.reduce((sum, i) => sum + (Number(i.amount) || 0), 0) || 0;

  // ✅ Contas da casa
  const { data: expenses } = await supabase
    .from('expenses')
    .select('amount, paid')
    .eq('user_id', userId)
    .eq('month', monthKey);

  const totalExpenses = expenses?.reduce((s, e) => s + (Number(e.amount) || 0), 0) || 0;
  const openExpenses = expenses
    ?.filter(e => e.paid === false)
    .reduce((s, e) => s + (Number(e.amount) || 0), 0) || 0;

  // ✅ Cartões
  const { data: cardExpenses } = await supabase
    .from('card_expenses')
    .select('amount, paid')
    .eq('user_id', userId)
    .eq('month', monthKey);

  const totalCards = cardExpenses?.reduce((s, c) => s + (Number(c.amount) || 0), 0) || 0;
  const openCards = cardExpenses
    ?.filter(c => c.paid === false)
    .reduce((s, c) => s + (Number(c.amount) || 0), 0) || 0;

  // ✅ Cálculos finais
  const totalMonth = totalExpenses + totalCards;
  const openAmount = openExpenses + openCards;
  const finalBalance = totalIncome - totalMonth;

  updateUI({
    totalMonth,
    openAmount,
    totalCards,
    finalBalance
  });
}

// ----------------------------------------
// UI
// ----------------------------------------
function updateUI(data) {
  setValue('totalMonth', data.totalMonth);
  setValue('openAmount', data.openAmount);
  setValue('cardsAmount', data.totalCards);
  setValue('finalBalance', data.finalBalance);
}

function setValue(id, value) {
  const el = document.getElementById(id);
  if (!el) return;

  el.textContent = formatCurrency(value);

  // Só saldo final muda cor
  if (id === 'finalBalance') {
    el.classList.remove('positive', 'negative');
    el.classList.add(value < 0 ? 'negative' : 'positive');
  }
}

// ----------------------------------------
// Inicialização
// ----------------------------------------
document.addEventListener('DOMContentLoaded', async () => {
  await loadUser();
  await loadSavedMonth();
  await loadMonthData();
});
