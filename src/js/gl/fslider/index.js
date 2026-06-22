import { Group as G, Raycaster, Vector2 } from "three"
import { Slide } from "./slide"
import { hey } from "../../hey"
import { clamp } from "../../utils/math"
import { Resize, Raf } from "../../utils/subscribable"
import { Gl } from "../gl"

// Scroll-driven assembly of the carousel. `current` (0..N-1) is scrubbed by the
// page scroll through the tall sticky section. For each card its signed offset
// from the centred slide, `o = current - i`, decides its pose:
//   o < 0  (upcoming): flies in along the bottom-left diagonal, reclined and
//                      faded, growing upright as it nears the centre.
//   o = 0  (featured): centred, big, upright, facing you — its details show.
//   o > 0  (passed):   docked into the horizontal row to the right and stays
//                      there (no looping back) — this is the "old" horizontal
//                      carousel the cards get added into.
// So scrolling feeds the cards in one by one and ends on the horizontal row.
export class FSlider extends G {
  slides = []
  frustumCulled = false

  cardW = 1
  cardH = 1
  slotW = 1.1 // horizontal spacing of the docked row
  #anchorY = 0

  // diagonal fly-in tuning (the upcoming side) — cards rise from the
  // bottom-left corner, so the vertical drop is the dominant component
  stepX = 0.9
  stepY = 0.5
  depthArc = 0.4
  flip = 0.6
  scaleFalloff = 0.14
  visCore = 1.2
  visFade = 2.0

  // how many docked cards stay visible to the right before fading off-screen
  dockVis = 3
  dockFade = 1

  static BEND_R = 3.2 // gentle convex bend so a card isn't a dead-flat plane

  #resizer = Resize.subscribe(() => this.resize(), 10)
  #ticker = null

  // click a card -> open its project on GitHub
  #ray = new Raycaster()
  #pointer = new Vector2()

  constructor(wrapper) {
    super()
    this.wrapper = wrapper
    this.element = wrapper.querySelector('[data-slider="wrapper"]')

    this.create()
    this.resize()

    window.addEventListener("click", this.#onClick)
    window.addEventListener("mousemove", this.#onMove)

    // self-drive every frame from the scroll-driven slider state
    this.#ticker = Raf.subscribe(() => {
      const s = hey.FSLIDER
      this.layout(s?.current || 0, s?.lspeed || 0)
    })

    setTimeout(() => this.onSlideChange([0, 0]), 1500)
  }

  create() {
    this.slides = [...this.element.children].map((child, i) => {
      return new Slide(child.querySelector("[data-gl]"), { index: i })
    })
    this.add(...this.slides)

    hey.on("FSLIDE_CHANGE", this.onSlideChange)
  }

  resize() {
    const vs = Gl.vp?.viewSize
    if (!vs || !this.slides.length) return

    this.cardH = clamp(1, 2, vs.h * 0.42)
    this.cardW = this.cardH * 0.82
    this.slotW = this.cardW * 1.15

    // diagonal travel per slide on the upcoming side, scaled to the viewport;
    // stepY > stepX so cards come up from low (the bottom-left corner)
    this.stepX = vs.w * 0.2
    this.stepY = vs.h * 0.3

    this.slides.forEach(s => s.setSize(this.cardW, this.cardH, FSlider.BEND_R))
  }

  // keep the cards glued to the (sticky) section: measure its live screen
  // position so this works while the section is pinned, not just in normal flow
  #measureAnchor() {
    const r = this.element.getBoundingClientRect()
    const vh = window.innerHeight || 1
    const screenCenterY = r.top + r.height / 2
    this.#anchorY = (vh / 2 - screenCenterY) * (Gl.vp?.px || 1)
  }

  layout(current = 0, lspeed = 0) {
    if (!this.slides.length) return
    this.#measureAnchor()
    this.position.set(0, this.#anchorY, 0)

    // icon direction-tilt (the card stretch is now done in the shader via pull)
    const tilt = clamp(-0.4, 0.4, lspeed * 0.05)

    for (let i = 0; i < this.slides.length; i++) {
      const slide = this.slides[i]
      const o = current - i // >0 docked/right, 0 featured, <0 upcoming/left

      let vis
      if (o >= 0) {
        // docked horizontal row to the right (and the featured card at o=0)
        slide.position.set(o * this.slotW, 0, 0)
        slide.rotation.set(0, 0, 0)
        slide.scale.setScalar(1)
        // fade the ones that have scrolled off to the right
        vis = clamp(0, 1, 1 - (o - this.dockVis) / this.dockFade)
      } else {
        // upcoming: fly in along the bottom-left diagonal, reclined + shrinking
        const a = -o
        slide.position.set(
          -a * this.stepX,
          -a * this.stepY,
          -this.depthArc * a * a
        )
        slide.rotation.set(a * this.flip, 0, 0)
        slide.scale.setScalar(clamp(0.22, 1, 1 - a * this.scaleFalloff))
        vis = clamp(0, 1, 1 - (a - this.visCore) / this.visFade)
      }

      // banner pull is now purely motion-driven (like the old rotating
      // stretch): cards stretch while the carousel is moving and relax to flat
      // once it settles into the horizontal row — no permanent taper.
      slide.setPull(clamp(-1.6, 1.6, lspeed * 0.6))

      slide.streamVis = vis * vis
      slide.icon.rotation.z = tilt
    }
  }

  onSlideChange = ([current, prev]) => {
    this.slides[prev]?.invalidate()
    this.slides[current]?.animateCentral()
  }

  // -- raycast a screen point against the visible cards
  #pick(e) {
    if (!Gl.camera || !this.slides.length) return null
    this.#pointer.x = (e.clientX / window.innerWidth) * 2 - 1
    this.#pointer.y = -(e.clientY / window.innerHeight) * 2 + 1
    this.#ray.setFromCamera(this.#pointer, Gl.camera)
    const hits = this.#ray.intersectObjects(
      this.slides.map(s => s.bg),
      false
    )
    for (const h of hits) {
      const slide = this.slides.find(s => s.bg === h.object)
      if (slide && slide.streamVis > 0.4) return slide // ignore faded/hidden ones
    }
    return null
  }

  #onClick = e => {
    const slide = this.#pick(e)
    const url = slide?.lib?.url
    if (url) window.open(url, "_blank", "noopener")
  }

  #onMove = e => {
    document.body.classList.toggle("card-hover", !!this.#pick(e))
  }

  destroy() {
    this.#resizer?.()
    this.#ticker?.()
    window.removeEventListener("click", this.#onClick)
    window.removeEventListener("mousemove", this.#onMove)
    this.slides.forEach(s => s.destroy?.())
  }
}
