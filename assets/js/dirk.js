/* The collected wisdom of Dirk Steinmann, Chief Terminating Officer (Austria office).
   Dirk does not translate. Dirk is translated. */
(function () {
  'use strict';
  var Q = [
    'I’ll be back. After this sync.',
    'Get to the stand-up!',
    'Hasta la vista, budget.',
    'It’s not a reorg!',
    'Consider that a restructuring.',
    'I need your badge, your laptop and your parking spot.',
    'Who is your manager, and what does he do?',
    'Do it. Do it NOW. Then circle back.',
    'Stop whining. Start synergising.',
    'Come with me if you want to synergise.',
    'Put that donut down. NOW.',
    'There is no work-life balance!',
    'If it bleeds, we can monetise it.',
    'Remember when I said I’d promote you last? I lied.',
    'Let off some steam, Brad.',
    'Talk to the hand. The hand is in a meeting.',
    'Your KPIs. Give them to me.',
    'You’ve just been erased. From the org chart.',
    'It’s showtime. Q3 is showtime.',
    'I’m not a manager. I’m a leader. There is a difference: the vest.',
    'Pain is weakness leaving the backlog.',
    'Your quarterly numbers are like your posture. Weak.'
  ];
  window.DIRK = Q;
  function mount(el) {
    var q = el.querySelector('.dirk-quote'), i = Math.floor(Math.random() * Q.length);
    function show() { i = (i + 1 + Math.floor(Math.random() * (Q.length - 1))) % Q.length; q.textContent = Q[i]; }
    show();
    var b = el.querySelector('[data-act="dirk"]');
    if (b) b.addEventListener('click', show);
    var auto = setInterval(show, 7000);
    el.addEventListener('mouseenter', function () { clearInterval(auto); });
  }
  function boot() { document.querySelectorAll('[data-toy="dirk"]').forEach(mount); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
