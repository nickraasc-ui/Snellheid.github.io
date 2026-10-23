/* Front door: a password screen in front of every page. Loaded without defer, so nothing shows before it's checked.
   A static site can't truly lock content (it's all in the page source); this keeps visitors out, not hackers.
   Change the password: GATE_HASH = SHA-256 of the new password in lowercase, e.g. `echo -n newword | sha256sum`. */
(function () {
  'use strict';
  var GATE_HASH = '49e51c5c96a06c77b6825ddb4373f0d773aaaa788ffbc81f850dfb2fb6720a6c';
  var KEY = 'snel-gate', root = document.documentElement;
  function ok() { try { return localStorage.getItem(KEY) === GATE_HASH; } catch (e) { return false; } }
  if (ok()) return;
  root.classList.add('gated');
  var css = document.createElement('style');
  css.textContent = 'html.gated,html.gated body{overflow:hidden}html.gated body{visibility:hidden}' +
    '#snel-gate{visibility:visible;position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;padding:16px;background:#0c3534;font-family:Montserrat,system-ui,sans-serif;color:#fff}' +
    '#snel-gate form{width:100%;max-width:380px;background:#0a1a1a;border:3px solid #fab993;border-radius:18px;padding:28px 24px;box-shadow:8px 8px 0 #3db0ad;text-align:center}' +
    '#snel-gate img{width:84px;height:auto}#snel-gate .gt{font-family:"Squada One",Impact,sans-serif;color:#fab993;font-size:30px;margin:10px 0 4px;letter-spacing:.5px}' +
    '#snel-gate p{margin:0 0 18px;font-size:14px;opacity:.85}#snel-gate input{width:100%;box-sizing:border-box;font-size:16px;padding:12px 14px;border-radius:10px;border:2px solid #3db0ad;background:#ffd9c2;color:#0a1a1a}' +
    '#snel-gate button{margin-top:12px;width:100%;font-size:16px;font-weight:700;padding:12px;border:0;border-radius:10px;background:#ff3d7f;color:#fff;cursor:pointer}' +
    '#snel-gate .err{color:#ff8fb3;min-height:20px;margin:10px 0 0;font-size:14px}';
  document.head.appendChild(css);

  function sha(s) {
    return crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)).then(function (b) {
      return Array.prototype.map.call(new Uint8Array(b), function (x) { return ('0' + x.toString(16)).slice(-2); }).join('');
    });
  }
  function build() {
    var nl = (root.getAttribute('data-lang') || 'en') === 'nl';
    var g = document.createElement('div'); g.id = 'snel-gate';
    g.innerHTML = '<form autocomplete="on"><img src="assets/img/logo-mark.png" alt="">' +
      '<div class="gt">' + (nl ? 'Alleen voor medewerkers' : 'Employees only') + '</div>' +
      '<p>' + (nl ? 'Snellheid Industries™ intranet. Vul het wachtwoord in.' : 'Snellheid Industries™ intranet. Enter the password.') + '</p>' +
      '<input type="password" autocomplete="current-password" aria-label="Password" required>' +
      '<button type="submit">' + (nl ? 'Inchecken' : 'Badge in') + '</button><p class="err" aria-live="polite"></p></form>';
    document.body.appendChild(g);
    var input = g.querySelector('input'), err = g.querySelector('.err');
    input.focus();
    g.querySelector('form').addEventListener('submit', function (ev) {
      ev.preventDefault();
      sha(input.value.trim().toLowerCase()).then(function (h) {
        if (h !== GATE_HASH) { input.value = ''; err.textContent = nl ? '❌ Toegang geweigerd. HR is ingelicht.' : '❌ Access denied. HR has been notified.'; return; }
        try { localStorage.setItem(KEY, h); } catch (e) { /* private mode: ask again next visit */ }
        g.remove(); root.classList.remove('gated');
      });
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build); else build();
})();
