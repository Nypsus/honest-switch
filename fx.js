/* ============================================================
   Honest Switch — moteur d'effets au scroll (variés par page)
   Chaque page déclare sa signature via <body data-fx="fade|slide|zoom|clip|mix">
   - évite le "toujours pareil" : la variante change selon la page
   - respecte prefers-reduced-motion
   - ne casse rien si JS absent (html.js absent => rien n'est masqué)
   ============================================================ */
(function () {
  var root = document.documentElement;
  if (!root.classList.contains('js')) return;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var body = document.body;
  var mode = (body.getAttribute('data-fx') || 'fade').toLowerCase();

  // ---- 1. choisir les cibles et la variante selon le mode ----
  var secs = Array.prototype.slice.call(document.querySelectorAll('main > section, article > section, section'));
  // dédoublonner (une section ne doit être traitée qu'une fois) + exclure le hero (visible d'emblée)
  var seen = [];
  var hero = document.querySelector('.hero');
  secs.forEach(function (s) {
    if (seen.indexOf(s) === -1 && s !== hero && !s.closest('.hero')) seen.push(s);
  });

  function variantFor(i) {
    // la variante alterne pour éviter la monotonie, en respectant le mode de la page
    if (mode === 'fade')  return 'fx-up';
    if (mode === 'slide') return (i % 2 === 0) ? 'fx-left' : 'fx-right';
    if (mode === 'zoom')  return 'fx-zoom';
    if (mode === 'clip')  return 'fx-clip';
    // mix : alterne montée / latéral / zoom / rideau
    var pool = ['fx-up', 'fx-left', 'fx-zoom', 'fx-up', 'fx-right', 'fx-clip'];
    return pool[i % pool.length];
  }

  var targets = [];
  seen.forEach(function (s, i) {
    var v = variantFor(i);
    s.classList.add('fx', v);
    targets.push(s);
  });

  // ---- 2. images : toujours en zoom doux ----
  Array.prototype.slice.call(document.querySelectorAll('.photo, figure.photo, img.zoomable')).forEach(function (el) {
    if (targets.indexOf(el) === -1) { el.classList.add('fx', 'fx-zoom'); targets.push(el); }
  });

  // ---- 3. listes / tableaux : apparition en cascade ----
  Array.prototype.slice.call(document.querySelectorAll('table tbody, ul.checklist, ul.steps, .cards')).forEach(function (el) {
    if (targets.indexOf(el) === -1) { el.classList.add('fx', 'fx-stagger'); targets.push(el); }
  });

  // ---- 4. barres de prix (comparatifs) ----
  var bars = Array.prototype.slice.call(document.querySelectorAll('[data-bar], .pricebar > span, .bar-fill'));
  bars.forEach(function (el) { if (targets.indexOf(el) === -1) { el.classList.add('fx', 'fx-bar'); targets.push(el); } });

  function show(el) { if (el && !el.classList.contains('fx-in')) el.classList.add('fx-in'); }

  if (reduce) { targets.forEach(show); return; }

  function firstScreen(el) {
    var r = el.getBoundingClientRect();
    return r.top < window.innerHeight * 0.82;   // dans le premier écran : montré tout de suite
  }
  targets.forEach(function (el) { el.classList.remove('fx-in'); });
  var firsts = targets.filter(firstScreen);
  firsts.forEach(function (el) { el.style.transition = 'none'; show(el); });

  function inView(el) {
    var r = el.getBoundingClientRect();
    // strictement dans la fenêtre visible : seule une petite bande d'entrée déclenche
    return r.top < window.innerHeight * 0.85 && r.top > -r.height * 0.35;
  }
  function scan() { targets.forEach(function (el) { if (!el.classList.contains('fx-in') && inView(el)) show(el); }); }

  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { show(e.target); io.unobserve(e.target); }
      });
    }, { root: null, rootMargin: '-12% 0px -8% 0px', threshold: 0 });
    targets.forEach(function (el) { if (firsts.indexOf(el) === -1) io.observe(el); });
  }
  var t = null;
  function onScroll() { if (t) return; t = setTimeout(function () { t = null; scan(); }, 90); }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);

  // rendre la transition aux éléments du premier écran après le premier rendu
  window.requestAnimationFrame(function () {
    window.requestAnimationFrame(function () {
      firsts.forEach(function (el) { el.style.transition = ''; });
    });
  });
})();
