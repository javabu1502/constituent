/**
 * My Democracy campaign embed loader.
 *
 * Usage:
 *   <div data-mydemocracy-campaign="your-campaign-slug"></div>
 *   <script async src="https://www.mydemocracy.app/embed.js"></script>
 *
 * Renders each placeholder as an iframe of /embed/<slug> and keeps the
 * iframe sized to its content via postMessage from the embedded page.
 */
(function () {
  var scriptEl = document.currentScript;
  var ORIGIN = 'https://www.mydemocracy.app';
  if (scriptEl && scriptEl.src) {
    try {
      ORIGIN = new URL(scriptEl.src).origin;
    } catch (e) {
      /* keep production default */
    }
  }

  function init() {
    var nodes = document.querySelectorAll('[data-mydemocracy-campaign]:not([data-mydemocracy-loaded])');
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      var slug = el.getAttribute('data-mydemocracy-campaign');
      if (!slug) continue;

      var iframe = document.createElement('iframe');
      iframe.src = ORIGIN + '/embed/' + encodeURIComponent(slug);
      iframe.title = 'My Democracy campaign';
      iframe.loading = 'lazy';
      iframe.style.width = '100%';
      iframe.style.border = '0';
      iframe.style.display = 'block';
      iframe.style.minHeight = '480px';

      el.appendChild(iframe);
      el.setAttribute('data-mydemocracy-loaded', 'true');
    }
  }

  window.addEventListener('message', function (event) {
    if (event.origin !== ORIGIN) return;
    var data = event.data;
    if (!data || data.type !== 'mydemocracy:height' || typeof data.height !== 'number') return;

    var iframes = document.querySelectorAll('[data-mydemocracy-loaded] iframe');
    for (var i = 0; i < iframes.length; i++) {
      if (iframes[i].contentWindow === event.source) {
        iframes[i].style.height = data.height + 'px';
        iframes[i].style.minHeight = '0';
        break;
      }
    }
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
