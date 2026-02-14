console.log("✅ script.js cargado");

// ===== CONFIG =====
const WHATS_NUMBER = "5939111112"; // <-- CAMBIA AQUÍ tu número real (sin +, sin espacios)
const WHATS_BASE = `https://wa.me/${WHATS_NUMBER}?text=`;

// ===== Año =====
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
const nav = document.querySelector('.nav');

function closeMenu() {
  navLinks?.classList.remove('open');
  toggleBtn?.setAttribute('aria-expanded', 'false');
}

if (toggleBtn && navLinks) {
  toggleBtn.addEventListener('click', () => {
    const isOpen = navLinks.classList.toggle('open');
    toggleBtn.setAttribute('aria-expanded', String(isOpen));
  });

  navLinks.addEventListener('click', (e) => {
    const t = e.target;
    if (t && t.tagName === 'A') closeMenu();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMenu();
  });
}

window.addEventListener('scroll', () => {
  if (!nav) return;
  nav.classList.toggle('scrolled', window.scrollY > 10);
});

// ===== Reveal =====
const revealEls = document.querySelectorAll('.reveal');
if (revealEls.length) {
  const revealObs = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) entry.target.classList.add('show');
    });
  }, { threshold: 0.15 });

  revealEls.forEach((el) => revealObs.observe(el));
}

// ===== Link activo por sección =====
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

// ===== To Top =====
const toTop = document.getElementById('toTop');
window.addEventListener('scroll', () => {
  if (!toTop) return;
  toTop.classList.toggle('show', window.scrollY > 300);
});
toTop?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

// ===== Toast =====
const toast = document.getElementById('toast');
let toastTimer = null;

function showToast(message) {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
}

// ===== Promo counter =====
const promoCounter = document.getElementById('promoCounter');
const promoCounters = document.querySelectorAll('[data-counter="promo"]');

let spots = 12;
function setSpots(n) {
  spots = Math.max(3, n);
  if (promoCounter) promoCounter.textContent = String(spots);
  promoCounters.forEach((el) => (el.textContent = String(spots)));
}
setSpots(spots);

setInterval(() => {
  if (spots > 3) setSpots(spots - 1);
}, 9000);

// ===== Mini carrito (WhatsApp) =====
const cart = [];
const cartItemsEl = document.getElementById('cartItems');
const cartTotalEl = document.getElementById('cartTotal');
const ctaCart = document.getElementById('ctaCart');

function money(n) {
  return (Math.round(n * 100) / 100).toFixed(2);
}

function updateCartUI() {
  const total = cart.reduce((s, i) => s + i.price, 0);
  if (cartItemsEl) cartItemsEl.textContent = String(cart.length);
  if (cartTotalEl) cartTotalEl.textContent = money(total);

  if (ctaCart) {
    const lines = cart.map((i, idx) => `${idx + 1}. ${i.name} ($${money(i.price)})`).join('%0A');
    const msg = cart.length
      ? `Hola Poema Café, quiero pedir:%0A${lines}%0A%0ATotal: $${money(total)}%0A¿Me ayudan por favor? 😊`
      : `Hola Poema Café, quiero hacer un pedido. 😊`;
    ctaCart.href = WHATS_BASE + msg;
  }
}

document.querySelectorAll('[data-add]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const name = btn.getAttribute('data-add') || 'Producto';
    const price = Number(btn.getAttribute('data-price') || 0);
    cart.push({ name, price });
    updateCartUI();
    showToast(`✅ Añadido: ${name}`);
  });
});
updateCartUI();

// ===== Formulario a WhatsApp =====
const form = document.getElementById('contactForm');
const formMsg = document.getElementById('formMsg');

function setFormMsg(text, ok = true) {
  if (!formMsg) return;
  formMsg.textContent = text;
  formMsg.classList.remove('ok', 'bad');
  formMsg.classList.add(ok ? 'ok' : 'bad');
  setTimeout(() => {
    formMsg.textContent = '';
    formMsg.classList.remove('ok', 'bad');
  }, 4200);
}

form?.addEventListener('submit', (e) => {
  e.preventDefault();

  const name = document.getElementById('name')?.value?.trim() || '';
  const email = document.getElementById('email')?.value?.trim() || '';
  const message = document.getElementById('message')?.value?.trim() || '';

  if (name.length < 2 || !email.includes('@') || message.length < 5) {
    setFormMsg('⚠️ Revisa: nombre, correo válido y mensaje (mínimo 5 caracteres).', false);
    return;
  }

  const msg = `Hola Poema Café, soy ${encodeURIComponent(name)}.%0A` +
              `Mi correo: ${encodeURIComponent(email)}%0A` +
              `Mensaje: ${encodeURIComponent(message)}%0A😊`;

  window.open(WHATS_BASE + msg, '_blank', 'noopener,noreferrer');
  setFormMsg('✅ Listo: se abrirá WhatsApp para enviarnos tu mensaje.');
  form.reset();
});

// ===== Map hint =====
document.getElementById('mapHint')?.addEventListener('click', () => {
  showToast('📍 Google Maps → Compartir → Insertar un mapa → Copiar HTML (iframe) y pegarlo en Ubicación.');
});

// ===== CTAs WhatsApp =====
function setHref(id, text) {
  const el = document.getElementById(id);
  if (!el) return;
  el.href = WHATS_BASE + text;
}

const reserveText = 'Hola%20Poema%20Caf%C3%A9%2C%20quiero%20reservar%20una%20mesa%20para%20hoy.%20%F0%9F%98%8A';
const promoText = 'Hola%20Poema%20Caf%C3%A9%2C%20quiero%20la%20promo%20de%202%20capuchinos%20por%20%246.00%20y%20reservar%20una%20mesa.%20%F0%9F%98%8A';

setHref('ctaHero', reserveText);
setHref('ctaSticky', reserveText);
setHref('ctaNav', reserveText);
setHref('ctaPromo', promoText);
setHref('ctaWhatsLocation', 'Hola%20Poema%20Caf%C3%A9%2C%20quiero%20reservar%20una%20mesa.%20%F0%9F%98%8A');

const waFloat = document.getElementById('waFloat');
if (waFloat) waFloat.href = WHATS_BASE + reserveText;
