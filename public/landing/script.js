// Menu mobile toggle
const navToggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelector('.nav-links');
if (navToggle && navLinks) {
  navToggle.addEventListener('click', () => {
    const open = navToggle.getAttribute('aria-expanded') === 'true';
    navToggle.setAttribute('aria-expanded', String(!open));
    navLinks.classList.toggle('is-open');
  });
}

// Smooth scroll for internal links
document.addEventListener('click', (e) => {
  const target = e.target;
  if (target instanceof Element && target.matches('a[href^="#"]')) {
    const href = target.getAttribute('href');
    if (href && href.length > 1) {
      const el = document.querySelector(href);
      if (el) {
        e.preventDefault();
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }
});

// FAQ accordion
const faqButtons = document.querySelectorAll('.faq-question');
faqButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    const expanded = btn.getAttribute('aria-expanded') === 'true';
    const panelId = btn.getAttribute('aria-controls');
    const panel = panelId ? document.getElementById(panelId) : null;
    btn.setAttribute('aria-expanded', String(!expanded));
    if (panel) {
      panel.hidden = expanded;
    }
  });
});

// Reveal on scroll
const revealEls = document.querySelectorAll('.reveal');
const io = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      io.unobserve(entry.target);
    }
  });
}, { threshold: 0.14 });
revealEls.forEach((el) => io.observe(el));

// Year
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = String(new Date().getFullYear());


