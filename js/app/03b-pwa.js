/* ============================================================================
   03b-pwa.js — platform-aware "add to home screen" nudge (vanilla, no React)
   ----------------------------------------------------------------------------
   Shows a small, dismissible banner encouraging install:
     • Android/Chromium: uses the captured `beforeinstallprompt` → real Install
     • iOS Safari: shows the Share → "Add to Home Screen" tip
     • iOS in another browser (Chrome/in-app): nudges to open in Safari
   Only appears once the logged-in app UI (.enav) is mounted, only when not
   already installed, and never again after dismissal. Styling: .pwa-* in
   css/app.css. Self-contained; touches nothing else.
   ============================================================================ */
(function () {
  var KEY = "encore_pwa_dismissed";

  function standalone() {
    return (
      (window.matchMedia &&
        window.matchMedia("(display-mode: standalone)").matches) ||
      window.navigator.standalone === true
    );
  }
  if (standalone()) return;
  try {
    if (localStorage.getItem(KEY)) return;
  } catch (e) {}

  var ua = navigator.userAgent || "";
  var isIOS =
    /iphone|ipad|ipod/i.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  var isSafari = /^((?!chrome|crios|fxios|edgios|android).)*safari/i.test(ua);
  var deferredPrompt = null;

  window.addEventListener("beforeinstallprompt", function (e) {
    e.preventDefault();
    deferredPrompt = e;
  });

  var shown = false;
  function build() {
    if (shown || !document.querySelector(".enav")) return;

    var msg,
      canInstall = false;
    if (deferredPrompt) {
      msg = "Add Encore to your home screen for the full app feel.";
      canInstall = true;
    } else if (isIOS && isSafari) {
      msg =
        "Add Encore to your home screen: tap Share, then “Add to Home Screen.”";
    } else if (isIOS) {
      msg =
        "Open Encore in Safari, then Share → “Add to Home Screen” to install.";
    } else {
      return; // desktop / no install signal — nothing to nudge
    }

    shown = true;
    var bar = document.createElement("div");
    bar.className = "pwa-nudge";
    bar.innerHTML =
      '<span class="pwa-ic">🎫</span>' +
      '<span class="pwa-msg"></span>' +
      (canInstall ? '<button class="pwa-go">Install</button>' : "") +
      '<button class="pwa-x" aria-label="Dismiss">✕</button>';
    bar.querySelector(".pwa-msg").textContent = msg;
    document.body.appendChild(bar);
    requestAnimationFrame(function () {
      bar.classList.add("in");
    });

    function dismiss() {
      bar.classList.remove("in");
      try {
        localStorage.setItem(KEY, "1");
      } catch (e) {}
      setTimeout(function () {
        if (bar.parentNode) bar.parentNode.removeChild(bar);
      }, 320);
    }
    bar.querySelector(".pwa-x").addEventListener("click", dismiss);
    var go = bar.querySelector(".pwa-go");
    if (go)
      go.addEventListener("click", function () {
        if (deferredPrompt) {
          deferredPrompt.prompt();
          deferredPrompt = null;
        }
        dismiss();
      });
  }

  // Wait until the app UI is up, then show after a beat so it isn't jarring.
  var tries = 0;
  var timer = setInterval(function () {
    tries++;
    if (document.querySelector(".enav")) {
      clearInterval(timer);
      setTimeout(build, 4000);
    } else if (tries > 40) {
      clearInterval(timer); // ~40s and never logged in — give up quietly
    }
  }, 1000);
})();
