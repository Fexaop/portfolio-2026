/**
 * Pac-Man cross-site transition (portfolio @ pwnhub.in)
 *
 * Cinematic handoff by default. Press Space during it to play a real maze.
 * Esc / Enter finishes and navigates.
 *
 * Handoff: ?xsite=… + cookie Domain=.pwnhub.in
 */
(function () {
  const BLOG_URL = "https://blog.pwnhub.in";
  const XSITE_QUERY = "xsite";
  const CINEMA_MS = 2600;

  // 0 empty  1 wall  2 pellet  3 power  4 gate
  const MAZE = [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 2, 2, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 2, 2, 2, 1],
    [1, 3, 1, 1, 2, 1, 1, 1, 2, 1, 2, 1, 1, 1, 2, 1, 1, 3, 1],
    [1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1],
    [1, 2, 1, 1, 2, 1, 2, 1, 1, 1, 1, 1, 2, 1, 2, 1, 1, 2, 1],
    [1, 2, 2, 2, 2, 1, 2, 2, 2, 1, 2, 2, 2, 1, 2, 2, 2, 2, 1],
    [1, 1, 1, 1, 2, 1, 1, 1, 0, 1, 0, 1, 1, 1, 2, 1, 1, 1, 1],
    [0, 0, 0, 1, 2, 1, 0, 0, 0, 0, 0, 0, 0, 1, 2, 1, 0, 0, 0],
    [1, 1, 1, 1, 2, 1, 0, 1, 1, 4, 1, 1, 0, 1, 2, 1, 1, 1, 1],
    [0, 0, 0, 0, 2, 0, 0, 1, 0, 0, 0, 1, 0, 0, 2, 0, 0, 0, 0],
    [1, 1, 1, 1, 2, 1, 0, 1, 1, 1, 1, 1, 0, 1, 2, 1, 1, 1, 1],
    [0, 0, 0, 1, 2, 1, 0, 0, 0, 0, 0, 0, 0, 1, 2, 1, 0, 0, 0],
    [1, 1, 1, 1, 2, 1, 0, 1, 1, 1, 1, 1, 0, 1, 2, 1, 1, 1, 1],
    [1, 2, 2, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 2, 2, 2, 1],
    [1, 2, 1, 1, 2, 1, 1, 1, 2, 1, 2, 1, 1, 1, 2, 1, 1, 2, 1],
    [1, 3, 2, 1, 2, 2, 2, 2, 2, 0, 2, 2, 2, 2, 2, 1, 2, 3, 1],
    [1, 1, 2, 1, 2, 1, 2, 1, 1, 1, 1, 1, 2, 1, 2, 1, 2, 1, 1],
    [1, 2, 2, 2, 2, 1, 2, 2, 2, 1, 2, 2, 2, 1, 2, 2, 2, 2, 1],
    [1, 2, 1, 1, 1, 1, 1, 1, 2, 1, 2, 1, 1, 1, 1, 1, 1, 2, 1],
    [1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  ];
  const ROWS = MAZE.length;
  const COLS = MAZE[0].length;
  const DIRS = [
    { x: 1, y: 0 },
    { x: -1, y: 0 },
    { x: 0, y: -1 },
    { x: 0, y: 1 },
  ];

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

  function cloneMaze() {
    return MAZE.map(function (row) {
      return row.slice();
    });
  }

  function isWall(grid, c, r, allowGate) {
    if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return true;
    var cell = grid[r][c];
    if (cell === 1) return true;
    if (cell === 4 && !allowGate) return true;
    return false;
  }

  function wrapCol(c) {
    if (c < 0) return COLS - 1;
    if (c >= COLS) return 0;
    return c;
  }

  function countPellets(grid) {
    var n = 0;
    for (var r = 0; r < grid.length; r++) {
      for (var c = 0; c < grid[r].length; c++) {
        if (grid[r][c] === 2 || grid[r][c] === 3) n++;
      }
    }
    return n;
  }

  function playPacmanTransition(url, direction) {
    if (document.getElementById("pwnhub-pacman-overlay")) return;

    var overlay = document.createElement("div");
    overlay.id = "pwnhub-pacman-overlay";
    overlay.setAttribute("role", "presentation");
    overlay.tabIndex = 0;
    overlay.style.cssText =
      "position:fixed;inset:0;z-index:2147483646;background:#000;display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:default;outline:none";

    var canvas = document.createElement("canvas");
    overlay.appendChild(canvas);
    document.body.appendChild(overlay);
    document.documentElement.style.overflow = "hidden";
    overlay.focus();

    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var ctx = canvas.getContext("2d");

    var finished = false;
    var mode = "cinema";
    var cinemaRaf = 0;
    var gameRaf = 0;
    var failSafe = 0;
    var powerUntil = 0;
    var score = 0;
    var lives = 3;
    var mouth = 0;
    var lastTs = 0;
    var invulnUntil = 0;
    var won = false;
    var deadFlash = 0;
    var keys = {};

    function finish() {
      if (finished) return;
      finished = true;
      window.clearTimeout(failSafe);
      cancelAnimationFrame(cinemaRaf);
      cancelAnimationFrame(gameRaf);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      setHandoffCookie(direction);
      window.location.replace(withXSiteParam(url, direction));
    }

    function onKeyDown(e) {
      if (e.code === "Space") {
        e.preventDefault();
        if (mode === "cinema") startGame();
        return;
      }
      if (e.code === "Escape" || e.code === "Enter") {
        e.preventDefault();
        finish();
        return;
      }
      if (mode === "game") {
        keys[e.code] = true;
        e.preventDefault();
      }
    }
    function onKeyUp(e) {
      delete keys[e.code];
    }
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    var chaseGhost = direction === "to-portfolio";
    var cinemaW = 0;
    var cinemaH = 0;

    function sizeCinema() {
      cinemaW = Math.min(window.innerWidth, 960);
      cinemaH = Math.min(Math.round(window.innerHeight * 0.48), 360);
      canvas.width = Math.round(cinemaW * dpr);
      canvas.height = Math.round(cinemaH * dpr);
      canvas.style.width = cinemaW + "px";
      canvas.style.height = cinemaH + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function drawPacFace(x, y, r, facing, open) {
      var base = Math.atan2(facing.y, facing.x);
      var a = (0.18 + open * 0.32) * Math.PI;
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
      ctx.arc(r * 0.08, -r * 0.42, r * 0.12, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    function drawGhostBody(x, y, r, bodyColor, look, frightened) {
      var w = r * 1.75;
      var h = r * 2.15;
      var left = -w / 2;
      var right = w / 2;
      var top = -h * 0.48;
      var skirt = h * 0.38;
      var domeR = w / 2;

      ctx.save();
      ctx.translate(x, y);
      ctx.fillStyle = frightened ? "#2121ff" : bodyColor;
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
      } else {
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.ellipse(-eyeX, eyeY, eyeRx, eyeRy, 0, 0, Math.PI * 2);
        ctx.ellipse(eyeX, eyeY, eyeRx, eyeRy, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#2121de";
        var lx = look.x * eyeRx * 0.4;
        var ly = look.y * eyeRy * 0.35;
        var pupilR = eyeRx * 0.48;
        ctx.beginPath();
        ctx.arc(-eyeX + lx, eyeY + ly, pupilR, 0, Math.PI * 2);
        ctx.arc(eyeX + lx, eyeY + ly, pupilR, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    sizeCinema();
    var t0 = performance.now();
    failSafe = window.setTimeout(finish, CINEMA_MS + 800);

    var laneL = cinemaW * 0.07;
    var laneR = cinemaW * 0.93;
    var R0 = Math.max(18, Math.min(28, cinemaW * 0.034));
    var pathLen0 = laneR - laneL - R0 * 3;
    var candy = [];
    for (var i = 0; i < 20; i++) {
      candy.push({
        x: laneL + R0 * 2.2 + (pathLen0 * i) / 19,
        eaten: false,
        power: i === 0 || i === 19,
      });
    }

    function cinemaFrame(now) {
      if (mode !== "cinema" || finished) return;
      var W = cinemaW;
      var H = cinemaH;
      var cy = H * 0.5;
      var R = Math.max(18, Math.min(28, W * 0.034));
      var lL = W * 0.07;
      var lR = W * 0.93;
      var pathLen = lR - lL - R * 3;
      var t = Math.min(1, (now - t0) / CINEMA_MS);
      var e = t * t * (3 - 2 * t);

      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, W, H);

      var top = cy - R * 2.7;
      var bot = cy + R * 2.7;
      ctx.strokeStyle = "#2121de";
      ctx.lineWidth = 4;
      ctx.strokeRect(lL - 10, top - 6, lR - lL + 20, bot - top + 12);

      var pacX = lL + R * 1.6 + pathLen * e;
      var open = (Math.sin(now / 60) + 1) / 2;
      var ghostX;
      var frightened = false;
      var eaten = false;

      if (chaseGhost) {
        frightened = t > 0.25;
        var lead = R * 5 * (1 - e * 0.7) + R * 1.4;
        ghostX = Math.min(lR - R, pacX + lead);
        if (t > 0.78) ghostX = pacX + R * 0.85;
        if (t > 0.88) eaten = true;
      } else {
        var minGap = R * 2.8;
        var startGap = R * 6.5;
        var gap = startGap - e * (startGap - minGap);
        ghostX = pacX - Math.max(gap, minGap);
        if (ghostX < lL + R) ghostX = lL + R;
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

      if (!eaten) {
        drawGhostBody(ghostX, cy, R, "#ff0000", { x: 1, y: 0 }, frightened);
      }
      drawPacFace(pacX, cy, R, { x: 1, y: 0 }, open);

      ctx.fillStyle = "rgba(255,255,255,0.75)";
      ctx.font = "13px Monaco, Menlo, monospace";
      ctx.textAlign = "center";
      ctx.fillText(chaseGhost ? "→ portfolio" : "→ blog", W / 2, H - 28);
      ctx.fillStyle = "#ffcc00";
      ctx.font = "12px Monaco, Menlo, monospace";
      ctx.fillText("space = play for real   ·   esc = skip", W / 2, H - 10);

      if (t < 1) cinemaRaf = requestAnimationFrame(cinemaFrame);
      else {
        window.clearTimeout(failSafe);
        window.setTimeout(finish, 80);
      }
    }

    cinemaRaf = requestAnimationFrame(cinemaFrame);

    var grid = cloneMaze();
    var pac = { x: 9.5, y: 15.5, dir: { x: -1, y: 0 }, next: { x: -1, y: 0 } };
    var ghosts = [];
    var cell = 20;
    var offsetX = 0;
    var offsetY = 28;
    var remaining = 0;

    function resetActors() {
      pac = { x: 9.5, y: 15.5, dir: { x: -1, y: 0 }, next: { x: -1, y: 0 } };
      ghosts = [
        { x: 9.5, y: 9.5, dir: { x: -1, y: 0 }, color: "#ff0000", mode: "chase", home: { x: 9.5, y: 9.5 } },
        { x: 8.5, y: 9.5, dir: { x: 1, y: 0 }, color: "#ffb8ff", mode: "chase", home: { x: 8.5, y: 9.5 } },
        { x: 10.5, y: 9.5, dir: { x: -1, y: 0 }, color: "#00ffff", mode: "chase", home: { x: 10.5, y: 9.5 } },
        { x: 9.5, y: 8.5, dir: { x: 0, y: -1 }, color: "#ffb852", mode: "chase", home: { x: 9.5, y: 8.5 } },
      ];
    }

    function layoutGame() {
      var maxW = Math.min(window.innerWidth - 24, 720);
      var maxH = Math.min(window.innerHeight - 80, 760);
      cell = Math.floor(Math.min(maxW / COLS, maxH / ROWS));
      var w = cell * COLS;
      var h = cell * ROWS + 36;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      offsetX = 0;
      offsetY = 28;
    }

    function startGame() {
      if (mode === "game") return;
      mode = "game";
      window.clearTimeout(failSafe);
      cancelAnimationFrame(cinemaRaf);
      overlay.style.cursor = "none";
      grid = cloneMaze();
      remaining = countPellets(grid);
      score = 0;
      lives = 3;
      powerUntil = 0;
      invulnUntil = 0;
      won = false;
      deadFlash = 0;
      resetActors();
      layoutGame();
      lastTs = performance.now();
      gameRaf = requestAnimationFrame(gameFrame);
    }

    function wantDir() {
      if (keys.ArrowRight || keys.KeyD) return { x: 1, y: 0 };
      if (keys.ArrowLeft || keys.KeyA) return { x: -1, y: 0 };
      if (keys.ArrowUp || keys.KeyW) return { x: 0, y: -1 };
      if (keys.ArrowDown || keys.KeyS) return { x: 0, y: 1 };
      return null;
    }

    function nearCenter(v) {
      return Math.abs(v - Math.floor(v) - 0.5) < 0.12;
    }

    function tryTurn(entity, next, allowGate) {
      if (!nearCenter(entity.x) || !nearCenter(entity.y)) return false;
      var cx = Math.floor(entity.x);
      var cy = Math.floor(entity.y);
      var nx = wrapCol(cx + next.x);
      var ny = cy + next.y;
      if (isWall(grid, nx, ny, allowGate)) return false;
      entity.x = cx + 0.5;
      entity.y = cy + 0.5;
      entity.dir = next;
      return true;
    }

    function moveEntity(entity, speed, dt, allowGate) {
      var step = speed * dt;
      var cx = Math.floor(entity.x);
      var cy = Math.floor(entity.y);
      var aheadC = wrapCol(cx + entity.dir.x);
      var aheadR = cy + entity.dir.y;
      if (
        isWall(grid, aheadC, aheadR, allowGate) &&
        nearCenter(entity.x) &&
        nearCenter(entity.y)
      ) {
        entity.x = cx + 0.5;
        entity.y = cy + 0.5;
        return;
      }
      entity.x += entity.dir.x * step;
      entity.y += entity.dir.y * step;
      if (entity.x < 0) entity.x += COLS;
      if (entity.x >= COLS) entity.x -= COLS;
    }

    function pickGhostDir(g) {
      var cx = Math.floor(g.x);
      var cy = Math.floor(g.y);
      if (!nearCenter(g.x) || !nearCenter(g.y)) return;

      var options = [];
      for (var di = 0; di < DIRS.length; di++) {
        var d = DIRS[di];
        if (d.x === -g.dir.x && d.y === -g.dir.y) continue;
        var nx = wrapCol(cx + d.x);
        var ny = cy + d.y;
        if (!isWall(grid, nx, ny, g.mode === "eaten")) options.push(d);
      }
      if (options.length === 0) {
        g.dir = { x: -g.dir.x, y: -g.dir.y };
        return;
      }

      var targetX = pac.x;
      var targetY = pac.y;
      if (g.mode === "eaten") {
        targetX = g.home.x;
        targetY = g.home.y;
      } else if (g.mode === "frightened") {
        g.dir = options[Math.floor(Math.random() * options.length)];
        g.x = cx + 0.5;
        g.y = cy + 0.5;
        return;
      } else {
        if (g.color === "#00ffff") {
          targetX = pac.x + pac.dir.x * 2;
          targetY = pac.y + pac.dir.y * 2;
        } else if (g.color === "#ffb852") {
          targetX = pac.x - 2;
          targetY = pac.y;
        } else if (g.color === "#ffb8ff") {
          targetX = pac.x;
          targetY = pac.y - 2;
        }
      }

      var best = options[0];
      var bestD = Infinity;
      for (var oi = 0; oi < options.length; oi++) {
        var od = options[oi];
        var ox = wrapCol(cx + od.x) + 0.5;
        var oy = cy + od.y + 0.5;
        var dist = (ox - targetX) * (ox - targetX) + (oy - targetY) * (oy - targetY);
        if (dist < bestD) {
          bestD = dist;
          best = od;
        }
      }
      g.dir = best;
      g.x = cx + 0.5;
      g.y = cy + 0.5;
    }

    function killPac(now) {
      if (now < invulnUntil) return;
      lives -= 1;
      deadFlash = now + 700;
      invulnUntil = now + 1200;
      if (lives <= 0) {
        window.setTimeout(finish, 900);
        return;
      }
      resetActors();
      for (var gi = 0; gi < ghosts.length; gi++) ghosts[gi].mode = "chase";
      powerUntil = 0;
    }

    function gameFrame(now) {
      if (mode !== "game" || finished) return;
      var dt = Math.min(0.04, (now - lastTs) / 1000);
      lastTs = now;
      mouth = (mouth + dt * 10) % (Math.PI * 2);

      if (!won && lives > 0 && now > deadFlash) {
        var wdir = wantDir();
        if (wdir) pac.next = wdir;
        tryTurn(pac, pac.next);
        moveEntity(pac, 5.2, dt);

        var pc = Math.floor(pac.x);
        var pr = Math.floor(pac.y);
        if (pr >= 0 && pr < ROWS) {
          var cellV = grid[pr][pc];
          if (cellV === 2) {
            grid[pr][pc] = 0;
            score += 10;
            remaining -= 1;
          } else if (cellV === 3) {
            grid[pr][pc] = 0;
            score += 50;
            remaining -= 1;
            powerUntil = now + 6000;
            for (var gi = 0; gi < ghosts.length; gi++) {
              if (ghosts[gi].mode !== "eaten") ghosts[gi].mode = "frightened";
            }
          }
        }

        if (remaining <= 0) {
          won = true;
          window.setTimeout(finish, 1200);
        }

        var frightened = now < powerUntil;
        if (!frightened) {
          for (var gj = 0; gj < ghosts.length; gj++) {
            if (ghosts[gj].mode === "frightened") ghosts[gj].mode = "chase";
          }
        }

        for (var gk = 0; gk < ghosts.length; gk++) {
          var g = ghosts[gk];
          if (g.mode === "eaten") {
            var dx = g.home.x - g.x;
            var dy = g.home.y - g.y;
            if (dx * dx + dy * dy < 0.08) {
              g.mode = "chase";
              g.x = g.home.x;
              g.y = g.home.y;
            }
          }
          pickGhostDir(g);
          var spd = g.mode === "frightened" ? 2.8 : g.mode === "eaten" ? 7 : 4.2;
          moveEntity(g, spd, dt, g.mode === "eaten");

          var ddx = g.x - pac.x;
          var ddy = g.y - pac.y;
          if (ddx * ddx + ddy * ddy < 0.35) {
            if (g.mode === "frightened") {
              g.mode = "eaten";
              score += 200;
            } else if (g.mode === "chase") {
              killPac(now);
            }
          }
        }
      }

      var W = cell * COLS;
      var H = cell * ROWS + 36;
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, W, H);

      ctx.fillStyle = "#ffcc00";
      ctx.font =
        "bold " + Math.max(12, cell * 0.55) + "px Monaco, Menlo, monospace";
      ctx.textAlign = "left";
      ctx.fillText("SCORE " + score, 8, 18);
      ctx.textAlign = "right";
      ctx.fillText("♥".repeat(Math.max(0, lives)), W - 8, 18);
      ctx.textAlign = "center";
      ctx.fillStyle = "rgba(255,255,255,0.45)";
      ctx.font = "11px Monaco, Menlo, monospace";
      ctx.fillText("arrows/wasd  ·  esc continue", W / 2, 18);

      for (var r = 0; r < ROWS; r++) {
        for (var c = 0; c < COLS; c++) {
          var v = grid[r][c];
          var x = offsetX + c * cell;
          var y = offsetY + r * cell;
          if (v === 1) {
            ctx.fillStyle = "#2121de";
            ctx.fillRect(x + 1, y + 1, cell - 2, cell - 2);
          } else if (v === 4) {
            ctx.fillStyle = "#ffb8ff";
            ctx.fillRect(x + 2, y + cell * 0.42, cell - 4, 2);
          } else if (v === 2) {
            ctx.fillStyle = "#ffb897";
            ctx.beginPath();
            ctx.arc(x + cell / 2, y + cell / 2, cell * 0.1, 0, Math.PI * 2);
            ctx.fill();
          } else if (v === 3) {
            ctx.fillStyle = "#ffb897";
            ctx.beginPath();
            ctx.arc(x + cell / 2, y + cell / 2, cell * 0.28, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      var prr = cell * 0.42;
      for (var gl = 0; gl < ghosts.length; gl++) {
        var gg = ghosts[gl];
        var gx = offsetX + gg.x * cell;
        var gy = offsetY + gg.y * cell;
        if (gg.mode === "eaten") {
          ctx.fillStyle = "#fff";
          ctx.beginPath();
          ctx.ellipse(gx - 4, gy, 3.5, 4, 0, 0, Math.PI * 2);
          ctx.ellipse(gx + 4, gy, 3.5, 4, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#2121de";
          ctx.beginPath();
          ctx.arc(gx - 3, gy, 1.5, 0, Math.PI * 2);
          ctx.arc(gx + 5, gy, 1.5, 0, Math.PI * 2);
          ctx.fill();
        } else {
          drawGhostBody(gx, gy, prr, gg.color, gg.dir, gg.mode === "frightened");
        }
      }

      if (now > deadFlash || lives <= 0) {
        var open = (Math.sin(mouth) + 1) / 2;
        drawPacFace(
          offsetX + pac.x * cell,
          offsetY + pac.y * cell,
          prr,
          pac.dir,
          open,
        );
      }

      if (won) {
        ctx.fillStyle = "rgba(0,0,0,0.55)";
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = "#ffcc00";
        ctx.font = "bold " + Math.max(18, cell) + "px Monaco, Menlo, monospace";
        ctx.textAlign = "center";
        ctx.fillText("YOU WIN", W / 2, H / 2);
        ctx.font = "12px Monaco, Menlo, monospace";
        ctx.fillStyle = "#fff";
        ctx.fillText("warping…", W / 2, H / 2 + 28);
      } else if (lives <= 0) {
        ctx.fillStyle = "rgba(0,0,0,0.55)";
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = "#ff5555";
        ctx.font = "bold " + Math.max(18, cell) + "px Monaco, Menlo, monospace";
        ctx.textAlign = "center";
        ctx.fillText("GAME OVER", W / 2, H / 2);
        ctx.font = "12px Monaco, Menlo, monospace";
        ctx.fillStyle = "#fff";
        ctx.fillText("still sending you…", W / 2, H / 2 + 28);
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
