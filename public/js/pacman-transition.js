/**
 * Pac-Man cross-site transition (portfolio @ pwnhub.in)
 *
 * Centered 100×100 camera, Pac always in the middle, maze scrolls.
 * Intro autoplays. Space = take over (autoplay fully stops) + HUD.
 * Handoff: ?xsite=… + cookie Domain=.pwnhub.in
 */
(function () {
  var BLOG_URL = "https://blog.pwnhub.in";
  var XSITE_QUERY = "xsite";
  var INTRO_MS = 4000;
  var VIEW = 100;
  var TILE = 14;

  var MAZE_STR = [
    "###################",
    "#........#........#",
    "#o##.###.#.###.##o#",
    "#.................#",
    "#.##.#.#####.#.##.#",
    "#....#...#...#....#",
    "####.### # ###.####",
    "   #.#       #.#   ",
    "####.# ##-## #.####",
    "    .  #   #  .    ",
    "####.# ##### #.####",
    "   #.#       #.#   ",
    "####.#.#####.#.####",
    "#........#........#",
    "#.##.###.#.###.##.#",
    "#o.#.....P.....#.o#",
    "##.#.#.#####.#.#.##",
    "#....#...#...#....#",
    "#.######.#.######.#",
    "#.................#",
    "###################",
  ];
  var ROWS = MAZE_STR.length;
  var COLS = MAZE_STR[0].length;
  var WORLD_W = COLS * TILE;
  var UP = { x: 0, y: -1 };
  var DOWN = { x: 0, y: 1 };
  var LEFT = { x: -1, y: 0 };
  var RIGHT = { x: 1, y: 0 };
  var DIRS = [UP, DOWN, LEFT, RIGHT];

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

  function parseMaze() {
    var grid = [];
    var pacC = 9;
    var pacR = 15;
    for (var r = 0; r < ROWS; r++) {
      var row = [];
      for (var c = 0; c < COLS; c++) {
        var ch = MAZE_STR[r][c];
        if (ch === "#") row.push("wall");
        else if (ch === ".") row.push("pellet");
        else if (ch === "o") row.push("power");
        else if (ch === "-") row.push("gate");
        else if (ch === "P") {
          row.push("empty");
          pacC = c;
          pacR = r;
        } else row.push("empty");
      }
      grid.push(row);
    }
    return { grid: grid, pacC: pacC, pacR: pacR };
  }

  function cloneGrid(g) {
    return g.map(function (r) {
      return r.slice();
    });
  }

  function countPellets(g) {
    var n = 0;
    for (var r = 0; r < g.length; r++)
      for (var c = 0; c < g[r].length; c++)
        if (g[r][c] === "pellet" || g[r][c] === "power") n++;
    return n;
  }

  function createSfx() {
    var ctx = null;
    function ensure() {
      if (!ctx) {
        var AC = window.AudioContext || window.webkitAudioContext;
        ctx = new AC();
      }
      if (ctx.state === "suspended") ctx.resume();
      return ctx;
    }
    function beep(freq, dur, type, gain, when) {
      try {
        var ac = ensure();
        var t0 = ac.currentTime + (when || 0);
        var o = ac.createOscillator();
        var g = ac.createGain();
        o.type = type || "square";
        o.frequency.setValueAtTime(freq, t0);
        g.gain.setValueAtTime(gain == null ? 0.06 : gain, t0);
        g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
        o.connect(g);
        g.connect(ac.destination);
        o.start(t0);
        o.stop(t0 + dur + 0.02);
      } catch (_) {}
    }
    var chompHi = true;
    return {
      resume: function () {
        try {
          ensure();
        } catch (_) {}
      },
      start: function () {
        beep(440, 0.08, "square", 0.07, 0);
        beep(554, 0.08, "square", 0.07, 0.1);
        beep(659, 0.14, "square", 0.08, 0.2);
      },
      chomp: function () {
        beep(chompHi ? 620 : 480, 0.04, "triangle", 0.045);
        chompHi = !chompHi;
      },
      power: function () {
        beep(180, 0.22, "sawtooth", 0.05);
      },
      eatGhost: function () {
        beep(320, 0.06, "square", 0.06, 0);
        beep(480, 0.06, "square", 0.06, 0.07);
        beep(640, 0.1, "square", 0.07, 0.14);
      },
      death: function () {
        for (var i = 0; i < 6; i++)
          beep(520 - i * 70, 0.08, "sawtooth", 0.05, i * 0.07);
      },
      win: function () {
        beep(523, 0.1, "square", 0.07, 0);
        beep(659, 0.1, "square", 0.07, 0.12);
        beep(784, 0.18, "square", 0.08, 0.24);
      },
    };
  }

  function playPacmanTransition(url, direction) {
    if (document.getElementById("pwnhub-pacman-overlay")) return;

    if (document.activeElement && document.activeElement.blur) {
      document.activeElement.blur();
    }

    var overlay = document.createElement("div");
    overlay.id = "pwnhub-pacman-overlay";
    overlay.setAttribute("role", "application");
    overlay.tabIndex = -1;
    overlay.style.cssText =
      "position:fixed;inset:0;z-index:2147483646;background:#000;display:flex;align-items:center;justify-content:center;outline:none;touch-action:none";

    var frame = document.createElement("div");
    frame.style.cssText =
      "display:flex;flex-direction:column;align-items:center;gap:8px";

    var banner = document.createElement("div");
    banner.style.cssText =
      "font-family:Monaco,Menlo,monospace;font-size:10px;color:#ffcc00;text-align:center;max-width:200px;line-height:1.4";
    banner.textContent =
      direction === "to-portfolio"
        ? "→ portfolio · space take over · esc skip"
        : "→ blog · space take over · esc skip";

    var windowBox = document.createElement("div");
    windowBox.style.cssText =
      "width:" +
      VIEW +
      "px;height:" +
      VIEW +
      "px;border:3px solid #2121de;border-radius:6px;box-shadow:0 0 0 2px #1919a6,0 0 28px rgba(33,33,222,0.4);overflow:hidden;background:#000;flex-shrink:0";

    var canvas = document.createElement("canvas");
    canvas.tabIndex = 0;
    canvas.style.cssText =
      "width:" + VIEW + "px;height:" + VIEW + "px;display:block;outline:none";
    windowBox.appendChild(canvas);

    var hud = document.createElement("div");
    hud.style.cssText =
      "display:none;font-family:Monaco,Menlo,monospace;font-size:10px;color:#ffcc00;gap:10px;align-items:center;justify-content:center";
    var hudScore = document.createElement("span");
    hudScore.textContent = "0";
    var hudLives = document.createElement("span");
    hudLives.textContent = "♥♥♥";
    hud.appendChild(hudScore);
    hud.appendChild(hudLives);

    frame.appendChild(banner);
    frame.appendChild(windowBox);
    frame.appendChild(hud);
    overlay.appendChild(frame);
    document.body.appendChild(overlay);
    document.documentElement.style.overflow = "hidden";

    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(VIEW * dpr);
    canvas.height = Math.round(VIEW * dpr);
    var ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    var sfx = createSfx();
    sfx.resume();

    var finished = false;
    var autoplay = true;
    var awaitInput = false;
    var raf = 0;
    var introTimer = 0;
    var focusTimer = 0;
    var want = null;

    function grabFocus() {
      try {
        canvas.focus({ preventScroll: true });
      } catch (_) {
        canvas.focus();
      }
    }
    grabFocus();
    requestAnimationFrame(grabFocus);
    overlay.addEventListener("pointerdown", grabFocus);

    function finish() {
      if (finished) return;
      finished = true;
      window.clearTimeout(introTimer);
      window.clearInterval(focusTimer);
      cancelAnimationFrame(raf);
      document.removeEventListener("keydown", onKeyDown, true);
      setHandoffCookie(direction);
      window.location.replace(withXSiteParam(url, direction));
    }

    function enterPlay() {
      if (!autoplay || finished) return;
      autoplay = false;
      awaitInput = true;
      want = null;
      pac.next = { x: 0, y: 0 };
      pac.dir = { x: 0, y: 0 };
      window.clearTimeout(introTimer);
      sfx.resume();
      sfx.start();
      hud.style.display = "flex";
      banner.textContent = "your move · arrows/wasd · esc leave";
      grabFocus();
    }

    function readDir(e) {
      switch (e.key) {
        case "ArrowRight":
        case "d":
        case "D":
          return RIGHT;
        case "ArrowLeft":
        case "a":
        case "A":
          return LEFT;
        case "ArrowUp":
        case "w":
        case "W":
          return UP;
        case "ArrowDown":
        case "s":
        case "S":
          return DOWN;
      }
      switch (e.code) {
        case "ArrowRight":
        case "KeyD":
          return RIGHT;
        case "ArrowLeft":
        case "KeyA":
          return LEFT;
        case "ArrowUp":
        case "KeyW":
          return UP;
        case "ArrowDown":
        case "KeyS":
          return DOWN;
      }
      return null;
    }

    function onKeyDown(e) {
      if (e.code === "Space" || e.key === " ") {
        e.preventDefault();
        e.stopPropagation();
        enterPlay();
        return;
      }
      if (e.key === "Escape" || e.key === "Enter") {
        e.preventDefault();
        e.stopPropagation();
        finish();
        return;
      }
      var d = readDir(e);
      if (d) {
        e.preventDefault();
        e.stopPropagation();
        if (autoplay) enterPlay();
        want = d;
        pac.next = d;
        if (pac.dir.x === 0 && pac.dir.y === 0) pac.dir = d;
        awaitInput = false;
      }
    }

    document.addEventListener("keydown", onKeyDown, true);
    focusTimer = window.setInterval(function () {
      if (!finished && document.activeElement !== canvas) grabFocus();
    }, 300);

    introTimer = window.setTimeout(function () {
      if (autoplay && !finished) finish();
    }, INTRO_MS);

    function drawPac(x, y, r, facing, open) {
      var fx = facing.x || 1;
      var fy = facing.y || 0;
      var base = Math.atan2(fy, fx);
      var a = (0.2 + open * 0.35) * Math.PI;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(base);
      ctx.fillStyle = "#ffcc00";
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, r, a, -a, false);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#111";
      ctx.beginPath();
      ctx.arc(r * 0.1, -r * 0.4, r * 0.12, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    function drawGhost(x, y, r, color, look, frightened) {
      var w = r * 1.75;
      var h = r * 2.1;
      var left = -w / 2;
      var right = w / 2;
      var top = -h * 0.48;
      var skirt = h * 0.38;
      var domeR = w / 2;
      ctx.save();
      ctx.translate(x, y);
      var flash =
        frightened && powerUntil - performance.now() < 1800
          ? Math.floor(performance.now() / 120) % 2 === 0
          : false;
      ctx.fillStyle = frightened ? (flash ? "#fff" : "#2121ff") : color;
      ctx.beginPath();
      ctx.moveTo(left, skirt);
      ctx.lineTo(left, top + domeR);
      ctx.arc(0, top + domeR, domeR, Math.PI, 0, false);
      ctx.lineTo(right, skirt);
      var waves = 3;
      var waveW = w / waves;
      for (var i = 0; i < waves; i++) {
        var x0 = right - i * waveW;
        var x1 = x0 - waveW / 2;
        var x2 = x0 - waveW;
        ctx.quadraticCurveTo(x0 - waveW * 0.25, skirt + waveW * 0.55, x1, skirt);
        ctx.quadraticCurveTo(x2 + waveW * 0.25, skirt - waveW * 0.15, x2, skirt);
      }
      ctx.closePath();
      ctx.fill();
      var eyeY = -h * 0.12;
      var eyeX = w * 0.22;
      var eyeRx = w * 0.14;
      var eyeRy = w * 0.17;
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.ellipse(-eyeX, eyeY, eyeRx, eyeRy, 0, 0, Math.PI * 2);
      ctx.ellipse(eyeX, eyeY, eyeRx, eyeRy, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = frightened ? "#2121ff" : "#2121de";
      var lx = look.x * eyeRx * 0.4;
      var ly = look.y * eyeRy * 0.35;
      var pr = eyeRx * (frightened ? 0.3 : 0.48);
      ctx.beginPath();
      ctx.arc(-eyeX + lx, eyeY + ly, pr, 0, Math.PI * 2);
      ctx.arc(eyeX + lx, eyeY + ly, pr, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    function drawEyesOnly(x, y) {
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.ellipse(x - 3, y, 2.5, 3, 0, 0, Math.PI * 2);
      ctx.ellipse(x + 3, y, 2.5, 3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#2121de";
      ctx.beginPath();
      ctx.arc(x - 2, y, 1.2, 0, Math.PI * 2);
      ctx.arc(x + 4, y, 1.2, 0, Math.PI * 2);
      ctx.fill();
    }

    var base = parseMaze();
    var grid = cloneGrid(base.grid);
    var score = 0;
    var lives = 3;
    var remaining = countPellets(grid);
    var powerUntil = 0;
    var invulnUntil = 0;
    var deadUntil = 0;
    var won = false;
    var mouth = 0;
    var lastTs = performance.now();
    var chompCool = 0;

    function tileCenter(c, r) {
      return { x: c * TILE + TILE / 2, y: r * TILE + TILE / 2 };
    }

    function pixelToTile(px, py) {
      var c = Math.floor(px / TILE);
      var r = Math.floor(py / TILE);
      if (c < 0) c += COLS;
      if (c >= COLS) c -= COLS;
      return { c: c, r: r };
    }

    function blocked(c, r, allowGate) {
      if (r < 0 || r >= ROWS) return true;
      var cc = c;
      if (cc < 0) cc = COLS - 1;
      if (cc >= COLS) cc = 0;
      var v = grid[r][cc];
      if (v === "wall") return true;
      if (v === "gate" && !allowGate) return true;
      return false;
    }

    function hitsWall(px, py, allowGate) {
      var rad = TILE * 0.32;
      var samples = [
        [px, py],
        [px - rad, py],
        [px + rad, py],
        [px, py - rad],
        [px, py + rad],
      ];
      for (var i = 0; i < samples.length; i++) {
        var sx = samples[i][0];
        var sy = samples[i][1];
        var c = Math.floor(sx / TILE);
        var r = Math.floor(sy / TILE);
        if (r < 0 || r >= ROWS) return true;
        if (c < 0) c += COLS;
        if (c >= COLS) c -= COLS;
        var v = grid[r][c];
        if (v === "wall") return true;
        if (v === "gate" && !allowGate) return true;
      }
      return false;
    }

    function nearCenter(b) {
      var t = pixelToTile(b.x, b.y);
      var tc = tileCenter(t.c, t.r);
      return Math.hypot(b.x - tc.x, b.y - tc.y) < Math.max(1.2, TILE * 0.08);
    }

    function snapToCenter(b) {
      var t = pixelToTile(b.x, b.y);
      var tc = tileCenter(t.c, t.r);
      b.x = tc.x;
      b.y = tc.y;
    }

    function canMoveFrom(b, d, allowGate) {
      if (d.x === 0 && d.y === 0) return false;
      var t = pixelToTile(b.x, b.y);
      return !blocked(t.c + d.x, t.r + d.y, allowGate);
    }

    function openDirs(c, r, allowGate, forbid) {
      var opts = [];
      for (var i = 0; i < DIRS.length; i++) {
        var d = DIRS[i];
        if (forbid && d.x === forbid.x && d.y === forbid.y) continue;
        if (!blocked(c + d.x, r + d.y, allowGate)) opts.push(d);
      }
      return opts;
    }

    var pac = { x: 0, y: 0, dir: LEFT, next: LEFT };
    var ghosts = [];

    function resetActors() {
      var p = tileCenter(base.pacC, base.pacR);
      pac = { x: p.x, y: p.y, dir: LEFT, next: LEFT };
      var homes = [
        { c: 9, r: 9, color: "#ff0000", dir: LEFT },
        { c: 8, r: 9, color: "#ffb8ff", dir: RIGHT },
        { c: 10, r: 9, color: "#00ffff", dir: LEFT },
        { c: 9, r: 8, color: "#ffb852", dir: UP },
      ];
      ghosts = homes.map(function (h) {
        var t = tileCenter(h.c, h.r);
        return {
          x: t.x,
          y: t.y,
          dir: h.dir,
          next: h.dir,
          color: h.color,
          mode: "chase",
          homeX: t.x,
          homeY: t.y,
        };
      });
    }

    resetActors();

    function moveBody(b, speedPx, dt, allowGate) {
      if (b.dir.x === 0 && b.dir.y === 0) {
        if (b.next.x !== 0 || b.next.y !== 0) {
          if (canMoveFrom(b, b.next, allowGate)) {
            b.dir = { x: b.next.x, y: b.next.y };
          }
        }
        if (b.dir.x === 0 && b.dir.y === 0) return;
      }

      if (b.next.x === -b.dir.x && b.next.y === -b.dir.y) {
        b.dir = { x: b.next.x, y: b.next.y };
      }

      var wantTurn = b.next.x !== b.dir.x || b.next.y !== b.dir.y;
      if (nearCenter(b)) {
        if (wantTurn && canMoveFrom(b, b.next, allowGate)) {
          snapToCenter(b);
          b.dir = { x: b.next.x, y: b.next.y };
        } else if (!canMoveFrom(b, b.dir, allowGate)) {
          snapToCenter(b);
          if (canMoveFrom(b, b.next, allowGate)) {
            b.dir = { x: b.next.x, y: b.next.y };
          } else {
            var t0 = pixelToTile(b.x, b.y);
            var opts0 = openDirs(t0.c, t0.r, allowGate);
            if (opts0.length === 0) {
              b.dir = { x: 0, y: 0 };
              return;
            }
            b.dir = opts0[Math.floor(Math.random() * opts0.length)];
            b.next = b.dir;
          }
        }
      }

      var step = Math.max(1.5, speedPx * dt);
      var nx = b.x + b.dir.x * step;
      var ny = b.y + b.dir.y * step;
      if (nx < 0) nx += WORLD_W;
      if (nx >= WORLD_W) nx -= WORLD_W;

      if (!hitsWall(nx, ny, allowGate)) {
        b.x = nx;
        b.y = ny;
        if (b.dir.x !== 0) {
          var tr = pixelToTile(b.x, b.y);
          b.y = tr.r * TILE + TILE / 2;
        } else {
          var tc = pixelToTile(b.x, b.y);
          b.x = tc.c * TILE + TILE / 2;
        }
      } else {
        snapToCenter(b);
      }
    }

    function autopilotPac() {
      if (!nearCenter(pac)) return;
      snapToCenter(pac);
      var t = pixelToTile(pac.x, pac.y);
      var opts = openDirs(t.c, t.r, false, { x: -pac.dir.x, y: -pac.dir.y });
      var all = opts.length ? opts : openDirs(t.c, t.r, false);
      if (all.length === 0) return;
      var best = all[0];
      var bestScore = -1;
      for (var i = 0; i < all.length; i++) {
        var d = all[i];
        var nc = t.c + d.x;
        var nr = t.r + d.y;
        if (nc < 0) nc = COLS - 1;
        if (nc >= COLS) nc = 0;
        if (nr < 0 || nr >= ROWS) continue;
        var cell = grid[nr][nc];
        var s = cell === "power" ? 3 : cell === "pellet" ? 2 : 1;
        if (d.x === pac.dir.x && d.y === pac.dir.y) s += 0.5;
        if (s > bestScore) {
          bestScore = s;
          best = d;
        }
      }
      pac.next = best;
      pac.dir = best;
    }

    function pickGhost(g) {
      if (!nearCenter(g)) return;
      snapToCenter(g);
      var t = pixelToTile(g.x, g.y);
      var opts = [];
      for (var i = 0; i < DIRS.length; i++) {
        var d = DIRS[i];
        if (d.x === -g.dir.x && d.y === -g.dir.y && g.mode === "chase") continue;
        var nc = t.c + d.x;
        var nr = t.r + d.y;
        if (nr < 0 || nr >= ROWS) continue;
        var cc = nc;
        if (cc < 0) cc = COLS - 1;
        if (cc >= COLS) cc = 0;
        var v = grid[nr][cc];
        if (v === "wall") continue;
        if (v === "gate" && !(d.y === -1 || g.mode === "eaten")) continue;
        opts.push(d);
      }
      if (opts.length === 0) {
        var any = openDirs(t.c, t.r, true);
        if (any.length === 0) return;
        g.dir = any[0];
        g.next = g.dir;
        return;
      }
      if (g.mode === "frightened") {
        var cont = null;
        for (var j = 0; j < opts.length; j++) {
          if (opts[j].x === g.dir.x && opts[j].y === g.dir.y) cont = opts[j];
        }
        g.dir = cont || opts[Math.floor(Math.random() * opts.length)];
        g.next = g.dir;
        return;
      }
      var tx = pac.x;
      var ty = pac.y;
      if (g.mode === "eaten") {
        tx = g.homeX;
        ty = g.homeY;
      } else if (g.color === "#00ffff") {
        tx = pac.x + pac.dir.x * TILE * 2;
        ty = pac.y + pac.dir.y * TILE * 2;
      } else if (g.color === "#ffb852") {
        tx = pac.x - TILE * 3;
      } else if (g.color === "#ffb8ff") {
        ty = pac.y - TILE * 2;
      }
      var best = opts[0];
      var bestD = Infinity;
      for (var k = 0; k < opts.length; k++) {
        var od = opts[k];
        var px = g.x + od.x * TILE;
        var py = g.y + od.y * TILE;
        var dist = (px - tx) * (px - tx) + (py - ty) * (py - ty);
        if (dist < bestD) {
          bestD = dist;
          best = od;
        }
      }
      g.dir = best;
      g.next = best;
    }

    function killPac(now) {
      if (now < invulnUntil) return;
      if (autoplay) {
        resetActors();
        return;
      }
      sfx.death();
      lives -= 1;
      deadUntil = now + 700;
      invulnUntil = now + 1400;
      hudLives.textContent = "♥".repeat(Math.max(0, lives));
      if (lives <= 0) {
        window.setTimeout(finish, 1100);
        return;
      }
      resetActors();
      for (var i = 0; i < ghosts.length; i++) ghosts[i].mode = "chase";
      powerUntil = 0;
      awaitInput = true;
      pac.dir = { x: 0, y: 0 };
      pac.next = { x: 0, y: 0 };
    }

    function tick(now) {
      if (finished) return;
      var dt = (now - lastTs) / 1000;
      lastTs = now;
      if (!isFinite(dt) || dt <= 0) dt = 1 / 60;
      if (dt > 0.05) dt = 0.05;
      mouth += dt * 12;

      if (!won && lives > 0 && now > deadUntil) {
        if (autoplay) {
          autopilotPac();
          moveBody(pac, TILE * 6, dt, false);
        } else if (!awaitInput) {
          if (want) pac.next = want;
          moveBody(pac, TILE * 7, dt, false);
        }

        var pt = pixelToTile(pac.x, pac.y);
        if (pt.r >= 0 && pt.r < ROWS && nearCenter(pac)) {
          var cc = ((pt.c % COLS) + COLS) % COLS;
          if (grid[pt.r][cc] === "pellet") {
            grid[pt.r][cc] = "empty";
            score += 10;
            remaining -= 1;
            if (now > chompCool) {
              if (!autoplay) sfx.chomp();
              chompCool = now + 85;
            }
          } else if (grid[pt.r][cc] === "power") {
            grid[pt.r][cc] = "empty";
            score += 50;
            remaining -= 1;
            powerUntil = now + 6500;
            if (!autoplay) sfx.power();
            for (var gi = 0; gi < ghosts.length; gi++) {
              if (ghosts[gi].mode !== "eaten") {
                ghosts[gi].mode = "frightened";
                ghosts[gi].dir = {
                  x: -ghosts[gi].dir.x,
                  y: -ghosts[gi].dir.y,
                };
                ghosts[gi].next = ghosts[gi].dir;
              }
            }
          }
          if (!autoplay) hudScore.textContent = String(score);
        }

        if (remaining <= 0 && !autoplay) {
          won = true;
          sfx.win();
          window.setTimeout(finish, 1400);
        }

        if (powerUntil > 0 && now >= powerUntil) {
          powerUntil = 0;
          for (var gj = 0; gj < ghosts.length; gj++) {
            if (ghosts[gj].mode === "frightened") ghosts[gj].mode = "chase";
          }
        }

        for (var gk = 0; gk < ghosts.length; gk++) {
          var g = ghosts[gk];
          if (g.mode === "eaten") {
            var dx = g.homeX - g.x;
            var dy = g.homeY - g.y;
            if (dx * dx + dy * dy < TILE * 0.4 * (TILE * 0.4)) {
              g.mode = "chase";
              g.x = g.homeX;
              g.y = g.homeY;
            }
          }
          pickGhost(g);
          var speed =
            g.mode === "frightened"
              ? TILE * 4.2
              : g.mode === "eaten"
                ? TILE * 10
                : TILE * 5.5;
          moveBody(g, speed, dt, true);

          var ddx = g.x - pac.x;
          var ddy = g.y - pac.y;
          if (ddx * ddx + ddy * ddy < TILE * 0.55 * (TILE * 0.55)) {
            if (g.mode === "frightened") {
              g.mode = "eaten";
              score += 200;
              if (!autoplay) {
                sfx.eatGhost();
                hudScore.textContent = String(score);
              }
            } else if (g.mode === "chase") {
              killPac(now);
            }
          }
        }
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, VIEW, VIEW);

      var camX = pac.x - VIEW / 2;
      var camY = pac.y - VIEW / 2;

      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, VIEW, VIEW);
      ctx.clip();
      ctx.translate(-camX, -camY);

      for (var r = 0; r < ROWS; r++) {
        for (var c = 0; c < COLS; c++) {
          var v = grid[r][c];
          var x = c * TILE;
          var y = r * TILE;
          if (
            x + TILE < camX - TILE ||
            x > camX + VIEW + TILE ||
            y + TILE < camY - TILE ||
            y > camY + VIEW + TILE
          ) {
            continue;
          }
          if (v === "wall") {
            ctx.fillStyle = "#2121de";
            ctx.fillRect(x + 1, y + 1, TILE - 2, TILE - 2);
          } else if (v === "gate") {
            ctx.fillStyle = "#ffb8ff";
            ctx.fillRect(x + 2, y + TILE * 0.45, TILE - 4, 2);
          } else if (v === "pellet") {
            ctx.fillStyle = "#ffb897";
            ctx.beginPath();
            ctx.arc(
              x + TILE / 2,
              y + TILE / 2,
              Math.max(1.5, TILE * 0.1),
              0,
              Math.PI * 2,
            );
            ctx.fill();
          } else if (v === "power") {
            ctx.fillStyle = "#ffb897";
            ctx.beginPath();
            ctx.arc(x + TILE / 2, y + TILE / 2, TILE * 0.28, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      var rad = TILE * 0.42;
      for (var gl = 0; gl < ghosts.length; gl++) {
        var gg = ghosts[gl];
        if (
          gg.x < camX - TILE * 2 ||
          gg.x > camX + VIEW + TILE * 2 ||
          gg.y < camY - TILE * 2 ||
          gg.y > camY + VIEW + TILE * 2
        ) {
          continue;
        }
        if (gg.mode === "eaten") drawEyesOnly(gg.x, gg.y);
        else
          drawGhost(gg.x, gg.y, rad, gg.color, gg.dir, gg.mode === "frightened");
      }

      var face =
        pac.dir.x !== 0 || pac.dir.y !== 0 ? pac.dir : want || RIGHT;
      var open = (Math.sin(mouth) + 1) / 2;
      if (awaitInput && !autoplay) {
        drawPac(pac.x, pac.y, rad, face, 0.4);
      } else {
        drawPac(pac.x, pac.y, rad, face, open);
      }

      ctx.restore();

      ctx.strokeStyle = "#1919a6";
      ctx.lineWidth = 1;
      ctx.strokeRect(0.5, 0.5, VIEW - 1, VIEW - 1);

      if (autoplay) {
        ctx.fillStyle = "rgba(0,0,0,0.45)";
        ctx.fillRect(0, VIEW - 14, VIEW, 14);
        ctx.fillStyle = "#ffcc00";
        ctx.font = "8px Monaco, Menlo, monospace";
        ctx.textAlign = "center";
        ctx.fillText("space", VIEW / 2, VIEW - 4);
      } else if (awaitInput) {
        ctx.fillStyle = "rgba(0,0,0,0.45)";
        ctx.fillRect(0, VIEW - 14, VIEW, 14);
        ctx.fillStyle = "#fff";
        ctx.font = "8px Monaco, Menlo, monospace";
        ctx.textAlign = "center";
        ctx.fillText("move!", VIEW / 2, VIEW - 4);
      }

      if (won || (lives <= 0 && !autoplay)) {
        ctx.fillStyle = "rgba(0,0,0,0.6)";
        ctx.fillRect(0, 0, VIEW, VIEW);
        ctx.fillStyle = won ? "#ffcc00" : "#ff5555";
        ctx.font = "bold 11px Monaco, Menlo, monospace";
        ctx.textAlign = "center";
        ctx.fillText(won ? "WIN" : "OVER", VIEW / 2, VIEW / 2 + 3);
      }

      raf = requestAnimationFrame(tick);
    }

    raf = requestAnimationFrame(tick);
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
