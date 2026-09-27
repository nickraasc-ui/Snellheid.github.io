/* Snellheid Meeting Simulator™ — this could have been an email. */
(function () {
  'use strict';
  var pick = function (a) { return a[Math.floor(Math.random() * a.length)]; };
  var shuffle = function (a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; };

  var WORDS = ['synergy', 'circle back', 'bandwidth', 'deep dive', 'low-hanging fruit', 'alignment', 'touch base', 'KPIs', 'north star', 'pivot', 'ecosystem', 'deliverables', 'stakeholders', 'quick win', 'learnings', 'roadmap', 'AI', 'disruption', 'scalability', 'value add', 'best practice', 'mindset', 'helicopter view', 'OKRs'];
  var PEOPLE = [
    { id: 'chad', n: 'Chad', i: 'CB' }, { id: 'brad', n: 'Brad', i: 'BH' }, { id: 'kyle', n: 'Kyle', i: 'KB' },
    { id: 'todd', n: 'Todd', i: 'TK' }, { id: 'dirk', n: 'Dirk', i: 'DS' }, { id: 'derek', n: 'Derek', i: 'DL' }
  ];
  var LINES = {
    en: ['Just to add some {w} here…', 'I think {w} is really key for Q3.', 'Can we get some {w} before the next sync?', 'Let’s not boil the ocean. Let’s focus on {w}.', 'From a {w} perspective, I’m aligned.', 'Quick one on {w}: love it.', 'Sorry, I was on mute. As I was saying: {w}.', 'Let’s put {w} in the parking lot.', 'Building on that: {w}, but at scale.', 'Can everyone see my screen? It’s a slide that just says “{w}”.', 'My kid asked me about {w} this morning, actually.', 'Hard stop in 5, but {w}.'],
    nl: ['Even ter aanvulling, qua {w}…', 'Ik denk dat {w} echt key is voor Q3.', 'Kunnen we voor de volgende sync wat {w} regelen?', 'Laten we niet de oceaan koken. Focus op {w}.', 'Vanuit {w}-perspectief ben ik aligned.', 'Kort dingetje over {w}: love it.', 'Sorry, ik stond op mute. Zoals ik zei: {w}.', 'Laten we {w} even parkeren.', 'Daarop voortbordurend: {w}, maar dan op schaal.', 'Zien jullie mijn scherm? Het is een slide met alleen “{w}”.', 'Mijn dochter vroeg vanochtend trouwens naar {w}.', 'Ik heb een harde stop over 5 minuten, maar {w}.']
  };
  var NOISE = {
    en: ['[ Someone’s dog is barking ]', '[ Kyle’s screen share shows his inbox: 14,302 unread ]', '[ Brian joined the meeting ]', '[ Brian left the meeting ]', '[ Echo… echo… echo… ]', '[ Todd is eating soup on camera ]', '[ Chad is joining from a cold plunge ]'],
    nl: ['[ Er blaft ergens een hond ]', '[ Kyle deelt per ongeluk zijn inbox: 14.302 ongelezen ]', '[ Brian neemt deel aan de vergadering ]', '[ Brian heeft de vergadering verlaten ]', '[ Echo… echo… echo… ]', '[ Todd eet soep voor de camera ]', '[ Chad belt in vanuit een ijsbad ]']
  };
  var CHOICES = [
    { who: 'chad', q: { en: 'Can you share your screen?', nl: 'Kun jij je scherm even delen?' }, a: [
      { t: { en: 'Share screen (it’s your banking app)', nl: 'Scherm delen (het is je bankapp)' }, s: -10, y: 5, r: { en: 'Everyone saw your balance. Respect, somehow.', nl: 'Iedereen zag je saldo. Op de een of andere manier: respect.' } },
      { t: { en: 'Pretend your Wi-Fi died', nl: 'Doe alsof je wifi eruit ligt' }, s: 8, y: -5, r: { en: 'Your frozen face is your best look yet.', nl: 'Je bevroren gezicht is je beste look tot nu toe.' } },
      { t: { en: 'Share the Fast Glasses™ promo', nl: 'Deel de Fast Glasses™-promo' }, s: 0, y: 15, r: { en: 'Brad bought three pairs mid-meeting.', nl: 'Brad kocht er tijdens de vergadering drie.' } }] },
    { who: 'brad', q: { en: 'Any questions before we wrap up?', nl: 'Nog vragen voordat we afronden?' }, a: [
      { t: { en: 'Ask a question', nl: 'Stel een vraag' }, s: -20, y: 0, r: { en: 'The meeting is now 30 minutes longer. Everyone hates you.', nl: 'De vergadering duurt nu 30 minuten langer. Iedereen haat je.' } },
      { t: { en: 'Stay silent', nl: 'Zwijg' }, s: 10, y: 5, r: { en: 'A wise and beloved choice.', nl: 'Een wijze en geliefde keuze.' } },
      { t: { en: '“Great point.”', nl: '“Goed punt.”' }, s: 0, y: 10, r: { en: 'There was no point. It was still great.', nl: 'Er was geen punt. Het was toch goed.' } }] },
    { who: 'kyle', q: { en: 'Should we circle back on this?', nl: 'Zullen we hier later op terugkomen?' }, a: [
      { t: { en: 'Yes, let’s circle back', nl: 'Ja, laten we erop terugkomen' }, s: -5, y: 10, r: { en: 'Kyle smiles for the first time since 2016.', nl: 'Kyle glimlacht voor het eerst sinds 2016.' } },
      { t: { en: 'Let’s just decide now', nl: 'Laten we het nu gewoon besluiten' }, s: 10, y: -15, r: { en: 'Radical. Kyle is crying. HR has been notified.', nl: 'Radicaal. Kyle huilt. HR is ingelicht.' } },
      { t: { en: 'Let’s take it offline', nl: 'Laten we het offline oppakken' }, s: 0, y: 5, r: { en: 'It will never be seen again.', nl: 'Het wordt nooit meer gezien.' } }] },
    { who: 'dirk', q: { en: 'Who is your manager, and what does he do?', nl: 'Who is your manager, and what does he do?' }, a: [
      { t: { en: 'Point at Chad', nl: 'Wijs naar Chad' }, s: -5, y: 0, r: { en: 'Dirk: “Wrong.”', nl: 'Dirk: “Wrong.”' } },
      { t: { en: 'Point at Brian', nl: 'Wijs naar Brian' }, s: 5, y: 15, r: { en: 'Dirk nods slowly. You understand the org chart.', nl: 'Dirk knikt langzaam. Jij snapt het organogram.' } },
      { t: { en: 'Say “I’ll be back” and leave', nl: 'Zeg “I’ll be back” en vertrek' }, s: 20, y: -10, r: { en: 'Dirk respects this deeply.', nl: 'Dirk heeft hier diep respect voor.' } }] },
    { who: 'todd', q: { en: 'Fun icebreaker! Share your favourite family memory.', nl: 'Leuke ijsbreker! Deel je favoriete familieherinnering.' }, a: [
      { t: { en: 'Share a real memory', nl: 'Deel een echte herinnering' }, s: -10, y: 0, r: { en: 'Too real. Todd has muted you.', nl: 'Te echt. Todd heeft je gemute.' } },
      { t: { en: '“This team is my family.”', nl: '“Dit team is mijn familie.”' }, s: -10, y: 15, r: { en: 'Todd is weeping. Your soul left briefly.', nl: 'Todd huilt. Je ziel verliet even je lichaam.' } },
      { t: { en: 'Turn camera off', nl: 'Camera uitzetten' }, s: 8, y: -5, r: { en: 'Peace. Brief, beautiful peace.', nl: 'Rust. Korte, prachtige rust.' } }] },
    { who: 'derek', q: { en: 'Mind if I post a screenshot of this call on LinkedIn?', nl: 'Vinden jullie het goed als ik een screenshot van deze call op LinkedIn zet?' }, a: [
      { t: { en: '“Agree?”', nl: '“Eens?”' }, s: -5, y: 10, r: { en: '48,000 impressions. 3 are real.', nl: '48.000 weergaven. Drie zijn echt.' } },
      { t: { en: 'Please don’t', nl: 'Liever niet' }, s: 5, y: -5, r: { en: 'He posts it anyway. You’re tagged.', nl: 'Hij post het toch. Je bent getagd.' } }] },
    { who: null, q: { en: 'Your laptop wants to restart for updates.', nl: 'Je laptop wil herstarten voor updates.' }, a: [
      { t: { en: 'Restart now', nl: 'Nu herstarten' }, s: 15, y: 0, r: { en: 'You missed four minutes. Nobody noticed.', nl: 'Je miste vier minuten. Niemand merkte het.' } },
      { t: { en: 'Remind me in 1 hour', nl: 'Herinner me over 1 uur' }, s: -5, y: 0, r: { en: 'It will ask again in 45 seconds.', nl: 'Hij vraagt het over 45 seconden opnieuw.' } }] }
  ];

  function mount(root) {
    var $ = function (s) { return root.querySelector(s); };
    var chat = $('#m-chat'), tiles = $('#m-tiles'), choices = $('#m-choices'), bingo = $('#m-bingo'), clock = $('#m-clock');
    var sanE = $('#m-sanity'), synE = $('#m-synergy');
    var st = null, timers = [];
    var L = function () { return Snel.lang(); };

    function later(fn, ms) { var id = setTimeout(fn, ms); timers.push(id); return id; }
    function clear() { timers.forEach(clearTimeout); timers = []; }
    function say(who, text, cls) {
      var p = document.createElement('p');
      if (cls) p.className = cls;
      p.innerHTML = (who ? '<b>' + who + ':</b> ' : '<i>') + text + (who ? '' : '</i>');
      chat.appendChild(p);
      chat.scrollTop = chat.scrollHeight;
    }
    function meters() {
      st.sanity = Math.max(0, Math.min(100, st.sanity));
      st.synergy = Math.max(0, Math.min(100, st.synergy));
      sanE.style.width = st.sanity + '%';
      sanE.style.background = st.sanity < 30 ? 'var(--down)' : st.sanity < 60 ? 'var(--volt)' : 'var(--up)';
      synE.style.width = st.synergy + '%';
      if (st.sanity <= 0) end('sanity');
    }
    function renderTiles(speaking) {
      tiles.innerHTML = PEOPLE.map(function (p) {
        return '<div class="tile' + (p.id === speaking ? ' speaking' : '') + '"><span><span class="ini">' + p.i + '</span>' + p.n + '</span>' + (p.id === 'kyle' || p.id === 'todd' ? '<span class="muted">🔇</span>' : '') + '</div>';
      }).join('');
    }
    function renderBingo() {
      bingo.innerHTML = st.card.map(function (w, i) {
        return '<button type="button" data-i="' + i + '" class="' + (st.marked[i] ? 'marked' : st.heard[i] ? 'heard' : '') + '">' + w + '</button>';
      }).join('');
    }
    function checkBingo() {
      var m = st.marked, lines = [];
      for (var r = 0; r < 4; r++) { lines.push([0, 1, 2, 3].map(function (c) { return r * 4 + c; })); lines.push([0, 1, 2, 3].map(function (c) { return c * 4 + r; })); }
      lines.push([0, 5, 10, 15], [3, 6, 9, 12]);
      return lines.some(function (l) { return l.every(function (i) { return m[i]; }); });
    }
    bingo.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-i]');
      if (!b || !st || st.over) return;
      var i = +b.getAttribute('data-i');
      if (st.marked[i]) return;
      if (!st.heard[i]) {
        st.sanity -= 6; meters();
        Snel.toast(Snel.t({ en: '🙊 Nobody said that yet. False bingo. −6 sanity.', nl: '🙊 Dat heeft nog niemand gezegd. Valse bingo. −6 verstand.' }));
        return;
      }
      st.marked[i] = true; st.synergy += 6; meters(); renderBingo();
      if (checkBingo()) end('bingo');
    });

    function line() {
      if (st.over) return;
      var p = pick(PEOPLE);
      renderTiles(p.id);
      var r = Math.random();
      if (p.id === 'dirk' && r < .5) {
        say('Dirk', pick(window.DIRK || ['I’ll be back.']));
      } else if (r < .12) {
        say(null, pick(NOISE[L()]));
      } else {
        // bias towards words on the card so bingo is winnable
        var w = Math.random() < .7 ? pick(st.card) : pick(WORDS);
        say(p.n, pick(LINES[L()]).replace('{w}', '<u>' + w + '</u>'));
        var idx = st.card.indexOf(w);
        if (idx > -1 && !st.heard[idx]) { st.heard[idx] = true; renderBingo(); }
      }
      st.lines++;
      if (st.lines % 4 === 0 && !st.asking) ask();
      later(line, 1800 + Math.random() * 1400);
    }

    function ask() {
      var c = st.deck.length ? st.deck.pop() : pick(CHOICES);
      st.asking = true;
      var who = c.who ? PEOPLE.filter(function (p) { return p.id === c.who; })[0].n : '💻';
      choices.innerHTML = '<span class="prompt">' + who + ': ' + Snel.t(c.q) + '</span>' + c.a.map(function (a, i) {
        return '<button class="btn small" data-a="' + i + '">' + Snel.t(a.t) + '</button>';
      }).join('');
      var timeout = later(function () {
        st.sanity -= 8; meters();
        say(null, Snel.t({ en: 'You were on mute the whole time. Kyle answered for you.', nl: 'Je stond de hele tijd op mute. Kyle antwoordde namens jou.' }));
        done();
      }, 7000);
      function done() { st.asking = false; choices.innerHTML = '<span class="prompt" style="opacity:.6">' + Snel.t({ en: 'Listening intently (not listening)…', nl: 'Aandachtig aan het luisteren (niet aan het luisteren)…' }) + '</span>'; }
      choices.querySelectorAll('[data-a]').forEach(function (b) {
        b.addEventListener('click', function () {
          clearTimeout(timeout);
          var a = c.a[+b.getAttribute('data-a')];
          say(Snel.t({ en: 'You', nl: 'Jij' }), Snel.t(a.t));
          say(null, Snel.t(a.r));
          st.sanity += a.s; st.synergy += a.y; meters();
          done();
        });
      });
    }

    function tick() {
      if (st.over) return;
      st.t++;
      st.sanity -= 1; meters();
      var mins = st.t * 20; // 1 real second = 20 meeting seconds
      var mm = String(Math.floor(mins / 60)).padStart(2, '0'), ss = String(mins % 60).padStart(2, '0');
      clock.textContent = mm + ':' + ss + ' / ' + (st.extended ? '60:00' : '30:00');
      if (mins >= 1800 && !st.extended) {
        st.extended = true;
        say('Chad', Snel.t({ en: 'Let’s just extend this by 30 minutes, we’re on a roll!', nl: 'Laten we er nog 30 minuten aan plakken, we zijn lekker bezig!' }));
        Snel.shout(Snel.t({ en: '+30 MIN', nl: '+30 MIN' }));
      }
      if (mins >= 3600) return end('time');
      later(tick, 1000);
    }

    function end(why) {
      if (st.over) return;
      st.over = true; clear();
      var msg = {
        bingo: { en: '🎉 <b>BINGO!</b> You yelled it unmuted. Chad thinks it was enthusiasm. You have been promoted to VP.', nl: '🎉 <b>BINGO!</b> Je riep het zonder mute. Chad dacht dat het enthousiasme was. Je bent gepromoveerd tot VP.' },
        sanity: { en: '🫠 <b>You have left the meeting.</b> Spiritually. Your camera is still on.', nl: '🫠 <b>Je hebt de vergadering verlaten.</b> Spiritueel. Je camera staat nog aan.' },
        time: { en: '📅 <b>The meeting has ended.</b> A follow-up meeting has been scheduled to discuss this meeting.', nl: '📅 <b>De vergadering is afgelopen.</b> Er is een vervolgoverleg ingepland om deze vergadering te bespreken.' }
      }[why];
      say(null, Snel.t(msg));
      var score = Math.round(st.synergy * 10 + st.sanity * 5 + (why === 'bingo' ? 500 : 0));
      choices.innerHTML = '<span class="prompt">' + Snel.t({ en: 'Synergy score: ', nl: 'Synergiescore: ' }) + score + '</span><button class="btn hot" data-act="restart">' + Snel.t({ en: 'Join another meeting', nl: 'Nog een vergadering' }) + '</button>';
      choices.querySelector('[data-act="restart"]').addEventListener('click', start);
      if (why === 'bingo') { Snel.confetti(); Snel.shout('BINGO!'); Snel.bump(5, { en: 'Employee achieved buzzword bingo', nl: 'Medewerker haalde buzzword-bingo' }); }
      else Snel.bump(-2.5, { en: 'Meeting ran over (again)', nl: 'Vergadering liep uit (alweer)' });
      var best = Snel.store.get('snel-meeting-best', 0);
      if (score > best) Snel.store.set('snel-meeting-best', score);
    }

    function start() {
      clear();
      st = { sanity: 100, synergy: 20, t: 0, lines: 0, over: false, asking: false, extended: false,
        card: shuffle(WORDS).slice(0, 16), heard: {}, marked: {}, deck: shuffle(CHOICES) };
      chat.innerHTML = '';
      say(null, Snel.t({ en: 'You joined “Q3 Alignment Sync (could’ve been an email)”. 6 participants. 0 agenda.', nl: 'Je neemt deel aan “Q3 Alignment Sync (had een mail kunnen zijn)”. 6 deelnemers. 0 agenda.' }));
      renderTiles(null); renderBingo(); meters();
      choices.innerHTML = '<span class="prompt" style="opacity:.6">…</span>';
      later(line, 1200); later(tick, 1000);
    }

    // idle state
    st = { sanity: 100, synergy: 20, card: shuffle(WORDS).slice(0, 16), heard: {}, marked: {}, over: true };
    renderTiles(null); renderBingo();
    sanE.style.width = '100%'; synE.style.width = '20%';
    root.querySelector('#m-start').addEventListener('click', start);
  }

  function boot() { var m = document.getElementById('meeting'); if (m) mount(m); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
