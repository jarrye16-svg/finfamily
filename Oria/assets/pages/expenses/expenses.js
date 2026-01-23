// =============================================
// Oria • Página de Despesas
// =============================================

// Aguarda Supabase carregar
async function waitSupabaseReady() {
  while (!window.supabase) {
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  console.log('[Oria] Página de despesas carregada');

  await waitSupabaseReady();

  const currentMonthEl = document.getElementById('currentMonth');
  const expensesContainer = document.getElementById('expensesContainer');
  const totalValueEl = document.getElementById('totalValue');
  const form = document.getElementById('expenseForm');
  const descInput = document.getElementById('desc');
  const valueInput = document.getElementById('value');

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  let currentDate = new Date();

  // Renderiza o mês atual
  function renderMonth() {
    const monthName = monthNames[currentDate.getMonth()];
    currentMonthEl.innerText = `${monthName} de ${currentDate.getFullYear()}`;
  }

  renderMonth();

  // Navegação entre meses
  document.getElementById('prevMonth').addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderMonth();
    loadExpenses();
  });

  document.getElementById('nextMonth').addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderMonth();
    loadExpenses();
  });

  // ===========================
  // Funções principais
  // ===========================
  async function loadExpenses() {
    try {
      const { data: { user } } = await window.supabase.auth.getUser();
      if (!user) {
        window.location.href = '/finfamily/Oria/assets/pages/login/login.html';
        return;
      }

      // Aqui você pode substituir pela tabela real
      // const { data, error } = await window.supabase
      //   .from('expenses')
      //   .select('*')
      //   .eq('user_id', user.id);

      // Simulação de dados locais
      const fakeData = [
        { desc: 'Energia elétrica', value: 180.0 },
        { desc: 'Supermercado', value: 340.5 },
        { desc: 'Internet', value: 120.0 }
      ];

      renderExpenses(fakeData);
    } catch (err) {
      console.error('[Oria] Erro ao carregar despesas:', err);
    }
  }

  function renderExpenses(data) {
    expensesContainer.innerHTML = '';
    let total = 0;

    if (!data || data.length === 0) {
      expensesContainer.innerHTML = '<li>Nenhuma despesa registrada.</li>';
      totalValueEl.innerText = 'R$ 0,00';
      return;
    }

    data.forEach((item) => {
      const li = document.createElement('li');
      li.innerHTML = `
        <span>${item.desc}</span>
        <strong>R$ ${item.value.toFixed(2)}</strong>
      `;
      expensesContainer.appendChild(li);
      total += item.value;
    });

    totalValueEl.innerText = `R$ ${total.toFixed(2)}`;
  }

  // Adicionar nova despesa
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const desc = descInput.value.trim();
    const value = parseFloat(valueInput.value);

    if (!desc || isNaN(value)) {
      alert('Preencha todos os campos corretamente.');
      return;
    }

    // Aqui você pode salvar no Supabase
    // const { error } = await window.supabase
    //   .from('expenses')
    //   .insert([{ user_id: user.id, desc, value }]);

    console.log(`[Oria] Nova despesa adicionada: ${desc} - R$${value}`);
    descInput.value = '';
    valueInput.value = '';

    loadExpenses();
  });

  await loadExpenses();
});
