/* Snellheid Headshot Studio™ — every executive, same vest. */
(function () {
  'use strict';
  function hair(style, c) {
    switch (style) {
      case 'side': return '<path d="M31 42 Q30 20 50 19 Q72 18 70 42 Q66 30 56 28 Q44 33 34 30 Z" fill="' + c + '"/>';
      case 'quiff': return '<path d="M31 40 Q28 22 44 16 Q52 8 66 16 Q74 26 69 40 Q64 28 50 29 Q38 28 31 40Z" fill="' + c + '"/>';
      case 'buzz': return '<path d="M32 38 Q33 21 50 21 Q67 21 68 38 Q60 30 50 30 Q40 30 32 38Z" fill="' + c + '" opacity=".75"/>';
      case 'flattop': return '<path d="M30 40 L30 14 L70 14 L70 40 Q66 26 50 26 Q34 26 30 40Z" fill="' + c + '"/>';
      case 'bun': return '<circle cx="50" cy="14" r="7" fill="' + c + '"/><path d="M31 40 Q31 21 50 21 Q69 21 69 40 Q62 28 50 28 Q38 28 31 40Z" fill="' + c + '"/>';
      case 'curly': return '<g fill="' + c + '"><circle cx="36" cy="28" r="8"/><circle cx="46" cy="22" r="9"/><circle cx="57" cy="22" r="9"/><circle cx="65" cy="30" r="7"/><circle cx="32" cy="36" r="5"/><circle cx="68" cy="37" r="5"/></g>';
      case 'bald': return '<path d="M40 26 Q46 22 52 24" stroke="#fff" stroke-width="2" fill="none" opacity=".6" stroke-linecap="round"/>';
      case 'mullet': return '<path d="M31 42 Q29 20 50 19 Q71 20 69 42 L71 58 Q66 54 66 44 Q64 30 50 30 Q36 30 34 44 Q34 54 29 58 Z" fill="' + c + '"/>';
      default: return '';
    }
  }
  /* o: {bg, skin, hair, hairStyle, vest, glasses, beard, wide, lanyard, mouth} */
  function avatar(o) {
    o = o || {};
    var skin = o.skin || '#f3c7a5', vest = o.vest || '#1b6664', bg = o.bg || '#fab993';
    var sw = o.wide ? 50 : 36;
    var s = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" role="img" aria-label="' + (o.label || 'Executive headshot') + '">' +
      '<circle cx="50" cy="50" r="50" fill="' + bg + '"/>' +
      '<g clip-path="circle(50px at 50px 50px)">' +
      // shirt + vest
      '<path d="M' + (50 - sw) + ' 100 Q' + (50 - sw) + ' 72 50 70 Q' + (50 + sw) + ' 72 ' + (50 + sw) + ' 100Z" fill="#cfe6ff"/>' +
      '<path d="M' + (50 - sw) + ' 100 Q' + (50 - sw) + ' 73 40 71 L46 100Z M' + (50 + sw) + ' 100 Q' + (50 + sw) + ' 73 60 71 L54 100Z" fill="' + vest + '"/>' +
      '<path d="M46 100 L40 71 M54 100 L60 71" stroke="#0a1a1a" stroke-width="1.2" opacity=".4"/>' +
      (o.lanyard ? '<path d="M42 71 L50 90 L58 71" stroke="#ff3d7f" stroke-width="2.5" fill="none"/><rect x="45" y="88" width="10" height="12" rx="1.5" fill="#fff" stroke="#0a1a1a" stroke-width="1"/>' : '') +
      // neck + head
      '<rect x="43" y="56" width="14" height="16" fill="' + skin + '"/>' +
      '<ellipse cx="31" cy="46" rx="4" ry="6" fill="' + skin + '"/><ellipse cx="69" cy="46" rx="4" ry="6" fill="' + skin + '"/>' +
      '<ellipse cx="50" cy="44" rx="' + (o.wide ? 20 : 18) + '" ry="21" fill="' + skin + '"/>' +
      (o.beard ? '<path d="M33 48 Q35 66 50 66 Q65 66 67 48 Q62 58 50 58 Q38 58 33 48Z" fill="' + (o.hair || '#6b4a2b') + '"/>' : '') +
      hair(o.hairStyle || 'side', o.hair || '#6b4a2b') +
      // glasses or eyes
      (o.glasses === false
        ? '<circle cx="43" cy="44" r="2.2" fill="#0a1a1a"/><circle cx="57" cy="44" r="2.2" fill="#0a1a1a"/><path d="M39 39 l7 1 M54 40 l7 -1" stroke="#0a1a1a" stroke-width="1.4"/>'
        : '<path d="M31 42 L69 42" stroke="#0a1a1a" stroke-width="2"/><rect x="34" y="40" width="14" height="9" rx="4" fill="#0a1a1a"/><rect x="52" y="40" width="14" height="9" rx="4" fill="#0a1a1a"/><path d="M37 42 l4 0 M55 42 l4 0" stroke="#7fd8d4" stroke-width="1.5" stroke-linecap="round"/>') +
      // mouth
      ({ smirk: '<path d="M44 56 Q51 60 57 54" stroke="#0a1a1a" stroke-width="1.8" fill="none" stroke-linecap="round"/>',
         grin: '<path d="M42 54 Q50 62 58 54 Z" fill="#fff" stroke="#0a1a1a" stroke-width="1.5"/>',
         flat: '<path d="M44 56 L57 56" stroke="#0a1a1a" stroke-width="2" stroke-linecap="round"/>',
         nervous: '<path d="M43 57 q2 -2 4 0 q2 2 4 0 q2 -2 4 0" stroke="#0a1a1a" stroke-width="1.5" fill="none"/>' }[o.mouth || 'smirk']) +
      (o.cigar ? '<rect x="56" y="55" width="14" height="3" rx="1" fill="#6b3e1f"/><circle cx="71" cy="56.5" r="1.8" fill="#ff7a3d"/>' : '') +
      '</g></svg>';
    return s;
  }
  window.SnelAvatar = avatar;
  window.SNEL_PEOPLE = {
    chad:  { name: 'Chad Brockwell', acr: 'CVO', skin: '#f6cfb2', hair: '#e2b760', hairStyle: 'quiff', vest: '#3db0ad', bg: '#fab993', mouth: 'grin' },
    brad:  { name: 'Brad Hendricks', acr: 'CSO', skin: '#f1c3a0', hair: '#5a3b22', hairStyle: 'side', vest: '#0a1a1a', bg: '#7fd8d4', beard: true },
    todd:  { name: 'Todd Kessler', acr: 'CFamO', skin: '#f3c7a5', hair: '#9a9a9a', hairStyle: 'bald', vest: '#ff3d7f', bg: '#ffe14d', mouth: 'grin' },
    dirk:  { name: 'Dirk Steinmann', acr: 'CTO', skin: '#e9b48f', hair: '#3a2716', hairStyle: 'flattop', vest: '#1b6664', bg: '#ff3d7f', wide: true, mouth: 'flat', cigar: true },
    kyle:  { name: 'Kyle Brennan', acr: 'VPCB', skin: '#f6d2b8', hair: '#c47a3a', hairStyle: 'bun', vest: '#124746', bg: '#fab993' },
    jeff:  { name: 'Jeff Paulson', acr: 'CFO', skin: '#efc19e', hair: '#2b2b2b', hairStyle: 'buzz', vest: '#3db0ad', bg: '#ffe14d', mouth: 'flat' },
    greg:  { name: 'Greg Thompson', acr: 'CCO', skin: '#f3c7a5', hair: '#d9c27a', hairStyle: 'mullet', vest: '#ff3d7f', bg: '#7fd8d4', mouth: 'grin' },
    scott: { name: 'Scott Whitfield', acr: 'VPEV', skin: '#f1c3a0', hair: '#7a4b2a', hairStyle: 'curly', vest: '#0a1a1a', bg: '#fab993' },
    derek: { name: 'Derek Lindqvist', acr: 'CTLO', skin: '#f7d6bf', hair: '#f0e0a0', hairStyle: 'side', vest: '#124746', bg: '#ffe14d', beard: true },
    brian: { name: 'Brian', acr: 'INT', skin: '#f6cfb2', hair: '#8a5a33', hairStyle: 'side', vest: '#cfe6ff', bg: '#7fd8d4', glasses: false, lanyard: true, mouth: 'nervous' }
  };
  function boot() {
    document.querySelectorAll('[data-avatar]').forEach(function (el) {
      var p = window.SNEL_PEOPLE[el.getAttribute('data-avatar')];
      if (p) el.innerHTML = avatar(Object.assign({ label: p.name }, p));
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
