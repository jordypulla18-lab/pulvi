console.log("✅ script.js cargado");

// Año
const year = document.getElementById('year');
if (year) year.textContent = new Date().getFullYear();

// ===== Tema (Dark/Light) =====
const themeBtn = document.querySelector('.theme-toggle');
const root = document.documentElement;

function applyTheme(theme) {
  root.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);

  if (themeBtn) {
    const isDark = theme === 'dark';
    themeBtn.setAttribute('aria-pressed', String(isDark));
    themeBtn.textContent = isDark ? '☀️' : '🌙';
  }
}

const storedTheme = localStorage.getItem('theme');
const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
applyTheme(storedTheme || (prefersDark ? 'dark' : 'light'));

themeBtn?.addEventListener('click', () => {
  const current = root.getAttribute('data-theme') || 'light';
  applyTheme(current === 'dark' ? 'light' : 'dark');
});

// ===== Menú móvil =====
const toggleBtn = document.querySelector('.nav-toggle');
const navLinks = document.querySelector('.nav-links');

if (toggleBtn && navLinks) {
  toggleBtn.addEventListener('click', () => {
    const isOpen = navLinks.classList.toggle('open');
    toggleBtn.setAttribute('aria-expanded', String(isOpen));
  });

  navLinks.addEventListener('click', (e) => {
    if (e.target.tagName === 'A') {
      navLinks.classList.remove('open');
      toggleBtn.setAttribute('aria-expanded', 'false');
    }
  });
}

// Navbar sombra al hacer scroll
const nav = document.querySelector('.nav');
window.addEventListener('scroll', () => {
  if (!nav) return;
  nav.classList.toggle('scrolled', window.scrollY > 10);
});

// ===== Animación Reveal al scrollear =====
const revealEls = document.querySelectorAll('.reveal');
if (revealEls.length) {
  const revealObs = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) entry.target.classList.add('show');
    });
  }, { threshold: 0.15 });

  revealEls.forEach((el) => revealObs.observe(el));
}

// Link activo por sección
const sections = document.querySelectorAll('section[id]');
const links = document.querySelectorAll('.nav a');

if (sections.length && links.length) {
  const secObs = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const id = entry.target.id;
      links.forEach((a) => {
        a.classList.toggle('active', a.getAttribute('href') === `#${id}`);
      });
    });
  }, { threshold: 0.6 });

  sections.forEach((s) => secObs.observe(s));
}

// Botón subir
const toTop = document.getElementById('toTop');
window.addEventListener('scroll', () => {
  if (!toTop) return;
  toTop.classList.toggle('show', window.scrollY > 300);
});
toTop?.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

// Toast (Añadir)
const toast = document.getElementById('toast');
let toastTimer = null;

function showToast(message) {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
}

document.querySelectorAll('[data-add]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const item = btn.getAttribute('data-add') || 'Producto';
    showToast(`✅ Añadido: ${item}`);
  });
});

// Formulario: mensaje bonito
const form = document.querySelector('.contact-form');
const formMsg = document.getElementById('formMsg');

form?.addEventListener('submit', (e) => {
  e.preventDefault();

  if (formMsg) {
    formMsg.textContent = '✅ ¡Gracias! Tu mensaje fue enviado. Te responderemos pronto.';
    formMsg.classList.add('ok');
    setTimeout(() => {
      formMsg.textContent = '';
      formMsg.classList.remove('ok');
    }, 3500);
  }

  form.reset();
});

