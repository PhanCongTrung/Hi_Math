(function () {
  const sidebar = document.querySelector('[data-sidebar]');
  const backdrop = document.querySelector('[data-backdrop]');
  const toggleBtn = document.querySelector('[data-action="toggle-sidebar"]');
  const authBackdrop = document.querySelector('[data-auth-backdrop]');
  const authOpenBtn = document.querySelector('[data-action="open-auth"]');
  const authCloseBtn = document.querySelector('[data-auth-close]');
  const authForm = document.querySelector('[data-auth-form]');
  const authEmail = document.querySelector('[data-auth-email]');

  const AUTH_KEY = 'hm_is_authed';

  const locks = {
    sidebar: false,
    auth: false,
  };

  function isAuthed() {
    return localStorage.getItem(AUTH_KEY) === '1';
  }

  function syncScrollLock() {
    const shouldLock = Boolean(locks.sidebar || locks.auth);
    document.body.style.overflow = shouldLock ? 'hidden' : '';
  }

  function isMobileLayout() {
    return window.matchMedia('(max-width: 900px)').matches;
  }

  function openSidebar() {
    if (!sidebar || !backdrop) return;
    sidebar.classList.add('is-open');
    backdrop.hidden = false;
    locks.sidebar = true;
    syncScrollLock();
  }

  function closeSidebar() {
    if (!sidebar || !backdrop) return;
    sidebar.classList.remove('is-open');
    backdrop.hidden = true;
    locks.sidebar = false;
    syncScrollLock();
  }

  function openAuth() {
    if (!authBackdrop) return;
    authBackdrop.hidden = false;
    locks.auth = true;
    syncScrollLock();
    setTimeout(() => authEmail?.focus(), 0);
  }

  function closeAuth() {
    if (!authBackdrop) return;
    authBackdrop.hidden = true;
    locks.auth = false;
    syncScrollLock();
  }

  function toggleSidebar() {
    if (!sidebar || !backdrop) return;
    const isOpen = sidebar.classList.contains('is-open');
    if (isOpen) closeSidebar();
    else openSidebar();
  }

  toggleBtn?.addEventListener('click', () => {
    if (!isMobileLayout()) return;
    toggleSidebar();
  });

  backdrop?.addEventListener('click', closeSidebar);

  authOpenBtn?.addEventListener('click', () => {
    openAuth();
  });

  authCloseBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    closeAuth();
  });

  document.addEventListener('click', (e) => {
    const el = e.target;
    if (!(el instanceof HTMLElement)) return;

    const closeEl = el.closest('[data-auth-close]');
    if (closeEl) {
      e.preventDefault();
      closeAuth();
    }
  });

  authBackdrop?.addEventListener('click', (e) => {
    if (e.target === authBackdrop) closeAuth();
  });

  window.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (locks.auth) closeAuth();
    else closeSidebar();
  });

  window.addEventListener('resize', () => {
    if (!isMobileLayout()) {
      if (backdrop) backdrop.hidden = true;
      if (sidebar) sidebar.classList.remove('is-open');
      locks.sidebar = false;
      syncScrollLock();
    }
  });

  // dropdown behavior
  const dropdownBtns = document.querySelectorAll('[data-dropdown]');
  dropdownBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const key = btn.getAttribute('data-dropdown');
      if (!key) return;

      const panel = document.querySelector(`[data-submenu="${key}"]`);
      const expanded = btn.getAttribute('aria-expanded') === 'true';

      btn.setAttribute('aria-expanded', expanded ? 'false' : 'true');
      panel?.classList.toggle('is-open', !expanded);

      const chev = btn.querySelector('.nav__chev');
      if (chev) {
        chev.style.transform = expanded ? 'rotate(0deg)' : 'rotate(180deg)';
      }
    });
  });

  // active state for top-level items
  const navItems = document.querySelectorAll('[data-nav]');
  navItems.forEach((a) => {
    a.addEventListener('click', (e) => {
      e.preventDefault();

      const key = a.getAttribute('data-nav');
      if (key === 'users' && !isAuthed()) {
        openAuth();
        return;
      }

      navItems.forEach((x) => x.classList.remove('is-active'));
      a.classList.add('is-active');

      if (isMobileLayout()) closeSidebar();
    });
  });

  // close sidebar after clicking any link inside it (mobile)
  sidebar?.addEventListener('click', (e) => {
    const el = e.target;
    if (!(el instanceof HTMLElement)) return;

    const isLink = el.closest('a');
    if (isLink && isMobileLayout()) closeSidebar();
  });

  // Tab switching
  document.addEventListener('click', (e) => {
    const tabBtn = e.target.closest('[data-auth-tab]');
    if (tabBtn) {
      const target = tabBtn.getAttribute('data-auth-tab');
      document.querySelectorAll('[data-auth-tab]').forEach(t => t.classList.remove('is-active'));
      document.querySelectorAll('[data-auth-form]').forEach(f => f.hidden = true);
      tabBtn.classList.add('is-active');
      const form = document.querySelector(`[data-auth-form="${target}"]`);
      if (form) {
        form.hidden = false;
        const firstInput = form.querySelector('input');
        if (firstInput) firstInput.focus();
      }
    }

    const switchBtn = e.target.closest('[data-switch-to]');
    if (switchBtn) {
      const target = switchBtn.getAttribute('data-switch-to');
      document.querySelectorAll('[data-auth-tab]').forEach(t => t.classList.remove('is-active'));
      document.querySelectorAll('[data-auth-form]').forEach(f => f.hidden = true);
      const tab = document.querySelector(`[data-auth-tab="${target}"]`);
      const form = document.querySelector(`[data-auth-form="${target}"]`);
      if (tab) tab.classList.add('is-active');
      if (form) {
        form.hidden = false;
        const firstInput = form.querySelector('input');
        if (firstInput) firstInput.focus();
      }
    }
  });

  // Handle both forms
  document.querySelectorAll('[data-auth-form]').forEach(form => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const isLogin = form.getAttribute('data-auth-form') === 'login';
      localStorage.setItem(AUTH_KEY, '1');
      closeAuth();
      alert(isLogin ? 'Đăng nhập demo thành công! (Chưa có backend)' : 'Đăng ký demo thành công! (Chưa có backend)');
    });
  });

  // preserve initial main content so we can restore it when clicking 'home'
  const contentElement = document.querySelector('.content');
  const initialContentHTML = contentElement ? contentElement.innerHTML : '';

  // bind interactions that live inside the main content area (re-run after restoring)
  function initDynamicBindings() {
    const features = document.querySelectorAll('[data-feature]');
    features.forEach((f) => {
      // remove previous handler to avoid duplicate alerts when re-binding
      f.replaceWith(f.cloneNode(true));
    });

    // re-query and bind features
    document.querySelectorAll('[data-feature]').forEach((f) => {
      f.addEventListener('click', (e) => {
        e.preventDefault();
        const name = f.getAttribute('data-feature');
        if (!name) return;
        alert(`Bạn vừa chọn: ${name}. (Demo UI — sẽ nối trang thật sau)`);
      });
    });
  }

  // initial bind
  initDynamicBindings();

  // Simple page render when clicking nav items or subitems
  function renderPanel(key, title) {
    const content = document.querySelector('.content');
    if (!content) return;

    // restore original home content
    if (key === 'home') {
      content.innerHTML = initialContentHTML;
      initDynamicBindings();
      return;
    }

    content.innerHTML = `
      <section class="panel" role="region" aria-label="Nội dung ${title}">
        <div class="panel__header">
          <h2>${title}</h2>
        </div>
        <div class="panel__body">Nội dung tạm cho <strong>${title}</strong> (khóa: <code>${key}</code>) — đây là khung xác nhận chuyển trang.</div>
      </section>
    `;
  }

  // Page title mapping for clearer panel headers
  const PAGE_TITLES = {
    'home': 'Trang chủ',
    'digits-hoc-so': 'Học chữ số — Học số',
    'digits-ghep-so': 'Học chữ số — Ghép số',
    'digits-chan-le': 'Học chữ số — Chẵn lẻ',
    'digits-dem-hinh': 'Học chữ số — Đếm hình',
    'compare-so-sanh': 'Phép so sánh — So sánh số',
    'compare-xep-so': 'Phép so sánh — Xếp số',
    'practice-tinh-toan': 'Luyện tập — Tính toán',
    'practice-so-sanh': 'Luyện tập — So sánh',
    'games': 'Trò chơi',
    'users': 'Người dùng',
    'digits': 'Học chữ số',
    'compare': 'Phép so sánh',
    'practice': 'Luyện tập'
  };

  // Click handler for any element that carries data-page.
  // If the clicked element is a dropdown toggle (has class nav__item--btn or attribute data-dropdown)
  // we DO NOT navigate — only when clicking a subitem or a top-level item without submenu.
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-page]');
    if (!el) return;

    // If this element is a dropdown toggle / nav button with submenu, ignore here
    if (el.classList.contains('nav__item--btn') || el.hasAttribute('data-dropdown')) {
      return;
    }

    e.preventDefault();

    const key = el.getAttribute('data-page');
    const rawText = (el.textContent || key || '').trim();
    const title = PAGE_TITLES[key] || rawText || key;

    // update active state: mark the closest top-level nav__item as active
    document.querySelectorAll('.nav__item').forEach(n => n.classList.remove('is-active'));
    const parentItem = el.closest('.nav__item');
    if (parentItem) parentItem.classList.add('is-active');

    // close sidebar on mobile
    if (isMobileLayout()) closeSidebar();

    // render panel with clear title
    renderPanel(key, title);
  });
})();
