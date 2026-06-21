import { Track } from "./_/track"
import gsap, { reduced } from "../gsap"
import { hey } from "../hey"
import { Raf } from "../utils/subscribable"
import { Mouse } from "../mouse"
import { clamp } from "../utils/math"
import { Spring } from "wobble"

// (*) IDEA make it based on vertical or not

export class Bouncy extends Track {
  svg: SVGGElement[]
  fade: boolean

  #anim = null
  #started = false
  #pendingIn: { direction: number } | null = null

  // mouse-reactive spring wobble (fade instances only, e.g. FEXA)
  #mouseRaf: (() => void) | null = null
  #springs: { x: Spring; y: Spring }[] = []
  #hit: boolean[] = []
  #prev = { x: 0, y: 0 }
  #omega0 = 0

  // low damping ratio (~0.27) => several visible oscillations before settling
  static SPRING = { stiffness: 220, damping: 8, mass: 1 }

  anim = {
    duration: 0.8,
    yPercent: 0,
    xPercent: 0,
    scale: 1,
    stagger: {
      each: 0.06,
      from: "random",
    },
  }

  constructor(element: HTMLElement) {
    super(element)
    this.svg = [...this.element.querySelector("svg").children].filter(
      (el): el is SVGGElement => el instanceof SVGGElement
    )

    this.fade = this.element.dataset.fade !== undefined

    this.isOut()

    // hold the entrance until the loader is done (START)
    this.#started = !!hey.START
    hey.on("START", () => {
      this.#started = true
      if (this.#pendingIn) {
        const data = this.#pendingIn
        this.#pendingIn = null
        this.isIn(data)
      }
    })

    if (this.fade && !reduced) this.#initReactive()
  }

  handleScroll = value => {
    // console.log(value)
  }

  // -- mouse interaction: real collision, proper spring physics. Each letter
  // rests at home; the moment the cursor's follower square enters its box we
  // give the spring a single velocity impulse (in the cursor's travel
  // direction), then let wobble's own loop integrate it back to rest. No
  // per-frame retargeting, so it settles cleanly instead of jittering.
  #initReactive() {
    const { stiffness, damping, mass } = Bouncy.SPRING
    this.#omega0 = Math.sqrt(stiffness / mass) / 1000 // rad/ms, matches wobble
    this.#springs = this.svg.map(() => ({
      x: new Spring({ stiffness, damping, mass, fromValue: 0, toValue: 0 }),
      y: new Spring({ stiffness, damping, mass, fromValue: 0, toValue: 0 }),
    }))
    this.#hit = this.svg.map(() => false)
    this.#mouseRaf = Raf.subscribe(() => this.#onMouse())
  }

  #onMouse = () => {
    const SQUARE = 8 // collision padding ~ the cursor square's half size
    const MIN_D = 30 // every hit knocks at least this far (px)
    const MAX_D = 60 // ...and at most this far on a fast swipe
    const ENV = 0.7 // damping envelope at first peak (impulse -> peak px)

    // the visible follower square lives at the damped mouse position
    const px = Mouse.ex[0]
    const py = Mouse.ey[0]

    // follower velocity (px/frame) -> impulse direction + extra strength
    const vx = px - this.#prev.x
    const vy = py - this.#prev.y
    this.#prev.x = px
    this.#prev.y = py
    const speed = Math.hypot(vx, vy)

    this.#springs.forEach((s, i) => {
      const ox = s.x.currentValue
      const oy = s.y.currentValue

      // letter's resting box = current box minus the offset we applied
      const rect = this.svg[i].getBoundingClientRect()
      if (!rect.width) return

      const cx = rect.left + rect.width / 2 - ox
      const cy = rect.top + rect.height / 2 - oy
      const hx = rect.width / 2 + SQUARE
      const hy = rect.height / 2 + SQUARE

      const hit =
        Mouse.in && Math.abs(cx - px) < hx && Math.abs(cy - py) < hy

      // kick once, only on the frame the cursor enters the letter
      if (hit && !this.#hit[i]) {
        // knock in the cursor's travel direction; if it crept in slowly,
        // shove it away from the cursor instead so it always reacts
        let dx = vx
        let dy = vy
        if (speed < 0.5) {
          dx = cx - px
          dy = cy - py
        }
        const len = Math.hypot(dx, dy) || 1
        const peak = clamp(MIN_D, MAX_D, MIN_D + speed * 2)
        // initialVelocity so the spring's first peak ≈ `peak` px
        const v0 = (peak * this.#omega0) / ENV
        s.x.updateConfig({ initialVelocity: (dx / len) * v0 }).start()
        s.y.updateConfig({ initialVelocity: (dy / len) * v0 }).start()
      }
      this.#hit[i] = hit

      // tilt follows the displacement, so it wobbles along with the bounce
      const rot = clamp(-14, 14, s.x.currentValue * 0.3)

      // x/y/rotation are separate transform channels from the entrance
      // (xPercent/yPercent/scale), so this composes without fighting it
      gsap.set(this.svg[i], {
        x: s.x.currentValue,
        y: s.y.currentValue,
        rotation: rot,
      })
    })
  }

  isIn = ({ direction } = { direction: -1 }) => {
    if (reduced) return

    // wait for loading to finish before playing the entrance
    if (!this.#started) {
      this.#pendingIn = { direction }
      return
    }

    if (this.#anim) this.#anim.kill()

    if (this.fade) {
      // first fade the wordmark in, then play the bouncy opening
      this.#anim = gsap
        .timeline()
        .to(this.element, {
          autoAlpha: 1,
          duration: 0.5,
          ease: "power2.out",
        })
        .to(this.svg, { ...this.anim }, "-=0.15")
    } else {
      this.#anim = gsap.to(this.svg, {
        ...this.anim,
      })
    }
  }

  isOut = ({ direction } = { direction: -1 }) => {
    if (reduced) return
    if (this.#anim) this.#anim.kill()

    if (this.fade) gsap.set(this.element, { autoAlpha: 0 })

    gsap.set(this.svg, {
      yPercent: i => 80 * -direction,
      xPercent: i => (i - this.svg.length / 2) * 50,
    })
  }

  destroy() {
    this.#mouseRaf?.()
    this.#springs.forEach(s => {
      s.x.stop()
      s.y.stop()
    })
    super.destroy()
  }
}
