console.log("✅ WARM COFFEE script.js cargado");

// =====================
// CONFIG
// =====================
const WHATS_NUMBER = "593991234567"; // <-- CAMBIA AQUÍ (sin +, sin espacios). Ej: 0991234567 => 593991234567
const WHATS_BASE = `https://wa.me/${WHATS_NUMBER}?text=`;

// =====================
// Helpers
// =====================
const $ = (q, el = document) => el.querySelector(q);
const $$ = (q, el = document) => Array.from(el.querySelectorAll(q));

function money(n) {
  return (Math.round(n * 100) / 100).toFixed(2);
}

function showToast(message) {
  const toast = $("#toast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => toast.classList.remove("show"), 2200);
}

// =====================
// Year
// =====================
const year = $("#year");
if (year) year.textContent = new Date().getFullYear();

// =====================
// Theme (Dark/Light)
// =====================
const themeBtn = $(".theme-toggle");
const root = document.documentElement;

function applyTheme(theme) {
  root.setAttribute("data-theme", theme);
  localStorage.setItem("theme", theme);

  if (themeBtn) {
    const isLight = theme === "light";
    themeBtn.setAttribute("aria-pressed", String(!isLight));
    themeBtn.textContent = isLight ? "🌙" : "☀️";
  }
}

const storedTheme = localStorage.getItem("theme");
const prefersLight = !(window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches);
applyTheme(storedTheme || (prefersLight ? "light" : "dark"));

themeBtn?.addEventListener("click", () => {
  const current = root.getAttribute("data-theme") || "light";
  applyTheme(current === "dark" ? "light" : "dark");
});

// =====================
// Mobile menu
// =====================
const toggleBtn = $(".nav-toggle");
const navLinks = $("#navLinks");

function closeMenu() {
  navLinks?.classList.remove("open");
  toggleBtn?.setAttribute("aria-expanded", "false");
}

toggleBtn?.addEventListener("click", () => {
  const isOpen = navLinks?.classList.toggle("open");
  toggleBtn.setAttribute("aria-expanded", String(!!isOpen));
});

navLinks?.addEventListener("click", (e) => {
  const t = e.target;
  if (t && t.tagName === "A") closeMenu();
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeMenu();
});

// =====================
// Reveal on scroll
// =====================
const revealEls = $$(".reveal");
if (revealEls.length) {
  const obs = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) en.target.classList.add("show");
    });
  }, { threshold: 0.14 });

  revealEls.forEach((el) => obs.observe(el));
}

// =====================
// Active link by section
// =====================
const sections = $$("section[id]");
const links = $$(".nav a");
if (sections.length && links.length) {
  const secObs = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const id = entry.target.id;
      links.forEach((a) => a.classList.toggle("active", a.getAttribute("href") === `#${id}`));
    });
  }, { threshold: 0.6 });

  sections.forEach((s) => secObs.observe(s));
}

// =====================
// Scroll progress
// =====================
const scrollBar = $("#scrollBar");
function updateScrollBar() {
  if (!scrollBar) return;
  const h = document.documentElement;
  const max = (h.scrollHeight - h.clientHeight) || 1;
  const p = (h.scrollTop / max) * 100;
  scrollBar.style.width = `${Math.max(0, Math.min(100, p))}%`;
}
window.addEventListener("scroll", updateScrollBar, { passive: true });
updateScrollBar();

// =====================
// To top
// =====================
const toTop = $("#toTop");
window.addEventListener("scroll", () => {
  if (!toTop) return;
  toTop.classList.toggle("show", window.scrollY > 340);
}, { passive: true });

toTop?.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

// =====================
// Cursor glow (desktop)
// =====================
const glow = $("#cursorGlow");
let glowEnabled = window.matchMedia("(pointer:fine)").matches;
if (glow && glowEnabled) {
  glow.style.opacity = "1";
  window.addEventListener("mousemove", (e) => {
    glow.style.left = `${e.clientX}px`;
    glow.style.top = `${e.clientY}px`;
  }, { passive: true });
}

// =====================
// Promo counter
// =====================
const promoCounter = $("#promoCounter");
const promoCounters = $$('[data-counter="promo"]');

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

// =====================
// WhatsApp CTAs
// =====================
function setHref(id, text) {
  const el = document.getElementById(id);
  if (!el) return;
  el.href = WHATS_BASE + text;
}

const reserveText = encodeURIComponent("Hola Poema Café, quiero reservar una mesa para hoy. 😊");
const promoText = encodeURIComponent("Hola Poema Café, quiero la promo de 2 capuchinos por $6.00 y reservar una mesa. 😊");

setHref("ctaHero", reserveText);
setHref("ctaSticky", reserveText);
setHref("ctaNav", reserveText);
setHref("ctaPromo", promoText);
setHref("ctaWhatsLocation", reserveText);

const waFloat = $("#waFloat");
if (waFloat) waFloat.href = WHATS_BASE + reserveText;

// =====================
// Cart (drawer + WhatsApp)
// =====================
const cart = []; // {name, price, qty}
const cartItemsEl = $("#cartItems");
const cartTotalEl = $("#cartTotal");
const ctaCart = $("#ctaCart");
const drawer = $("#drawer");
const drawerList = $("#drawerList");
const drawerTotal = $("#drawerTotal");
const drawerEmpty = $("#drawerEmpty");
const drawerWhats = $("#drawerWhats");

function cartTotal() {
  return cart.reduce((s, i) => s + (i.price * i.qty), 0);
}

function buildWhatsMsg() {
  const total = cartTotal();
  if (!cart.length) return encodeURIComponent("Hola Poema Café, quiero hacer un pedido. 😊");

  const lines = cart
    .map((i, idx) => `${idx + 1}. ${i.name} x${i.qty} ($${money(i.price)} c/u)`)
    .join("\n");

  const msg = `Hola Poema Café, quiero pedir:\n${lines}\n\nTotal: $${money(total)}\n¿Me ayudan por favor? 😊`;
  return encodeURIComponent(msg);
}

function updateCartUI() {
  const total = cartTotal();
  const count = cart.reduce((s, i) => s + i.qty, 0);

  if (cartItemsEl) cartItemsEl.textContent = String(count);
  if (cartTotalEl) cartTotalEl.textContent = money(total);

  const msg = buildWhatsMsg();
  if (ctaCart) ctaCart.href = WHATS_BASE + msg;
  if (drawerWhats) drawerWhats.href = WHATS_BASE + msg;

  if (drawerTotal) drawerTotal.textContent = money(total);

  if (drawerList && drawerEmpty) {
    drawerList.innerHTML = "";
    drawerEmpty.style.display = cart.length ? "none" : "block";

    cart.forEach((item, idx) => {
      const li = document.createElement("li");
      li.className = "drawer-item";

      li.innerHTML = `
        <div>
          <strong>${item.name}</strong>
          <small>$${money(item.price)} c/u</small>
        </div>
        <div class="qty" aria-label="Cantidad">
          <button type="button" aria-label="Disminuir" data-dec="${idx}">−</button>
          <strong>${item.qty}</strong>
          <button type="button" aria-label="Aumentar" data-inc="${idx}">+</button>
        </div>
      `;
      drawerList.appendChild(li);
    });
  }
}

function addToCart(name, price) {
  const found = cart.find((i) => i.name === name);
  if (found) found.qty += 1;
  else cart.push({ name, price, qty: 1 });

  updateCartUI();
  showToast(`✅ Añadido: ${name}`);
}

$$("[data-add]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const name = btn.getAttribute("data-add") || "Producto";
    const price = Number(btn.getAttribute("data-price") || 0);
    addToCart(name, price);
  });
});

function openDrawer() {
  if (!drawer) return;
  drawer.classList.add("show");
  drawer.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}
function closeDrawer() {
  if (!drawer) return;
  drawer.classList.remove("show");
  drawer.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

$("#openCart")?.addEventListener("click", openDrawer);
$("#openCart2")?.addEventListener("click", openDrawer);
$("#openCartMobile")?.addEventListener("click", openDrawer);
$("#closeDrawer")?.addEventListener("click", closeDrawer);
$("#drawerBackdrop")?.addEventListener("click", closeDrawer);

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeDrawer();
});

drawerList?.addEventListener("click", (e) => {
  const t = e.target;
  if (!(t instanceof HTMLElement)) return;

  const inc = t.getAttribute("data-inc");
  const dec = t.getAttribute("data-dec");

  if (inc !== null) {
    const idx = Number(inc);
    if (cart[idx]) cart[idx].qty += 1;
    updateCartUI();
  }
  if (dec !== null) {
    const idx = Number(dec);
    if (!cart[idx]) return;
    cart[idx].qty -= 1;
    if (cart[idx].qty <= 0) cart.splice(idx, 1);
    updateCartUI();
  }
});

$("#clearCart")?.addEventListener("click", () => {
  cart.splice(0, cart.length);
  updateCartUI();
  showToast("🧹 Pedido vacío.");
});

updateCartUI();

// =====================
// Menu search + filter
// =====================
const menuSearch = $("#menuSearch");
const filterBtns = $$(".filter-btn");
const menuItems = $$("#menuGrid .card");
let activeFilter = "all";

function applyMenuFilter() {
  const q = (menuSearch?.value || "").trim().toLowerCase();

  menuItems.forEach((card) => {
    const cat = card.getAttribute("data-cat") || "";
    const name = (card.getAttribute("data-name") || "").toLowerCase();

    const okCat = activeFilter === "all" || cat === activeFilter;
    const okSearch = !q || name.includes(q);

    card.style.display = (okCat && okSearch) ? "" : "none";
  });
}

filterBtns.forEach((b) => {
  b.addEventListener("click", () => {
    filterBtns.forEach((x) => x.classList.remove("active"));
    b.classList.add("active");
    activeFilter = b.getAttribute("data-filter") || "all";
    applyMenuFilter();
  });
});

menuSearch?.addEventListener("input", applyMenuFilter);
applyMenuFilter();

// Card glow follows mouse (CSS vars)
menuItems.forEach((card) => {
  card.addEventListener("mousemove", (e) => {
    const r = card.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 100;
    const y = ((e.clientY - r.top) / r.height) * 100;
    card.style.setProperty("--mx", `${x}%`);
    card.style.setProperty("--my", `${y}%`);
  });
});

// 3D Tilt
const tilt = $("#tiltCard");
if (tilt && window.matchMedia("(pointer:fine)").matches) {
  const max = 10;
  tilt.addEventListener("mousemove", (e) => {
    const r = tilt.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;

    const rx = (py - 0.5) * -max;
    const ry = (px - 0.5) * max;

    tilt.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`;
  });
  tilt.addEventListener("mouseleave", () => {
    tilt.style.transform = "rotateX(0deg) rotateY(0deg)";
  });
}

// Magnetic buttons
const magneticEls = $$(".magnetic");
if (magneticEls.length && window.matchMedia("(pointer:fine)").matches) {
  magneticEls.forEach((el) => {
    let rect = null;
    function updateRect() { rect = el.getBoundingClientRect(); }
    updateRect();
    window.addEventListener("resize", updateRect);

    el.addEventListener("mousemove", (e) => {
      if (!rect) return;
      const x = e.clientX - (rect.left + rect.width / 2);
      const y = e.clientY - (rect.top + rect.height / 2);
      el.style.transform = `translate(${x * 0.12}px, ${y * 0.12}px)`;
      el.style.setProperty("--mx", `${((e.clientX - rect.left) / rect.width) * 100}%`);
    });

    el.addEventListener("mouseleave", () => {
      el.style.transform = "";
    });
  });
}

// Reviews slider
const track = $("#reviewTrack");
const prev = $("#prevReview");
const next = $("#nextReview");
let reviewIndex = 0;

function updateSlider() {
  if (!track) return;
  const cards = track.children;
  if (!cards.length) return;

  const cardW = cards[0].getBoundingClientRect().width;
  const gap = 12;
  const x = (cardW + gap) * reviewIndex;
  track.style.transform = `translateX(${-x}px)`;
}

prev?.addEventListener("click", () => {
  reviewIndex = Math.max(0, reviewIndex - 1);
  updateSlider();
});

next?.addEventListener("click", () => {
  if (!track) return;
  const total = track.children.length;
  reviewIndex = Math.min(total - 1, reviewIndex + 1);
  updateSlider();
});

setInterval(() => {
  if (!track) return;
  const total = track.children.length;
  reviewIndex = (reviewIndex + 1) % total;
  updateSlider();
}, 6500);

window.addEventListener("resize", updateSlider);
updateSlider();

// Contact form -> WhatsApp
const form = $("#contactForm");
const formMsg = $("#formMsg");

function setFormMsg(text, ok = true) {
  if (!formMsg) return;
  formMsg.textContent = text;
  formMsg.classList.remove("ok", "bad");
  formMsg.classList.add(ok ? "ok" : "bad");
  setTimeout(() => {
    formMsg.textContent = "";
    formMsg.classList.remove("ok", "bad");
  }, 4200);
}

form?.addEventListener("submit", (e) => {
  e.preventDefault();

  const name = ($("#name")?.value || "").trim();
  const email = ($("#email")?.value || "").trim();
  const message = ($("#message")?.value || "").trim();

  if (name.length < 2 || !email.includes("@") || message.length < 5) {
    setFormMsg("⚠️ Revisa: nombre, correo válido y mensaje (mínimo 5 caracteres).", false);
    return;
  }

  const msg =
    `Hola Poema Café, soy ${name}.\n` +
    `Mi correo: ${email}\n` +
    `Mensaje: ${message}\n😊`;

  window.open(WHATS_BASE + encodeURIComponent(msg), "_blank", "noopener,noreferrer");
  setFormMsg("✅ Listo: se abrirá WhatsApp para enviarnos tu mensaje.");
  form.reset();
});

// Map hint
$("#mapHint")?.addEventListener("click", () => {
  showToast("📍 Google Maps → Compartir → Insertar un mapa → Copiar HTML (iframe) y pegarlo en Ubicación.");
});

// Confetti
function confettiBurst() {
  const n = 26;
  for (let i = 0; i < n; i++) {
    const p = document.createElement("span");
    p.className = "confetti";
    p.style.left = `${Math.random() * 100}vw`;
    p.style.top = `-10px`;
    p.style.transform = `rotate(${Math.random() * 360}deg)`;
    p.style.opacity = `${0.7 + Math.random() * 0.3}`;

    const a = Math.random() < 0.5 ? "var(--p)" : "var(--p2)";
    const b = Math.random() < 0.5 ? "var(--p2)" : "var(--p)";
    p.style.background = `linear-gradient(135deg, ${a}, ${b})`;

    document.body.appendChild(p);

    const dx = (Math.random() - 0.5) * 220;
    const dur = 900 + Math.random() * 700;

    p.animate(
      [
        { transform: `translate(0, 0) rotate(0deg)`, opacity: 1 },
        { transform: `translate(${dx}px, ${window.innerHeight + 80}px) rotate(${360 + Math.random() * 360}deg)`, opacity: 0.0 }
      ],
      { duration: dur, easing: "cubic-bezier(.2,.8,.2,1)" }
    );

    setTimeout(() => p.remove(), dur + 30);
  }
  showToast("🎉 ¡Promo activada!");
}

$("#btnConfetti")?.addEventListener("click", confettiBurst);

const confettiCSS = document.createElement("style");
confettiCSS.textContent = `
  .confetti{
    position:fixed;
    width:10px;height:14px;
    border-radius:4px;
    z-index:90;
    pointer-events:none;
    filter: drop-shadow(0 10px 18px rgba(0,0,0,.22));
  }
`;
document.head.appendChild(confettiCSS);
