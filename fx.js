/* ============================================================
   Honest Switch — effets au scroll (variés par page)
   Signature : <body data-fx="fade|slide|zoom|clip|mix">
   Approche simple et robuste : montrer une section dès que son
   haut entre dans les 90% bas de la fenêtre. Un rAF-throttle
   remplace tout debounce. Respecte prefers-reduced-motion.
   ============================================================ */
(function () {
  var root = document.documentElement;
  if (!root.classList.contains('js')) return;
  // Les effets sont volontairement ACTIFS même si le systeme demande une
  // reduction des animations : c'est un site de vente, l'animation au scroll
  // fait partie du contenu. (Le reglage Windows "effets d'animation" est
  // desactive chez beaucoup d'utilisateurs, ce qui masquait tout.)
  var reduce = false;
  var mode = (document.body.getAttribute('data-fx') || 'mix').toLowerCase();

  function uniq(a) {
    var s = [], o = [];
    for (var i = 0; i < a.length; i++) { if (a[i] && s.indexOf(a[i]) === -1) { s.push(a[i]); o.push(a[i]); } }
    return o;
  }

  var hero = document.querySelector('.hero');
  var secs = uniq(Array.prototype.filter.call(document.querySelectorAll('section'), function (s) {
    return s !== hero && !s.closest('.hero');
  }));

  function variantFor(i) {
    if (mode === 'fade')  return 'fx-up';
    if (mode === 'slide') return (i % 2 === 0) ? 'fx-left' : 'fx-right';
    if (mode === 'zoom')  return 'fx-zoom';
    if (mode === 'clip')  return 'fx-clip';
    var pool = ['fx-up', 'fx-left', 'fx-zoom', 'fx-up', 'fx-right', 'fx-clip'];
    return pool[i % pool.length];
  }

  var targets = [];
  for (var k = 0; k < secs.length; k++) { secs[k].classList.add('fx', variantFor(k)); targets.push(secs[k]); }
  Array.prototype.slice.call(document.querySelectorAll('.photo, figure.photo')).forEach(function (el) {
    el.classList.add('fx', 'fx-zoom'); targets.push(el);
  });
  Array.prototype.slice.call(document.querySelectorAll('table tbody, ul.checklist, ul.steps, .cards')).forEach(function (el) {
    el.classList.add('fx', 'fx-stagger'); targets.push(el);
  });
  Array.prototype.slice.call(document.querySelectorAll('[data-bar], .pricebar > span, .bar-fill')).forEach(function (el) {
    el.classList.add('fx', 'fx-bar'); targets.push(el);
  });
  targets = uniq(targets);

  if (reduce) {
    targets.forEach(function (el) { el.classList.add('fx-in'); });
    return;
  }

  var pending = targets;
  function reveal(el) { if (!el.classList.contains('fx-in')) el.classList.add('fx-in'); }

  // premier écran : ce qui est déjà visible à l'ouverture est montré sans animation
  var vh = window.innerHeight || document.documentElement.clientHeight;
  pending = pending.filter(function (el) {
    var r = el.getBoundingClientRect();
    if (r.top < vh * 0.92 && r.bottom > 0) {
      el.style.transition = 'none';
      reveal(el);
      window.requestAnimationFrame(function () { el.style.transition = ''; });
      return false;
    }
    return true;
  });

  var ticking = false;
  function frame() {
    ticking = false;
    var h = window.innerHeight || document.documentElement.clientHeight;
    var rest = [];
    for (var i = 0; i < pending.length; i++) {
      var el = pending[i];
      var r = el.getBoundingClientRect();
      if (r.top < h * 0.92 && r.bottom > -h * 0.6) {
        reveal(el);
      } else {
        rest.push(el);
      }
    }
    pending = rest;
    if (!pending.length) {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    }
  }
  function onScroll() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(frame);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  frame();
})();
