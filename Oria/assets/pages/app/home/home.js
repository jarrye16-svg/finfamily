// =============================================
// Oria • Página Home
// =============================================

// Aguarda o Supabase estar disponível
async function waitSupabaseReady() {
  while (!window.supabase) {
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  console.log('[Oria] Página Home carregada');

  // Espera Supabase
  await waitSupabaseReady();

  // Elementos principais
  const currentMonthEl = document.getElementById('currentMonth');
  const incomeValue = document.getElementById('incomeValue');
  const expenseValue = document.getElementById('expenseValue');
  const creditValue = document.getElementById('creditValue');
  const balanceValue = document.getElementById('balanceValue');

  // ===========================
  // Controle de Mês
  // ===========================
  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  let currentDate = new Date();

  function renderMonth() {
    if (!currentMonthEl) return console.warn('[Oria] #currentMonth não encontrado.');

    const monthName = monthNames[currentDate.getMonth()];
    const year = currentDate.getFullYear();
    currentMonthEl.innerText = `${monthName} de ${year}`;
  }

  const btnPrev = document.getElementById('prevMonth');
  const btnNext = document.getElementById('nextMonth');

  if (btnPrev) {
    btnPrev.addEventListener('click', () => {
      currentDate.setMonth(currentDate.getMonth() - 1);
      renderMonth();
      loadSummary();
    });
  }

  if (btnNext) {
    btnNext.addEventListener('click', () => {
      currentDate.setMonth(currentDate.getMonth() + 1);
      renderMonth();
      loadSummary();
    });
  }

  renderMonth();

  // ===========================
  // Carregar dados do usuário
  // ===========================
  async function loadSummary() {
    try {
      const { data: { user } } = await window.supabase.auth.getUser();
      if (!user) {
        console.warn('[Oria] Nenhum usuário logado. Redirecionando...');
        window.location.href = '/finfamily/Oria/assets/pages/login/login.html';
        return;
      }

      console.log('[Oria] Usuário logado:', user.email);

      // Exemplo estático (pode integrar com Supabase futuramente)
      if (incomeValue) incomeValue.innerText = 'R$ 5.000,00';
      if (expenseValue) expenseValue.innerText = 'R$ 2.350,00';
      if (creditValue) creditValue.innerText = 'R$ 800,00';
      if (balanceValue) balanceValue.innerText = 'R$ 2.650,00';
    } catch (err) {
      console.error('[Oria] Erro ao carregar resumo:', err);
    }
  }

  await loadSummary();

  // ===========================
  // Atalhos de Navegação
  // ===========================
  const btnExpenses = document.getElementById('btnExpenses');
  const btnIncome = document.getElementById('btnIncome');
  const btnPiggy = document.getElementById('btnPiggy');
  const btnCards = document.getElementById('btnCards');

  if (btnExpenses) {
    btnExpenses.addEventListener('click', () => {
      window.location.href = '/finfamily/Oria/assets/pages/expenses/expenses.html';
    });
  }

  if (btnIncome) {
    btnIncome.addEventListener('click', () => {
      window.location.href = '/finfamily/Oria/assets/pages/income/income.html';
    });
  }

  if (btnPiggy) {
    btnPiggy.addEventListener('click', () => {
      window.location.href = '/finfamily/Oria/assets/pages/piggy/piggy.html';
    });
  }

  if (btnCards) {
    btnCards.addEventListener('click', () => {
      window.location.href = '/finfamily/Oria/assets/pages/cards/cards.html';
    });
  }
});
