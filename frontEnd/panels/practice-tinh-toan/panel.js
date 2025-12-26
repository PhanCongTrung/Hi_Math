export function mount(container) {
  if (!container) return;

  // ensure css is loaded
  if (!document.querySelector('link[data-panel="practice-tinh-toan"]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = './panels/practice-tinh-toan/style.css';
    link.setAttribute('data-panel','practice-tinh-toan');
    document.head.appendChild(link);
  }

  container.innerHTML = `
    <div class="practice-container">
      <div class="game-container" id="practiceGameContainer">
        <div class="selection-page active" id="practice-selectionPage">
          <div class="selection-header">
            <p class="subtitle">Chọn loại phép tính bạn muốn luyện tập</p>
          </div>
          <div class="selection-options">
            <div class="option-card" id="practice-additionOption">
              <div class="option-icon"><i class="fas fa-plus-circle"></i></div>
              <div class="option-content"><h2>Phép Cộng</h2><p>Tính tổng các số từ 2 đến 5 số hạng</p></div>
            </div>
            <div class="option-card" id="practice-subtractionOption">
              <div class="option-icon"><i class="fas fa-minus-circle"></i></div>
              <div class="option-content"><h2>Phép Trừ</h2><p>Tính hiệu các số từ 2 đến 5 số</p></div>
            </div>
            <div class="option-card" id="practice-bothOption">
              <div class="option-icon"><i class="fas fa-random"></i></div>
              <div class="option-content"><h2>Cả Hai</h2><p>Phép cộng và trừ ngẫu nhiên</p></div>
            </div>
          </div>
        </div>

        <div class="game-page" id="practice-gamePage">
          <div class="game-header">
            <button class="back-btn" id="practice-backBtn"><i class="fas fa-arrow-left"></i> Quay về</button>
            <div class="current-mode" id="practice-currentMode"><i class="fas fa-plus-circle"></i> Phép Cộng</div>
            <div class="game-stats">
              <div class="mini-stat"><div class="mini-label">Đúng</div><div class="mini-value correct" id="practice-gameCorrect">0</div></div>
              <div class="mini-stat"><div class="mini-label">Sai</div><div class="mini-value wrong" id="practice-gameWrong">0</div></div>
              <div class="mini-stat"><div class="mini-label">Tỉ lệ</div><div class="mini-value" id="practice-gameAccuracy">0%</div></div>
            </div>
          </div>

          <div class="question-section">
            <div class="question-box">
              <h2>Tính kết quả:</h2>
              <div class="math-expression" id="practice-mathExpression"></div>
            </div>
          </div>

          <div class="answers-section">
            <h3>Chọn đáp án đúng:</h3>
            <div class="answers-grid" id="practice-answersGrid"></div>
          </div>

          <div class="next-section">
            <button id="practice-nextBtn" class="next-btn" disabled><i class="fas fa-forward"></i> Câu tiếp theo</button>
          </div>
        </div>
      </div>
    </div>
  `;

  try { if (window.HiMathStats) window.HiMathStats.event('panel_mount', { page: 'practice-tinh-toan' }); } catch (e) {}

  // ---------- scoped state ----------
  let totalCorrect = 0, totalWrong = 0, gameCorrect = 0, gameWrong = 0;
  let currentMode = ''; // 'addition'|'subtraction'|'both'
  let currentQuestion = null; let isAnswered = false; let currentAnswer = 0; let autoNextTimeout = null;

  // scoped dom refs
  const selectionPage = container.querySelector('#practice-selectionPage');
  const gamePage = container.querySelector('#practice-gamePage');
  const gameCorrectElement = container.querySelector('#practice-gameCorrect');
  const gameWrongElement = container.querySelector('#practice-gameWrong');
  const gameAccuracyElement = container.querySelector('#practice-gameAccuracy');
  const currentModeElement = container.querySelector('#practice-currentMode');
  const mathExpression = container.querySelector('#practice-mathExpression');
  const answersGrid = container.querySelector('#practice-answersGrid');
  const nextBtn = container.querySelector('#practice-nextBtn');
  const backBtn = container.querySelector('#practice-backBtn');
  const additionOption = container.querySelector('#practice-additionOption');
  const subtractionOption = container.querySelector('#practice-subtractionOption');
  const bothOption = container.querySelector('#practice-bothOption');

  // ---------- navigation ----------
  function showSelectionPage() { selectionPage.classList.add('active'); gamePage.classList.remove('active'); }
  function showGamePage(mode) {
    currentMode = mode; selectionPage.classList.remove('active'); gamePage.classList.add('active'); gameCorrect = 0; gameWrong = 0; updateGameStats(); updateModeDisplay(); generateNewQuestion();
  }

  function updateModeDisplay(){ let modeText=''; let iconClass=''; switch(currentMode){ case 'addition': modeText='Phép Cộng'; iconClass='fas fa-plus-circle'; break; case 'subtraction': modeText='Phép Trừ'; iconClass='fas fa-minus-circle'; break; case 'both': modeText='Cả Hai'; iconClass='fas fa-random'; break; } currentModeElement.innerHTML = `<i class="${iconClass}"></i> ${modeText}`; }

  // ---------- question generation ----------
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

  function generateNewQuestion(){ isAnswered=false; nextBtn.disabled=true; if (autoNextTimeout){ clearTimeout(autoNextTimeout); autoNextTimeout=null; } let operationType = currentMode; if (operationType === 'both'){ operationType = Math.random()>0.5 ? 'addition' : 'subtraction'; } currentQuestion = operationType==='addition' ? generateAdditionQuestion() : generateSubtractionQuestion(); displayQuestion(); generateAnswers(); }

  function generateAdditionQuestion(){ const numberOfTerms = getRandomNumber(2,5); const numbers=[]; let sum=0; for (let i=0;i<numberOfTerms;i++){ if (i===numberOfTerms-1){ const maxNumber = 20 - sum; numbers.push(maxNumber<=0?0:getRandomNumber(1,maxNumber)); sum += numbers[i]; } else { const maxForThis = Math.min(10, 20 - sum - (numberOfTerms - i - 1)); const number = getRandomNumber(1, Math.max(1, maxForThis)); numbers.push(number); sum += number; } } currentAnswer = sum; return { type:'addition', numbers, answer:sum, expression: numbers.join(' + ') }; }

  function generateSubtractionQuestion(){ const numberOfNumbers = getRandomNumber(2,5); const numbers=[]; let firstNumber = getRandomNumber(5,20); numbers.push(firstNumber); let result = firstNumber; for (let i=1;i<numberOfNumbers;i++){ const maxSubtract = result - 1; if (maxSubtract <= 0){ numbers.push(0); } else { const subtractNumber = getRandomNumber(1, maxSubtract); numbers.push(subtractNumber); result -= subtractNumber; } } currentAnswer = result; return { type:'subtraction', numbers, answer:result, expression: numbers.join(' - ') }; }

  function displayQuestion(){ mathExpression.innerHTML=''; const isAddition = currentQuestion.type==='addition'; const numbers = currentQuestion.numbers; const operator = isAddition?'+':'-'; numbers.forEach((number,index)=>{ const numberElement = document.createElement('div'); numberElement.className='number'; numberElement.textContent = number; mathExpression.appendChild(numberElement); if (index < numbers.length -1){ const operatorElement = document.createElement('div'); operatorElement.className='operator'; operatorElement.textContent = operator; mathExpression.appendChild(operatorElement); } }); const equalElement = document.createElement('div'); equalElement.className='equal'; equalElement.textContent='='; mathExpression.appendChild(equalElement); const questionMarkElement = document.createElement('div'); questionMarkElement.className='question-mark'; questionMarkElement.textContent='?'; mathExpression.appendChild(questionMarkElement); }

  function generateAnswers(){ answersGrid.innerHTML=''; const correctAnswer = currentAnswer; const answers=[correctAnswer]; while (answers.length<4){ let wrongAnswer; const offset = getRandomNumber(1,3); const shouldAdd = Math.random()>0.5; wrongAnswer = shouldAdd ? correctAnswer + offset : correctAnswer - offset; if (wrongAnswer>=0 && wrongAnswer<=20 && !answers.includes(wrongAnswer)) answers.push(wrongAnswer); } const shuffled = shuffleArray(answers); shuffled.forEach(answer=>{ const btn = document.createElement('button'); btn.className='answer-btn'; btn.textContent = answer; btn.dataset.value = answer; btn.dataset.correct = answer===correctAnswer? 'true':'false'; btn.addEventListener('click', () => handleAnswerClick(btn)); answersGrid.appendChild(btn); }); }

  function handleAnswerClick(clickedButton){
    if (isAnswered) return;
    isAnswered = true;
    const isCorrect = clickedButton.dataset.correct === 'true';
    const allAnswerButtons = container.querySelectorAll('.answer-btn');
    allAnswerButtons.forEach(button => {
      button.disabled = true;
      if (button.dataset.correct === 'true') button.classList.add('correct');
      else if (button === clickedButton && !isCorrect) button.classList.add('incorrect');
    });
    if (isCorrect) {
      gameCorrect++; totalCorrect++;
      try { if (window.HiMathStats) window.HiMathStats.record('practice_math_attempt', { mode: currentMode, question: currentQuestion, chosen: clickedButton.dataset.value, correct: true }); } catch(e) {}
      // play long correct then next
      playSoundFile('sound_correct_answer_long.mp3').then(() => nextQuestion());
    } else {
      gameWrong++; totalWrong++;
      try { if (window.HiMathStats) window.HiMathStats.record('practice_math_attempt', { mode: currentMode, question: currentQuestion, chosen: clickedButton.dataset.value, correct: false }); } catch(e) {}
      // play wrong long then next
      playSoundFile('sound_wrong_answer_long.mp3').then(() => nextQuestion());
    }
    updateGameStats();
    nextBtn.disabled = false;
  }


  function nextQuestion(){ if (autoNextTimeout){ clearTimeout(autoNextTimeout); autoNextTimeout=null; } generateNewQuestion(); }

  function updateGameStats(){ gameCorrectElement.textContent = gameCorrect; gameWrongElement.textContent = gameWrong; const total = gameCorrect + gameWrong; let accuracy = 0; if (total>0) accuracy = Math.round((gameCorrect/total)*100); gameAccuracyElement.textContent = `${accuracy}%`; }

  function getRandomNumber(min,max){ return Math.floor(Math.random()*(max-min+1))+min; }
  function shuffleArray(arr){ const s=[...arr]; for (let i=s.length-1;i>0;i--){ const j = Math.floor(Math.random()*(i+1)); [s[i],s[j]]=[s[j],s[i]]; } return s; }

  // events
  additionOption.addEventListener('click', () => showGamePage('addition'));
  subtractionOption.addEventListener('click', () => showGamePage('subtraction'));
  bothOption.addEventListener('click', () => showGamePage('both'));
  backBtn.addEventListener('click', showSelectionPage);
  nextBtn.addEventListener('click', nextQuestion);

  // init
  showSelectionPage();

  // cleanup
  container._practiceCleanup = () => {
    additionOption.removeEventListener('click', () => showGamePage('addition'));
    subtractionOption.removeEventListener('click', () => showGamePage('subtraction'));
    bothOption.removeEventListener('click', () => showGamePage('both'));
    backBtn.removeEventListener('click', showSelectionPage);
    nextBtn.removeEventListener('click', nextQuestion);
    if (autoNextTimeout){ clearTimeout(autoNextTimeout); autoNextTimeout=null; }
    try { if (currentAudio) { currentAudio.pause(); currentAudio.currentTime = 0; currentAudio = null; } } catch(e) {}
    delete container._practiceCleanup;
    try { if (window.HiMathStats) window.HiMathStats.event('panel_unmount', { page: 'practice-tinh-toan' }); } catch (e) {}
  };
}

export function unmount(container){ if (!container) return; if (container._practiceCleanup) container._practiceCleanup(); }
