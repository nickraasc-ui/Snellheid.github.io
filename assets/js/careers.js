/* Snellheid Talent Acquisition Funnel™. The funnel has no bottom. */
(function () {
  'use strict';
  function boot() {
    var modal = document.getElementById('apply-modal');
    if (!modal) return;
    var form = modal.querySelector('form'), btn = document.getElementById('apply-submit'), msg = document.getElementById('apply-msg'), jobT = document.getElementById('apply-job');
    var runs = 0, tries = 0;
    var NOPE = [
      { en: '❌ Please attach 12 more years of experience.', nl: '❌ Voeg nog 12 jaar werkervaring toe.' },
      { en: '❌ Your application lacks synergy. Please add synergy.', nl: '❌ Je sollicitatie mist synergie. Voeg synergie toe.' },
      { en: '❌ Dirk has reviewed your application. Dirk says: “Do it again. Do it NOW.”', nl: '❌ Dirk heeft je sollicitatie bekeken. Dirk zegt: “Do it again. Do it NOW.”' }
    ];
    function open(title) {
      runs = 0; tries = 0; msg.textContent = ''; btn.style.transform = ''; form.hidden = false;
      jobT.textContent = title;
      modal.classList.add('open');
      modal.querySelector('input').focus();
    }
    function close() { modal.classList.remove('open'); }
    document.querySelectorAll('[data-apply]').forEach(function (b) {
      b.addEventListener('click', function () { open(b.getAttribute('data-apply')); });
    });
    modal.querySelector('.close').addEventListener('click', close);
    modal.addEventListener('click', function (e) { if (e.target === modal) close(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
    // the submit button is shy (mouse users only; keyboard and touch users get the bureaucracy instead)
    btn.addEventListener('mouseenter', function (e) {
      if (runs >= 5 || e.pointerType === 'touch') return;
      runs++;
      var dx = (Math.random() > .5 ? 1 : -1) * (80 + Math.random() * 90), dy = (Math.random() - .5) * 120;
      btn.style.transform = 'translate(' + dx + 'px,' + dy + 'px) rotate(' + (dx / 10) + 'deg)';
      if (runs === 5) { btn.style.transform = ''; msg.textContent = Snel.t({ en: 'Fine. The button has accepted its fate.', nl: 'Goed dan. De knop heeft zich bij zijn lot neergelegd.' }); }
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (tries < NOPE.length) { msg.textContent = Snel.t(NOPE[tries++]); return; }
      form.hidden = true;
      msg.innerHTML = Snel.t({ en: '🎉 <b>Application received!</b> It has been immediately circled back to. Expect to hear from us in Q5. Welcome to the family (pending).', nl: '🎉 <b>Sollicitatie ontvangen!</b> We komen er direct op terug. Je hoort van ons in Q5. Welkom in de familie (onder voorbehoud).' });
      Snel.confetti();
      Snel.bump(1.2, { en: 'Talent pipeline growing', nl: 'Talentpijplijn groeit' });
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
