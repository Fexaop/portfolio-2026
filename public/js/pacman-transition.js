/**
 * Pac-Man cross-site transition for pwnhub.in
 *
 * to-blog (portfolio → blog):
 *   Pac-Man on the RIGHT of the ghost — eats yellow candy while red ghost CHASES from behind.
 *
 * to-portfolio (blog → portfolio):
 *   Pac-Man chases a blue frightened ghost ahead and "eats" it.
 *
 * Handoff: ?xsite=… query param (sessionStorage cannot cross origins).
 */
(function () {
  const BLOG_URL = "https://blog.pwnhub.in";
  const XSITE_QUERY = "xsite";
  const DURATION_MS = 2800;

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
    const cssW = Math.min(window.innerWidth, 960);
    const cssH = Math.min(Math.round(window.innerHeight * 0.45), 340);
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
    const R = Math.max(16, Math.min(26, W * 0.032)); // pac radius

    // to-blog = hunted (ghost behind). to-portfolio = chase (ghost ahead, blue)
    const isChase = direction === "to-portfolio";

    // Lane from left margin → right margin
    const laneL = W * 0.08;
    const laneR = W * 0.92;

    // Candy dots along the full lane (never pre-eaten)
    const candy = [];
    const candyCount = 18;
    for (let i = 0; i < candyCount; i++) {
      candy.push({
        x: laneL + R * 2 + ((laneR - laneL - R * 4) * i) / (candyCount - 1),
        eaten: false,
        power: i === 0 || i === candyCount - 1,
      });
    }

    const t0 = performance.now();
    let done = false;

    const finish = function () {
      if (done) return;
      done = true;
      try {
        document.cookie =
          "pwnhub_xsite=" +
          encodeURIComponent(direction) +
          "; Domain=.pwnhub.in; Path=/; Max-Age=90; SameSite=Lax";
      } catch (_) {}
      window.location.replace(withXSiteParam(url, direction));
    };
    const failSafe = window.setTimeout(finish, DURATION_MS + 700);

    /** Pac-Man facing +dx (right). mouth 0..1 */
    function drawPac(x, y, mouth) {
      const open = 0.18 + mouth * 0.32; // opening in π units
      ctx.save();
      ctx.translate(x, y);
      ctx.fillStyle = "#ffe14f";
      ctx.beginPath();
      ctx.moveTo(0, 0);
      // Canvas: 0 rad = right. Mouth opens on the right side.
      ctx.arc(0, 0, R, open * Math.PI, (2 - open) * Math.PI, false);
      ctx.closePath();
      ctx.fill();
      // eye on top
      ctx.fillStyle = "#111";
      ctx.beginPath();
      ctx.arc(R * 0.05, -R * 0.45, R * 0.14, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    /** Classic ghost. lookDir: -1 left, +1 right */
    function drawGhost(x, y, color, lookDir, frightened) {
      const gw = R * 1.85;
      const gh = R * 2.0;
      ctx.save();
      ctx.translate(x, y);

      // body
      ctx.fillStyle = frightened ? "#2121ff" : color;
      ctx.beginPath();
      ctx.arc(0, -gh * 0.15, gw / 2, Math.PI, 0, false);
      ctx.lineTo(gw / 2, gh * 0.4);
      // scalloped bottom (3 waves)
      const waves = 3;
      for (let i = waves; i >= 0; i--) {
        const t = i / waves;
        const sx = gw / 2 - gw * t;
        const sy = gh * 0.4 + (i % 2 === 0 ? 0 : -gh * 0.16);
        ctx.lineTo(sx, sy);
      }
      ctx.closePath();
      ctx.fill();

      // white eyes
      const ey = -gh * 0.2;
      const ex = gw * 0.2;
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.ellipse(-ex, ey, gw * 0.15, gw * 0.18, 0, 0, Math.PI * 2);
      ctx.ellipse(ex, ey, gw * 0.15, gw * 0.18, 0, 0, Math.PI * 2);
      ctx.fill();

      // pupils look in direction
      ctx.fillStyle = frightened ? "#ffffff" : "#2121de";
      const px = lookDir * gw * 0.06;
      ctx.beginPath();
      ctx.arc(-ex + px, ey, gw * 0.08, 0, Math.PI * 2);
      ctx.arc(ex + px, ey, gw * 0.08, 0, Math.PI * 2);
      ctx.fill();

      if (frightened) {
        ctx.strokeStyle = "#ffb8ff";
        ctx.lineWidth = 1.6;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(-gw * 0.3, gh * 0.08);
        ctx.quadraticCurveTo(-gw * 0.1, gh * 0.2, 0, gh * 0.08);
        ctx.quadraticCurveTo(gw * 0.1, -gh * 0.02, gw * 0.3, gh * 0.08);
        ctx.stroke();
      }

      ctx.restore();
    }

    function drawGhostEyes(x, y) {
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.ellipse(x - 8, y - 3, 6, 7, 0, 0, Math.PI * 2);
      ctx.ellipse(x + 8, y - 3, 6, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#2121de";
      ctx.beginPath();
      ctx.arc(x - 6, y - 3, 2.5, 0, Math.PI * 2);
      ctx.arc(x + 10, y - 3, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    function frame(now) {
      const t = Math.min(1, (now - t0) / DURATION_MS);
      const e = t * t * (3 - 2 * t); // smoothstep

      // clear
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, W, H);

      // maze corridor
      const railY1 = cy - R * 2.6;
      const railY2 = cy + R * 2.6;
      ctx.strokeStyle = "#2121de";
      ctx.lineWidth = 3.5;
      ctx.strokeRect(laneL - 8, railY1 - 4, laneR - laneL + 16, railY2 - railY1 + 8);
      ctx.strokeStyle = "#1919a6";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(laneL, railY1);
      ctx.lineTo(laneR, railY1);
      ctx.moveTo(laneL, railY2);
      ctx.lineTo(laneR, railY2);
      ctx.stroke();

      // --- positions ---
      // Pac-Man always moves left → right
      const pacX = laneL + R * 1.5 + (laneR - laneL - R * 3) * e;

      let ghostX;
      let ghostEaten = false;
      let ghostFrightened = false;
      let ghostLook = 1; // +1 right, -1 left

      if (isChase) {
        // Ghost flees ahead (to the RIGHT of Pac-Man)
        ghostFrightened = t > 0.28;
        ghostLook = 1;
        const lead = R * 4.5 * (1 - e * 0.75) + R * 1.2;
        ghostX = pacX + lead;
        if (t > 0.8) ghostX = pacX + R * 0.7;
        if (t > 0.88) ghostEaten = true;
      } else {
        // Ghost HUNTS from BEHIND (to the LEFT of Pac-Man) — Pac-Man is ahead
        ghostLook = 1; // looking right toward Pac-Man
        // start further back, close the gap over time but stay behind
        const gap = R * 5.5 - e * R * 2.2; // always > R*3
        ghostX = pacX - Math.max(gap, R * 3.2);
      }

      // candy — eat only when Pac-Man's mouth reaches the dot
      const mouthFront = pacX + R * 0.55;
      for (let i = 0; i < candy.length; i++) {
        const c = candy[i];
        if (!c.eaten && mouthFront >= c.x) c.eaten = true;
        if (c.eaten) continue;
        ctx.fillStyle = c.power ? "#ffb897" : "#ffb8ae";
        ctx.beginPath();
        ctx.arc(c.x, cy, c.power ? R * 0.38 : R * 0.2, 0, Math.PI * 2);
        ctx.fill();
      }

      // draw ghost under Pac-Man
      if (!ghostEaten) {
        drawGhost(
          ghostX,
          cy,
          "#ff0000",
          ghostLook,
          ghostFrightened,
        );
      } else {
        // eyes flee upward-right after being eaten
        drawGhostEyes(ghostX + (t - 0.88) * W * 0.15, cy - (t - 0.88) * 40);
      }

      // Pac-Man chomp
      const mouth = (Math.sin(now / 65) + 1) / 2;
      drawPac(pacX, cy, mouth);

      // label
      ctx.fillStyle = "rgba(255,255,255,0.55)";
      ctx.font = "13px ui-monospace, SFMono-Regular, Menlo, monospace";
      ctx.textAlign = "center";
      ctx.fillText(
        isChase
          ? "→  pwnhub.in  (chase the ghost)"
          : "→  blog.pwnhub.in  (ghost is hunting you)",
        W / 2,
        H - 16,
      );

      if (t < 1) {
        requestAnimationFrame(frame);
      } else {
        window.clearTimeout(failSafe);
        window.setTimeout(finish, 80);
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
        const href = el.getAttribute("href") || BLOG_URL;
        playPacmanTransition(href, direction);
      });
    });
  }

  function handleArrivalFromBlog() {
    var params;
    try {
      params = new URLSearchParams(window.location.search);
    } catch (_) {
      return;
    }
    var dir = params.get(XSITE_QUERY);
    if (dir !== "to-portfolio" && dir !== "from-blog") return;

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
        if (window.app && window.app.loader) window.app.loader.circle = null;
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
        tries > 15
      ) {
        window.clearInterval(poll);
        lift();
        return;
      }
      if (tries > 55) {
        window.clearInterval(poll);
        lift();
      }
    }, 80);
    window.setTimeout(lift, 5000);
  }

  handleArrivalFromBlog();

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", wire);
  } else {
    wire();
  }

  window.pwnhubPacman = { play: playPacmanTransition };
})();
