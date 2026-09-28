/* Employee of the Month™ — the shared Flappy Snail leaderboard (Supabase). */
(function () {
  'use strict';
  var TABLE = '/rest/v1/flappy_scores';
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  // best score per name (case-insensitive), top 10
  function top(range) {
    var q = TABLE + '?select=name,score,created_at&order=score.desc,created_at.asc&limit=200';
    if (range === 'week') q += '&created_at=gte.' + new Date(Date.now() - 7 * 864e5).toISOString();
    return Snel.cloud(q).then(function (rows) {
      var seen = {}, out = [];
      (rows || []).forEach(function (r) { var k = r.name.trim().toLowerCase(); if (!seen[k]) { seen[k] = 1; out.push(r); } });
      return out.slice(0, 10);
    });
  }
  window.SnelLeaderboard = { top: top };

  function boot() {
    var list = document.getElementById('lb-list');
    if (!list) return;
    var status = document.getElementById('lb-status'), form = document.getElementById('lb-form'), nameIn = document.getElementById('lb-name'), msg = document.getElementById('lb-msg');
    var range = 'all', pending = 0, sent = false;
    var MEDALS = ['🥇', '🥈', '🥉'];

    function render() {
      status.textContent = Snel.t({ en: 'Loading the family rankings…', nl: 'Familieranglijst laden…' });
      top(range).then(function (rows) {
        if (!rows.length) {
          list.innerHTML = '';
          status.textContent = Snel.t({ en: 'No scores yet. The position of Employee of the Month is open.', nl: 'Nog geen scores. De positie van Medewerker van de Maand is vacant.' });
          return;
        }
        status.textContent = '';
        var mine = (Snel.store.get('snel-name', '') || '').toLowerCase();
        list.innerHTML = rows.map(function (r, i) {
          return '<li' + (r.name.trim().toLowerCase() === mine ? ' class="me"' : '') + '><span class="pos">' + (MEDALS[i] || (i + 1) + '.') + '</span><span class="who">' + esc(r.name) + '</span><b>' + r.score + '</b></li>';
        }).join('');
      }, function () {
        list.innerHTML = '';
        status.textContent = Snel.t({ en: 'The leaderboard is in a meeting. Try again later.', nl: 'Het klassement zit in een vergadering. Probeer het later opnieuw.' });
      });
    }

    document.querySelectorAll('[data-lb]').forEach(function (b) {
      b.addEventListener('click', function () {
        range = b.getAttribute('data-lb');
        document.querySelectorAll('[data-lb]').forEach(function (x) { x.setAttribute('aria-pressed', x === b); });
        render();
      });
    });

    nameIn.value = Snel.store.get('snel-name', '');
    document.addEventListener('snel:flappy-over', function (e) {
      pending = e.detail; sent = false;
      if (pending < 1) return;
      document.getElementById('lb-score').textContent = pending;
      msg.textContent = '';
      form.hidden = false;
    });
    document.addEventListener('snel:flappy-start', function () { form.hidden = true; });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = nameIn.value.trim().slice(0, 20);
      if (!name || sent || pending < 1) return;
      sent = true;
      Snel.store.set('snel-name', name);
      var btn = form.querySelector('button'); btn.disabled = true;
      Snel.cloud(TABLE, { method: 'POST', prefer: 'return=minimal', body: { name: name, score: Math.min(pending, 500) } }).then(function () {
        form.hidden = true; btn.disabled = false;
        msg.textContent = Snel.t({ en: '📈 Submitted. HR has been notified of your excellence.', nl: '📈 Ingediend. HR is op de hoogte van je uitmuntendheid.' });
        Snel.confetti();
        render();
      }, function () {
        sent = false; btn.disabled = false;
        msg.textContent = Snel.t({ en: '❌ Submission failed. Your score was circled back. Try again.', nl: '❌ Indienen mislukt. Er wordt op je score teruggekomen. Probeer opnieuw.' });
      });
    });
    document.addEventListener('snel:lang', render);
    render();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
