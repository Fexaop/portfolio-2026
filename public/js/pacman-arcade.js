"use strict";
(() => {
  // lib/pacman-arcade.ts
  var NONE = 4;
  var UP = 3;
  var LEFT = 2;
  var DOWN = 1;
  var RIGHT = 11;
  var PLAYING = 7;
  var EATEN_PAUSE = 9;
  var DYING = 10;
  var WALL = 0;
  var BISCUIT = 1;
  var EMPTY = 2;
  var BLOCK = 3;
  var PILL = 4;
  var FPS = 30;
  var COLS = 19;
  var ROWS = 22;
  var MAP = [
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    [0, 4, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0, 4, 0],
    [0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0],
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    [0, 1, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 1, 0],
    [0, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 0],
    [0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0],
    [2, 2, 2, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 2, 2, 2],
    [0, 0, 0, 0, 1, 0, 1, 0, 0, 3, 0, 0, 1, 0, 1, 0, 0, 0, 0],
    [2, 2, 2, 2, 1, 1, 1, 0, 3, 3, 3, 0, 1, 1, 1, 2, 2, 2, 2],
    [0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0],
    [2, 2, 2, 0, 1, 0, 1, 1, 1, 2, 1, 1, 1, 0, 1, 0, 2, 2, 2],
    [0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0],
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    [0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0],
    [0, 4, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 4, 0],
    [0, 0, 1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 1, 0, 0],
    [0, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 0],
    [0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0],
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
  ];
  function cloneMap() {
    return MAP.map((row) => row.slice());
  }
  function countFood(map) {
    let n = 0;
    for (const row of map) for (const c of row) if (c === BISCUIT || c === PILL) n++;
    return n;
  }
  function onWholeSquare(x) {
    return x % 10 === 0;
  }
  function pointToCoord(x) {
    return Math.round(x / 10);
  }
  function nextSquare(x, dir) {
    const rem = x % 10;
    if (rem === 0) return x;
    if (dir === RIGHT || dir === DOWN) return x + (10 - rem);
    return x - rem;
  }
  function opposite(dir) {
    if (dir === LEFT) return RIGHT;
    if (dir === RIGHT) return LEFT;
    if (dir === UP) return DOWN;
    return UP;
  }
  function isMidSquare(x) {
    const rem = x % 10;
    return rem > 3 && rem < 7;
  }
  function createArcade() {
    const map = cloneMap();
    let foodLeft = countFood(map);
    let tick = 0;
    let state = PLAYING;
    let timerStart = 0;
    let score = 0;
    let lives = 3;
    let won = false;
    const user = {
      pos: { x: 90, y: 120 },
      dir: LEFT,
      due: LEFT
    };
    const GHOST_SPAWNS = [
      { x: 90, y: 80 },
      { x: 70, y: 80 },
      { x: 110, y: 80 },
      { x: 50, y: 80 }
    ];
    const ghosts = [
      { pos: { ...GHOST_SPAWNS[0] }, dir: LEFT, due: LEFT, colour: "#FF0000", eatable: null, eaten: null },
      { pos: { ...GHOST_SPAWNS[1] }, dir: RIGHT, due: RIGHT, colour: "#00FFDE", eatable: null, eaten: null },
      { pos: { ...GHOST_SPAWNS[2] }, dir: LEFT, due: LEFT, colour: "#FFB8DE", eatable: null, eaten: null },
      { pos: { ...GHOST_SPAWNS[3] }, dir: RIGHT, due: RIGHT, colour: "#FFB847", eatable: null, eaten: null }
    ];
    function within(y, x) {
      return y >= 0 && y < ROWS && x >= 0 && x < COLS;
    }
    function cellAt(y, x) {
      if (!within(y, x)) return WALL;
      return map[y][x];
    }
    function isWall(y, x) {
      const c = cellAt(y, x);
      return c === WALL || c === BLOCK;
    }
    function isFloor(y, x) {
      const c = cellAt(y, x);
      return c === EMPTY || c === BISCUIT || c === PILL;
    }
    function nextBlock(pos, dir) {
      return {
        y: pointToCoord(nextSquare(pos.y, dir)),
        x: pointToCoord(nextSquare(pos.x, dir))
      };
    }
    function onGrid(pos) {
      return onWholeSquare(pos.x) && onWholeSquare(pos.y);
    }
    function step(dir, speed, current) {
      const xs = dir === LEFT ? -speed : dir === RIGHT ? speed : 0;
      const ys = dir === DOWN ? speed : dir === UP ? -speed : 0;
      return { x: bound(current.x, xs), y: bound(current.y, ys) };
    }
    function bound(x1, x2) {
      const rem = x1 % 10;
      const result = rem + x2;
      if (rem !== 0 && result > 10) return x1 + (10 - rem);
      if (rem > 0 && result < 0) return x1 - rem;
      return x1 + x2;
    }
    function tunnel(pos, dir) {
      if (pos.y === 100 && pos.x >= 190 && dir === RIGHT) return { y: 100, x: -10 };
      if (pos.y === 100 && pos.x <= -10 && dir === LEFT) return { y: 100, x: 190 };
      return pos;
    }
    function dirsFrom(dir) {
      return dir === LEFT || dir === RIGHT ? [UP, DOWN] : [LEFT, RIGHT];
    }
    function randomPerp(dir) {
      const moves = dirsFrom(dir);
      return moves[Math.floor(Math.random() * 2)];
    }
    function resetActors() {
      user.pos = { x: 90, y: 120 };
      user.dir = LEFT;
      user.due = LEFT;
      ghosts.forEach((g, i) => {
        g.pos = { ...GHOST_SPAWNS[i] };
        g.dir = i % 2 === 0 ? LEFT : RIGHT;
        g.due = g.dir;
        g.eatable = null;
        g.eaten = null;
      });
    }
    function samePlane(a, b) {
      return (a === LEFT || a === RIGHT) && (b === LEFT || b === RIGHT) || (a === UP || a === DOWN) && (b === UP || b === DOWN);
    }
    function moveUser() {
      let npos = null;
      if (user.due !== user.dir && user.due !== NONE) {
        const trial = step(user.due, 2, user.pos);
        if (samePlane(user.due, user.dir) || onGrid(user.pos) && isFloor(nextBlock(trial, user.due).y, nextBlock(trial, user.due).x)) {
          user.dir = user.due;
          npos = trial;
        }
      }
      if (npos === null) npos = step(user.dir === NONE ? LEFT : user.dir, 2, user.pos);
      if (user.dir !== NONE && onGrid(user.pos)) {
        const nxt = nextBlock(npos, user.dir);
        if (isWall(nxt.y, nxt.x)) {
          user.dir = NONE;
        }
      }
      if (user.dir === NONE) {
        for (const d of [user.due, LEFT, RIGHT, UP, DOWN]) {
          if (d === NONE) continue;
          const t = step(d, 2, user.pos);
          const nb = nextBlock(t, d);
          if (isFloor(nb.y, nb.x)) {
            user.dir = d;
            user.due = d;
            npos = t;
            break;
          }
        }
      }
      if (user.dir === NONE || npos === null) return;
      user.pos = tunnel(npos, user.dir);
      const whole = nextBlock(user.pos, user.dir);
      if (!within(whole.y, whole.x)) return;
      const block = map[whole.y][whole.x];
      if ((isMidSquare(user.pos.y) || isMidSquare(user.pos.x)) && (block === BISCUIT || block === PILL)) {
        map[whole.y][whole.x] = EMPTY;
        score += block === BISCUIT ? 10 : 50;
        foodLeft -= 1;
        if (block === PILL) {
          for (const g of ghosts) {
            g.dir = opposite(g.dir);
            g.eatable = tick;
            g.eaten = null;
          }
        }
        if (foodLeft <= 0) won = true;
      }
    }
    function ghostVulnerable(g) {
      return g.eatable !== null;
    }
    function ghostHidden(g) {
      return g.eatable === null && g.eaten !== null;
    }
    function ghostSpeed(g) {
      if (ghostVulnerable(g)) return 1;
      if (ghostHidden(g)) return 4;
      return 2;
    }
    function moveGhost(g) {
      if (g.eatable !== null && (tick - g.eatable) / FPS > 8) g.eatable = null;
      if (g.eaten !== null && (tick - g.eaten) / FPS > 3) {
        g.eaten = null;
        g.pos = { x: 90, y: 80 };
      }
      const onG = onGrid(g.pos);
      let npos = null;
      if (g.due !== g.dir) {
        const trial = step(g.due, ghostSpeed(g), g.pos);
        if (onG && isFloor(nextBlock(trial, g.due).y, nextBlock(trial, g.due).x)) {
          g.dir = g.due;
          npos = trial;
        }
      }
      if (npos === null) npos = step(g.dir, ghostSpeed(g), g.pos);
      if (onG) {
        const nxt = nextBlock(npos, g.dir);
        if (isWall(nxt.y, nxt.x)) {
          g.due = randomPerp(g.dir);
          const tryDirs = [g.due, opposite(g.due), ...dirsFrom(g.due), g.dir];
          for (const d of tryDirs) {
            const t = step(d, ghostSpeed(g), g.pos);
            const nb = nextBlock(t, d);
            if (isFloor(nb.y, nb.x)) {
              g.dir = d;
              g.due = d;
              npos = t;
              break;
            }
          }
        }
      }
      g.pos = tunnel(npos, g.dir);
      g.due = randomPerp(g.dir);
    }
    function collided(a, b) {
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      return Math.sqrt(dx * dx + dy * dy) < 10;
    }
    function resetAfterDeath() {
      lives -= 1;
      resetActors();
      state = PLAYING;
    }
    function delta(dir) {
      if (dir === LEFT) return { dx: -1, dy: 0 };
      if (dir === RIGHT) return { dx: 1, dy: 0 };
      if (dir === UP) return { dx: 0, dy: -1 };
      return { dx: 0, dy: 1 };
    }
    function lookAhead(from, dir, steps) {
      const { dx, dy } = delta(dir);
      let x = from.x;
      let y = from.y;
      let s = 0;
      for (let i = 0; i < steps; i++) {
        x += dx;
        y += dy;
        if (isWall(y, x) || !within(y, x)) break;
        const cell = cellAt(y, x);
        if (cell === PILL) s += 10;
        else if (cell === BISCUIT) s += 3;
        else s += 0.15;
        for (const g of ghosts) {
          if (g.eatable) {
            if (pointToCoord(g.pos.x) === x && pointToCoord(g.pos.y) === y) s += 8;
            continue;
          }
          const gdx = pointToCoord(g.pos.x) - x;
          const gdy = pointToCoord(g.pos.y) - y;
          if (gdx * gdx + gdy * gdy <= 4) s -= 12;
        }
      }
      return s;
    }
    function autoplayStep() {
      if (state !== PLAYING) return;
      if (!onGrid(user.pos)) return;
      const here = {
        x: pointToCoord(user.pos.x),
        y: pointToCoord(user.pos.y)
      };
      const options = [];
      for (const d of [LEFT, RIGHT, UP, DOWN]) {
        const { dx, dy } = delta(d);
        if (isFloor(here.y + dy, here.x + dx)) options.push(d);
      }
      if (options.length === 0) return;
      const junction = options.length >= 3;
      let best = user.dir === NONE ? options[0] : user.dir;
      let bestS = -Infinity;
      for (const d of options) {
        if (d === opposite(user.dir) && options.length > 1) continue;
        let s = lookAhead(here, d, 10);
        if (d === user.dir) s += junction ? 0.2 : 1.2;
        if (s > bestS) {
          bestS = s;
          best = d;
        }
      }
      user.due = best;
      if (user.dir === NONE) user.dir = best;
    }
    return {
      tick() {
        tick += 1;
        if (state === EATEN_PAUSE) {
          if (tick - timerStart > FPS / 3) state = PLAYING;
          return;
        }
        if (state === DYING) {
          if (tick - timerStart > FPS * 1.4) {
            if (lives <= 1) {
              lives = 0;
              resetActors();
              lives = 3;
            } else {
              resetAfterDeath();
            }
          }
          return;
        }
        if (state !== PLAYING) return;
        for (const g of ghosts) moveGhost(g);
        moveUser();
        for (const g of ghosts) {
          if (!collided(user.pos, g.pos)) continue;
          if (ghostVulnerable(g)) {
            g.eatable = null;
            g.eaten = tick;
            score += 200;
            state = EATEN_PAUSE;
            timerStart = tick;
          } else if (g.eaten === null) {
            state = DYING;
            timerStart = tick;
          }
        }
      },
      draw() {
      },
      setDue(dir) {
        user.due = dir;
        if (user.dir === NONE) user.dir = dir;
      },
      autoplayStep,
      getPacScreen(blockSize) {
        return {
          x: user.pos.x / 10 * blockSize + blockSize / 2,
          y: user.pos.y / 10 * blockSize + blockSize / 2
        };
      },
      getScore: () => score,
      getLives: () => lives,
      worldW: (blockSize) => COLS * blockSize,
      worldH: (blockSize) => ROWS * blockSize + 28,
      cols: COLS,
      rows: ROWS,
      won: () => won,
      dead: () => lives <= 0 && state === DYING,
      // expose for renderer
      _raw: () => ({ map, user, ghosts, tick, state, WALL, BISCUIT, EMPTY, BLOCK, PILL, COLS, ROWS })
    };
  }
  function drawArcade(ctx, game, blockSize) {
    const raw = game._raw();
    const { map, user, ghosts, tick } = raw;
    const W = COLS * blockSize;
    const H = ROWS * blockSize + 28;
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, W, H);
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const cell = map[r][c];
        const x = c * blockSize;
        const y = r * blockSize;
        if (cell === WALL || cell === BLOCK) {
          ctx.fillStyle = "#2121de";
          ctx.fillRect(x + 1, y + 1, blockSize - 2, blockSize - 2);
        } else if (cell === BISCUIT) {
          ctx.fillStyle = "#ffb897";
          ctx.beginPath();
          ctx.arc(x + blockSize / 2, y + blockSize / 2, Math.max(2, blockSize * 0.12), 0, Math.PI * 2);
          ctx.fill();
        } else if (cell === PILL) {
          const pulse = 0.22 + 0.06 * Math.sin(tick / 4);
          ctx.fillStyle = "#fff";
          ctx.beginPath();
          ctx.arc(x + blockSize / 2, y + blockSize / 2, blockSize * pulse, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
    function drawGhost(pos, dir, colour, eatable, eaten) {
      const x = pos.x / 10 * blockSize + blockSize / 2;
      const y = pos.y / 10 * blockSize + blockSize / 2;
      const s = blockSize * 0.92;
      if (eaten !== null && eatable === null) {
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.ellipse(x - 4, y, 3, 3.5, 0, 0, Math.PI * 2);
        ctx.ellipse(x + 4, y, 3, 3.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#2121de";
        ctx.beginPath();
        ctx.arc(x - 3, y, 1.4, 0, Math.PI * 2);
        ctx.arc(x + 5, y, 1.4, 0, Math.PI * 2);
        ctx.fill();
        return;
      }
      const flash = eatable !== null && (tick - eatable) / FPS > 5 && tick % 16 > 8;
      ctx.fillStyle = eatable !== null ? flash ? "#fff" : "#2121ff" : colour;
      const left = x - s / 2;
      const right = x + s / 2;
      const top = y - s / 2;
      const base = y + s / 2 - 2;
      ctx.beginPath();
      ctx.moveTo(left, base);
      ctx.lineTo(left, top + s / 2);
      ctx.arc(x, top + s / 2, s / 2, Math.PI, 0, false);
      ctx.lineTo(right, base);
      const wave = s / 4;
      for (let i = 0; i < 4; i++) {
        const x0 = right - i * wave;
        ctx.quadraticCurveTo(x0 - wave / 2, base + 4, x0 - wave, base);
      }
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.ellipse(x - 5, y - 2, 3.2, 4, 0, 0, Math.PI * 2);
      ctx.ellipse(x + 5, y - 2, 3.2, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      const look = dir === LEFT ? [-1.5, 0] : dir === RIGHT ? [1.5, 0] : dir === UP ? [0, -1.5] : [0, 1.5];
      ctx.fillStyle = eatable !== null ? "#2121ff" : "#2121de";
      ctx.beginPath();
      ctx.arc(x - 5 + look[0], y - 2 + look[1], 1.6, 0, Math.PI * 2);
      ctx.arc(x + 5 + look[0], y - 2 + look[1], 1.6, 0, Math.PI * 2);
      ctx.fill();
    }
    for (const g of ghosts) {
      drawGhost(g.pos, g.dir, g.colour, g.eatable, g.eaten);
    }
    const px = user.pos.x / 10 * blockSize + blockSize / 2;
    const py = user.pos.y / 10 * blockSize + blockSize / 2;
    const mouth = 0.2 + 0.25 * (0.5 + 0.5 * Math.sin(tick / 2));
    const ang = user.dir === RIGHT ? 0 : user.dir === DOWN ? Math.PI / 2 : user.dir === LEFT ? Math.PI : user.dir === UP ? -Math.PI / 2 : 0;
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(ang);
    ctx.fillStyle = "#ffcc00";
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, blockSize * 0.42, mouth * Math.PI, -mouth * Math.PI, false);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = "#0a0a14";
    ctx.fillRect(0, ROWS * blockSize, W, 28);
    ctx.fillStyle = "#ffcc00";
    ctx.font = "12px Monaco, Menlo, monospace";
    ctx.textAlign = "left";
    ctx.fillText(`SCORE ${game.getScore()}`, 8, ROWS * blockSize + 18);
    ctx.textAlign = "right";
    ctx.fillText("\u2665".repeat(Math.max(0, game.getLives())), W - 8, ROWS * blockSize + 18);
  }

  // lib/pacman-arcade-global.ts
  window.PwnhubArcade = {
    createArcade,
    drawArcade,
    LEFT,
    RIGHT,
    UP,
    DOWN
  };
})();
