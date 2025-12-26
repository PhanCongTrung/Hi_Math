// users panel removed per frontend-only instrumentation request.
export function mount(container) { if (!container) return; container.innerHTML = '<div class="panel"><h2>Phụ huynh (tạm ẩn)</h2><p>Chức năng phụ huynh được đặt tạm thời ở chế độ frontend-only; backend sẽ cung cấp sau.</p></div>'; }
export function unmount(container) { /* no-op */ }
