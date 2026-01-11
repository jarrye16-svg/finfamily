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

  const { data: resumo } = await supabase
    .rpc("get_monthly_summary", { target_year: year, target_month: month });

  const r = resumo?.[0];

  document.getElementById("entradas").textContent =
    r ? `R$ ${r.total_entradas}` : "R$ 0,00";

  document.getElementById("gastos").textContent =
    r ? `R$ ${r.total_gastos}` : "R$ 0,00";

  document.getElementById("saldo").textContent =
    r ? `R$ ${r.saldo}` : "R$ 0,00";

  const historyBox = document.getElementById("history");
  historyBox.innerHTML = "";

  const { data: history } = await supabase
    .rpc("get_recent_transactions", { target_year: year, target_month: month });

  if (history && history.length > 0) {
    document.getElementById("empty").style.display = "none";

    history.forEach(tx => {
      const div = document.createElement("div");
      div.className = `item ${tx.type}`;
      div.innerHTML = `
        <div>
          <strong>${tx.title}</strong><br/>
          <small>${new Date(tx.date).toLocaleDateString()}</small>
        </div>
        <div>R$ ${tx.amount}</div>
      `;
      historyBox.appendChild(div);
    });
  } else {
    document.getElementById("empty").style.display = "block";
  }
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
