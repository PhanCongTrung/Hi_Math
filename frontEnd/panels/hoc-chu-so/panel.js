export function mount(container) {
  if (!container) return;
  // ensure css is loaded
  if (!document.querySelector('link[data-panel="hoc-chu-so"]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = './panels/hoc-chu-so/style.css';
    link.setAttribute('data-panel','hoc-chu-so');
    document.head.appendChild(link);
  }

  container.innerHTML = `
    <div class="hoc-chu-so-container">
      <header>
        <h1>Học Số 0-9</h1>
      </header>

      <main>
        <div class="audio-section">
          <button id="audioBtn" class="audio-btn">
            <i class="fas fa-volume-up"></i>
            <span>Phát âm</span>
          </button>
        </div>

        <div class="number-section">
          <div class="number-nav-container">
            <button id="prevBtn" class="nav-btn" disabled>
              <i class="fas fa-chevron-left"></i>
            </button>

            <div class="number-display-container">
              <div class="number-icon" id="numberDisplay">0</div>
              <div class="number-name" id="numberName">Số Không</div>
            </div>

            <button id="nextBtn" class="nav-btn">
              <i class="fas fa-chevron-right"></i>
            </button>
          </div>
        </div>

        <div class="icon-quantity-section">
          <div class="icons-wrapper" id="iconsWrapper" aria-hidden="false">
            <!-- Icons representing the current number will be inserted here -->
          </div>
        </div>

        <div class="quick-numbers">
          <div class="numbers-container">
            <!-- Buttons will be inserted by script -->
          </div>
        </div>
      </main>
    </div>

    <audio id="numberAudio" preload="auto"></audio>
  `;

  try { if (window.HiMathStats) window.HiMathStats.event('panel_mount', { page: 'digits-hoc-so' }); } catch (e) {}

  // initialize digits functionality (adapted from main.js)
  const numbersData = [
    { number: 0, name: "Số Không", imageUrl: "https://cdn.pixabay.com/photo/2016/11/29/13/55/balloons-1869796_1280.jpg", audioUrl: "assets/sound/so_khong.mp3" },
    { number: 1, name: "Số Một", imageUrl: "https://cdn.pixabay.com/photo/2016/03/27/22/22/fox-1284512_1280.jpg", audioUrl: "assets/sound/so_mot.mp3" },
    { number: 2, name: "Số Hai", imageUrl: "https://cdn.pixabay.com/photo/2017/07/24/19/57/tiger-2535888_1280.jpg", audioUrl: "assets/sound/so_hai.mp3" },
    { number: 3, name: "Số Ba", imageUrl: "https://cdn.pixabay.com/photo/2015/03/26/09/39/puppy-690104_1280.jpg", audioUrl: "assets/sound/so_ba.mp3" },
    { number: 4, name: "Số Bốn", imageUrl: "https://cdn.pixabay.com/photo/2017/01/20/11/48/hedgehog-1995345_1280.jpg", audioUrl: "assets/sound/so_bon.mp3" },
    { number: 5, name: "Số Năm", imageUrl: "https://cdn.pixabay.com/photo/2016/02/10/16/37/cat-1192026_1280.jpg", audioUrl: "assets/sound/so_nam.mp3" },
    { number: 6, name: "Số Sáu", imageUrl: "https://cdn.pixabay.com/photo/2017/06/09/12/59/dice-2386810_1280.jpg", audioUrl: "assets/sound/so_sau.mp3" },
    { number: 7, name: "Số Bảy", imageUrl: "https://cdn.pixabay.com/photo/2013/04/01/21/31/rainbow-99180_1280.jpg", audioUrl: "assets/sound/so_bay.mp3" },
    { number: 8, name: "Số Tám", imageUrl: "https://cdn.pixabay.com/photo/2015/06/08/15/02/octopus-801125_1280.jpg", audioUrl: "assets/sound/so_tam.mp3" },
    { number: 9, name: "Số Chín", imageUrl: "https://cdn.pixabay.com/photo/2015/10/12/15/11/baseball-984444_1280.jpg", audioUrl: "assets/sound/so_chin.mp3" }
  ];

  let currentNumberIndex = 0;
  const audioElement = container.querySelector('#numberAudio');
  const audioBtn = container.querySelector('#audioBtn');
  const prevBtn = container.querySelector('#prevBtn');
  const nextBtn = container.querySelector('#nextBtn');
  const numberDisplay = container.querySelector('#numberDisplay');
  const numberName = container.querySelector('#numberName');
  const iconsWrapper = container.querySelector('#iconsWrapper');
  const numbersContainer = container.querySelector('.numbers-container');

  function createNumberButtons() {
    numbersContainer.innerHTML = '';
    numbersData.forEach((numberData, index) => {
      const numberBtn = document.createElement('button');
      numberBtn.className = 'number-btn';
      numberBtn.textContent = numberData.number;
      if (index === 0) numberBtn.classList.add('active');
      numberBtn.addEventListener('click', () => changeNumber(index));
      numbersContainer.appendChild(numberBtn);
    });
  }

  function updateDisplay() {
    const currentData = numbersData[currentNumberIndex];
    numberDisplay.textContent = currentData.number;
    numberName.textContent = currentData.name;
    // render N icons to visually represent the number
    renderNumberIcons(currentData.number);
    if (audioElement) {
      try { audioElement.pause(); audioElement.currentTime = 0; } catch (e) {}
      audioElement.onended = null;
      audioElement.src = currentData.audioUrl;
      try { audioElement.load(); } catch(e) {}
      if (audioBtn) { audioBtn.innerHTML = `<i class="fas fa-volume-up"></i><span>Phát âm</span>`; audioBtn.disabled = false; }
    }
    prevBtn.disabled = currentNumberIndex === 0;
    nextBtn.disabled = currentNumberIndex === numbersData.length - 1;
    container.querySelectorAll('.number-btn').forEach(btn => btn.classList.remove('active'));
    const btns = container.querySelectorAll('.number-btn'); if (btns[currentNumberIndex]) btns[currentNumberIndex].classList.add('active');
    // Auto-play audio for the current number when display updates
    // (best-effort; may be blocked by browser autoplay policies)
    try { playAudio(); } catch (e) { /* ignore autoplay failures */ }
  }

  const iconOptions = [
    { cls: 'fas fa-heart', color: '#f44336' },
    { cls: 'fas fa-star', color: '#FFD700' },
    { cls: 'fas fa-apple-alt', color: '#ff6b6b' },
    { cls: 'fas fa-leaf', color: '#4CAF50' },
    { cls: 'fas fa-square', color: '#607D8B' },
    { cls: 'fas fa-lemon', color: '#FFEB3B' },
    { cls: 'fas fa-ice-cream', color: '#FFB6C1' },
    { cls: 'fas fa-carrot', color: '#FF9800' }
  ];

  function renderNumberIcons(count) {
    if (!iconsWrapper) return;
    iconsWrapper.innerHTML = '';
    if (!count || count <= 0) return; // nothing to show for zero
    const choice = iconOptions[Math.floor(Math.random() * iconOptions.length)];
    const frag = document.createDocumentFragment();
    for (let i = 0; i < count; i++) {
      const iEl = document.createElement('i');
      iEl.className = choice.cls;
      iEl.style.color = choice.color;
      iEl.style.fontSize = '2rem';
      iEl.style.margin = '6px';
      frag.appendChild(iEl);
    }
    iconsWrapper.appendChild(frag);
  }

  function changeNumber(index) {
    if (index < 0 || index >= numbersData.length) return;
    currentNumberIndex = index; updateDisplay();
  }

  function playAudio() {
    if (!audioBtn || !audioElement) return;
    audioBtn.innerHTML = `<i class="fas fa-volume-up"></i><span>Đang phát...</span>`;
    audioBtn.disabled = true;
    try { audioElement.pause(); audioElement.currentTime = 0; } catch(e) {}
    audioElement.onended = () => {
      if (audioBtn) { audioBtn.innerHTML = `<i class="fas fa-volume-up"></i><span>Phát âm</span>`; audioBtn.disabled = false; }
      audioElement.onended = null;
    };
    const p = audioElement.play();
    if (p && typeof p.then === 'function') p.catch(err => { console.error(err); if (audioBtn) { audioBtn.innerHTML = `<i class="fas fa-volume-up"></i><span>Phát âm</span>`; audioBtn.disabled = false; } });
  }

  function handleKeydown(event) {
    switch(event.key) {
      case 'ArrowLeft': if (currentNumberIndex > 0) changeNumber(currentNumberIndex - 1); break;
      case 'ArrowRight': if (currentNumberIndex < numbersData.length - 1) changeNumber(currentNumberIndex + 1); break;
      case ' ': case 'Enter': event.preventDefault(); playAudio(); break;
      default: if (/^[0-9]$/.test(event.key)) changeNumber(Number(event.key));
    }
  }

  createNumberButtons(); updateDisplay();
  // named handlers so they can be removed cleanly on unmount
  const audioClickHandler = (e) => { e.preventDefault(); playAudio(); };
  const prevClickHandler = (e) => { e.preventDefault(); changeNumber(Math.max(0, currentNumberIndex - 1)); };
  const nextClickHandler = (e) => { e.preventDefault(); changeNumber(Math.min(numbersData.length - 1, currentNumberIndex + 1)); };
  audioBtn?.addEventListener('click', audioClickHandler);
  prevBtn?.addEventListener('click', prevClickHandler);
  nextBtn?.addEventListener('click', nextClickHandler);
  document.addEventListener('keydown', handleKeydown);

  // store cleanup on container
  container._hocChuSoCleanup = () => {
    document.removeEventListener('keydown', handleKeydown);
    audioBtn?.removeEventListener('click', audioClickHandler);
    prevBtn?.removeEventListener('click', prevClickHandler);
    nextBtn?.removeEventListener('click', nextClickHandler);
    try { audioElement.pause(); audioElement.currentTime = 0; audioElement.src = ''; audioElement.onended = null; } catch(e) {}
    delete container._hocChuSoCleanup;
    try { if (window.HiMathStats) window.HiMathStats.event('panel_unmount', { page: 'digits-hoc-so' }); } catch (e) {}
  };
}

export function unmount(container) {
  if (!container) return; if (container._hocChuSoCleanup) container._hocChuSoCleanup(); }