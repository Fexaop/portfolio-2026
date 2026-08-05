/**
 * Pac-Man cross-site transition for pwnhub.in (portfolio).
 * Cross-origin handoff uses ?xsite=… query params (not sessionStorage).
 */
(function () {
  const BLOG_URL = "https://blog.pwnhub.in";
  const XSITE_QUERY = "xsite";
  const DURATION_MS = 2600;

  function withXSiteParam(url, direction) {
    try {
      const u = new URL(url, window.location.href);
      u.searchParams.set(XSITE_QUERY, direction);
      return u.toString();
    } catch (_) {
      const join = url.indexOf("?") >= 0 ? "&" : "?";
      return url + join + XSITE_QUERY + "=" + encodeURIComponent(direction);
    }
  }

  function playPacmanTransition(url, direction) {
    if (document.getElementById("pwnhub-pacman-overlay")) return;

    const overlay = document.createElement("div");
    overlay.id = "pwnhub-pacman-overlay";
    overlay.setAttribute("role", "presentation");
    overlay.style.cssText =
      "position:fixed;inset:0;z-index:2147483646;background:#000;display:flex;align-items:center;justify-content:center;cursor:wait";

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cssW = Math.min(window.innerWidth, 920);
    const cssH = Math.min(Math.round(window.innerHeight * 0.42), 320);
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    canvas.style.cssText = "width:" + cssW + "px;height:" + cssH + "px";
    overlay.appendChild(canvas);
    document.body.appendChild(overlay);
    document.documentElement.style.overflow = "hidden";

    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const w = cssW;
    const h = cssH;
    const cy = h * 0.48;
    const r = Math.max(14, Math.min(22, w * 0.028));

    const chase = direction === "to-portfolio";
    const pacStart = w * 0.1;
    const pacEnd = w * 0.82;

    const pellets = [];
    for (let i = 0; i < 16; i++) {
      pellets.push({ x: w * 0.18 + (w * 0.7 * i) / 15, eaten: false });
    }

    const t0 = performance.now();
    let navigated = false;

    const go = function () {
      if (navigated) return;
      navigated = true;
      window.location.href = withXSiteParam(url, direction);
    };

    const failSafe = window.setTimeout(go, DURATION_MS + 600);

    function drawPac(x, y, mouth) {
      const a = 0.2 + mouth * 0.35;
      ctx.save();
      ctx.translate(x, y);
      ctx.fillStyle = "#ffe14f";
      ctx.beginPath();
      ctx.moveTo(0, 0);
      // Face RIGHT
      ctx.arc(0, 0, r, a * Math.PI, (2 - a) * Math.PI, false);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#111";
      ctx.beginPath();
      ctx.arc(r * 0.08, -r * 0.42, r * 0.13, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    function drawGhost(x, y, body, frightened) {
      const gw = r * 1.75;
      const gh = r * 1.9;
      ctx.save();
      ctx.translate(x, y);
      ctx.fillStyle = frightened ? "#2121de" : body;
      ctx.beginPath();
      ctx.arc(0, -gh * 0.12, gw / 2, Math.PI, 0, false);
      ctx.lineTo(gw / 2, gh * 0.42);
      for (let i = 3; i >= 0; i--) {
        const sx = gw / 2 - (gw * i) / 3;
        const sy = gh * 0.42 + (i % 2 === 0 ? 0 : -gh * 0.14);
        ctx.lineTo(sx, sy);
      }
      ctx.closePath();
      ctx.fill();
      const ey = -gh * 0.18;
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.ellipse(-gw * 0.18, ey, gw * 0.14, gw * 0.16, 0, 0, Math.PI * 2);
      ctx.ellipse(gw * 0.18, ey, gw * 0.14, gw * 0.16, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = frightened ? "#fff" : "#2121de";
      const pupilShift = frightened ? 0.04 : -0.03;
      ctx.beginPath();
      ctx.arc(-gw * (0.14 - pupilShift), ey, gw * 0.07, 0, Math.PI * 2);
      ctx.arc(gw * (0.22 + pupilShift), ey, gw * 0.07, 0, Math.PI * 2);
      ctx.fill();
      if (frightened) {
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-gw * 0.28, gh * 0.12);
        ctx.quadraticCurveTo(-gw * 0.1, gh * 0.22, 0, gh * 0.12);
        ctx.quadraticCurveTo(gw * 0.1, gh * 0.02, gw * 0.28, gh * 0.12);
        ctx.stroke();
      }
      ctx.restore();
    }

    function drawEyesOnly(x, y) {
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.ellipse(x - 7, y - 4, 5, 6, 0, 0, Math.PI * 2);
      ctx.ellipse(x + 7, y - 4, 5, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#2121de";
      ctx.beginPath();
      ctx.arc(x - 5, y - 4, 2.2, 0, Math.PI * 2);
      ctx.arc(x + 9, y - 4, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }

    function frame(now) {
      const t = Math.min(1, (now - t0) / DURATION_MS);
      const e = t * t * (3 - 2 * t);

      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, w, h);

      ctx.strokeStyle = "#1a1ab0";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(w * 0.06, cy - r * 2.4);
      ctx.lineTo(w * 0.94, cy - r * 2.4);
      ctx.moveTo(w * 0.06, cy + r * 2.4);
      ctx.lineTo(w * 0.94, cy + r * 2.4);
      ctx.stroke();
      ctx.strokeStyle = "#2a2ad0";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(w * 0.05, cy - r * 2.55, w * 0.9, r * 5.1);

      const pacX = pacStart + (pacEnd - pacStart) * e;
      const mouth = (Math.sin(now / 70) + 1) / 2;

      for (let i = 0; i < pellets.length; i++) {
        const p = pellets[i];
        if (!p.eaten && pacX >= p.x - r * 0.2) p.eaten = true;
        if (!p.eaten) {
          ctx.fillStyle = "#ffb897";
          ctx.beginPath();
          ctx.arc(p.x, cy, Math.max(2.5, r * 0.16), 0, Math.PI * 2);
          ctx.fill();
        }
      }

      let ghostX;
      let ghostEaten = false;
      if (chase) {
        const ahead = 95 + r;
        ghostX = pacX + ahead * (1 - e * 0.85);
        if (ghostX < pacX + r * 0.9) ghostX = pacX + r * 0.9;
        if (t > 0.82) ghostX = pacX + r * 0.5;
        if (t > 0.9) ghostEaten = true;
      } else {
        const gap = 110 - e * 40;
        ghostX = pacX - gap;
      }

      const frightened = chase && t > 0.35 && !ghostEaten;
      if (!ghostEaten) {
        drawGhost(ghostX, cy, "#ff0000", frightened);
      } else {
        drawEyesOnly(ghostX + (t - 0.9) * 80, cy);
      }

      drawPac(pacX, cy, mouth);

      ctx.fillStyle = "rgba(255,255,255,0.5)";
      ctx.font = "12px ui-monospace, SFMono-Regular, Menlo, monospace";
      ctx.textAlign = "center";
      ctx.fillText(
        chase ? "pwnhub.in  →  portfolio" : "blog.pwnhub.in  →  lab notes",
        w / 2,
        h - 14,
      );

      if (t < 1) requestAnimationFrame(frame);
      else {
        window.clearTimeout(failSafe);
        window.setTimeout(go, 100);
      }
    }

    requestAnimationFrame(frame);
  }

  function wire() {
    document.querySelectorAll("[data-xsite-nav]").forEach(function (el) {
      el.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        const direction = el.getAttribute("data-xsite-nav") || "to-blog";
        const url = el.getAttribute("href") || BLOG_URL;
        playPacmanTransition(url, direction);
      });
    });
  }

  /**
   * Arrival from blog: ?xsite=to-portfolio
   * sessionStorage CANNOT work (different origins). Query param does.
   */
  function handleArrivalFromBlog() {
    var params;
    try {
      params = new URLSearchParams(window.location.search);
    } catch (_) {
      return;
    }
    var dir = params.get(XSITE_QUERY);
    if (dir !== "to-portfolio" && dir !== "from-blog") return;

    // Clean URL without reload
    try {
      params.delete(XSITE_QUERY);
      var q = params.toString();
      var clean =
        window.location.pathname + (q ? "?" + q : "") + window.location.hash;
      window.history.replaceState(null, "", clean || "/");
    } catch (_) {}

    document.documentElement.classList.add("xsite-from-blog", "xsite-arrived");

    function killLoader() {
      document.querySelectorAll("[data-module='loader']").forEach(function (el) {
        el.remove();
      });
      try {
        if (window.app && window.app.loader && window.app.loader.timeouts) {
          window.app.loader.timeouts.forEach(clearTimeout);
          window.app.loader.timeouts = [];
        }
        if (window.app && window.app.loader) {
          window.app.loader.circle = null;
        }
      } catch (_) {}
    }

    killLoader();
    var mo = new MutationObserver(killLoader);
    mo.observe(document.documentElement, { childList: true, subtree: true });
    window.setTimeout(function () {
      mo.disconnect();
    }, 10000);

    var lifted = false;
    function lift() {
      if (lifted) return;
      lifted = true;
      document.documentElement.classList.add("xsite-ready");
      window.setTimeout(function () {
        document.documentElement.classList.remove(
          "xsite-from-blog",
          "xsite-arrived",
          "xsite-ready",
        );
      }, 700);
    }

    // Lift when WebGL START fires, or body.started, or timeout
    var tries = 0;
    var poll = window.setInterval(function () {
      tries++;
      try {
        if (window.hey && window.hey.START) {
          window.clearInterval(poll);
          lift();
          return;
        }
      } catch (_) {}
      if (
        document.body &&
        document.body.classList.contains("started") &&
        tries > 12
      ) {
        window.clearInterval(poll);
        lift();
        return;
      }
      if (tries > 50) {
        window.clearInterval(poll);
        lift();
      }
    }, 80);

    window.setTimeout(lift, 5000);

    // Also listen if hey becomes available later
    window.addEventListener("load", function () {
      window.setTimeout(function () {
        try {
          if (window.hey && window.hey.START) lift();
        } catch (_) {}
      }, 200);
    });
  }

  // Run arrival ASAP (script is deferred — also called from head inline)
  handleArrivalFromBlog();
  window.__pwnhubHandleXSiteArrival = handleArrivalFromBlog;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", wire);
  } else {
    wire();
  }

  window.pwnhubPacman = { play: playPacmanTransition };
})();
