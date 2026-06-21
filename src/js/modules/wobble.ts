import { Raf } from "../utils/subscribable"
import { hey } from "../hey"
import { clamp } from "../utils/math"

// Re-creates the GLB "wobble on scroll" feel for the static placeholder icons:
// every icon tilts the SAME way, based purely on the direction/speed the slider
// is moving, then eases back to rest once it settles.
export class Wobble {
  element: HTMLElement

  #raf = Raf.subscribe(() => this.onRaf())

  constructor(element: HTMLElement) {
    this.element = element
    this.element.style.willChange = "transform"
  }

  onRaf = () => {
    const slider = hey.FSLIDER
    if (!slider) return

    // lspeed is the damped scroll speed; its sign = the side we're moving,
    // so all icons rotate together and ease back to 0 on settle.
    const speed = slider.lspeed || 0
    const rot = clamp(-28, 28, speed * 22)

    this.element.style.transform = `rotate(${rot}deg)`
  }

  destroy() {
    this.#raf?.()
  }
}
