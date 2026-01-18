// ======================================================
// ORIA • HOME.JS
// FASE 1 — MÊS
// FASE 2 — ENTRADAS DO MÊS
// ======================================================

// ======================================================
// SUPABASE CONFIG (FIXO)
// ======================================================
const SUPABASE_URL = 'https://gelhizmssqlexlxkvufc.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_AstKmfIU-pBBXXfPDlw9HA_hQYfLqcb';

const db = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ======================================================
// CONST
// ======================================================
const MONTHS = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'
];

const PATH_LOGIN = '/finfamily/Oria/assets/pages/login/login.html';
const PATH_INCOME = '/finfamily/Oria/assets/pages/income/income.html';

// ======================================================
// STATE
// ======================================================
let user = null;
let currentMonth = null; // YYYY-MM

// ======================================================
// HELPERS
// ======================================================
function formatYYYYMM(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2,'0')}`;
}

function addMonths(yyyyMM, delta) {
  const [y, m] = yyyyMM.split('-').map(Number);
  const d = new Date(y, (m - 1) + delta, 1);
  return formatYYYYMM(d);
}

function formatBRL(value) {
  return Number(value || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
}

function renderMonth(yyyyMM) {
  const [y, m] = yyyyMM.split('-');
  const label = `${MONTHS[m - 1]} de ${y}`;
  document.getElementById('monthLabel').innerText = label;
}

// ======================================================
// AUTH
// ======================================================
async function loadUser() {
  const { data, error } = await db.auth.getUser();

  if (error || !data?.user) {
    return null;
  }

  return data.user;
}

// ======================================================
// USER SETTINGS (MONTH)
// ======================================================
async function getOrCreateMonth() {
  const { data, error } = await db
    .from('user_settings')
    .select('current_month')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error || !data || !data.current_month) {
    const month = formatYYYYMM(new Date());

    await db.from('user_settings').upsert({
      user_id: user.id,
      current_month: month
    });

    return month;
  }

  return data.current_month;
}

async function updateMonth(yyyyMM) {
  await db
    .from('user_settings')
    .update({ current_month: yyyyMM })
    .eq('user_id', user.id);
}

// ======================================================
// FASE 2 — ENTRADAS DO MÊS
// ======================================================
async function loadIncomeMonth() {
  const { data, error } = await db
    .from('transactions')
    .select('amount')
    .eq('user_id', user.id)
    .eq('month', currentMonth)
    .eq('type', 'income');

  if (error) {
    console.error('Erro ao carregar entradas:', error);
    document.getElementById('incomeValue').innerText = 'R$ 0,00';
    return;
  }

  const total = (data || []).reduce(
    (sum, row) => sum + Number(row.amount || 0),
    0
  );

  document.getElementById('incomeValue').innerText = formatBRL(total);
}

// ======================================================
// INIT
// ======================================================
(async function init() {
  // 1️⃣ Auth
  user = await loadUser();

  if (!user) {
    window.location.href = PATH_LOGIN;
    return;
  }

  // 2️⃣ Mês
  currentMonth = await getOrCreateMonth();
  renderMonth(currentMonth);

  // 3️⃣ Entradas
  await loadIncomeMonth();

  // 4️⃣ Navegação mês
  document.getElementById('prevMonth').onclick = async () => {
    currentMonth = addMonths(currentMonth, -1);
    renderMonth(currentMonth);
    await updateMonth(currentMonth);
    await loadIncomeMonth();
  };

  document.getElementById('nextMonth').onclick = async () => {
    currentMonth = addMonths(currentMonth, 1);
    renderMonth(currentMonth);
    await updateMonth(currentMonth);
    await loadIncomeMonth();
  };

  // 5️⃣ Navegação
  document.getElementById('cardIncome').onclick = () => {
    window.location.href = PATH_INCOME;
  };
})();
