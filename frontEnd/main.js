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

  // ===== Home music control =====
  const topbarMusicBtn = document.querySelector('.topbar__music');
  let homeAudio = null;
  let isMusicEnabled = true; // toggle state (user can mute/unmute)
  let isMusicPlaying = false;
  const HOME_TRACK_COUNT = 4;

  function pickRandomHomeTrack() {
    const i = Math.floor(Math.random() * HOME_TRACK_COUNT) + 1;
    return `/assets/sound/sound_music_home_${i}.mp3`;
  }

  function clearHomeAudio() {
    if (!homeAudio) return;
    try {
      homeAudio.pause();
      homeAudio.currentTime = 0;
      homeAudio.removeEventListener('ended', homeAudio._onEnded);
    } catch (e) {}
    homeAudio = null;
    isMusicPlaying = false;
    topbarMusicBtn?.classList.remove('playing');
  }

  function playHomeMusic() {
    if (!isMusicEnabled) return;
    if (isMusicPlaying) return;
    const src = pickRandomHomeTrack();
    homeAudio = new Audio(src);
    homeAudio.volume = 0.35;
    homeAudio._onEnded = () => {
      // play next random track if still enabled
      if (!isMusicEnabled) return clearHomeAudio();
      playHomeMusic();
    };
    homeAudio.addEventListener('ended', homeAudio._onEnded);
    homeAudio.play().then(() => {
      isMusicPlaying = true;
      topbarMusicBtn?.classList.add('playing');
    }).catch(() => {
      // autoplay might be blocked; keep state tidy
      clearHomeAudio();
    });
  }

  function stopHomeMusic() {
    if (!homeAudio) return;
    try {
      homeAudio.pause();
      homeAudio.currentTime = 0;
      homeAudio.removeEventListener('ended', homeAudio._onEnded);
    } catch (e) {}
    homeAudio = null;
    isMusicPlaying = false;
    topbarMusicBtn?.classList.remove('playing');
  }

  topbarMusicBtn?.addEventListener('click', () => {
    isMusicEnabled = !isMusicEnabled;
    if (isMusicEnabled) playHomeMusic();
    else stopHomeMusic();
  });

  // Auto-play on initial load only if we're on home content
  const initialIsHome = true; // page loads with home content by default
  if (initialIsHome) {
    // try to start music (may be blocked by browser)
    setTimeout(() => {
      if (isMusicEnabled) playHomeMusic();
    }, 300);
  }
  // ===== end home music control =====

  // Simple page render when clicking nav items or subitems
  function renderPanel(key, title) {
    const content = document.querySelector('.content');
    if (!content) return;

    // control global home music: stop when navigating away, play when returning
    if (key !== 'home') {
      try { stopHomeMusic(); } catch(e) {}
    } else {
      try { if (isMusicEnabled) playHomeMusic(); } catch(e) {}
    }

    // cleanup any active panel-specific listeners, timers, or mounted modules
    if (content._digitsKeydownHandler) {
      document.removeEventListener('keydown', content._digitsKeydownHandler);
      delete content._digitsKeydownHandler;
    }
    if (content._ghepCleanup) {
      content._ghepCleanup();
      delete content._ghepCleanup;
    }
    if (content._mountedPanel && typeof content._mountedPanel.unmount === 'function') {
      try { content._mountedPanel.unmount(content); } catch(e) { console.warn('Error during panel unmount', e); }
      delete content._mountedPanel;
    }

    // restore original home content
    if (key === 'home') {
      content.innerHTML = initialContentHTML;
      initDynamicBindings();
      return;
    }

    if (key === 'digits-hoc-so') {
      content.innerHTML = '<div class="loading">Đang tải...</div>';
      import('./panels/hoc-chu-so/panel.js').then(mod => {
        if (content._mountedPanel && typeof content._mountedPanel.unmount === 'function') {
          try { content._mountedPanel.unmount(content); } catch(e) { console.warn('Error during panel unmount', e); }
          delete content._mountedPanel;
        }
        mod.mount(content);
        content._mountedPanel = mod;
      }).catch(err => {
        console.error('Failed to load hoc-chu-so panel', err);
        content.innerHTML = '<div class="panel"><h2>Lỗi khi tải panel</h2></div>';
      });
      return;
    }


    if (key === 'digits-ghep-so') {
      content.innerHTML = '<div class="loading">Đang tải...</div>';
      import('./panels/ghep-so/panel.js').then(mod => {
        if (content._mountedPanel && typeof content._mountedPanel.unmount === 'function') {
          try { content._mountedPanel.unmount(content); } catch(e) { console.warn('Error during panel unmount', e); }
          delete content._mountedPanel;
        }
        mod.mount(content);
        content._mountedPanel = mod;
      }).catch(err => {
        console.error('Failed to load ghep-so panel', err);
        content.innerHTML = '<div class="panel"><h2>Lỗi khi tải panel</h2></div>';
      });
      return;
    }

    if (key === 'digits-chan-le') {
      content.innerHTML = '<div class="loading">Đang tải...</div>';
      import('./panels/chan-le/panel.js').then(mod => {
        if (content._mountedPanel && typeof content._mountedPanel.unmount === 'function') {
          try { content._mountedPanel.unmount(content); } catch(e) { console.warn('Error during panel unmount', e); }
          delete content._mountedPanel;
        }
        mod.mount(content);
        content._mountedPanel = mod;
      }).catch(err => {
        console.error('Failed to load chan-le panel', err);
        content.innerHTML = '<div class="panel"><h2>Lỗi khi tải panel</h2></div>';
      });
      return;
    }

    if (key === 'digits-dem-so') {
      content.innerHTML = '<div class="loading">Đang tải...</div>';
      import('./panels/dem-so/panel.js').then(mod => {
        if (content._mountedPanel && typeof content._mountedPanel.unmount === 'function') {
          try { content._mountedPanel.unmount(content); } catch(e) { console.warn('Error during panel unmount', e); }
          delete content._mountedPanel;
        }
        mod.mount(content);
        content._mountedPanel = mod;
      }).catch(err => {
        console.error('Failed to load dem-so panel', err);
        content.innerHTML = '<div class="panel"><h2>Lỗi khi tải panel</h2></div>';
      });
      return;
    }

    if (key === 'compare-so-sanh') {
      content.innerHTML = '<div class="loading">Đang tải...</div>';
      import('./panels/so-sanh/panel.js').then(mod => {
        if (content._mountedPanel && typeof content._mountedPanel.unmount === 'function') {
          try { content._mountedPanel.unmount(content); } catch(e) { console.warn('Error during panel unmount', e); }
          delete content._mountedPanel;
        }
        mod.mount(content);
        content._mountedPanel = mod;
      }).catch(err => {
        console.error('Failed to load so-sanh panel', err);
        content.innerHTML = '<div class="panel"><h2>Lỗi khi tải panel</h2></div>';
      });
      return;
    }

    if (key === 'compare-xep-so') {
      content.innerHTML = '<div class="loading">Đang tải...</div>';
      import('./panels/xep-so/panel.js').then(mod => {
        if (content._mountedPanel && typeof content._mountedPanel.unmount === 'function') {
          try { content._mountedPanel.unmount(content); } catch(e) { console.warn('Error during panel unmount', e); }
          delete content._mountedPanel;
        }
        mod.mount(content);
        content._mountedPanel = mod;
      }).catch(err => {
        console.error('Failed to load xep-so panel', err);
        content.innerHTML = '<div class="panel"><h2>Lỗi khi tải panel</h2></div>';
      });
      return;
    }

    if (key === 'practice-tinh-toan') {
      content.innerHTML = '<div class="loading">Đang tải...</div>';
      import('./panels/practice-tinh-toan/panel.js').then(mod => {
        if (content._mountedPanel && typeof content._mountedPanel.unmount === 'function') {
          try { content._mountedPanel.unmount(content); } catch(e) { console.warn('Error during panel unmount', e); }
          delete content._mountedPanel;
        }
        mod.mount(content);
        content._mountedPanel = mod;
      }).catch(err => {
        console.error('Failed to load practice-tinh-toan panel', err);
        content.innerHTML = '<div class="panel"><h2>Lỗi khi tải panel</h2></div>';
      });
      return;
    }

    if (key === 'practice-nhan-ngon') {
      content.innerHTML = '<div class="loading">Đang tải...</div>';
      import('./panels/practice-nhan-ngon/panel.js').then(mod => {
        if (content._mountedPanel && typeof content._mountedPanel.unmount === 'function') {
          try { content._mountedPanel.unmount(content); } catch(e) { console.warn('Error during panel unmount', e); }
          delete content._mountedPanel;
        }
        mod.mount(content);
        content._mountedPanel = mod;
      }).catch(err => {
        console.error('Failed to load practice-nhan-ngon panel', err);
        content.innerHTML = '<div class="panel"><h2>Lỗi khi tải panel</h2></div>';
      });
      return;
    }

    if (key === 'games-dino') {
      content.innerHTML = '<div class="loading">Đang tải...</div>';
      import('./panels/dino-math/panel.js').then(mod => {
        if (content._mountedPanel && typeof content._mountedPanel.unmount === 'function') {
          try { content._mountedPanel.unmount(content); } catch(e) { console.warn('Error during panel unmount', e); }
          delete content._mountedPanel;
        }
        mod.mount(content);
        content._mountedPanel = mod;
      }).catch(err => {
        console.error('Failed to load dino-math panel', err);
        content.innerHTML = '<div class="panel"><h2>Lỗi khi tải panel</h2></div>';
      });
      return;
    }

    if (key === 'games') {
      // mount the "Hứng táo" overview panel
      content.innerHTML = '<div class="loading">Đang tải...</div>';
      import('./panels/hung-tao/panel.js').then(mod => {
        if (content._mountedPanel && typeof content._mountedPanel.unmount === 'function') {
          try { content._mountedPanel.unmount(content); } catch(e) { console.warn('Error during panel unmount', e); }
          delete content._mountedPanel;
        }
        mod.mount(content);
        content._mountedPanel = mod;
      }).catch(err => {
        console.error('Failed to load hung-tao panel', err);
        content.innerHTML = '<div class="panel"><h2>Lỗi khi tải panel</h2></div>';
      });
      return;
    }

    // fallback simple panel
    content.innerHTML = `
      <div class="panel">
        <h2>${title}</h2>
        <p>Nội dung sẽ được cập nhật.</p>
      </div>
    `;
  }

  // initDigitsPanel moved to panels/hoc-chu-so/panel.js (module)

  // initGhepSoGame is migrated to panels/ghep-so/panel.js (module)

  // Page title mapping for clearer panel headers
  const PAGE_TITLES = {
    'home': 'Trang chủ',
    'digits-hoc-so': 'Học chữ số — Học số',
    'digits-ghep-so': 'Học chữ số — Ghép số',
    'digits-chan-le': 'Học chữ số — Chẵn lẻ',
    'digits-dem-hinh': 'Học chữ số — Đếm hình',
    'digits-dem-so': 'Học chữ số — Đếm số',
    'compare-so-sanh': 'Phép so sánh — So sánh số',
    'compare-xep-so': 'Phép so sánh — Xếp số',
    'practice-tinh-toan': 'Luyện tập — Tính toán',
    'practice-nhan-ngon': 'Luyện tập — Tính bằng ngón tay',
    'practice-so-sanh': 'Luyện tập — So sánh',
    'games': 'Trò chơi',
    'games-dino': 'Trò chơi — Khủng long giỏi toán',
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
