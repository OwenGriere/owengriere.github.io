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
