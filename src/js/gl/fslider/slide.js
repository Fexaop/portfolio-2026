import { SliderGroup } from "../dom/group"
import gsap from "../../gsap"

import { hey } from "../../hey"
import { Raf } from "../../utils/subscribable"
import { Observe } from "../../modules/_/observe"
import { Bg } from "./bg/"

import { SLIDER_FOOD } from "../../../content"

// note: GLB food models removed — slides keep only the animated background,
// the DOM renders a static placeholder on top of it.

export class Slide extends SliderGroup {
  #visible = true
  #raf = Raf.subscribe(t => this.raf(t))
  #observe = new Observe(this.element, {
    callback: ({ isIn }) => {
      this.handleInView(isIn)
    },
  })

  #onStart = hey.on("START", () => this.animateIn())
  #onSlideSettle = hey.on("FSLIDE_CHANGE", ([current, old]) =>
    this.onSettle(current, old)
  )

  constructor(element, { index }) {
    super(element, { index })
    this.lib = SLIDER_FOOD[index]
    this.element = element
    this.index = index

    this.bg = new Bg(this.lib)
    this.add(this.bg)
  }

  resize() {
    this.bg.scale.set(this.bounds.width, this.bounds.height, 1)
  }

  raf = ({ time }) => {
    this.bg.speed = hey.FSLIDER.lspeed
    this.bg.time = time * 0.4
  }

  /** -- Animation */
  handleInView = isIn => {
    this.#visible = isIn
    this.bg.view = isIn ? 1 : 0
  }

  onSettle = (current, old) => {
    if (current === old) return

    if (this.index === current) {
      this.bg.center = 1
    } else if (this.index === old) {
      this.bg.center = 0
    }
  }

  animateIn = () => {
    gsap.to(this.bg.material.uniforms.u_a_in, {
      value: 1,
      duration: 1.4,
      ease: "expo.out",
      delay: () => 0.6 + [0, 1, 2, 3, 4][this.index] * 0.1,
    })
  }

  // food-only effects removed; kept as no-ops for FSlider callbacks
  animateCentral = () => {}
  invalidate = () => {}
}
