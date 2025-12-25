export function mount(container) {
  if (!container) return;
  // ensure css is loaded
  if (!document.querySelector('link[data-panel="dem-so"]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = './panels/dem-so/style.css';
    link.setAttribute('data-panel','dem-so');
    document.head.appendChild(link);
  }

  // root markup (scoped to panel container)
  container.innerHTML = `
    <div class="demso-container">
      <div class="game-container">
        <!-- Header nhỏ gọn -->
        <div class="game-header">
            <h1><i class="fas fa-calculator"></i> Đếm Icon</h1>
        </div>

        <!-- Stats nhỏ gọn -->
        <div class="game-stats">
            <div class="stat">
                <div class="stat-label">Câu</div>
                <div class="stat-value" id="questionNumber">1</div>
            </div>
            <div class="stat">
                <div class="stat-label">Đúng</div>
                <div class="stat-value correct" id="correctCount">0</div>
            </div>
            <div class="stat">
                <div class="stat-label">Sai</div>
                <div class="stat-value wrong" id="wrongCount">0</div>
            </div>
        </div>

        <!-- Câu hỏi -->
        <div class="question-box">
            <h2>Đếm số icon dưới đây:</h2>
        </div>

        <!-- Hiển thị icon - CHIẾM NHIỀU KHÔNG GIAN -->
        <div class="icons-display" id="iconsContainer">
            <!-- Icon sẽ được tạo bằng JavaScript -->
        </div>

        <!-- 4 ĐÁP ÁN TRẮC NGHIỆM - CHIẾM NHIỀU KHÔNG GIAN -->
        <div class="answers-section">
            <h3>Chọn số lượng đúng:</h3>
            <div class="answers-grid" id="answersContainer">
                <!-- Các đáp án sẽ được tạo bằng JavaScript -->
            </div>
        </div>

        <!-- Điều khiển -->
        <div class="controls">
            <div class="result-message" id="resultMessage"></div>
            <button id="nextBtn" class="control-btn next-btn">
                <i class="fas fa-forward"></i> Tiếp theo
            </button>
            <button id="restartBtn" class="control-btn restart-btn">
                <i class="fas fa-redo"></i> Làm lại
            </button>
        </div>
      </div>
    </div>
  `;

  // ================================
  // GAME LOGIC (scoped to container)
  // ================================
  const iconTypes = [
    { icon: "fas fa-apple-alt", color: "#ff6b6b" },
    { icon: "fas fa-lemon", color: "#FF9800" },
    { icon: "fas fa-star", color: "#FFC107" },
    { icon: "fas fa-heart", color: "#f44336" },
    { icon: "fas fa-cloud", color: "#2196F3" },
    { icon: "fas fa-sun", color: "#FFC107" },
    { icon: "fas fa-moon", color: "#607D8B" },
    { icon: "fas fa-tree", color: "#4CAF50" },
    { icon: "fas fa-gem", color: "#9C27B0" },
    { icon: "fas fa-snowflake", color: "#03A9F4" }
  ];

  // state
  let questionNumber = 1;
  let correctCount = 0;
  let wrongCount = 0;
  let isAnswered = false;
  let currentCorrectAnswer = 0;
  let currentIconsData = [];
  let currentIconType = null;
  let autoNextTimeout = null;

  // dom (scoped)
  const questionNumberElement = container.querySelector('#questionNumber');
  const correctCountElement = container.querySelector('#correctCount');
  const wrongCountElement = container.querySelector('#wrongCount');
  const iconsContainer = container.querySelector('#iconsContainer');
  const answersContainer = container.querySelector('#answersContainer');
  const nextBtn = container.querySelector('#nextBtn');
  const restartBtn = container.querySelector('#restartBtn');
  const resultMessageElement = container.querySelector('#resultMessage');

  // audio helper (tracks current audio so it can be stopped on cleanup)
  let currentAudio = null;
  function playSoundFile(filename) {
    return new Promise(resolve => {
      try {
        if (currentAudio) { try { currentAudio.pause(); currentAudio.currentTime = 0; } catch(e){} currentAudio = null; }
        const audio = new Audio(`assets/sound/${filename}`);
        currentAudio = audio;
        const finish = () => { if (currentAudio === audio) currentAudio = null; resolve(); };
        audio.addEventListener('ended', finish);
        audio.addEventListener('error', finish);
        const p = audio.play(); if (p && typeof p.then === 'function') p.catch(() => finish());
      } catch (e) { currentAudio = null; resolve(); }
    });
  }

  function initGame() {
    questionNumber = 1;
    correctCount = 0;
    wrongCount = 0;
    isAnswered = false;
    if (autoNextTimeout) { clearTimeout(autoNextTimeout); autoNextTimeout = null; }
    updateStats();
    generateNewQuestion();
    resultMessageElement.textContent = '';
    resultMessageElement.className = 'result-message';
    resultMessageElement.classList.remove('show');
  }

  function generateNewQuestion() {
    isAnswered = false;
    resultMessageElement.textContent = '';
    resultMessageElement.className = 'result-message';
    resultMessageElement.classList.remove('show');
    questionNumberElement.textContent = questionNumber;
    currentIconType = iconTypes[getRandomNumber(0, iconTypes.length - 1)];
    currentCorrectAnswer = getRandomNumber(1, 20);
    currentIconsData = [];
    for (let i = 0; i < currentCorrectAnswer; i++) {
      currentIconsData.push({ icon: currentIconType.icon, color: currentIconType.color, index: i });
    }
    displayIcons();
    generateAnswers();
  }

  function displayIcons() {
    iconsContainer.innerHTML = '';
    currentIconsData.forEach((iconData, index) => {
      const elem = document.createElement('div');
      elem.className = 'icon-item';
      elem.style.setProperty('--i', index);
      const iEl = document.createElement('i');
      iEl.className = iconData.icon;
      iEl.style.color = iconData.color;
      elem.appendChild(iEl);
      iconsContainer.appendChild(elem);
    });
  }

  function generateAnswers() {
    answersContainer.innerHTML = '';
    const answers = [currentCorrectAnswer];
    while (answers.length < 4) {
      let wrongAnswer;
      const offset = getRandomNumber(1, 3);
      const shouldAdd = Math.random() > 0.5;
      wrongAnswer = shouldAdd ? currentCorrectAnswer + offset : currentCorrectAnswer - offset;
      if (wrongAnswer >= 1 && wrongAnswer <= 20 && !answers.includes(wrongAnswer)) answers.push(wrongAnswer);
    }
    const shuffled = shuffleArray([...answers]);
    shuffled.forEach(ans => {
      const btn = document.createElement('button');
      btn.className = 'answer-btn';
      btn.textContent = ans;
      btn.dataset.answer = ans;
      btn.dataset.correct = ans === currentCorrectAnswer ? 'true' : 'false';
      const handleClick = () => handleAnswerClick(btn);
      btn.addEventListener('click', handleClick);
      answersContainer.appendChild(btn);
    });
  }

  function handleAnswerClick(clickedButton) {
    if (isAnswered) return;
    isAnswered = true;
    const isCorrect = clickedButton.dataset.correct === 'true';
    const allBtns = container.querySelectorAll('.answer-btn');
    allBtns.forEach(button => {
      button.classList.add('answered');
      if (button.dataset.correct === 'true') button.classList.add('correct');
      else if (button === clickedButton && !isCorrect) button.classList.add('incorrect');
      button.disabled = true;
    });
    if (isCorrect) {
      correctCount++;
      resultMessageElement.textContent = '🎉 Chính xác!';
      resultMessageElement.classList.add('correct');
      // play long correct sound then next
      playSoundFile('sound_correct_answer_long.mp3').then(() => nextQuestion());
    } else {
      wrongCount++;
      resultMessageElement.textContent = '❌ Sai rồi!';
      resultMessageElement.classList.add('incorrect');
      // play wrong long sound then next
      playSoundFile('sound_wrong_answer_long.mp3').then(() => nextQuestion());
    }
    resultMessageElement.classList.add('show');
    updateStats();
  }

  function updateStats() {
    correctCountElement.textContent = correctCount;
    wrongCountElement.textContent = wrongCount;
  }

  function nextQuestion() {
    if (autoNextTimeout) { clearTimeout(autoNextTimeout); autoNextTimeout = null; }
    questionNumber++;
    generateNewQuestion();
  }

  function getRandomNumber(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
  function shuffleArray(array) { const s = [...array]; for (let i = s.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [s[i], s[j]] = [s[j], s[i]]; } return s; }

  // events
  nextBtn.addEventListener('click', nextQuestion);
  restartBtn.addEventListener('click', initGame);

  // start
  initGame();

  // cleanup
  container._demSoCleanup = () => {
    nextBtn.removeEventListener('click', nextQuestion);
    restartBtn.removeEventListener('click', initGame);
    if (autoNextTimeout) { clearTimeout(autoNextTimeout); autoNextTimeout = null; }
    try { if (currentAudio) { currentAudio.pause(); currentAudio.currentTime = 0; currentAudio = null; } } catch(e) {}
    delete container._demSoCleanup;
  };
}

export function unmount(container) { if (!container) return; if (container._demSoCleanup) container._demSoCleanup(); }