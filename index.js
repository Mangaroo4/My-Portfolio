/* global PROFILE, ROLES, STATS, SKILL_GROUPS, PROJECTS, PROJECT_FILTERS, TIMELINE, SERVICES, GUIDE */

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const escapeHtml = (value) =>
  String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);

const storage = {
  get(key) {
    try {
      return sessionStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key, value) {
    try {
      sessionStorage.setItem(key, value);
    } catch {
      // Storage can be blocked; the intro simply shows again next visit.
    }
  },
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// ---------------------------------------------------------------- toast

let toastTimer = 0;

const toast = (message) => {
  const el = $('.toast');
  el.textContent = message;
  el.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('is-visible'), 2400);
};

// Lets the guide character react to what the visitor does (see GUIDE.reactions in data.js).
const guideReact = (key) => document.dispatchEvent(new CustomEvent('guide-react', { detail: key }));

const copyText = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
};

// ---------------------------------------------------------------- profile

const fillProfile = () => {
  $$('[data-profile]').forEach((el) => {
    const value = PROFILE[el.dataset.profile];
    if (value) el.textContent = value;
  });

  $$('[data-profile-email]').forEach((el) => {
    el.href = `mailto:${PROFILE.email}`;
    el.textContent = PROFILE.email;
  });

  $$('[data-guide]').forEach((el) => {
    el.textContent = GUIDE[el.dataset.guide];
  });

  $('.footer-year').textContent = `© ${new Date().getFullYear()} ${PROFILE.name}`;

  const links = PROFILE.links.filter((link) => link.url);
  $('[data-render="links"]').innerHTML = links.length
    ? links
        .map((link) => `<li><a href="${escapeHtml(link.url)}" target="_blank" rel="noopener">${escapeHtml(link.label)} <span aria-hidden="true">↗</span></a></li>`)
        .join('')
    : '<li class="muted">Links coming soon.</li>';

  $('[data-copy-email]').addEventListener('click', async () => {
    toast((await copyText(PROFILE.email)) ? `Copied ${PROFILE.email}` : PROFILE.email);
    guideReact('copied');
  });
};

const startClock = () => {
  const el = $('.clock-value');
  const tick = () => {
    el.textContent = new Date().toLocaleTimeString([], { hour12: false });
  };
  tick();
  setInterval(tick, 1000);
};

// ---------------------------------------------------------------- background

// A slow-moving perspective grid with drifting data points. Drawn once when
// reduced motion is on, and paused while the tab is hidden.
const startBackground = () => {
  const canvas = $('.bg-grid');
  const ctx = canvas.getContext('2d');
  let width = 0;
  let height = 0;
  let points = [];
  let offset = 0;
  let frame = 0;

  const resize = () => {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width * ratio;
    canvas.height = height * ratio;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    points = Array.from({ length: Math.round((width * height) / 26000) }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      speed: 0.15 + Math.random() * 0.5,
      size: Math.random() < 0.15 ? 2 : 1,
      hue: Math.random() < 0.7 ? '0, 240, 255' : '255, 42, 109',
    }));
  };

  const draw = () => {
    ctx.clearRect(0, 0, width, height);

    const glow = ctx.createRadialGradient(width * 0.75, height * 0.2, 0, width * 0.75, height * 0.2, width * 0.6);
    glow.addColorStop(0, 'rgba(139, 92, 246, 0.10)');
    glow.addColorStop(1, 'rgba(5, 6, 13, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height);

    // Floor grid in perspective at the bottom of the viewport.
    const horizon = height * 0.62;
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.07)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = -20; i <= 20; i += 1) {
      ctx.moveTo(width / 2 + i * 18, horizon);
      ctx.lineTo(width / 2 + i * width * 0.12, height);
    }
    for (let i = 0; i < 14; i += 1) {
      const t = ((i + offset) % 14) / 14;
      const y = horizon + (height - horizon) * t * t;
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
    }
    ctx.stroke();

    points.forEach((point) => {
      ctx.fillStyle = `rgba(${point.hue}, ${point.size === 2 ? 0.7 : 0.35})`;
      ctx.fillRect(point.x, point.y, point.size, point.size * 6);
    });
  };

  const loop = () => {
    offset = (offset + 0.012) % 14;
    points.forEach((point) => {
      point.y += point.speed;
      if (point.y > height) {
        point.y = -10;
        point.x = Math.random() * width;
      }
    });
    draw();
    frame = requestAnimationFrame(loop);
  };

  resize();
  window.addEventListener('resize', () => {
    resize();
    if (prefersReducedMotion) draw();
  });

  if (prefersReducedMotion) {
    draw();
    return;
  }

  document.addEventListener('visibilitychange', () => {
    cancelAnimationFrame(frame);
    if (!document.hidden) loop();
  });
  loop();
};

// ---------------------------------------------------------------- navigation

const setupNav = (onSectionChange) => {
  const sections = $$('main section[id]');
  const navLinks = $$('.hud-nav a');
  const progress = $('.scroll-progress');
  let currentId = '';
  let ticking = false;

  const findCurrentSection = () => {
    const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
    if (atBottom) return sections[sections.length - 1];

    const marker = window.innerHeight * 0.35;
    return sections.reduce((current, section) => (section.getBoundingClientRect().top <= marker ? section : current), sections[0]);
  };

  const update = () => {
    ticking = false;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.setProperty('--progress', max > 0 ? Math.min(window.scrollY / max, 1) : 0);

    const { id } = findCurrentSection();
    if (id === currentId) return;
    currentId = id;

    // Sections without their own nav link (stats, services) keep the nearest earlier one lit.
    const order = sections.map((section) => section.id);
    const linked = navLinks.map((link) => link.getAttribute('href'));
    let target = id === 'home' ? '#top' : `#${id}`;
    for (let i = order.indexOf(id); i >= 0 && !linked.includes(target); i -= 1) {
      target = order[i] === 'home' ? '#top' : `#${order[i]}`;
    }

    navLinks.forEach((link) => {
      const isActive = link.getAttribute('href') === target;
      link.classList.toggle('active', isActive);
      if (isActive) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });

    onSectionChange(id);
  };

  window.addEventListener(
    'scroll',
    () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    },
    { passive: true }
  );
  window.addEventListener('resize', update);
  update();

  // Mobile menu
  const menuButton = $('.hud-menu');
  const mobileNav = $('#mobile-nav');

  const setMenu = (open) => {
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    mobileNav.hidden = !open;
  };

  menuButton.addEventListener('click', () => setMenu(menuButton.getAttribute('aria-expanded') !== 'true'));
  mobileNav.addEventListener('click', (event) => {
    if (event.target.closest('a')) setMenu(false);
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !mobileNav.hidden) {
      setMenu(false);
      menuButton.focus();
    }
  });
};

// ---------------------------------------------------------------- hero

const startRoleRotator = () => {
  const el = $('.role-text');

  if (prefersReducedMotion) {
    let index = 0;
    setInterval(() => {
      index = (index + 1) % ROLES.length;
      el.textContent = ROLES[index];
    }, 3000);
    return;
  }

  let index = 0;

  const run = async () => {
    for (;;) {
      const word = ROLES[index];
      for (let i = 1; i <= word.length; i += 1) {
        el.textContent = word.slice(0, i);
        await sleep(55);
      }
      await sleep(1800);
      for (let i = word.length; i >= 0; i -= 1) {
        el.textContent = word.slice(0, i);
        await sleep(28);
      }
      await sleep(250);
      index = (index + 1) % ROLES.length;
    }
  };

  run();
};

// ---------------------------------------------------------------- stats

const renderStats = () => {
  const grid = $('[data-render="stats"]');
  const format = (value, decimals = 0) => value.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

  grid.innerHTML = STATS.map(
    (stat) => `
      <div class="stat">
        <p class="stat-value"><span data-count="${stat.value}" data-decimals="${stat.decimals || 0}">${format(prefersReducedMotion ? stat.value : 0, stat.decimals)}</span>${escapeHtml(stat.suffix)}</p>
        <p class="stat-label">${escapeHtml(stat.label)}</p>
      </div>`
  ).join('');

  if (prefersReducedMotion || !('IntersectionObserver' in window)) {
    $$('[data-count]', grid).forEach((el) => {
      el.textContent = format(Number(el.dataset.count), Number(el.dataset.decimals));
    });
    return;
  }

  const countUp = (el) => {
    const target = Number(el.dataset.count);
    const decimals = Number(el.dataset.decimals);
    const start = performance.now();
    const duration = 1600;

    const step = (now) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - (1 - t) ** 3;
      el.textContent = format(target * eased, decimals);
      if (t < 1) requestAnimationFrame(step);
    };

    requestAnimationFrame(step);
  };

  const observer = new IntersectionObserver(
    (entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      $$('[data-count]', grid).forEach(countUp);
      observer.disconnect();
    },
    { threshold: 0.4 }
  );

  observer.observe(grid);
};

// ---------------------------------------------------------------- skills

const renderSkills = () => {
  const tabList = $('[data-render="skill-tabs"]');
  const panel = $('[data-render="skill-panel"]');

  tabList.innerHTML = SKILL_GROUPS.map(
    (group, index) => `
      <button class="skill-tab" type="button" role="tab" id="tab-${group.id}" aria-controls="skill-panel"
        aria-selected="${index === 0}" tabindex="${index === 0 ? 0 : -1}" data-group="${group.id}">
        <span>${escapeHtml(group.label)}</span><span>${String(group.skills.length).padStart(2, '0')}</span>
      </button>`
  ).join('');

  const tabs = $$('.skill-tab', tabList);

  const select = (groupId, { focus = false } = {}) => {
    const group = SKILL_GROUPS.find((item) => item.id === groupId);

    tabs.forEach((tab) => {
      const isSelected = tab.dataset.group === groupId;
      tab.setAttribute('aria-selected', String(isSelected));
      tab.tabIndex = isSelected ? 0 : -1;
      if (isSelected && focus) tab.focus();
    });

    panel.setAttribute('aria-labelledby', `tab-${groupId}`);
    panel.classList.remove('is-filled');
    panel.innerHTML = `
      <p class="skill-panel-title">${escapeHtml(group.label)}</p>
      <ul class="skill-list">
        ${group.skills
          .map(
            (skill) => `
          <li>
            <p class="skill-row-head"><span>${escapeHtml(skill.name)}</span><span>${skill.level}%</span></p>
            <div class="skill-bar" role="meter" aria-label="${escapeHtml(skill.name)}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${skill.level}">
              <span style="--level: ${skill.level / 100}"></span>
            </div>
          </li>`
          )
          .join('')}
      </ul>`;

    // Next frame so the bars animate from zero.
    requestAnimationFrame(() => requestAnimationFrame(() => panel.classList.add('is-filled')));
  };

  tabList.addEventListener('click', (event) => {
    const tab = event.target.closest('.skill-tab');
    if (tab) select(tab.dataset.group);
  });

  tabList.addEventListener('keydown', (event) => {
    const index = tabs.indexOf(document.activeElement);
    if (index < 0) return;

    const keys = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
    let next = null;
    if (event.key in keys) next = (index + keys[event.key] + tabs.length) % tabs.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = tabs.length - 1;
    if (next === null) return;

    event.preventDefault();
    select(tabs[next].dataset.group, { focus: true });
  });

  select(SKILL_GROUPS[0].id);
};

// ---------------------------------------------------------------- projects

const renderProjects = () => {
  const grid = $('[data-render="projects"]');
  const filters = $('[data-render="filters"]');
  const count = $('.filter-count');
  const modal = $('.modal');
  const modalBody = $('.modal-body');
  const categoryLabel = (id) => (PROJECT_FILTERS.find((filter) => filter.id === id) || { label: id }).label;

  filters.innerHTML = PROJECT_FILTERS.map(
    (filter, index) => `<button class="filter-btn" type="button" aria-pressed="${index === 0}" data-filter="${filter.id}">${escapeHtml(filter.label)}</button>`
  ).join('');

  grid.innerHTML = PROJECTS.map(
    (project, index) => `
      <article class="project-card panel" data-category="${project.category}">
        <p class="project-top"><span class="cat">${escapeHtml(categoryLabel(project.category))}</span><span>#${String(index + 1).padStart(3, '0')} · ${project.year}</span></p>
        <h3>${escapeHtml(project.title)}</h3>
        <p>${escapeHtml(project.summary)}</p>
        <ul class="stack" aria-label="Tech stack">${project.stack.map((tech) => `<li>${escapeHtml(tech)}</li>`).join('')}</ul>
        <button class="project-open" type="button" data-project="${project.id}">Open file <span aria-hidden="true">→</span></button>
      </article>`
  ).join('');

  const applyFilter = (filterId) => {
    $$('.filter-btn', filters).forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.filter === filterId)));
    let shown = 0;
    $$('.project-card', grid).forEach((card) => {
      const match = filterId === 'all' || card.dataset.category === filterId;
      card.hidden = !match;
      if (match) shown += 1;
    });
    count.textContent = `> ${shown} of ${PROJECTS.length} projects`;
  };

  filters.addEventListener('click', (event) => {
    const button = event.target.closest('.filter-btn');
    if (button) applyFilter(button.dataset.filter);
  });

  applyFilter('all');

  let opener = null;

  const openProject = (id) => {
    const project = PROJECTS.find((item) => item.id === id);
    if (!project) return;

    opener = document.activeElement;
    const actions = [
      project.repo && `<a class="btn btn-primary" href="${escapeHtml(project.repo)}" target="_blank" rel="noopener">Source code ↗</a>`,
      project.demo && `<a class="btn btn-ghost" href="${escapeHtml(project.demo)}" target="_blank" rel="noopener">Live demo ↗</a>`,
      `<a class="btn btn-ghost" href="#contact" data-close-modal>Ask about this project</a>`,
    ].filter(Boolean);

    modalBody.innerHTML = `
      <p class="eyebrow">${escapeHtml(categoryLabel(project.category))} · ${project.year}</p>
      <h3 id="modal-title">${escapeHtml(project.title)}</h3>
      <p class="lead">${escapeHtml(project.summary)}</p>
      <dl class="modal-grid">
        <div><dt>Problem</dt><dd>${escapeHtml(project.problem)}</dd></div>
        <div><dt>Solution</dt><dd>${escapeHtml(project.solution)}</dd></div>
        <div><dt>Result</dt><dd>${escapeHtml(project.result)}</dd></div>
      </dl>
      <ul class="stack" aria-label="Tech stack">${project.stack.map((tech) => `<li>${escapeHtml(tech)}</li>`).join('')}</ul>
      <div class="modal-actions">${actions.join('')}</div>`;

    modal.showModal();
    $('.modal-close', modal).focus();
  };

  grid.addEventListener('click', (event) => {
    const button = event.target.closest('[data-project]');
    if (button) openProject(button.dataset.project);
  });

  $('.modal-close', modal).addEventListener('click', () => modal.close());
  modal.addEventListener('click', (event) => {
    // Click on the backdrop (the dialog element itself) closes it.
    if (event.target === modal || event.target.closest('[data-close-modal]')) modal.close();
  });
  modal.addEventListener('close', () => {
    if (opener && document.contains(opener) && !location.hash.endsWith('contact')) opener.focus();
  });

  return { openProject, applyFilter };
};

// ---------------------------------------------------------------- timeline & services

const renderTimeline = () => {
  $('[data-render="timeline"]').innerHTML = TIMELINE.map(
    (item) => `
      <li class="timeline-item panel">
        <p class="timeline-when">${escapeHtml(item.when)}</p>
        <h3>${escapeHtml(item.title)}</h3>
        <p class="timeline-org">${escapeHtml(item.org)}</p>
        <p>${escapeHtml(item.text)}</p>
      </li>`
  ).join('');
};

const renderServices = () => {
  $('[data-render="services"]').innerHTML = SERVICES.map(
    (service) => `
      <article class="service panel">
        <p class="service-code" aria-hidden="true">${escapeHtml(service.code)}</p>
        <h3>${escapeHtml(service.title)}</h3>
        <p>${escapeHtml(service.text)}</p>
      </article>`
  ).join('');
};

// ---------------------------------------------------------------- terminal

const setupTerminal = ({ openProject }) => {
  const output = $('.terminal-output');
  const form = $('.terminal-form');
  const input = $('.terminal-input');
  const history = [];
  let historyIndex = 0;

  const print = (html, className = '') => {
    const line = document.createElement('p');
    if (className) line.className = className;
    line.innerHTML = html;
    output.appendChild(line);
    output.scrollTop = output.scrollHeight;
  };

  const jump = (id) => {
    document.getElementById(id).scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth' });
  };

  const commands = {
    help: {
      text: 'list available commands',
      run: () => {
        Object.entries(commands)
          .filter(([, command]) => command.text)
          .forEach(([name, command]) => print(`  <span class="t-accent">${name.padEnd(10)}</span> ${command.text}`));
      },
    },
    whoami: {
      text: 'who is behind this site',
      run: () => {
        print(`<span class="t-accent">${escapeHtml(PROFILE.name)}</span> — ${escapeHtml(PROFILE.role)}`);
        print(`location: ${escapeHtml(PROFILE.location)}`, 't-muted');
        print(`status:   ${escapeHtml(PROFILE.status)}`, 't-muted');
      },
    },
    skills: {
      text: 'print the skill matrix',
      run: () => {
        SKILL_GROUPS.forEach((group) => {
          print(`[${escapeHtml(group.label)}]`, 't-warn');
          group.skills.forEach((skill) => {
            const filled = Math.round(skill.level / 10);
            print(`  ${escapeHtml(skill.name.padEnd(26))} ${'█'.repeat(filled)}${'░'.repeat(10 - filled)} ${skill.level}%`);
          });
        });
      },
    },
    projects: {
      text: 'list projects (open <n> to view one)',
      run: () => {
        PROJECTS.forEach((project, index) => print(`  <span class="t-accent">${index + 1}.</span> ${escapeHtml(project.title)} <span class="t-muted">— ${escapeHtml(project.stack.slice(0, 3).join(', '))}</span>`));
        print('type "open 1" to read the full breakdown', 't-muted');
      },
    },
    open: {
      text: '',
      run: (arg) => {
        const project = PROJECTS[Number(arg) - 1];
        if (!project) {
          print(`open: no project "${escapeHtml(arg || '')}". Try "projects".`, 't-warn');
          return;
        }
        print(`opening ${escapeHtml(project.title)}…`, 't-ok');
        openProject(project.id);
      },
    },
    experience: {
      text: 'show the work log',
      run: () => TIMELINE.forEach((item) => print(`  <span class="t-warn">${escapeHtml(item.when)}</span>  ${escapeHtml(item.title)} <span class="t-muted">@ ${escapeHtml(item.org)}</span>`)),
    },
    contact: {
      text: 'how to reach me',
      run: () => {
        print(`email: <a href="mailto:${escapeHtml(PROFILE.email)}">${escapeHtml(PROFILE.email)}</a>`);
        PROFILE.links.filter((link) => link.url).forEach((link) => print(`${escapeHtml(link.label.toLowerCase())}: <a href="${escapeHtml(link.url)}" target="_blank" rel="noopener">${escapeHtml(link.url)}</a>`));
      },
    },
    goto: {
      text: 'scroll to a section (goto projects)',
      run: (arg) => {
        const id = (arg || '').toLowerCase();
        const section = id && document.getElementById(id);
        if (!section || section.tagName !== 'SECTION' || !section.closest('main')) {
          print(`goto: unknown section. Try: ${$$('main section[id]').map((s) => s.id).join(', ')}`, 't-warn');
          return;
        }
        print(`jumping to #${escapeHtml(id)}…`, 't-ok');
        jump(id);
      },
    },
    date: { text: 'print the current date', run: () => print(new Date().toString()) },
    echo: { text: '', run: (arg) => print(escapeHtml(arg || '')) },
    sudo: {
      text: '',
      run: (arg) => {
        if ((arg || '').startsWith('hire')) {
          print('[sudo] permission granted. Opening the uplink…', 't-ok');
          guideReact('hire');
          jump('contact');
          setTimeout(() => $('#c-name').focus({ preventScroll: true }), prefersReducedMotion ? 0 : 700);
        } else {
          print('nice try. This incident will be reported. 👀', 't-warn');
        }
      },
    },
    clear: { text: 'clear the screen', run: () => (output.innerHTML = '') },
  };

  const run = (raw) => {
    const value = raw.trim();
    print(`<span class="t-user">alex@portfolio</span>:<span class="t-path">~</span>$ <span class="t-cmd">${escapeHtml(value)}</span>`);
    if (!value) return;

    history.push(value);
    historyIndex = history.length;

    const [name, ...rest] = value.split(/\s+/);
    const command = commands[name.toLowerCase()];
    if (command) command.run(rest.join(' '));
    else {
      print(`command not found: ${escapeHtml(name)}. Type "help".`, 't-warn');
      guideReact('error');
    }
  };

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    run(input.value);
    input.value = '';
  });

  input.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowUp' && history.length) {
      event.preventDefault();
      historyIndex = Math.max(0, historyIndex - 1);
      input.value = history[historyIndex];
    } else if (event.key === 'ArrowDown' && history.length) {
      event.preventDefault();
      historyIndex = Math.min(history.length, historyIndex + 1);
      input.value = history[historyIndex] || '';
    } else if (event.key === 'Tab' && input.value.trim()) {
      const matches = Object.keys(commands).filter((name) => name.startsWith(input.value.trim().toLowerCase()));
      if (matches.length === 1) {
        event.preventDefault();
        input.value = `${matches[0]} `;
      }
    } else if (event.key === 'l' && event.ctrlKey) {
      event.preventDefault();
      output.innerHTML = '';
    }
  });

  $('.terminal').addEventListener('click', (event) => {
    if (!event.target.closest('a') && !window.getSelection().toString()) input.focus({ preventScroll: true });
  });

  print(`${escapeHtml(GUIDE.name)}-OS v2.6 — secure shell established.`, 't-ok');
  print(`Welcome. Type <span class="t-accent">help</span> to list commands.`, 't-muted');
};

// ---------------------------------------------------------------- contact form

const setupContactForm = () => {
  const form = $('.contact-form');
  const message = $('#c-message');
  const counter = $('.char-count', form);

  const rules = {
    name: (value) => (value.trim().length < 2 ? 'Please enter your name.' : ''),
    email: (value) => (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()) ? '' : 'Please enter a valid email address.'),
    message: (value) => (value.trim().length < 10 ? 'Message needs at least 10 characters.' : ''),
  };

  const validate = (field) => {
    const error = rules[field.name](field.value);
    const wrapper = field.closest('.field');
    wrapper.classList.toggle('has-error', Boolean(error));
    $('.field-error', wrapper).textContent = error;
    field.setAttribute('aria-invalid', String(Boolean(error)));
    return !error;
  };

  message.addEventListener('input', () => {
    counter.textContent = `${message.value.length} / ${message.maxLength}`;
  });

  Object.keys(rules).forEach((name) => {
    const field = form.elements[name];
    field.addEventListener('blur', () => field.value && validate(field));
    field.addEventListener('input', () => field.closest('.field').classList.contains('has-error') && validate(field));
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const fields = Object.keys(rules).map((name) => form.elements[name]);
    const invalid = fields.filter((field) => !validate(field));

    if (invalid.length) {
      invalid[0].focus();
      guideReact('invalid');
      return;
    }

    const { name, email, topic } = form.elements;
    const subject = `[Portfolio] ${topic.value} — ${name.value.trim()}`;
    const body = `${message.value.trim()}\n\n— ${name.value.trim()} (${email.value.trim()})`;
    window.location.href = `mailto:${PROFILE.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    toast('Opening your email app…');
    guideReact('sent');
  });
};

// ---------------------------------------------------------------- command palette

const setupPalette = ({ applyFilter }) => {
  const palette = $('.palette');
  const input = $('.palette-input', palette);
  const list = $('.palette-list', palette);
  let selected = 0;
  let visible = [];

  const go = (id) => () => document.getElementById(id).scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth' });

  const actions = [
    { label: 'Go to Home', hint: 'section', run: go('top') },
    { label: 'Go to Skills', hint: 'section', run: go('skills') },
    { label: 'Go to Projects', hint: 'section', run: go('projects') },
    { label: 'Go to System log', hint: 'section', run: go('experience') },
    { label: 'Go to Services', hint: 'section', run: go('services') },
    { label: 'Go to Terminal', hint: 'section', run: () => { go('terminal')(); setTimeout(() => $('.terminal-input').focus({ preventScroll: true }), 500); } },
    { label: 'Go to Contact', hint: 'section', run: go('contact') },
    ...PROJECT_FILTERS.filter((filter) => filter.id !== 'all').map((filter) => ({
      label: `Show ${filter.label} projects`,
      hint: 'filter',
      run: () => { applyFilter(filter.id); go('projects')(); },
    })),
    { label: 'Copy email address', hint: 'action', run: async () => {
        toast((await copyText(PROFILE.email)) ? `Copied ${PROFILE.email}` : PROFILE.email);
        guideReact('copied');
      },
    },
    ...PROFILE.links.filter((link) => link.url).map((link) => ({ label: `Open ${link.label}`, hint: 'link', run: () => window.open(link.url, '_blank', 'noopener') })),
    { label: 'Replay intro', hint: 'action', run: () => document.dispatchEvent(new CustomEvent('replay-intro')) },
  ];

  const render = () => {
    const query = input.value.trim().toLowerCase();
    visible = actions.filter((action) => action.label.toLowerCase().includes(query));
    selected = Math.min(selected, Math.max(visible.length - 1, 0));
    list.innerHTML = visible.length
      ? visible
          .map((action, index) => `<li role="option" id="pal-${index}" aria-selected="${index === selected}" data-index="${index}"><span>${escapeHtml(action.label)}</span><span>${action.hint}</span></li>`)
          .join('')
      : '<li role="option" aria-disabled="true"><span>No matches</span><span></span></li>';
    input.setAttribute('aria-activedescendant', visible.length ? `pal-${selected}` : '');
    $(`#pal-${selected}`, list)?.scrollIntoView({ block: 'nearest' });
  };

  const open = () => {
    if (palette.open) return;
    input.value = '';
    selected = 0;
    render();
    palette.showModal();
    input.focus();
    guideReact('palette');
  };

  const runSelected = (index = selected) => {
    const action = visible[index];
    if (!action) return;
    palette.close();
    action.run();
  };

  input.addEventListener('input', () => {
    selected = 0;
    render();
  });

  input.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const delta = event.key === 'ArrowDown' ? 1 : -1;
      selected = (selected + delta + visible.length) % Math.max(visible.length, 1);
      render();
    } else if (event.key === 'Enter') {
      event.preventDefault();
      runSelected();
    }
  });

  list.addEventListener('click', (event) => {
    const item = event.target.closest('[data-index]');
    if (item) runSelected(Number(item.dataset.index));
  });

  palette.addEventListener('click', (event) => {
    if (event.target === palette) palette.close();
  });

  $$('[data-open-palette]').forEach((button) => button.addEventListener('click', open));

  document.addEventListener('keydown', (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      if (palette.open) palette.close();
      else if (!$('.intro').hidden || $('.modal').open) return;
      else open();
    }
  });
};

// ---------------------------------------------------------------- reveal

const revealOnScroll = () => {
  if (prefersReducedMotion || !('IntersectionObserver' in window)) return;

  const items = $$('.section-heading, .stats-grid, .skills-layout, .project-card, .timeline-item, .service, .terminal, .contact-form, .contact-card');

  const observer = new IntersectionObserver(
    (entries) => {
      entries
        .filter((entry) => entry.isIntersecting)
        .forEach((entry, index) => {
          const item = entry.target;
          observer.unobserve(item);
          item.style.transitionDelay = `${index * 80}ms`;
          item.classList.add('is-visible');
          // Hand control back to the element's own transitions (hover effects).
          item.addEventListener(
            'transitionend',
            () => {
              item.classList.remove('reveal', 'is-visible');
              item.style.transitionDelay = '';
            },
            { once: true }
          );
        });
    },
    { threshold: 0.12 }
  );

  items.forEach((item) => {
    item.classList.add('reveal');
    observer.observe(item);
  });
};

// ---------------------------------------------------------------- guide & intro

// Types text into a speech element. The full line is mirrored into an sr-only span so
// screen readers hear it once instead of letter by letter.
const createSpeaker = (container, talker, kai) => {
  const typed = $('.typed', container);
  const spoken = $('.sr-only', container);
  let timer = 0;
  let current = '';

  const settle = () => {
    clearInterval(timer);
    timer = 0;
    talker?.classList.remove('is-talking');
    kai?.talk(false);
  };

  return {
    say(text) {
      settle();
      current = text;
      spoken.textContent = text;

      if (prefersReducedMotion) {
        typed.textContent = text;
        return;
      }

      const chars = Array.from(text);
      let shown = 0;
      typed.textContent = '';
      talker?.classList.add('is-talking');
      kai?.talk(true);

      timer = setInterval(() => {
        shown += 1;
        typed.textContent = chars.slice(0, shown).join('');
        if (shown >= chars.length) settle();
      }, 22);
    },
    isTyping: () => timer !== 0,
    finish() {
      settle();
      typed.textContent = current;
    },
    stop: settle,
  };
};

const BOOT_LINES = [
  ['> initializing neural link', ''],
  ['[ OK ] mounting /dev/portfolio', 'ok'],
  ['[ OK ] loading modules: javascript, typescript, node', 'ok'],
  ['[ OK ] connecting database cluster', 'ok'],
  ['[WARN] coffee level low — continuing anyway', 'warn'],
  ['[ OK ] security handshake complete', 'ok'],
  ['> ACCESS GRANTED', ''],
];

const setupGuide = () => {
  const guide = $('.guide');
  const intro = $('.intro');
  const boot = $('.boot', intro);
  const bootLog = $('.boot-log', intro);
  const bootBar = $('.boot-progress span', intro);
  const stage = $('.intro-stage', intro);
  const nextButton = $('[data-intro-next]', intro);
  const skipButton = $('[data-intro-skip]', intro);
  const guideAvatar = $('.guide-avatar', guide);

  // Live character rigs: hero card, intro portrait and the corner avatar.
  const rigs = {};
  if (window.Character) {
    $$('[data-kai]').forEach((el) => {
      const view = el.dataset.kai;
      rigs[view] = window.Character.mount(el, { view, fps: view === 'avatar' ? 30 : 0, label: `${GUIDE.name}, the animated guide character` });
    });
  }

  const toLine = (entry) => (typeof entry === 'string' ? { text: entry } : entry);
  const guideKai = rigs.avatar;
  const introKai = rigs.portrait;
  const heroKai = rigs.hero;

  const guideSpeaker = createSpeaker($('.guide-text', guide), guide, guideKai);
  const introSpeaker = createSpeaker($('.dialogue-text', intro), stage, introKai);

  // Mood buttons under the hero portrait.
  const moodHost = $('[data-render="moods"]');
  if (heroKai && moodHost) {
    moodHost.innerHTML = window.Character.moods
      .map((mood) => `<button type="button" class="mood-btn" data-mood="${mood}" aria-pressed="${mood === 'neutral'}">${mood}</button>`)
      .join('');

    const pressMood = (mood) => {
      $$('.mood-btn', moodHost).forEach((btn) => btn.setAttribute('aria-pressed', String(btn.dataset.mood === mood)));
    };

    moodHost.addEventListener('click', (event) => {
      const button = event.target.closest('.mood-btn');
      if (!button) return;
      const mood = button.dataset.mood;
      heroKai.setMood(mood, { revertAfter: mood === 'neutral' ? 0 : 7000 });
      pressMood(mood);
      clearTimeout(pressMood.timer);
      pressMood.timer = setTimeout(() => pressMood('neutral'), 7000);
    });
  }

  let sectionId = 'home';
  let chatterIndex = 0;
  let introOpen = false;
  let bootRun = 0;
  let step = 0;
  let returnFocus = null;

  // On small screens the bubble covers content, so it tucks away after a few seconds.
  const smallScreen = window.matchMedia('(max-width: 600px)');
  let quietTimer = 0;

  const guideSay = (entry) => {
    const { text, mood } = toLine(entry);
    guide.classList.remove('is-quiet');
    guideKai?.setMood(mood || 'neutral', { revertAfter: 12000 });
    guideSpeaker.say(text);
    clearTimeout(quietTimer);
    if (smallScreen.matches) quietTimer = setTimeout(() => guide.classList.add('is-quiet'), 6000);
  };

  const onSectionChange = (id) => {
    sectionId = id;
    if (!introOpen && !guide.hidden && GUIDE.sections[id]) guideSay(GUIDE.sections[id]);
  };

  document.addEventListener('guide-react', (event) => {
    const reaction = GUIDE.reactions?.[event.detail];
    if (reaction && !introOpen && !guide.hidden) guideSay(reaction);
  });

  guideAvatar.addEventListener('click', () => {
    guideSay(GUIDE.chatter[chatterIndex]);
    chatterIndex = (chatterIndex + 1) % GUIDE.chatter.length;
  });

  $('.guide-close', guide).addEventListener('click', () => {
    guideSpeaker.stop();
    guide.classList.add('is-quiet');
    guideAvatar.focus();
  });

  const showStep = () => {
    const { text, mood } = toLine(GUIDE.intro[step]);
    introKai?.setMood(mood || 'neutral');
    introSpeaker.say(text);
    nextButton.textContent = step === GUIDE.intro.length - 1 ? 'Enter system ▶' : 'Next ▸';
  };

  const showStage = () => {
    boot.hidden = true;
    stage.hidden = false;
    step = 0;
    showStep();
    nextButton.focus();
  };

  const runBoot = async () => {
    const run = ++bootRun;
    boot.hidden = false;
    stage.hidden = true;
    bootLog.innerHTML = '';
    bootBar.style.width = '0';

    for (let i = 0; i < BOOT_LINES.length; i += 1) {
      if (run !== bootRun) return;
      const [text, className] = BOOT_LINES[i];
      const line = document.createElement('span');
      if (className) line.className = className;
      line.textContent = `${text}\n`;
      bootLog.appendChild(line);
      bootBar.style.width = `${((i + 1) / BOOT_LINES.length) * 100}%`;
      await sleep(prefersReducedMotion ? 0 : 260 + Math.random() * 200);
    }

    await sleep(prefersReducedMotion ? 0 : 400);
    if (run === bootRun && introOpen) showStage();
  };

  const closeIntro = () => {
    bootRun += 1;
    introSpeaker.stop();
    introOpen = false;
    intro.hidden = true;
    document.body.classList.remove('is-locked');
    storage.set('intro-seen', '1');
    guide.hidden = false;
    guideSay(GUIDE.sections[sectionId] || GUIDE.sections.home);
    if (returnFocus && returnFocus !== document.body && document.contains(returnFocus)) returnFocus.focus();
  };

  const openIntro = () => {
    returnFocus = document.activeElement;
    introOpen = true;
    intro.hidden = false;
    document.body.classList.add('is-locked');
    skipButton.focus();
    runBoot();
  };

  nextButton.addEventListener('click', () => {
    if (introSpeaker.isTyping()) {
      introSpeaker.finish();
    } else if (step < GUIDE.intro.length - 1) {
      step += 1;
      showStep();
    } else {
      closeIntro();
    }
  });

  skipButton.addEventListener('click', closeIntro);

  intro.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeIntro();
      return;
    }

    // Keep keyboard focus inside the intro while it is open.
    if (event.key === 'Tab') {
      const focusable = [nextButton, skipButton].filter((el) => !el.closest('[hidden]'));
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  });

  $('[data-replay-intro]').addEventListener('click', openIntro);
  document.addEventListener('replay-intro', openIntro);

  if (storage.get('intro-seen')) {
    guide.hidden = false;
    guideSay(GUIDE.sections.home);
  } else {
    openIntro();
  }

  return { onSectionChange };
};

// ---------------------------------------------------------------- init

const init = () => {
  fillProfile();
  startClock();
  startBackground();
  startRoleRotator();
  renderStats();
  renderSkills();
  const projects = renderProjects();
  renderTimeline();
  renderServices();
  setupTerminal(projects);
  setupContactForm();
  setupPalette(projects);
  const guide = setupGuide();
  setupNav(guide.onSectionChange);
  revealOnScroll();
};

document.addEventListener('DOMContentLoaded', init);
