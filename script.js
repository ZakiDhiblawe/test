(function () {
  'use strict';

  var body = document.body;
  var hhEl = document.getElementById('hh');
  var mmEl = document.getElementById('mm');
  var ssEl = document.getElementById('ss');
  var clockEl = document.getElementById('clock');
  var ampmEl = document.getElementById('ampm');
  var dateEl = document.getElementById('date');
  var timezoneEl = document.getElementById('timezone');
  var toggleBtn = document.getElementById('formatToggle');
  var hourHand = document.getElementById('hourHand');
  var minuteHand = document.getElementById('minuteHand');
  var secondHand = document.getElementById('secondHand');
  var sunEl = document.getElementById('sun');
  var moonEl = document.getElementById('moon');

  var reduceMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var STORAGE_KEY = 'clock-format-24h';
  var use24h = true;

  try {
    var saved = localStorage.getItem(STORAGE_KEY);
    if (saved !== null) use24h = saved === 'true';
  } catch (e) { /* localStorage unavailable; keep default */ }

  function rand(min, max) {
    return min + Math.random() * (max - min);
  }

  function pad(n) {
    return n < 10 ? '0' + n : String(n);
  }

  // ---------- Scene building ----------

  function buildPines(hostId, count, minH, maxH, color, minDur, maxDur) {
    var host = document.getElementById(hostId);
    if (!host) return;
    var frag = document.createDocumentFragment();
    for (var i = 0; i < count; i++) {
      var el = document.createElement('div');
      var h = rand(minH, maxH);
      el.className = 'pine';
      el.style.height = h.toFixed(0) + 'px';
      el.style.width = (h * 0.45).toFixed(0) + 'px';
      el.style.left = rand(-2, 100).toFixed(1) + '%';
      el.style.background = color;
      el.style.animationDuration = rand(minDur, maxDur).toFixed(2) + 's';
      el.style.animationDelay = (-rand(0, 6)).toFixed(2) + 's';
      frag.appendChild(el);
    }
    host.appendChild(frag);
  }

  function buildForest() {
    buildPines('forestFar', 30, 90, 150, '#21503f', 6, 8);
    buildPines('forestMid', 20, 150, 230, '#173d2f', 5, 7);
    buildPines('forestNear', 12, 220, 330, '#0e2c20', 4, 6);
  }

  function buildStars() {
    var host = document.getElementById('stars');
    if (!host) return;
    var frag = document.createDocumentFragment();
    for (var i = 0; i < 90; i++) {
      var s = document.createElement('div');
      s.className = 'star';
      s.style.left = rand(0, 100).toFixed(1) + '%';
      s.style.top = rand(0, 70).toFixed(1) + '%';
      s.style.animationDelay = (-rand(0, 3)).toFixed(2) + 's';
      s.style.animationDuration = rand(2, 4).toFixed(2) + 's';
      frag.appendChild(s);
    }
    host.appendChild(frag);
  }

  function buildFireflies() {
    var host = document.getElementById('fireflies');
    if (!host || reduceMotion) return;
    var frag = document.createDocumentFragment();
    for (var i = 0; i < 22; i++) {
      var f = document.createElement('div');
      f.className = 'firefly';
      f.style.left = rand(5, 95).toFixed(1) + '%';
      f.style.top = rand(45, 90).toFixed(1) + '%';
      f.style.animationDuration = rand(8, 14).toFixed(2) + 's, ' + rand(2, 3.5).toFixed(2) + 's';
      f.style.animationDelay = (-rand(0, 10)).toFixed(2) + 's, ' + (-rand(0, 3)).toFixed(2) + 's';
      frag.appendChild(f);
    }
    host.appendChild(frag);
  }

  function buildLeaves() {
    var host = document.getElementById('leaves');
    if (!host || reduceMotion) return;
    var colors = ['#e0892b', '#c94f1f', '#e8b339', '#8fbf4a'];
    var frag = document.createDocumentFragment();
    for (var i = 0; i < 16; i++) {
      var l = document.createElement('div');
      l.className = 'leaf';
      l.style.left = rand(0, 100).toFixed(1) + '%';
      l.style.background = colors[i % colors.length];
      l.style.animationDuration = rand(9, 16).toFixed(2) + 's';
      l.style.animationDelay = (-rand(0, 16)).toFixed(2) + 's';
      frag.appendChild(l);
    }
    host.appendChild(frag);
  }

  // ---------- Time-of-day phase ----------

  function getPhase(hour) {
    if (hour >= 5 && hour < 7) return 'dawn';
    if (hour >= 7 && hour < 17) return 'day';
    if (hour >= 17 && hour < 20) return 'dusk';
    return 'night';
  }

  var currentPhase = '';

  function applyPhase(now) {
    var p = getPhase(now.getHours());
    if (p !== currentPhase) {
      currentPhase = p;
      body.className = 'phase-' + p;
    }
  }

  function setPos(el, x, y) {
    el.style.setProperty('--x', x.toFixed(1) + '%');
    el.style.setProperty('--y', y.toFixed(1) + '%');
  }

  // Sun arcs across 06:00-18:00, moon arcs across 19:00-05:00.
  function placeCelestial(now) {
    var hr = now.getHours() + now.getMinutes() / 60;
    var t = Math.min(Math.max((hr - 6) / 12, 0), 1);
    setPos(sunEl, 8 + t * 84, 72 - Math.sin(t * Math.PI) * 58);

    var n = Math.min(Math.max(((hr - 19 + 24) % 24) / 10, 0), 1);
    setPos(moonEl, 8 + n * 84, 72 - Math.sin(n * Math.PI) * 58);
  }

  // ---------- Clock ----------

  function setText(el, value) {
    if (el.textContent !== value) el.textContent = value;
  }

  // Re-triggers a flip animation whenever the seconds value changes.
  function setFlip(el, value) {
    if (el.textContent !== value) {
      el.textContent = value;
      el.classList.remove('flip');
      void el.offsetWidth; // force reflow so the animation restarts
      el.classList.add('flip');
    }
  }

  function updateToggleLabel() {
    toggleBtn.textContent = use24h ? 'Switch to 12-hour' : 'Switch to 24-hour';
  }

  function updateDigital(now) {
    var hours = now.getHours();
    var minutes = now.getMinutes();
    var seconds = now.getSeconds();

    if (use24h) {
      ampmEl.hidden = true;
      setText(hhEl, pad(hours));
    } else {
      var h12 = hours % 12;
      if (h12 === 0) h12 = 12;
      ampmEl.hidden = false;
      setText(ampmEl, hours < 12 ? 'AM' : 'PM');
      setText(hhEl, pad(h12));
    }

    setText(mmEl, pad(minutes));
    setFlip(ssEl, pad(seconds));

    clockEl.setAttribute('datetime', now.toISOString());

    setText(dateEl, now.toLocaleDateString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }));
  }

  function updateAnalog(now) {
    var s = now.getSeconds() + now.getMilliseconds() / 1000;
    var m = now.getMinutes() + s / 60;
    var h = (now.getHours() % 12) + m / 60;

    secondHand.style.transform = 'translateX(-50%) rotate(' + s * 6 + 'deg)';
    minuteHand.style.transform = 'translateX(-50%) rotate(' + m * 6 + 'deg)';
    hourHand.style.transform = 'translateX(-50%) rotate(' + h * 30 + 'deg)';
  }

  function showTimezone() {
    var tz = 'Local time';
    try {
      tz = Intl.DateTimeFormat().resolvedOptions().timeZone || tz;
    } catch (e) { /* ignore */ }

    var offsetMin = -new Date().getTimezoneOffset();
    var sign = offsetMin >= 0 ? '+' : '-';
    var abs = Math.abs(offsetMin);
    var offset = 'UTC' + sign + pad(Math.floor(abs / 60)) + ':' + pad(abs % 60);

    timezoneEl.textContent = 'Time zone: ' + tz + ' (' + offset + ')';
  }

  // Drift-free scheduler: re-align each tick to the next second boundary.
  function tick() {
    var now = new Date();
    updateDigital(now);
    updateAnalog(now);
    applyPhase(now);
    placeCelestial(now);
    setTimeout(tick, 1000 - now.getMilliseconds());
  }

  toggleBtn.addEventListener('click', function () {
    use24h = !use24h;
    try {
      localStorage.setItem(STORAGE_KEY, String(use24h));
    } catch (e) { /* ignore */ }
    updateToggleLabel();
    var now = new Date();
    updateDigital(now);
    updateAnalog(now);
  });

  buildForest();
  buildStars();
  buildFireflies();
  buildLeaves();
  showTimezone();
  updateToggleLabel();
  tick();
})();
