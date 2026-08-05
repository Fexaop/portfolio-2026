/**
 * Pac-Man cross-site transition (portfolio ↔ blog).
 * - to-blog: Pac-Man runs RIGHT eating pellets, ghost hunts from behind
 * - to-portfolio: Pac-Man runs RIGHT chasing & eating the ghost
 * Always faces the direction of travel (right).
 */
(function () {
  const XSITE_KEY = "pwnhub-xsite";
  const SKIP_LOADER_KEY = "pwnhub-skip-loader";
  const BLOG_URL = "https://blog.pwnhub.in";
  const DURATION_MS = 2400;

  function playPacmanTransition(url, direction) {
    if (document.getElementById("pwnhub-pacman-overlay")) return;

    const overlay = document.createElement("div");
    overlay.id = "pwnhub-pacman-overlay";
    overlay.setAttribute("role", "presentation");
    overlay.style.cssText =
      "position:fixed;inset:0;z-index:2147483646;background:#000;display:flex;align-items:center;justify-content:center;cursor:wait";

    const canvas = document.createElement("canvas");
    canvas.width = Math.min(window.innerWidth, 960);
    canvas.height = Math.min(window.innerHeight, 360);
    canvas.style.cssText = "width:min(100vw,960px);height:auto;max-height:50vh";
    overlay.appendChild(canvas);
    document.body.appendChild(overlay);
    document.documentElement.style.overflow = "hidden";

    const ctx = canvas.getContext("2d");
    const w = canvas.width;
    const h = canvas.height;
    const cy = h / 2;
    const scale = Math.max(0.7, Math.min(w / 640, 1.4));
    const r = 18 * scale;

    const reverse = direction === "to-portfolio";
    const pacStart = w * 0.12;
    const pacEnd = w * 0.78;

    const pellets = [];
    const pelletStart = w * 0.2;
    const pelletEnd = w * 0.85;
    for (let i = 0; i < 14; i++) {
      pellets.push({
        x: pelletStart + ((pelletEnd - pelletStart) * i) / 13,
        eaten: false,
      });
    }

    const t0 = performance.now();
    let navigated = false;

    const go = () => {
      if (navigated) return;
      navigated = true;
      try {
        // Always face-right eating animation; store direction for arrival soft-land
        sessionStorage.setItem(XSITE_KEY, direction);
        if (direction === "to-blog") {
          sessionStorage.removeItem(SKIP_LOADER_KEY);
        }
      } catch (_) {}
      window.location.href = url;
    };

    const failSafe = window.setTimeout(go, DURATION_MS + 800);

    function drawPac(x, y, mouth) {
      const open = 0.22 + mouth * 0.38;
      ctx.fillStyle = "#ffe14f";
      ctx.beginPath();
      // Face RIGHT
      ctx.arc(x, y, r, open * Math.PI, (2 - open) * Math.PI, false);
      ctx.lineTo(x, y);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#111";
      ctx.beginPath();
      ctx.arc(x + r * 0.12, y - r * 0.38, r * 0.12, 0, Math.PI * 2);
      ctx.fill();
    }

    function drawGhost(x, y, color, frightened) {
      const gh = r * 1.85;
      const gw = r * 1.7;
      ctx.fillStyle = frightened ? "#2121ff" : color;
      ctx.beginPath();
      ctx.arc(x, y - gh * 0.15, gw / 2, Math.PI, 0, false);
      ctx.lineTo(x + gw / 2, y + gh * 0.45);
      for (let i = 4; i >= 0; i--) {
        const sx = x + gw / 2 - (gw * i) / 4;
        const sy = y + gh * 0.45 + (i % 2 === 0 ? 0 : -gh * 0.12);
        ctx.lineTo(sx, sy);
      }
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#fff";
      const eyeY = y - gh * 0.2;
      ctx.beginPath();
      ctx.ellipse(x - gw * 0.18, eyeY, gw * 0.12, gw * 0.15, 0, 0, Math.PI * 2);
      ctx.ellipse(x + gw * 0.18, eyeY, gw * 0.12, gw * 0.15, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = frightened ? "#fff" : "#2121de";
      ctx.beginPath();
      ctx.arc(x - gw * 0.12, eyeY, gw * 0.06, 0, Math.PI * 2);
      ctx.arc(x + gw * 0.24, eyeY, gw * 0.06, 0, Math.PI * 2);
      ctx.fill();
    }

    function frame(now) {
      const t = Math.min(1, (now - t0) / DURATION_MS);
      const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, w, h);

      ctx.strokeStyle = "#2121de";
      ctx.lineWidth = 3 * scale;
      ctx.beginPath();
      ctx.moveTo(w * 0.08, cy - r * 2.2);
      ctx.lineTo(w * 0.92, cy - r * 2.2);
      ctx.moveTo(w * 0.08, cy + r * 2.2);
      ctx.lineTo(w * 0.92, cy + r * 2.2);
      ctx.stroke();

      const pacX = pacStart + (pacEnd - pacStart) * e;
      const mouth = (Math.sin(now / 80) + 1) / 2;

      for (const p of pellets) {
        if (!p.eaten && pacX + r * 0.5 >= p.x) p.eaten = true;
        if (!p.eaten) {
          ctx.fillStyle = "#ffb8ae";
          ctx.beginPath();
          ctx.arc(p.x, cy, 3.5 * scale, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      let ghostX;
      if (reverse) {
        ghostX =
          pacStart + 100 * scale + (pacEnd - pacStart) * Math.min(1, e * 0.92);
        if (t > 0.78) ghostX = pacX + r * 0.55;
      } else {
        ghostX = pacX - 100 * scale + e * 32 * scale;
      }

      const frightened = reverse && t > 0.5;
      if (!(reverse && t > 0.88)) {
        drawGhost(ghostX, cy, "#ff0000", frightened);
      } else {
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.arc(ghostX - 6, cy - 4, 4 * scale, 0, Math.PI * 2);
        ctx.arc(ghostX + 6, cy - 4, 4 * scale, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#2121de";
        ctx.beginPath();
        ctx.arc(ghostX - 4, cy - 4, 2 * scale, 0, Math.PI * 2);
        ctx.arc(ghostX + 8, cy - 4, 2 * scale, 0, Math.PI * 2);
        ctx.fill();
      }

      drawPac(pacX, cy, mouth);

      ctx.fillStyle = "rgba(255,255,255,0.55)";
      ctx.font = `${12 * scale}px ui-monospace, monospace`;
      ctx.textAlign = "center";
      ctx.fillText(
        reverse
          ? "pwnhub.in  →  chasing the stack"
          : "blog.pwnhub.in  →  writing mode",
        w / 2,
        h - 16 * scale,
      );

      if (t < 1) requestAnimationFrame(frame);
      else {
        window.clearTimeout(failSafe);
        window.setTimeout(go, 120);
      }
    }

    requestAnimationFrame(frame);
  }

  function wire() {
    document.querySelectorAll("[data-xsite-nav]").forEach((el) => {
      el.addEventListener("click", (e) => {
        e.preventDefault();
        const direction = el.getAttribute("data-xsite-nav") || "to-blog";
        const url = el.getAttribute("href") || BLOG_URL;
        // Leaving portfolio for blog: mark so blog can soft-land
        try {
          if (direction === "to-blog") {
            sessionStorage.setItem(XSITE_KEY, "to-blog");
          }
        } catch (_) {}
        playPacmanTransition(url, direction);
      });
    });
  }

  // ── Arrival on portfolio from blog: kill loader, keep black veil ─────────
  function handleArrivalFromBlog() {
    let fromBlog = false;
    try {
      fromBlog =
        sessionStorage.getItem(SKIP_LOADER_KEY) === "1" ||
        sessionStorage.getItem(XSITE_KEY) === "to-portfolio";
      if (fromBlog) {
        sessionStorage.removeItem(SKIP_LOADER_KEY);
        // keep XSITE_KEY until veil lifts (optional)
        sessionStorage.removeItem(XSITE_KEY);
      }
    } catch (_) {}

    if (!fromBlog) return;

    document.documentElement.classList.add("xsite-from-blog", "xsite-arrived");

    const killLoader = () => {
      document.querySelectorAll("[data-module='loader']").forEach((el) => {
        el.remove();
      });
      // stop any scheduled progress ticks
      try {
        if (window.app && window.app.loader && window.app.loader.timeouts) {
          window.app.loader.timeouts.forEach(clearTimeout);
          window.app.loader.timeouts = [];
        }
      } catch (_) {}
    };

    killLoader();
    // Keep killing if React/Astro re-hydrates or module re-adds it
    const mo = new MutationObserver(killLoader);
    mo.observe(document.documentElement, { childList: true, subtree: true });
    window.setTimeout(() => mo.disconnect(), 8000);

    // Lift black veil when site is ready (START) or after fallback timeout
    const lift = () => {
      document.documentElement.classList.add("xsite-ready");
      window.setTimeout(() => {
        document.documentElement.classList.remove(
          "xsite-from-blog",
          "xsite-arrived",
          "xsite-ready",
        );
      }, 700);
    };

    // Poll for hey.START if available
    let tries = 0;
    const poll = window.setInterval(() => {
      tries++;
      try {
        if (window.hey && window.hey.START) {
          window.clearInterval(poll);
          lift();
          return;
        }
      } catch (_) {}
      // Also lift if body has started class (app boot)
      if (document.body && document.body.classList.contains("started") && tries > 8) {
        window.clearInterval(poll);
        lift();
      }
      if (tries > 40) {
        window.clearInterval(poll);
        lift();
      }
    }, 100);

    // Absolute fallback
    window.setTimeout(lift, 4500);
  }

  handleArrivalFromBlog();

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", wire);
  } else {
    wire();
  }

  window.pwnhubPacman = { play: playPacmanTransition };
})();
