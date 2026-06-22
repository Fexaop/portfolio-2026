import { Observe } from "./_/observe"
import gsap, { reduced } from "../gsap"

// Hand-drawn lightbulb that hangs into the About section: it draws itself and
// drops from the top with a little bounce + pendulum swing when the section
// comes into view, and retracts back up when you scroll away. The Observe is
// bound to the whole section so it triggers as About enters, while the
// transforms run on the bulb element itself.
export class Bulb extends Observe {
  #bulb: HTMLElement
  #svg: SVGElement[]
  #tl: gsap.core.Timeline | null = null
  #swing: gsap.core.Tween | null = null

  constructor(element: HTMLElement) {
    const section = (element.closest("section") as HTMLElement) ?? element
    super(section)

    this.#bulb = element
    this.#svg = [
      ...(element.querySelector("svg") as SVGElement).children,
    ] as SVGElement[]

    // start lifted out of view, swinging from its top, undrawn
    gsap.set(this.#bulb, {
      xPercent: -50,
      yPercent: -100,
      rotation: 0,
      transformOrigin: "50% 0%",
    })
    gsap.set(this.#svg, { drawSVG: 0 })
  }

  isIn() {
    if (reduced) return
    this.#tl?.kill()
    this.#swing?.kill()

    this.#tl = gsap
      .timeline()
      .to(this.#bulb, { yPercent: 0, duration: 1.1, ease: "bounce.out" }, 0)
      .to(
        this.#svg,
        { drawSVG: "100%", duration: 0.9, stagger: 0.06, ease: "power2.out" },
        0.1
      )
      .add(() => this.#startSwing(), ">-0.25")
  }

  #startSwing() {
    this.#swing?.kill()
    gsap.set(this.#bulb, { rotation: -7 })
    this.#swing = gsap.to(this.#bulb, {
      rotation: 7,
      duration: 2.2,
      ease: "sine.inOut",
      repeat: -1,
      yoyo: true,
    })
  }

  isOut() {
    if (reduced) return
    this.#tl?.kill()
    this.#swing?.kill()

    this.#tl = gsap
      .timeline()
      .to(this.#bulb, { rotation: 0, duration: 0.3, ease: "sine.out" }, 0)
      .to(this.#bulb, { yPercent: -100, duration: 0.7, ease: "power2.in" }, 0)
      .to(this.#svg, { drawSVG: 0, duration: 0.4 }, 0)
  }
}
