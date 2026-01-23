// =============================================
// Oria • Home (Visão Geral)
// Integração real com Supabase
// =============================================

document.addEventListener("DOMContentLoaded", async () => {
  console.log("[Oria] Home carregada");

  // Aguarda o Supabase estar pronto
  await window.waitSupabase();

  // Seletores principais
  const incomeValue = document.getElementById("incomeValue");
  const expenseValue = document.getElementById("expenseValue");
  const creditValue = document.getElementById("creditValue");
  const balanceValue = document.getElementById("balanceValue");
  const currentMonthEl = document.getElementById("currentMonth");

  // Controle de mês
  const monthNames = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];
  let currentDate = new Date();

  // ==============================
  // Renderização do mês atual
  // ==============================
  function renderMonth() {
    const monthName = monthNames[currentDate.getMonth()];
    const year = currentDate.getFullYear();
    currentMonthEl.innerText = `${monthName} de ${year}`;
  }

  // ==============================
  // Helpers
  // ==============================
  function toCurrency(value) {
    return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }

  function extractMonthYear(date) {
    return {
      month: (date.getMonth() + 1).toString().padStart(2, "0"),
      year: date.getFullYear().toString()
    };
  }

  // ==============================
  // Carrega resumo do mês
  // ==============================
  async function loadSummary() {
    try {
      const { data: { user } } = await window.supabase.auth.getUser();
      if (!user) {
        console.warn("[Oria] Nenhum usuário logado. Redirecionando...");
        window.location.href = "/finfamily/Oria/assets/pages/login/login.html";
        return;
      }

      const { month, year } = extractMonthYear(currentDate);
      console.log(`[Oria] Carregando dados de ${month}/${year} para ${user.email}`);

      // Consulta na tabela "transactions"
      const { data, error } = await window.supabase
        .from("transactions")
        .select("type, amount")
        .eq("user_id", user.id)
        .eq("month", month)
        .eq("year", year);

      if (error) throw error;

      // Calcula totais
      let totalIncome = 0;
      let totalExpense = 0;
      let totalCards = 0;

      (data || []).forEach(tx => {
        const val = Number(tx.amount) || 0;
        if (tx.type === "income") totalIncome += val;
        else if (tx.type === "expense") totalExpense += val;
        else if (tx.type === "card") totalCards += val;
      });

      const balance = totalIncome - totalExpense - totalCards;

      // Atualiza na tela
      incomeValue.innerText = toCurrency(totalIncome);
      expenseValue.innerText = toCurrency(totalExpense);
      creditValue.innerText = toCurrency(totalCards);
      balanceValue.innerText = toCurrency(balance);

    } catch (err) {
      console.error("[Oria] Erro ao carregar resumo:", err);
      incomeValue.innerText = "R$ 0,00";
      expenseValue.innerText = "R$ 0,00";
      creditValue.innerText = "R$ 0,00";
      balanceValue.innerText = "R$ 0,00";
    }
  }

  // ==============================
  // Navegação de mês
  // ==============================
  document.getElementById("prevMonth").addEventListener("click", () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderMonth();
    loadSummary();
  });

  document.getElementById("nextMonth").addEventListener("click", () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderMonth();
    loadSummary();
  });

  // ==============================
  // Inicialização
  // ==============================
  renderMonth();
  await loadSummary();

  // ==============================
  // Atalhos
  // ==============================
  const go = (path) => (window.location.href = `/finfamily/Oria/assets/pages/${path}/${path}.html`);

  document.getElementById("btnExpenses").addEventListener("click", () => go("expenses"));
  document.getElementById("btnIncome").addEventListener("click", () => go("income"));
  document.getElementById("btnPiggy").addEventListener("click", () => go("piggy"));
  document.getElementById("btnCards").addEventListener("click", () => go("cards"));
});
