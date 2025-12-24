// Minimal placeholder panel for "Tính bằng Ngón Tay"
export function mount(container) {
	if (!container) return;

	// ensure css is loaded
	if (!document.querySelector('link[data-panel="practice-nhan-ngon"]')) {
		const link = document.createElement('link');
		link.rel = 'stylesheet';
		link.href = './panels/practice-nhan-ngon/style.css';
		link.setAttribute('data-panel','practice-nhan-ngon');
		document.head.appendChild(link);
	}

	container.innerHTML = `
		<div class="practice-nhan-placeholder">
			<div class="placeholder-header">
				<h2>Tính bằng Ngón Tay</h2>
				<p class="subtitle">Nội dung tạm thời — sẽ cập nhật</p>
			</div>
			<div class="placeholder-body">
				<p>Đây là nội dung tạm cho mục luyện tập "Tính bằng Ngón Tay". Các tính năng nhận diện đã được xóa tạm.</p>
				<div class="placeholder-actions">
					<button id="nhan-demoBtn" class="nhan-btn">Nhấp thử</button>
				</div>
			</div>
		</div>
	`;

	const demoBtn = container.querySelector('#nhan-demoBtn');
	function onDemoClick() {
		alert('Demo: đây là nội dung tạm cho "Tính bằng Ngón Tay".');
	}
	demoBtn?.addEventListener('click', onDemoClick);

	// cleanup handler
	container._practiceNhanCleanup = () => {
		demoBtn?.removeEventListener('click', onDemoClick);
		delete container._practiceNhanCleanup;
	};
}

export function unmount(container) {
	if (!container) return;
	if (container._practiceNhanCleanup) container._practiceNhanCleanup();
}
