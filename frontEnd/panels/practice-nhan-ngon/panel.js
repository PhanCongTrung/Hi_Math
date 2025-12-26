// AI Fingers panel - integrates MediaPipe Hands for finger-counting practice
export function mount(container) {
	if (!container) return;

	// ensure css is loaded
	if (!document.querySelector('link[data-panel="practice-nhan-ngon"]')) {
		const link = document.createElement('link');
		link.rel = 'stylesheet';
		link.href = './panels/practice-nhan-ngon/style.css';
		link.setAttribute('data-panel', 'practice-nhan-ngon');
		document.head.appendChild(link);
	}

	// render panel content (scoped inside container)
	container.innerHTML = `
		<div class="practice-nhan-panel">
			<div class="ai-container">
				<div id="loading">
					<div class="loader"></div>
					<p>Đang tải mô hình AI...</p>
				</div>

				<div class="hud">
					<div class="score">Điểm: <span id="score-val">0</span></div>
					<div class="status">AI đang nhìn thấy: <span id="detected-fingers" style="color:yellow; font-size:1.1em">0</span> ngón</div>
				</div>

				<div class="question-box">
					<span id="question">Đang khởi tạo...</span>
				</div>

				<div class="progress-bar"><div id="progress-fill"></div></div>

				<video id="input_video" playsinline style="display:none"></video>
				<canvas id="output_canvas"></canvas>
			</div>
		</div>
	`;

	try { if (window.HiMathStats) window.HiMathStats.event('panel_mount', { page: 'practice-nhan-ngon' }); } catch (e) {}

	const qs = sel => container.querySelector(sel);

	// dynamic script loader (idempotent)
	function loadScript(src) {
		return new Promise((resolve, reject) => {
			if (document.querySelector(`script[src="${src}"]`)) return resolve();
			const s = document.createElement('script');
			s.src = src;
			s.async = true;
			s.onload = () => resolve();
			s.onerror = () => reject(new Error('Failed to load ' + src));
			document.head.appendChild(s);
		});
	}

	// URLs used in your original source
	const mpScripts = [
		'https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js',
		'https://cdn.jsdelivr.net/npm/@mediapipe/control_utils/control_utils.js',
		'https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js',
		'https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js'
	];

	// DOM elements
	const videoElement = qs('#input_video');
	const canvasElement = qs('#output_canvas');
	const canvasCtx = canvasElement.getContext('2d');
	const scoreEl = qs('#score-val');
	const fingerEl = qs('#detected-fingers');
	const questionEl = qs('#question');
	const loadingEl = qs('#loading');
	const progressEl = qs('.progress-bar');
	const progressFill = qs('#progress-fill');

	// game state
	let score = 0;
	let currentTarget = 0;
	let holdTimer = 0;
	const HOLD_THRESHOLD = 40;
	let isModelLoaded = false;

	// media-pipe objects - will be set after scripts load
	let hands = null;
	let camera = null;

	function newQuestion() {
		let a = Math.floor(Math.random() * 6);
		let b = Math.floor(Math.random() * 5);
		if (Math.random() > 0.5) {
			currentTarget = a + b;
			questionEl.innerText = `${a} + ${b} = ?`;
		} else {
			if (a < b) [a, b] = [b, a];
			currentTarget = a - b;
			questionEl.innerText = `${a} - ${b} = ?`;
		}
		holdTimer = 0;
		progressEl.style.display = 'none';
		progressFill.style.width = '0%';
	}

	function countFingers(landmarks) {
		let count = 0;
		const fingerTips = [8, 12, 16, 20];
		const fingerPips = [6, 10, 14, 18];
		for (let i = 0; i < 4; i++) {
			if (landmarks[fingerTips[i]].y < landmarks[fingerPips[i]].y) count++;
		}
		const thumbTip = landmarks[4];
		const thumbIp = landmarks[3];
		const pinkyMcp = landmarks[17];
		if (Math.abs(thumbTip.x - pinkyMcp.x) > Math.abs(thumbIp.x - pinkyMcp.x)) count++;
		return count;
	}

	function onResults(results) {
		if (!isModelLoaded) {
			isModelLoaded = true;
			loadingEl.style.display = 'none';
			newQuestion();
		}

		// draw frame
		canvasCtx.save();
		canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
		canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

		let totalFingers = 0;
		if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
			for (const landmarks of results.multiHandLandmarks) {
				if (typeof drawConnectors === 'function') drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, {color: '#00FF00', lineWidth: 5});
				if (typeof drawLandmarks === 'function') drawLandmarks(canvasCtx, landmarks, {color: '#FF0000', lineWidth: 2});
				totalFingers += countFingers(landmarks);
			}
		}

		fingerEl.innerText = totalFingers;
		checkAnswer(totalFingers);
		canvasCtx.restore();
	}

	function checkAnswer(detectedNumber) {
		if (detectedNumber === currentTarget) {
			progressEl.style.display = 'block';
			holdTimer++;
			let percentage = (holdTimer / HOLD_THRESHOLD) * 100;
			progressFill.style.width = `${percentage}%`;
			if (holdTimer >= HOLD_THRESHOLD) {
				score++;
				scoreEl.innerText = score;
				canvasElement.style.filter = 'sepia(1) hue-rotate(90deg) saturate(5)';
				setTimeout(() => { canvasElement.style.filter = 'none'; }, 300);
				try { if (window.HiMathStats) window.HiMathStats.record('practice_nhan_attempt', { question: currentTarget, correct: true, score }); } catch (e) {}
				newQuestion();
			}
		} else {
			holdTimer = 0;
			progressFill.style.width = '0%';
			if (holdTimer === 0) progressEl.style.display = 'none';
		}
	}

	// initialize after loading MP scripts
	Promise.all(mpScripts.map(loadScript)).then(() => {
		try {
			// setup canvas size
			canvasElement.width = 1280;
			canvasElement.height = 720;

			hands = new Hands({locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`});
			hands.setOptions({
				maxNumHands: 2,
				modelComplexity: 1,
				minDetectionConfidence: 0.5,
				minTrackingConfidence: 0.5
			});
			hands.onResults(onResults);

			// Camera comes from the camera_utils script
			camera = new Camera(videoElement, {
				onFrame: async () => { await hands.send({image: videoElement}); },
				width: 1280,
				height: 720
			});
			camera.start();
		} catch (err) {
			console.error('Failed to initialize MediaPipe Hands', err);
			loadingEl.innerText = 'Không thể khởi tạo mô hình AI.';
		}
	}).catch(err => {
		console.error('Failed to load MediaPipe scripts', err);
		loadingEl.innerText = 'Không thể tải thư viện AI.';
	});

	// store cleanup
	container._practiceNhanCleanup = () => {
		try { if (camera && typeof camera.stop === 'function') camera.stop(); } catch (e) {}
		try { if (hands && typeof hands.close === 'function') hands.close(); } catch (e) {}
		// remove DOM
		container.innerHTML = '';
		try { if (window.HiMathStats) window.HiMathStats.event('panel_unmount', { page: 'practice-nhan-ngon' }); } catch (e) {}
		// don't remove loaded scripts to avoid breaking other panels
		delete container._practiceNhanCleanup;
	};
}

export function unmount(container) {
	if (!container) return;
	if (container._practiceNhanCleanup) container._practiceNhanCleanup();
}
