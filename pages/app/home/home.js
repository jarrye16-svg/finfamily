import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabase = createClient(
  "https://gelhizmssqlexlxkvufc.supabase.co",
  "sb_publishable_AstKmfIU-pBBXXfPDlw9HA_hQYfLqcb"
);

const saldoEl = document.getElementById("saldo");
const entradasEl = document.getElementById("entradas");
const saidasEl = document.getElementById("saidas");

async function loadSummary() {
  const { data: session } = await supabase.auth.getSession();

  if (!session.session) {
    window.location.href = "../../login/login.html";
    return;
  }

  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + 1;

  const { data, error } = await supabase
    .rpc("get_monthly_summary", { year, month });

  if (error || !data) return;

  saldoEl.textContent = `R$ ${Number(data.saldo || 0).toFixed(2)}`;
  entradasEl.textContent = `R$ ${Number(data.total_entradas || 0).toFixed(2)}`;
  saidasEl.textContent = `R$ ${Number(data.total_saidas || 0).toFixed(2)}`;
}

loadSummary();

// MODAL ENTRADA
const entradaBtn = document.querySelector('.action-btn.green');
const modal = document.getElementById('entradaModal');
const closeBtn = document.getElementById('closeEntrada');
const cancelBtn = document.getElementById('cancelEntrada');

entradaBtn.addEventListener('click', () => {
  modal.classList.add('active');
});

closeBtn.addEventListener('click', () => {
  modal.classList.remove('active');
});

cancelBtn.addEventListener('click', () => {
  modal.classList.remove('active');
});

// Seleção de tipo
document.querySelectorAll('.type').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.type').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  });
});
