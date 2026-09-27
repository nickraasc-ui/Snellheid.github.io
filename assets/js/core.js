/* Snellheid Industries™ core platform. Moving fast, breaking things, circling back. */
(function () {
  'use strict';
  var root = document.documentElement;
  var store = {
    get: function (k, d) { try { var v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
    sget: function (k, d) { try { var v = sessionStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    sset: function (k, v) { try { sessionStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };

  /* ---------- i18n ---------- */
  function lang() { return root.getAttribute('data-lang') === 'nl' ? 'nl' : 'en'; }
  function t(o) { return typeof o === 'string' ? o : (o[lang()] || o.en); }
  function setLang(l) {
    root.setAttribute('data-lang', l);
    root.setAttribute('lang', l);
    store.set('snel-lang', l);
    document.querySelectorAll('[data-en-placeholder]').forEach(function (el) {
      el.placeholder = el.getAttribute('data-' + l + '-placeholder') || el.getAttribute('data-en-placeholder');
    });
    var tt = document.querySelector('title[data-en]');
    if (tt) document.title = tt.getAttribute('data-' + l);
    document.dispatchEvent(new CustomEvent('snel:lang', { detail: l }));
  }
  var pick = function (a) { return a[Math.floor(Math.random() * a.length)]; };

  /* ---------- layout ---------- */
  var NAV = [
    ['index.html', 'Home', 'Home'],
    ['products.html', 'Divisions', 'Divisies'],
    ['leadership.html', 'Leadership', 'Leiderschap'],
    ['investors.html', 'Investors', 'Investeerders'],
    ['careers.html', 'Careers', 'Vacatures'],
    ['breakroom.html', 'Break Room', 'Kantine']
  ];
  function bi(en, nl) { return '<span data-l="en">' + en + '</span><span data-l="nl">' + nl + '</span>'; }

  function renderHeader() {
    var host = document.getElementById('site-header');
    if (!host) return;
    var here = (location.pathname.split('/').pop() || 'index.html');
    var links = NAV.map(function (n) {
      return '<a href="' + n[0] + '"' + (n[0] === here ? ' aria-current="page"' : '') + '>' + bi(n[1], n[2]) + '</a>';
    }).join('');
    host.insertAdjacentHTML('beforebegin', '<div class="ticker" aria-hidden="true"><div class="ticker-track" id="ticker-track"></div></div>');
    host.innerHTML =
      '<header class="site-header"><div class="wrap">' +
      '<a class="logo" href="index.html" id="logo"><img src="assets/img/logo-mark.png" alt="" width="64" height="60">' +
      '<span class="logo-word">Snellheid<small>INDUSTRIES™</small></span></a>' +
      '<button class="nav-toggle" aria-expanded="false" aria-controls="site-nav" aria-label="Menu">☰</button>' +
      '<nav class="site-nav" id="site-nav">' + links +
      '<button class="lang-toggle" id="lang-toggle" aria-label="Switch language / Taal wisselen"><span class="en">EN</span><span class="nl">NL</span></button>' +
      '</nav></div></header>';
    var tog = host.querySelector('.nav-toggle'), nav = host.querySelector('.site-nav');
    tog.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      tog.setAttribute('aria-expanded', open);
    });
    host.querySelector('#lang-toggle').addEventListener('click', function () {
      setLang(lang() === 'en' ? 'nl' : 'en');
      toast(t({ en: '🇬🇧 Language synergised to English.', nl: '🇳🇱 Taal gesynergiseerd naar Nederlands.' }));
    });
    // logo: click 7 times to launch
    var clicks = 0, timer;
    host.querySelector('#logo').addEventListener('click', function (e) {
      clicks++;
      clearTimeout(timer);
      timer = setTimeout(function () { clicks = 0; }, 1500);
      if (clicks >= 3) e.preventDefault();
      if (clicks === 7) { clicks = 0; launchSnail(); shout(t({ en: 'LIFTOFF!', nl: 'LANCERING!' })); bump(6.9, { en: 'Founder hit the logo 7×', nl: 'Oprichter klikte 7× op het logo' }); }
    });
  }

  function renderFooter() {
    var host = document.getElementById('site-footer');
    if (!host) return;
    var year = new Date().getFullYear();
    var unlocked = store.get('snel-portal', false);
    host.innerHTML =
      '<footer class="site-footer"><div class="wrap">' +
      '<div class="cols">' +
      '<div><img src="assets/img/logo-mark.png" alt="Snellheid Industries" width="110" height="103"><p class="fine" style="margin-top:12px">' +
      bi('Moving fast. Circling back.<br>Since 2009-ish.', 'Snel bewegen. Erop terugkomen.<br>Sinds 2009-achtig.') + '</p></div>' +
      '<div><h4>' + bi('Company', 'Bedrijf') + '</h4><ul>' +
      NAV.slice(1).map(function (n) { return '<li><a href="' + n[0] + '">' + bi(n[1], n[2]) + '</a></li>'; }).join('') + '</ul></div>' +
      '<div><h4>' + bi('Resources', 'Middelen') + '</h4><ul>' +
      '<li><a href="index.html#generator">' + bi('Mission Statement Generator', 'Missie-generator') + '</a></li>' +
      '<li><a href="careers.html#review">' + bi('Performance Review', 'Functioneringsgesprek') + '</a></li>' +
      '<li><a href="breakroom.html#meeting">' + bi('Meeting Simulator', 'Vergadersimulator') + '</a></li>' +
      '<li><a href="breakroom.html#flappy">Flappy Snail</a></li></ul></div>' +
      '<div><h4>' + bi('Legal-ish', 'Juridisch-achtig') + '</h4><ul>' +
      '<li><a href="investors.html#risks">' + bi('Risk Factors', 'Risicofactoren') + '</a></li>' +
      '<li><a href="portal.html">' + (unlocked ? '🔓 ' : '🔒 ') + bi('Employee Portal', 'Medewerkersportaal') + '</a></li>' +
      '<li><a href="404.html">' + bi('Our Commitment to Uptime', 'Onze uptime-belofte') + '</a></li></ul></div>' +
      '</div>' +
      '<div class="legal">© 2009–' + year + ' Snellheid Industries™. ' +
      bi('Snellheid Industries is a fictional company. Any resemblance to your actual job is purely coincidental and deeply sad. Not financial advice. Fast Glasses may not make you fast. Snellcoin may not make you rich. We are a family, legally speaking we are not.',
         'Snellheid Industries is een fictief bedrijf. Elke gelijkenis met je echte baan berust op toeval en is diep triest. Geen financieel advies. Fast Glasses maken je mogelijk niet snel. Snellcoin maakt je mogelijk niet rijk. We zijn een familie, juridisch gezien niet.') +
      '</div></div></footer>';
  }

  /* ---------- toasts, confetti, flyers ---------- */
  var toastHost;
  function toast(html, ms) {
    if (!toastHost) { toastHost = document.createElement('div'); toastHost.className = 'toasts'; toastHost.setAttribute('role', 'status'); document.body.appendChild(toastHost); }
    var el = document.createElement('div');
    el.className = 'toast';
    el.innerHTML = html;
    toastHost.appendChild(el);
    while (toastHost.children.length > 3) toastHost.removeChild(toastHost.firstChild);
    setTimeout(function () { el.remove(); }, ms || 4200);
  }

  var reduced = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  function confetti(x, y) {
    if (reduced) return;
    var c = document.getElementById('confetti');
    if (!c) { c = document.createElement('canvas'); c.id = 'confetti'; document.body.appendChild(c); }
    var ctx = c.getContext('2d');
    c.width = innerWidth; c.height = innerHeight;
    x = x == null ? innerWidth / 2 : x; y = y == null ? innerHeight / 3 : y;
    var cols = ['#3db0ad', '#fab993', '#ff3d7f', '#ffe14d', '#ffffff'];
    var bits = [];
    for (var i = 0; i < 140; i++) {
      bits.push({ x: x, y: y, vx: (Math.random() - .5) * 14, vy: Math.random() * -14 - 2, r: Math.random() * 6 + 3, c: pick(cols), a: Math.random() * 6, s: Math.random() > .8 ? '$' : null });
    }
    var start = performance.now();
    (function frame(now) {
      ctx.clearRect(0, 0, c.width, c.height);
      bits.forEach(function (b) {
        b.vy += .35; b.x += b.vx; b.y += b.vy; b.a += .2;
        ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.a); ctx.fillStyle = b.c;
        if (b.s) { ctx.font = 'bold 18px monospace'; ctx.fillText('$', 0, 0); } else ctx.fillRect(-b.r, -b.r / 2, b.r * 2, b.r);
        ctx.restore();
      });
      if (now - start < 2600) requestAnimationFrame(frame); else ctx.clearRect(0, 0, c.width, c.height);
    })(start);
  }
  function launchSnail(n) {
    if (reduced) return;
    for (var i = 0; i < (n || 1); i++) (function (i) {
      setTimeout(function () {
        var f = document.createElement('div');
        f.className = 'flyer';
        f.style.top = (10 + Math.random() * 70) + 'vh';
        f.innerHTML = '<img src="assets/img/logo-mark.png" alt="">';
        document.body.appendChild(f);
        setTimeout(function () { f.remove(); }, 3100);
      }, i * 250);
    })(i);
  }
  function shout(text) {
    var s = document.createElement('div');
    s.className = 'shout';
    s.textContent = text;
    document.body.appendChild(s);
    setTimeout(function () { s.remove(); }, 1900);
  }

  /* ---------- the market ---------- */
  var price = store.sget('snel-price', 420.69);
  var TICKS = [
    ['SNEL', price, 'Snellheid Industries'],
    ['SNLC', 0.0042, 'Snellcoin'],
    ['SYNRG', 133.7, 'Synergy Holdings'],
    ['CRCLB', 88.8, 'Circle Back Corp'],
    ['FMLY', 69.0, 'We Are Family Ltd'],
    ['MEET', 250.0, 'Meetings-as-a-Service'],
    ['KPI', 99.9, 'KPI Futures'],
    ['PTO', 3.1, 'Paid Time Off'],
    ['VEST', 404.0, 'Fleece Vest ETF'],
    ['CHOPA', 1984.0, 'Get To The Choppa Aviation']
  ].map(function (r) { return { sym: r[0], p: r[1], ch: 0, name: r[2] }; });

  function fmt(n) { return n < 1 ? n.toFixed(4) : n.toFixed(2); }
  function renderTicker() {
    var el = document.getElementById('ticker-track');
    if (!el) return;
    var html = TICKS.map(function (k) {
      var up = k.ch >= 0;
      return '<span class="tick"><b>$' + k.sym + '</b>' + fmt(k.p) + ' <span class="' + (up ? 'up' : 'down') + '">' + (up ? '▲' : '▼') + ' ' + Math.abs(k.ch).toFixed(2) + '%</span></span>';
    }).join('');
    el.innerHTML = html + html; // doubled for seamless loop
  }
  function drift() {
    TICKS.forEach(function (k) {
      var bias = k.sym === 'PTO' ? -.6 : k.sym === 'SNLC' ? 0 : .08;
      var ch = (Math.random() - .5 + bias * .2) * (k.sym === 'SNLC' ? 30 : 2);
      if (k.sym === 'PTO') ch = -Math.abs(ch);
      if (k.sym === 'SNEL') return;
      k.p = Math.max(.0001, k.p * (1 + ch / 100)); k.ch = ch;
    });
    renderTicker();
  }
  function bump(pct, reason) {
    var k = TICKS[0];
    k.p = Math.max(.01, k.p * (1 + pct / 100));
    k.ch = pct;
    price = k.p;
    store.sset('snel-price', price);
    renderTicker();
    var up = pct >= 0;
    toast('<b>$SNEL</b> <span class="' + (up ? 'up' : 'down') + '">' + (up ? '▲ +' : '▼ ') + pct.toFixed(1) + '%</span> · ' + t(reason));
    document.dispatchEvent(new CustomEvent('snel:price', { detail: price }));
  }

  /* ---------- easter eggs ---------- */
  var KONAMI = ['arrowup', 'arrowup', 'arrowdown', 'arrowdown', 'arrowleft', 'arrowright', 'arrowleft', 'arrowright', 'b', 'a'];
  var kpos = 0, typed = '';
  var WORDS = {
    choppa: function () {
      flyEmoji('🚁');
      shout(t({ en: 'GET TO THE STAND-UP!', nl: 'NAAR DE STAND-UP!' }));
    },
    synergy: function () {
      root.classList.add('synergy');
      setTimeout(function () { root.classList.remove('synergy'); }, 1500);
      toast(t({ en: '🤝 All departments have been merged into one department. It is HR.', nl: '🤝 Alle afdelingen zijn samengevoegd tot één afdeling. Het is HR.' }));
      bump(4.2, { en: 'Synergies realised', nl: 'Synergieën gerealiseerd' });
    },
    family: function () {
      toast(t({ en: '❤️ We’re a family. Families don’t get raises.', nl: '❤️ We zijn een familie. Familie krijgt geen loonsverhoging.' }));
      setTimeout(function () { toast(t({ en: '📄 HR has scheduled a 15-min “quick chat” with you. Bring your badge.', nl: '📄 HR heeft een “kort gesprekje” van 15 min ingepland. Neem je pasje mee.' })); }, 2200);
    },
    familie: function () { WORDS.family(); },
    illbeback: function () { shout(t({ en: 'HE’LL BE BACK.', nl: 'HIJ KOMT TERUG.' })); },
    pivot: function () {
      document.body.style.transition = 'transform 1s'; document.body.style.transform = 'rotate(360deg)';
      setTimeout(function () { document.body.style.transform = ''; }, 1100);
      toast(t({ en: '🔄 Snellheid has pivoted. Again.', nl: '🔄 Snellheid is gepivot. Alweer.' }));
    }
  };
  function flyEmoji(e) {
    if (reduced) return;
    var f = document.createElement('div');
    f.className = 'flyer'; f.textContent = e; f.style.top = '20vh'; f.style.transform = 'scaleX(-1)';
    document.body.appendChild(f);
    setTimeout(function () { f.remove(); }, 3100);
  }
  function turbo() {
    root.classList.toggle('turbo');
    var on = root.classList.contains('turbo');
    store.set('snel-portal', true);
    if (on) {
      shout('TURBO SNELLHEID');
      launchSnail(6); confetti();
      toast(t({ en: '🔓 Employee Portal unlocked. You know where to find it.', nl: '🔓 Medewerkersportaal ontgrendeld. Je weet waar het is.' }), 6000);
      bump(19.84, { en: 'Konami synergy detected', nl: 'Konami-synergie gedetecteerd' });
      renderFooter();
    }
  }
  function onKey(e) {
    var tag = (e.target && e.target.tagName) || '';
    if (/INPUT|TEXTAREA|SELECT/.test(tag) || e.target.isContentEditable) return;
    var k = (e.key || '').toLowerCase();
    kpos = k === KONAMI[kpos] ? kpos + 1 : (k === KONAMI[0] ? 1 : 0);
    if (kpos === KONAMI.length) { kpos = 0; turbo(); }
    if (k.length === 1 && /[a-z]/.test(k)) {
      typed = (typed + k).slice(-12);
      Object.keys(WORDS).forEach(function (w) { if (typed.slice(-w.length) === w) { typed = ''; WORDS[w](); } });
    }
  }

  // idle detection: Teams sets you to Away
  var idleT;
  function resetIdle() {
    clearTimeout(idleT);
    idleT = setTimeout(function () {
      toast(t({ en: '🟡 Your status has been set to <b>Away</b>. Your manager has been notified.', nl: '🟡 Je status is ingesteld op <b>Afwezig</b>. Je manager is op de hoogte gebracht.' }), 6000);
    }, 90000);
  }

  // exit intent, once per session
  function exitIntent(e) {
    if (e.clientY > 5 || store.sget('snel-exit', false)) return;
    store.sset('snel-exit', true);
    toast(t({ en: '🥺 Leaving already? We’re a <b>family</b>. Families don’t leave. (Notice period: 14 months.)', nl: '🥺 Ga je al? We zijn een <b>familie</b>. Familie gaat niet weg. (Opzegtermijn: 14 maanden.)' }), 6000);
  }

  function console_() {
    try {
      console.log('%cSNELLHEID INDUSTRIES™', 'font:900 32px Impact,sans-serif;color:#3db0ad;text-shadow:3px 3px 0 #fab993');
      console.log('%cLooking at our source code? We like your hustle.\nWe are hiring. We are also not hiring. Both are true until Q4.\nTry: ↑ ↑ ↓ ↓ ← → ← → B A\n\n— Dirk, Chief Terminating Officer: "I’ll be back… with a PIP."', 'font:14px monospace;color:#fab993');
    } catch (e) {}
  }

  /* ---------- reveal on scroll ---------- */
  function counters() {
    var els = document.querySelectorAll('[data-count]');
    if (!('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        io.unobserve(en.target);
        var el = en.target, end = parseFloat(el.getAttribute('data-count')), dec = +(el.getAttribute('data-dec') || 0), suf = el.getAttribute('data-suffix') || '', pre = el.getAttribute('data-prefix') || '';
        var s = performance.now();
        (function f(n) {
          var p = Math.min(1, (n - s) / 1400), v = end * (1 - Math.pow(1 - p, 3));
          el.textContent = pre + v.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec }) + suf;
          if (p < 1) requestAnimationFrame(f);
        })(s);
      });
    }, { threshold: .4 });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ---------- boot ---------- */
  function boot() {
    renderHeader();
    renderFooter();
    setLang(lang());
    drift();
    setInterval(drift, 2500);
    document.addEventListener('keydown', onKey);
    ['mousemove', 'keydown', 'touchstart', 'scroll'].forEach(function (ev) { document.addEventListener(ev, resetIdle, { passive: true }); });
    resetIdle();
    document.addEventListener('mouseout', function (e) { if (!e.relatedTarget) exitIntent(e); });
    document.addEventListener('click', function (e) {
      var b = e.target.closest('[data-bump]');
      if (!b) return;
      bump(parseFloat(b.getAttribute('data-bump')), { en: b.getAttribute('data-reason-en') || 'Investor confidence', nl: b.getAttribute('data-reason-nl') || 'Beleggersvertrouwen' });
      if (b.hasAttribute('data-confetti')) confetti(e.clientX, e.clientY);
    });
    counters();
    console_();
  }

  window.Snel = { turbo: turbo, t: t, lang: lang, setLang: setLang, toast: toast, confetti: confetti, bump: bump, shout: shout, launchSnail: launchSnail, store: store, pick: pick, price: function () { return price; } };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
