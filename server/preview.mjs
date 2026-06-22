import http from "node:http"
import path from "node:path"
import fs from "node:fs"
import { fileURLToPath } from "node:url"
import sirv from "sirv"
import { WebSocketServer } from "ws"
import { handleSsh } from "./ssh-bridge.mjs"

// Standalone preview server: serves the built static site AND hosts the real
// `ssh terminal.shop` bridge at /__ssh on the same origin. This is what
// `pnpm run preview` runs, so the live terminal works without the dev server.
// a static-file stream getting aborted by the browser (navigation / close) can
// emit an unhandled 'error'; keep the long-running preview server alive
process.on("uncaughtException", e =>
  console.error("[preview] uncaught:", e?.message || e)
)
process.on("unhandledRejection", e =>
  console.error("[preview] rejection:", e?.message || e)
)

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const dist = path.join(root, "dist")

if (!fs.existsSync(path.join(dist, "index.html"))) {
  console.error("\n  ✗ dist/ not found — run `pnpm build` first (or `pnpm preview` builds for you).\n")
  process.exit(1)
}

const serve = sirv(dist, { dev: false, etag: true, single: false })

const server = http.createServer((req, res) => {
  serve(req, res, () => {
    res.statusCode = 404
    res.end("Not found")
  })
})

const wss = new WebSocketServer({ noServer: true })
wss.on("connection", ws => handleSsh(ws))

server.on("upgrade", (req, socket, head) => {
  if (req.url && req.url.startsWith("/__ssh")) {
    wss.handleUpgrade(req, socket, head, ws => wss.emit("connection", ws, req))
  } else {
    socket.destroy()
  }
})

const port = Number(process.env.PORT) || 4321
const host = process.env.HOST || "0.0.0.0"
server.listen(port, host, () => {
  console.log(`\n  ▶ preview + live ssh terminal → http://localhost:${port}/\n`)
})
