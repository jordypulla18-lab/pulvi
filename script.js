/* ===========================
   ELECCOM — script.js (FIX)
   - Respeta IDs/clases del HTML
   - Catálogo + carrito + admin + vendido hoy + formulario
   - LocalStorage (inventario, carrito, ventas del día, tema)
   - FIX: polyfills + selectors seguros + normalización sin \p{Diacritic}
=========================== */

/* ==========
   CONFIG EDITABLE (CAMBIA AQUÍ)
========== */
const CONFIG = {
  businessName: "ELECCOM",
  slogan: "Rebobinado, mantenimiento, repuestos y materiales. Inventario editable con imágenes y reporte de ventas diarias.",
  address: "Centro • (cambia aquí)",
  hours: "Lun–Sáb 08:00–18:00",
  whatsapp: "593000000000", // SOLO números (Ecuador: 593 + número)
  pinAdmin: "1234",

  currency: "USD",
  currencySymbol: "$",

  lowStockThreshold: 5,     // <= esto muestra “Stock bajo”
  skeletonCount: 8,         // tarjetas skeleton al cargar
  skeletonDelayMs: 450,     // loading ligero
  toastMs: 2400,

  allowOutOfStockToCart: false, // recomendado: false
};

/* ==========
   POLYFILLS / SAFETY
========== */
(function polyfills(){
  // structuredClone fallback
  if (typeof window.structuredClone !== "function") {
    window.structuredClone = (obj) => JSON.parse(JSON.stringify(obj));
  }
  // CSS.escape fallback
  if (!window.CSS) window.CSS = {};
  if (typeof window.CSS.escape !== "function") {
    window.CSS.escape = (s) => String(s).replace(/[^\w-]/g, (ch) => "\\" + ch);
  }
})();

const $ = (id) => document.getElementById(id);
const sel = (idOrNull) => idOrNull ? `#${CSS.escape(idOrNull)}` : "";
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

const money = (value) => {
  const n = Number(value || 0);
  try {
    return new Intl.NumberFormat("es-EC", { style: "currency", currency: CONFIG.currency }).format(n);
  } catch {
    return `${CONFIG.currencySymbol}${n.toFixed(2)}`;
  }
};

const todayKey = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const nowLabel = () => new Date().toLocaleString("es-EC", {
  weekday: "long", year: "numeric", month: "long", day: "numeric"
});

const uid = () => Math.random().toString(16).slice(2) + Date.now().toString(16);

/* ==========
   STORAGE
========== */
const STORAGE = {
  inv: "eleccom_inventory_v1",
  cart: "eleccom_cart_v1",
  sales: "eleccom_sales_v1",
  theme: "eleccom_theme_v1",
  adminUnlocked: "eleccom_admin_unlocked_v1"
};

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}
function writeJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

/* ==========
   DEMO INVENTORY
========== */
const DEMO_INVENTORY = [
  { id:"p_alambre_esmaltado", name:"Alambre esmaltado (rollo)", category:"Rebobinado", price:12.5, stock:18, unit:"u",
    img:"https://images.unsplash.com/photo-1581091870627-3f6a3f6f8b39?auto=format&fit=crop&w=900&q=60",
    desc:"Calibres varios. Ideal para rebobinado." },
  { id:"p_barniz_dielectrico", name:"Barniz dieléctrico", category:"Rebobinado", price:9.25, stock:6, unit:"u",
    img:"https://images.unsplash.com/photo-1582719478185-2a67c63d74b8?auto=format&fit=crop&w=900&q=60",
    desc:"Protección y aislamiento para bobinados." },
  { id:"p_cinta_aislante", name:"Cinta aislante 3/4", category:"Eléctrico", price:1.2, stock:32, unit:"u",
    img:"https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=900&q=60",
    desc:"PVC alta adherencia." },
  { id:"p_foco_h4", name:"Foco H4 12V", category:"Iluminación", price:6.8, stock:4, unit:"u",
    img:"https://images.unsplash.com/photo-1604147706283-28c4b30a64b5?auto=format&fit=crop&w=900&q=60",
    desc:"Luz blanca, compatible automotriz." },
  { id:"p_bateria_12v7a", name:"Batería 12V 7Ah", category:"Baterías", price:24.9, stock:0, unit:"u",
    img:"https://images.unsplash.com/photo-1612472297162-ecf3ad8fe0e6?auto=format&fit=crop&w=900&q=60",
    desc:"UPS / alarmas / respaldo." },
  { id:"p_relay_12v", name:"Relé 12V 4 pines", category:"Automotriz", price:2.4, stock:11, unit:"u",
    img:"https://images.unsplash.com/photo-1567789884554-0b844b597180?auto=format&fit=crop&w=900&q=60",
    desc:"Relé estándar para auto." },
  { id:"p_carbon_motores", name:"Carbones para motor (par)", category:"Repuestos", price:4.5, stock:7, unit:"par",
    img:"https://images.unsplash.com/photo-1518779578993-ec3579fee39f?auto=format&fit=crop&w=900&q=60",
    desc:"Para equipos con escobillas." },
  { id:"p_pinza_amperimetrica", name:"Pinza amperimétrica", category:"Herramientas", price:39.0, stock:3, unit:"u",
    img:"https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?auto=format&fit=crop&w=900&q=60",
    desc:"Medición rápida y segura." },
];

/* ==========
   STATE
========== */
let inventory = readJSON(STORAGE.inv, null);
if (!Array.isArray(inventory) || inventory.length === 0) {
  inventory = structuredClone(DEMO_INVENTORY);
  writeJSON(STORAGE.inv, inventory);
}

let cart = readJSON(STORAGE.cart, {});
if (typeof cart !== "object" || cart === null) cart = {};

let salesByDate = readJSON(STORAGE.sales, {});
if (typeof salesByDate !== "object" || salesByDate === null) salesByDate = {};

let adminUnlocked = !!readJSON(STORAGE.adminUnlocked, false);

/* ==========
   ELEMENTS (IDs exactos del HTML)
========== */
const els = {
  // Biz
  bizName: $("bizName"), bizName2: $("bizName2"),
  bizSlogan: $("bizSlogan"),
  bizHours: $("bizHours"), bizHours2: $("bizHours2"),
  bizAddress: $("bizAddress"), bizAddress2: $("bizAddress2"),
  bizWhatsapp: $("bizWhatsapp"), bizWhatsapp2: $("bizWhatsapp2"),
  todayLabel: $("todayLabel"),
  year: $("year"),

  // Nav
  themeBtn: $("themeBtn"),
  navToggle: $("navToggle"),
  navLinks: $("navLinks"),
  adminOpenTop: $("adminOpenTop"),

  // CTA WhatsApp
  ctaNav: $("ctaNav"),
  ctaHero: $("ctaHero"),
  ctaTech: $("ctaTech"),
  ctaContact: $("ctaContact"),
  waFloat: $("waFloat"),

  // Catalog
  searchInput: $("searchInput"),
  catFilter: $("catFilter"),
  stockFilter: $("stockFilter"),
  productGrid: $("productGrid"),
  adminBtn: $("adminBtn"),
  openCartFromCatalog: $("openCartFromCatalog"),

  // Form
  contactForm: $("contactForm"),
  formMsg: $("formMsg"),
  name: $("name"),
  device: $("device"),
  issue: $("issue"),
  service: $("service"),
  urgency: $("urgency"),

  // Cart
  cartBtn: $("cartBtn"),
  cartCount: $("cartCount"),
  openCartHero: $("openCartHero"),
  cartOpen: $("cartOpen"),
  openCartContact: $("openCartContact"),
  cartModal: $("cartModal"),
  cartGrid: $("cartGrid"),
  clearCart: $("clearCart"),
  sendCart: $("sendCart"),
  registerSale: $("registerSale"),
  sumItems: $("sumItems"),
  sumTotal: $("sumTotal"),

  // Sales
  salesModal: $("salesModal"),
  salesOpen: $("salesOpen"),
  salesOpen2: $("salesOpen2"),
  salesGrid: $("salesGrid"),
  exportSalesCSV: $("exportSalesCSV"),
  exportSalesJSON: $("exportSalesJSON"),
  closeDay: $("closeDay"),
  dayTotal: $("dayTotal"),
  dayCount: $("dayCount"),

  // Admin
  adminModal: $("adminModal"),
  adminOpen: $("adminOpen"),
  adminLogin: $("adminLogin"),
  adminPin: $("adminPin"),
  unlockAdmin: $("unlockAdmin"),
  adminActions: $("adminActions"),
  addProduct: $("addProduct"),
  exportInv: $("exportInv"),
  importInv: $("importInv"),
  resetInv: $("resetInv"),
  lockAdmin: $("lockAdmin"),
  adminGrid: $("adminGrid"),

  // Toast
  toast: $("toast"),
};

/* ==========
   THEME
========== */
function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  const isDark = theme === "dark";
  if (els.themeBtn) {
    els.themeBtn.textContent = isDark ? "☀️" : "🌙";
    els.themeBtn.setAttribute("aria-pressed", String(isDark));
  }
  writeJSON(STORAGE.theme, theme);
}
function initTheme() {
  const saved = readJSON(STORAGE.theme, null);
  if (saved === "light" || saved === "dark") return applyTheme(saved);
  const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)")?.matches;
  applyTheme(prefersDark ? "dark" : "light");
}

/* ==========
   TOAST
========== */
let toastTimer = null;
function toast(msg) {
  if (!els.toast) return;
  els.toast.textContent = msg;
  els.toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => els.toast.classList.remove("show"), CONFIG.toastMs);
}

/* ==========
   MODAL
========== */
function openModal(modalEl) {
  if (!modalEl) return;
  modalEl.classList.add("open");
  modalEl.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}
function closeModal(modalEl) {
  if (!modalEl) return;
  modalEl.classList.remove("open");
  modalEl.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}
function bindModalClose(modalEl) {
  if (!modalEl) return;
  modalEl.addEventListener("click", (e) => {
    const t = e.target;
    if (t?.dataset?.close === "true") closeModal(modalEl);
    if (t?.classList?.contains("backdrop")) closeModal(modalEl);
  });
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modalEl.classList.contains("open")) closeModal(modalEl);
  });
}

/* ==========
   WHATSAPP
========== */
function waLinkFromText(text) {
  return `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(text)}`;
}
function setAllWhatsAppCTAs() {
  const base = `Hola 👋 Soy *${CONFIG.businessName}*.`;
  const link = waLinkFromText(base);
  [els.ctaNav, els.ctaHero, els.ctaTech, els.ctaContact, els.waFloat].forEach(a => { if (a) a.href = link; });
  if (els.bizWhatsapp) els.bizWhatsapp.textContent = `+${CONFIG.whatsapp}`;
  if (els.bizWhatsapp2) els.bizWhatsapp2.textContent = `+${CONFIG.whatsapp}`;
}

/* ==========
   BIZ INFO
========== */
function setBizInfo() {
  if (els.bizName) els.bizName.textContent = CONFIG.businessName;
  if (els.bizName2) els.bizName2.textContent = CONFIG.businessName;
  if (els.bizSlogan) els.bizSlogan.textContent = CONFIG.slogan;
  if (els.bizAddress) els.bizAddress.textContent = CONFIG.address;
  if (els.bizAddress2) els.bizAddress2.textContent = CONFIG.address;
  if (els.bizHours) els.bizHours.textContent = CONFIG.hours;
  if (els.bizHours2) els.bizHours2.textContent = CONFIG.hours;
  if (els.todayLabel) els.todayLabel.textContent = nowLabel();
  if (els.year) els.year.textContent = String(new Date().getFullYear());
}

/* ==========
   INVENTORY HELPERS
========== */
function saveInventory() { writeJSON(STORAGE.inv, inventory); }
function getProductById(id) { return inventory.find(p => p.id === id); }

// Normalización sin unicode-property (evita errores raros)
function normalizeStr(s) {
  return String(s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, ""); // quita acentos
}

function productStockPill(stock) {
  if (stock <= 0) return { cls: "bad", text: "Sin stock" };
  if (stock <= CONFIG.lowStockThreshold) return { cls: "warn", text: "Stock bajo" };
  return { cls: "ok", text: "En stock" };
}

/* ==========
   SKELETON
========== */
function renderSkeleton() {
  if (!els.productGrid) return;
  els.productGrid.innerHTML = "";
  for (let i = 0; i < CONFIG.skeletonCount; i++) {
    const d = document.createElement("div");
    d.className = "skeleton";
    els.productGrid.appendChild(d);
  }
}

/* ==========
   FILTERS + RENDER CATALOG
========== */
function filterProducts() {
  const q = normalizeStr(els.searchInput?.value || "");
  const cat = els.catFilter?.value || "all";
  const st = els.stockFilter?.value || "all";

  return inventory.filter(p => {
    const hay = normalizeStr(`${p.name} ${p.category} ${p.desc || ""}`);
    const matchesQ = q ? hay.includes(q) : true;
    const matchesCat = (cat === "all") ? true : (p.category === cat);

    let matchesStock = true;
    if (st === "in") matchesStock = p.stock > 0;
    if (st === "out") matchesStock = p.stock <= 0;
    if (st === "low") matchesStock = (p.stock > 0 && p.stock <= CONFIG.lowStockThreshold);

    return matchesQ && matchesCat && matchesStock;
  });
}

function renderCatalog() {
  if (!els.productGrid) return;
  const list = filterProducts();
  els.productGrid.innerHTML = "";

  if (list.length === 0) {
    const empty = document.createElement("div");
    empty.className = "note";
    empty.innerHTML = `<strong>No hay resultados.</strong> <span class="muted">Cambia filtros o búsqueda.</span>`;
    els.productGrid.appendChild(empty);
    return;
  }

  list.forEach(p => {
    const pill = productStockPill(p.stock);
    const disabled = (!CONFIG.allowOutOfStockToCart && p.stock <= 0);

    const card = document.createElement("article");
    card.className = "card product";
    card.innerHTML = `
      <div class="thumb">
        ${p.img ? `<img loading="lazy" alt="${escapeHtml(p.name)}" src="${escapeAttr(p.img)}">` : ""}
      </div>
      <div class="pbody">
        <div class="ptitle">${escapeHtml(p.name)}</div>
        <div class="meta">
          <span class="pill">${escapeHtml(p.category || "Otros")}</span>
          <span class="pill ${pill.cls}">${pill.text}</span>
          <span class="pill">${escapeHtml(String(p.stock))} ${escapeHtml(p.unit || "u")}</span>
        </div>
        ${p.desc ? `<div class="muted small">${escapeHtml(p.desc)}</div>` : ""}
        <div class="meta" style="justify-content: space-between; margin-top: 2px;">
          <div class="price">${money(p.price)}</div>
          <div class="muted small">ID: <code>${escapeHtml(p.id)}</code></div>
        </div>
        <div class="actions">
          <button class="btn small qtybtn" type="button" data-add="${escapeAttr(p.id)}" ${disabled ? "disabled" : ""}>
            ${disabled ? "Sin stock" : "Agregar"}
          </button>
          <button class="btn ghost small" type="button" data-wa="${escapeAttr(p.id)}">WhatsApp</button>
        </div>
      </div>
    `;

    card.querySelector(`[data-add="${CSS.escape(p.id)}"]`)?.addEventListener("click", () => addToCart(p.id, 1));
    card.querySelector(`[data-wa="${CSS.escape(p.id)}"]`)?.addEventListener("click", () => {
      window.open(waLinkFromText(productWhatsAppMessage(p)), "_blank", "noreferrer");
    });

    els.productGrid.appendChild(card);
  });
}

/* ==========
   CART
========== */
function saveCart() { writeJSON(STORAGE.cart, cart); }

function cartCountItems() {
  return Object.values(cart).reduce((a, b) => a + Number(b || 0), 0);
}
function cartTotal() {
  let total = 0;
  for (const [pid, qty] of Object.entries(cart)) {
    const p = getProductById(pid);
    if (!p) continue;
    total += Number(p.price || 0) * Number(qty || 0);
  }
  return total;
}
function updateCartBadge() {
  if (els.cartCount) els.cartCount.textContent = String(cartCountItems());
}

function addToCart(productId, qty = 1) {
  const p = getProductById(productId);
  if (!p) return;

  if (!CONFIG.allowOutOfStockToCart) {
    if (p.stock <= 0) return toast("Este producto está sin stock.");
    const already = Number(cart[productId] || 0);
    if (already + qty > p.stock) {
      cart[productId] = p.stock;
      saveCart(); updateCartBadge(); renderCart();
      return toast("No hay suficiente stock. Se ajustó al máximo.");
    }
  }

  cart[productId] = Number(cart[productId] || 0) + qty;
  saveCart(); updateCartBadge(); renderCart();
  toast("Agregado al carrito ✅");
}

function setCartQty(productId, qty) {
  const p = getProductById(productId);
  if (!p) return;

  let q = clamp(Number(qty || 0), 0, 999999);
  if (!CONFIG.allowOutOfStockToCart) q = clamp(q, 0, p.stock);

  if (q <= 0) delete cart[productId];
  else cart[productId] = q;

  saveCart(); updateCartBadge(); renderCart();
}

function clearCart() {
  cart = {};
  saveCart(); updateCartBadge(); renderCart();
  toast("Carrito vaciado.");
}

function renderCart() {
  if (!els.cartGrid) return;
  els.cartGrid.innerHTML = "";

  const entries = Object.entries(cart);

  if (entries.length === 0) {
    const empty = document.createElement("div");
    empty.className = "note";
    empty.innerHTML = `<strong>Tu carrito está vacío.</strong> <span class="muted">Agrega productos desde el catálogo.</span>`;
    els.cartGrid.appendChild(empty);
  } else {
    entries.forEach(([pid, qty]) => {
      const p = getProductById(pid);
      if (!p) return;
      const lineTotal = Number(p.price || 0) * Number(qty || 0);

      const item = document.createElement("div");
      item.className = "cartItem";
      item.innerHTML = `
        <div class="cimg">${p.img ? `<img alt="${escapeHtml(p.name)}" src="${escapeAttr(p.img)}">` : ""}</div>
        <div>
          <div class="ctitle">${escapeHtml(p.name)}</div>
          <div class="cmeta">${escapeHtml(p.category)} • ${money(p.price)} • <strong>${money(lineTotal)}</strong></div>
          <div class="cmeta">Stock actual: <strong>${escapeHtml(String(p.stock))}</strong> ${escapeHtml(p.unit || "u")}</div>
        </div>
        <div class="controls">
          <div class="qctl">
            <button type="button" data-dec="${escapeAttr(pid)}" aria-label="Disminuir">−</button>
            <strong>${escapeHtml(String(qty))}</strong>
            <button type="button" data-inc="${escapeAttr(pid)}" aria-label="Aumentar">+</button>
          </div>
          <button class="btn ghost small" type="button" data-del="${escapeAttr(pid)}">Eliminar</button>
        </div>
      `;

      item.querySelector(`[data-dec="${CSS.escape(pid)}"]`)?.addEventListener("click", () => setCartQty(pid, Number(qty) - 1));
      item.querySelector(`[data-inc="${CSS.escape(pid)}"]`)?.addEventListener("click", () => setCartQty(pid, Number(qty) + 1));
      item.querySelector(`[data-del="${CSS.escape(pid)}"]`)?.addEventListener("click", () => {
        delete cart[pid];
        saveCart(); updateCartBadge(); renderCart();
        toast("Producto eliminado.");
      });

      els.cartGrid.appendChild(item);
    });
  }

  if (els.sumItems) els.sumItems.textContent = String(cartCountItems());
  if (els.sumTotal) els.sumTotal.textContent = money(cartTotal());
}

/* ==========
   REGISTER SALE
========== */
function getSalesToday() {
  const list = salesByDate[todayKey()];
  return Array.isArray(list) ? list : [];
}
function saveSalesToday(list) {
  salesByDate[todayKey()] = list;
  writeJSON(STORAGE.sales, salesByDate);
}

function registerSale() {
  const entries = Object.entries(cart);
  if (entries.length === 0) return toast("Tu carrito está vacío.");

  // Validar stock
  for (const [pid, qty] of entries) {
    const p = getProductById(pid);
    if (!p) continue;
    if (!CONFIG.allowOutOfStockToCart && p.stock < qty) {
      return toast(`Stock insuficiente: ${p.name}`);
    }
  }

  // Descontar + armar venta
  const soldItems = [];
  let total = 0;

  for (const [pid, qty] of entries) {
    const p = getProductById(pid);
    if (!p) continue;

    p.stock = Math.max(0, Number(p.stock || 0) - Number(qty || 0));
    const line = Number(p.price || 0) * Number(qty || 0);
    total += line;

    soldItems.push({
      id: p.id, name: p.name, category: p.category,
      price: Number(p.price || 0),
      qty: Number(qty || 0),
      lineTotal: Number(line.toFixed(2)),
    });
  }

  saveInventory();

  const sale = {
    saleId: `S-${uid()}`,
    at: new Date().toISOString(),
    total: Number(total.toFixed(2)),
    items: soldItems,
  };

  const todaySales = getSalesToday();
  todaySales.unshift(sale);
  saveSalesToday(todaySales);

  // Vaciar carrito
  cart = {};
  saveCart(); updateCartBadge(); renderCart();
  renderCatalog();
  renderSalesToday();

  toast("Venta registrada ✅ (stock actualizado)");
}

/* ==========
   SALES TODAY + EXPORT
========== */
function renderSalesToday() {
  if (!els.salesGrid) return;

  const list = getSalesToday();
  els.salesGrid.innerHTML = "";

  if (list.length === 0) {
    const empty = document.createElement("div");
    empty.className = "note";
    empty.innerHTML = `<strong>Aún no hay ventas hoy.</strong> <span class="muted">Registra ventas desde el carrito.</span>`;
    els.salesGrid.appendChild(empty);
  } else {
    list.forEach((sale) => {
      const div = document.createElement("div");
      div.className = "saleCard";

      const time = new Date(sale.at).toLocaleTimeString("es-EC", { hour: "2-digit", minute: "2-digit" });
      const itemsText = (sale.items || []).map(it => `${it.qty}× ${it.name} (${money(it.lineTotal)})`).join(" • ");

      div.innerHTML = `
        <div class="top">
          <strong>${escapeHtml(time)} • ${escapeHtml(sale.saleId || "Venta")}</strong>
          <strong>${money(sale.total)}</strong>
        </div>
        <div class="items">${escapeHtml(itemsText)}</div>
      `;
      els.salesGrid.appendChild(div);
    });
  }

  const total = list.reduce((a, s) => a + Number(s.total || 0), 0);
  if (els.dayTotal) els.dayTotal.textContent = money(total);
  if (els.dayCount) els.dayCount.textContent = String(list.length);
}

function downloadFile(filename, content, mime) {
  const blob = new Blob([content], { type: mime });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 500);
}

function csvEscape(v) {
  const s = String(v ?? "");
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function exportSalesJSON() {
  const list = getSalesToday();
  const payload = {
    date: todayKey(),
    business: CONFIG.businessName,
    total: list.reduce((a, s) => a + Number(s.total || 0), 0),
    sales: list
  };
  downloadFile(`vendido_hoy_${todayKey()}.json`, JSON.stringify(payload, null, 2), "application/json");
  toast("Exportado JSON ✅");
}

function exportSalesCSV() {
  const list = getSalesToday();
  const rows = [["date","saleId","time","itemId","itemName","category","qty","price","lineTotal","saleTotal"]];

  list.forEach((sale) => {
    const d = todayKey();
    const t = new Date(sale.at).toLocaleTimeString("es-EC", { hour: "2-digit", minute: "2-digit" });
    (sale.items || []).forEach((it) => {
      rows.push([d, sale.saleId||"", t, it.id||"", it.name||"", it.category||"", it.qty||0, it.price||0, it.lineTotal||0, sale.total||0]);
    });
  });

  const csv = rows.map(r => r.map(csvEscape).join(",")).join("\n");
  downloadFile(`vendido_hoy_${todayKey()}.csv`, csv, "text/csv;charset=utf-8");
  toast("Exportado CSV ✅");
}

function closeDay() {
  saveSalesToday([]);
  renderSalesToday();
  toast("Jornada cerrada. “Vendido hoy” reiniciado.");
}

/* ==========
   ADMIN
========== */
function syncAdminUI() {
  if (!els.adminLogin || !els.adminActions || !els.adminGrid) return;
  if (adminUnlocked) {
    els.adminLogin.hidden = true;
    els.adminActions.hidden = false;
    els.adminGrid.hidden = false;
  } else {
    els.adminLogin.hidden = false;
    els.adminActions.hidden = true;
    els.adminGrid.hidden = true;
  }
}

function lockAdmin() {
  adminUnlocked = false;
  writeJSON(STORAGE.adminUnlocked, false);
  syncAdminUI();
  toast("Admin bloqueado.");
}

function unlockAdmin() {
  const pin = String(els.adminPin?.value || "").trim();
  if (pin !== CONFIG.pinAdmin) return toast("PIN incorrecto.");
  adminUnlocked = true;
  writeJSON(STORAGE.adminUnlocked, true);
  syncAdminUI();
  renderAdmin();
  toast("Admin desbloqueado ✅");
}

function categoryOptionsHTML(selected) {
  const cats = ["Rebobinado","Eléctrico","Automotriz","Iluminación","Baterías","Herramientas","Repuestos","Otros"];
  return cats.map(c => `<option ${c === selected ? "selected" : ""}>${escapeHtml(c)}</option>`).join("");
}

function adminUpdateField(pid, field, value) {
  const p = getProductById(pid);
  if (!p) return;

  if (field === "price" || field === "stock") {
    p[field] = Number(value || 0);
    if (!Number.isFinite(p[field])) p[field] = 0;
    if (field === "stock") p.stock = Math.max(0, p.stock);
  } else {
    p[field] = String(value ?? "");
  }

  saveInventory();
  renderCatalog();
}

function exportInventoryJSON() {
  const payload = { exportedAt: new Date().toISOString(), business: CONFIG.businessName, inventory };
  downloadFile(`inventario_${todayKey()}.json`, JSON.stringify(payload, null, 2), "application/json");
  toast("Inventario exportado ✅");
}

function importInventoryJSON(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      const inv = Array.isArray(data) ? data : data.inventory;
      if (!Array.isArray(inv)) throw new Error("Formato inválido");

      inventory = inv.map(p => ({
        id: String(p.id || uid()),
        name: String(p.name || "Producto"),
        category: String(p.category || "Otros"),
        price: Number(p.price || 0),
        stock: Math.max(0, Number(p.stock || 0)),
        unit: String(p.unit || "u"),
        img: String(p.img || ""),
        desc: String(p.desc || "")
      }));

      saveInventory();
      renderCatalog();
      renderAdmin();
      toast("Inventario importado ✅");
    } catch {
      toast("No se pudo importar el JSON (formato inválido).");
    }
  };
  reader.readAsText(file);
}

function resetInventoryDemo() {
  inventory = structuredClone(DEMO_INVENTORY);
  saveInventory();
  renderCatalog();
  renderAdmin();
  toast("Inventario demo restaurado.");
}

function addProductAdmin() {
  const newP = { id:`p_${uid()}`, name:"Nuevo producto", category:"Otros", price:0, stock:0, unit:"u", img:"", desc:"" };
  inventory.unshift(newP);
  saveInventory();
  renderCatalog();
  renderAdmin();
  toast("Producto agregado (edítalo abajo).");
}

function adminDeleteProduct(pid) {
  if (!confirm("¿Eliminar este producto del inventario?")) return;

  inventory = inventory.filter(p => p.id !== pid);

  if (cart[pid]) { delete cart[pid]; saveCart(); updateCartBadge(); renderCart(); }

  saveInventory();
  renderCatalog();
  renderAdmin();
  toast("Producto eliminado.");
}

function adminImageFromFile(pid, file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const p = getProductById(pid);
    if (!p) return;
    p.img = String(reader.result || "");
    saveInventory();
    renderCatalog();
    renderAdmin();
    toast("Imagen guardada ✅");
  };
  reader.readAsDataURL(file);
}

function renderAdmin() {
  if (!els.adminGrid) return;
  if (!adminUnlocked) return (els.adminGrid.hidden = true);

  els.adminGrid.hidden = false;
  els.adminGrid.innerHTML = "";

  inventory.forEach((p) => {
    const row = document.createElement("div");
    row.className = "adminRow";

    row.innerHTML = `
      <div class="top">
        <div class="thumb">${p.img ? `<img alt="${escapeHtml(p.name)}" src="${escapeAttr(p.img)}">` : ""}</div>
        <div>
          <strong>${escapeHtml(p.name)}</strong><br>
          <span class="muted small">ID: <code>${escapeHtml(p.id)}</code></span>
        </div>
      </div>

      <div class="fields">
        <input data-f="name" data-id="${escapeAttr(p.id)}" value="${escapeAttr(p.name)}" placeholder="Nombre">
        <select data-f="category" data-id="${escapeAttr(p.id)}">${categoryOptionsHTML(p.category)}</select>
        <input data-f="price" data-id="${escapeAttr(p.id)}" value="${escapeAttr(String(p.price))}" inputmode="decimal" placeholder="Precio">
        <input data-f="stock" data-id="${escapeAttr(p.id)}" value="${escapeAttr(String(p.stock))}" inputmode="numeric" placeholder="Stock">
        <input data-f="unit" data-id="${escapeAttr(p.id)}" value="${escapeAttr(p.unit || "u")}" placeholder="Unidad (u, par)">
        <input data-f="img" data-id="${escapeAttr(p.id)}" value="${escapeAttr(p.img || "")}" placeholder="URL imagen (opcional)">
        <input data-f="desc" data-id="${escapeAttr(p.id)}" value="${escapeAttr(p.desc || "")}" placeholder="Descripción (opcional)">
      </div>

      <div class="actions">
        <label class="btn ghost small">
          Subir imagen
          <input type="file" accept="image/*" data-imgfile="${escapeAttr(p.id)}" hidden>
        </label>
        <button class="btn ghost small" type="button" data-delprod="${escapeAttr(p.id)}">Eliminar</button>
      </div>
    `;

    row.querySelectorAll("input[data-f], select[data-f]").forEach((input) => {
      const handler = (e) => {
        const t = e.target;
        adminUpdateField(t.dataset.id, t.dataset.f, t.value);
      };
      input.addEventListener("input", handler);
      input.addEventListener("change", handler);
    });

    row.querySelector(`input[data-imgfile="${CSS.escape(p.id)}"]`)?.addEventListener("change", (e) => {
      const file = e.target.files?.[0];
      adminImageFromFile(p.id, file);
      e.target.value = "";
    });

    row.querySelector(`[data-delprod="${CSS.escape(p.id)}"]`)?.addEventListener("click", () => adminDeleteProduct(p.id));

    els.adminGrid.appendChild(row);
  });
}

/* ==========
   FORM -> WhatsApp
========== */
function formWhatsAppMessage() {
  const name = String(els.name?.value || "").trim();
  const device = String(els.device?.value || "").trim();
  const issue = String(els.issue?.value || "").trim();
  const service = String(els.service?.value || "").trim();
  const urgency = String(els.urgency?.value || "").trim();

  return [
    `Hola 👋 soy *${name || "un cliente"}*.`,
    `Quiero: *${service}*`,
    `Urgencia: *${urgency}*`,
    `Producto/Equipo: *${device}*`,
    `Detalle: ${issue}`,
    ``,
    `📍 ${CONFIG.address}`,
    `🕒 ${CONFIG.hours}`,
  ].join("\n");
}

function handleFormSubmit(e) {
  e.preventDefault();
  const name = String(els.name?.value || "").trim();
  const device = String(els.device?.value || "").trim();
  const issue = String(els.issue?.value || "").trim();

  if (name.length < 2 || device.length < 2 || issue.length < 5) {
    if (els.formMsg) els.formMsg.textContent = "Completa los campos correctamente.";
    return toast("Completa el formulario.");
  }

  window.open(waLinkFromText(formWhatsAppMessage()), "_blank", "noreferrer");
  if (els.formMsg) els.formMsg.textContent = "Abriendo WhatsApp… ✅";
  toast("WhatsApp listo ✅");
}

function productWhatsAppMessage(p) {
  return [
    `Hola 👋, me interesa este producto en *${CONFIG.businessName}*:`,
    ``,
    `• ${p.name}`,
    `• Categoría: ${p.category}`,
    `• Precio ref.: ${money(p.price)}`,
    `• ¿Hay disponibilidad?`,
    ``,
    `Gracias 🙌`
  ].join("\n");
}

function cartWhatsAppMessage() {
  const entries = Object.entries(cart);
  if (entries.length === 0) return `Hola 👋, quisiera una cotización en *${CONFIG.businessName}*.`;

  const lines = [`Hola 👋, quisiera una *cotización* en *${CONFIG.businessName}* por:`, ``];

  entries.forEach(([pid, qty]) => {
    const p = getProductById(pid);
    if (!p) return;
    const lt = Number(p.price || 0) * Number(qty || 0);
    lines.push(`• ${qty}× ${p.name} — ${money(lt)}`);
  });

  lines.push(``, `Total estimado: *${money(cartTotal())}*`, ``, `📍 ${CONFIG.address}`, `🕒 ${CONFIG.hours}`);
  return lines.join("\n");
}

function sendCartToWhatsApp() {
  window.open(waLinkFromText(cartWhatsAppMessage()), "_blank", "noreferrer");
  toast("Enviando cotización…");
}

/* ==========
   NAV (mobile)
========== */
function toggleNav() {
  if (!els.navLinks || !els.navToggle) return;
  const open = els.navLinks.classList.toggle("open");
  els.navToggle.setAttribute("aria-expanded", String(open));
}

/* ==========
   SAFE ESCAPES
========== */
function escapeHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
function escapeAttr(str) { return escapeHtml(str).replace(/\n/g, " "); }

/* ==========
   EVENTS (IMPORTANTE: aquí se conectan Admin y Carrito)
========== */
function bindEvents() {
  // Theme
  els.themeBtn?.addEventListener("click", () => {
    const current = document.documentElement.getAttribute("data-theme") || "light";
    applyTheme(current === "light" ? "dark" : "light");
    toast(`Tema: ${document.documentElement.getAttribute("data-theme")}`);
  });

  // Nav toggle
  els.navToggle?.addEventListener("click", toggleNav);

  // Catalog filters
  els.searchInput?.addEventListener("input", renderCatalog);
  els.catFilter?.addEventListener("change", renderCatalog);
  els.stockFilter?.addEventListener("change", renderCatalog);

  // CART open buttons
  const openCart = () => { openModal(els.cartModal); renderCart(); };
  els.cartBtn?.addEventListener("click", openCart);
  els.openCartHero?.addEventListener("click", openCart);
  els.cartOpen?.addEventListener("click", openCart);
  els.openCartContact?.addEventListener("click", openCart);
  els.openCartFromCatalog?.addEventListener("click", openCart);

  // SALES open buttons
  const openSales = () => { openModal(els.salesModal); renderSalesToday(); };
  els.salesOpen?.addEventListener("click", openSales);
  els.salesOpen2?.addEventListener("click", openSales);

  // ADMIN open buttons
  const openAdmin = () => { openModal(els.adminModal); syncAdminUI(); if (adminUnlocked) renderAdmin(); };
  els.adminBtn?.addEventListener("click", openAdmin);
  els.adminOpen?.addEventListener("click", openAdmin);
  els.adminOpenTop?.addEventListener("click", openAdmin);

  // Cart actions
  els.clearCart?.addEventListener("click", clearCart);
  els.sendCart?.addEventListener("click", sendCartToWhatsApp);
  els.registerSale?.addEventListener("click", registerSale);

  // Sales actions
  els.exportSalesCSV?.addEventListener("click", exportSalesCSV);
  els.exportSalesJSON?.addEventListener("click", exportSalesJSON);
  els.closeDay?.addEventListener("click", closeDay);

  // Admin actions
  els.unlockAdmin?.addEventListener("click", unlockAdmin);
  els.adminPin?.addEventListener("keydown", (e) => { if (e.key === "Enter") unlockAdmin(); });

  els.addProduct?.addEventListener("click", () => adminUnlocked ? addProductAdmin() : toast("Desbloquea Admin primero."));
  els.exportInv?.addEventListener("click", () => adminUnlocked ? exportInventoryJSON() : toast("Desbloquea Admin primero."));

  els.importInv?.addEventListener("change", (e) => {
    if (!adminUnlocked) { toast("Desbloquea Admin primero."); e.target.value = ""; return; }
    importInventoryJSON(e.target.files?.[0]);
    e.target.value = "";
  });

  els.resetInv?.addEventListener("click", () => adminUnlocked ? resetInventoryDemo() : toast("Desbloquea Admin primero."));
  els.lockAdmin?.addEventListener("click", lockAdmin);

  // Form submit
  els.contactForm?.addEventListener("submit", handleFormSubmit);

  // Modal close binding
  bindModalClose(els.cartModal);
  bindModalClose(els.salesModal);
  bindModalClose(els.adminModal);
}

/* ==========
   INIT
========== */
function init() {
  try {
    initTheme();
    setBizInfo();
    setAllWhatsAppCTAs();
    syncAdminUI();
    updateCartBadge();

    renderSkeleton();
    setTimeout(() => {
      renderCatalog();
      renderCart();
      renderSalesToday();
    }, CONFIG.skeletonDelayMs);

    bindEvents();
  } catch (err) {
    console.error(err);
    toast("Error en script.js (mira la consola).");
  }
}

document.addEventListener("DOMContentLoaded", init);
