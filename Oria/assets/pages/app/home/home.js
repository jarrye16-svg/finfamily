// =============================================
// Oria • Home (Visão Geral)
// Conectado ao Supabase real
// =============================================

document.addEventListener("DOMContentLoaded", async () => {
  console.log("[Oria] Home carregada (modo Supabase real)");

  // Aguarda o Supabase
  await window.waitSupabase();

  // Elementos principais
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

  const formatCurrency = (n) =>
    n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const extractMonthYear = (d) => ({
    month: (d.getMonth() + 1).toString().padStart(2, "0"),
    year: d.getFullYear().toString(),
  });

  // Atualiza o título do mês
  function renderMonth() {
    const monthName = monthNames[currentDate.getMonth()];
    const year = currentDate.getFullYear();
    currentMonthEl.innerText = `${monthName} de ${year}`;
  }

  renderMonth();

  // ==============================
  // Carrega resumo real
  // ==============================
  async function loadSummary() {
    try {
      const { data: { user }, error: userError } = await window.supabase.auth.getUser();
      if (userError) throw userError;

      if (!user) {
        console.warn("[Oria] Nenhum usuário logado. Redirecionando...");
        window.location.href = "/finfamily/Oria/assets/pages/login/login.html";
        return;
      }

      const { month, year } = extractMonthYear(currentDate);

      // Consulta transações reais
      const { data, error } = await window.supabase
        .from("transactions")
        .select("type, amount")
        .eq("user_id", user.id)
        .eq("month", month)
        .eq("year", year);

      if (error) throw error;

      console.log(`[Oria] ${data?.length || 0} transações encontradas.`);

      let totalIncome = 0;
      let totalExpense = 0;
      let totalCards = 0;

      (data || []).forEach((tx) => {
        const val = Number(tx.amount) || 0;
        switch (tx.type) {
          case "income":
            totalIncome += val;
            break;
          case "expense":
            totalExpense += val;
            break;
          case "card":
            totalCards += val;
            break;
        }
      });

      const balance = totalIncome - totalExpense - totalCards;

      incomeValue.textContent = formatCurrency(totalIncome);
      expenseValue.textContent = formatCurrency(totalExpense);
      creditValue.textContent = formatCurrency(totalCards);
      balanceValue.textContent = formatCurrency(balance);
    } catch (err) {
      console.error("[Oria] Erro ao carregar resumo:", err);
      incomeValue.textContent = "R$ 0,00";
      expenseValue.textContent = "R$ 0,00";
      creditValue.textContent = "R$ 0,00";
      balanceValue.textContent = "R$ 0,00";
    }
  }

  // Navegação entre meses
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

  // Inicializa
  await loadSummary();

  // ==============================
  // Atalhos
  // ==============================
  const go = (path) =>
    (window.location.href = `/finfamily/Oria/assets/pages/${path}/${path}.html`);

  document.getElementById("btnExpenses").addEventListener("click", () => go("expenses"));
  document.getElementById("btnIncome").addEventListener("click", () => go("income"));
  document.getElementById("btnPiggy").addEventListener("click", () => go("piggy"));
  document.getElementById("btnCards").addEventListener("click", () => go("cards"));
});
