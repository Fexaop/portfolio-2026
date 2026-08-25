/**
 * Pac-Man cross-site transition (portfolio).
 * Uses Dale Harvey–style arcade engine in pacman-arcade.js
 */
(function () {
  var BLOG_URL = "https://blog.pwnhub.in";
  var XSITE_QUERY = "xsite";
  var VIEW_START = 500;
  var EXPAND_MS = 1400;
  var INTRO_MS = 3800;
  var BLOCK = 26;
  var TICK_MS = 1000 / 30;

  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }
  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function withXSiteParam(url, direction) {
    try {
      var u = new URL(url, window.location.href);
      u.searchParams.set(XSITE_QUERY, direction);
      return u.toString();
    } catch (_) {
      var join = url.indexOf("?") >= 0 ? "&" : "?";
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
    if (!window.PwnhubArcade) {
      document.body.style.overflow = "hidden";
      var miss = document.createElement("div");
      miss.style.cssText =
        "position:fixed;inset:0;z-index:2147483647;background:#000;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;font-family:Monaco,Menlo,monospace;color:#ffcc00";
      miss.innerHTML =
        '<div style="letter-spacing:.14em">LOADING</div><div style="color:#fff">going to blog…</div>';
      document.body.appendChild(miss);
      window.setTimeout(function () {
        setHandoffCookie(direction);
        window.location.replace(withXSiteParam(url, direction));
      }, 500);
      return;
    }

    if (document.activeElement && document.activeElement.blur) {
      document.activeElement.blur();
    }

    var A = window.PwnhubArcade;
    var game = A.createArcade();
    var WORLD_W = game.worldW(BLOCK);
    var WORLD_H = game.worldH(BLOCK);

    var overlay = document.createElement("div");
    overlay.id = "pwnhub-pacman-overlay";
    overlay.setAttribute("role", "application");
    overlay.tabIndex = -1;
    overlay.style.cssText =
      "position:fixed;inset:0;z-index:2147483646;background:#000;display:flex;align-items:center;justify-content:center;outline:none;touch-action:none";

    var frame = document.createElement("div");
    frame.style.cssText =
      "display:flex;flex-direction:column;align-items:center;gap:8px";

    var destEarly = direction === "to-blog" ? "blog" : "portfolio";
    var banner = document.createElement("div");
    banner.style.cssText =
      "font-family:Monaco,Menlo,monospace;font-size:11px;color:#ffcc00;text-align:center;max-width:520px;line-height:1.4";
    banner.textContent =
      "→ " + destEarly + " · autoplay · space to play · esc skip";

    var switchBar = document.createElement("div");
    switchBar.style.cssText =
      "width:500px;max-width:90vw;display:flex;flex-direction:column;gap:6px;align-items:stretch";
    switchBar.innerHTML =
      '<div style="font-family:Monaco,Menlo,monospace;font-size:10px;color:#c4b5fd;letter-spacing:.08em;text-align:center">SWITCHING TO ' +
      destEarly.toUpperCase() +
      "</div>" +
      '<div style="height:8px;background:#19192a;border:1px solid #2121de;border-radius:99px;overflow:hidden">' +
      '<div data-load-fill style="height:100%;width:0%;background:linear-gradient(90deg,#ffcc00,#a855f7);border-radius:99px"></div></div>';
    var loadFill = switchBar.querySelector("[data-load-fill]");
    var introStarted = performance.now();

    var windowBox = document.createElement("div");
    windowBox.style.cssText =
      "width:" +
      VIEW_START +
      "px;height:" +
      VIEW_START +
      "px;border:3px solid #2121de;border-radius:8px;box-shadow:0 0 0 2px #1919a6,0 0 36px rgba(33,33,222,0.4);overflow:hidden;background:#000;flex-shrink:0;transition:border-radius .5s ease";

    var canvas = document.createElement("canvas");
    canvas.tabIndex = 0;
    canvas.style.cssText =
      "width:" +
      VIEW_START +
      "px;height:" +
      VIEW_START +
      "px;display:block;outline:none";
    windowBox.appendChild(canvas);

    var hud = document.createElement("div");
    hud.style.cssText =
      "display:none;font-family:Monaco,Menlo,monospace;font-size:12px;color:#ffcc00;gap:14px;align-items:center;justify-content:center";
    var hudScore = document.createElement("span");
    hudScore.textContent = "SCORE 0";
    var hudLives = document.createElement("span");
    hudLives.textContent = "♥♥♥";
    hud.appendChild(hudScore);
    hud.appendChild(hudLives);

    frame.appendChild(switchBar);
    frame.appendChild(banner);
    frame.appendChild(windowBox);
    frame.appendChild(hud);
    overlay.appendChild(frame);
    document.body.appendChild(overlay);
    document.documentElement.style.overflow = "hidden";

    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var ctx = canvas.getContext("2d");

    var finished = false;
    var autoplay = true;
    var introTimer = 0;
    var raf = 0;
    var acc = 0;
    var lastTs = performance.now();
    var want = null;

    var viewW = VIEW_START;
    var viewH = VIEW_START;
    var expandFromW = VIEW_START;
    var expandFromH = VIEW_START;
    var expandToW = WORLD_W;
    var expandToH = WORLD_H;
    var expandT0 = 0;
    var expanding = false;
    var expanded = false;
    var camStartX = 0;
    var camStartY = 0;
    var camX = 0;
    var camY = 0;

    function applyCanvasSize(w, h) {
      viewW = w;
      viewH = h;
      windowBox.style.width = Math.round(w) + "px";
      windowBox.style.height = Math.round(h) + "px";
      canvas.style.width = Math.round(w) + "px";
      canvas.style.height = Math.round(h) + "px";
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    applyCanvasSize(VIEW_START, VIEW_START);

    function grabFocus() {
      try {
        canvas.focus({ preventScroll: true });
      } catch (_) {
        canvas.focus();
      }
    }
    grabFocus();
    overlay.addEventListener("pointerdown", grabFocus);

    var destLabel = direction === "to-blog" ? "blog" : "portfolio";

    function showLeaving() {
      var veil = document.createElement("div");
      veil.style.cssText =
        "position:fixed;inset:0;z-index:2147483647;background:#000;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;font-family:Monaco,Menlo,monospace;color:#ffcc00";
      veil.innerHTML =
        '<div style="font-size:14px;letter-spacing:.14em">LOADING</div>' +
        '<div style="width:180px;height:6px;background:#1919a6;overflow:hidden;border-radius:99px">' +
        '<div style="width:45%;height:100%;background:#ffcc00;animation:pwnhub-load 0.7s ease-in-out infinite alternate"></div></div>' +
        '<div style="font-size:13px;color:#fff">going to ' +
        destLabel +
        "…</div>";
      if (!document.getElementById("pwnhub-load-kf")) {
        var st = document.createElement("style");
        st.id = "pwnhub-load-kf";
        st.textContent =
          "@keyframes pwnhub-load{from{transform:translateX(-100%)}to{transform:translateX(250%)}}";
        document.head.appendChild(st);
      }
      document.body.appendChild(veil);
    }

    function finish() {
      if (finished) return;
      finished = true;
      cancelAnimationFrame(raf);
      document.removeEventListener("keydown", onKeyDown, true);
      setHandoffCookie(direction);
      window.clearTimeout(introTimer);
      showLeaving();
      window.setTimeout(function () {
        window.location.replace(withXSiteParam(url, direction));
      }, 850);
    }

    function expandViewport() {
      if (finished || expanding || expanded) return;
      autoplay = false;
      hud.style.display = "flex";
      banner.textContent = "your move · arrows/wasd · esc leave";
      var target = {
        w: Math.min(WORLD_W, window.innerWidth - 32),
        h: Math.min(WORLD_H, window.innerHeight - 100),
      };
      expandFromW = viewW;
      expandFromH = viewH;
      expandToW = target.w;
      expandToH = target.h;
      var pac = game.getPacScreen(BLOCK);
      camStartX = pac.x - viewW / 2;
      camStartY = pac.y - viewH / 2;
      expandT0 = performance.now();
      expanding = true;
      windowBox.style.borderRadius = "4px";
      window.clearTimeout(introTimer);
      switchBar.style.opacity = "0.35";
      grabFocus();
    }

    function readDir(e) {
      if (e.key === "ArrowRight" || e.key === "d" || e.key === "D" || e.code === "KeyD")
        return A.RIGHT;
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A" || e.code === "KeyA")
        return A.LEFT;
      if (e.key === "ArrowUp" || e.key === "w" || e.key === "W" || e.code === "KeyW")
        return A.UP;
      if (e.key === "ArrowDown" || e.key === "s" || e.key === "S" || e.code === "KeyS")
        return A.DOWN;
      return null;
    }

    function onKeyDown(e) {
      if (e.code === "Space" || e.key === " ") {
        e.preventDefault();
        e.stopPropagation();
        expandViewport();
        return;
      }
      if (e.key === "Escape" || e.key === "Enter") {
        e.preventDefault();
        finish();
        return;
      }
      var d = readDir(e);
      if (d !== null) {
        e.preventDefault();
        e.stopPropagation();
        if (!expanded && !expanding) expandViewport();
        autoplay = false;
        want = d;
        game.setDue(d);
      }
    }
    document.addEventListener("keydown", onKeyDown, true);

    introTimer = window.setTimeout(function () {
      if (!expanded && !expanding && !finished) finish();
    }, INTRO_MS);

    var world = document.createElement("canvas");
    world.width = WORLD_W;
    world.height = WORLD_H;
    var wctx = world.getContext("2d");

    function loop(now) {
      if (finished) return;
      var dt = now - lastTs;
      lastTs = now;
      if (dt > 80) dt = 80;
      if (autoplay && !expanding && !expanded && loadFill) {
        var p = Math.min(1, (now - introStarted) / INTRO_MS);
        loadFill.style.width = Math.round(p * 100) + "%";
      }
      acc += dt;
      while (acc >= TICK_MS) {
        acc -= TICK_MS;
        if (autoplay) game.autoplayStep();
        else if (want !== null) game.setDue(want);
        game.tick();
        if (game.won()) window.setTimeout(finish, 900);
      }

      hudScore.textContent = "SCORE " + game.getScore();
      hudLives.textContent = "♥".repeat(Math.max(0, game.getLives()));

      if (!expanding && !expanded) {
        var pac = game.getPacScreen(BLOCK);
        camX = pac.x - viewW / 2;
        camY = pac.y - viewH / 2;
      } else if (expanding) {
        var t = Math.min(1, (now - expandT0) / EXPAND_MS);
        var e = easeInOutCubic(t);
        applyCanvasSize(
          lerp(expandFromW, expandToW, e),
          lerp(expandFromH, expandToH, e),
        );
        camX = lerp(camStartX, (WORLD_W - viewW) / 2, e);
        camY = lerp(camStartY, (WORLD_H - viewH) / 2, e);
        if (t >= 1) {
          expanding = false;
          expanded = true;
          applyCanvasSize(expandToW, expandToH);
          camX = (WORLD_W - viewW) / 2;
          camY = (WORLD_H - viewH) / 2;
        }
      } else {
        camX = (WORLD_W - viewW) / 2;
        camY = (WORLD_H - viewH) / 2;
      }

      A.drawArcade(wctx, game, BLOCK);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, viewW, viewH);
      ctx.drawImage(world, -camX, -camY);

      raf = requestAnimationFrame(loop);
    }
    raf = requestAnimationFrame(loop);
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
    }
    killLoader();
    var mo = new MutationObserver(killLoader);
    mo.observe(document.documentElement, { childList: true, subtree: true });
    setTimeout(function () {
      mo.disconnect();
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
