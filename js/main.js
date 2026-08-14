// ── Dark / light mode ──────────────────────────────────────────
(function () {
  const saved = localStorage.getItem('theme');
  // Default is light; only apply dark if explicitly saved
  if (saved === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
})();

document.addEventListener('DOMContentLoaded', () => {

  // Toggle button
  const toggle = document.querySelector('.theme-toggle');
  toggle?.addEventListener('click', () => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    if (isDark) {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('theme', 'light');
    } else {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('theme', 'dark');
    }
  });

  // ── Nav burger ───────────────────────────────────────────────
  const burger = document.querySelector('.nav-burger');
  const links  = document.querySelector('.nav-links');
  burger?.addEventListener('click', () => {
    const open = burger.getAttribute('aria-expanded') === 'true';
    burger.setAttribute('aria-expanded', String(!open));
    links?.classList.toggle('open', !open);
  });
  links?.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    links.classList.remove('open');
    burger?.setAttribute('aria-expanded', 'false');
  }));

  // ── Active nav link ──────────────────────────────────────────
  const path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a, .nav-home').forEach(a => {
    const href = (a.getAttribute('href') || '').split('/').pop() || 'index.html';
    if (href === path) a.classList.add('active');
  });

  // ── Scroll reveal ────────────────────────────────────────────
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } });
  }, { threshold: 0.1 });
  document.querySelectorAll('.reveal').forEach(el => obs.observe(el));

  // ── Year ─────────────────────────────────────────────────────
  document.querySelectorAll('.yr').forEach(el => el.textContent = new Date().getFullYear());
});

// ── Lab Book gate ────────────────────────────────────────────────
(function () {
  const PASSWORD = 'labbook2026'; // ← change this
  const SESSION_KEY = 'labbook_unlocked';
  const OPEN_LOCK_SVG = `<svg class="lock-icon" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 7.5-4.5"/></svg>`;
  const CLOSED_LOCK_SVG = `<svg class="lock-icon" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`;

  function isUnlocked() {
    return sessionStorage.getItem(SESSION_KEY) === '1';
  }

  function updateNavIcon() {
    // Plusieurs liens Lab Book par page (nav + footer) : on les traite tous.
    document.querySelectorAll('.js-labbook-link').forEach(link => {
      const svg = link.querySelector('svg');
      if (svg) svg.outerHTML = isUnlocked() ? OPEN_LOCK_SVG : CLOSED_LOCK_SVG;
    });
  }

  // Inject gate modal into DOM
  const gateHTML = `
  <div class="gate-overlay" id="gate-overlay" role="dialog" aria-modal="true">
    <div class="gate-box">
      <div class="gate-lock">
        <svg viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
      </div>
      <div class="gate-title">Lab Book</div>
      <p class="gate-sub">This section is private.<br/>Enter the passphrase to access it.</p>
      <input class="gate-input" id="gate-input" type="password" placeholder="Passphrase…" autocomplete="off"/>
      <p class="gate-error" id="gate-error"></p>
      <button class="gate-btn" id="gate-submit">Unlock</button>
      <button class="gate-cancel" id="gate-cancel">Cancel</button>
    </div>
  </div>`;
  document.body.insertAdjacentHTML('beforeend', gateHTML);

  const overlay  = document.getElementById('gate-overlay');
  const input    = document.getElementById('gate-input');
  const errEl    = document.getElementById('gate-error');
  const submitBtn = document.getElementById('gate-submit');
  const cancelBtn = document.getElementById('gate-cancel');

  let lastFocused = null;

  function openGate() {
    lastFocused = document.activeElement;
    errEl.textContent = '';
    input.value = '';
    overlay.classList.add('open');
    setTimeout(() => input.focus(), 60);
  }

  function closeGate() {
    overlay.classList.remove('open');
    lastFocused?.focus();
  }

  // Piège de focus : Tab reste dans la modale tant qu'elle est ouverte.
  overlay.addEventListener('keydown', e => {
    if (e.key === 'Escape') { closeGate(); return; }
    if (e.key !== 'Tab') return;
    const focusables = [input, submitBtn, cancelBtn];
    const first = focusables[0], last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });

  function tryUnlock() {
    if (input.value === PASSWORD) {
      sessionStorage.setItem(SESSION_KEY, '1');
      overlay.classList.remove('open');
      updateNavIcon();
      window.location.href = 'labbook.html';
    } else {
      errEl.textContent = 'Incorrect passphrase. Try again.';
      input.select();
    }
  }

  submitBtn.addEventListener('click', tryUnlock);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') tryUnlock(); });
  cancelBtn.addEventListener('click', closeGate);
  overlay.addEventListener('click', e => { if (e.target === overlay) closeGate(); });

  // Intercept nav click
  document.addEventListener('DOMContentLoaded', () => {
    updateNavIcon();
    document.querySelectorAll('.js-labbook-link').forEach(link => {
      link.addEventListener('click', e => {
        if (!isUnlocked()) {
          e.preventDefault();
          openGate();
        }
      });
    });
    // If currently on labbook.html and not unlocked, redirect
    if (window.location.pathname.endsWith('labbook.html') && !isUnlocked()) {
      window.location.href = 'index.html';
    }
  });
})();
