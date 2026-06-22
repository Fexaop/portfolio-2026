import { Raf } from "../utils/subscribable"
import { clamp, lerp } from "../utils/math"
import { TerminalGl } from "../gl/terminal"

// Handles the scroll-based animation of the terminal stage in the Contact section.
// The actual terminal content is rendered by WasmTerminal.astro (Go + xterm.js WASM).
export class Terminal {
  #section: HTMLElement
  #stage: HTMLElement
  #content: HTMLElement | null
  #lp = 0
  #prevT = 0
  #gl: TerminalGl | null = null
  #raf = Raf.subscribe(() => this.update())

  constructor(element: HTMLElement) {
    this.#section = element
    this.#stage = element.querySelector('[data-term="stage"]') as HTMLElement
    this.#content = element.querySelector('[data-term="content"]')

    const screen = element.querySelector<HTMLElement>('[data-term="screen"]')
    try { if (screen) this.#gl = new TerminalGl(screen) } catch {}
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
  }
}
