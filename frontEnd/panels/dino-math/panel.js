export function mount(container) {
  if (!container) return;

  // ensure css is loaded
  if (!document.querySelector('link[data-panel="dino-math"]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = './panels/dino-math/style.css';
    link.setAttribute('data-panel','dino-math');
    document.head.appendChild(link);
  }

  container.innerHTML = `
    <div class="dino-panel">
      <div class="game-container">
          <div class="hud">
              <span>Điểm: <span id="score">0</span></span>
              <div id="lives-container" class="lives-wrapper"></div>
          </div>
          <canvas id="gameCanvas" width="800" height="300"></canvas>

          <div id="start-screen" class="overlay">
              <h1>Nhấn Space để bắt đầu</h1>
          </div>
          
          <div id="game-over-screen" class="overlay hidden">
              <h1>THUA CUỘC!</h1>
              <p>Hết mạng rồi. Nhấn Space để chơi lại.</p>
          </div>
      </div>

      <div id="math-modal" class="modal hidden">
          <div class="modal-content">
              <h2>Cơ hội cứu mạng!</h2>
              <p>Trả lời đúng để tiếp tục, sai sẽ mất 1 mạng.</p>
              <div id="math-question" class="question-text">10 + 5 = ?</div>
              <div id="answers-container" class="answers-grid"></div>
          </div>
      </div>
    </div>
  `;

    try { if (window.HiMathStats) window.HiMathStats.event('panel_mount', { page: 'games-dino' }); } catch (e) {}

  // --- SELECTORS (scoped to container) ---
  const qs = sel => container.querySelector(sel);

  // --- KHỞI TẠO BIẾN (kept algorithm intact, only scoped DOM) ---
  const canvas = qs('#gameCanvas');
  const ctx = canvas.getContext('2d');

  let gameRunning = false;
  let score = 0;
  let lives = 5;
  let gameSpeed = 5;
  let obstacles = [];
  let frameId;
  let frameCount = 0;

  const keys = { ArrowUp: false, ArrowDown: false, Space: false };

  const dino = {
      x: 50,
      y: 200,
      originalWidth: 40,
      originalHeight: 44,
      duckWidth: 55,
      duckHeight: 25,
      width: 40,
      height: 44,
      dy: 0,
      jumpPower: -8.5,
      gravity: 0.25,
      grounded: false,
      isDucking: false,
      color: '#555'
  };

  const obstacleConfig = { minGap: 500, groundY: 240 };

  // Sprites (unchanged)
  const dinoStandSprite = [
    [0,0,0,0,0,0,1,1,1,1],
    [0,0,0,0,0,0,1,0,1,1],
    [0,0,0,0,0,0,1,1,1,1],
    [0,0,0,0,0,0,1,1,1,0],
    [1,0,0,1,1,1,1,1,0,0],
    [1,1,1,1,1,1,1,1,1,0],
    [0,0,1,1,1,1,1,0,0,0],
    [0,0,1,1,1,1,1,0,0,0],
    [0,0,1,0,0,1,0,0,0,0],
    [0,0,1,0,0,1,0,0,0,0]
  ];

  const dinoDuckSprite = [
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,1,1,1,1,0,0,0,0],
    [1,0,0,1,1,1,1,1,1,1,1,1,1,0],
    [1,1,1,1,1,1,1,1,1,1,1,0,1,1],
    [0,0,1,1,1,1,1,1,1,0,0,0,0,0],
    [0,0,1,0,0,1,0,0,0,0,0,0,0,0],
    [0,0,1,0,0,1,0,0,0,0,0,0,0,0]
  ];

  const cactusSprite = [
    [0,0,1,1,0,0],
    [0,1,1,1,0,0],
    [1,1,1,1,1,0],
    [1,1,1,1,1,0],
    [0,1,1,1,1,1],
    [0,1,1,1,1,0],
    [0,0,1,1,0,0],
    [0,0,1,1,0,0],
    [0,0,1,1,0,0],
    [0,0,1,1,0,0]
  ];

  const birdSprite = [
    [0,0,0,0,0,1,0,0],
    [0,0,1,1,1,1,1,0],
    [1,1,1,1,1,1,0,1],
    [0,0,0,1,1,0,0,0]
  ];

  function drawPixelArt(ctx, sprite, x, y, width, height, color) {
      ctx.fillStyle = color;
      if (!sprite || sprite.length === 0) return;
      const pixelW = width / sprite[0].length;
      const pixelH = height / sprite.length;
      for(let r = 0; r < sprite.length; r++) {
          for(let c = 0; c < sprite[r].length; c++) {
              if(sprite[r][c] === 1) {
                  ctx.fillRect(x + c * pixelW, y + r * pixelH, pixelW, pixelH);
              }
          }
      }
  }

  function updateDino() {
      if (keys.ArrowDown) {
          dino.isDucking = true;
          dino.width = dino.duckWidth;
          dino.height = dino.duckHeight;
          if (dino.grounded) dino.y = obstacleConfig.groundY - dino.duckHeight;
          if (!dino.grounded) dino.dy += 0.5;
      } else {
          dino.isDucking = false;
          dino.width = dino.originalWidth;
          dino.height = dino.originalHeight;
          if (dino.grounded) dino.y = obstacleConfig.groundY - dino.originalHeight;
      }

      if ((keys.Space || keys.ArrowUp) && dino.grounded && !dino.isDucking) {
          dino.dy = dino.jumpPower;
          dino.grounded = false;
      }

      if (!dino.grounded) {
          dino.dy += dino.gravity;
          dino.y += dino.dy;
      }

      if (dino.y + dino.height >= obstacleConfig.groundY) {
          dino.y = obstacleConfig.groundY - dino.height;
          dino.dy = 0;
          dino.grounded = true;
      } else {
          dino.grounded = false;
      }
  }

  function spawnObstacle() {
      let lastObsX = obstacles.length > 0 ? obstacles[obstacles.length - 1].x : 0;
      if (obstacles.length === 0 || canvas.width - lastObsX > obstacleConfig.minGap + Math.random() * 400) {
          const isBird = Math.random() > 0.7 && score > 3;
          if (isBird) {
              obstacles.push({ type: 'bird', x: canvas.width, y: 175 + Math.random() * 20, width: 40, height: 30 });
          } else {
              obstacles.push({ type: 'cactus', x: canvas.width, y: obstacleConfig.groundY - 50, width: 25 + Math.random() * 10, height: 40 + Math.random() * 10 });
          }
      }
  }

  function updateObstacles() {
      for (let i = 0; i < obstacles.length; i++) {
          let obs = obstacles[i];
          obs.x -= gameSpeed;
          if (obs.x + obs.width < 0) {
              obstacles.splice(i, 1);
              score++;
              qs('#score').innerText = score;
              if (score % 5 === 0) gameSpeed += 0.2;
              i--;
          }

          if (
              dino.x + 5 < obs.x + obs.width - 5 && 
              dino.x + dino.width - 5 > obs.x + 5 &&
              dino.y + 5 < obs.y + obs.height - 5 &&
              dino.y + dino.height - 5 > obs.y + 5
          ) {
              handleCollision();
          }
      }
  }

  function drawDino() {
      let currentSprite;
      if (dino.isDucking) currentSprite = dinoDuckSprite;
      else {
          currentSprite = dinoStandSprite;
          let tempSprite = JSON.parse(JSON.stringify(dinoStandSprite));
          if (dino.grounded) {
              if (Math.floor(frameCount / 10) % 2 === 0) {
                  tempSprite[8] = [0,0,1,0,0,0,0,0,0,0];
                  tempSprite[9] = [0,0,1,0,0,0,0,0,0,0];
              } else {
                  tempSprite[8] = [0,0,0,0,0,1,0,0,0,0];
                  tempSprite[9] = [0,0,0,0,0,1,0,0,0,0];
              }
          }
          currentSprite = tempSprite;
      }
      drawPixelArt(ctx, currentSprite, dino.x, dino.y, dino.width, dino.height, '#333');
  }

  function drawObstacles() {
      obstacles.forEach(obs => {
          if (obs.type === 'bird') {
              let currentBird = JSON.parse(JSON.stringify(birdSprite));
              if (Math.floor(frameCount / 15) % 2 === 0) currentBird[0] = [0,0,0,0,0,0,0,0];
              drawPixelArt(ctx, currentBird, obs.x, obs.y, obs.width, obs.height, '#D32F2F');
          } else {
              drawPixelArt(ctx, cactusSprite, obs.x, obs.y, obs.width, obs.height, '#2E7D32');
          }
      });
  }

  function drawGround() {
      ctx.beginPath();
      ctx.moveTo(0, obstacleConfig.groundY);
      ctx.lineTo(canvas.width, obstacleConfig.groundY);
      ctx.strokeStyle = '#555';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#aaa';
      for(let i=0; i<10; i++) {
          let dotX = (frameCount * 5 + i * 100) % canvas.width;
          if(dotX % 2 === 0) ctx.fillRect(dotX, obstacleConfig.groundY + 5 + (i%3)*4, 4, 2);
      }
  }

  function gameLoop() {
      if (!gameRunning) return;
      frameCount++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawGround();
      spawnObstacle();
      updateObstacles();
      drawObstacles();
      updateDino();
      drawDino();
      frameId = requestAnimationFrame(gameLoop);
  }

  // Input listeners (document-level)
  // Use a removable named listener so we can clean up on unmount
  const keydownListener = (e) => {
      // Ngăn cuộn trang
      if (['Space', 'ArrowUp', 'ArrowDown'].includes(e.code)) {
          e.preventDefault();
      }

      if (e.code === 'Space' || e.code === 'ArrowUp') keys.ArrowUp = true;
      if (e.code === 'ArrowDown') keys.ArrowDown = true;
      if (e.code === 'Space') keys.Space = true;

      // --- LOGIC START GAME (Đã sửa lỗi) ---
      // Kiểm tra: Nếu game đang DỪNG và không hiện bảng tính toán
      if (!gameRunning && qs('#math-modal').classList.contains('hidden')) {
          // Bắt đầu lại game (Space cũng khởi động khi Game Over)
          startGame();
      }
  };

  function keyupHandler(e) {
      if (e.code === 'Space' || e.code === 'ArrowUp') keys.ArrowUp = false;
      if (e.code === 'ArrowDown') keys.ArrowDown = false;
      if (e.code === 'Space') keys.Space = false;
  }

  document.addEventListener('keydown', keydownListener);
  document.addEventListener('keyup', keyupHandler);

  function startGame() {
      gameRunning = true;
      score = 0; gameSpeed = 5; lives = 5; obstacles = [];
      qs('#score').innerText = score;
      updateLivesUI();
      qs('#start-screen').classList.add('hidden');
      qs('#game-over-screen').classList.add('hidden');
      // adapt canvas width to container width
      canvas.width = Math.min(900, container.clientWidth - 20) || 800;
      gameLoop();
  }

  function handleCollision() {
      gameRunning = false;
      cancelAnimationFrame(frameId);
      showMathProblem();
  }

  function showMathProblem() {
      const modal = qs('#math-modal');
      modal.classList.remove('hidden');
      const isAddition = Math.random() > 0.5;
      let a = Math.floor(Math.random() * 20);
      let b = Math.floor(Math.random() * 20);
      if (isAddition) b = Math.floor(Math.random() * (20 - a + 1));
      else { if (a < b) { let t=a;a=b;b=t; } }
      const correctAnswer = isAddition ? a + b : a - b;
      const operator = isAddition ? '+' : '-';
      qs('#math-question').innerText = `${a} ${operator} ${b} = ?`;
      let answers = [correctAnswer];
      while (answers.length < 4) {
          let wrongAnswer = Math.floor(Math.random() * 21);
          if (!answers.includes(wrongAnswer)) answers.push(wrongAnswer);
      }
      answers.sort(() => Math.random() - 0.5);
      const containerAnswers = qs('#answers-container');
      containerAnswers.innerHTML = '';
      answers.forEach(ans => {
          const btn = document.createElement('button');
          btn.innerText = ans;
          btn.className = 'answer-btn';
          btn.onclick = () => checkAnswer(ans, correctAnswer, btn);
          containerAnswers.appendChild(btn);
      });
  }

  function checkAnswer(userAns, correctAns, clickedBtn) {
      const allBtns = container.querySelectorAll('.answer-btn');
      allBtns.forEach(b => b.classList.add('disabled'));
      let correctBtnDOM = null;
      allBtns.forEach(b => { if (parseInt(b.innerText) === correctAns) correctBtnDOM = b; });
      if (userAns === correctAns) {
          clickedBtn.classList.add('correct');
          try { if (window.HiMathStats) window.HiMathStats.record('dino_math_attempt', { userAns, correctAns, correct: true, score }); } catch (e) {}
          setTimeout(() => { qs('#math-modal').classList.add('hidden'); resumeGame(); }, 1000);
      } else {
          clickedBtn.classList.add('wrong');
          if (correctBtnDOM) correctBtnDOM.classList.add('correct');
          try { if (window.HiMathStats) window.HiMathStats.record('dino_math_attempt', { userAns, correctAns, correct: false, score }); } catch (e) {}
          setTimeout(() => {
              lives--;
              updateLivesUI();
              qs('#math-modal').classList.add('hidden');
              if (lives > 0) resumeGame(); else qs('#game-over-screen').classList.remove('hidden');
          }, 1000);
      }
  }

  function resumeGame() {
      obstacles = [];
      dino.y = 200; dino.dy = 0; dino.isDucking = false; keys.ArrowDown = false;
      gameRunning = true;
      gameLoop();
  }

  function updateLivesUI() {
      const containerL = qs('#lives-container');
      containerL.innerHTML = '';
      for(let i = 0; i < 5; i++) {
          const heart = document.createElement('span');
          heart.innerHTML = '&#10084;';
          heart.className = 'heart';
          if (i < lives) heart.classList.add('active');
          containerL.appendChild(heart);
      }
  }

  // Start with initial UI
  updateLivesUI();

  // cleanup
  container._dinoCleanup = () => {
      try { document.removeEventListener('keydown', keydownListener); document.removeEventListener('keyup', keyupHandler); } catch(e){}
      try { cancelAnimationFrame(frameId); } catch(e){}
      try { if (window.HiMathStats) window.HiMathStats.event('panel_unmount', { page: 'games-dino', finalScore: score }); } catch (e) {}
      delete container._dinoCleanup;
  };
}

export function unmount(container) {
  if (!container) return;
  if (container._dinoCleanup) container._dinoCleanup();
}
