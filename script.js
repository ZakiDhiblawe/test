(function () {
  'use strict';

  var clockEl = document.getElementById('clock');
  var ampmEl = document.getElementById('ampm');
  var dateEl = document.getElementById('date');
  var timezoneEl = document.getElementById('timezone');
  var toggleBtn = document.getElementById('formatToggle');
  var hourHand = document.getElementById('hourHand');
  var minuteHand = document.getElementById('minuteHand');
  var secondHand = document.getElementById('secondHand');

  var STORAGE_KEY = 'clock-format-24h';
  var use24h = true;

  try {
    var saved = localStorage.getItem(STORAGE_KEY);
    if (saved !== null) use24h = saved === 'true';
  } catch (e) { /* localStorage unavailable; keep default */ }

  function pad(n) {
    return n < 10 ? '0' + n : String(n);
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
      clockEl.textContent = pad(hours) + ':' + pad(minutes) + ':' + pad(seconds);
    } else {
      var h12 = hours % 12;
      if (h12 === 0) h12 = 12;
      ampmEl.hidden = false;
      ampmEl.textContent = hours < 12 ? 'AM' : 'PM';
      clockEl.textContent = pad(h12) + ':' + pad(minutes) + ':' + pad(seconds);
    }

    clockEl.setAttribute('datetime', now.toISOString());

    dateEl.textContent = now.toLocaleDateString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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

  showTimezone();
  updateToggleLabel();
  tick();
})();
