// Stats Gateway - central place to collect and queue analytics/events
// This file provides a minimal "gateway" that panels call. It stores a local queue
// when backend is unreachable. Backend endpoints expected:
//  POST /api/stats/visit   (for visit_start / visit_end)
//  POST /api/stats/event   (for other events / attempts)

(function () {
  const QUEUE_KEY = 'hm_stats_queue';
  // hard-coded user id for frontend-only environment (will be replaced by real auth later)
  window.HiMathUserId = window.HiMathUserId || 1;

  function _now() { return Date.now(); }

  function _getQueued() {
    try { return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]'); } catch (e) { return []; }
  }
  function _saveQueued(q) { try { localStorage.setItem(QUEUE_KEY, JSON.stringify(q)); } catch (e) {} }
  function _enqueue(item) { const q = _getQueued(); q.push(item); _saveQueued(q); }

  async function _post(path, body) {
    try {
      const res = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!res.ok) throw new Error('Network response not ok');
      return true;
    } catch (e) {
      try { _enqueue({ path, body, ts: _now() }); } catch (err) {}
      return false;
    }
  }

  // Public API - standardized packets
  const Gateway = {
    // page visit start
    startPage(page, meta) {
      const payload = {
        type: 'visit_start',
        page,
        userId: window.HiMathUserId || null,
        meta: meta || null,
        ts: _now()
      };
      _post('/api/stats/visit', payload);
    },

    // page visit end (duration optional if available)
    endPage(page, meta) {
      const payload = {
        type: 'visit_end',
        page,
        userId: window.HiMathUserId || null,
        meta: meta || null,
        ts: _now()
      };
      _post('/api/stats/visit', payload);
    },

    // generic event
    event(name, data) {
      const payload = {
        type: 'event',
        name,
        userId: window.HiMathUserId || null,
        data: data || {},
        ts: _now()
      };
      _post('/api/stats/event', payload);
    },

    // higher-level helpers
    // record an attempt within a question: gameKey e.g. 'dem-so', 'practice-tinh-toan'
    recordAttempt(gameKey, attemptData) {
      const payload = {
        type: 'attempt',
        game: gameKey,
        userId: window.HiMathUserId || null,
        attempt: attemptData,
        ts: _now()
      };
      _post('/api/stats/event', payload);
    },

    // record level / milestone
    recordLevel(gameKey, level) {
      const payload = {
        type: 'level',
        game: gameKey,
        userId: window.HiMathUserId || null,
        level: level,
        ts: _now()
      };
      _post('/api/stats/event', payload);
    },

    // expose queue for debug / manual flush
    getQueue() { return _getQueued(); },
    clearQueue() { _saveQueued([]); }
  };

  // Provide a compatibility wrapper named HiMathStats used by panels
  window.HiMathStats = window.HiMathStats || {
    startPage: (p, m) => Gateway.startPage(p, m),
    endPage: (p, m) => Gateway.endPage(p, m),
    event: (n, d) => Gateway.event(n, d),
    record: (n, d) => {
      // convenience: if name suggests attempt or level, route accordingly
      if (typeof n === 'string' && n.indexOf('level') !== -1) Gateway.recordLevel(n, d);
      else Gateway.event(n, d);
    },
    recordAttempt: (gameKey, data) => Gateway.recordAttempt(gameKey, data),
    __gateway: Gateway
  };

  // expose gateway directly
  window.StatsGateway = Gateway;
})();
