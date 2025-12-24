export function mount(container) {
  if (!container) return;
  // ensure css is loaded
  if (!document.querySelector('link[data-panel="ghep-so"]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = './panels/ghep-so/style.css';
    link.setAttribute('data-panel','ghep-so');
    document.head.appendChild(link);
  }

  container.innerHTML = `
    <div class="ghepso-game">
      <div class="game-container">
        <div class="game-header">
          <div class="game-title">
            <h1><i class="fas fa-gamepad"></i> Trò Chơi Kéo Thả Số</h1>
            <p class="subtitle">Kéo số vào nhóm icon tương ứng</p>
          </div>

          <div class="game-stats">
            <div class="stat-box">
              <div class="stat-icon"><i class="fas fa-layer-group"></i></div>
              <div class="stat-content"><div class="stat-label">Level</div><div class="stat-value" id="ghep-level">1</div></div>
            </div>
            <div class="stat-box">
              <div class="stat-icon"><i class="fas fa-clock"></i></div>
              <div class="stat-content"><div class="stat-label">Thời gian</div><div class="stat-value" id="ghep-timer">60</div></div>
            </div>
            <div class="stat-box">
              <div class="stat-icon"><i class="fas fa-star"></i></div>
              <div class="stat-content"><div class="stat-label">Điểm</div><div class="stat-value" id="ghep-score">0</div></div>
            </div>
          </div>
        </div>

        <div class="game-main">
          <div class="numbers-section">
            <h2><i class="fas fa-sort-numeric-up"></i> Kéo số vào đúng nhóm</h2>
            <div class="numbers-container ghep-numbers-container"></div>
          </div>

          <div class="icons-section">
            <h2><i class="fas fa-icons"></i> Nhóm icon</h2>
            <div class="icons-container ghep-icons-container"></div>
          </div>
        </div>

        <div class="game-footer">
          <button id="ghep-restartBtn" class="restart-btn"><i class="fas fa-redo"></i> Chơi lại level</button>
          <div class="hint"><i class="fas fa-lightbulb"></i> Di chuyển số gần tâm icon để xem viền xanh/đỏ</div>
        </div>
      </div>

      <div class="modal-overlay" id="ghep-gameOverModal">
        <div class="modal-content">
          <h3>Hết thời gian!</h3>
          <p>Bạn đã không hoàn thành Level <span id="ghep-modalLevel">1</span> kịp thời gian.</p>
          <div style="margin-top:12px;"><button id="ghep-retryLevelBtn" class="modal-btn retry-btn">Chơi lại Level này</button></div>
        </div>
      </div>

      <div class="modal-overlay" id="ghep-levelCompleteModal">
        <div class="modal-content">
          <h3>Chúc mừng!</h3>
          <p>Bạn đã hoàn thành Level <span id="ghep-modalCompletedLevel">1</span>!</p>

          <div class="modal-stats" style="display:flex;gap:18px;justify-content:center;margin-top:12px;">
            <div><div class="modal-stat-label">Level tiếp theo</div><div class="modal-stat-value" id="ghep-modalNextLevel">2</div></div>
            <div><div class="modal-stat-label">Điểm</div><div class="modal-stat-value" id="ghep-modalLevelScore">0</div></div>
          </div>

          <div style="margin-top:14px;"><button id="ghep-nextLevelBtn" class="modal-btn next-btn">Chơi Level tiếp theo</button></div>
        </div>
      </div>
    </div>
  `;

  // Game data (copied from main.js)
  const levelQuestions = {
    1: [
      { iconType: "Táo", icon: "fas fa-apple-alt", answer: 3, count: 3 },
      { iconType: "Cam", icon: "fas fa-lemon", answer: 4, count: 4 },
      { iconType: "Chuối", icon: "fas fa-lemon", answer: 2, count: 2 },
      { iconType: "Dâu", icon: "fas fa-strawberry", answer: 5, count: 5 },
      { iconType: "Nho", icon: "fas fa-grapes", answer: 1, count: 1 },
      { iconType: "Dưa hấu", icon: "fas fa-watermelon", answer: 6, count: 6 }
    ],
    2: [
      { iconType: "Dứa", icon: "fas fa-pineapple", answer: 2, count: 2 },
      { iconType: "Cherry", icon: "fas fa-cherry", answer: 4, count: 4 },
      { iconType: "Mận", icon: "fas fa-plum", answer: 3, count: 3 },
      { iconType: "Lê", icon: "fas fa-pear", answer: 5, count: 5 },
      { iconType: "Táo", icon: "fas fa-apple-alt", answer: 1, count: 1 },
      { iconType: "Cam", icon: "fas fa-lemon", answer: 6, count: 6 }
    ],
    3: [
      { iconType: "Chuối", icon: "fas fa-lemon", answer: 5, count: 5 },
      { iconType: "Dâu", icon: "fas fa-strawberry", answer: 2, count: 2 },
      { iconType: "Nho", icon: "fas fa-grapes", answer: 4, count: 4 },
      { iconType: "Dưa hấu", icon: "fas fa-watermelon", answer: 3, count: 3 },
      { iconType: "Dứa", icon: "fas fa-pineapple", answer: 6, count: 6 },
      { iconType: "Cherry", icon: "fas fa-cherry", answer: 1, count: 1 }
    ],
    4: [
      { iconType: "Mận", icon: "fas fa-plum", answer: 4, count: 4 },
      { iconType: "Lê", icon: "fas fa-pear", answer: 2, count: 2 },
      { iconType: "Táo", icon: "fas fa-apple-alt", answer: 5, count: 5 },
      { iconType: "Cam", icon: "fas fa-lemon", answer: 3, count: 3 },
      { iconType: "Chuối", icon: "fas fa-lemon", answer: 1, count: 1 },
      { iconType: "Dâu", icon: "fas fa-strawberry", answer: 6, count: 6 }
    ],
    5: [
      { iconType: "Nho", icon: "fas fa-grapes", answer: 3, count: 3 },
      { iconType: "Dưa hấu", icon: "fas fa-watermelon", answer: 5, count: 5 },
      { iconType: "Dứa", icon: "fas fa-pineapple", answer: 2, count: 2 },
      { iconType: "Cherry", icon: "fas fa-cherry", answer: 4, count: 4 },
      { iconType: "Mận", icon: "fas fa-plum", answer: 6, count: 6 },
      { iconType: "Lê", icon: "fas fa-pear", answer: 1, count: 1 }
    ],
    6: [
      { iconType: "Táo", icon: "fas fa-apple-alt", answer: 4, count: 4 },
      { iconType: "Cam", icon: "fas fa-lemon", answer: 6, count: 6 },
      { iconType: "Chuối", icon: "fas fa-lemon", answer: 2, count: 2 },
      { iconType: "Dâu", icon: "fas fa-strawberry", answer: 5, count: 5 },
      { iconType: "Nho", icon: "fas fa-grapes", answer: 3, count: 3 },
      { iconType: "Dưa hấu", icon: "fas fa-watermelon", answer: 1, count: 1 }
    ],
    7: [
      { iconType: "Dứa", icon: "fas fa-pineapple", answer: 3, count: 3 },
      { iconType: "Cherry", icon: "fas fa-cherry", answer: 5, count: 5 },
      { iconType: "Mận", icon: "fas fa-plum", answer: 2, count: 2 },
      { iconType: "Lê", icon: "fas fa-pear", answer: 6, count: 6 },
      { iconType: "Táo", icon: "fas fa-apple-alt", answer: 4, count: 4 },
      { iconType: "Cam", icon: "fas fa-lemon", answer: 1, count: 1 }
    ],
    8: [
      { iconType: "Chuối", icon: "fas fa-lemon", answer: 6, count: 6 },
      { iconType: "Dâu", icon: "fas fa-strawberry", answer: 3, count: 3 },
      { iconType: "Nho", icon: "fas fa-grapes", answer: 5, count: 5 },
      { iconType: "Dưa hấu", icon: "fas fa-watermelon", answer: 2, count: 2 },
      { iconType: "Dứa", icon: "fas fa-pineapple", answer: 4, count: 4 },
      { iconType: "Cherry", icon: "fas fa-cherry", answer: 1, count: 1 }
    ],
    9: [
      { iconType: "Mận", icon: "fas fa-plum", answer: 5, count: 5 },
      { iconType: "Lê", icon: "fas fa-pear", answer: 2, count: 2 },
      { iconType: "Táo", icon: "fas fa-apple-alt", answer: 6, count: 6 },
      { iconType: "Cam", icon: "fas fa-lemon", answer: 3, count: 3 },
      { iconType: "Chuối", icon: "fas fa-lemon", answer: 4, count: 4 },
      { iconType: "Dâu", icon: "fas fa-strawberry", answer: 1, count: 1 }
    ],
    10: [
      { iconType: "Nho", icon: "fas fa-grapes", answer: 8, count: 8 },
      { iconType: "Dưa hấu", icon: "fas fa-watermelon", answer: 7, count: 7 },
      { iconType: "Dứa", icon: "fas fa-pineapple", answer: 9, count: 9 },
      { iconType: "Cherry", icon: "fas fa-cherry", answer: 6, count: 6 },
      { iconType: "Mận", icon: "fas fa-plum", answer: 10, count: 10 },
      { iconType: "Lê", icon: "fas fa-pear", answer: 5, count: 5 }
    ]
  };

  const levelConfig = {
    1: { timePerMove: 60, timeDecrement: 0, scoreMultiplier: 1 },
    2: { timePerMove: 55, timeDecrement: 5, scoreMultiplier: 2 },
    3: { timePerMove: 50, timeDecrement: 5, scoreMultiplier: 3 },
    4: { timePerMove: 45, timeDecrement: 5, scoreMultiplier: 4 },
    5: { timePerMove: 40, timeDecrement: 5, scoreMultiplier: 5 },
    6: { timePerMove: 35, timeDecrement: 5, scoreMultiplier: 6 },
    7: { timePerMove: 30, timeDecrement: 5, scoreMultiplier: 7 },
    8: { timePerMove: 25, timeDecrement: 5, scoreMultiplier: 8 },
    9: { timePerMove: 20, timeDecrement: 5, scoreMultiplier: 9 },
    10: { timePerMove: 15, timeDecrement: 5, scoreMultiplier: 10 }
  };

  // state
  let score = 0; let level = 1; let timeLeft = 60; let timerInterval = null; let isGameActive = true; let draggedNumber = null; let currentIconHighlighted = null; let dragMoveHandler = null; let currentGameData = []; let autoAdvanceTimeoutId = null;

  // dom
  const scoreEl = container.querySelector('#ghep-score');
  const timerEl = container.querySelector('#ghep-timer');
  const levelEl = container.querySelector('#ghep-level');
  const restartBtn = container.querySelector('#ghep-restartBtn');
  const numbersContainer = container.querySelector('.ghep-numbers-container');
  const iconsContainer = container.querySelector('.ghep-icons-container');
  const gameOverModal = container.querySelector('#ghep-gameOverModal');
  const levelCompleteModal = container.querySelector('#ghep-levelCompleteModal');
  const retryLevelBtn = container.querySelector('#ghep-retryLevelBtn');
  const nextLevelBtn = container.querySelector('#ghep-nextLevelBtn');
  const modalLevel = container.querySelector('#ghep-modalLevel');
  const modalCompletedLevel = container.querySelector('#ghep-modalCompletedLevel');
  const modalNextLevel = container.querySelector('#ghep-modalNextLevel');
  const modalLevelScore = container.querySelector('#ghep-modalLevelScore');

  function shuffleArray(arr) { const shuffled = [...arr]; for (let i = shuffled.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]; } return shuffled; }

  function initGame() {
    score = 0; timeLeft = levelConfig[level].timePerMove; isGameActive = true; scoreEl.textContent = score; levelEl.textContent = level; timerEl.textContent = timeLeft; currentGameData = [...(levelQuestions[level] || levelQuestions[1])]; shuffleGameData(); createNumbers(); createIcons(); startTimer(); initDragAndDrop(); hideModal(gameOverModal); hideModal(levelCompleteModal);
  }

  function shuffleGameData() { for (let i = currentGameData.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [currentGameData[i], currentGameData[j]] = [currentGameData[j], currentGameData[i]]; } }

  function createNumbers() { numbersContainer.innerHTML = ''; const numbers = currentGameData.map(item => item.answer); const shuffled = shuffleArray(numbers); shuffled.forEach((num, idx) => { const el = document.createElement('div'); el.className = 'number-item'; el.textContent = num; el.draggable = true; el.dataset.number = num; el.dataset.id = `g-num-${idx}`; numbersContainer.appendChild(el); }); }

  function createIcons() { iconsContainer.innerHTML = ''; currentGameData.forEach((q, idx) => { const iconEl = document.createElement('div'); iconEl.className = 'icon-item'; iconEl.dataset.id = `g-icon-${idx}`; iconEl.dataset.answer = q.answer; let iconsHTML = ''; for (let i = 0; i < q.count; i++) iconsHTML += `<i class="${q.icon}" style="color:${getIconColor(q.iconType)}"></i>`; iconEl.innerHTML = `\n          <div class="icon-name">${q.iconType}</div>\n          <div class="icon-group">${iconsHTML}</div>\n          <div class="icon-answer" id="g-answer-${idx}">?</div>\n        `; iconsContainer.appendChild(iconEl); }); }

  function getIconColor(type) { const map = { 'Táo':'#ff6b6b','Cam':'#FF9800','Chuối':'#FFC107','Dâu':'#f44336','Nho':'#9C27B0','Dưa hấu':'#4CAF50','Dứa':'#FF9800','Cherry':'#E91E63','Mận':'#9C27B0','Lê':'#8BC34A' }; return map[type] || '#4a6bff'; }

  function initDragAndDrop() { const numberItems = container.querySelectorAll('.number-item:not(.used)'); numberItems.forEach(n => { n.removeEventListener('dragstart', handleDragStart); n.removeEventListener('touchstart', handleTouchStart); n.addEventListener('dragstart', handleDragStart); n.addEventListener('touchstart', handleTouchStart, { passive: false }); }); if (dragMoveHandler) container.removeEventListener('dragover', dragMoveHandler); dragMoveHandler = handleDragMove; container.addEventListener('dragover', dragMoveHandler); container.addEventListener('drop', handleDrop); }

  function handleDragStart(e) { if (!isGameActive) { e.preventDefault(); return; } draggedNumber = { element: e.target, number: parseInt(e.target.dataset.number), id: e.target.dataset.id }; e.target.classList.add('dragging'); e.dataTransfer.setData('text/plain', e.target.dataset.number); e.dataTransfer.effectAllowed = 'move'; document.addEventListener('dragend', handleDragEnd); }

  function handleDragMove(e) { if (!draggedNumber || !isGameActive) return; e.preventDefault(); const icons = container.querySelectorAll('.icon-item:not(.completed)'); let closest = null; let minDist = Infinity; icons.forEach(icon => { const r = icon.getBoundingClientRect(); const cx = r.left + r.width/2; const cy = r.top + r.height/2; const d = Math.hypot(e.clientX - cx, e.clientY - cy); if (d < 100 && d < minDist) { minDist = d; closest = icon; } }); if (currentIconHighlighted && currentIconHighlighted !== closest) currentIconHighlighted.classList.remove('highlight-correct','highlight-incorrect'); if (closest) { currentIconHighlighted = closest; const answer = parseInt(closest.dataset.answer); if (draggedNumber.number === answer) { closest.classList.remove('highlight-incorrect'); closest.classList.add('highlight-correct'); } else { closest.classList.remove('highlight-correct'); closest.classList.add('highlight-incorrect'); } } else if (currentIconHighlighted) { currentIconHighlighted.classList.remove('highlight-correct','highlight-incorrect'); currentIconHighlighted = null; } }

  function handleDragEnd() { if (!draggedNumber) return; if (currentIconHighlighted) { currentIconHighlighted.classList.remove('highlight-correct','highlight-incorrect'); currentIconHighlighted = null; } draggedNumber.element.classList.remove('dragging'); document.removeEventListener('dragend', handleDragEnd); }

  function handleDrop(e) { if (!isGameActive || !draggedNumber) { e.preventDefault(); return; } e.preventDefault(); const icon = e.target.closest('.icon-item'); if (!icon || icon.classList.contains('completed')) return; const idx = parseInt(icon.dataset.id.split('-')[2]); const answer = parseInt(icon.dataset.answer); if (draggedNumber.number === answer) { const pts = 10 * (levelConfig[level] ? levelConfig[level].scoreMultiplier : 1); score += pts; scoreEl.textContent = score; icon.classList.add('completed'); currentGameData[idx].placedNumber = draggedNumber.number; container.querySelector(`#g-answer-${idx}`).textContent = draggedNumber.number; draggedNumber.element.classList.add('used'); draggedNumber.element.draggable = false; resetTimer(); checkLevelCompletion(); } else { icon.classList.add('highlight-incorrect'); timeLeft -= (levelConfig[level] ? levelConfig[level].timeDecrement : 0); if (timeLeft < 0) timeLeft = 0; timerEl.textContent = timeLeft; if (timeLeft <= 0) endLevel(false); setTimeout(()=> icon.classList.remove('highlight-incorrect'), 500); } draggedNumber = null; }

  function handleTouchStart(e) { if (!isGameActive) { e.preventDefault(); return; } const touch = e.touches[0]; draggedNumber = { element: e.target, number: parseInt(e.target.dataset.number), id: e.target.dataset.id }; draggedNumber.element.classList.add('dragging'); const touchMove = (moveEvent) => { if (!draggedNumber) return; const t = moveEvent.touches[0]; const icons = container.querySelectorAll('.icon-item:not(.completed)'); let closest=null; let minD=Infinity; icons.forEach(icon => { const r = icon.getBoundingClientRect(); const cx=r.left+r.width/2; const cy=r.top+r.height/2; const d=Math.hypot(t.clientX-cx,t.clientY-cy); if (d<120 && d<minD){minD=d;closest=icon;} }); if (currentIconHighlighted && currentIconHighlighted !== closest) currentIconHighlighted.classList.remove('highlight-correct','highlight-incorrect'); if (closest) { currentIconHighlighted=closest; const answer=parseInt(closest.dataset.answer); if (draggedNumber.number===answer) {closest.classList.remove('highlight-incorrect'); closest.classList.add('highlight-correct');} else {closest.classList.remove('highlight-correct'); closest.classList.add('highlight-incorrect');} } else if (currentIconHighlighted) { currentIconHighlighted.classList.remove('highlight-correct','highlight-incorrect'); currentIconHighlighted=null; } }; const touchEnd = (endEvent) => { if (!draggedNumber) return; const t = endEvent.changedTouches[0]; const icons = container.querySelectorAll('.icon-item:not(.completed)'); let closest=null; let minD=Infinity; icons.forEach(icon => { const r = icon.getBoundingClientRect(); const cx=r.left+r.width/2; const cy=r.top+r.height/2; const d=Math.hypot(t.clientX-cx,t.clientY-cy); if (d<120 && d<minD){minD=d;closest=icon;} }); if (closest) { const idx = parseInt(closest.dataset.id.split('-')[2]); const answer = parseInt(closest.dataset.answer); if (draggedNumber.number===answer) { const pts=10*(levelConfig[level] ? levelConfig[level].scoreMultiplier : 1); score+=pts; scoreEl.textContent=score; closest.classList.add('completed'); currentGameData[idx].placedNumber = draggedNumber.number; container.querySelector(`#g-answer-${idx}`).textContent=draggedNumber.number; draggedNumber.element.classList.add('used'); draggedNumber.element.draggable=false; resetTimer(); checkLevelCompletion(); } else { closest.classList.add('highlight-incorrect'); timeLeft -= (levelConfig[level] ? levelConfig[level].timeDecrement : 0); if (timeLeft<0) timeLeft=0; timerEl.textContent=timeLeft; if (timeLeft<=0) endLevel(false); setTimeout(()=>closest.classList.remove('highlight-incorrect'),500); } } if (currentIconHighlighted) { currentIconHighlighted.classList.remove('highlight-correct','highlight-incorrect'); currentIconHighlighted=null; } draggedNumber.element.classList.remove('dragging'); draggedNumber=null; document.removeEventListener('touchmove', touchMove); document.removeEventListener('touchend', touchEnd); }; document.addEventListener('touchmove', touchMove, { passive:false }); document.addEventListener('touchend', touchEnd); e.preventDefault(); }

  function startTimer() { clearInterval(timerInterval); timerInterval = setInterval(()=>{ if (!isGameActive){ clearInterval(timerInterval); return; } timeLeft--; timerEl.textContent=timeLeft; if (timeLeft<=10) timerEl.classList.add('timer-warning'); if (timeLeft<=0) endLevel(false); }, 1000); }
  function resetTimer(){ timeLeft = levelConfig[level] ? levelConfig[level].timePerMove : 60; timerEl.textContent = timeLeft; timerEl.classList.remove('timer-warning'); }

  function checkLevelCompletion(){ const allCompleted = currentGameData.every(item => item.placedNumber !== undefined); if (allCompleted) endLevel(true); }

  function showModal(modal){ modal.classList.add('active'); document.body.style.overflow='hidden'; }
  function hideModal(modal){ modal.classList.remove('active'); document.body.style.overflow=''; }

  function endLevel(isWin){ isGameActive=false; clearInterval(timerInterval); setTimeout(()=>{ if (isWin){ modalCompletedLevel.textContent = level; if (modalNextLevel) modalNextLevel.textContent = Math.min(level + 1, 10); if (modalLevelScore) modalLevelScore.textContent = score; showModal(levelCompleteModal); if (autoAdvanceTimeoutId) clearTimeout(autoAdvanceTimeoutId); autoAdvanceTimeoutId = setTimeout(() => { if (!container || !container.querySelector) return; handleNextLevel(); autoAdvanceTimeoutId = null; }, 3000); } else { modalLevel.textContent = level; showModal(gameOverModal); } }, 200); }

  // named handlers
  restartBtn.addEventListener('click', initGame);
  const handleRetry = () => { if (autoAdvanceTimeoutId) { clearTimeout(autoAdvanceTimeoutId); autoAdvanceTimeoutId = null; } hideModal(gameOverModal); initGame(); };
  const handleNextLevel = () => { if (autoAdvanceTimeoutId) { clearTimeout(autoAdvanceTimeoutId); autoAdvanceTimeoutId = null; } if (level < 10) { level = Math.min(level + 1, 10); hideModal(levelCompleteModal); initGame(); } else { alert('🎉 Bạn đã hoàn thành tất cả level!'); hideModal(levelCompleteModal); } };
  retryLevelBtn?.addEventListener('click', handleRetry);
  nextLevelBtn?.addEventListener('click', handleNextLevel);
  const handleRootClick = (e) => { if (e.target === gameOverModal) hideModal(gameOverModal); if (e.target === levelCompleteModal) hideModal(levelCompleteModal); };
  container.addEventListener('click', handleRootClick);

  // start
  initGame();

  // cleanup
  container._ghepCleanup = () => {
    clearInterval(timerInterval);
    if (autoAdvanceTimeoutId) { clearTimeout(autoAdvanceTimeoutId); autoAdvanceTimeoutId = null; }
    document.removeEventListener('dragend', handleDragEnd);
    container.removeEventListener('dragover', dragMoveHandler);
    container.removeEventListener('drop', handleDrop);
    container.removeEventListener('click', handleRootClick);
    restartBtn.removeEventListener('click', initGame);
    retryLevelBtn?.removeEventListener('click', handleRetry);
    nextLevelBtn?.removeEventListener('click', handleNextLevel);
    delete container._ghepCleanup;
  };
}

export function unmount(container) {
  if (!container) return; if (container._ghepCleanup) container._ghepCleanup();
}