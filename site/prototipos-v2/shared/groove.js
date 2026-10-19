/* Carula Cake · motor "groove 2026"
   Xadrez líquido com relevo, ondas em camadas, globo xadrez, parallax,
   letras com mola, botões magnéticos, tilt 3D e marquee que acelera com a rolagem.
   Depende de GSAP + ScrollTrigger (carregados antes deste arquivo). */
(() => {
  const G = (window.Groove = {});
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  G.reduce = reduce;
  G.fine = fine;
  if (window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

  const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const LIGHT = hex('#FFFFFF');
  const DARK = hex('#2B2420');
  const tone = (c, k) => {
    const t = k > 0 ? LIGHT : DARK, a = Math.min(Math.abs(k), 1);
    return `rgb(${Math.round(c[0] + (t[0] - c[0]) * a)},${Math.round(c[1] + (t[1] - c[1]) * a)},${Math.round(c[2] + (t[2] - c[2]) * a)})`;
  };

  /* Laço de desenho de um canvas: ajusta resolução, pausa fora da tela
     e quando a aba está oculta. Com movimento reduzido desenha um quadro só. */
  function loop(canvas, draw, still = false) {
    const frozen = reduce || still;
    const ctx = canvas.getContext('2d');
    let w = 0, h = 0, raf = 0, onScreen = true;
    const t0 = performance.now();
    const paint = now => draw(ctx, w, h, frozen ? 6 : (now - t0) / 1000);
    const resize = () => {
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      const dpr = Math.min(devicePixelRatio || 1, w > 1000 ? 1.5 : 2);
      canvas.width = Math.max(1, Math.round(w * dpr));
      canvas.height = Math.max(1, Math.round(h * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      paint(performance.now());
    };
    const frame = now => { raf = requestAnimationFrame(frame); paint(now); };
    const start = () => { if (!raf && !frozen && onScreen && !document.hidden) raf = requestAnimationFrame(frame); };
    const stop = () => { cancelAnimationFrame(raf); raf = 0; };
    new ResizeObserver(resize).observe(canvas);
    new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; onScreen ? start() : stop(); }).observe(canvas);
    document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
    resize();
    start();
  }

  /* Xadrez líquido: a grade desliza e uma lente de ondas deforma as casas.
     Cada casa recebe luz/sombra conforme a inclinação da onda (relevo). */
  G.checker = (canvas, opt = {}) => {
    const o = Object.assign({ a: '#E8452B', b: '#F5C6CE', cell: 64, amp: 16, k: 0.011, speed: 0.6,
      shade: 0.22, line: 0, lineColor: '#2B2420', drift: [10, 14], still: false }, opt);
    const A = hex(o.a), B = hex(o.b), n = 4;
    loop(canvas, (ctx, w, h, t) => {
      const c = o.cell, s = c / n, m = 2;
      const ox = (t * o.drift[0]) % (2 * c), oy = (t * o.drift[1]) % (2 * c);
      const cols = Math.ceil(w / c) + m * 2, rows = Math.ceil(h / c) + m * 2;
      const gw = cols * n + 1, gh = rows * n + 1;
      const X = new Float32Array(gw * gh), Y = new Float32Array(gw * gh);
      const k = o.k, wt = t * o.speed;
      const grad = (u, v) => {
        const p1 = k * u + wt, p2 = k * 0.8 * v - wt * 0.8, p3 = k * 0.6 * (0.6 * u - v) + wt * 1.3;
        return [
          Math.cos(p1) * Math.cos(p2) + 0.18 * Math.cos(p3),
          -0.8 * Math.sin(p1) * Math.sin(p2) - 0.3 * Math.cos(p3)
        ];
      };
      for (let j = 0; j < gh; j++) {
        for (let i = 0; i < gw; i++) {
          const u = i * s - m * c + ox, v = j * s - m * c + oy;
          const [gu, gv] = grad(u, v);
          X[j * gw + i] = u + o.amp * gu;
          Y[j * gw + i] = v + o.amp * gv;
        }
      }
      ctx.clearRect(0, 0, w, h);
      for (let cj = 0; cj < rows; cj++) {
        for (let ci = 0; ci < cols; ci++) {
          const base = (ci + cj) % 2 ? B : A;
          const [gu, gv] = grad((ci + 0.5) * c - m * c + ox, (cj + 0.5) * c - m * c + oy);
          ctx.fillStyle = tone(base, (-gu * 0.7 - gv * 0.7) * o.shade);
          ctx.beginPath();
          const i0 = ci * n, j0 = cj * n;
          ctx.moveTo(X[j0 * gw + i0], Y[j0 * gw + i0]);
          for (let q = 1; q <= n; q++) ctx.lineTo(X[j0 * gw + i0 + q], Y[j0 * gw + i0 + q]);
          for (let q = 1; q <= n; q++) ctx.lineTo(X[(j0 + q) * gw + i0 + n], Y[(j0 + q) * gw + i0 + n]);
          for (let q = n - 1; q >= 0; q--) ctx.lineTo(X[(j0 + n) * gw + i0 + q], Y[(j0 + n) * gw + i0 + q]);
          for (let q = n - 1; q >= 1; q--) ctx.lineTo(X[(j0 + q) * gw + i0], Y[(j0 + q) * gw + i0]);
          ctx.closePath();
          ctx.fill();
        }
      }
      if (o.line) {
        ctx.strokeStyle = o.lineColor;
        ctx.lineWidth = o.line;
        ctx.lineJoin = 'round';
        ctx.beginPath();
        for (let j = 0; j < gh; j += n) {
          ctx.moveTo(X[j * gw], Y[j * gw]);
          for (let i = 1; i < gw; i++) ctx.lineTo(X[j * gw + i], Y[j * gw + i]);
        }
        for (let i = 0; i < gw; i += n) {
          ctx.moveTo(X[i], Y[i]);
          for (let j = 1; j < gh; j++) ctx.lineTo(X[j * gw + i], Y[j * gw + i]);
        }
        ctx.stroke();
      }
    }, o.still);
  };

  /* Ondas empilhadas como tiras de papel: cada tira projeta uma sombra
     dura sobre a de baixo e tem contorno chocolate. Sobem devagar. */
  G.waves = (canvas, opt = {}) => {
    const o = Object.assign({ colors: ['#F5C6CE', '#F8F1E4', '#E8452B', '#D8CDEB'], band: 70, amp: 26,
      len: 520, speed: 0.5, rise: 9, line: 2.5, shadow: 9 }, opt);
    const N = o.colors.length;
    loop(canvas, (ctx, w, h, t) => {
      const off = t * o.rise, idx0 = Math.floor(off / o.band), frac = off % o.band;
      const count = Math.ceil(h / o.band) + 3;
      const curve = (i, x) => {
        const id = i + idx0, base = i * o.band - frac;
        return base + o.amp * Math.sin((x / o.len) * 6.283 + t * o.speed + id * 0.55)
          + o.amp * 0.4 * Math.sin((x / (o.len * 0.43)) * 6.283 - t * o.speed * 1.5 + id * 1.7);
      };
      const step = Math.max(6, w / 140);
      const above = (i, dy) => {
        ctx.beginPath();
        ctx.moveTo(-10, -10);
        for (let x = -10; x <= w + step; x += step) ctx.lineTo(x, curve(i, x) + dy);
        ctx.lineTo(w + step, -10);
        ctx.closePath();
      };
      const col = i => o.colors[(((i + idx0) % N) + N) % N];
      ctx.fillStyle = col(count);
      ctx.fillRect(0, 0, w, h);
      ctx.lineWidth = o.line;
      ctx.strokeStyle = '#2B2420';
      for (let i = count - 1; i >= -1; i--) {
        ctx.fillStyle = 'rgba(43,36,32,.10)';
        above(i, o.shadow * 2.2); ctx.fill();
        ctx.fillStyle = 'rgba(43,36,32,.16)';
        above(i, o.shadow); ctx.fill();
        ctx.fillStyle = col(i);
        above(i, 0); ctx.fill();
        ctx.beginPath();
        for (let x = -10; x <= w + step; x += step) x === -10 ? ctx.moveTo(x, curve(i, x)) : ctx.lineTo(x, curve(i, x));
        ctx.stroke();
      }
    });
  };

  /* Globo xadrez girando, com luz lambertiana e anéis de órbita.
     Os anéis têm metade de trás e metade da frente. Devolve a geometria
     para posicionar elementos em órbita. */
  G.sphere = (canvas, opt = {}) => {
    const o = Object.assign({ a: '#E8452B', b: '#F5C6CE', lat: 10, lon: 20, speed: 0.12, tilt: 0.38,
      light: [-0.55, 0.55, 0.63], ring: { rx: 1.55, ry: 0.32, color: '#F8F1E4' }, scale: 0.42 }, opt);
    const A = hex(o.a), B = hex(o.b), sub = 3;
    const geo = { cx: 0, cy: 0, R: 0 };
    const ringPath = (ctx, from, to) => {
      ctx.beginPath();
      ctx.ellipse(geo.cx, geo.cy, geo.R * o.ring.rx, geo.R * o.ring.ry, 0, from, to);
    };
    const drawRing = (ctx, from, to) => {
      if (!o.ring) return;
      ctx.lineCap = 'round';
      ctx.strokeStyle = '#2B2420'; ctx.lineWidth = 9; ringPath(ctx, from, to); ctx.stroke();
      ctx.strokeStyle = o.ring.color; ctx.lineWidth = 4; ringPath(ctx, from, to); ctx.stroke();
    };
    loop(canvas, (ctx, w, h, t) => {
      geo.R = Math.min(w, h) * o.scale;
      geo.cx = w / 2; geo.cy = h / 2;
      const { R, cx, cy } = geo;
      const rot = t * o.speed * 6.283, ct = Math.cos(o.tilt), st = Math.sin(o.tilt);
      const P = (th, ph) => {
        const x = Math.cos(th) * Math.sin(ph + rot), y = Math.sin(th), z = Math.cos(th) * Math.cos(ph + rot);
        return [x, y * ct - z * st, y * st + z * ct];
      };
      ctx.clearRect(0, 0, w, h);
      drawRing(ctx, Math.PI, Math.PI * 2);
      // sombra sólida deslocada do globo
      ctx.fillStyle = '#2B2420';
      ctx.beginPath(); ctx.arc(cx + R * 0.05, cy + R * 0.06, R + 2, 0, 6.283); ctx.fill();
      ctx.save();
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, 6.283); ctx.clip();
      ctx.fillStyle = tone(B, -0.5); ctx.fillRect(cx - R, cy - R, 2 * R, 2 * R);
      const cells = [];
      for (let j = 0; j < o.lat; j++) {
        const th0 = -Math.PI / 2 + (j / o.lat) * Math.PI, th1 = -Math.PI / 2 + ((j + 1) / o.lat) * Math.PI;
        for (let i = 0; i < o.lon; i++) {
          const ph0 = (i / o.lon) * 6.283, ph1 = ((i + 1) / o.lon) * 6.283;
          const c = P((th0 + th1) / 2, (ph0 + ph1) / 2);
          if (c[2] < -0.2) continue;
          const pts = [];
          for (let q = 0; q <= sub; q++) pts.push(P(th0, ph0 + ((ph1 - ph0) * q) / sub));
          for (let q = 1; q <= sub; q++) pts.push(P(th0 + ((th1 - th0) * q) / sub, ph1));
          for (let q = sub - 1; q >= 0; q--) pts.push(P(th1, ph0 + ((ph1 - ph0) * q) / sub));
          for (let q = sub - 1; q >= 1; q--) pts.push(P(th0 + ((th1 - th0) * q) / sub, ph0));
          const lam = c[0] * o.light[0] + c[1] * o.light[1] + c[2] * o.light[2];
          cells.push({ z: c[2], pts, col: tone((i + j) % 2 ? B : A, lam > 0.55 ? (lam - 0.55) * 0.9 : (lam - 0.55) * 0.75) });
        }
      }
      cells.sort((p, q) => p.z - q.z);
      for (const cell of cells) {
        ctx.fillStyle = cell.col;
        ctx.beginPath();
        cell.pts.forEach(([x, y], k) => (k ? ctx.lineTo(cx + x * R, cy - y * R) : ctx.moveTo(cx + x * R, cy - y * R)));
        ctx.closePath();
        ctx.fill();
      }
      // brilho retrô: duas pinceladas duras, sem degradê
      ctx.strokeStyle = 'rgba(248,241,228,.85)';
      ctx.lineCap = 'round';
      ctx.lineWidth = R * 0.07;
      ctx.beginPath(); ctx.arc(cx, cy, R * 0.78, Math.PI * 1.08, Math.PI * 1.32); ctx.stroke();
      ctx.lineWidth = R * 0.045;
      ctx.beginPath(); ctx.arc(cx, cy, R * 0.78, Math.PI * 1.38, Math.PI * 1.44); ctx.stroke();
      ctx.restore();
      ctx.strokeStyle = '#2B2420'; ctx.lineWidth = 3.5;
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, 6.283); ctx.stroke();
      drawRing(ctx, 0, Math.PI);
    });
    geo.ring = o.ring;
    return geo;
  };

  /* Elementos em órbita do globo: passam por trás e pela frente. */
  G.orbit = (geo, items, speed = 0.09) => {
    const els = items.map((el, i) => ({ el, a: (i / items.length) * Math.PI * 2 }));
    const place = time => {
      for (const it of els) {
        const a = it.a + time * speed * 6.283;
        const x = geo.cx + Math.cos(a) * geo.R * geo.ring.rx, y = geo.cy + Math.sin(a) * geo.R * geo.ring.ry;
        const depth = Math.sin(a);
        it.el.style.translate = `${x.toFixed(1)}px ${y.toFixed(1)}px`;
        it.el.style.scale = (0.72 + 0.28 * (depth + 1) / 2).toFixed(3);
        it.el.style.zIndex = depth > 0 ? 4 : 1;
      }
    };
    if (reduce) { requestAnimationFrame(() => place(1.2)); addEventListener('resize', () => place(1.2)); }
    else gsap.ticker.add(time => place(time));
  };

  /* Título: cada letra vira um elemento; entra com mola e fica ondulando. */
  G.title = (el, delay = 0.2) => {
    const letters = [];
    el.querySelectorAll('[data-split]').forEach(word => {
      const chars = [...word.textContent];
      word.textContent = '';
      word.setAttribute('aria-hidden', 'true');
      chars.forEach(ch => {
        const l = document.createElement('span');
        l.className = 'l';
        const i = document.createElement('i');
        i.textContent = ch;
        l.appendChild(i);
        word.appendChild(l);
        letters.push(l);
      });
    });
    if (reduce) return letters;
    gsap.timeline({ delay })
      .from(letters, {
        yPercent: 120, rotation: () => gsap.utils.random(-35, 35), scale: 0.3, opacity: 0,
        duration: 1.3, ease: 'elastic.out(1, 0.55)', stagger: 0.055
      })
      .add(() => {
        gsap.to(letters, {
          yPercent: -6, rotation: () => gsap.utils.random(-3, 3), duration: 1.6, ease: 'sine.inOut',
          stagger: { each: 0.11, repeat: -1, yoyo: true }
        });
      }, '-=0.4');
    return letters;
  };

  /* Entrada da capa: camadas surgem com mola, de trás para a frente. */
  G.pop = (selector, delay = 0) => {
    if (reduce) return;
    gsap.from(selector, {
      scale: 0.55, opacity: 0, y: 50, rotation: (i, el) => +(el.dataset.rot || gsap.utils.random(-12, 12)),
      duration: 1.2, ease: 'back.out(1.9)', stagger: 0.09, delay
    });
  };

  /* Parallax: data-depth reage ao cursor, data-speed reage à rolagem.
     Usa a propriedade CSS translate para não brigar com as animações do GSAP. */
  G.parallax = () => {
    if (reduce) return;
    const layers = [...document.querySelectorAll('[data-depth],[data-speed]')]
      .map(el => ({ el, d: +(el.dataset.depth || 0), s: +(el.dataset.speed || 0) }));
    let px = 0, py = 0, tx = 0, ty = 0;
    if (fine) addEventListener('pointermove', e => { tx = e.clientX / innerWidth - 0.5; ty = e.clientY / innerHeight - 0.5; });
    gsap.ticker.add(() => {
      px += (tx - px) * 0.07;
      py += (ty - py) * 0.07;
      const sy = Math.min(scrollY, innerHeight * 1.6);
      for (const l of layers) l.el.style.translate = `${(px * l.d * 40).toFixed(2)}px ${(py * l.d * 40 - sy * l.s).toFixed(2)}px`;
    });
  };

  /* Inclinação 3D seguindo o cursor. */
  G.tilt = (el, max = 10) => {
    if (!fine || reduce) return;
    gsap.set(el, { transformPerspective: 1000 });
    const rx = gsap.quickTo(el, 'rotationX', { duration: 0.7, ease: 'power3' });
    const ry = gsap.quickTo(el, 'rotationY', { duration: 0.7, ease: 'power3' });
    el.addEventListener('pointermove', e => {
      const r = el.getBoundingClientRect();
      ry(((e.clientX - r.left) / r.width - 0.5) * max * 2);
      rx(-((e.clientY - r.top) / r.height - 0.5) * max * 2);
    });
    el.addEventListener('pointerleave', () => { rx(0); ry(0); });
  };

  /* Botão magnético. */
  G.magnetic = el => {
    if (!fine || reduce) return;
    const label = el.querySelector('span');
    const x = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'elastic.out(1, 0.4)' });
    const y = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'elastic.out(1, 0.4)' });
    const lx = label && gsap.quickTo(label, 'x', { duration: 0.6, ease: 'elastic.out(1, 0.4)' });
    const ly = label && gsap.quickTo(label, 'y', { duration: 0.6, ease: 'elastic.out(1, 0.4)' });
    el.addEventListener('pointermove', e => {
      const r = el.getBoundingClientRect();
      const dx = e.clientX - r.left - r.width / 2, dy = e.clientY - r.top - r.height / 2;
      x(dx * 0.3); y(dy * 0.4);
      if (label) { lx(dx * 0.12); ly(dy * 0.15); }
    });
    el.addEventListener('pointerleave', () => { x(0); y(0); if (label) { lx(0); ly(0); } });
  };

  /* Faixa de texto rolando; acelera e inverte com a rolagem. */
  G.marquee = (el, base = 50) => {
    const track = el.querySelector('.track');
    track.innerHTML += track.innerHTML;
    if (reduce) return;
    let x = 0, boost = 0, half = track.scrollWidth / 2, dir = +(el.dataset.dir || -1);
    addEventListener('resize', () => { half = track.scrollWidth / 2; });
    let last = scrollY;
    gsap.ticker.add((time, dt) => {
      const v = scrollY - last;
      last = scrollY;
      boost += (Math.min(Math.abs(v), 80) * 6 - boost) * 0.12;
      x += dir * (base + boost) * (dt / 1000) * (v < 0 ? -1 : 1);
      if (half > 0) x = ((x % half) - half) % half;
      track.style.translate = `${x.toFixed(1)}px 0`;
    });
  };

  /* Divisor em onda que ondula sem parar. */
  G.waveDivider = svg => {
    const fill = svg.querySelector('.fill'), line = svg.querySelector('.line');
    const W = 1440, H = 120, N = 36;
    const shape = t => {
      let d = '';
      for (let i = 0; i <= N; i++) {
        const x = (i / N) * W;
        const y = H * 0.45 + 22 * Math.sin((x / W) * 6.283 * 1.4 + t * 1.1) + 9 * Math.sin((x / W) * 6.283 * 3.3 - t * 0.7);
        d += (i ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1);
      }
      line.setAttribute('d', d);
      fill.setAttribute('d', d + `L${W} ${H}L0 ${H}Z`);
    };
    shape(0);
    if (reduce) return;
    let on = true;
    new IntersectionObserver(([e]) => (on = e.isIntersecting)).observe(svg);
    gsap.ticker.add(time => on && shape(time));
  };

  /* Revelação ao rolar, com mola. */
  G.reveal = () => {
    if (reduce || !window.ScrollTrigger) return;
    gsap.utils.toArray('[data-reveal]').forEach(el => {
      gsap.from(el, {
        y: 70, rotation: +(el.dataset.rot || -3), scale: 0.88, opacity: 0, duration: 1.1, ease: 'back.out(1.7)',
        scrollTrigger: { trigger: el, start: 'top 90%' }
      });
    });
  };

  /* Menu hambúrguer com rolagem suave. */
  G.menu = () => {
    const burger = document.querySelector('.burger');
    const items = document.querySelectorAll('.menu li');
    const set = open => {
      document.body.classList.toggle('menu-open', open);
      burger.setAttribute('aria-expanded', open);
      burger.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
      if (open && !reduce) gsap.fromTo(items, { y: 60, rotation: -6, opacity: 0 },
        { y: 0, rotation: 0, opacity: 1, duration: 0.9, ease: 'back.out(2)', stagger: 0.06, delay: 0.15 });
    };
    burger.addEventListener('click', () => set(!document.body.classList.contains('menu-open')));
    addEventListener('keydown', e => { if (e.key === 'Escape') set(false); });
    document.querySelectorAll('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
      const target = document.querySelector(a.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      set(false);
      target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
    }));
  };

  /* Liga tudo o que é comum às três capas. */
  G.common = () => {
    G.menu();
    document.querySelectorAll('.magnetic').forEach(G.magnetic);
    document.querySelectorAll('.marquee').forEach(m => G.marquee(m, +(m.dataset.rate || 50)));
    document.querySelectorAll('.wave-divider').forEach(G.waveDivider);
    document.querySelectorAll('[data-tilt]').forEach(el => G.tilt(el, +(el.dataset.tilt || 10)));
    G.parallax();
    G.reveal();
  };
})();
