const entradaBtn = [...document.querySelectorAll('button')]
  .find(b => b.innerText.trim() === 'Entrada');

const modal = document.getElementById('entradaModal');
const closeBtn = document.getElementById('closeEntrada');
const cancelBtn = document.getElementById('cancelEntrada');

if (entradaBtn) {
  entradaBtn.addEventListener('click', () => {
    modal.classList.add('active');
  });
}

closeBtn.addEventListener('click', () => {
  modal.classList.remove('active');
});

cancelBtn.addEventListener('click', () => {
  modal.classList.remove('active');
});

// Tipo seleção
document.querySelectorAll('.type').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.type').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  });
});
