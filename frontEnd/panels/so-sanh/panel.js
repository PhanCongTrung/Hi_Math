export function mount(container) {
  if (!container) return;
  // ensure css is loaded
  if (!document.querySelector('link[data-panel="so-sanh"]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = './panels/so-sanh/style.css';
    link.setAttribute('data-panel','so-sanh');
    document.head.appendChild(link);
  }

  container.innerHTML = `
    <div class="sosanh-container">
      <div class="game-container">
        <div class="game-header">
            <h1><i class="fas fa-balance-scale"></i> So Sánh Số</h1>
        </div>

        <div class="game-stats">
            <div class="stat">
                <div class="stat-label">Câu</div>
                <div class="stat-value" id="sosanh-questionNumber">1</div>
            </div>
            <div class="stat">
                <div class="stat-label">Đúng</div>
                <div class="stat-value correct" id="sosanh-correctCount">0</div>
            </div>
            <div class="stat">
                <div class="stat-label">Sai</div>
                <div class="stat-value wrong" id="sosanh-wrongCount">0</div>
            </div>
        </div>

        <div class="numbers-display">
            <div class="number-box left-box" id="sosanh-leftNumber">
                <div class="number-value">0</div>
            </div>
            
            <div class="comparison-box" id="sosanh-comparisonBox">
                <div class="question-mark">?</div>
                <div class="answer-symbol" id="sosanh-answerSymbol"></div>
            </div>
            
            <div class="number-box right-box" id="sosanh-rightNumber">
                <div class="number-value">0</div>
            </div>
        </div>

        <div class="question-box">
            <h2>Số bên trái <span class="highlight">?</span> số bên phải</h2>
        </div>

        <div class="answers-section">
            <h3>Chọn so sánh đúng:</h3>
            <div class="answers-container">
                <button class="answer-btn larger-btn" id="sosanh-largerBtn">
                    <i class="fas fa-greater-than"></i> Lớn hơn
                </button>
                <button class="answer-btn smaller-btn" id="sosanh-smallerBtn">
                    <i class="fas fa-less-than"></i> Bé hơn
                </button>
            </div>
        </div>

        <div class="controls">
            <button id="sosanh-nextBtn" class="control-btn next-btn">
                <i class="fas fa-forward"></i> Tiếp theo
            </button>
            <button id="sosanh-restartBtn" class="control-btn restart-btn">
                <i class="fas fa-redo"></i> Làm lại
            </button>
        </div>
      </div>
    </div>
  `;

  // ---------- Game logic (scoped to container) ----------
  let questionNumber = 1;
  let correctCount = 0;
  let wrongCount = 0;
  let isAnswered = false;
  let leftNumber = 0;
  let rightNumber = 0;
  let correctAnswer = ''; // 'larger' or 'smaller'
  let autoNextTimeout = null;

  const questionNumberElement = container.querySelector('#sosanh-questionNumber');
  const correctCountElement = container.querySelector('#sosanh-correctCount');
  const wrongCountElement = container.querySelector('#sosanh-wrongCount');
  const leftNumberElement = container.querySelector('#sosanh-leftNumber').querySelector('.number-value');
  const rightNumberElement = container.querySelector('#sosanh-rightNumber').querySelector('.number-value');
  const comparisonBox = container.querySelector('#sosanh-comparisonBox');
  const answerSymbol = container.querySelector('#sosanh-answerSymbol');
  const largerBtn = container.querySelector('#sosanh-largerBtn');
  const smallerBtn = container.querySelector('#sosanh-smallerBtn');
  const nextBtn = container.querySelector('#sosanh-nextBtn');
  const restartBtn = container.querySelector('#sosanh-restartBtn');

  function initGame() {
    questionNumber = 1; correctCount = 0; wrongCount = 0; isAnswered = false;
    if (autoNextTimeout) { clearTimeout(autoNextTimeout); autoNextTimeout = null; }
    updateStats();
    generateNewQuestion();
    nextBtn.disabled = true;
  }

  function generateNewQuestion() {
    isAnswered = false;
    questionNumberElement.textContent = questionNumber;
    // pick two different numbers 0-9
    do {
      leftNumber = getRandomNumber(0,9);
      rightNumber = getRandomNumber(0,9);
    } while (leftNumber === rightNumber);

    // determine correct answer but DO NOT set answerSymbol here (avoid inline style conflicts)
    correctAnswer = leftNumber > rightNumber ? 'larger' : 'smaller';

    updateNumbersDisplay();
    resetUI();
  }

  function updateNumbersDisplay() {
    leftNumberElement.textContent = leftNumber;
    rightNumberElement.textContent = rightNumber;
  }

  function resetUI() {
    comparisonBox.classList.remove('show-answer');
    // remove any inline styles on answerSymbol to allow CSS class to control visibility
    answerSymbol.textContent = '';
    largerBtn.className = 'answer-btn larger-btn';
    smallerBtn.className = 'answer-btn smaller-btn';
    largerBtn.disabled = false; smallerBtn.disabled = false;
    nextBtn.disabled = true;
  }

  function handleAnswer(userAnswer) {
    if (isAnswered) return;
    isAnswered = true;
    const isCorrect = userAnswer === correctAnswer;
    largerBtn.disabled = true; smallerBtn.disabled = true;

    // set the symbol content then show it by toggling class
    answerSymbol.textContent = correctAnswer === 'larger' ? '>' : '<';
    comparisonBox.classList.add('show-answer');

    if (isCorrect) {
      correctCount++;
      if (userAnswer === 'larger') largerBtn.classList.add('correct'); else smallerBtn.classList.add('correct');
    } else {
      wrongCount++;
      if (userAnswer === 'larger') largerBtn.classList.add('incorrect'); else smallerBtn.classList.add('incorrect');
      if (correctAnswer === 'larger') largerBtn.classList.add('correct'); else smallerBtn.classList.add('correct');
    }

    updateStats();
    nextBtn.disabled = false;
    if (isCorrect) {
      autoNextTimeout = setTimeout(() => nextQuestion(), 2000);
    }
  }

  function updateStats() { correctCountElement.textContent = correctCount; wrongCountElement.textContent = wrongCount; }

  function nextQuestion() { if (autoNextTimeout) { clearTimeout(autoNextTimeout); autoNextTimeout = null; } questionNumber++; generateNewQuestion(); }

  function getRandomNumber(min,max) { return Math.floor(Math.random()*(max-min+1))+min; }

  // events (scoped)
  largerBtn.addEventListener('click', () => handleAnswer('larger'));
  smallerBtn.addEventListener('click', () => handleAnswer('smaller'));
  nextBtn.addEventListener('click', nextQuestion);
  restartBtn.addEventListener('click', initGame);

  // init
  initGame();

  // cleanup
  container._soSanhCleanup = () => {
    largerBtn.removeEventListener('click', () => handleAnswer('larger'));
    smallerBtn.removeEventListener('click', () => handleAnswer('smaller'));
    nextBtn.removeEventListener('click', nextQuestion);
    restartBtn.removeEventListener('click', initGame);
    if (autoNextTimeout) { clearTimeout(autoNextTimeout); autoNextTimeout = null; }
    delete container._soSanhCleanup;
  };
}

export function unmount(container) { if (!container) return; if (container._soSanhCleanup) container._soSanhCleanup(); }
