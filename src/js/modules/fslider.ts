import Core from "smooothy"
import { Raf } from "../utils/subscribable"
import { Scroll } from "../scroll"
import { hey } from "../hey"
import { damp, clamp } from "../utils/math"

export class FSlider extends Core {
  #queue = []
  #current = 0
  #raf = Raf.subscribe(this.update.bind(this), 11)

  lspeed = 0

  #buttons: HTMLUListElement[]
  #progress: HTMLDivElement

  constructor(element: HTMLElement) {
    super(element.querySelector('[data-slider="wrapper"]'), {
      lerpFactor: 0.18,
      // one-way assembly, not an infinite loop: current stays in [0, n-1]
      infinite: false,
    })

    hey.FSLIDER = this
    this.#sectionEl = element

    this.createInterface(element)
    this.updateCaption(0)
  }

  #sectionEl: HTMLElement | null = null

  #caption: { name: HTMLElement; desc: HTMLElement } | null = null

  updateCaption(index: number) {
    const li = this.items?.[index] as HTMLElement
    if (!li || !this.#caption?.name) return
    this.#caption.name.textContent = li.dataset.name || ""
    this.#caption.desc.textContent = li.dataset.desc || ""
  }

  createInterface(element: HTMLElement) {
    this.#buttons = [
      ...element.querySelector('[data-slider="controls"]').children[0].children,
    ] as HTMLUListElement[]

    this.#progress = element.querySelector(
      '[data-slider="controls"]'
    ) as HTMLDivElement

    this.#caption = {
      name: element.querySelector("[data-caption-name]"),
      desc: element.querySelector("[data-caption-desc]"),
    }

    // scroll drives the carousel, so the controls scroll the page to a card
    this.#buttons.forEach((button, i) => {
      button.onclick = () => this.scrollToIndex(i)
    })
  }

  // smooth-scroll the page so the given card ends up centred (featured)
  scrollToIndex(i: number) {
    const n = this.items.length
    if (!this.#sectionEl || n < 2) return
    const idx = clamp(0, n - 1, i)
    const top = this.#sectionEl.getBoundingClientRect().top + window.scrollY
    const scrub = this.#sectionEl.offsetHeight - window.innerHeight
    Scroll.scrollTo(top + (idx / (n - 1)) * scrub, { duration: 1.1 })
  }

  lprogress = 0

  onUpdate = () => {
    this.lspeed = damp(this.lspeed, this.speed, 10)
    this.lprogress = damp(this.lprogress, this.progress, 5)

    const n = this.items.length

    // scroll scrubs the assembly: map how far we've scrolled through the tall
    // (sticky) section to the slider position. No drag — the ul is
    // pointer-events-none — so scrolling the page is the only input.
    if (this.#sectionEl) {
      const r = this.#sectionEl.getBoundingClientRect()
      const total = r.height - window.innerHeight
      const p = total > 0 ? clamp(0, 1, -r.top / total) : 0
      this.target = p * (n - 1)
    }

    // featured card = nearest to centre; update caption/dots live while scrubbing
    const idx = clamp(0, n - 1, Math.round(this.current))
    if (idx !== this.#current) this.onSettled(idx)

    // the WebGL cards read this.current / this.lspeed on their own RAF (see
    // gl/fslider) and turn them into the diagonal fly-in + horizontal docking.

    this.#progress.children[0].style.left = `${
      this.lprogress * this.#progress.clientWidth
    }px`
  }

  // scroll drives everything now; the featured index is updated live in onUpdate
  onSlideChange = () => {}

  onSettled = index => {
    // infinite mode can report an unbounded index; wrap it to a real slide
    const n = this.items.length
    const idx = ((index % n) + n) % n
    const prev = this.#current

    this.items[prev]?.classList.remove("active")
    this.items[idx]?.classList.add("active")
    this.#buttons[prev]?.classList.remove("active")
    this.#buttons[idx]?.classList.add("active")

    hey.FSLIDE_CHANGE = [idx, prev]

    this.updateCaption(idx)

    this.#current = idx
  }
}
