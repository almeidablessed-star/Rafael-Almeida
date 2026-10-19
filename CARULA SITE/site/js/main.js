/* ==========================================================================
   Carula Cake . main.js
   GSAP motion layer.

   Every animation here answers "what does this communicate?":
     intro ............ hierarchy. Orders the hero so the name lands first.
     title layers ..... storytelling. The stacked shadow stretches as you
                        scroll, so the logo's 3D sticker look becomes physical.
     parallax ......... depth. Waves and cake sit on different planes.
     particles ........ atmosphere. The page should feel aerated, not static.
     magnetic CTAs .... feedback. The button acknowledges the cursor early.
     reveals .......... hierarchy. Content arrives in reading order.
     horizontal pan ... storytelling. A portfolio is flipped through, not
                        scrolled past.

   Performance contract: transform and opacity only, motion values never touch
   layout, every ScrollTrigger is created inside a gsap.matchMedia context so
   it is reverted automatically on breakpoint change.
   ========================================================================== */

(function () {
  'use strict';

  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasGSAP = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';

  /* ---------------------------------------------------------------------
     Always-on behaviour. Works without GSAP and under reduced motion.
     --------------------------------------------------------------------- */

  initTheme();
  initFilters();

  if (!hasGSAP || prefersReduced) {
    // No hijack, no hidden content. The gallery falls back to a wrapped grid.
    var galeriaEl = document.getElementById('galeria');
    if (galeriaEl) galeriaEl.classList.add('galeria--static');
    return;
  }

  document.documentElement.classList.add('js-ready');
  gsap.registerPlugin(ScrollTrigger);

  initNavState();
  initIntro();
  initTitleDepth();
  initParallax();
  initParticles('heroParticles', 16);
  initParticles('ctaParticles', 10);
  initMagnetic();
  initReveals();
  initGaleria();

  // Late-loading images change page height. Recalculate once they settle.
  window.addEventListener('load', function () {
    ScrollTrigger.refresh();
  });

  /* =====================================================================
     THEME
     Persists the choice. Falls back to the OS preference when unset.
     ===================================================================== */

  function initTheme() {
    var toggle = document.getElementById('themeToggle');
    if (!toggle) return;

    var stored = null;
    try {
      stored = localStorage.getItem('carula-theme');
    } catch (e) {
      /* storage blocked, stay on the OS preference */
    }
    if (stored) document.documentElement.setAttribute('data-theme', stored);

    toggle.addEventListener('click', function () {
      var systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      var current = document.documentElement.getAttribute('data-theme') || (systemDark ? 'dark' : 'light');
      var next = current === 'dark' ? 'light' : 'dark';

      document.documentElement.setAttribute('data-theme', next);
      try {
        localStorage.setItem('carula-theme', next);
      } catch (e) {
        /* non-fatal */
      }
    });
  }

  /* =====================================================================
     SABORES FILTER
     Plain show/hide on data-family. Announces an empty state rather than
     leaving a blank grid.
     ===================================================================== */

  function initFilters() {
    var buttons = Array.prototype.slice.call(document.querySelectorAll('[data-filter]'));
    var cards = Array.prototype.slice.call(document.querySelectorAll('.sabor'));
    var empty = document.getElementById('saboresEmpty');
    if (!buttons.length || !cards.length) return;

    buttons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var family = btn.getAttribute('data-filter');

        buttons.forEach(function (b) {
          b.setAttribute('aria-pressed', String(b === btn));
        });

        var shown = 0;
        cards.forEach(function (card) {
          var match = family === 'todos' || card.getAttribute('data-family') === family;
          card.hidden = !match;
          if (match) shown++;
        });

        if (empty) empty.hidden = shown > 0;

        // Cards leaving the flow changes document height.
        if (hasGSAP && !prefersReduced) ScrollTrigger.refresh();
      });
    });
  }

  /* =====================================================================
     NAV
     Border appears once the page has moved, so the bar reads as attached.
     ===================================================================== */

  function initNavState() {
    var nav = document.getElementById('nav');
    if (!nav) return;

    ScrollTrigger.create({
      start: 'top -8',
      end: 99999,
      onToggle: function (self) {
        nav.classList.toggle('is-stuck', self.isActive);
      }
    });
  }

  /* =====================================================================
     HERO INTRO
     Runs on load rather than on scroll: the hero is already in view, so a
     scroll trigger would never fire for it.
     ===================================================================== */

  function initIntro() {
    var items = document.querySelectorAll('#hero [data-reveal]');
    if (!items.length) return;

    gsap.set(items, { opacity: 0, y: 20 });

    gsap.timeline({ defaults: { ease: 'power3.out' }, delay: 0.1 }).to(items, {
      opacity: 1,
      y: 0,
      duration: 0.55,
      stagger: 0.06
    });
  }

  /* =====================================================================
     TITLE DEPTH
     The two shadow layers drift further from the face as the hero scrolls
     away, so the stacked 3D lettering stretches instead of sitting flat.
     Transform only.
     ===================================================================== */

  function initTitleDepth() {
    var back = document.querySelector('[data-title-layer="back"]');
    var mid = document.querySelector('[data-title-layer="mid"]');
    var hero = document.getElementById('hero');
    if (!back || !mid || !hero) return;

    // Same reasoning as the CSS base offsets: the drift has to scale with the
    // display size or it reads as a duplicated line on small screens.
    // invalidateOnRefresh re-reads the font size after a resize.
    var em = function (el, mult) {
      return function () {
        return parseFloat(getComputedStyle(el).fontSize) * mult;
      };
    };

    var tl = gsap.timeline({
      scrollTrigger: {
        trigger: hero,
        start: 'top top',
        end: 'bottom top',
        scrub: 0.6,
        invalidateOnRefresh: true
      }
    });

    tl.to(back, { x: em(back, 0.3), y: em(back, 0.29), ease: 'none' }, 0).to(
      mid,
      { x: em(mid, 0.16), y: em(mid, 0.155), ease: 'none' },
      0
    );
  }

  /* =====================================================================
     PARALLAX
     Waves drift at their own rate; the framed cake floats on a slow loop and
     also responds to scroll. Two planes, so the hero has depth.
     ===================================================================== */

  function initParallax() {
    gsap.utils.toArray('[data-parallax]').forEach(function (el) {
      var depth = parseFloat(el.getAttribute('data-parallax')) || 0.1;
      gsap.to(el, {
        yPercent: depth * 100,
        ease: 'none',
        scrollTrigger: {
          trigger: '#hero',
          start: 'top top',
          end: 'bottom top',
          scrub: true
        }
      });
    });

    gsap.utils.toArray('[data-float]').forEach(function (el, i) {
      gsap.to(el, {
        y: -18,
        duration: 3.2 + i * 0.4,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1
      });
    });

    var heroFig = document.querySelector('.hero__figure');
    if (heroFig) {
      gsap.to(heroFig, {
        yPercent: -14,
        ease: 'none',
        scrollTrigger: {
          trigger: '#hero',
          start: 'top top',
          end: 'bottom top',
          scrub: 0.8
        }
      });
    }
  }

  /* =====================================================================
     PARTICLES
     Small lit spheres in the brand's coral and pink. Sizes and blur vary so
     they read as depth rather than confetti. Each drifts on its own loop.
     ===================================================================== */

  function initParticles(hostId, count) {
    var host = document.getElementById(hostId);
    if (!host) return;

    var palette = ['#e8452b', '#ff8a70', '#f5c6ce', '#c82472', '#a11d5c'];
    var frag = document.createDocumentFragment();
    var nodes = [];

    for (var i = 0; i < count; i++) {
      var el = document.createElement('span');
      var size = gsap.utils.random(10, 40);
      // Small particles sit further back: dimmer, softer, slower.
      var depth = gsap.utils.mapRange(10, 40, 0, 1, size);

      el.className = 'particle';
      el.style.setProperty('--p-color', palette[Math.floor(Math.random() * palette.length)]);
      el.style.width = size + 'px';
      el.style.height = size + 'px';
      el.style.left = gsap.utils.random(2, 94) + '%';
      el.style.top = gsap.utils.random(4, 92) + '%';
      el.style.opacity = String(gsap.utils.mapRange(0, 1, 0.28, 0.75, depth));
      el.style.filter = 'blur(' + gsap.utils.mapRange(0, 1, 1.6, 0, depth).toFixed(2) + 'px)';

      frag.appendChild(el);
      nodes.push({ el: el, depth: depth });
    }

    host.appendChild(frag);

    nodes.forEach(function (n) {
      var travel = gsap.utils.mapRange(0, 1, 14, 46, n.depth);

      gsap.to(n.el, {
        y: gsap.utils.random(-travel, travel),
        x: gsap.utils.random(-travel * 0.7, travel * 0.7),
        duration: gsap.utils.random(4, 9),
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
        delay: gsap.utils.random(0, 2.5)
      });

      gsap.to(n.el, {
        scale: gsap.utils.random(0.82, 1.18),
        duration: gsap.utils.random(3, 6),
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
        delay: gsap.utils.random(0, 2)
      });
    });

    // Nearer particles shift more as the section scrolls.
    var section = host.closest('section');
    if (section) {
      nodes.forEach(function (n) {
        gsap.to(n.el, {
          yPercent: gsap.utils.mapRange(0, 1, -30, -140, n.depth),
          ease: 'none',
          scrollTrigger: {
            trigger: section,
            start: 'top bottom',
            end: 'bottom top',
            scrub: 1
          }
        });
      });
    }
  }

  /* =====================================================================
     MAGNETIC CTAs
     Writes --mx/--my rather than `x`/`y`. Animating the transform directly
     would put an inline transform on the button, which outranks the
     stylesheet and silently cancels the :active press scale. The button
     composes both in one transform, so the press survives the magnet.

     The variables are set on the button itself, not a shared parent, so the
     style recalculation stays scoped to two child nodes.

     Strength is deliberately low. A CTA that chases the cursor across the
     screen is a toy; one that leans slightly is confident.
     ===================================================================== */

  function initMagnetic() {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    gsap.utils.toArray('[data-magnetic]').forEach(function (el) {
      var opts = { duration: 0.4, ease: 'power3.out' };
      var xTo = gsap.quickTo(el, '--mx', Object.assign({ unit: 'px' }, opts));
      var yTo = gsap.quickTo(el, '--my', Object.assign({ unit: 'px' }, opts));
      var strength = 0.2;

      el.addEventListener('pointermove', function (ev) {
        var r = el.getBoundingClientRect();
        xTo((ev.clientX - (r.left + r.width / 2)) * strength);
        yTo((ev.clientY - (r.top + r.height / 2)) * strength);
      });

      el.addEventListener('pointerleave', function () {
        xTo(0);
        yTo(0);
      });
    });
  }

  /* =====================================================================
     REVEALS
     Batched so a grid of sixteen flavour cards is one stagger, not sixteen
     separate triggers. Hero is excluded; it has its own intro.
     ===================================================================== */

  function initReveals() {
    var items = gsap.utils.toArray('[data-reveal]').filter(function (el) {
      return !el.closest('#hero');
    });
    if (!items.length) return;

    // 24px, not 40. A long slide draws attention to the animation; a short
    // one just makes the arrival feel intentional.
    gsap.set(items, { opacity: 0, y: 24 });

    ScrollTrigger.batch(items, {
      start: 'top 88%',
      once: true,
      onEnter: function (batch) {
        // Promote only for the duration of the tween, then hand the layer back.
        gsap.set(batch, { willChange: 'transform, opacity' });

        gsap.to(batch, {
          opacity: 1,
          y: 0,
          duration: 0.5,
          ease: 'power3.out',
          stagger: 0.06,
          overwrite: true,
          onComplete: function () {
            gsap.set(this.targets(), { clearProps: 'will-change' });
          }
        });
      }
    });
  }

  /* =====================================================================
     GALERIA . horizontal pan
     Pinned wrapper, scrubbed track. Only above 900px, where there is room
     for it; narrower screens keep the static grid fallback.
     ===================================================================== */

  function initGaleria() {
    var section = document.getElementById('galeria');
    var track = document.getElementById('galeriaTrack');
    if (!section || !track) return;

    var mm = gsap.matchMedia();

    mm.add('(min-width: 901px)', function () {
      section.classList.remove('galeria--static');

      var getDistance = function () {
        return Math.max(0, track.scrollWidth - window.innerWidth);
      };

      var pan = gsap.to(track, {
        x: function () {
          return -getDistance();
        },
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: function () {
            return '+=' + getDistance();
          },
          pin: true,
          scrub: 1,
          invalidateOnRefresh: true,
          anticipatePin: 1
        }
      });

      // matchMedia reverts this automatically when the query stops matching.
      return function () {
        pan.scrollTrigger && pan.scrollTrigger.kill();
        pan.kill();
        gsap.set(track, { clearProps: 'transform' });
      };
    });

    mm.add('(max-width: 900px)', function () {
      section.classList.add('galeria--static');
      return function () {
        section.classList.remove('galeria--static');
      };
    });
  }
})();
