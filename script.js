(function () {
  'use strict';

  var dial = document.getElementById('dial');
  var hourHand = document.getElementById('hourHand');
  var minuteHand = document.getElementById('minuteHand');
  var secondHand = document.getElementById('secondHand');
  var digital = document.getElementById('digital');
  var dateEl = document.getElementById('date');

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
      digital.setAttribute('datetime', now.toISOString());
      dateEl.textContent = now.toLocaleDateString(undefined, {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
      });
    }
    requestAnimationFrame(tick);
  }

  tick();
})();
