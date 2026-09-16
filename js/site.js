/* =====================================================
   ChuksWRLD Logistics — shared site script
   Handles: navigation, floating WhatsApp dock, the
   multi-step "Book Now" assistant and WhatsApp deep links.
   ===================================================== */

var SITE = {
  brand: 'ChuksWRLD Logistics',
  tagline: 'We Move It. You Relax.',
  phoneDisplay: '+44 7845 072105',
  phoneTel: '+447845072105',
  whatsapp: '447845072105',
  email: 'chukswrld@gmail.com',
  instagram: 'chukswrld_logistics',
  instagramUrl: 'https://www.instagram.com/chukswrld_logistics/',
  companyNumber: '17263579',
  registeredOffice: '35 Kenninghall View, Sheffield, England, S2 3WX'
};

/* ---------- Small helpers ---------- */

function waLink(message) {
  var base = 'https://wa.me/' + SITE.whatsapp;
  if (message) base += '?text=' + encodeURIComponent(message);
  return base;
}

function defaultWaMessage() {
  return 'Hello ' + SITE.brand + ', I would like a free quote please.\n\n' +
    'Service needed: \n' +
    'Moving from: \n' +
    'Moving to: \n' +
    'Preferred date: \n' +
    'Anything else: ';
}

function ready(fn) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fn);
  } else {
    fn();
  }
}

function trackEvent(name, payload) {
  /* Single place to hook analytics later. */
  if (window.console && console.debug) {
    console.debug('[track]', name, payload || '');
  }
}

/* ---------- Navigation ---------- */

function initNav() {
  var toggle = document.querySelector('.nav-toggle');
  var links = document.getElementById('primary-nav');
  var header = document.querySelector('.site-header');

  if (toggle && links) {
    toggle.addEventListener('click', function () {
      var open = links.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.innerHTML = open
        ? '<i class="fa-solid fa-xmark" aria-hidden="true"></i>'
        : '<i class="fa-solid fa-bars" aria-hidden="true"></i>';
    });

    links.addEventListener('click', function (e) {
      if (e.target.closest('a')) {
        links.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.innerHTML = '<i class="fa-solid fa-bars" aria-hidden="true"></i>';
      }
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') links.classList.remove('is-open');
    });
  }

  if (header) {
    var onScroll = function () {
      header.classList.toggle('is-stuck', window.scrollY > 8);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }
}

/* ---------- Floating WhatsApp dock ---------- */

function initDock() {
  var dock = document.querySelector('.wa-dock');
  if (!dock) return;

  var hint = dock.querySelector('.wa-hint');
  if (hint) {
    window.setTimeout(function () {
      hint.style.transition = 'opacity .5s ease, transform .5s ease';
      hint.style.opacity = '0';
      hint.style.transform = 'translateY(6px)';
      window.setTimeout(function () { hint.style.display = 'none'; }, 600);
    }, 9000);
  }
}

/* =====================================================
   BOOKING ASSISTANT
   ===================================================== */

var BOOKING_STEPS = 5;

var SERVICE_OPTIONS = [
  { value: 'House Move', emoji: '🏠', label: 'House Move', hint: 'Full or part moves, big or small' },
  { value: 'Single Item Collection & Delivery', emoji: '📦', label: 'Single Item', hint: 'From a chair to a wardrobe' },
  { value: 'IKEA / B&Q / Store Collection', emoji: '🛒', label: 'Store Collection', hint: 'IKEA, B&Q & more — we collect' },
  { value: 'Facebook Marketplace Collection', emoji: '📱', label: 'Facebook Marketplace', hint: 'Bought something online? We collect it' },
  { value: 'eBay / Gumtree Pickup', emoji: '🛍️', label: 'eBay / Gumtree Pickup', hint: 'Fast, reliable and secure' },
  { value: 'Student Move', emoji: '🎓', label: 'Student Move', hint: 'Affordable moves for students' },
  { value: 'Airport Luggage Transport', emoji: '✈️', label: 'Airport Luggage', hint: 'On time, every time' },
  { value: 'Something else', emoji: '💬', label: 'Something Else', hint: 'Tell us what you need' }
];

var PROPERTY_OPTIONS = [
  { value: 'Single item / small load', label: 'Single item or small load', hint: 'Fits in a van with room to spare' },
  { value: 'Studio / 1 bedroom', label: 'Studio / 1 bedroom', hint: 'Around 10–15 boxes' },
  { value: '2 bedrooms', label: '2 bedrooms', hint: 'Around 25–35 boxes' },
  { value: '3+ bedrooms', label: '3+ bedrooms', hint: 'Larger loads & multiple trips' },
  { value: 'Office / commercial', label: 'Office / commercial', hint: 'Desks, chairs, equipment' }
];

var HELP_OPTIONS = [
  { value: 'Yes please — help loading & unloading', label: 'Yes, help us load & unload', hint: 'Our crew does the heavy lifting' },
  { value: 'Loading only', label: 'Loading only', hint: 'We load, you unload' },
  { value: 'Unloading only', label: 'Unloading only', hint: 'You load, we unload' },
  { value: 'No thank you — transport only', label: 'No thanks — transport only', hint: 'You handle the lifting' }
];

var TIME_OPTIONS = [
  { value: 'Morning (8am – 12pm)', label: 'Morning', hint: '8am – 12pm' },
  { value: 'Afternoon (12pm – 5pm)', label: 'Afternoon', hint: '12pm – 5pm' },
  { value: 'Evening (5pm – 9pm)', label: 'Evening', hint: '5pm – 9pm' },
  { value: 'Flexible / not sure yet', label: 'Flexible', hint: 'We will find a slot that suits' }
];

var STAIRS_OPTIONS = [
  { value: 'Ground floor / no stairs', label: 'Ground floor drive-up', hint: 'No stairs' },
  { value: 'Upper floor without lift', label: 'Upper floor, no lift', hint: 'Please mention the floor in notes' },
  { value: 'Upper floor with lift', label: 'Upper floor with lift', hint: 'Lift available' },
  { value: 'Not applicable', label: 'Not applicable', hint: 'Item collection or luggage' }
];

var booking = {
  step: 1,
  data: {
    service: '',
    moving_from: '',
    moving_to: '',
    move_date: '',
    time_slot: '',
    property_size: '',
    stairs: '',
    loading_help: '',
    name: '',
    phone: '',
    email: '',
    notes: ''
  }
};

function optionMarkup(list, name, selected) {
  return list.map(function (opt) {
    var id = name + '-' + opt.value.replace(/[^a-z0-9]+/gi, '-').toLowerCase();
    var checked = selected === opt.value ? ' checked' : '';
    return '' +
      '<label class="option" for="' + id + '">' +
        '<input type="radio" id="' + id + '" name="' + name + '" value="' + escapeAttr(opt.value) + '"' + checked + '>' +
        '<span class="tick" aria-hidden="true"><i class="fa-solid fa-check"></i></span>' +
        '<span>' +
          (opt.emoji ? '<span class="opt-emoji" aria-hidden="true">' + opt.emoji + '</span> ' : '') +
          '<strong>' + opt.label + '</strong>' +
          (opt.hint ? '<small>' + opt.hint + '</small>' : '') +
        '</span>' +
      '</label>';
  }).join('');
}

function escapeAttr(str) {
  return String(str).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

function buildBookingModal() {
  var wrap = document.createElement('div');
  wrap.className = 'modal';
  wrap.id = 'booking-modal';
  wrap.setAttribute('role', 'dialog');
  wrap.setAttribute('aria-modal', 'true');
  wrap.setAttribute('aria-labelledby', 'booking-modal-title');

  var today = new Date();
  var min = today.toISOString().slice(0, 10);

  wrap.innerHTML = '' +
  '<div class="modal-card">' +
    '<header class="modal-head">' +
      '<img class="modal-logo" src="images/logo.jpg" alt="' + SITE.brand + ' logo">' +
      '<div>' +
        '<h2 id="booking-modal-title">Book your move</h2>' +
        '<p>Answer a few quick questions — we send it straight to WhatsApp.</p>' +
      '</div>' +
      '<button type="button" class="modal-close" data-close-modal aria-label="Close booking form">' +
        '<i class="fa-solid fa-xmark" aria-hidden="true"></i>' +
      '</button>' +
    '</header>' +

    '<div class="progress-wrap">' +
      '<div class="progress-bar"><div class="progress-fill" data-progress></div></div>' +
      '<div class="progress-meta">' +
        '<span data-progress-label>Step 1 of ' + BOOKING_STEPS + '</span>' +
        '<span>Free quote • No obligation</span>' +
      '</div>' +
    '</div>' +

    '<div class="modal-body">' +
      '<div class="form-error" data-booking-error role="alert">' +
        '<i class="fa-solid fa-circle-exclamation" aria-hidden="true"></i>' +
        '<span data-error-text>Please complete the highlighted question.</span>' +
      '</div>' +

      /* Step 1 — service */
      '<section class="step-panel" data-step="1">' +
        '<h3>What do you need moved?</h3>' +
        '<p class="step-help">Pick the service that fits best — you can add details later.</p>' +
        '<div class="option-grid">' + optionMarkup(SERVICE_OPTIONS, 'service', booking.data.service) + '</div>' +
      '</section>' +

      /* Step 2 — route */
      '<section class="step-panel" data-step="2">' +
        '<h3>Where are we moving from and to?</h3>' +
        '<p class="step-help">A town, city or postcode is perfect. We cover all four UK nations.</p>' +
        '<div class="field-row">' +
          '<div class="field">' +
            '<label for="bk-from">Moving from <span class="req">*</span></label>' +
            '<input type="text" id="bk-from" data-field="moving_from" placeholder="e.g. Sheffield, S2" autocomplete="address-level2">' +
          '</div>' +
          '<div class="field">' +
            '<label for="bk-to">Moving to <span class="req">*</span></label>' +
            '<input type="text" id="bk-to" data-field="moving_to" placeholder="e.g. Manchester, M1" autocomplete="address-level2">' +
          '</div>' +
        '</div>' +
        '<div class="field">' +
          '<label for="bk-date">Preferred moving date <span class="req">*</span></label>' +
          '<input type="date" id="bk-date" data-field="move_date" min="' + min + '">' +
        '</div>' +
        '<div class="field">' +
          '<label>Preferred time of day</label>' +
          '<div class="option-grid">' + optionMarkup(TIME_OPTIONS, 'time_slot', booking.data.time_slot) + '</div>' +
        '</div>' +
      '</section>' +

      /* Step 3 — size & access */
      '<section class="step-panel" data-step="3">' +
        '<h3>How big is the job?</h3>' +
        '<p class="step-help">This helps us quote accurately and bring the right van and crew.</p>' +
        '<div class="field">' +
          '<label>Size of move</label>' +
          '<div class="option-grid">' + optionMarkup(PROPERTY_OPTIONS, 'property_size', booking.data.property_size) + '</div>' +
        '</div>' +
        '<div class="field">' +
          '<label>Access at either end</label>' +
          '<div class="option-grid">' + optionMarkup(STAIRS_OPTIONS, 'stairs', booking.data.stairs) + '</div>' +
        '</div>' +
        '<div class="field">' +
          '<label>Would you like us to help load and unload?</label>' +
          '<div class="option-grid">' + optionMarkup(HELP_OPTIONS, 'loading_help', booking.data.loading_help) + '</div>' +
        '</div>' +
      '</section>' +

      /* Step 4 — contact */
      '<section class="step-panel" data-step="4">' +
        '<h3>How should we reach you?</h3>' +
        '<p class="step-help">We reply fast on WhatsApp — usually within the hour.</p>' +
        '<div class="field-row">' +
          '<div class="field">' +
            '<label for="bk-name">Your name <span class="req">*</span></label>' +
            '<input type="text" id="bk-name" data-field="name" placeholder="e.g. Chukwudi Onuorah" autocomplete="name">' +
          '</div>' +
          '<div class="field">' +
            '<label for="bk-phone">Phone / WhatsApp <span class="req">*</span></label>' +
            '<input type="tel" id="bk-phone" data-field="phone" placeholder="e.g. 07845 072105" autocomplete="tel">' +
          '</div>' +
        '</div>' +
        '<div class="field">' +
          '<label for="bk-email">Email <span class="req">*</span></label>' +
          '<input type="email" id="bk-email" data-field="email" placeholder="you@example.com" autocomplete="email">' +
        '</div>' +
        '<div class="field">' +
          '<label for="bk-notes">Anything we should know?</label>' +
          '<textarea id="bk-notes" data-field="notes" placeholder="Lift access, fragile items, a piano, assembly needed, storage on route…"></textarea>' +
        '</div>' +
      '</section>' +

      /* Step 5 — review */
      '<section class="step-panel" data-step="5">' +
        '<h3>Check and send</h3>' +
        '<p class="step-help">This is the message we will send. You can edit it in WhatsApp before sending.</p>' +
        '<div class="summary-box"><table class="summary-table" data-summary></table></div>' +
        '<div class="preview-message">' +
          '<h4><i class="fa-brands fa-whatsapp" aria-hidden="true"></i> WhatsApp message preview</h4>' +
          '<pre data-preview></pre>' +
        '</div>' +
      '</section>' +
    '</div>' +

    '<footer class="modal-foot">' +
      '<button type="button" class="btn btn-outline-navy" data-prev hidden>' +
        '<i class="fa-solid fa-arrow-left" aria-hidden="true"></i> Back' +
      '</button>' +
      '<span class="spacer"></span>' +
      '<button type="button" class="btn btn-wa" data-next>' +
        'Continue <i class="fa-solid fa-arrow-right" aria-hidden="true"></i>' +
      '</button>' +
    '</footer>' +
  '</div>';

  document.body.appendChild(wrap);
  return wrap;
}

function bookingSummaryRows() {
  var d = booking.data;
  return [
    ['Service', d.service],
    ['Moving from', d.moving_from],
    ['Moving to', d.moving_to],
    ['Preferred date', d.move_date],
    ['Preferred time', d.time_slot || 'Flexible'],
    ['Size of move', d.property_size || 'Not specified'],
    ['Access', d.stairs || 'Not specified'],
    ['Loading help', d.loading_help || 'Not specified'],
    ['Name', d.name],
    ['Phone', d.phone],
    ['Email', d.email],
    ['Notes', d.notes || '—']
  ];
}

function composeBookingMessage() {
  var d = booking.data;
  var lines = [];
  lines.push('*NEW BOOKING REQUEST*');
  lines.push('*' + SITE.brand + '*');
  lines.push('--------------------------------');
  lines.push('*Service:* ' + d.service);
  lines.push('*Moving from:* ' + d.moving_from);
  lines.push('*Moving to:* ' + d.moving_to);
  lines.push('*Preferred date:* ' + d.move_date);
  lines.push('*Preferred time:* ' + (d.time_slot || 'Flexible'));
  lines.push('*Size of move:* ' + (d.property_size || 'Not specified'));
  lines.push('*Access:* ' + (d.stairs || 'Not specified'));
  lines.push('*Load & unload help:* ' + (d.loading_help || 'Not specified'));
  lines.push('--------------------------------');
  lines.push('*Name:* ' + d.name);
  lines.push('*Phone:* ' + d.phone);
  lines.push('*Email:* ' + d.email);
  if (d.notes) lines.push('*Notes:* ' + d.notes);
  lines.push('--------------------------------');
  lines.push('Sent from the ' + SITE.brand + ' website booking assistant.');
  return lines.join('\n');
}

function saveBookingRecord(message) {
  if (typeof fetch !== 'function') return Promise.resolve(null);
  var payload = {
    name: booking.data.name,
    phone: booking.data.phone,
    email: booking.data.email,
    service_type: booking.data.service,
    moving_from: booking.data.moving_from,
    moving_to: booking.data.moving_to,
    move_date: booking.data.move_date,
    time_slot: booking.data.time_slot,
    property_size: booking.data.property_size,
    stairs: booking.data.stairs,
    loading_help: booking.data.loading_help,
    notes: booking.data.notes,
    status: 'new'
  };
  return fetch('tables/booking_enquiries', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }).then(function (res) {
    return res.ok ? res.json() : null;
  }).catch(function () {
    /* Never block the WhatsApp hand-off if storage is unavailable. */
    return null;
  });
}

function initBooking() {
  var root = document.getElementById('booking-modal') || buildBookingModal();
  var panels = root.querySelectorAll('.step-panel');
  var progress = root.querySelector('[data-progress]');
  var progressLabel = root.querySelector('[data-progress-label]');
  var prevBtn = root.querySelector('[data-prev]');
  var nextBtn = root.querySelector('[data-next]');
  var errorBox = root.querySelector('[data-booking-error]');
  var errorText = root.querySelector('[data-error-text]');
  var summaryTable = root.querySelector('[data-summary]');
  var preview = root.querySelector('[data-preview]');
  var lastFocus = null;

  function showError(msg) {
    errorText.textContent = msg;
    errorBox.classList.add('is-visible');
  }
  function clearError() {
    errorBox.classList.remove('is-visible');
  }

  function syncFields() {
    root.querySelectorAll('[data-field]').forEach(function (el) {
      booking.data[el.getAttribute('data-field')] = el.value.trim();
    });
    root.querySelectorAll('input[type="radio"]:checked').forEach(function (el) {
      var name = el.getAttribute('name');
      if (name in booking.data) booking.data[name] = el.value;
    });
  }

  function paint() {
    panels.forEach(function (p) {
      p.classList.toggle('is-active', Number(p.getAttribute('data-step')) === booking.step);
    });

    var pct = ((booking.step - 1) / (BOOKING_STEPS - 1)) * 100;
    progress.style.width = Math.max(8, pct) + '%';
    progressLabel.textContent = 'Step ' + booking.step + ' of ' + BOOKING_STEPS;

    prevBtn.hidden = booking.step === 1;

    if (booking.step === BOOKING_STEPS) {
      nextBtn.innerHTML = '<i class="fa-brands fa-whatsapp" aria-hidden="true"></i> Send on WhatsApp';
      nextBtn.classList.add('btn-block');
      var rows = bookingSummaryRows();
      summaryTable.innerHTML = rows.map(function (r) {
        return '<tr><th scope="row">' + r[0] + '</th><td>' + (escapeAttr(r[1]) || '—') + '</td></tr>';
      }).join('');
      preview.textContent = composeBookingMessage();
    } else {
      nextBtn.innerHTML = 'Continue <i class="fa-solid fa-arrow-right" aria-hidden="true"></i>';
      nextBtn.classList.remove('btn-block');
    }

    var body = root.querySelector('.modal-body');
    if (body) body.scrollTop = 0;
  }

  function validateStep() {
    var d = booking.data;
    if (booking.step === 1 && !d.service) return 'Please choose the service you need.';
    if (booking.step === 2) {
      if (!d.moving_from) return 'Please tell us where the move starts.';
      if (!d.moving_to) return 'Please tell us where you are moving to.';
      if (!d.move_date) return 'Please choose a preferred moving date.';
    }
    if (booking.step === 4) {
      if (!d.name) return 'Please add your name so we know who to reply to.';
      if (!d.phone || d.phone.replace(/[^0-9]/g, '').length < 9) return 'Please add a valid phone or WhatsApp number.';
      if (!d.email || d.email.indexOf('@') < 1) return 'Please add a valid email address.';
    }
    return '';
  }

  function openModal() {
    lastFocus = document.activeElement;
    root.classList.add('is-open');
    document.body.classList.add('no-scroll');
    booking.step = 1;
    clearError();
    paint();
    var first = root.querySelector('.modal-close');
    if (first) first.focus();
    trackEvent('booking_open');
  }

  function closeModal() {
    root.classList.remove('is-open');
    document.body.classList.remove('no-scroll');
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  nextBtn.addEventListener('click', function () {
    syncFields();
    clearError();

    if (booking.step === BOOKING_STEPS) {
      var message = composeBookingMessage();
      nextBtn.disabled = true;
      nextBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i> Opening WhatsApp…';
      saveBookingRecord(message).then(function () {
        trackEvent('booking_send', booking.data);
        window.open(waLink(message), '_blank', 'noopener');
        nextBtn.disabled = false;
        paint();
      });
      return;
    }

    var problem = validateStep();
    if (problem) {
      showError(problem);
      return;
    }
    booking.step += 1;
    paint();
  });

  prevBtn.addEventListener('click', function () {
    syncFields();
    clearError();
    if (booking.step > 1) {
      booking.step -= 1;
      paint();
    }
  });

  root.addEventListener('click', function (e) {
    if (e.target === root || e.target.closest('[data-close-modal]')) closeModal();
    var jump = e.target.closest('[data-open-booking]');
    if (jump) { e.preventDefault(); openModal(); }
  });

  root.addEventListener('change', function () {
    syncFields();
    clearError();
    if (booking.step === BOOKING_STEPS) paint();
  });

  root.addEventListener('input', function () {
    syncFields();
    if (booking.step === BOOKING_STEPS) paint();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && root.classList.contains('is-open')) closeModal();
  });

  /* Any element with [data-open-booking] anywhere on the page opens the assistant. */
  document.addEventListener('click', function (e) {
    var trigger = e.target.closest('[data-open-booking]');
    if (trigger) {
      e.preventDefault();
      openModal();
    }
  });

  window.ChuksWRLD = { openBooking: openModal, closeBooking: closeModal, data: booking };
}

/* ---------- Live QR code pointing at WhatsApp ---------- */

function initQr() {
  var boxes = document.querySelectorAll('[data-wa-qr]');
  if (!boxes.length || typeof QRCode === 'undefined') return;
  var link = waLink(defaultWaMessage());
  boxes.forEach(function (box) {
    var canvas = document.createElement('canvas');
    box.appendChild(canvas);
    try {
      QRCode.toCanvas(canvas, link, { width: 190, margin: 1, color: { dark: '#0a1b3d', light: '#ffffff' } });
    } catch (err) {
      box.innerHTML = '<img src="https://api.qrserver.com/v1/create-qr-code/?size=190x190&data=' + encodeURIComponent(link) + '" alt="QR code linking to WhatsApp chat">';
    }
  });
}

/* ---------- WhatsApp anchors + call links ---------- */

function initWaAnchors() {
  document.querySelectorAll('[data-wa]').forEach(function (a) {
    var kind = a.getAttribute('data-wa');
    if (kind === 'default') a.href = waLink(defaultWaMessage());
    else if (kind === 'plain') a.href = waLink('Hello ' + SITE.brand + ', I have a question about a move.');
    else if (kind === 'quote') a.href = waLink('Hello ' + SITE.brand + ', please can I have a quote for: ');
  });
  document.querySelectorAll('[data-tel]').forEach(function (a) {
    a.href = 'tel:' + SITE.phoneTel;
  });
  document.querySelectorAll('[data-mail]').forEach(function (a) {
    a.href = 'mailto:' + SITE.email;
  });
  document.querySelectorAll('[data-year]').forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });
}

/* ---------- Testimonials: duplicate the static list so the loop is seamless ---------- */

function initTestimonials() {
  var track = document.querySelector('.testimonial-track');
  if (!track) return;
  var cards = Array.prototype.slice.call(track.children);
  if (!cards.length) return;
  cards.forEach(function (card) {
    var clone = card.cloneNode(true);
    clone.setAttribute('aria-hidden', 'true');
    track.appendChild(clone);
  });
}

/* ---------- Boot ---------- */

ready(function () {
  initNav();
  initDock();
  initBooking();
  initQr();
  initWaAnchors();
  initTestimonials();
});
