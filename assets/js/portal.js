/* Snellheid Employee Portal. Security level: a snail guarding a door.
   To change the codeword, replace CODE_HASH with hash('yournewword') (FNV-1a, see below). */
(function () {
  'use strict';
  var CODE_HASH = 3640714330; // "illbeback"
  function hash(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }

  function unlock(first) {
    Snel.store.set('snel-portal', true);
    document.getElementById('gate').hidden = true;
    document.getElementById('inside').hidden = false;
    if (first) { Snel.confetti(); Snel.shout(Snel.t({ en: 'WELCOME BACK', nl: 'WELKOM TERUG' })); Snel.bump(4.2, { en: 'Insider access granted', nl: 'Insider-toegang verleend' }); }
    fill();
  }
  function fill() {
    document.getElementById('lb-flappy').textContent = Snel.store.get('snel-flappy-best', 0);
    document.getElementById('lb-meeting').textContent = Snel.store.get('snel-meeting-best', 0);
    var eotm = document.getElementById('eotm');
    if (window.SnelLeaderboard) SnelLeaderboard.top('all').then(function (rows) {
      eotm.textContent = rows.length ? rows[0].name + ' · ' + rows[0].score : Snel.t({ en: 'Position vacant', nl: 'Vacature' });
    }, function () { eotm.textContent = Snel.t({ en: 'Brian (by default)', nl: 'Brian (standaard)' }); });
    var board = document.getElementById('soundboard');
    if (board.children.length) return;
    (window.DIRK || []).forEach(function (q) {
      var b = document.createElement('button');
      b.className = 'btn small';
      b.textContent = q;
      b.addEventListener('click', function () { speak(q); });
      board.appendChild(b);
    });
  }
  function speak(q) {
    Snel.shout(q.toUpperCase());
    try {
      var u = new SpeechSynthesisUtterance(q);
      u.lang = 'en-US'; u.pitch = .3; u.rate = .85;
      var vs = speechSynthesis.getVoices().filter(function (v) { return /^en/i.test(v.lang); });
      var deep = vs.filter(function (v) { return /male|daniel|fred|alex|george|david/i.test(v.name); })[0];
      if (deep || vs[0]) u.voice = deep || vs[0];
      speechSynthesis.cancel(); speechSynthesis.speak(u);
    } catch (e) {}
  }
  function boot() {
    var form = document.getElementById('gate-form');
    if (!form) return;
    if (Snel.store.get('snel-portal', false)) unlock(false);
    var tries = 0, HINTS = [
      { en: '❌ Access denied. Dirk has been notified.', nl: '❌ Toegang geweigerd. Dirk is op de hoogte gebracht.' },
      { en: '❌ Still no. Hint: what does Dirk always say when he leaves?', nl: '❌ Nog steeds niet. Hint: wat zegt Dirk altijd als hij weggaat?' },
      { en: '❌ One word. No spaces. No apostrophes. He’ll… ', nl: '❌ Eén woord. Geen spaties. Geen apostrof. He’ll… ' }
    ];
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var v = document.getElementById('codeword').value.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (hash(v) === CODE_HASH) return unlock(true);
      var door = document.querySelector('.vault-door');
      door.classList.remove('shake'); void door.offsetWidth; door.classList.add('shake');
      document.getElementById('gate-msg').textContent = Snel.t(HINTS[Math.min(tries++, HINTS.length - 1)]);
    });
    document.getElementById('turbo-btn').addEventListener('click', function () { Snel.turbo(); });
    document.getElementById('lock-btn').addEventListener('click', function () {
      Snel.store.set('snel-portal', false);
      location.reload();
    });
    // Konami unlocks from here too
    document.addEventListener('keydown', function () {
      setTimeout(function () { if (Snel.store.get('snel-portal', false) && document.getElementById('inside').hidden) unlock(false); }, 50);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
