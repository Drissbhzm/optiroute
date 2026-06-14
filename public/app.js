let stopCount = 0;

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => {
    s.classList.remove('active');
    s.style.display = 'none';
  });
  const screen = document.getElementById(id);
  screen.style.display = 'flex';
  screen.classList.add('active');
}

function addStop() {
  stopCount++;
  const div = document.createElement('div');
  div.className = 'stop-card';
  div.id = `stop-${stopCount}`;
  div.innerHTML = `
    <div class="stop-num-badge">${stopCount}</div>
    <input type="text" class="stop-input" placeholder="Adresse de livraison...">
    <span class="delete-btn" onclick="removeStop(${stopCount})">🗑</span>
  `;
  document.getElementById('stops-list').appendChild(div);
}

function removeStop(id) {
  const el = document.getElementById(`stop-${id}`);
  if (el) el.remove();
  renumberStops();
}

function renumberStops() {
  const cards = document.querySelectorAll('.stop-card');
  cards.forEach((card, i) => {
    card.querySelector('.stop-num-badge').textContent = i + 1;
  });
  stopCount = cards.length;
}

function optimiser() {
  const depart = document.getElementById('depart').value.trim();
  const stops = [...document.querySelectorAll('.stop-input')].map(i => i.value.trim()).filter(v => v);
  if (!depart) { alert('Veuillez entrer un point de départ'); return; }
  if (stops.length === 0) { alert('Ajoutez au moins une livraison'); return; }

  showScreen('screen-loading');
  const checks = ['c1','c2','c3','c4','c5'];
  checks.forEach(id => document.getElementById(id).className = 'check-item');

  let i = 0;
  const interval = setInterval(() => {
    if (i < checks.length) {
      document.getElementById(checks[i]).className = 'check-item done';
      document.getElementById(checks[i]).textContent = document.getElementById(checks[i]).textContent.replace('⏳ ', '');
      i++;
    } else {
      clearInterval(interval);
      setTimeout(() => showResult(depart, stops), 600);
    }
  }, 700);
}

function showResult(depart, stops) {
  showScreen('screen-result');
  const list = document.getElementById('route-list');
  list.innerHTML = '';
  [depart, ...stops].forEach((addr, idx) => {
    const div = document.createElement('div');
    div.className = 'route-item';
    div.innerHTML = `<div class="stop-num-badge">${idx === 0 ? '📍' : idx}</div><span>${addr}</span>`;
    list.appendChild(div);
  });
  document.getElementById('res-distance').textContent = (stops.length * 4.2).toFixed(1) + ' km';
  document.getElementById('res-time').textContent = (stops.length * 12) + ' min';
  document.getElementById('res-eco').textContent = '15%';
}

// SPLASH SCREEN
window.onload = () => {
  const progress = document.getElementById('progress');
  let width = 0;
  const interval = setInterval(() => {
    width += 2;
    progress.style.width = width + '%';
    if (width >= 100) {
      clearInterval(interval);
      setTimeout(() => showScreen('screen-home'), 300);
    }
  }, 30);
  addStop();
};