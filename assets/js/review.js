/* Snellheid Performance Review Engine™ — objective, data-driven, rigged. */
(function () {
  'use strict';
  function hash(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function rng(seed) { return function () { seed = (seed + 0x6D2B79F5) | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

  var CAT = {
    en: ['Synergy', 'Velocity', 'Circling back', 'Family values', 'Meeting attendance', 'Thought leadership', 'Fleece vest compliance', 'Use of “per my last email”'],
    nl: ['Synergie', 'Snelheid', 'Erop terugkomen', 'Familiewaarden', 'Vergaderaanwezigheid', 'Thought leadership', 'Bodywarmer-naleving', 'Gebruik van “zoals in mijn vorige mail”']
  };
  var RATE = {
    en: ['Exceeds expectations', 'Meets expectations', 'Vibes', 'Snail 🐌', 'Rocket 🚀', 'Needs more synergy', 'Dirk has concerns', 'N/A (was on mute)', 'Legendary', 'We’ll circle back'],
    nl: ['Overtreft verwachtingen', 'Voldoet aan verwachtingen', 'Vibes', 'Slak 🐌', 'Raket 🚀', 'Meer synergie nodig', 'Dirk heeft zorgen', 'N.v.t. (stond op mute)', 'Legendarisch', 'We komen erop terug']
  };
  var COMMENTS = {
    en: ['{n} consistently shows up. Sometimes on time.', '{n} has great energy on calls when the camera is on (once, March).', '{n}’s year was like a snail with a rocket: technically moving.', '{n} replied-all only 14 times this year. A personal best.', '{n} said “let’s take this offline” with real conviction.', '{n} is a true family member: underpaid and emotionally involved.', 'Dirk says {n} “will be back”. We are not sure if that is good.', '{n} single-handedly synergised the coffee machine.', '{n} set a clear north star, then walked the other way at pace.', 'Brian says {n} is “fine”. Brian is the most senior person here.'],
    nl: ['{n} komt consequent opdagen. Soms op tijd.', '{n} heeft geweldige energie in calls als de camera aanstaat (één keer, maart).', 'Het jaar van {n} was als een slak met een raket: technisch gezien in beweging.', '{n} deed dit jaar maar 14 keer allen beantwoorden. Persoonlijk record.', '{n} zei “laten we dit offline oppakken” met echte overtuiging.', '{n} is een echt familielid: onderbetaald en emotioneel betrokken.', 'Volgens Dirk komt {n} “terug”. We weten niet of dat goed is.', '{n} heeft in z’n eentje de koffieautomaat gesynergiseerd.', '{n} zette een heldere stip op de horizon en liep daarna snel de andere kant op.', 'Brian zegt dat {n} “prima” is. Brian is hier het meest senior.']
  };
  var OUTCOME = {
    en: ['Raise: 0%, plus a pizza party 🍕', 'Promotion to Senior {r} (same salary, bigger title)', 'Placed on a PIP (Pizza Improvement Plan)', 'Transferred to Brian’s team', 'Awarded one (1) Fast Glasses™, pre-owned by Scott', 'Raise: 3%, paid in Snellcoin (not launched)', 'Promoted to VP. Everyone is VP now.'],
    nl: ['Loonsverhoging: 0%, plus een pizzafeestje 🍕', 'Promotie tot Senior {r} (zelfde salaris, grotere titel)', 'Op een PIP gezet (Pizza Improvement Plan)', 'Overgeplaatst naar het team van Brian', 'Beloond met één (1) Fast Glasses™, tweedehands van Scott', 'Loonsverhoging: 3%, uitbetaald in Snellcoin (niet gelanceerd)', 'Gepromoveerd tot VP. Iedereen is nu VP.']
  };
  var STAMP = ['APPROVED', 'SYNERGISED', 'CIRCLE BACK', 'FAMILY', 'I’LL BE BACK'];

  var last = null;
  function make(name, role, l) {
    var r = rng(hash(name.toLowerCase().trim() + '|' + role.toLowerCase().trim()));
    var p = function (a) { return a[Math.floor(r() * a.length)]; };
    var rows = CAT[l].map(function (c) { return [c, p(RATE[l])]; });
    var comments = [], pool = COMMENTS[l].slice();
    for (var i = 0; i < 3; i++) comments.push(pool.splice(Math.floor(r() * pool.length), 1)[0].replace(/\{n\}/g, name));
    return {
      name: name, role: role, rows: rows, comments: comments,
      outcome: p(OUTCOME[l]).replace('{r}', role),
      score: (r() * 4 + 1).toFixed(1), stamp: p(STAMP),
      dirk: p(window.DIRK || ['I’ll be back.'])
    };
  }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  function render(out, v) {
    var L = Snel.lang(), T = function (e, n) { return L === 'nl' ? n : e; };
    out.innerHTML =
      '<div class="review-doc">' +
      '<span class="stamp">' + esc(v.stamp) + '</span>' +
      '<p class="mono" style="font-size:.75rem;margin:0">SNELLHEID INDUSTRIES™ · HR · ' + T('CONFIDENTIAL', 'VERTROUWELIJK') + '</p>' +
      '<h3>' + T('Annual Performance Review', 'Jaarlijks functioneringsgesprek') + ' ' + new Date().getFullYear() + '</h3>' +
      '<p><b>' + esc(v.name) + '</b> · ' + esc(v.role) + '</p>' +
      '<table>' + v.rows.map(function (r) { return '<tr><td>' + esc(r[0]) + '</td><td>' + esc(r[1]) + '</td></tr>'; }).join('') +
      '<tr><td><b>' + T('Overall score', 'Totaalscore') + '</b></td><td>' + v.score + ' / 🐌🐌🐌🐌🐌</td></tr></table>' +
      '<p><b>' + T('Manager comments', 'Opmerkingen manager') + ':</b></p><ul>' + v.comments.map(function (c) { return '<li>' + esc(c) + '</li>'; }).join('') + '</ul>' +
      '<p><b>' + T('Outcome', 'Uitkomst') + ':</b> ' + esc(v.outcome) + '</p>' +
      '<p><b>' + T('Final word from Dirk', 'Laatste woord van Dirk') + ':</b> “' + esc(v.dirk) + '”</p>' +
      '</div>';
  }

  function certificate(v) {
    var c = document.createElement('canvas'), W = 1200, H = 850;
    c.width = W; c.height = H;
    var x = c.getContext('2d'), L = Snel.lang(), T = function (e, n) { return L === 'nl' ? n : e; };
    x.fillStyle = '#fff6ef'; x.fillRect(0, 0, W, H);
    x.strokeStyle = '#3db0ad'; x.lineWidth = 24; x.strokeRect(24, 24, W - 48, H - 48);
    x.strokeStyle = '#0a1a1a'; x.lineWidth = 4; x.strokeRect(52, 52, W - 104, H - 104);
    x.strokeStyle = '#fab993'; x.lineWidth = 2; x.strokeRect(64, 64, W - 128, H - 128);
    x.textAlign = 'center'; x.fillStyle = '#0a1a1a';
    x.font = '700 22px "Space Mono", monospace';
    x.fillText('SNELLHEID INDUSTRIES™', W / 2, 140);
    x.fillStyle = '#3db0ad'; x.font = '84px "Squada One", Impact, sans-serif';
    x.fillText(T('Certificate of', 'Certificaat van'), W / 2, 230);
    x.fillText(T('Adequate Performance', 'Voldoende Functioneren'), W / 2, 310);
    x.fillStyle = '#0a1a1a'; x.font = '26px Montserrat, sans-serif';
    x.fillText(T('This certifies that', 'Hierbij wordt verklaard dat'), W / 2, 380);
    x.font = '72px "Squada One", Impact, sans-serif'; x.fillStyle = '#ff3d7f';
    x.fillText(v.name.slice(0, 32), W / 2, 460);
    x.fillStyle = '#0a1a1a'; x.font = '26px Montserrat, sans-serif';
    x.fillText(T('has performed as ', 'heeft gefunctioneerd als ') + v.role.slice(0, 40) + T(' with a score of ', ' met een score van ') + v.score + ' / 5 🐌', W / 2, 510);
    x.font = 'italic 24px Georgia, serif';
    x.fillText('“' + v.dirk + '”', W / 2, 570);
    x.font = '700 22px Montserrat, sans-serif';
    x.fillText(v.outcome.slice(0, 70), W / 2, 615);
    // signatures
    x.font = 'italic 34px Georgia, serif'; x.fillStyle = '#124746';
    x.fillText('Chad B.', 300, 715); x.fillText('Dirk S.', 900, 715);
    x.strokeStyle = '#0a1a1a'; x.lineWidth = 2;
    x.beginPath(); x.moveTo(170, 730); x.lineTo(430, 730); x.moveTo(770, 730); x.lineTo(1030, 730); x.stroke();
    x.fillStyle = '#0a1a1a'; x.font = '700 16px "Space Mono", monospace';
    x.fillText('CHAD BROCKWELL · CVO', 300, 758); x.fillText('DIRK STEINMANN · CTO', 900, 758);
    // stamp
    x.save(); x.translate(W - 230, 200); x.rotate(.25);
    x.strokeStyle = '#ff5c5c'; x.fillStyle = '#ff5c5c'; x.lineWidth = 6;
    x.strokeRect(-130, -40, 260, 80); x.font = '44px "Squada One", Impact, sans-serif'; x.fillText(v.stamp, 0, 16);
    x.restore();
    var img = new Image();
    img.onload = function () {
      x.drawImage(img, 90, 90, 150, 150 * img.height / img.width);
      var a = document.createElement('a');
      a.download = 'snellheid-review-' + v.name.replace(/[^a-z0-9]+/gi, '-').toLowerCase() + '.png';
      a.href = c.toDataURL('image/png');
      document.body.appendChild(a); a.click(); a.remove();
    };
    img.src = 'assets/img/logo-mark.png';
  }

  function boot() {
    var form = document.getElementById('review-form');
    if (!form) return;
    var out = document.getElementById('review-out'), dl = document.getElementById('review-dl');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = document.getElementById('rv-name').value.trim() || 'Anonymous Family Member', role = document.getElementById('rv-role').value.trim() || 'Associate';
      last = make(name, role, Snel.lang());
      render(out, last);
      dl.hidden = false;
      Snel.bump(-(Math.random() * 2 + .5), { en: 'Performance reviews leaked to the press', nl: 'Functioneringsgesprekken uitgelekt naar de pers' });
    });
    dl.addEventListener('click', function () {
      if (!last) return;
      (document.fonts ? document.fonts.ready : Promise.resolve()).then(function () { certificate(last); });
    });
    document.addEventListener('snel:lang', function () {
      if (last) { last = make(last.name, last.role, Snel.lang()); render(out, last); }
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
