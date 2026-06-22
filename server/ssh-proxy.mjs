import { handleSsh } from "./ssh-bridge.mjs"

// Vite plugin: SSH<->WebSocket bridge at /__ssh for `astro dev`. (Production /
// `pnpm run preview` is served by server/preview.mjs, which hosts the same
// bridge — see package.json.)
export function sshTerminal() {
  let wss = null

  async function ensure() {
    if (wss) return wss
    const { WebSocketServer } = await import("ws")
    wss = new WebSocketServer({ noServer: true })
    wss.on("connection", ws => handleSsh(ws))
    return wss
  }

  const attach = server => {
    const httpServer = server?.httpServer
    if (!httpServer) return
    httpServer.on("upgrade", async (req, socket, head) => {
      if (!req.url || !req.url.startsWith("/__ssh")) return // let Vite HMR handle the rest
      try {
        const w = await ensure()
        w.handleUpgrade(req, socket, head, ws => w.emit("connection", ws, req))
      } catch {
        try { socket.destroy() } catch {}
      }
    })
  }

  return {
    name: "ssh-terminal-proxy",
    apply: "serve",
    configureServer: attach,
  }
}
