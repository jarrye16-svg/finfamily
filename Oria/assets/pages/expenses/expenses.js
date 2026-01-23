// =============================================
// Oria • Contas da Casa (Despesas)
// Conectado ao Supabase real
// =============================================

document.addEventListener("DOMContentLoaded", async () => {
  console.log("[Oria] Contas da Casa carregada (Supabase real)");

  await window.waitSupabase();

  // Elementos
  const currentMonthEl = document.getElementById("currentMonth");
  const expensesContainer = document.getElementById("expensesList");
  const totalValueEl = document.getElementById("totalValue");
  const form = document.getElementById("expenseForm");
  const descInput = document.getElementById("desc");
  const valueInput = document.getElementById("value");

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

  // ==============================
  // Renderização do mês atual
  // ==============================
  function renderMonth() {
    const monthName = monthNames[currentDate.getMonth()];
    const year = currentDate.getFullYear();
    currentMonthEl.innerText = `${monthName} de ${year}`;
  }

  renderMonth();

  // ==============================
  // Carrega despesas reais
  // ==============================
  async function loadExpenses() {
    try {
      const { data: { user }, error: userError } = await window.supabase.auth.getUser();
      if (userError) throw userError;

      if (!user) {
        console.warn("[Oria] Nenhum usuário logado. Redirecionando...");
        window.location.href = "/finfamily/Oria/assets/pages/login/login.html";
        return;
      }

      const { month, year } = extractMonthYear(currentDate);

      const { data, error } = await window.supabase
        .from("transactions")
        .select("id, title, amount, date")
        .eq("user_id", user.id)
        .eq("month", month)
        .eq("year", year)
        .eq("type", "expense")
        .order("date", { ascending: false });

      if (error) throw error;

      renderExpenses(data);
    } catch (err) {
      console.error("[Oria] Erro ao carregar despesas:", err);
      expensesContainer.innerHTML =
        '<li class="error">Erro ao carregar despesas.</li>';
      totalValueEl.innerText = "R$ 0,00";
    }
  }

  // ==============================
  // Renderiza lista e total
  // ==============================
  function renderExpenses(data) {
    expensesContainer.innerHTML = "";
    let total = 0;

    if (!data || data.length === 0) {
      expensesContainer.innerHTML =
        '<li class="empty">Nenhuma despesa registrada.</li>';
      totalValueEl.innerText = "R$ 0,00";
      return;
    }

    data.forEach((item) => {
      const li = document.createElement("li");
      li.classList.add("expense-item");
      li.innerHTML = `
        <span>${item.title}</span>
        <strong>${formatCurrency(item.amount)}</strong>
      `;
      expensesContainer.appendChild(li);
      total += Number(item.amount) || 0;
    });

    totalValueEl.innerText = formatCurrency(total);
  }

  // ==============================
  // Adicionar nova despesa real
  // ==============================
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const desc = descInput.value.trim();
    const value = parseFloat(valueInput.value);

    if (!desc || isNaN(value)) {
      alert("Preencha os campos corretamente.");
      return;
    }

    try {
      const { data: { user }, error: userError } = await window.supabase.auth.getUser();
      if (userError) throw userError;

      const { month, year } = extractMonthYear(currentDate);
      const date = new Date().toISOString();

      const { error } = await window.supabase.from("transactions").insert([
        {
          user_id: user.id,
          type: "expense",
          title: desc,
          amount: value,
          month,
          year,
          date,
        },
      ]);

      if (error) throw error;

      console.log("[Oria] Nova despesa salva:", desc, value);
      descInput.value = "";
      valueInput.value = "";
      await loadExpenses();
    } catch (err) {
      console.error("[Oria] Erro ao adicionar despesa:", err);
      alert("Erro ao adicionar despesa. Tente novamente.");
    }
  });

  // ==============================
  // Navegação entre meses
  // ==============================
  document.getElementById("prevMonth").addEventListener("click", () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderMonth();
    loadExpenses();
  });

  document.getElementById("nextMonth").addEventListener("click", () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderMonth();
    loadExpenses();
  });

  // Inicializa
  await loadExpenses();
});
