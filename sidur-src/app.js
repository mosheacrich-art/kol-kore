(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var root = document.documentElement;
  var KEY = 'sidur-prefs', POS = 'sidur-pos';

  /* ───────── preferencias ───────── */
  var prefs = {};
  try { prefs = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) {}
  function save() { try { localStorage.setItem(KEY, JSON.stringify(prefs)); } catch (e) {} }
  var size = prefs.size || 22;

  function applySize() { root.style.setProperty('--fs', size + 'px'); prefs.size = size; save(); }
  $('#bigger').onclick = function () { size = Math.min(34, size + 2); applySize(); };
  $('#smaller').onclick = function () { size = Math.max(16, size - 2); applySize(); };

  function pressed(seg, attr, val) {
    $$('button', seg).forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute(attr) === String(val))); });
  }
  var themeSeg = $('#themeSeg');
  pressed(themeSeg, 'data-t', prefs.theme || 'auto');
  themeSeg.onclick = function (e) {
    var t = e.target.closest('button'); if (!t) return;
    prefs.theme = t.dataset.t; root.setAttribute('data-theme', prefs.theme); pressed(themeSeg, 'data-t', prefs.theme); save();
  };

  /* ───────── paneles ───────── */
  var drawer = $('#drawer'), sheet = $('#sheet'), scrim = $('#scrim');
  function openToc() { closeSheet(); drawer.classList.add('open'); drawer.setAttribute('aria-hidden', 'false'); scrim.className = 'scrim on'; $('#openToc').setAttribute('aria-expanded', 'true'); revealCurrent(); }
  function closeToc() { drawer.classList.remove('open'); drawer.setAttribute('aria-hidden', 'true'); if (!sheet.classList.contains('open')) scrim.className = 'scrim'; $('#openToc').setAttribute('aria-expanded', 'false'); }
  function openSheet() { closeToc(); sheet.classList.add('open'); sheet.setAttribute('aria-hidden', 'false'); scrim.className = 'scrim on clear'; $('#openSet').setAttribute('aria-expanded', 'true'); }
  function closeSheet() { sheet.classList.remove('open'); sheet.setAttribute('aria-hidden', 'true'); if (!drawer.classList.contains('open')) scrim.className = 'scrim'; $('#openSet').setAttribute('aria-expanded', 'false'); }
  $('#openToc').onclick = openToc; $('#closeToc').onclick = closeToc;
  $('#openSet').onclick = function () { sheet.classList.contains('open') ? closeSheet() : openSheet(); };
  scrim.onclick = function () { closeToc(); closeSheet(); };
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { closeToc(); closeSheet(); } });
  drawer.addEventListener('click', function (e) { if (e.target.closest('a')) closeToc(); });

  /* ───────── posición actual ───────── */
  var secs = $$('.sec'), parts = $$('.part');
  var where = $('#where'), bar = $('#bar'), topbar = $('#topbar');
  var current = null;

  function partOf(el) { return el.closest('.part'); }
  function setWhere() {
    var y = window.innerHeight * 0.35, hit = null;
    for (var i = 0; i < secs.length; i++) {
      var r = secs[i].getBoundingClientRect();
      if (r.top <= y) hit = secs[i]; else break;
    }
    var label = '';
    if (hit) {
      var p = partOf(hit);
      label = p.dataset.es + ' · ' + hit.dataset.es;
      if (p.dataset.es === hit.dataset.es) label = p.dataset.es;
    }
    where.textContent = label;
    if (hit !== current) {
      current = hit;
      $$('.toc-part li a.now').forEach(function (a) { a.classList.remove('now'); });
      if (hit) { var a = $('.toc-part a[href="#' + hit.id + '"]'); if (a) a.classList.add('now'); }
    }
  }
  function revealCurrent() {
    if (!current) return;
    var a = $('.toc-part a[href="#' + current.id + '"]');
    if (!a) return;
    var d = a.closest('details'); if (d) d.open = true;
    setTimeout(function () { a.scrollIntoView({ block: 'center' }); }, 60);
  }

  /* ───────── scroll: progreso, barra, guardado ───────── */
  var lastY = 0, ticking = false, saveT;
  function onScroll() {
    var y = window.scrollY, h = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.width = (h > 0 ? (y / h) * 100 : 0) + '%';
    var down = y > lastY + 6, up = y < lastY - 6;
    if (down && y > 160 && !drawer.classList.contains('open') && !sheet.classList.contains('open')) topbar.classList.add('hide');
    else if (up || y < 80) topbar.classList.remove('hide');
    topbar.classList.toggle('at-top', y < 40);
    lastY = y;
    setWhere();
    clearTimeout(saveT);
    saveT = setTimeout(savePos, 400);
    ticking = false;
  }
  window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  window.addEventListener('resize', setWhere);

  function savePos() {
    if (!current || window.scrollY < 600) return;
    var r = current.getBoundingClientRect();
    try { localStorage.setItem(POS, JSON.stringify({ id: current.id, off: Math.round(-r.top) })); } catch (e) {}
  }

  /* ───────── continuar donde quedaste ───────── */
  var saved = null;
  try { saved = JSON.parse(localStorage.getItem(POS) || 'null'); } catch (e) {}
  var target = saved && document.getElementById(saved.id);
  if (target) {
    var link = $('#resume');
    link.hidden = false;
    $('#resumeWhere').textContent = $('.sec-head h3', target).textContent;
    link.onclick = function (e) {
      e.preventDefault();
      var top = target.getBoundingClientRect().top + window.scrollY + (saved.off || 0);
      window.scrollTo({ top: top, behavior: 'smooth' });
    };
  }

  onScroll();
  requestAnimationFrame(function () { requestAnimationFrame(function () { root.classList.add('ready'); }); });
})();
