/* ================================
   ORIA HOME - CSS ISOLADO
   ================================ */

.home-root {
  all: initial;
  font-family: 'Inter', sans-serif;
  background: linear-gradient(135deg, #eef2ff, #e0e7ff, #c7d2fe);
  min-height: 100vh;
}

.home-root * {
  box-sizing: border-box;
  font-family: inherit;
}

.container {
  max-width: 430px;
  margin: 0 auto;
  padding: 16px;
}

/* HEADER */
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
  background: #2563eb;
  color: #fff;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
}

.logo-text strong {
  display: block;
  font-size: 18px;
}

.logo-text span {
  font-size: 12px;
  color: #64748b;
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
}

/* MÊS */
.month-selector {
  background: #fff;
  border-radius: 18px;
  padding: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.month-btn {
  border: none;
  background: #eef2ff;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  font-size: 20px;
}

.month-display {
  font-weight: 600;
}

/* SUMMARY */
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
  color: #64748b;
}

.summary-card strong {
  font-size: 20px;
}

.summary-card .negative {
  color: #ef4444;
}

/* AÇÕES */
.actions h2 {
  font-size: 16px;
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
  color: #1e293b;
  font-weight: 600;
}
