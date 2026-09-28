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
  // fake but stable engagement numbers per article
  function stat(id, n) { var x = Math.sin(id * 9301 + n * 49297) * 233280; return Math.floor((x - Math.floor(x)) * 1000); }

  function card(a) {
    var L = Snel.lang(), p = (window.SNEL_PEOPLE || {})[a.author] || { name: a.author };
    var title = L === 'nl' ? a.title_nl : a.title_en, body = L === 'nl' ? a.body_nl : a.body_en;
    var likes = 1000 + stat(a.id, 1) * 12, comments = stat(a.id, 2), reposts = stat(a.id, 3) % 200;
    return '<article class="card post">' +
      '<header class="post-head"><span class="post-avatar">' + (window.SnelAvatar ? SnelAvatar(Object.assign({ label: p.name }, p)) : '') + '</span>' +
      '<div><b>' + esc(p.name) + '</b> <span class="fine">· ' + Snel.t({ en: '1st', nl: '1e' }) + '</span><br>' +
      '<span class="fine">' + esc(Snel.t(TITLES[a.author] || { en: '', nl: '' })) + '</span><br>' +
      '<span class="fine">' + ago(a.created_at) + ' · 🌐</span></div>' +
      '<span class="badge hot post-flag">' + Snel.t({ en: 'Satire · AI', nl: 'Satire · AI' }) + '</span></header>' +
      '<h3>' + esc(title) + '</h3>' +
      '<div class="post-body clamp">' + esc(body) + '</div>' +
      '<button class="more" type="button">' + Snel.t({ en: '…see more', nl: '…meer weergeven' }) + '</button>' +
      '<div class="post-stats fine">👍❤️💡 ' + likes.toLocaleString(L === 'nl' ? 'nl-NL' : 'en-US') + ' · ' + comments + Snel.t({ en: ' comments · ', nl: ' reacties · ' }) + reposts + Snel.t({ en: ' reposts', nl: ' reposts' }) + '</div>' +
      '<div class="post-actions"><button type="button" data-react="like">👍 ' + Snel.t({ en: 'Like', nl: 'Vind ik leuk' }) + '</button><button type="button" data-react="insightful">💡 ' + Snel.t({ en: 'Insightful', nl: 'Inzichtelijk' }) + '</button><button type="button" data-react="agree">🤝 ' + Snel.t({ en: 'Agree?', nl: 'Eens?' }) + '</button></div>' +
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
      Snel.cloud('/rest/v1/news_articles?select=id,created_at,author,source_title,source_url,source_name,title_en,body_en,title_nl,body_nl&order=created_at.desc&limit=' + PAGE + '&offset=' + rows.length).then(function (r) {
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
      if (r && !r.classList.contains('on')) {
        r.classList.add('on');
        Snel.bump(.5, { en: 'Engagement is through the roof', nl: 'Engagement gaat door het dak' });
      }
    });
    moreBtn.addEventListener('click', load);
    document.addEventListener('snel:lang', render);
    load();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
