/* ================================
   ORIA • HOME
   CSS ISOLADO
   ================================ */

:root {
  --blue-500: #3b82f6;
  --blue-600: #2563eb;
  --blue-100: #eef2ff;
  --blue-200: #e0e7ff;

  --text-main: #1e293b;
  --text-muted: #64748b;

  --danger: #ef4444;
  --success: #22c55e;
}

/* RESET LOCAL */
.home-root,
.home-root * {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  font-family: 'Inter', sans-serif;
}

/* FUNDO */
.home-root {
  min-height: 100vh;
  background: linear-gradient(135deg, var(--blue-100), var(--blue-200));
}

/* CONTAINER */
.container {
  max-width: 430px;
  margin: 0 auto;
  padding: 16px;
}

/* ================= HEADER ================= */

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
  border-radius: 14px;
  background: linear-gradient(135deg, var(--blue-500), var(--blue-600));
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-weight: 700;
  font-size: 18px;
}

.logo-text strong {
  display: block;
  font-size: 18px;
  color: var(--text-main);
}

.logo-text span {
  font-size: 12px;
  color: var(--text-muted);
}

.profile-btn {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  color: var(--text-muted);
}

/* ================= MÊS ================= */

.month-selector {
  background: #fff;
  border-radius: 20px;
  padding: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.month-btn {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  border: none;
  background: var(--blue-100);
  font-size: 20px;
  color: var(--blue-600);
  cursor: pointer;
}

.month-display {
  font-weight: 600;
  color: var(--text-main);
}

/* ================= SUMMARY ================= */

.summary-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 24px;
}

.summary-card {
  background: #fff;
  border-radius: 18px;
  padding: 16px;
}

.summary-card span {
  font-size: 13px;
  color: var(--text-muted);
}

.summary-card strong {
  display: block;
  margin-top: 4px;
  font-size: 20px;
  color: var(--text-main);
}

.summary-card strong.negative {
  color: var(--danger);
}

.summary-card strong.positive {
  color: var(--success);
}

/* ================= AÇÕES ================= */

.actions h2 {
  font-size: 16px;
  color: var(--text-main);
  margin-bottom: 12px;
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.actions-grid a {
  background: #fff;
  border-radius: 16px;
  padding: 14px;
  text-align: center;
  text-decoration: none;
  color: var(--text-main);
  font-weight: 600;
}
