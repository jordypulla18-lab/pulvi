const yearElement = document.getElementById('year');
const navToggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelector('.nav-links');

if (yearElement) {
  yearElement.textContent = String(new Date().getFullYear());
}

navToggle?.addEventListener('click', () => {
  const opened = navLinks?.classList.toggle('open');
  navToggle.setAttribute('aria-expanded', String(Boolean(opened)));
});

navLinks?.addEventListener('click', (event) => {
  if (event.target instanceof Element && event.target.closest('a')) {
    navLinks.classList.remove('open');
    navToggle?.setAttribute('aria-expanded', 'false');
  }
});
