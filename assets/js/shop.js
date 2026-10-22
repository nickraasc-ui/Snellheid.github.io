/* Snellheid Company Store™ — made on demand, paid with PayPal, shipped by Printful. */
(function () {
  'use strict';
  // PayPal REST app client ID (public by design). Sandbox ID for testing, live ID when the boys can really order.
  var PAYPAL_CLIENT_ID = 'BAAdE4_wobZcpxYSTnbzMlKVVxrmAw90vWH6Izm5ZQHsKU-ZbjEJL4wb8Mgj4ugYtnTfKD8L0XcZbRQvzo'; // live

  // Shown until the shop_products table exists (and as the fallback if Supabase is unreachable).
  var PREVIEW = [
    { sku: 'mug-logo', name_en: 'Logo Mug', name_nl: 'Logomok', blurb_en: 'Snail-rocket on one side, "Moving fast. Circling back." on the other. 11 oz, dishwasher safe.', blurb_nl: 'Slak-raket aan de ene kant, "Moving fast. Circling back." aan de andere. 330 ml, vaatwasserbestendig.', image_url: 'assets/merch/mug-logo.jpg', max_qty: 5 },
    { sku: 'mug-email', name_en: '“Per my last email” Mug', name_nl: '“Per my last email”-mok', blurb_en: 'For meetings that could have been an email. Which is all of them.', blurb_nl: 'Voor vergaderingen die een mail hadden kunnen zijn. Dus allemaal.', image_url: 'assets/merch/mug-email.jpg', max_qty: 5 },
    { sku: 'sticker-logo', name_en: 'Snail-Rocket Sticker', name_nl: 'Slak-raket-sticker', blurb_en: 'Die-cut vinyl. Laptop, water bottle, Dirk’s forehead.', blurb_nl: 'Uitgesneden vinyl. Laptop, waterfles, het voorhoofd van Dirk.', image_url: 'assets/merch/sticker-logo.jpg', max_qty: 10 },
    { sku: 'sticker-motto', name_en: '“Moving Fast” Sticker', name_nl: '“Moving Fast”-sticker', blurb_en: 'The company motto, in sticker form. Legally binding.', blurb_nl: 'Het bedrijfsmotto, als sticker. Juridisch bindend.', image_url: 'assets/merch/sticker-motto.jpg', max_qty: 10 }
  ];

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function eur(n) { return '€' + (+n).toLocaleString(Snel.lang() === 'nl' ? 'nl-NL' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  var configured = PAYPAL_CLIENT_ID && PAYPAL_CLIENT_ID.indexOf('PASTE') !== 0;

  function card(p) {
    var L = Snel.lang(), live = configured && p.orderable;
    var opts = ''; for (var i = 1; i <= (p.max_qty || 5); i++) opts += '<option>' + i + '</option>';
    return '<article class="card product shop-item" data-sku="' + esc(p.sku) + '">' +
      '<img src="' + esc(p.image_url) + '" alt="' + esc(L === 'nl' ? p.name_nl : p.name_en) + '" loading="lazy" class="shop-img">' +
      '<h3>' + esc(L === 'nl' ? p.name_nl : p.name_en) + '</h3>' +
      '<p>' + esc(L === 'nl' ? p.blurb_nl : p.blurb_en) + '</p>' +
      (p.price_eur ? '<div class="row"><span class="price">' + eur(p.price_eur) + '</span><span class="fine">' + Snel.t({ en: 'incl. shipping · at cost', nl: 'incl. verzending · kostprijs' }) + '</span></div>' : '') +
      (live
        ? '<label class="fine" style="margin-top:12px">' + Snel.t({ en: 'Quantity', nl: 'Aantal' }) + ' <select class="shop-qty" style="width:auto;padding:4px 10px">' + opts + '</select></label><div class="pp-btn"></div>'
        : '<p class="badge" style="margin-top:12px">' + Snel.t({ en: 'Store opening soon', nl: 'Winkel opent binnenkort' }) + '</p>') +
      '</article>';
  }

  function loadPayPal(cb) {
    if (window.paypal) return cb();
    var s = document.createElement('script');
    s.src = 'https://www.paypal.com/sdk/js?client-id=' + encodeURIComponent(PAYPAL_CLIENT_ID) + '&currency=EUR&intent=capture&components=buttons';
    s.onload = cb;
    s.onerror = function () { Snel.toast(Snel.t({ en: '❌ PayPal could not be loaded. Try again later.', nl: '❌ PayPal kon niet geladen worden. Probeer het later opnieuw.' })); };
    document.head.appendChild(s);
  }

  function done(res) {
    var box = document.getElementById('shop-done');
    var ok = res && res.status === 'ok';
    box.innerHTML = ok
      ? Snel.t({ en: '🎉 <b>Order #' + res.order + ' placed.</b> It will be made just for you and shipped to the address in your PayPal account. Production + delivery can take up to 4 weeks. Patience is a core value.', nl: '🎉 <b>Bestelling #' + res.order + ' geplaatst.</b> Hij wordt speciaal voor jou gemaakt en verstuurd naar het adres in je PayPal-account. Productie + levering kan tot 4 weken duren. Geduld is een kernwaarde.' })
      : Snel.t({ en: '✅ <b>Payment received</b> (order #' + (res && res.order) + '). The factory needs a human to look at it, so this one may take a little longer. No action needed from you.', nl: '✅ <b>Betaling ontvangen</b> (bestelling #' + (res && res.order) + '). De fabriek heeft even een mens nodig, dus deze kan iets langer duren. Je hoeft niets te doen.' });
    box.hidden = false;
    box.scrollIntoView({ behavior: 'smooth', block: 'center' });
    Snel.confetti();
    Snel.bump(5, { en: 'Merch revenue recognised (at cost)', nl: 'Merch-omzet geboekt (tegen kostprijs)' });
  }

  function mountButtons(products) {
    products.forEach(function (p) {
      if (!p.orderable) return;
      var el = document.querySelector('.shop-item[data-sku="' + p.sku + '"]');
      if (!el) return;
      paypal.Buttons({
        style: { layout: 'horizontal', tagline: false, height: 45, label: 'pay' },
        createOrder: function () {
          var qty = +el.querySelector('.shop-qty').value || 1;
          return Snel.cloud('/functions/v1/shop', { method: 'POST', body: { action: 'create', sku: p.sku, qty: qty } }).then(function (r) { return r.id; });
        },
        onApprove: function (data) {
          return Snel.cloud('/functions/v1/shop', { method: 'POST', body: { action: 'capture', orderID: data.orderID } }).then(done, function () {
            Snel.toast(Snel.t({ en: '❌ Something went wrong after PayPal. If money left your account, we will sort it out — tell the family.', nl: '❌ Er ging iets mis na PayPal. Als er geld is afgeschreven, lossen we het op — laat het de familie weten.' }), 9000);
          });
        },
        onError: function () { Snel.toast(Snel.t({ en: '❌ Checkout failed. Nothing was charged.', nl: '❌ Afrekenen mislukt. Er is niets afgeschreven.' })); }
      }).render(el.querySelector('.pp-btn'));
    });
  }

  function boot() {
    var grid = document.getElementById('shop-grid');
    if (!grid) return;
    var products = PREVIEW;
    function render() {
      grid.innerHTML = products.map(card).join('');
      if (configured && products.some(function (p) { return p.orderable; })) loadPayPal(function () { mountButtons(products); });
    }
    render();
    Snel.cloud('/rest/v1/shop_products?select=sku,name_en,name_nl,blurb_en,blurb_nl,price_eur,image_url,max_qty,printful_sync_variant_id,printful_variant_id,print_file_url&order=sort').then(function (rows) {
      if (!rows || !rows.length) return;
      products = rows.map(function (r) { r.orderable = !!(r.printful_sync_variant_id || (r.printful_variant_id && r.print_file_url)); return r; });
      render();
    }, function () { /* table not set up yet: keep the preview */ });
    document.addEventListener('snel:lang', render);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
