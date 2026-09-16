/* =====================================================
   ChuksWRLD Logistics — gallery page
   Filtering, hover-preview for videos and a media lightbox.
   ===================================================== */

ready(function () {
  initGalleryFilters();
  initGalleryPreview();
  initLightbox();
});

/* ---------- Filters ---------- */

function initGalleryFilters() {
  var buttons = document.querySelectorAll('.filter-btn');
  var items = document.querySelectorAll('.gallery-item');
  if (!buttons.length) return;

  buttons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var filter = btn.getAttribute('data-filter');

      buttons.forEach(function (b) {
        var active = b === btn;
        b.classList.toggle('is-active', active);
        b.setAttribute('aria-pressed', active ? 'true' : 'false');
      });

      items.forEach(function (item) {
        var type = item.getAttribute('data-type');
        var show = filter === 'all' || type === filter;
        item.classList.toggle('is-hidden', !show);
      });
    });
  });
}

/* ---------- Gentle video preview on hover (desktop only, muted) ---------- */

function initGalleryPreview() {
  var canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (!canHover) return;

  document.querySelectorAll('.gallery-item video').forEach(function (video) {
    var figure = video.closest('.gallery-item');
    if (!figure) return;

    figure.addEventListener('mouseenter', function () {
      var attempt = video.play();
      if (attempt && typeof attempt.catch === 'function') attempt.catch(function () { /* autoplay blocked */ });
    });
    figure.addEventListener('mouseleave', function () {
      video.pause();
      try { video.currentTime = 0; } catch (err) { /* ignore */ }
    });
  });
}

/* ---------- Lightbox ---------- */

function initLightbox() {
  var box = document.getElementById('lightbox');
  if (!box) return;

  var content = box.querySelector('[data-lightbox-content]');
  var closeBtn = box.querySelector('[data-lightbox-close]');
  var lastFocus = null;

  function open(figure) {
    var src = figure.getAttribute('data-lightbox-src');
    var kind = figure.getAttribute('data-lightbox-kind');
    var caption = figure.getAttribute('data-lightbox-caption') || '';
    if (!src) return;

    lastFocus = document.activeElement;
    content.innerHTML = '';

    if (kind === 'video') {
      var video = document.createElement('video');
      video.src = src;
      video.controls = true;
      video.playsInline = true;
      video.autoplay = true;
      video.setAttribute('playsinline', '');
      video.setAttribute('webkit-playsinline', '');
      content.appendChild(video);
    } else {
      var img = document.createElement('img');
      img.src = src;
      img.alt = caption;
      content.appendChild(img);
    }

    var cap = document.createElement('p');
    cap.className = 'lightbox-caption';
    cap.textContent = caption;
    content.appendChild(cap);

    box.classList.add('is-open');
    document.body.classList.add('no-scroll');
    closeBtn.focus();
  }

  function close() {
    box.classList.remove('is-open');
    document.body.classList.remove('no-scroll');
    var playing = content.querySelector('video');
    if (playing) {
      playing.pause();
      playing.removeAttribute('src');
      playing.load();
    }
    content.innerHTML = '';
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  document.querySelectorAll('.gallery-item').forEach(function (figure) {
    figure.addEventListener('click', function () { open(figure); });
    figure.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        open(figure);
      }
    });
  });

  closeBtn.addEventListener('click', close);
  box.addEventListener('click', function (e) {
    if (e.target === box) close();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && box.classList.contains('is-open')) close();
  });
}
