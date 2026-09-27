/* Flappy Snail: Velocity Sprint™. Dodge the calendar. Ship deliverables. */
(function () {
  'use strict';
  var W = 480, H = 640, GROUND = 64;
  var LABELS = ['SYNC', '1:1', 'ALL-HANDS', 'STAND-UP', 'OFFSITE', 'QBR', 'RETRO', 'KICK-OFF', 'TOWN HALL', 'PRE-MEETING', 'DEBRIEF', 'ALIGNMENT'];
  var OVER = [
    { en: 'Hasta la vista, deliverables.', nl: 'Hasta la vista, deliverables.' },
    { en: 'You hit a meeting. It could have been an email.', nl: 'Je vloog tegen een vergadering. Had een mail kunnen zijn.' },
    { en: 'Double-booked. Literally.', nl: 'Dubbel geboekt. Letterlijk.' },
    { en: 'Your calendar has defeated you.', nl: 'Je agenda heeft je verslagen.' },
    { en: 'Dirk: “Do it again. Do it NOW.”', nl: 'Dirk: “Do it again. Do it NOW.”' }
  ];
  var CHEER = ['SYNERGY!', 'VELOCITY!', 'DO IT NOW!', 'GET TO THE STAND-UP!', 'I’LL BE BACK!', 'NUMBER GO UP!', 'CIRCLE BACK!'];

  function boot() {
    var canvas = document.getElementById('flappy');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.scale(dpr, dpr);

    var img = new Image(); img.src = 'assets/img/logo-mark.png';
    var best = Snel.store.get('snel-flappy-best', 0);
    var s, raf, last = 0, acc = 0, cheer = null, overMsg = OVER[0];

    function reset() {
      s = { mode: 'ready', y: H / 2 - 40, vy: 0, t: 0, score: 0, pipes: [], speed: 2.6, gap: 180, spawn: 0, clouds: [], bgx: 0 };
      for (var i = 0; i < 5; i++) s.clouds.push({ x: Math.random() * W, y: 40 + Math.random() * 260, r: 20 + Math.random() * 30, v: .3 + Math.random() * .5 });
    }
    function flap() {
      if (s.mode === 'ready') { s.mode = 'play'; }
      if (s.mode === 'over') { if (performance.now() - s.overAt > 500) { reset(); } return; }
      s.vy = -7.6;
    }
    function spawn() {
      var top = 70 + Math.random() * (H - GROUND - s.gap - 140);
      s.pipes.push({ x: W + 20, top: top, w: 76, passed: false, lt: LABELS[Math.floor(Math.random() * LABELS.length)], lb: LABELS[Math.floor(Math.random() * LABELS.length)] });
    }
    var SX = 110, SW = 72, SH = 67; // snail box
    function hit(p) {
      var r = { x: SX - SW / 2 + 10, y: s.y - SH / 2 + 10, w: SW - 20, h: SH - 20 };
      var inX = r.x + r.w > p.x && r.x < p.x + p.w;
      return inX && (r.y < p.top || r.y + r.h > p.top + s.gap);
    }
    function step() {
      s.t++;
      s.clouds.forEach(function (c) { c.x -= c.v * (s.mode === 'play' ? 1.5 : .6); if (c.x < -60) { c.x = W + 60; c.y = 40 + Math.random() * 260; } });
      s.bgx = (s.bgx + (s.mode === 'play' ? s.speed : .8)) % 48;
      if (s.mode === 'ready') { s.y = H / 2 - 40 + Math.sin(s.t / 12) * 10; return; }
      if (s.mode === 'over') { if (s.y < H - GROUND - SH / 2) { s.vy += .5; s.y += s.vy; } return; }
      s.vy = Math.min(s.vy + .42, 10);
      s.y += s.vy;
      if (--s.spawn <= 0) { spawn(); s.spawn = Math.round(200 / s.speed * 1.35); }
      s.pipes.forEach(function (p) {
        p.x -= s.speed;
        if (!p.passed && p.x + p.w < SX - SW / 2) {
          p.passed = true; s.score++;
          if (s.score % 5 === 0) { s.speed += .35; s.gap = Math.max(140, s.gap - 6); cheer = { txt: CHEER[Math.floor(Math.random() * CHEER.length)], t: 60 }; }
        }
      });
      s.pipes = s.pipes.filter(function (p) { return p.x > -p.w - 10; });
      if (s.y > H - GROUND - SH / 2 + 6 || s.y < -20 || s.pipes.some(hit)) die();
    }
    function die() {
      s.mode = 'over'; s.overAt = performance.now();
      overMsg = OVER[Math.floor(Math.random() * OVER.length)];
      if (s.score > best) { best = s.score; Snel.store.set('snel-flappy-best', best); }
      document.getElementById('flappy-best').textContent = best;
      if (s.score >= 10) Snel.bump(s.score / 5, { en: 'Flappy Snail shipped ' + s.score + ' deliverables', nl: 'Flappy Snail leverde ' + s.score + ' deliverables op' });
    }

    function rr(x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
    function pillar(x, y, w, h, label, fromTop) {
      // a stack of calendar invites
      ctx.fillStyle = '#fab993'; ctx.strokeStyle = '#0a1a1a'; ctx.lineWidth = 4;
      rr(x, y, w, h, 8); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = 'rgba(10,26,26,.25)'; ctx.lineWidth = 2;
      for (var yy = fromTop ? y + h - 34 : y + 34; fromTop ? yy > y + 10 : yy < y + h - 10; yy += fromTop ? -34 : 34) {
        ctx.beginPath(); ctx.moveTo(x + 8, yy); ctx.lineTo(x + w - 8, yy); ctx.stroke();
      }
      var cy = fromTop ? y + h - 26 : y + 8;
      ctx.fillStyle = '#ff3d7f'; ctx.strokeStyle = '#0a1a1a'; ctx.lineWidth = 3;
      rr(x - 6, cy, w + 12, 20, 6); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#fff'; ctx.font = '700 11px "Space Mono", monospace'; ctx.textAlign = 'center';
      ctx.fillText(label, x + w / 2, cy + 14);
    }
    function draw() {
      // sky
      var g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#1b6664'); g.addColorStop(1, '#3db0ad');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      // skyline (office towers)
      ctx.fillStyle = 'rgba(10,26,26,.25)';
      for (var i = 0; i < 12; i++) { var bx = ((i * 60 - s.t * .3) % (W + 60) + W + 60) % (W + 60) - 60, bh = 80 + (i * 37 % 90); ctx.fillRect(bx, H - GROUND - bh, 44, bh); }
      // clouds
      ctx.fillStyle = 'rgba(255,246,239,.7)';
      s.clouds.forEach(function (c) { ctx.beginPath(); ctx.arc(c.x, c.y, c.r, 0, 7); ctx.arc(c.x + c.r, c.y + 6, c.r * .7, 0, 7); ctx.arc(c.x - c.r, c.y + 8, c.r * .6, 0, 7); ctx.fill(); });
      // pipes
      s.pipes.forEach(function (p) {
        pillar(p.x, -10, p.w, p.top + 10, p.lt, true);
        pillar(p.x, p.top + s.gap, p.w, H - GROUND - p.top - s.gap + 10, p.lb, false);
      });
      // ground (carpet tiles)
      ctx.fillStyle = '#0c3534'; ctx.fillRect(0, H - GROUND, W, GROUND);
      ctx.fillStyle = '#124746';
      for (var gx = -s.bgx; gx < W; gx += 48) ctx.fillRect(gx, H - GROUND + 8, 24, GROUND - 16);
      ctx.fillStyle = '#fab993'; ctx.fillRect(0, H - GROUND, W, 5);
      // snail
      ctx.save();
      ctx.translate(SX, s.y);
      var ang = s.mode === 'ready' ? 0 : Math.max(-.5, Math.min(1.1, s.vy / 10));
      ctx.rotate(ang + .55);
      // flame
      if (s.mode !== 'over' && (s.vy < 0 || s.mode === 'ready')) {
        ctx.fillStyle = s.t % 6 < 3 ? '#ff3d7f' : '#ffe14d';
        ctx.beginPath(); ctx.moveTo(-SW / 2 + 4, SH / 2 - 6); ctx.lineTo(-SW / 2 - 18 - Math.random() * 10, SH / 2 + 12); ctx.lineTo(-SW / 2 + 16, SH / 2 - 2); ctx.fill();
      }
      if (img.complete && img.naturalWidth) ctx.drawImage(img, -SW / 2, -SH / 2, SW, SH);
      else { ctx.fillStyle = '#3db0ad'; ctx.beginPath(); ctx.arc(0, 0, 24, 0, 7); ctx.fill(); }
      ctx.restore();
      // HUD
      ctx.textAlign = 'center'; ctx.lineWidth = 6; ctx.strokeStyle = '#0a1a1a'; ctx.fillStyle = '#fff6ef';
      ctx.font = '64px "Squada One", Impact, sans-serif';
      if (s.mode !== 'ready') { ctx.strokeText(s.score, W / 2, 90); ctx.fillText(s.score, W / 2, 90); }
      if (cheer && cheer.t-- > 0) {
        ctx.font = '40px "Squada One", Impact, sans-serif'; ctx.fillStyle = '#ffe14d';
        ctx.strokeText(cheer.txt, W / 2, 150); ctx.fillText(cheer.txt, W / 2, 150);
      }
      if (s.mode === 'ready') panel(Snel.t({ en: 'FLAPPY SNAIL', nl: 'FLAPPY SNAIL' }), Snel.t({ en: 'Tap, click or press Space to flap.', nl: 'Tik, klik of druk op spatie om te vliegen.' }), Snel.t({ en: 'Dodge the meetings. Ship the deliverables.', nl: 'Ontwijk de vergaderingen. Lever de deliverables op.' }));
      if (s.mode === 'over') panel(Snel.t({ en: 'MEETING OVER', nl: 'VERGADERING VOORBIJ' }), Snel.t(overMsg), Snel.t({ en: 'Deliverables: ', nl: 'Deliverables: ' }) + s.score + '  ·  ' + Snel.t({ en: 'Best: ', nl: 'Record: ' }) + best);
    }
    function panel(title, a, b) {
      ctx.fillStyle = 'rgba(10,26,26,.78)'; rr(40, H / 2 - 110, W - 80, 200, 18); ctx.fill();
      ctx.strokeStyle = '#fab993'; ctx.lineWidth = 4; ctx.stroke();
      ctx.textAlign = 'center';
      ctx.fillStyle = '#fab993'; ctx.font = '52px "Squada One", Impact, sans-serif'; ctx.fillText(title, W / 2, H / 2 - 45);
      ctx.fillStyle = '#fff6ef'; ctx.font = '600 17px Montserrat, sans-serif'; wrap(a, W / 2, H / 2, W - 120, 22);
      ctx.fillStyle = '#7fd8d4'; ctx.font = '700 14px "Space Mono", monospace'; ctx.fillText(b, W / 2, H / 2 + 60);
    }
    function wrap(text, x, y, max, lh) {
      var words = text.split(' '), line = '';
      words.forEach(function (w) { var t = line + w + ' '; if (ctx.measureText(t).width > max && line) { ctx.fillText(line.trim(), x, y); line = w + ' '; y += lh; } else line = t; });
      ctx.fillText(line.trim(), x, y);
    }
    function loop(now) {
      // fixed 60 Hz step so high-refresh screens don't play in fast-forward
      if (!last) last = now;
      acc += Math.min(now - last, 100); last = now;
      while (acc >= 16.67) { step(); acc -= 16.67; }
      draw();
      raf = requestAnimationFrame(loop);
    }

    canvas.addEventListener('pointerdown', function (e) { e.preventDefault(); canvas.focus(); flap(); });
    canvas.addEventListener('keydown', function (e) { if (e.code === 'Space' || e.key === ' ' || e.key === 'ArrowUp') { e.preventDefault(); flap(); } });
    // pause rendering when off-screen
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) {
        if (en[0].isIntersecting) { if (!raf) { last = 0; raf = requestAnimationFrame(loop); } }
        else { cancelAnimationFrame(raf); raf = null; if (s.mode === 'play') { s.mode = 'ready'; s.pipes = []; s.score = 0; } }
      }).observe(canvas);
    } else raf = requestAnimationFrame(loop);
    document.getElementById('flappy-best').textContent = best;
    reset(); draw();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
