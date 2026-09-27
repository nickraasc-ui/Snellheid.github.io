/* Snellheid Thought Leadership Engine™ — generates value at scale. */
(function () {
  'use strict';
  var pick = function (a) { return a[Math.floor(Math.random() * a.length)]; };

  var W = {
    en: {
      verb: ['leverage', 'synergise', 'disrupt', 'operationalise', 'reimagine', 'unlock', 'gamify', 'blockchain', 'right-size', 'onboard', 'double-click on', 'deep-dive into', 'circle back on', 'turbo-charge', 'incentivise', 'future-proof'],
      verb2: ['leverage', 'synergise', 'disrupt', 'operationalise', 'reimagine', 'unlock', 'gamify', 'right-size', 'monetise', 'optimise', 'align', 'democratise', 'weaponise', 'streamline'],
      adj: ['frictionless', 'agile', 'holistic', 'next-gen', 'AI-powered', 'cross-functional', 'mission-critical', 'bleeding-edge', 'scalable', 'family-oriented', 'turbo-charged', 'gluten-free', 'quantum', 'best-in-class', 'zero-latency', 'rocket-powered'],
      noun: ['synergies', 'paradigms', 'deliverables', 'value streams', 'touchpoints', 'learnings', 'bandwidth', 'low-hanging fruit', 'action items', 'core competencies', 'north stars', 'OKRs', 'verticals', 'stakeholders', 'ecosystems', 'mindshare'],
      end: ['at the speed of a snail with a rocket', 'so everyone can go home early (they can’t)', 'for the family', 'by end of day (whose day is unclear)', 'while circling back', 'in Q3 of a year to be announced', 'without making a single decision', 'one meeting at a time', 'before Dirk gets back', 'with zero budget and infinite passion'],
      mission: function (w) {
        return 'At Snellheid, we ' + pick(w.verb) + ' ' + pick(w.adj) + ' ' + pick(w.noun) + ' to ' + pick(w.verb2) + ' ' + pick(w.adj) + ' ' + pick(w.noun) + ' ' + pick(w.end) + '.';
      },
      li: {
        open: ['I almost didn’t post this.', 'Unpopular opinion:', 'I’m humbled to announce I’ve accepted a new role as VP of Circling Back at Snellheid Industries.', 'Yesterday my 4-year-old asked me what B2B SaaS is.', 'I got rejected 400 times. Here’s what happened next.', 'I cried in a board meeting today. Here’s why that’s leadership.', 'Nobody talks about this:'],
        story: ['My intern forgot to mute on a call. Instead of firing him, I promoted him to Head of Transparency.', 'I watched a snail cross my driveway. It took 11 hours. It never gave up. It never sent a follow-up email.', 'I woke up at 3:45am, cold-plunged, journaled, and restructured three departments with gratitude.', 'My flight was delayed, so I closed a €4M deal with the pilot.', 'I put on my Fast Glasses™ and walked into the quarterly review. Nobody could see my eyes. Nobody could see my fear.', 'Our CTO — Chief Terminating Officer — told me: “Do it. Do it NOW.” So I did it. I’m still not sure what it was.'],
        lesson: ['That’s when I realised: synergy isn’t a word. It’s a lifestyle.', 'What does this teach us about B2B sales? Everything.', 'Leadership isn’t a title. It’s a fleece vest.', 'Speed is nothing without direction. Direction is nothing without a meeting about direction.', 'We’re not a company. We’re a family. (Please don’t unionise.)', 'Be the rocket. Not the snail. Actually, be both.'],
        close: ['Agree?', 'Thoughts? 👇', 'Repost if you agree ♻️', 'Follow me for more. I will not stop.', 'I’ll be back.'],
        tags: '#Synergy #Snellheid #Leadership #Grateful #Hustle #WeAreFamily #Velocity'
      },
      ex: {
        open: ['Hi team,', 'Apologies all,', 'Quick one:', 'Hey fam,', 'Per my last email,'],
        why: ['my laptop is installing 47 updates', 'I’m double-booked with a meeting about meetings', 'my cat has taken over the Teams call and is presenting', 'I’m stuck in the lift with Dirk and he keeps saying “I’ll be back”', 'my Fast Glasses™ made me so fast I arrived at yesterday’s meeting instead', 'HR booked me for a “quick chat” and I’m hiding', 'I went too deep on a deep-dive and can’t get back up', 'my Wi-Fi only works when I stand on one leg', 'I circled back so many times I got dizzy', 'I’m at the dentist (spiritually)', 'I’m in a meeting to prepare for this meeting'],
        then: ['Can we take this offline?', 'Please record it. I will not watch the recording.', 'Let’s circle back next week.', 'Could this have been an email? Asking for a friend (me).', 'Send notes, I’ll react with 👍.', 'Let’s park it for now.']
      }
    },
    nl: {
      verb: ['leveragen', 'synergiseren', 'disrupten', 'operationaliseren', 'herijken', 'ontsluiten', 'gamificeren', 'blockchainen', 'rightsizen', 'onboarden', 'valideren', 'finetunen', 'framen', 'turbo-boosten', 'parkeren', 'agenderen'],
      verb2: ['leveragen', 'synergiseren', 'disrupten', 'operationaliseren', 'herijken', 'ontsluiten', 'gamificeren', 'rightsizen', 'monetiseren', 'optimaliseren', 'faciliteren', 'democratiseren', 'implementeren', 'stroomlijnen'],
      adj: ['frictieloze', 'agile', 'holistische', 'next-gen', 'AI-gedreven', 'cross-functionele', 'missiekritische', 'schaalbare', 'familievriendelijke', 'turbogeladen', 'glutenvrije', 'kwantum', 'best-in-class', 'toekomstbestendige', 'datagedreven', 'raketaangedreven'],
      noun: ['synergieën', 'paradigma’s', 'deliverables', 'waardestromen', 'touchpoints', 'learnings', 'bandbreedte', 'quick wins', 'actiepunten', 'kerncompetenties', 'stippen op de horizon', 'OKR’s', 'verticals', 'stakeholders', 'ecosystemen', 'roadmaps'],
      end: ['met de snelheid van een slak met een raket', 'zodat iedereen eerder naar huis kan (dat kan niet)', 'voor de familie', 'voor het einde van de dag (welke dag is onduidelijk)', 'terwijl we erop terugkomen', 'in Q3 van een nader te bepalen jaar', 'zonder één besluit te nemen', 'één vergadering tegelijk', 'voordat Dirk terug is', 'met nul budget en oneindig veel passie'],
      mission: function (w) {
        return 'Bij Snellheid ' + pick(w.verb) + ' wij ' + pick(w.adj) + ' ' + pick(w.noun) + ' om ' + pick(w.adj) + ' ' + pick(w.noun) + ' te ' + pick(w.verb2) + ', ' + pick(w.end) + '.';
      },
      li: {
        open: ['Ik twijfelde of ik dit zou posten.', 'Unpopular opinion:', 'Met gepaste trots maak ik bekend dat ik start als VP Erop Terugkomen bij Snellheid Industries.', 'Gisteren vroeg mijn dochter van 4 wat B2B SaaS is.', 'Ik ben 400 keer afgewezen. Dit gebeurde daarna.', 'Ik heb vandaag gehuild in een directievergadering. Daarom is dat leiderschap.', 'Niemand heeft het hierover:'],
        story: ['Mijn stagiair vergat zijn microfoon te muten. In plaats van hem te ontslaan, promoveerde ik hem tot Hoofd Transparantie.', 'Ik zag een slak over mijn oprit kruipen. Het duurde 11 uur. Hij gaf nooit op. Hij stuurde nooit een follow-up mail.', 'Ik werd om 3:45 wakker, nam een ijsbad, journalde en heb drie afdelingen met dankbaarheid gereorganiseerd.', 'Mijn vlucht had vertraging, dus sloot ik een deal van €4M met de piloot.', 'Ik zette mijn Fast Glasses™ op en liep de kwartaalreview binnen. Niemand zag mijn ogen. Niemand zag mijn angst.', 'Onze CTO — Chief Terminating Officer — zei tegen me: “Do it. Do it NOW.” Dus ik deed het. Ik weet nog steeds niet wat.'],
        lesson: ['Toen besefte ik: synergie is geen woord. Het is een levensstijl.', 'Wat leert dit ons over B2B-sales? Alles.', 'Leiderschap is geen titel. Het is een fleece bodywarmer.', 'Snelheid is niets zonder richting. Richting is niets zonder een overleg over richting.', 'We zijn geen bedrijf. We zijn een familie. (Richt alsjeblieft geen OR op.)', 'Wees de raket. Niet de slak. Eigenlijk: wees allebei.'],
        close: ['Eens?', 'Gedachten? 👇', 'Repost als je het eens bent ♻️', 'Volg me voor meer. Ik stop niet.', 'I’ll be back.'],
        tags: '#Synergie #Snellheid #Leiderschap #Dankbaar #Hustle #WijZijnFamilie #Snelheid'
      },
      ex: {
        open: ['Hoi team,', 'Excuses allemaal,', 'Kort dingetje:', 'Hé familie,', 'Zoals in mijn vorige mail,'],
        why: ['mijn laptop installeert 47 updates', 'ik ben dubbel geboekt met een overleg over overleggen', 'mijn kat heeft de Teams-call overgenomen en presenteert nu', 'ik zit vast in de lift met Dirk en hij blijft “I’ll be back” zeggen', 'mijn Fast Glasses™ maakten me zo snel dat ik bij de vergadering van gisteren uitkwam', 'HR heeft een “kort gesprekje” ingepland en ik verstop me', 'ik ben te diep ingezoomd en kom er niet meer uit', 'mijn wifi werkt alleen als ik op één been sta', 'ik ben zo vaak teruggekomen dat ik duizelig ben', 'ik zit bij de tandarts (spiritueel)', 'ik zit in een voorbereidend overleg voor dit overleg'],
        then: ['Kunnen we dit offline oppakken?', 'Neem het alsjeblieft op. Ik ga de opname niet terugkijken.', 'Laten we er volgende week op terugkomen.', 'Had dit niet gewoon een mail kunnen zijn?', 'Stuur de notulen, ik reageer met 👍.', 'Laten we het even parkeren.']
      }
    }
  };

  function gen(kind, l) {
    var w = W[l];
    if (kind === 'mission') return w.mission(w);
    if (kind === 'li') return [pick(w.li.open), pick(w.li.story), pick(w.li.lesson), pick(w.li.close), w.li.tags].join('\n\n');
    return pick(w.ex.open) + ' ' + pick(w.ex.why) + '. ' + pick(w.ex.then);
  }

  function mount(el) {
    var kind = 'mission';
    var out = el.querySelector('.toy-output');
    var tabs = el.querySelectorAll('[role="tab"]');
    function run() {
      out.style.whiteSpace = kind === 'li' ? 'pre-line' : 'normal';
      out.textContent = gen(kind, Snel.lang());
    }
    tabs.forEach(function (b) {
      b.addEventListener('click', function () {
        tabs.forEach(function (x) { x.setAttribute('aria-selected', x === b); });
        kind = b.getAttribute('data-kind');
        run();
      });
    });
    el.querySelector('[data-act="gen"]').addEventListener('click', function (e) {
      run();
      Snel.bump(Math.random() * 2 + .3, { en: 'New strategic vision announced', nl: 'Nieuwe strategische visie aangekondigd' });
    });
    el.querySelector('[data-act="copy"]').addEventListener('click', function () {
      var txt = out.textContent;
      (navigator.clipboard ? navigator.clipboard.writeText(txt) : Promise.reject()).then(function () {
        Snel.toast(Snel.t({ en: '📋 Copied. Now post it without irony.', nl: '📋 Gekopieerd. Post het nu zonder ironie.' }));
      }, function () {
        Snel.toast(Snel.t({ en: 'Copy failed. Select the text and circle back manually.', nl: 'Kopiëren mislukt. Selecteer de tekst en kom er handmatig op terug.' }));
      });
    });
    document.addEventListener('snel:lang', run);
    run();
  }

  function boot() { document.querySelectorAll('[data-toy="buzz"]').forEach(mount); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
