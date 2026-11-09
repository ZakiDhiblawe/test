(function () {
  'use strict';

  var clockEl = document.getElementById('clock');
  var dateEl = document.getElementById('date');
  var timezoneEl = document.getElementById('timezone');

  function pad(n) {
    return n < 10 ? '0' + n : String(n);
  }

  function updateClock() {
    var now = new Date();

    var hours = pad(now.getHours());
    var minutes = pad(now.getMinutes());
    var seconds = pad(now.getSeconds());
    var timeString = hours + ':' + minutes + ':' + seconds;

    clockEl.textContent = timeString;
    clockEl.setAttribute('datetime', now.toISOString());

    dateEl.textContent = now.toLocaleDateString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  function showTimezone() {
    var tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Local time';
    timezoneEl.textContent = 'Time zone: ' + tz;
  }

  showTimezone();
  updateClock();
  setInterval(updateClock, 1000);
})();
