(function () {
  'use strict';

  var dial = document.getElementById('dial');
  var hourHand = document.getElementById('hourHand');
  var minuteHand = document.getElementById('minuteHand');
  var secondHand = document.getElementById('secondHand');
  var digital = document.getElementById('digital');
  var dateEl = document.getElementById('date');
  var phaseEl = document.getElementById('phase');
  var rootStyle = document.documentElement.style;

  // Consistent check: if any required element is missing, stop quietly.
  if (!dial || !hourHand || !minuteHand || !secondHand || !digital || !dateEl || !phaseEl) {
    return;
  }

  // Build minute/hour ticks and numerals
  var frag = document.createDocumentFragment();
  for (var i = 0; i < 60; i++) {
    var t = document.createElement('div');
    t.className = 'tick' + (i % 5 === 0 ? ' major' : '');
    t.style.transform = 'rotate(' + i * 6 + 'deg)';
    frag.appendChild(t);
  }
  for (var n = 1; n <= 12; n++) {
    var el = document.createElement('div');
    el.className = 'num';
    el.textContent = n;
    var a = n * 30 * Math.PI / 180;
    el.style.transform = 'translate(' + (Math.sin(a) * 35) + 'cqw,' + (-Math.cos(a) * 35) + 'cqw)';
    frag.appendChild(el);
  }
  dial.insertBefore(frag, dial.firstChild);

  function pad(v) { return v < 10 ? '0' + v : '' + v; }

  // ---- Sun / sky -------------------------------------------------------
  // Everything below is derived from these two constants.
  var SUNRISE = 6, SUNSET = 18;

  // Phase boundaries (hours)
  var SUNRISE_END = SUNRISE + 2;   // morning glow ends
  var SUNSET_START = SUNSET - 1.5; // evening glow begins
  var NIGHT_START = SUNSET + 1.5;  // fully night
  var NIGHT_END = SUNRISE - 0.5;   // night ends
  // Stars/moon fade length and offsets
  var NIGHT_FADE = 1.2;
  var NIGHT_FADE_IN = SUNSET + 0.3;  // stars start appearing
  var NIGHT_FADE_OUT = SUNRISE - 0.3; // stars fully gone at this hour

  // Optional debug override: index.html?hour=14 or ?hour=17.5 (affects the sky only)
  var override = parseFloat(new URLSearchParams(window.location.search).get('hour'));
  var hasOverride = !isNaN(override);

  // [hour, r, g, b, photo brightness] - multiply tint over the photo
  var SKY = [
    [0, 70, 90, 150, 0.5],
    [SUNRISE - 1.5, 80, 100, 160, 0.55],
    [SUNRISE - 0.5, 255, 150, 110, 0.8],
    [SUNRISE + 1, 255, 205, 165, 0.95],
    [SUNRISE + 3, 255, 245, 235, 1],
    [(SUNRISE + SUNSET) / 2, 255, 255, 255, 1.05],
    [SUNSET - 3, 255, 250, 240, 1],
    [SUNSET - 1, 255, 210, 160, 0.95],
    [SUNSET + 0.2, 255, 140, 90, 0.8],
    [NIGHT_START, 90, 95, 150, 0.55],
    [24, 70, 90, 150, 0.5]
  ];

  function lerp(a, b, k) { return a + (b - a) * k; }

  function sky(h) {
    for (var i = 1; i < SKY.length; i++) {
      if (h <= SKY[i][0]) {
        var p = SKY[i - 1], q = SKY[i];
        var k = (h - p[0]) / (q[0] - p[0]);
        return [lerp(p[1], q[1], k), lerp(p[2], q[2], k), lerp(p[3], q[3], k), lerp(p[4], q[4], k)];
      }
    }
    return SKY[SKY.length - 1].slice(1);
  }

  function clamp01(v) { return Math.max(0, Math.min(1, v)); }

  function phaseFor(h) {
    if (h < NIGHT_END || h >= NIGHT_START) return 'night';
    if (h < SUNRISE_END) return 'sunrise';
    if (h < SUNSET_START) return 'day';
    return 'sunset';
  }

  function updateSky(h) {
    var p = (h - SUNRISE) / (SUNSET - SUNRISE); // 0 at sunrise, 1 at sunset
    var up = p >= 0 && p <= 1;
    var x = 0.08 + 0.84 * clamp01(p);
    var y = 0.8 - 0.62 * Math.sin(Math.PI * clamp01(p)); // low at horizon, high at noon
    var c = sky(h);
    var night = h >= (SUNRISE + SUNSET) / 2
      ? clamp01((h - NIGHT_FADE_IN) / NIGHT_FADE)
      : clamp01((NIGHT_FADE_OUT - h) / NIGHT_FADE);

    rootStyle.setProperty('--sun-x', x.toFixed(4));
    rootStyle.setProperty('--sun-y', y.toFixed(4));
    rootStyle.setProperty('--sun-o', up ? '1' : '0');
    rootStyle.setProperty('--night', night.toFixed(3));
    rootStyle.setProperty('--sky-tint', 'rgb(' + Math.round(c[0]) + ',' + Math.round(c[1]) + ',' + Math.round(c[2]) + ')');
    rootStyle.setProperty('--photo-bright', c[3].toFixed(3));

    phaseEl.textContent = phaseFor(h);
  }

  var lastSecond = -1;

  function tick() {
    var now = new Date(); // local machine time
    var ms = now.getMilliseconds();
    var s = now.getSeconds() + ms / 1000;
    var m = now.getMinutes() + s / 60;
    var h = (now.getHours() % 12) + m / 60;

    secondHand.style.transform = 'rotate(' + s * 6 + 'deg)';
    minuteHand.style.transform = 'rotate(' + m * 6 + 'deg)';
    hourHand.style.transform = 'rotate(' + h * 30 + 'deg)';

    if (now.getSeconds() !== lastSecond) {
      lastSecond = now.getSeconds();
      digital.textContent = pad(now.getHours()) + ':' + pad(now.getMinutes()) + ':' + pad(lastSecond);
      digital.removeAttribute('datetime');
      dateEl.textContent = now.toLocaleDateString(undefined, {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
      });
      updateSky(hasOverride ? ((override % 24) + 24) % 24 : now.getHours() + now.getMinutes() / 60 + lastSecond / 3600);
    }
    requestAnimationFrame(tick);
  }

  tick();
})();
