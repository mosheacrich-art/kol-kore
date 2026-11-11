/* Embed mode for Parashapp: teacher word-range recorder + synced playback.
   Active only with ?embed=1 (teacher tools with &teacher=1). Talks to the parent via postMessage. */
(function () {
  'use strict';
  var q = new URLSearchParams(location.search);
  if (q.get('embed') !== '1') return;
  var teacher = q.get('teacher') === '1';
  var dark = q.get('theme') === 'dark';
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  document.documentElement.setAttribute('data-embed', '1');
  var GOLD = dark ? '#ffca28' : '#d4a017', NAVY = dark ? '#ffd54f' : '#7a5200', RED = '#dc2626';
  var PAPER = dark ? '#0d0b1e' : '#f5f0e4';

  var css = document.createElement('style');
  css.textContent =
    /* Parashapp palette: warm parchment (light) / night + gold (dark) */
    'html[data-embed][data-theme="light"]{--paper:#f5f0e4;--paper-2:#ede8da;--ink:#1a1200;--muted:rgba(26,18,0,.62);' +
    '--faint:rgba(26,18,0,.32);--rule:rgba(0,0,0,.1);--accent:#7a5200;--gold:#a07000;--bar:rgba(245,240,228,.9);' +
    '--shadow:0 18px 50px -18px rgba(60,40,0,.3);color-scheme:light}' +
    'html[data-embed][data-theme="dark"]{--paper:#07060f;--paper-2:#0d0b1e;--ink:rgba(240,239,255,.92);--muted:rgba(180,170,220,.6);' +
    '--faint:rgba(180,170,220,.3);--rule:rgba(255,255,255,.08);--accent:#ffca28;--gold:rgba(255,202,40,.75);--bar:rgba(7,6,15,.85);' +
    '--shadow:0 18px 50px -18px rgba(0,0,0,.8);color-scheme:dark}' +
    '.pw{border-radius:3px;transition:background .08s}' +
    '.pick .pw{cursor:pointer}.pick .pw:hover{background:rgba(200,148,31,.25)}' +
    '.pw.sel{background:rgba(200,148,31,.3)}' +
    '.pw.cur{background:rgba(200,148,31,.45);color:' + NAVY + '}' +
    '.pw.has{cursor:pointer}' +
    '.pl{display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;margin:0 6px;border-radius:50%;' +
    'background:' + NAVY + ';color:' + PAPER + ';font:12px/1 sans-serif;border:0;cursor:pointer;vertical-align:middle}' +
    '#rbar{position:fixed;left:50%;transform:translateX(-50%);bottom:16px;z-index:9999;background:' + PAPER + ';color:' + NAVY + ';' +
    'border:1px solid ' + GOLD + ';border-radius:16px;box-shadow:0 10px 30px rgba(0,0,0,.18);padding:10px 14px;font:14px Inter,system-ui,sans-serif;' +
    'display:flex;align-items:center;gap:12px;max-width:94vw}' +
    '#rbar button{font:600 13px Inter,system-ui,sans-serif;padding:8px 14px;border-radius:12px;cursor:pointer;border:1px solid ' + NAVY + ';background:' + PAPER + ';color:' + NAVY + '}' +
    '#rbar button.rec{background:' + RED + ';border-color:' + RED + ';color:#fff}' +
    '#rbar button.ghost{border:0;background:none;color:inherit;opacity:.6;text-decoration:underline}' +
    '#rfab{position:fixed;right:16px;bottom:16px;z-index:9998}';
  document.head.appendChild(css);

  var T = window.sidurT || function (s) { return s; };
  function post(m) { try { parent.postMessage(m, location.origin); } catch (e) {} }

  /* ── word wrapping per section (rubrics excluded) ── */
  function wrap(sec) {
    if (sec._words) return sec._words;
    var words = [];
    var walker = document.createTreeWalker(sec, NodeFilter.SHOW_TEXT, {
      acceptNode: function (n) {
        var p = n.parentElement;
        if (!p || !p.closest('p.t') || p.closest('.r')) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    var nodes = [], n;
    while ((n = walker.nextNode())) nodes.push(n);
    nodes.forEach(function (node) {
      var frag = document.createDocumentFragment();
      node.nodeValue.split(/(\s+)/).forEach(function (s) {
        if (!s) return;
        if (/^\s+$/.test(s)) { frag.appendChild(document.createTextNode(s)); return; }
        var sp = document.createElement('span');
        sp.className = 'pw'; sp.textContent = s; sp._i = words.length; sp._sec = sec;
        words.push(sp); frag.appendChild(sp);
      });
      node.parentNode.replaceChild(frag, node);
    });
    sec._words = words;
    return words;
  }
  function wrapAll() { Array.prototype.forEach.call(document.querySelectorAll('article.sec'), wrap); }

  /* ── playback of saved ranges ── */
  var ranges = [], audio = new Audio(), active = null, raf = 0, lastCur = null, picking = false;
  function clearCur() { if (lastCur) { lastCur.classList.remove('cur'); lastCur = null; } }
  function tick() {
    if (!active) return;
    var t = audio.currentTime, ts = active.ts, words = active.sec._words, hit = -1;
    for (var i = active.start; i <= active.end; i++) {
      if (ts[i] && t >= ts[i].start && t < ts[i].end) { hit = i; break; }
    }
    if (hit >= 0 && words[hit] !== lastCur) {
      clearCur(); lastCur = words[hit]; lastCur.classList.add('cur');
      lastCur.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
    raf = requestAnimationFrame(tick);
  }
  audio.onended = function () { cancelAnimationFrame(raf); clearCur(); };
  audio.onpause = function () { cancelAnimationFrame(raf); };
  function playFrom(r, wordIdx) {
    if (active && active !== r) audio.pause();
    active = r;
    if (audio.getAttribute('data-u') !== r.url) { audio.src = r.url; audio.setAttribute('data-u', r.url); }
    var st = wordIdx != null && r.ts[wordIdx] ? r.ts[wordIdx].start : 0;
    function go() { audio.currentTime = st; audio.play(); cancelAnimationFrame(raf); raf = requestAnimationFrame(tick); }
    if (audio.readyState >= 1) go(); else audio.onloadedmetadata = go;
  }
  function rangeAt(sec, i) {
    for (var k = 0; k < ranges.length; k++) {
      var r = ranges[k];
      if (r.sec === sec && i >= r.start && i <= r.end) return r;
    }
    return null;
  }
  function setRanges(list) {
    audio.pause(); clearCur();
    Array.prototype.forEach.call(document.querySelectorAll('.pl'), function (b) { b.remove(); });
    Array.prototype.forEach.call(document.querySelectorAll('.pw.has'), function (w) { w.classList.remove('has'); });
    ranges = [];
    (list || []).forEach(function (r) {
      var sec = document.getElementById(r.secId);
      if (!sec || !r.ts) return;
      var words = wrap(sec), first = -1, last = -1;
      r.ts.forEach(function (x, i) { if (x) { if (first < 0) first = i; last = i; } });
      if (first < 0 || !words[first]) return;
      var rg = { sec: sec, start: first, end: last, url: r.url, ts: r.ts };
      ranges.push(rg);
      for (var i = first; i <= last; i++) words[i].classList.add('has');
      var b = document.createElement('button');
      b.className = 'pl'; b.type = 'button'; b.textContent = '▶'; b.title = 'Escuchar';
      b.onclick = function (e) {
        e.stopPropagation();
        if (active === rg && !audio.paused) audio.pause(); else playFrom(rg, first);
      };
      words[first].parentNode.insertBefore(b, words[first]);
    });
  }
  document.addEventListener('click', function (e) {
    var w = e.target.closest && e.target.closest('.pw');
    if (!w || picking) return;
    var r = rangeAt(w._sec, w._i);
    if (r) playFrom(r, w._i);
  });

  /* ── teacher: pick range + record ── */
  var sel = null, bar = null, mr = null, chunks = [], t0 = 0, timer = 0, secs = 0, cancelled = false, fab = null;
  function mk(html) { var d = document.createElement('div'); d.id = 'rbar'; d.innerHTML = html; document.body.appendChild(d); return d; }
  function closeBar() { if (bar) { bar.remove(); bar = null; } }
  function clearSel() { Array.prototype.forEach.call(document.querySelectorAll('.pw.sel'), function (w) { w.classList.remove('sel'); }); }
  function fmt(s) { return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2); }
  function reset() {
    picking = false; sel = null; clearSel(); closeBar(); document.body.classList.remove('pick');
    clearInterval(timer); if (fab) fab.style.display = '';
  }
  function showSel() {
    clearSel();
    var ws = sel.sec._words;
    for (var i = sel.a; i <= sel.b; i++) ws[i].classList.add('sel');
  }
  function askEnd() {
    closeBar();
    bar = mk('<span>' + T('Ahora toca la <b>última</b> palabra') + '</span><button class="ghost" id="rc">' + T('Cancelar') + '</button>');
    bar.querySelector('#rc').onclick = reset;
  }
  function begin() {
    wrapAll(); picking = true; sel = null; document.body.classList.add('pick'); fab.style.display = 'none';
    closeBar();
    bar = mk('<span>' + T('Toca la <b>primera</b> palabra del tramo') + '</span><button class="ghost" id="rc">' + T('Cancelar') + '</button>');
    bar.querySelector('#rc').onclick = reset;
  }
  document.addEventListener('click', function (e) {
    if (!picking || mr) return;
    var w = e.target.closest && e.target.closest('.pw');
    if (!w) return;
    e.preventDefault(); e.stopPropagation();
    if (!sel || w._sec !== sel.sec || sel.stage === 'ready') {
      sel = { sec: w._sec, a: w._i, b: w._i, stage: 'end' }; showSel(); askEnd();
    } else {
      sel.b = Math.max(sel.a, w._i); sel.a = Math.min(sel.a, w._i); sel.stage = 'ready'; showSel(); readyBar();
    }
  }, true);
  function readyBar() {
    closeBar();
    bar = mk('<span>' + T('Palabras') + ' ' + (sel.a + 1) + '–' + (sel.b + 1) + '</span><button class="ghost" id="rc">' + T('Cancelar') + '</button><button class="rec" id="rr">● ' + T('Grabar') + '</button>');
    bar.querySelector('#rc').onclick = reset;
    bar.querySelector('#rr').onclick = startRec;
  }
  function stamps(s, dur) {
    var ws = s.sec._words, out = [], LEAD = 0.25, span = Math.max(0.1, dur - LEAD), tot = 0, wt = [], i;
    for (i = 0; i < ws.length; i++) out.push(null);
    for (i = s.a; i <= s.b; i++) { var l = (ws[i].textContent.match(/[א-ת]/g) || []).length + 1; wt.push(l); tot += l; }
    var t = LEAD;
    for (i = s.a; i <= s.b; i++) { var d = wt[i - s.a] / tot * span; out[i] = { start: +t.toFixed(3), end: +(t + d).toFixed(3) }; t += d; }
    return out;
  }
  function startRec() {
    navigator.mediaDevices.getUserMedia({ audio: true }).then(function (stream) {
      var types = ['audio/mp4', 'audio/webm;codecs=opus', 'audio/webm'];
      var mime = types.filter(function (t) { return window.MediaRecorder && MediaRecorder.isTypeSupported(t); })[0] || '';
      var rec = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
      mr = rec; chunks = []; cancelled = false;
      rec.ondataavailable = function (e) { if (e.data.size) chunks.push(e.data); };
      rec.onstop = function () {
        stream.getTracks().forEach(function (t) { t.stop(); });
        clearInterval(timer); mr = null;
        if (cancelled) { reset(); return; }
        var dur = (Date.now() - t0) / 1000, type = rec.mimeType || 'audio/webm';
        closeBar(); bar = mk('<span>' + T('Guardando…') + '</span>');
        var rw = [];
        for (var k = sel.a; k <= sel.b; k++) rw.push({ i: k, t: sel.sec._words[k].textContent });
        post({ type: 'sidur:save', secId: sel.sec.id, ts: stamps(sel, dur), rw: rw, size: sel.sec._words.length, blob: new Blob(chunks, { type: type }), mime: type });
      };
      t0 = Date.now(); secs = 0; rec.start();
      closeBar();
      bar = mk('<span id="rt" style="color:' + RED + ';font-variant-numeric:tabular-nums">● 0:00</span><button class="ghost" id="rc">' + T('Cancelar') + '</button><button class="rec" id="rs">■ ' + T('Parar y guardar') + '</button>');
      bar.querySelector('#rc').onclick = function () { cancelled = true; rec.stop(); };
      bar.querySelector('#rs').onclick = function () { rec.stop(); };
      timer = setInterval(function () { secs++; var el = document.getElementById('rt'); if (el) el.textContent = '● ' + fmt(secs); }, 1000);
    }).catch(function (err) {
      closeBar();
      bar = mk('<span style="color:' + RED + '">' + (err && err.name === 'NotAllowedError' ? T('Permiso de micrófono denegado') : T('No se pudo usar el micrófono')) + '</span><button class="ghost" id="rc">' + T('Cerrar') + '</button>');
      bar.querySelector('#rc').onclick = reset;
    });
  }

  if (teacher) {
    fab = document.createElement('div'); fab.id = 'rfab';
    var fb = document.createElement('button');
    fb.textContent = '🎙 ' + T('Grabar tramo');
    fb.style.cssText = 'font:600 13px Inter,system-ui,sans-serif;padding:10px 16px;border-radius:12px;cursor:pointer;border:1px solid ' + NAVY + ';background:' + NAVY + ';color:' + PAPER + ';box-shadow:0 8px 24px rgba(0,0,0,.2)';
    fb.onclick = begin;
    fab.appendChild(fb); document.body.appendChild(fab);
  }

  window.addEventListener('message', function (e) {
    if (e.origin !== location.origin) return;
    var m = e.data || {};
    if (m.type === 'sidur:ranges') setRanges(m.ranges);
    if (m.type === 'sidur:saved') reset();
    if (m.type === 'sidur:error') {
      closeBar();
      bar = mk('<span style="color:' + RED + '">' + (m.error || T('No se pudo guardar')) + '</span><button class="ghost" id="rc">' + T('Cerrar') + '</button>');
      bar.querySelector('#rc').onclick = reset;
    }
  });
  post({ type: 'sidur:ready' });
})();
