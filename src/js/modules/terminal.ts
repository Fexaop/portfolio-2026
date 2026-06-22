import { Raf } from "../utils/subscribable"
import { clamp, lerp } from "../utils/math"
import { TerminalGl } from "../gl/terminal"

const wait = (ms: number) => new Promise(r => setTimeout(r, ms))

const SIM_LINES = [
  "$ ssh terminal.shop",
  "",
  "  ☕  terminal.shop — the coffee shop you can ssh into",
  "$ _",
]

// Architecture:
// 1. #warmSsh()  — called at construction; opens the WebSocket + starts the
//    SSH session immediately on page load. Output is buffered in #buf.
// 2. #openXterm() — called when the terminal scrolls into view (t > 0.88).
//    xterm.js is lazily loaded, opened at the correct on-screen size, then:
//      a. term.onData wired FIRST (so xterm can respond to terminal queries)
//      b. buffer flushed into term.write()
//      c. real PTY size sent to server
//    The query-response round-trip works because xterm fires onData
//    asynchronously (next animation frame), which is after we set up the
//    onData listener in the same synchronous call stack.
export class Terminal {
  #section: HTMLElement
  #stage: HTMLElement
  #screen: HTMLElement
  #content: HTMLElement | null
  #xtermDiv: HTMLDivElement | null = null
  #lp = 0
  #prevT = 0
  #xtermOpen = false
  #xtermRun = 0
  #term: any = null
  #ws: WebSocket | null = null
  #ro: ResizeObserver | null = null
  #gl: TerminalGl | null = null
  #buf: string[] = []
  #raf = Raf.subscribe(() => this.update())

  constructor(element: HTMLElement) {
    this.#section = element
    this.#stage = element.querySelector('[data-term="stage"]') as HTMLElement
    this.#screen = element.querySelector('[data-term="screen"]') as HTMLElement
    this.#content = element.querySelector('[data-term="content"]')

    try { this.#gl = new TerminalGl(this.#screen) } catch {}

    this.#warmSsh()
  }

  update() {
    const r = this.#section.getBoundingClientRect()
    const total = r.height - window.innerHeight
    const p = total > 0 ? clamp(0, 1, -r.top / total) : 0
    this.#lp = lerp(this.#lp, p, 0.12)

    if (this.#content) {
      this.#content.style.opacity = `${clamp(0, 1, 1 - this.#lp / 0.22)}`
    }

    const t = clamp(0, 1, this.#lp / 0.62)
    this.#stage.style.transform =
      `translateX(${lerp(-50, 0, t)}%) rotate(${lerp(45, 0, t)}deg) scale(${lerp(0.5, 1, t)})`

    if (this.#gl) {
      this.#gl.wave = clamp(0, 1, Math.abs(t - this.#prevT) * 80)
    }
    this.#prevT = t

    if (t > 0.88 && !this.#xtermOpen) {
      this.#xtermOpen = true
      this.#openXterm()
    }
  }

  // ── Step 1: open WebSocket + start SSH session ────────────────────────────
  #warmSsh() {
    try {
      const proto = location.protocol === "https:" ? "wss" : "ws"
      this.#ws = new WebSocket(`${proto}://${location.host}/__ssh`)
    } catch {
      return
    }

    this.#ws.onmessage = e => {
      const data = typeof e.data === "string" ? e.data : ""
      if (this.#term) {
        this.#term.write(data)
      } else {
        this.#buf.push(data)
      }
    }

    this.#ws.onclose = () => {
      if (this.#term) {
        this.#term.write("\r\n\x1b[2m— connection closed —\x1b[0m\r\n")
      }
    }
  }

  // ── Step 2: open xterm when terminal is on screen ─────────────────────────
  async #openXterm() {
    const run = ++this.#xtermRun
    try {
      const [{ Terminal: XTerm }, { FitAddon }] = await Promise.all([
        import("@xterm/xterm"),
        import("@xterm/addon-fit"),
        import("@xterm/xterm/css/xterm.css"),
      ])
      if (run !== this.#xtermRun) return

      const div = document.createElement("div")
      div.style.cssText = "position:absolute;inset:0;z-index:1;overflow:hidden"
      this.#screen.appendChild(div)
      this.#xtermDiv = div

      const term = new XTerm({
        cursorBlink: true,
        fontFamily: "GeistMono, ui-monospace, SFMono-Regular, monospace",
        fontSize: 12,
        allowTransparency: true,
        convertEol: true,
        theme: {
          background: "rgba(0,0,0,0)",
          foreground: "#f4f1f8",
          cursor: "#A855F7",
          cursorAccent: "#0a0a0a",
          selectionBackground: "rgba(168,85,247,0.4)",
          black: "#0a0a0a",
          brightBlack: "#3a3142",
          white: "#f4f1f8",
          brightWhite: "#ffffff",
          red: "#c084fc",
          brightRed: "#d8b4fe",
          green: "#a855f7",
          brightGreen: "#c084fc",
          yellow: "#e9d5ff",
          brightYellow: "#f5ebff",
          blue: "#7c3aed",
          brightBlue: "#8b5cf6",
          magenta: "#a855f7",
          brightMagenta: "#c084fc",
          cyan: "#9d7bea",
          brightCyan: "#b9a3f0",
        },
      })

      const fit = new FitAddon()
      term.loadAddon(fit)
      term.open(div)

      // one frame so layout is committed before fitting
      await new Promise(r => requestAnimationFrame(r))
      if (run !== this.#xtermRun) return
      fit.fit()

      this.#term = term

      this.#ro = new ResizeObserver(() => { try { fit.fit() } catch {} })
      this.#ro.observe(div)

      const ws = this.#ws
      if (ws && ws.readyState === WebSocket.OPEN) {
        // ── CRITICAL ORDER ──────────────────────────────────────────────────
        // Wire onData BEFORE flushing the buffer.
        // xterm processes term.write() on the next rAF tick, not synchronously.
        // By the time xterm generates responses to terminal queries found in the
        // buffer (e.g. \x1b[6n DSR → \x1b[row;colR), onData is already set up.
        const sendSize = () => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send("\x01" + JSON.stringify({ cols: term.cols, rows: term.rows }))
          }
        }
        term.onData((d: string) => {
          if (ws.readyState === WebSocket.OPEN) ws.send(d)
        })
        term.onResize(() => sendSize())

        // Flush buffered SSH output (includes terminal.shop's initial TUI render)
        if (this.#buf.length) {
          term.write(this.#buf.join(""))
          this.#buf = []
        }

        // Tell the server the real terminal dimensions so terminal.shop
        // gets a SIGWINCH and re-renders at the correct size.
        sendSize()

        term.focus()
      } else if (!ws || ws.readyState === WebSocket.CLOSED) {
        this.#buf = []
        await this.#sim(run, term)
      } else {
        // still CONNECTING — wait for open or fallback after 4s
        const fallback = setTimeout(() => {
          if (run === this.#xtermRun) {
            this.#buf = []
            this.#sim(run, term)
          }
        }, 4000)

        ws.addEventListener("open", () => {
          clearTimeout(fallback)
          if (run !== this.#xtermRun) return
          const sendSize = () => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send("\x01" + JSON.stringify({ cols: term.cols, rows: term.rows }))
            }
          }
          term.onData((d: string) => {
            if (ws.readyState === WebSocket.OPEN) ws.send(d)
          })
          term.onResize(() => sendSize())
          if (this.#buf.length) {
            term.write(this.#buf.join(""))
            this.#buf = []
          }
          sendSize()
          term.focus()
        }, { once: true })
      }
    } catch (e) {
      console.error("[terminal] boot failed:", e)
    }
  }

  async #sim(run: number, term: any) {
    for (const line of SIM_LINES) {
      for (const ch of line) {
        if (run !== this.#xtermRun) return
        term.write(ch)
        await wait(16)
      }
      if (run !== this.#xtermRun) return
      term.write("\r\n")
      await wait(150)
    }
  }
}
