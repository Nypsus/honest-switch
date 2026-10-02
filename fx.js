/* ============================================================
   Honest Switch — effets au scroll (variés par page)
   Signature : <body data-fx="fade|slide|zoom|clip|mix">
   Moteur : IntersectionObserver (le navigateur declenche lui-meme,
   au lieu d'un listener 'scroll' qui peut etre manque) + filet de
   securite par position pour les sauts d'ancre.
   Les effets sont volontairement ACTIFS meme si le systeme demande
   une reduction des animations : c'est une page de vente.
   ============================================================ */
(function () {
  var root = document.documentElement;
  if (!root.classList.contains('js')) return;

  var mode = (document.body.getAttribute('data-fx') || 'mix').toLowerCase();

  function uniq(a) {
    var o = [];
    for (var i = 0; i < a.length; i++) { if (a[i] && o.indexOf(a[i]) === -1) o.push(a[i]); }
    return o;
  }

  function variantFor(i) {
    if (mode === 'fade')  return 'fx-up';
    if (mode === 'slide') return (i % 2 === 0) ? 'fx-left' : 'fx-right';
    if (mode === 'zoom')  return 'fx-zoom';
    if (mode === 'clip')  return 'fx-clip';
    var pool = ['fx-up', 'fx-left', 'fx-zoom', 'fx-up', 'fx-right', 'fx-clip'];
    return pool[i % pool.length];
  }

  var hero = document.querySelector('.hero');
  var secs = Array.prototype.filter.call(document.querySelectorAll('section'), function (s) {
    return s !== hero && !s.closest('.hero');
  });

  var targets = [];
  secs.forEach(function (s, i) { s.classList.add('fx', variantFor(i)); targets.push(s); });
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

  function reveal(el) {
    if (!el || el.classList.contains('fx-in')) return;
    el.classList.add('fx-in');
    // mise en conformite directe : meme si la feuille de style est en cache
    el.style.opacity = '1';
    el.style.transform = 'none';
    el.style.clipPath = 'none';
    el.style.webkitClipPath = 'none';
    var kids = el.querySelectorAll(':scope > ul > li, :scope > ol > li, :scope > .card, :scope > * > li');
    if (kids.length > 1) {
      Array.prototype.forEach.call(kids, function (k, j) {
        k.style.transition = 'opacity .5s ease ' + (j * 65) + 'ms, transform .5s ease ' + (j * 65) + 'ms';
        k.style.opacity = '1';
        k.style.transform = 'none';
      });
    }
  }

  // Premier ecran : montre sans animation ce qui est deja visible a l'ouverture.
  var vh = window.innerHeight || document.documentElement.clientHeight;
  var pending = [];
  targets.forEach(function (el) {
    var r = el.getBoundingClientRect();
    if (r.top < vh * 0.9 && r.bottom > 0) {
      el.style.transition = 'none';
      reveal(el);
      window.requestAnimationFrame(function () { el.style.transition = ''; });
    } else {
      pending.push(el);
    }
  });

  if (!('IntersectionObserver' in window)) {
    var tick0 = function () {
      var h = window.innerHeight || document.documentElement.clientHeight;
      pending = pending.filter(function (el) {
        var r = el.getBoundingClientRect();
        if (r.top < h * 0.92 && r.bottom > -h * 0.5) { reveal(el); return false; }
        return true;
      });
    };
    window.addEventListener('scroll', tick0, { passive: true });
    window.addEventListener('resize', tick0, { passive: true });
    tick0();
    return;
  }

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) { reveal(en.target); io.unobserve(en.target); }
    });
  }, { rootMargin: '0px 0px -6% 0px', threshold: 0.01 });

  pending.forEach(function (el) { io.observe(el); });

  // Filet de securite : element deja passe au-dessus (saut d'ancre, retour arriere).
  var guard = function () {
    if (!pending.length) return;
    var h = window.innerHeight || document.documentElement.clientHeight;
    pending = pending.filter(function (el) {
      var r = el.getBoundingClientRect();
      if (r.top < h * 0.95 && r.bottom > -h) { reveal(el); io.unobserve(el); return false; }
      return true;
    });
    if (!pending.length) {
      window.removeEventListener('scroll', guard);
      window.removeEventListener('resize', guard);
    }
  };
  window.addEventListener('scroll', guard, { passive: true });
  window.addEventListener('resize', guard, { passive: true });
  window.addEventListener('load', guard);
  guard();
})();
