/* $SNEL chart. Past performance is the only performance. */
(function () {
  'use strict';
  var W = 900, H = 380, PAD = { l: 60, r: 20, t: 30, b: 40 };
  // seeded random so the chart is the same for everyone (consistency is a core value)
  function rng(seed) { return function () { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }; }
  var RANGES = {
    '1D':  { n: 60, start: 410, drift: .15, vol: 1.2, seed: 7, notes: [[22, { en: 'Dirk said “I’ll be back”', nl: 'Dirk zei “I’ll be back”' }], [48, { en: 'Brian found the admin password', nl: 'Brian vond het beheerderswachtwoord' }]] },
    '1Y':  { n: 80, start: 180, drift: 1.2, vol: 5, seed: 42, notes: [[18, { en: 'Pivot #11', nl: 'Pivot #11' }], [40, { en: 'Added “AI” to a slide', nl: '“AI” op een slide gezet' }], [66, { en: 'Layoffs (family reunion)', nl: 'Ontslagen (familiereünie)' }]] },
    'ALL': { n: 90, start: 1, drift: 8, vol: 6, seed: 1984, notes: [[10, { en: 'Uncle Todd’s $400', nl: 'De $400 van oom Todd' }], [45, { en: 'Fast Glasses™ launch', nl: 'Lancering Fast Glasses™' }], [80, { en: 'Adjusted for vibes', nl: 'Gecorrigeerd voor vibes' }]] }
  };
  function series(r) {
    var R = RANGES[r], rand = rng(R.seed), v = R.start, out = [];
    for (var i = 0; i < R.n; i++) {
      v = Math.max(.5, v + R.drift + (rand() - .45) * R.vol);
      if (r === 'ALL' && i > 70) v *= 1.12; // hockey stick, as promised in the deck
      out.push(v);
    }
    if (r !== 'ALL') { // land exactly on the live price
      var k = Snel.price() / out[out.length - 1];
      out = out.map(function (v) { return v * k; });
    }
    return out;
  }
  function render(el, r) {
    var d = series(r), max = Math.max.apply(null, d), min = Math.min.apply(null, d);
    if (r === 'ALL') max = d[75] * 1.3; // line leaves the chart. Upwards. Obviously.
    var x = function (i) { return PAD.l + i / (d.length - 1) * (W - PAD.l - PAD.r); };
    var y = function (v) { return PAD.t + (1 - (v - min) / (max - min || 1)) * (H - PAD.t - PAD.b); };
    var path = d.map(function (v, i) { return (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(v).toFixed(1); }).join(' ');
    var area = path + ' L' + x(d.length - 1) + ' ' + (H - PAD.b) + ' L' + x(0) + ' ' + (H - PAD.b) + ' Z';
    var grid = '';
    for (var g = 0; g <= 4; g++) {
      var gv = min + (max - min) * g / 4, gy = y(gv);
      grid += '<line x1="' + PAD.l + '" x2="' + (W - PAD.r) + '" y1="' + gy + '" y2="' + gy + '" stroke="#1b6664" stroke-dasharray="4 6"/>' +
        '<text x="' + (PAD.l - 8) + '" y="' + (gy + 4) + '" text-anchor="end" fill="#7fd8d4" font-family="Space Mono, monospace" font-size="12">€' + gv.toFixed(0) + '</text>';
    }
    var notes = RANGES[r].notes.map(function (n) {
      var nx = x(n[0]), ny = Math.max(PAD.t + 10, y(d[n[0]]));
      return '<circle cx="' + nx + '" cy="' + ny + '" r="7" fill="#ff3d7f" stroke="#0a1a1a" stroke-width="2"/>' +
        '<text x="' + Math.min(nx, W - 200) + '" y="' + (ny + 26) + '" fill="#fab993" font-family="Space Mono, monospace" font-size="13" font-weight="700">' + Snel.t(n[1]) + '</text>';
    }).join('');
    el.innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="$SNEL share price chart. It only goes up.">' +
      '<defs><linearGradient id="fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#3db0ad" stop-opacity=".55"/><stop offset="1" stop-color="#3db0ad" stop-opacity="0"/></linearGradient>' +
      '<clipPath id="plot"><rect x="' + PAD.l + '" y="0" width="' + (W - PAD.l - PAD.r) + '" height="' + (H - PAD.b) + '"/></clipPath></defs>' +
      grid +
      '<g clip-path="url(#plot)"><path d="' + area + '" fill="url(#fill)"/><path d="' + path + '" fill="none" stroke="#3db0ad" stroke-width="4" stroke-linejoin="round"/></g>' +
      notes +
      '<text x="' + (W - PAD.r) + '" y="' + (H - 12) + '" text-anchor="end" fill="#7fd8d4" font-family="Space Mono, monospace" font-size="12">' + Snel.t({ en: 'Source: Jeff (Finance). Unaudited. Unauditable.', nl: 'Bron: Jeff (Finance). Ongecontroleerd. Oncontroleerbaar.' }) + '</text>' +
      '</svg>';
  }
  function boot() {
    var el = document.getElementById('chart');
    if (!el) return;
    var cur = '1Y';
    var btns = document.querySelectorAll('[data-range]');
    btns.forEach(function (b) {
      b.addEventListener('click', function () {
        cur = b.getAttribute('data-range');
        btns.forEach(function (x) { x.setAttribute('aria-pressed', x === b); });
        render(el, cur);
      });
    });
    render(el, cur);
    document.addEventListener('snel:lang', function () { render(el, cur); });
    document.addEventListener('snel:price', function () { if (cur !== 'ALL') render(el, cur); });

    var px = document.getElementById('live-price');
    function upd() { if (px) px.textContent = '€' + Snel.price().toFixed(2); }
    upd(); document.addEventListener('snel:price', upd);

    // Snellcoin waitlist. Collects nothing. Stores nothing. Like the coin.
    var f = document.getElementById('waitlist');
    if (f) f.addEventListener('submit', function (e) {
      e.preventDefault();
      var pos = (4812003 + Math.floor(Math.random() * 9999)).toLocaleString(Snel.lang() === 'nl' ? 'nl-NL' : 'en-US');
      document.getElementById('waitlist-msg').innerHTML = Snel.t({
        en: '🎉 You’re <b>#' + pos + '</b> on the waitlist. The waitlist is being carried to our servers by a snail. We did not store your email. We don’t know how.',
        nl: '🎉 Je staat op plek <b>#' + pos + '</b> van de wachtlijst. De wachtlijst wordt door een slak naar onze servers gebracht. We hebben je e-mail niet opgeslagen. We weten niet hoe.'
      });
      f.reset();
      Snel.confetti();
      Snel.bump(8.8, { en: 'Snellcoin hype cycle initiated', nl: 'Snellcoin-hypecyclus gestart' });
    });
    document.querySelectorAll('[data-pdf]').forEach(function (b) {
      b.addEventListener('click', function () {
        Snel.toast(Snel.t({ en: '🖨️ The PDF is being printed, faxed and re-scanned by Brian. ETA: Q5.', nl: '🖨️ De pdf wordt door Brian geprint, gefaxt en opnieuw gescand. Verwacht: Q5.' }));
      });
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
