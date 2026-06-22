// Shared per-connection SSH bridge: spawns a real `ssh terminal.shop` inside a
// PTY and pipes it to/from a WebSocket. Used by both the dev Vite plugin and
// the standalone preview server.
const SSH_HOST = "terminal.shop"
let _pty = null

export async function handleSsh(ws) {
  if (!_pty) {
    const mod = await import("node-pty")
    _pty = mod.default ?? mod
  }
  const pty = _pty

  let term
  try {
    term = pty.spawn(
      "ssh",
      [
        "-tt",
        "-o", "StrictHostKeyChecking=accept-new",
        "-o", "UserKnownHostsFile=/dev/null",
        "-o", "LogLevel=ERROR", // hide the "permanently added host" notice
        "-o", "ConnectTimeout=8",
        SSH_HOST,
      ],
      {
        name: "xterm-256color",
        cols: 220,
        rows: 50,
        cwd: process.env.HOME || process.cwd(),
        env: process.env,
      }
    )
  } catch (e) {
    try {
      ws.send("\r\n[ssh spawn failed: " + e.message + "]\r\n")
      ws.close()
    } catch {}
    return
  }

  term.onData(d => {
    if (ws.readyState === 1) ws.send(d)
  })
  term.onExit(() => {
    try { ws.close() } catch {}
  })

  ws.on("message", raw => {
    const msg = raw.toString()
    if (msg.charCodeAt(0) === 1) {
      // control frame: { cols, rows }
      try {
        const { cols, rows } = JSON.parse(msg.slice(1))
        if (cols && rows) term.resize(cols, rows)
      } catch {}
    } else {
      term.write(msg)
    }
  })
  ws.on("close", () => {
    try { term.kill() } catch {}
  })
}
