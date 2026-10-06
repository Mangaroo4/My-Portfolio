/* Live character rig for the guide (KAI).
 *
 * A cut-out puppet built from one still (assets/character/kai-full.webp and kai-base.webp,
 * both pre-keyed with a transparent background). Head, hair strands, eyelids, brows, mouth
 * and hand are separate clipped layers of the same picture, so they can move independently.
 *
 *   const kai = Character.mount(element, { view: 'portrait' });
 *   kai.setMood('happy');     // see Character.moods for the full list
 *   kai.talk(true);           // mouth flaps while true
 */
(() => {
  const W = 1199;
  const H = 1312;
  const NS = 'http://www.w3.org/2000/svg';
  const XLINK = 'http://www.w3.org/1999/xlink';
  const SKIN = '#fcf0e5';
  const LINE = '#2b1838';
  const MOUTH = '#ec6f86';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const pts = (list) => list.map((p) => p.join(',')).join(' ');

  const HEAD = [[40,0],[1199,0],[1199,690],[950,745],[860,745],[800,718],[713,740],[600,712],[565,745],[470,740],[360,705],[230,700],[40,620]];
  const STRAND_L = [[40,330],[330,330],[375,470],[330,690],[40,690]];
  const STRAND_R = [[905,392],[1199,392],[1199,600],[905,600]];
  const STRAND_BR = [[882,590],[1060,590],[1060,742],[882,742]];
  const HAND = [[735,795],[840,795],[940,840],[944,856],[887,881],[830,996],[830,1062],[738,1062],[728,900]];
  const EYE_L = [[532,528],[590,518],[645,505],[655,530],[650,575],[630,600],[578,606],[548,590],[535,560]];
  const EYE_R = [[786,494],[870,492],[872,540],[860,572],[830,582],[800,580],[788,545]];
  const LID_L = {
    outer: [[503,508],[540,495],[590,487],[642,479],[652,484],[658,500],[658,560],[646,593],[578,609],[550,596],[530,576],[512,562],[503,522]],
    lash: [[503,508],[540,495],[590,487],[642,479],[652,484],[658,498],[640,507],[590,514],[540,527],[533,576],[511,566],[503,522]],
    depth: 80, slope: -12.3, cx: 575, cy: 493,
  };
  const LID_R = {
    outer: [[780,469],[872,465],[874,490],[872,545],[860,576],[830,587],[797,584],[783,548],[780,495]],
    lash: [[780,469],[872,465],[874,490],[830,494],[783,497]],
    depth: 84, slope: -1.5, cx: 826, cy: 468,
  };

  // ------------------------------------------------------------------ moods
  // Every number is a target pose; the rig eases toward it. Anything left out is 0 / neutral.
  //   headR/bodyR: tilt in degrees   headY/bodyX: px shift      lid: eyelid drop 0..1 (both eyes)
  //   lidL/lidR: override per eye    gx/gy: gaze shift           browY: brow lift (negative = up)
  //   handR/handX/handY: fist pose   blush: 0..1                 breath: breathing speed multiplier
  //   bounce: [amplitude px, speed]  shake: amplitude px         sym: floating symbol
  const MOODS = {
    neutral: { mouth: 'open' },
    happy: { headR: 1, headY: -3, bodyR: 0.2, lid: 0.4, browY: -2, mouth: 'grin', blush: 0.4, bounce: [2, 3], sym: 'note' },
    excited: { headR: -1.4, headY: -6, bodyR: 0.3, lid: 0.12, browY: -4, mouth: 'grin', blush: 0.55, handR: -3, handY: -20, breath: 2.2, bounce: [5, 7], sym: 'spark' },
    curious: { headR: 1.5, headY: -1, gx: -4, browY: -3, mouth: 'small', handX: -4, handR: -1.5, sym: 'question' },
    surprised: { headR: -0.4, headY: 6, bodyR: -0.3, browY: -6, mouth: 'o', gy: -1, shake: 1.2, breath: 1.6, sym: 'bang' },
    thinking: { headR: 0.9, headY: -1, gx: 5, gy: -4, lid: 0.14, browY: -1, mouth: 'flat', handX: -10, handY: -46, handR: -6, sym: 'dots' },
    sleepy: { headR: -1.2, headY: 3, bodyR: -0.3, lid: 0.62, browY: 2, mouth: 'flat', breath: 0.55, gy: 1.5, sym: 'zzz' },
    embarrassed: { headR: -1.1, headY: 1, gx: 4, gy: 3, lid: 0.2, browY: -1, mouth: 'wobble', blush: 1, shake: 0.5, breath: 1.5, sym: 'sweat' },
    annoyed: { headR: -0.7, headY: 1, lid: 0.38, browY: 3, mouth: 'frown', gx: 3, sym: 'anger' },
    sad: { headR: -1.3, headY: 5, bodyR: -0.2, lid: 0.34, browY: 2.5, mouth: 'frown', gy: 2.5, breath: 0.7, sym: 'tear' },
    wink: { headR: 1.6, headY: -2, lidL: 1, lidR: 0, browY: -1, mouth: 'grin', blush: 0.25, sym: 'spark' },
    proud: { headR: 0.5, headY: -4, bodyR: 0.3, lid: 0.28, browY: -1, mouth: 'smirk', gx: 2 },
  };

  const SYMBOLS = {
    note: { text: '♪', color: '#00f0ff', x: 1010, y: 300, size: 150 },
    spark: { text: '✦', color: '#ffe14d', x: 1000, y: 280, size: 150 },
    question: { text: '?', color: '#00f0ff', x: 1010, y: 320, size: 190 },
    bang: { text: '!', color: '#ff2a6d', x: 1010, y: 320, size: 200 },
    dots: { text: '…', color: '#00f0ff', x: 960, y: 300, size: 190 },
    zzz: { text: 'z Z', color: '#9aa6ff', x: 930, y: 300, size: 150 },
    sweat: { text: '💦', color: '#ffffff', x: 930, y: 420, size: 130 },
    anger: { text: '💢', color: '#ffffff', x: 960, y: 330, size: 140 },
    tear: { text: '💧', color: '#ffffff', x: 610, y: 690, size: 90 },
  };

  const VIEWS = {
    portrait: '0 0 1199 1312',
    hero: '0 70 1199 1044',
    avatar: '215 120 840 840',
  };

  // ------------------------------------------------------------------ helpers
  const svg = (tag, attrs = {}, parent) => {
    const el = document.createElementNS(NS, tag);
    Object.entries(attrs).forEach(([key, value]) => {
      if (key === 'href') el.setAttributeNS(XLINK, 'xlink:href', value);
      el.setAttribute(key, value);
    });
    if (parent) parent.appendChild(el);
    return el;
  };

  const ease = (t) => 0.5 - 0.5 * Math.cos(Math.PI * Math.min(1, Math.max(0, t)));
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

  // 0 = exhaled, 1 = inhaled, slow-in on the exhale.
  const breathCurve = (t, period) => {
    const p = ((t % period) + period) % period / period;
    return p < 0.42 ? ease(p / 0.42) : 1 - ease((p - 0.42) / 0.58);
  };

  // One blink pulse: closes fast, holds, opens slower. Returns 0..1.
  const blinkCurve = (d) => {
    const close = 0.08;
    const hold = 0.09;
    const open = 0.14;
    if (d < 0 || d > close + hold + open) return 0;
    if (d < close) return (d / close) ** 2;
    if (d < close + hold) return 1;
    return 1 - (1 - (1 - (d - close - hold) / open) ** 2);
  };

  // ------------------------------------------------------------------ instances
  let uid = 0;
  const instances = new Set();
  const pointer = { x: 0, y: 0 };
  let rafId = 0;
  let last = 0;

  const mount = (host, options = {}) => {
    const view = VIEWS[options.view] ? options.view : 'portrait';
    const id = `kai${(uid += 1)}`;
    const frameMs = options.fps ? 1000 / options.fps : 0;
    const base = options.path || 'assets/character/';

    const root = svg('svg', {
      viewBox: VIEWS[view],
      class: 'kai-rig',
      role: 'img',
      'aria-label': options.label || 'Animated illustration of the guide character',
      preserveAspectRatio: 'xMidYMid slice',
    });

    const defs = svg('defs', {}, root);
    svg('image', { id: `${id}-full`, href: `${base}kai-full.webp`, x: 0, y: 0, width: W, height: H }, defs);
    const clip = (name, points) => {
      const c = svg('clipPath', { id: `${id}-${name}` }, defs);
      svg('polygon', { points: pts(points) }, c);
    };
    clip('head', HEAD);
    clip('sl', STRAND_L);
    clip('sr', STRAND_R);
    clip('sbr', STRAND_BR);
    clip('hand', HAND);
    clip('el', EYE_L);
    clip('er', EYE_R);
    clip('elo', LID_L.outer);
    clip('elb', LID_L.lash);
    clip('ero', LID_R.outer);
    clip('erb', LID_R.lash);
    const browL = svg('clipPath', { id: `${id}-bl` }, defs);
    svg('rect', { x: 572, y: 450, width: 68, height: 30 }, browL);
    const browR = svg('clipPath', { id: `${id}-br` }, defs);
    svg('rect', { x: 805, y: 437, width: 36, height: 21 }, browR);
    const blushGrad = svg('radialGradient', { id: `${id}-blush` }, defs);
    svg('stop', { offset: '0', 'stop-color': '#ff4f86', 'stop-opacity': '0.85' }, blushGrad);
    svg('stop', { offset: '1', 'stop-color': '#ff4f86', 'stop-opacity': '0' }, blushGrad);

    const use = (parent, attrs = {}) => svg('use', { href: `#${id}-full`, ...attrs }, parent);

    const body = svg('g', {}, root);
    svg('image', { href: `${base}kai-base.webp`, x: 0, y: 0, width: W, height: H }, body);

    const hand = svg('g', {}, body);
    use(hand, { 'clip-path': `url(#${id}-hand)` });

    const head = svg('g', {}, body);
    use(head, { 'clip-path': `url(#${id}-head)` });
    const strandL = svg('g', {}, head);
    use(strandL, { 'clip-path': `url(#${id}-sl)` });
    const strandR = svg('g', {}, head);
    use(strandR, { 'clip-path': `url(#${id}-sr)` });
    const strandBR = svg('g', {}, head);
    use(strandBR, { 'clip-path': `url(#${id}-sbr)` });

    const makeEye = (name, def) => {
      const eye = svg('g', {}, head);
      const iris = svg('g', { 'clip-path': `url(#${id}-${name})` }, eye);
      const irisUse = use(iris);
      const lidGroup = svg('g', { 'clip-path': `url(#${id}-${name}o)`, display: 'none' }, eye);
      const cover = svg('rect', { x: def.cx - 120, y: def.cy - 80, width: 240, height: 100, fill: SKIN, transform: `rotate(${def.slope},${def.cx},${def.cy})` }, lidGroup);
      const lash = svg('g', {}, lidGroup);
      use(lash, { 'clip-path': `url(#${id}-${name}b)` });
      return { def, irisUse, lidGroup, cover, lash };
    };
    const eyeL = makeEye('el', LID_L);
    const eyeR = makeEye('er', LID_R);

    const browLUse = use(svg('g', { 'clip-path': `url(#${id}-bl)` }, head));
    const browRUse = use(svg('g', { 'clip-path': `url(#${id}-br)` }, head));

    const blushL = svg('ellipse', { cx: 575, cy: 646, rx: 62, ry: 26, fill: `url(#${id}-blush)`, opacity: 0 }, head);
    const blushR = svg('ellipse', { cx: 842, cy: 622, rx: 50, ry: 22, fill: `url(#${id}-blush)`, opacity: 0 }, head);

    // Mouth: a skin patch hides the drawn mouth, then one of these shapes is shown.
    const mouth = svg('g', {}, head);
    const patch = svg('ellipse', { cx: 757, cy: 670, rx: 28, ry: 20, fill: SKIN }, mouth);
    const stroke = { stroke: LINE, 'stroke-width': 3.5, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' };
    const shapes = {
      small: svg('path', { d: 'M745,678 L764,660 L770,676 Z', fill: MOUTH, ...stroke }, mouth),
      smile: svg('path', { d: 'M741,666 Q755,684 773,664 Q757,674 741,666 Z', fill: MOUTH, ...stroke }, mouth),
      flat: svg('path', { d: 'M745,672 Q757,676 769,669', fill: 'none', ...stroke }, mouth),
      grin: svg('path', { d: 'M733,660 Q757,700 783,658 Q757,670 733,660 Z', fill: MOUTH, ...stroke }, mouth),
      o: svg('ellipse', { cx: 757, cy: 674, rx: 11, ry: 14, fill: '#8a2d4a', ...stroke }, mouth),
      frown: svg('path', { d: 'M742,680 Q757,664 772,678', fill: 'none', ...stroke }, mouth),
      smirk: svg('path', { d: 'M742,672 Q760,680 777,658', fill: 'none', ...stroke }, mouth),
      wobble: svg('path', { d: 'M741,672 Q747,666 752,672 T763,672 T773,670', fill: 'none', ...stroke }, mouth),
      talk: svg('ellipse', { cx: 757, cy: 672, rx: 12, ry: 9, fill: '#8a2d4a', ...stroke }, mouth),
    };

    const symbolEl = svg('text', { 'text-anchor': 'middle', 'font-family': 'system-ui, "Segoe UI Emoji", sans-serif', 'font-weight': 700, opacity: 0, 'paint-order': 'stroke', 'stroke-linejoin': 'round' }, root);

    // Swap the static fallback picture for the live rig; overlays such as the scan beam stay.
    host.querySelectorAll('img').forEach((img) => img.remove());
    host.classList.add('has-kai');
    host.prepend(root);

    // ---- state ----
    const num = ['headR', 'headY', 'bodyR', 'bodyX', 'lidL', 'lidR', 'gx', 'gy', 'browY', 'handR', 'handX', 'handY', 'blush', 'breath', 'bounceA', 'bounceF', 'shake'];
    const cur = Object.fromEntries(num.map((k) => [k, 0]));
    cur.breath = 1;
    const tgt = { ...cur };
    const state = {
      mood: 'neutral',
      mouth: 'open',
      sym: null,
      symAlpha: 0,
      talking: false,
      visible: false,
      pop: 0,
      moodSince: 0,
      nextBlink: 1.6,
      blinkStart: -10,
      blinkSlow: 1,
      lastFrame: 0,
      seed: Math.random() * 100,
    };
    let revertTimer = 0;

    const applyMood = (name) => {
      const m = MOODS[name] || MOODS.neutral;
      state.mood = name in MOODS ? name : 'neutral';
      state.mouth = m.mouth || 'open';
      state.sym = m.sym || null;
      state.moodSince = performance.now() / 1000;
      state.pop = 1;
      tgt.headR = m.headR || 0;
      tgt.headY = m.headY || 0;
      tgt.bodyR = m.bodyR || 0;
      tgt.bodyX = m.bodyX || 0;
      tgt.lidL = m.lidL ?? m.lid ?? 0;
      tgt.lidR = m.lidR ?? m.lid ?? 0;
      tgt.gx = m.gx || 0;
      tgt.gy = m.gy || 0;
      tgt.browY = m.browY || 0;
      tgt.handR = m.handR || 0;
      tgt.handX = m.handX || 0;
      tgt.handY = m.handY || 0;
      tgt.blush = m.blush || 0;
      tgt.breath = m.breath || 1;
      tgt.bounceA = m.bounce ? m.bounce[0] : 0;
      tgt.bounceF = m.bounce ? m.bounce[1] : 0;
      tgt.shake = m.shake || 0;
      if (state.sym) {
        const s = SYMBOLS[state.sym];
        symbolEl.textContent = s.text;
        symbolEl.setAttribute('fill', s.color);
        symbolEl.setAttribute('stroke', 'rgba(5,6,13,0.9)');
        symbolEl.setAttribute('stroke-width', 10);
        symbolEl.setAttribute('font-size', s.size);
      }
    };

    const render = (now, dt) => {
      const t = now / 1000;
      const rate = 1 - Math.exp(-dt * 7);
      num.forEach((k) => { cur[k] += (tgt[k] - cur[k]) * rate; });
      state.pop = Math.max(0, state.pop - dt * 2.2);
      const sinceMood = t - state.moodSince;
      const calm = prefersReducedMotion ? 0 : 1;

      // Idle life: breathing, bounce, shake, drifting hair.
      const breathPeriod = 3.4 / Math.max(0.3, cur.breath);
      const br = calm * breathCurve(t + state.seed, breathPeriod);
      const bounce = cur.bounceA * Math.sin(t * cur.bounceF * Math.PI) * calm;
      const popY = Math.sin(state.pop * Math.PI) * -7 * calm;
      const shake = cur.shake * Math.sin(t * 38) * Math.exp(-sinceMood * (cur.shake > 0.8 ? 2.2 : 0.25)) * calm;
      const talkNod = state.talking ? 1.3 * Math.sin(t * 13) : 0;
      const headY = cur.headY - 1.5 * br + bounce + popY + talkNod;
      const headR = cur.headR + 0.35 * Math.sin(t * 0.7 + state.seed) * calm;
      const lag = 0.25 * Math.sin(t * 0.7 + state.seed - 0.9) * calm;
      const breeze = (ph, per) => Math.sin(t * 0.55 * per + ph) * calm;
      const sL = ((lag - headR) * 1.6 + 0.6 * breeze(0, 2)) * 0.9;
      const sR = ((lag - headR) * 1.4 + 0.8 * breeze(1.3, 3)) * 0.9;
      const sBR = ((lag - headR) * 2 + 1.2 * breeze(2.4, 2)) * 0.9;

      const sy = 1 + 0.0042 * br;
      const sx = 1 + 0.0016 * br;
      body.setAttribute('transform', `translate(${cur.bodyX + shake},0) rotate(${cur.bodyR},600,1312) translate(600,1312) scale(${sx},${sy}) translate(-600,-1312)`);
      hand.setAttribute('transform', `translate(${cur.handX},${cur.handY - 1.2 * br + bounce * 0.5}) rotate(${cur.handR + 0.25 * Math.sin(t * 1.1) * calm},900,860)`);
      head.setAttribute('transform', `translate(${shake * 0.6},${headY}) rotate(${headR},690,740)`);
      strandL.setAttribute('transform', `rotate(${sL},370,440)`);
      strandR.setAttribute('transform', `rotate(${sR},905,400)`);
      strandBR.setAttribute('transform', `rotate(${sBR},885,600)`);

      // Blink on a loose rhythm, unless the eyes are already mostly shut.
      if (t > state.nextBlink && !prefersReducedMotion) {
        state.blinkStart = t;
        state.blinkSlow = state.mood === 'sleepy' ? 2.4 : 1;
        state.nextBlink = t + 2.2 + Math.random() * 3.2;
      }
      const blink = blinkCurve((t - state.blinkStart) / state.blinkSlow);
      const lidFor = (steady, isWinkEye) => clamp(isWinkEye && steady >= 0.9 ? steady : Math.max(steady, blink), 0, 1);
      const lidL = lidFor(cur.lidL, tgt.lidL >= 0.9 && tgt.lidR < 0.5);
      const lidR = lidFor(cur.lidR, false);

      // Eyes follow the pointer a little.
      const gx = clamp(cur.gx + pointer.x * 4, -7, 7);
      const gy = clamp(cur.gy + pointer.y * 3, -5, 5);
      eyeL.irisUse.setAttribute('transform', `translate(${gx},${gy})`);
      eyeR.irisUse.setAttribute('transform', `translate(${gx * 0.8},${gy})`);

      [[eyeL, lidL], [eyeR, lidR]].forEach(([eye, lid]) => {
        if (lid < 0.02) {
          eye.lidGroup.setAttribute('display', 'none');
          return;
        }
        const dy = eye.def.depth * lid;
        eye.lidGroup.removeAttribute('display');
        eye.cover.setAttribute('height', 80 + dy + 12);
        eye.lash.setAttribute('transform', `translate(0,${dy})`);
      });

      browLUse.setAttribute('transform', `translate(0,${cur.browY})`);
      browRUse.setAttribute('transform', `translate(0,${cur.browY})`);

      blushL.setAttribute('opacity', clamp(cur.blush, 0, 1).toFixed(3));
      blushR.setAttribute('opacity', clamp(cur.blush, 0, 1).toFixed(3));

      // Mouth: while talking, flap between the mood's shape and an open mouth.
      let shown = state.mouth;
      if (state.talking) {
        const beat = Math.floor(t * 9 + Math.sin(t * 3.1) * 2) % 3;
        shown = beat === 0 ? 'talk' : beat === 1 ? 'small' : state.mouth === 'open' ? 'open' : state.mouth;
      }
      patch.setAttribute('display', shown === 'open' ? 'none' : 'inline');
      Object.entries(shapes).forEach(([name, el]) => el.setAttribute('display', name === shown ? 'inline' : 'none'));

      // Floating mood symbol pops in and bobs.
      const want = state.sym ? 1 : 0;
      state.symAlpha += (want - state.symAlpha) * (1 - Math.exp(-dt * 9));
      if (state.sym) {
        const s = SYMBOLS[state.sym];
        const bob = Math.sin(t * 2.4) * 8 * calm;
        const pop = 1 + Math.sin(Math.min(1, sinceMood * 2.2) * Math.PI) * 0.25;
        symbolEl.setAttribute('transform', `translate(${s.x},${s.y + bob + headY}) scale(${pop})`);
        symbolEl.setAttribute('x', 0);
        symbolEl.setAttribute('y', 0);
      }
      symbolEl.setAttribute('opacity', state.symAlpha.toFixed(3));
    };

    const api = {
      element: root,
      get mood() { return state.mood; },
      setMood(name, options2 = {}) {
        clearTimeout(revertTimer);
        applyMood(name);
        if (prefersReducedMotion) {
          num.forEach((k) => { cur[k] = tgt[k]; });
          state.symAlpha = state.sym ? 1 : 0;
          render(performance.now(), 0.016);
        }
        if (options2.revertAfter) revertTimer = setTimeout(() => api.setMood('neutral'), options2.revertAfter);
      },
      talk(on) {
        state.talking = Boolean(on);
        if (prefersReducedMotion) render(performance.now(), 0.016);
      },
      tick(now, dt) {
        if (!state.visible) return;
        if (frameMs && now - state.lastFrame < frameMs) return;
        state.lastFrame = now;
        render(now, dt);
      },
      setVisible(value) { state.visible = value; },
      destroy() {
        instances.delete(api);
        clearTimeout(revertTimer);
        root.remove();
        host.classList.remove('has-kai');
      },
    };

    // Only animate while on screen.
    if ('IntersectionObserver' in window) {
      new IntersectionObserver((entries) => {
        api.setVisible(entries[entries.length - 1].isIntersecting);
      }).observe(host);
    } else {
      state.visible = true;
    }

    applyMood('neutral');
    instances.add(api);
    start();
    if (prefersReducedMotion) render(performance.now(), 0.016);
    return api;
  };

  // ------------------------------------------------------------------ loop
  const frame = (now) => {
    const dt = Math.min(0.1, (now - last) / 1000 || 0.016);
    last = now;
    if (!document.hidden) instances.forEach((inst) => inst.tick(now, dt));
    rafId = requestAnimationFrame(frame);
  };

  function start() {
    if (rafId || prefersReducedMotion) return;
    last = performance.now();
    rafId = requestAnimationFrame(frame);
  }

  window.addEventListener('pointermove', (event) => {
    pointer.x = (event.clientX / window.innerWidth - 0.5) * 2;
    pointer.y = (event.clientY / window.innerHeight - 0.5) * 2;
  }, { passive: true });

  window.Character = { mount, moods: Object.keys(MOODS) };
})();
