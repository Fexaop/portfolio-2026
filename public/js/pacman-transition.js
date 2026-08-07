/**
 * Pac-Man cross-site transition (portfolio @ pwnhub.in)
 *
 * Space during cinema → real maze + Web Audio SFX.
 * Esc / Enter → navigate.
 * Handoff: ?xsite=… + cookie Domain=.pwnhub.in
 */
(function () {
  const BLOG_URL = "https://blog.pwnhub.in";
  const XSITE_QUERY = "xsite";
  const CINEMA_MS = 2600;

  const MAZE_STR = [
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
  const ROWS = MAZE_STR.length;
  const COLS = MAZE_STR[0].length;
  const UP = { x: 0, y: -1 };
  const DOWN = { x: 0, y: 1 };
  const LEFT = { x: -1, y: 0 };
  const RIGHT = { x: 1, y: 0 };
  const DIRS = [UP, DOWN, LEFT, RIGHT];

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

  function parseMaze() {
    const grid = [];
    let pacC = 9;
    let pacR = 15;
    for (let r = 0; r < ROWS; r++) {
      const row = [];
      for (let c = 0; c < COLS; c++) {
        const ch = MAZE_STR[r][c];
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
        beep(chompHi ? 620 : 480, 0.045, "triangle", 0.05);
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

    var canvas = document.createElement("canvas");
    canvas.tabIndex = 0;
    canvas.style.cssText = "outline:none;display:block;max-width:100%";
    overlay.appendChild(canvas);
    document.body.appendChild(overlay);
    document.documentElement.style.overflow = "hidden";

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

    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var ctx = canvas.getContext("2d");
    var sfx = createSfx();

    var finished = false;
    var mode = "cinema";
    var cinemaRaf = 0;
    var gameRaf = 0;
    var failSafe = 0;
    var focusTimer = 0;
    var want = null;

    function finish() {
      if (finished) return;
      finished = true;
      window.clearTimeout(failSafe);
      window.clearInterval(focusTimer);
      cancelAnimationFrame(cinemaRaf);
      cancelAnimationFrame(gameRaf);
      document.removeEventListener("keydown", onKeyDown, true);
      document.removeEventListener("keyup", onKeyUp, true);
      setHandoffCookie(direction);
      window.location.replace(withXSiteParam(url, direction));
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
        if (mode === "cinema") startGame();
        return;
      }
      if (e.key === "Escape" || e.key === "Enter" || e.code === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        finish();
        return;
      }
      var d = readDir(e);
      if (d) {
        e.preventDefault();
        e.stopPropagation();
        want = d;
        if (mode === "game") pac.next = d;
      }
    }
    function onKeyUp() {}

    document.addEventListener("keydown", onKeyDown, true);
    document.addEventListener("keyup", onKeyUp, true);
    focusTimer = window.setInterval(function () {
      if (!finished && document.activeElement !== canvas) grabFocus();
    }, 300);

    function drawPac(x, y, r, facing, open) {
      var base = Math.atan2(facing.y, facing.x);
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
      ctx.fillStyle = frightened ? "#2121ff" : color;
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

    var chaseGhost = direction === "to-portfolio";
    var cinemaW = Math.min(window.innerWidth, 960);
    var cinemaH = Math.min(Math.round(window.innerHeight * 0.48), 360);

    function sizeCinema() {
      cinemaW = Math.min(window.innerWidth, 960);
      cinemaH = Math.min(Math.round(window.innerHeight * 0.48), 360);
      canvas.width = Math.round(cinemaW * dpr);
      canvas.height = Math.round(cinemaH * dpr);
      canvas.style.width = cinemaW + "px";
      canvas.style.height = cinemaH + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    sizeCinema();
    var t0 = performance.now();
    failSafe = window.setTimeout(finish, CINEMA_MS + 800);

    var candy = [];
    (function () {
      var laneL = cinemaW * 0.07;
      var laneR = cinemaW * 0.93;
      var R = Math.max(18, Math.min(28, cinemaW * 0.034));
      var pathLen = laneR - laneL - R * 3;
      for (var i = 0; i < 20; i++) {
        candy.push({
          x: laneL + R * 2.2 + (pathLen * i) / 19,
          eaten: false,
          power: i === 0 || i === 19,
        });
      }
    })();

    function cinemaFrame(now) {
      if (mode !== "cinema" || finished) return;
      var W = cinemaW;
      var H = cinemaH;
      var cy = H * 0.5;
      var R = Math.max(18, Math.min(28, W * 0.034));
      var laneL = W * 0.07;
      var laneR = W * 0.93;
      var pathLen = laneR - laneL - R * 3;
      var t = Math.min(1, (now - t0) / CINEMA_MS);
      var e = t * t * (3 - 2 * t);

      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, W, H);
      var top = cy - R * 2.7;
      var bot = cy + R * 2.7;
      ctx.strokeStyle = "#2121de";
      ctx.lineWidth = 4;
      ctx.strokeRect(laneL - 10, top - 6, laneR - laneL + 20, bot - top + 12);

      var pacX = laneL + R * 1.6 + pathLen * e;
      var open = (Math.sin(now / 60) + 1) / 2;
      var ghostX;
      var frightened = false;
      var eaten = false;
      if (chaseGhost) {
        frightened = t > 0.25;
        var lead = R * 5 * (1 - e * 0.7) + R * 1.4;
        ghostX = Math.min(laneR - R, pacX + lead);
        if (t > 0.78) ghostX = pacX + R * 0.85;
        if (t > 0.88) eaten = true;
      } else {
        var minGap = R * 2.8;
        var startGap = R * 6.5;
        var gap = startGap - e * (startGap - minGap);
        ghostX = pacX - Math.max(gap, minGap);
        if (ghostX < laneL + R) ghostX = laneL + R;
      }

      var biteX = pacX + R * 0.35;
      for (var ci = 0; ci < candy.length; ci++) {
        var c = candy[ci];
        if (!c.eaten && biteX >= c.x) c.eaten = true;
        if (c.eaten) continue;
        ctx.fillStyle = c.power ? "#ffb897" : "#ffcc66";
        ctx.beginPath();
        ctx.arc(c.x, cy, c.power ? R * 0.42 : R * 0.22, 0, Math.PI * 2);
        ctx.fill();
      }
      if (!eaten) drawGhost(ghostX, cy, R, "#ff0000", RIGHT, frightened);
      drawPac(pacX, cy, R, RIGHT, open);

      ctx.fillStyle = "rgba(255,255,255,0.75)";
      ctx.font = "13px Monaco, Menlo, monospace";
      ctx.textAlign = "center";
      ctx.fillText(chaseGhost ? "→ portfolio" : "→ blog", W / 2, H - 28);
      ctx.fillStyle = "#ffcc00";
      ctx.font = "12px Monaco, Menlo, monospace";
      ctx.fillText("space = play   ·   esc = skip", W / 2, H - 10);

      if (t < 1) cinemaRaf = requestAnimationFrame(cinemaFrame);
      else {
        window.clearTimeout(failSafe);
        window.setTimeout(finish, 80);
      }
    }
    cinemaRaf = requestAnimationFrame(cinemaFrame);

    // —— game ——
    var base = parseMaze();
    var grid = cloneGrid(base.grid);
    var TILE = 20;
    var PAD = 32;
    var score = 0;
    var lives = 3;
    var remaining = 0;
    var powerUntil = 0;
    var invulnUntil = 0;
    var deadUntil = 0;
    var won = false;
    var mouth = 0;
    var lastTs = 0;
    var chompCool = 0;
    var pac = { x: 0, y: 0, dir: LEFT, next: LEFT };
    var ghosts = [];

    function tileCenter(c, r) {
      return { x: c * TILE + TILE / 2, y: PAD + r * TILE + TILE / 2 };
    }

    function pixelToTile(px, py) {
      var c = Math.floor(px / TILE);
      var r = Math.floor((py - PAD) / TILE);
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
      var rad = TILE * 0.35;
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
        var r = Math.floor((sy - PAD) / TILE);
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
      // tight zone so a step can leave it (wide zone + snap = frozen)
      return Math.hypot(b.x - tc.x, b.y - tc.y) < Math.max(1.5, TILE * 0.08);
    }

    function snapToCenter(b) {
      var t = pixelToTile(b.x, b.y);
      var tc = tileCenter(t.c, t.r);
      b.x = tc.x;
      b.y = tc.y;
    }

    function canMoveFrom(b, d, allowGate) {
      var t = pixelToTile(b.x, b.y);
      return !blocked(t.c + d.x, t.r + d.y, allowGate);
    }

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

    function layoutGame() {
      var maxW = Math.min(window.innerWidth - 16, 760);
      var maxH = Math.min(window.innerHeight - 24, 840);
      TILE = Math.max(14, Math.floor(Math.min(maxW / COLS, (maxH - PAD) / ROWS)));
      var w = TILE * COLS;
      var h = TILE * ROWS + PAD;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function startGame() {
      if (mode === "game") return;
      mode = "game";
      window.clearTimeout(failSafe);
      cancelAnimationFrame(cinemaRaf);
      sfx.resume();
      sfx.start();
      grid = cloneGrid(base.grid);
      remaining = countPellets(grid);
      score = 0;
      lives = 3;
      powerUntil = 0;
      invulnUntil = 0;
      deadUntil = 0;
      won = false;
      chompCool = 0;
      want = LEFT;
      layoutGame();
      resetActors();
      lastTs = performance.now();
      grabFocus();
      gameRaf = requestAnimationFrame(gameFrame);
    }

    function moveBody(b, speedPx, dt, allowGate) {
      if (b.next.x === -b.dir.x && b.next.y === -b.dir.y) {
        b.dir = { x: b.next.x, y: b.next.y };
      }
      var wantTurn = b.next.x !== b.dir.x || b.next.y !== b.dir.y;
      // only snap when turning or blocked — never every frame
      if (nearCenter(b)) {
        if (wantTurn && canMoveFrom(b, b.next, allowGate)) {
          snapToCenter(b);
          b.dir = { x: b.next.x, y: b.next.y };
        } else if (!canMoveFrom(b, b.dir, allowGate)) {
          snapToCenter(b);
          if (canMoveFrom(b, b.next, allowGate)) {
            b.dir = { x: b.next.x, y: b.next.y };
          } else {
            return;
          }
        }
      }
      var step = Math.max(2, speedPx * dt);
      var nx = b.x + b.dir.x * step;
      var ny = b.y + b.dir.y * step;
      var totalW = TILE * COLS;
      if (nx < 0) nx += totalW;
      if (nx >= totalW) nx -= totalW;
      if (!hitsWall(nx, ny, allowGate)) {
        b.x = nx;
        b.y = ny;
        if (b.dir.x !== 0) {
          var tr = pixelToTile(b.x, b.y);
          b.y = PAD + tr.r * TILE + TILE / 2;
        } else if (b.dir.y !== 0) {
          var tc = pixelToTile(b.x, b.y);
          b.x = tc.c * TILE + TILE / 2;
        }
      } else {
        snapToCenter(b);
      }
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
        g.dir = { x: -g.dir.x, y: -g.dir.y };
        g.next = g.dir;
        return;
      }
      if (g.mode === "frightened") {
        g.dir = opts[Math.floor(Math.random() * opts.length)];
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
      for (var j = 0; j < opts.length; j++) {
        var od = opts[j];
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
      sfx.death();
      lives -= 1;
      deadUntil = now + 700;
      invulnUntil = now + 1400;
      if (lives <= 0) {
        window.setTimeout(finish, 1100);
        return;
      }
      resetActors();
      for (var i = 0; i < ghosts.length; i++) ghosts[i].mode = "chase";
      powerUntil = 0;
    }

    function gameFrame(now) {
      if (mode !== "game" || finished) return;
      var dt = (now - lastTs) / 1000;
      lastTs = now;
      if (!isFinite(dt) || dt <= 0) dt = 1 / 60;
      if (dt > 0.05) dt = 0.05;
      mouth += dt * 12;

      if (!won && lives > 0 && now > deadUntil) {
        if (want) pac.next = want;
        moveBody(pac, TILE * 7, dt, false);

        var pt = pixelToTile(pac.x, pac.y);
        if (pt.r >= 0 && pt.r < ROWS && nearCenter(pac)) {
          var cc = ((pt.c % COLS) + COLS) % COLS;
          if (grid[pt.r][cc] === "pellet") {
            grid[pt.r][cc] = "empty";
            score += 10;
            remaining -= 1;
            if (now > chompCool) {
              sfx.chomp();
              chompCool = now + 85;
            }
          } else if (grid[pt.r][cc] === "power") {
            grid[pt.r][cc] = "empty";
            score += 50;
            remaining -= 1;
            powerUntil = now + 6500;
            sfx.power();
            for (var gi = 0; gi < ghosts.length; gi++) {
              if (ghosts[gi].mode !== "eaten") ghosts[gi].mode = "frightened";
            }
          }
        }

        if (remaining <= 0) {
          won = true;
          sfx.win();
          window.setTimeout(finish, 1400);
        }

        if (now >= powerUntil) {
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
              ? TILE * 3.5
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
              sfx.eatGhost();
            } else if (g.mode === "chase") {
              killPac(now);
            }
          }
        }
      }

      var W = TILE * COLS;
      var H = TILE * ROWS + PAD;
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, W, H);

      ctx.fillStyle = "#ffcc00";
      ctx.font =
        "bold " + Math.max(12, Math.floor(TILE * 0.55)) + "px Monaco, Menlo, monospace";
      ctx.textAlign = "left";
      ctx.fillText("SCORE " + score, 8, 20);
      ctx.textAlign = "right";
      ctx.fillText("♥".repeat(Math.max(0, lives)), W - 8, 20);
      ctx.textAlign = "center";
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      ctx.font = "11px Monaco, Menlo, monospace";
      ctx.fillText("arrows / wasd  ·  esc leave", W / 2, 20);

      for (var r = 0; r < ROWS; r++) {
        for (var c = 0; c < COLS; c++) {
          var v = grid[r][c];
          var x = c * TILE;
          var y = PAD + r * TILE;
          if (v === "wall") {
            ctx.fillStyle = "#2121de";
            ctx.fillRect(x + 1, y + 1, TILE - 2, TILE - 2);
          } else if (v === "gate") {
            ctx.fillStyle = "#ffb8ff";
            ctx.fillRect(x + 2, y + TILE * 0.45, TILE - 4, 2);
          } else if (v === "pellet") {
            ctx.fillStyle = "#ffb897";
            ctx.beginPath();
            ctx.arc(x + TILE / 2, y + TILE / 2, Math.max(2, TILE * 0.1), 0, Math.PI * 2);
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
        if (gg.mode === "eaten") {
          ctx.fillStyle = "#fff";
          ctx.beginPath();
          ctx.ellipse(gg.x - 4, gg.y, 3.5, 4, 0, 0, Math.PI * 2);
          ctx.ellipse(gg.x + 4, gg.y, 3.5, 4, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#2121de";
          ctx.beginPath();
          ctx.arc(gg.x - 3, gg.y, 1.6, 0, Math.PI * 2);
          ctx.arc(gg.x + 5, gg.y, 1.6, 0, Math.PI * 2);
          ctx.fill();
        } else {
          drawGhost(gg.x, gg.y, rad, gg.color, gg.dir, gg.mode === "frightened");
        }
      }

      if (now > deadUntil || lives <= 0) {
        var open = (Math.sin(mouth) + 1) / 2;
        drawPac(pac.x, pac.y, rad, pac.dir, open);
      }

      if (won || lives <= 0) {
        ctx.fillStyle = "rgba(0,0,0,0.55)";
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = won ? "#ffcc00" : "#ff5555";
        ctx.font = "bold " + Math.max(18, TILE) + "px Monaco, Menlo, monospace";
        ctx.textAlign = "center";
        ctx.fillText(won ? "YOU WIN" : "GAME OVER", W / 2, H / 2);
        ctx.fillStyle = "#fff";
        ctx.font = "12px Monaco, Menlo, monospace";
        ctx.fillText("warping…", W / 2, H / 2 + 28);
      }

      gameRaf = requestAnimationFrame(gameFrame);
    }
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
