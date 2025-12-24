export function mount(container) {
  if (!container) return;

  // ensure css is loaded
  if (!document.querySelector('link[data-panel="xep-so"]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = './panels/xep-so/style.css';
    link.setAttribute('data-panel','xep-so');
    document.head.appendChild(link);
  }

  container.innerHTML = `
    <div class="xepso-container">
      <div class="game-container">
        <div class="game-header">
            <h1><i class="fas fa-sort-numeric-up"></i> Sắp Xếp Số</h1>
        </div>

        <div class="game-stats">
            <div class="stat">
                <div class="stat-label">Câu</div>
                <div class="stat-value" id="xepso-questionNumber">1</div>
            </div>
            <div class="stat">
                <div class="stat-label">Đúng</div>
                <div class="stat-value correct" id="xepso-correctCount">0</div>
            </div>
            <div class="stat">
                <div class="stat-label">Sai</div>
                <div class="stat-value wrong" id="xepso-wrongCount">0</div>
            </div>
        </div>

        <div class="sequence-section">
            <h3>Kéo số vào vị trí đúng:</h3>
            <div class="number-sequence" id="xepso-numberSequence"></div>
        </div>

        <div class="answers-section">
            <h3>Chọn số để kéo:</h3>
            <div class="draggable-numbers" id="xepso-draggableNumbers"></div>
        </div>

        <div class="controls">
            <button id="xepso-nextBtn" class="control-btn next-btn" disabled>
                <i class="fas fa-forward"></i> Tiếp theo
            </button>
            <button id="xepso-restartBtn" class="control-btn restart-btn">
                <i class="fas fa-redo"></i> Làm lại
            </button>
        </div>
      </div>
    </div>
  `;

  // ---------- Game state (scoped) ----------
  let questionNumber = 1;
  let correctCount = 0;
  let wrongCount = 0;
  let currentSequence = [];
  let hiddenPositions = [];
  let hiddenNumbers = [];
  let draggableNumbers = [];
  let draggedNumber = null;
  let correctSlotsCount = 0;
  let autoNextTimeout = null;

  // dom (scoped)
  const questionNumberElement = container.querySelector('#xepso-questionNumber');
  const correctCountElement = container.querySelector('#xepso-correctCount');
  const wrongCountElement = container.querySelector('#xepso-wrongCount');
  const numberSequence = container.querySelector('#xepso-numberSequence');
  const draggableNumbersContainer = container.querySelector('#xepso-draggableNumbers');
  const nextBtn = container.querySelector('#xepso-nextBtn');
  const restartBtn = container.querySelector('#xepso-restartBtn');

  function initGame() {
    questionNumber = 1; correctCount = 0; wrongCount = 0; correctSlotsCount = 0;
    if (autoNextTimeout) { clearTimeout(autoNextTimeout); autoNextTimeout = null; }
    updateStats();
    generateNewQuestion();
    nextBtn.disabled = true;
  }

  function generateNewQuestion() {
    currentSequence = []; hiddenPositions = []; hiddenNumbers = []; draggableNumbers = []; draggedNumber = null; correctSlotsCount = 0;
    if (autoNextTimeout) { clearTimeout(autoNextTimeout); autoNextTimeout = null; }
    questionNumberElement.textContent = questionNumber;

    // create 6 unique numbers 1-20, sorted ascending
    const numbers = new Set();
    while (numbers.size < 6) numbers.add(getRandomNumber(1,20));
    currentSequence = Array.from(numbers).sort((a,b)=>a-b);

    // choose 2-4 random hidden positions
    const numberOfHidden = getRandomNumber(2,4);
    const positions = [0,1,2,3,4,5];
    for (let i=0;i<numberOfHidden;i++){
      const idx = Math.floor(Math.random()*positions.length);
      hiddenPositions.push(positions[idx]);
      positions.splice(idx,1);
    }
    hiddenPositions.sort((a,b)=>a-b);
    hiddenNumbers = hiddenPositions.map(p => currentSequence[p]);
    draggableNumbers = [...hiddenNumbers];

    displaySequence();
    displayDraggableNumbers();
    nextBtn.disabled = true;
  }

  function displaySequence() {
    numberSequence.innerHTML = '';
    currentSequence.forEach((number,index)=>{
      const slot = document.createElement('div');
      slot.className = 'number-slot';
      slot.dataset.position = index;
      slot.dataset.correctValue = number;

      if (hiddenPositions.includes(index)) {
        slot.classList.add('empty');
        slot.dataset.filled = 'false';
        slot.dataset.currentValue = '';
        slot.addEventListener('dragover', handleDragOver);
        slot.addEventListener('dragenter', handleDragEnter);
        slot.addEventListener('dragleave', handleDragLeave);
        slot.addEventListener('drop', handleDrop);
      } else {
        slot.classList.add('filled');
        slot.textContent = number;
        slot.dataset.filled = 'true';
        slot.dataset.currentValue = number;
        correctSlotsCount++;
      }

      numberSequence.appendChild(slot);
    });
  }

  function displayDraggableNumbers() {
    draggableNumbersContainer.innerHTML = '';
    const shuffledNumbers = [...draggableNumbers].sort(()=>Math.random()-0.5);
    shuffledNumbers.forEach((number, index)=>{
      const el = document.createElement('div');
      el.className = 'draggable-number';
      el.textContent = number;
      el.dataset.number = number;
      el.dataset.id = `xep-drag-${index}`;
      el.draggable = true;
      el.addEventListener('dragstart', handleDragStart);
      el.addEventListener('dragend', handleDragEnd);
      draggableNumbersContainer.appendChild(el);
    });
  }

  // drag handlers (scoped)
  function handleDragStart(e) {
    if (nextBtn.disabled === false) return;
    draggedNumber = { element: e.target, number: parseInt(e.target.dataset.number), id: e.target.dataset.id };
    e.target.classList.add('dragging');
    try { e.dataTransfer.setData('text/plain', e.target.dataset.number); e.dataTransfer.effectAllowed = 'move'; } catch(e) {}
  }

  function handleDragOver(e) { if (!draggedNumber || nextBtn.disabled === false) return; e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }
  function handleDragEnter(e) { if (!draggedNumber || nextBtn.disabled === false) return; const slot = e.target.closest('.number-slot.empty'); if (!slot) return; slot.classList.add('drag-over'); }
  function handleDragLeave(e) { const slot = e.target.closest('.number-slot.empty'); if (!slot) return; slot.classList.remove('drag-over'); }

  function handleDrop(e) {
    e.preventDefault();
    if (!draggedNumber || nextBtn.disabled === false) return;
    const slot = e.target.closest('.number-slot.empty'); if (!slot) return;
    slot.classList.remove('drag-over');
    const correctValue = parseInt(slot.dataset.correctValue);
    const isCorrect = draggedNumber.number === correctValue;
    if (isCorrect) {
      slot.textContent = draggedNumber.number;
      slot.classList.remove('empty'); slot.classList.add('correct'); slot.dataset.filled = 'true'; slot.dataset.currentValue = draggedNumber.number;
      draggedNumber.element.classList.add('used'); draggedNumber.element.draggable = false;
      const numberIndex = draggableNumbers.indexOf(draggedNumber.number);
      if (numberIndex > -1) draggableNumbers.splice(numberIndex,1);
      correctSlotsCount++;
      checkIfCompleted();
    } else {
      slot.classList.add('incorrect-drop');
      setTimeout(()=>{ slot.classList.remove('incorrect-drop'); draggedNumber.element.classList.remove('dragging'); draggedNumber.element.style.transform = ''; }, 500);
      wrongCount++; updateStats();
    }
    draggedNumber = null;
  }

  function handleDragEnd() { if (draggedNumber && draggedNumber.element) draggedNumber.element.classList.remove('dragging'); document.querySelectorAll('.number-slot.drag-over').forEach(s=>s.classList.remove('drag-over')); draggedNumber = null; }

  function checkIfCompleted() {
    const totalSlots = 6;
    if (correctSlotsCount === totalSlots) {
      correctCount++; updateStats();
      document.querySelectorAll('.number-slot').forEach(slot=>slot.classList.add('all-correct'));
      autoNextTimeout = setTimeout(()=>{ nextQuestion(); }, 2000);
    }
  }

  function updateStats() { correctCountElement.textContent = correctCount; wrongCountElement.textContent = wrongCount; }

  function nextQuestion() { if (autoNextTimeout) { clearTimeout(autoNextTimeout); autoNextTimeout = null; } questionNumber++; generateNewQuestion(); }

  function getRandomNumber(min,max) { return Math.floor(Math.random()*(max-min+1))+min; }

  // document-level dragover to allow drops (scoped cleanup later)
  function docDragOver(e) { e.preventDefault(); }
  document.addEventListener('dragover', docDragOver);

  // events
  nextBtn.addEventListener('click', nextQuestion);
  restartBtn.addEventListener('click', initGame);

  // init
  initGame();

  // cleanup
  container._xepSoCleanup = () => {
    nextBtn.removeEventListener('click', nextQuestion);
    restartBtn.removeEventListener('click', initGame);
    document.removeEventListener('dragover', docDragOver);
    if (autoNextTimeout) { clearTimeout(autoNextTimeout); autoNextTimeout = null; }
    delete container._xepSoCleanup;
  };
}

export function unmount(container) { if (!container) return; if (container._xepSoCleanup) container._xepSoCleanup(); }
