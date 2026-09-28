/* Snellheid Newsroom™ — AI-generated thought leadership, loosely inspired by real headlines. */
(function () {
  'use strict';
  var PAGE = 10;
  var TITLES = {
    derek: { en: 'Chief Thought Leadership Officer', nl: 'Chief Thought Leadership Officer' },
    chad: { en: 'Founder & Chief Velocity Officer', nl: 'Oprichter & Chief Velocity Officer' },
    brad: { en: 'Chief Synergy Officer', nl: 'Chief Synergy Officer' },
    kyle: { en: 'VP of Circling Back', nl: 'VP Erop Terugkomen' },
    greg: { en: 'Chief Coin Officer', nl: 'Chief Coin Officer' },
    todd: { en: 'Chief Family Officer', nl: 'Chief Family Officer' }
  };
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function safeUrl(u) { return /^https?:\/\//i.test(u) ? u : '#'; }
  function ago(iso) {
    var m = Math.max(1, Math.round((Date.now() - new Date(iso)) / 60000)), nl = Snel.lang() === 'nl';
    if (m < 60) return m + (nl ? ' min' : 'm');
    var h = Math.round(m / 60); if (h < 24) return h + (nl ? ' u' : 'h');
    var d = Math.round(h / 24); return d + (nl ? ' d' : 'd');
  }
  // Reactions are shared counters in Supabase; this browser remembers which ones it gave (so it can undo them).
  var REACTS = [
    ['like', 'likes', '👍', { en: 'Like', nl: 'Vind ik leuk' }],
    ['insightful', 'insightful', '💡', { en: 'Insightful', nl: 'Inzichtelijk' }],
    ['agree', 'agree', '🤝', { en: 'Agree?', nl: 'Eens?' }]
  ];
  var mine = Snel.store.get('snel-reacts', {});
  function given(id, kind) { return !!(mine[id] && mine[id][kind]); }
  function reactHtml(a) {
    var L = Snel.lang(), n = function (x) { return (+x || 0).toLocaleString(L === 'nl' ? 'nl-NL' : 'en-US'); };
    var total = REACTS.reduce(function (t, r) { return t + (+a[r[1]] || 0); }, 0);
    var stats = total
      ? REACTS.filter(function (r) { return +a[r[1]]; }).map(function (r) { return r[2] + ' ' + n(a[r[1]]); }).join(' · ')
      : Snel.t({ en: 'No reactions yet. Be the first thought leader.', nl: 'Nog geen reacties. Wees de eerste thought leader.' });
    return '<div class="post-stats fine">' + stats + '</div>' +
      '<div class="post-actions">' + REACTS.map(function (r) {
        return '<button type="button" data-react="' + r[0] + '" aria-pressed="' + given(a.id, r[0]) + '"' + (given(a.id, r[0]) ? ' class="on"' : '') + '>' + r[2] + ' ' + Snel.t(r[3]) + '</button>';
      }).join('') + '</div>';
  }

  function card(a) {
    var L = Snel.lang(), p = (window.SNEL_PEOPLE || {})[a.author] || { name: a.author };
    var title = L === 'nl' ? a.title_nl : a.title_en, body = L === 'nl' ? a.body_nl : a.body_en;
    return '<article class="card post" data-id="' + (+a.id) + '">' +
      '<header class="post-head"><span class="post-avatar">' + (window.SnelAvatar ? SnelAvatar(Object.assign({ label: p.name }, p)) : '') + '</span>' +
      '<div><b>' + esc(p.name) + '</b> <span class="fine">· ' + Snel.t({ en: '1st', nl: '1e' }) + '</span><br>' +
      '<span class="fine">' + esc(Snel.t(TITLES[a.author] || { en: '', nl: '' })) + '</span><br>' +
      '<span class="fine">' + ago(a.created_at) + ' · 🌐</span></div>' +
      '<span class="badge hot post-flag">' + Snel.t({ en: 'Satire · AI', nl: 'Satire · AI' }) + '</span></header>' +
      '<h3>' + esc(title) + '</h3>' +
      '<div class="post-body clamp">' + esc(body) + '</div>' +
      '<button class="more" type="button">' + Snel.t({ en: '…see more', nl: '…meer weergeven' }) + '</button>' +
      '<div class="post-react">' + reactHtml(a) + '</div>' +
      '<p class="post-source fine">' + Snel.t({ en: 'Loosely inspired by a real headline', nl: 'Losjes geïnspireerd op een echte kop' }) + ' (' + esc(a.source_name || '') + '): <a href="' + esc(safeUrl(a.source_url)) + '" target="_blank" rel="noopener nofollow">' + esc(a.source_title) + '</a></p>' +
      '</article>';
  }

  function boot() {
    var feed = document.getElementById('feed');
    if (!feed) return;
    var status = document.getElementById('feed-status'), moreBtn = document.getElementById('feed-more');
    var rows = [], done = false;
    function render() {
      feed.innerHTML = rows.map(card).join('');
      feed.querySelectorAll('.post-body').forEach(function (b) {
        var btn = b.nextElementSibling;
        if (b.scrollHeight <= b.clientHeight + 4) btn.hidden = true;
      });
      moreBtn.hidden = done || !rows.length;
    }
    function load() {
      moreBtn.disabled = true;
      status.textContent = Snel.t({ en: 'Refreshing the thought leadership…', nl: 'Thought leadership wordt ververst…' });
      Snel.cloud('/rest/v1/news_articles?select=*&order=created_at.desc&limit=' + PAGE + '&offset=' + rows.length).then(function (r) {
        r = r || [];
        rows = rows.concat(r); done = r.length < PAGE;
        status.textContent = rows.length ? '' : Snel.t({ en: 'The newsroom is in a meeting. The first article drops within 4 hours.', nl: 'De redactie zit in een vergadering. Het eerste artikel verschijnt binnen 4 uur.' });
        moreBtn.disabled = false; render();
      }, function () {
        moreBtn.disabled = false;
        status.textContent = Snel.t({ en: 'The newsroom is offline. Derek is recharging his personal brand.', nl: 'De redactie is offline. Derek laadt zijn personal brand op.' });
      });
    }
    feed.addEventListener('click', function (e) {
      var m = e.target.closest('.more');
      if (m) { m.previousElementSibling.classList.remove('clamp'); m.hidden = true; return; }
      var r = e.target.closest('[data-react]');
      if (!r || r.disabled) return;
      var el = r.closest('.post'), id = +el.getAttribute('data-id'), kind = r.getAttribute('data-react');
      var row = rows.filter(function (x) { return x.id === id; })[0], col = REACTS.filter(function (x) { return x[0] === kind; })[0][1];
      var delta = given(id, kind) ? -1 : 1;
      function paint() { el.querySelector('.post-react').innerHTML = reactHtml(row); }
      // optimistic update, then take the database's numbers
      mine[id] = mine[id] || {}; mine[id][kind] = delta > 0; Snel.store.set('snel-reacts', mine);
      row[col] = Math.max(0, (+row[col] || 0) + delta); paint();
      if (delta > 0) Snel.bump(.5, { en: 'Engagement is through the roof', nl: 'Engagement gaat door het dak' });
      Snel.cloud('/rest/v1/rpc/react_article', { method: 'POST', body: { article_id: id, kind: kind, delta: delta } }).then(function (res) {
        var c = res && res[0];
        if (c) { row.likes = c.r_likes; row.insightful = c.r_insightful; row.agree = c.r_agree; paint(); }
      }, function () {
        mine[id][kind] = delta < 0; Snel.store.set('snel-reacts', mine);
        row[col] = Math.max(0, (+row[col] || 0) - delta); paint();
        Snel.toast(Snel.t({ en: '❌ Your reaction was circled back. Try again later.', nl: '❌ Er wordt op je reactie teruggekomen. Probeer het later opnieuw.' }));
      });
    });
    moreBtn.addEventListener('click', load);
    document.addEventListener('snel:lang', render);
    load();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
