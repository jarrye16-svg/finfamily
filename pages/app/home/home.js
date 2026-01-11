import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabase = createClient(
  "https://gelhizmssqlexlxkvufc.supabase.co",
  "sb_publishable_AstKmfIU-pBBXXfPDlw9HA_hQYfLqcb"
);

// Proteção de sessão
const { data: sessionData } = await supabase.auth.getSession();
if (!sessionData.session) {
  window.location.href = "/finfamily/pages/login/login.html";
}

// Datas
let current = new Date();
const label = document.getElementById("monthLabel");

function formatMonth(date) {
  return date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

async function loadData() {
  label.textContent = formatMonth(current);

  const year = current.getFullYear();
  const month = current.getMonth() + 1;

  const { data } = await supabase
    .rpc("get_monthly_summary", { target_year: year, target_month: month });

  const resumo = data?.[0];

  document.getElementById("entradas").textContent =
    resumo ? `R$ ${resumo.total_entradas}` : "R$ 0,00";

  document.getElementById("gastos").textContent =
    resumo ? `R$ ${resumo.total_gastos}` : "R$ 0,00";

  document.getElementById("saldo").textContent =
    resumo ? `R$ ${resumo.saldo}` : "R$ 0,00";

  document.getElementById("empty").style.display =
    resumo && (resumo.total_entradas || resumo.total_gastos)
      ? "none"
      : "block";
}

document.getElementById("prevMonth").onclick = () => {
  current.setMonth(current.getMonth() - 1);
  loadData();
};

document.getElementById("nextMonth").onclick = () => {
  current.setMonth(current.getMonth() + 1);
  loadData();
};

loadData();
