<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Oria - Controle Financeiro</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      background: linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 50%, #C7D2FE 100%);
      min-height: 100vh;
      color: #1E293B;
    }

    .container {
      max-width: 430px;
      margin: 0 auto;
      padding: 16px;
      min-height: 100vh;
    }

    /* Header */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }

    .logo {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .logo-icon {
      width: 44px;
      height: 44px;
      background: linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%);
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 14px rgba(59, 130, 246, 0.35);
    }

    .logo-icon svg {
      width: 24px;
      height: 24px;
      color: white;
    }

    .logo-text {
      font-size: 26px;
      font-weight: 700;
      background: linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .profile-btn {
      width: 44px;
      height: 44px;
      background: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      cursor: pointer;
      border: none;
      transition: all 0.2s ease;
      text-decoration: none;
    }

    .profile-btn:hover {
      transform: scale(1.05);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
    }

    .profile-btn svg {
      width: 22px;
      height: 22px;
      color: #64748B;
    }

    /* Month Selector */
    .month-selector {
      background: white;
      border-radius: 20px;
      padding: 20px;
      margin-bottom: 20px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
    }

    .month-nav {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .month-btn {
      width: 44px;
      height: 44px;
      background: linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%);
      border: none;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .month-btn:hover {
      background: linear-gradient(135deg, #E0E7FF 0%, #C7D2FE 100%);
      transform: scale(1.05);
    }

    .month-btn:active { transform: scale(0.95); }

    .month-btn svg {
      width: 20px;
      height: 20px;
      color: #3B82F6;
    }

    .month-display { text-align: center; }

    .month-name {
      font-size: 22px;
      font-weight: 700;
      color: #1E293B;
      margin-bottom: 4px;
    }

    .month-hint {
      font-size: 13px;
      color: #94A3B8;
    }

    /* Summary Cards */
    .summary-cards {
      display: flex;
      flex-direction: column;
      gap: 14px;
      margin-bottom: 24px;
    }

    .summary-card {
      background: white;
      border-radius: 20px;
      padding: 20px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
      cursor: pointer;
      transition: all 0.3s ease;
      position: relative;
      overflow: hidden;
      text-decoration: none;
      color: inherit;
      display: block;
    }

    .summary-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 30px rgba(0, 0, 0, 0.1);
    }

    .summary-card:active { transform: scale(0.98); }

    .summary-card.balance { cursor: default; }
    .summary-card.balance:hover { transform: none; }
    .summary-card.balance:active { transform: none; }

    .card-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 12px;
    }

    .card-icon {
      width: 42px;
      height: 42px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .card-icon.income {
      background: linear-gradient(135deg, #22C55E 0%, #16A34A 100%);
      box-shadow: 0 4px 14px rgba(34, 197, 94, 0.35);
    }

    .card-icon.expense {
      background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%);
      box-shadow: 0 4px 14px rgba(239, 68, 68, 0.35);
    }

    .card-icon.balance {
      background: linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%);
      box-shadow: 0 4px 14px rgba(59, 130, 246, 0.35);
    }

    .card-icon svg { width: 22px; height: 22px; color: white; }

    .card-title { font-size: 14px; font-weight: 500; color: #64748B; }

    .card-arrow { margin-left: auto; color: #CBD5E1; }
    .card-arrow svg { width: 20px; height: 20px; }

    .card-value { font-size: 28px; font-weight: 700; }

    .card-value.income { color: #22C55E; }
    .card-value.expense { color: #EF4444; }
    .card-value.balance { color: #3B82F6; }
    .card-value.negative { color: #EF4444; }

    /* Balance Progress */
    .balance-progress { margin-top: 16px; }

    .progress-labels {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      color: #94A3B8;
      margin-bottom: 8px;
    }

    .progress-bar {
      height: 8px;
      background: #E2E8F0;
      border-radius: 4px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #22C55E 0%, #16A34A 100%);
      border-radius: 4px;
      transition: width 0.5s ease;
    }

    /* Quick Actions */
    .quick-actions-title {
      font-size: 16px;
      font-weight: 600;
      color: #1E293B;
      margin-bottom: 14px;
    }

    .quick-actions-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 14px;
    }

    .quick-action {
      background: white;
      border-radius: 18px;
      padding: 20px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
      cursor: pointer;
      border: none;
      transition: all 0.3s ease;
      text-decoration: none;
      color: inherit;
    }

    .quick-action:hover {
      transform: translateY(-3px);
      box-shadow: 0 8px 30px rgba(0, 0, 0, 0.1);
    }

    .quick-action:active { transform: scale(0.96); }

    .action-icon {
      width: 50px;
      height: 50px;
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .action-icon.house {
      background: linear-gradient(135deg, #F97316 0%, #EA580C 100%);
      box-shadow: 0 4px 14px rgba(249, 115, 22, 0.35);
    }

    .action-icon.income {
      background: linear-gradient(135deg, #22C55E 0%, #16A34A 100%);
      box-shadow: 0 4px 14px rgba(34, 197, 94, 0.35);
    }

    .action-icon.cards {
      background: linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%);
      box-shadow: 0 4px 14px rgba(139, 92, 246, 0.35);
    }

    .action-icon.savings {
      background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%);
      box-shadow: 0 4px 14px rgba(245, 158, 11, 0.35);
    }

    .action-icon svg { width: 26px; height: 26px; color: white; }

    .action-label { font-size: 13px; font-weight: 600; color: #475569; }

    /* Animations */
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .animate-in { animation: fadeIn 0.4s ease forwards; }
    .delay-1 { animation-delay: 0.1s; opacity: 0; }
    .delay-2 { animation-delay: 0.2s; opacity: 0; }
    .delay-3 { animation-delay: 0.3s; opacity: 0; }
    .delay-4 { animation-delay: 0.4s; opacity: 0; }
  </style>
</head>

<body>
  <div class="container">
    <!-- Header -->
    <header class="header animate-in">
      <div class="logo">
        <div class="logo-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 6v6l4 2"/>
          </svg>
        </div>
        <span class="logo-text">Oria</span>
      </div>

      <!-- Perfil (link real) -->
      <a class="profile-btn" href="/Oria/pages/settings/settings.html" aria-label="Abrir configurações">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
      </a>
    </header>

    <!-- Month Selector -->
    <div class="month-selector animate-in delay-1">
      <div class="month-nav">
        <button class="month-btn" onclick="navigateMonth(-1)" aria-label="Mês anterior">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
        </button>

        <div class="month-display">
          <div class="month-name" id="monthName">Janeiro</div>
          <div class="month-hint">Troque o mês para ver seus dados</div>
        </div>

        <button class="month-btn" onclick="navigateMonth(1)" aria-label="Próximo mês">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 18l6-6-6-6"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- Summary Cards (agora com links reais) -->
    <div class="summary-cards">

      <!-- Income -->
      <a class="summary-card animate-in delay-2" href="/Oria/pages/income/income.html">
        <div class="card-header">
          <div class="card-icon income">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
          </div>
          <span class="card-title">Entradas do mês</span>
          <div class="card-arrow">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </div>
        </div>
        <div class="card-value income" id="incomeValue">R$ 0,00</div>
      </a>

      <!-- Expenses -->
      <a class="summary-card animate-in delay-2" href="/Oria/pages/expenses/expenses.html">
        <div class="card-header">
          <div class="card-icon expense">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
          </div>
          <span class="card-title">Gastos do mês</span>
          <div class="card-arrow">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </div>
        </div>
        <div class="card-value expense" id="expenseValue">R$ 0,00</div>
      </a>

      <!-- Balance (sem link) -->
      <div class="summary-card balance animate-in delay-3">
        <div class="card-header">
          <div class="card-icon balance">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M19 5c-1.5 0-2.8 1.4-3 2-3.5-1.5-11-.3-11 5 0 1.8 0 3 2 4.5V20h4v-2h3v2h4v-4c1-.5 1.7-1 2-2h2v-4h-2c0-1-.5-1.5-1-2V5z"/>
              <path d="M2 9v1c0 1.1.9 2 2 2h1"/>
              <path d="M16 11h.01"/>
            </svg>
          </div>
          <span class="card-title">Saldo do mês</span>
        </div>
        <div class="card-value balance" id="balanceValue">R$ 0,00</div>

        <div class="balance-progress">
          <div class="progress-labels">
            <span>Gastos</span>
            <span id="progressPercent">0%</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" id="progressFill" style="width: 0%"></div>
          </div>
        </div>
      </div>

    </div>

    <!-- Quick Actions (agora com links reais) -->
    <h2 class="quick-actions-title animate-in delay-3">Ações Rápidas</h2>

    <div class="quick-actions-grid animate-in delay-4">

      <a class="quick-action" href="/Oria/pages/expenses/expenses.html">
        <div class="action-icon house">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
        </div>
        <span class="action-label">Contas da Casa</span>
      </a>

      <a class="quick-action" href="/Oria/pages/income/income.html">
        <div class="action-icon income">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="1" x2="12" y2="23"/>
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
          </svg>
        </div>
        <span class="action-label">Entradas</span>
      </a>

      <a class="quick-action" href="/Oria/pages/cards/cards.html">
        <div class="action-icon cards">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
            <line x1="1" y1="10" x2="23" y2="10"/>
          </svg>
        </div>
        <span class="action-label">Cartões</span>
      </a>

      <a class="quick-action" href="/Oria/pages/piggy/piggy.html">
        <div class="action-icon savings">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 5c-1.5 0-2.8 1.4-3 2-3.5-1.5-11-.3-11 5 0 1.8 0 3 2 4.5V20h4v-2h3v2h4v-4c1-.5 1.7-1 2-2h2v-4h-2c0-1-.5-1.5-1-2V5z"/>
            <path d="M2 9v1c0 1.1.9 2 2 2h1"/>
            <path d="M16 11h.01"/>
          </svg>
        </div>
        <span class="action-label">Porquinho</span>
      </a>

    </div>
  </div>

  <!-- ✅ IMPORTANTE: seu home.js usa import, então precisa ser módulo -->
  <script type="module" src="/Oria/pages/home/home.js"></script>
</body>
</html>
