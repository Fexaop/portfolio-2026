/**
 * Pac-Man cross-site transition (portfolio @ pwnhub.in)
 *
 * portfolio → blog  (to-blog):
 *   Pac-Man faces RIGHT, runs right, eats candy.
 *   Red ghost is BEHIND (left) and closes in — hunting Pac-Man.
 *
 * blog → portfolio  (to-portfolio):
 *   Pac-Man faces RIGHT, runs right.
 *   Blue ghost is AHEAD (right); Pac-Man catches and "eats" it.
 *
 * Handoff: ?xsite=… + cookie Domain=.pwnhub.in
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

  function setHandoffCookie(direction) {
    try {
      document.cookie =
        "pwnhub_xsite=" +
        encodeURIComponent(direction) +
        "; Domain=.pwnhub.in; Path=/; Max-Age=90; SameSite=Lax";
    } catch (_) {}
  }

  function playPacmanTransition(url, direction) {
    if (document.getElementById("pwnhub-pacman-overlay")) return;

    const overlay = document.createElement("div");
    overlay.id = "pwnhub-pacman-overlay";
    overlay.setAttribute("role", "presentation");
    overlay.style.cssText =
      "position:fixed;inset:0;z-index:2147483646;background:#000;display:flex;align-items:center;justify-content:center;cursor:wait";

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cssW = Math.min(window.innerWidth, 960);
    const cssH = Math.min(Math.round(window.innerHeight * 0.48), 360);
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    canvas.style.width = cssW + "px";
    canvas.style.height = cssH + "px";
    overlay.appendChild(canvas);
    document.body.appendChild(overlay);
    document.documentElement.style.overflow = "hidden";

    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const W = cssW;
    const H = cssH;
    const cy = H * 0.5;
    const R = Math.max(18, Math.min(28, W * 0.034));

    // true = blog→portfolio (chase ghost). false = portfolio→blog (get hunted)
    const chaseGhost = direction === "to-portfolio";

    const laneL = W * 0.07;
    const laneR = W * 0.93;
    const pathLen = laneR - laneL - R * 3;

    // Candy — full path, bright yellow
    const candy = [];
    const n = 20;
    for (let i = 0; i < n; i++) {
      candy.push({
        x: laneL + R * 2.2 + (pathLen * i) / (n - 1),
        eaten: false,
        power: i === 0 || i === n - 1,
      });
    }

    const t0 = performance.now();
    let finished = false;

    function finish() {
      if (finished) return;
      finished = true;
      setHandoffCookie(direction);
      window.location.replace(withXSiteParam(url, direction));
    }
    const failSafe = window.setTimeout(finish, DURATION_MS + 500);

    function drawPac(x, y, mouth) {
      // Classic Pac-Man facing RIGHT
      const a = (0.2 + mouth * 0.35) * Math.PI;
      ctx.save();
      ctx.translate(x, y);
      ctx.fillStyle = "#ffcc00";
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, R, a, -a, false);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#111";
      ctx.beginPath();
      ctx.arc(R * 0.1, -R * 0.42, R * 0.13, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    /** Classic arcade ghost: dome + sides + 3 bottom waves + eyes */
    function drawGhost(x, y, bodyColor, lookRight, frightened) {
      const w = R * 1.75;
      const h = R * 2.15;
      const left = -w / 2;
      const right = w / 2;
      const top = -h * 0.48;
      const skirt = h * 0.38;
      const domeR = w / 2;

      ctx.save();
      ctx.translate(x, y);

      ctx.fillStyle = frightened ? "#2121ff" : bodyColor;
      ctx.beginPath();
      ctx.moveTo(left, skirt);
      ctx.lineTo(left, top + domeR);
      ctx.arc(0, top + domeR, domeR, Math.PI, 0, false);
      ctx.lineTo(right, skirt);
      // 3 bottom scallops (right → left)
      var waves = 3;
      var waveW = w / waves;
      for (var i = 0; i < waves; i++) {
        var x0 = right - i * waveW;
        var x1 = x0 - waveW / 2;
        var x2 = x0 - waveW;
        ctx.quadraticCurveTo(
          x0 - waveW * 0.25,
          skirt + waveW * 0.55,
          x1,
          skirt,
        );
        ctx.quadraticCurveTo(
          x2 + waveW * 0.25,
          skirt - waveW * 0.15,
          x2,
          skirt,
        );
      }
      ctx.closePath();
      ctx.fill();

      var eyeY = -h * 0.12;
      var eyeX = w * 0.22;
      var eyeRx = w * 0.14;
      var eyeRy = w * 0.17;

      if (frightened) {
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.arc(-eyeX, eyeY, eyeRx * 0.55, 0, Math.PI * 2);
        ctx.arc(eyeX, eyeY, eyeRx * 0.55, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#2121ff";
        ctx.beginPath();
        ctx.arc(-eyeX, eyeY, eyeRx * 0.28, 0, Math.PI * 2);
        ctx.arc(eyeX, eyeY, eyeRx * 0.28, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = Math.max(1.5, R * 0.1);
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.beginPath();
        var my = h * 0.12;
        ctx.moveTo(-w * 0.28, my);
        ctx.lineTo(-w * 0.14, my + R * 0.12);
        ctx.lineTo(0, my);
        ctx.lineTo(w * 0.14, my + R * 0.12);
        ctx.lineTo(w * 0.28, my);
        ctx.stroke();
      } else {
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.ellipse(-eyeX, eyeY, eyeRx, eyeRy, 0, 0, Math.PI * 2);
        ctx.ellipse(eyeX, eyeY, eyeRx, eyeRy, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#2121de";
        var look = lookRight ? eyeRx * 0.35 : -eyeRx * 0.35;
        var pupilR = eyeRx * 0.48;
        ctx.beginPath();
        ctx.arc(-eyeX + look, eyeY, pupilR, 0, Math.PI * 2);
        ctx.arc(eyeX + look, eyeY, pupilR, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }

    function drawEyes(x, y) {
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.ellipse(x - 8, y, 5.5, 6.5, 0, 0, Math.PI * 2);
      ctx.ellipse(x + 8, y, 5.5, 6.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#2121de";
      ctx.beginPath();
      ctx.arc(x - 6, y, 2.4, 0, Math.PI * 2);
      ctx.arc(x + 10, y, 2.4, 0, Math.PI * 2);
      ctx.fill();
    }

    function frame(now) {
      const t = Math.min(1, (now - t0) / DURATION_MS);
      const e = t * t * (3 - 2 * t);

      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, W, H);

      // corridor
      const top = cy - R * 2.7;
      const bot = cy + R * 2.7;
      ctx.strokeStyle = "#2121de";
      ctx.lineWidth = 4;
      ctx.strokeRect(laneL - 10, top - 6, laneR - laneL + 20, bot - top + 12);
      ctx.strokeStyle = "#1919a6";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(laneL, top);
      ctx.lineTo(laneR, top);
      ctx.moveTo(laneL, bot);
      ctx.lineTo(laneR, bot);
      ctx.stroke();

      // Pac always runs L→R
      const pacX = laneL + R * 1.6 + pathLen * e;
      const mouth = (Math.sin(now / 60) + 1) / 2;

      // Ghost placement
      let ghostX;
      let frightened = false;
      let eaten = false;

      if (chaseGhost) {
        // Ghost AHEAD (to the right of Pac-Man) — Pac-Man chases
        frightened = t > 0.25;
        const lead = R * 5 * (1 - e * 0.7) + R * 1.4;
        ghostX = Math.min(laneR - R, pacX + lead);
        if (t > 0.78) ghostX = pacX + R * 0.85;
        if (t > 0.88) eaten = true;
      } else {
        // Ghost BEHIND (to the left of Pac-Man) — hunts Pac-Man
        // Stay clearly behind the whole time, close the gap slowly
        const minGap = R * 2.8; // never overlap / never get ahead
        const startGap = R * 6.5;
        const gap = startGap - e * (startGap - minGap);
        ghostX = pacX - gap;
        // clamp so ghost stays on screen
        if (ghostX < laneL + R) ghostX = laneL + R;
      }

      // Candy (draw under characters)
      const biteX = pacX + R * 0.35;
      for (let i = 0; i < candy.length; i++) {
        const c = candy[i];
        // only eat dots Pac-Man has reached; leave dots behind ghost alone
        if (!c.eaten && biteX >= c.x) c.eaten = true;
        if (c.eaten) continue;
        // don't draw candy already "behind" pac if somehow still marked
        ctx.fillStyle = c.power ? "#ffb897" : "#ffcc66";
        ctx.beginPath();
        ctx.arc(c.x, cy, c.power ? R * 0.42 : R * 0.22, 0, Math.PI * 2);
        ctx.fill();
      }

      // Ghost then Pac (Pac on top)
      if (!eaten) {
        // hunting: look right (toward Pac). fleeing: look right (running away)
        drawGhost(ghostX, cy, "#ff0000", true, frightened);
      } else {
        drawEyes(ghostX + (t - 0.88) * 100, cy - 8);
      }

      drawPac(pacX, cy, mouth);

      ctx.fillStyle = "rgba(255,255,255,0.6)";
      ctx.font = "13px ui-monospace, Menlo, monospace";
      ctx.textAlign = "center";
      ctx.fillText(
        chaseGhost
          ? "→ portfolio  ·  Pac-Man eats the ghost"
          : "→ blog  ·  Pac-Man flees, ghost hunts from behind",
        W / 2,
        H - 14,
      );

      if (t < 1) requestAnimationFrame(frame);
      else {
        window.clearTimeout(failSafe);
        window.setTimeout(finish, 60);
      }
    }

    requestAnimationFrame(frame);
  }

  function wire() {
    document.querySelectorAll("[data-xsite-nav]").forEach(function (el) {
      el.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        playPacmanTransition(
          el.getAttribute("href") || BLOG_URL,
          el.getAttribute("data-xsite-nav") || "to-blog",
        );
      });
    });
  }

  /**
   * Arrival from blog: skip circle loader only.
   * NO black veil — that was stuck covering the whole site.
   */
  function handleArrivalFromBlog() {
    var fromBlog =
      document.documentElement.classList.contains("xsite-from-blog") ||
      document.documentElement.classList.contains("xsite-arrived");

    if (!fromBlog) {
      try {
        var params = new URLSearchParams(window.location.search);
        var dir = params.get(XSITE_QUERY);
        var cookieHit = /(?:^|;\s*)pwnhub_xsite=to-portfolio(?:;|$)/.test(
          document.cookie,
        );
        fromBlog =
          dir === "to-portfolio" || dir === "from-blog" || cookieHit;
        if (fromBlog) {
          document.documentElement.classList.add(
            "xsite-from-blog",
            "xsite-arrived",
          );
          params.delete(XSITE_QUERY);
          var q = params.toString();
          history.replaceState(
            null,
            "",
            location.pathname + (q ? "?" + q : "") + location.hash,
          );
        }
      } catch (_) {}
    }

    if (!fromBlog) return;

    try {
      document.cookie =
        "pwnhub_xsite=; Domain=.pwnhub.in; Path=/; Max-Age=0; SameSite=Lax";
      document.cookie = "pwnhub_xsite=; Path=/; Max-Age=0; SameSite=Lax";
    } catch (_) {}

    function killLoader() {
      document
        .querySelectorAll("[data-module='loader'], .site-loader")
        .forEach(function (el) {
          el.remove();
        });
      try {
        if (window.app && window.app.loader) {
          (window.app.loader.timeouts || []).forEach(clearTimeout);
          window.app.loader.timeouts = [];
          window.app.loader.circle = null;
        }
      } catch (_) {}
    }

    killLoader();
    var mo = new MutationObserver(killLoader);
    mo.observe(document.documentElement, { childList: true, subtree: true });
    setTimeout(function () {
      mo.disconnect();
      // Drop flags so CSS rules don't linger
      document.documentElement.classList.remove(
        "xsite-from-blog",
        "xsite-arrived",
        "xsite-ready",
      );
    }, 4000);
  }

  handleArrivalFromBlog();

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", wire);
  } else {
    wire();
  }

  window.pwnhubPacman = { play: playPacmanTransition };
})();
