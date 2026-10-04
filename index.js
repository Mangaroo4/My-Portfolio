const updateYear = () => {
  const footerText = document.querySelector('.status-year');

  if (!footerText) return;

  const currentYear = new Date().getFullYear();
  footerText.textContent = `© ${currentYear} Alex Morgan`;
};

const setActiveNav = () => {
  const sections = document.querySelectorAll('main section[id]');
  const navLinks = document.querySelectorAll('.main-nav a, .file-tabs a');

  if (!sections.length || !navLinks.length) return;

  const updateActiveLink = (targetId) => {
    navLinks.forEach((link) => {
      const isActive = link.getAttribute('href') === targetId;
      link.classList.toggle('active', isActive);
      if (isActive) {
        link.setAttribute('aria-current', 'page');
      } else {
        link.removeAttribute('aria-current');
      }
    });
  };

  navLinks.forEach((link) => {
    link.addEventListener('click', () => {
      updateActiveLink(link.getAttribute('href'));
    });
  });

  const observer = new IntersectionObserver(
    (entries) => {
      const visibleEntry = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

      if (!visibleEntry) return;

      const id = visibleEntry.target.getAttribute('id');
      const targetHref = id === 'home' ? '#top' : `#${id}`;
      const matchedLink = [...navLinks].find((link) => link.getAttribute('href') === targetHref);

      if (matchedLink) {
        updateActiveLink(targetHref);
      } else {
        updateActiveLink(null);
      }
    },
    {
      rootMargin: '-20% 0px -55% 0px',
      threshold: [0.15, 0.4, 0.7],
    }
  );

  sections.forEach((section) => observer.observe(section));
};

const revealOnScroll = () => {
  const revealItems = document.querySelectorAll('.hero-copy, .hero-image-wrap, .section-heading, .project-card, .about-image-wrap, .about-copy, .contact');

  if (!revealItems.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.18,
    }
  );

  revealItems.forEach((item, index) => {
    item.classList.add('reveal');
    item.style.transitionDelay = `${index * 90}ms`;
    observer.observe(item);
  });
};

const init = () => {
  updateYear();
  setActiveNav();
  revealOnScroll();
};

document.addEventListener('DOMContentLoaded', init);
