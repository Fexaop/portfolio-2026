import { hey } from "../hey"
import gsap from "../gsap"

function arrivedFromBlog(): boolean {
  try {
    return (
      document.documentElement.classList.contains("xsite-from-blog") ||
      document.documentElement.classList.contains("xsite-arrived")
    )
  } catch {
    return false
  }
}

export class Loader {
  element: HTMLDivElement
  circle: SVGElement | null
  svg: HTMLElement | null = null
  #skip: boolean
  #lifted = false

  constructor(element: HTMLDivElement) {
    this.element = element
    this.#skip = arrivedFromBlog()

    if (this.#skip) {
      this.circle = null
      try {
        this.element.hidden = true
        this.element.style.display = "none"
        this.element.remove()
      } catch {
        /* gone */
      }

      // Lift black veil quickly — don't wait on slow WebGL
      const onStart = () => this.#liftVeil()
      hey.on("START", onStart)
      if (hey.START) this.#liftVeil()
      window.setTimeout(() => this.#liftVeil(), 800)
      return
    }

    // Normal visit — element should already be un-hidden by Loader.astro script
    this.circle = window.app?.loader?.circle ?? null
    this.svg = (this.circle?.parentElement as HTMLElement) ?? null
    hey.on("START", () => this.animateIn())
  }

  #liftVeil = () => {
    if (this.#lifted) return
    this.#lifted = true
    document.documentElement.classList.add("xsite-ready")
    window.setTimeout(() => {
      document.documentElement.classList.remove(
        "xsite-from-blog",
        "xsite-arrived",
        "xsite-ready",
      )
    }, 650)
  }

  animateIn = () => {
    if (this.#skip) {
      this.#liftVeil()
      return
    }

    try {
      window.app?.loader?.timeouts?.forEach((t: number) => clearTimeout(t))
    } catch {
      /* ignore */
    }

    if (!this.circle) {
      this.element?.remove()
      return
    }

    this.circle.style.transitionDuration = ".4s"
    this.circle.style.transitionDelay = "0s"
    this.circle.style.strokeDashoffset = "0px"

    if (this.svg) {
      gsap.to(this.svg, {
        scale: 0,
        duration: 0.8,
        delay: 0.2,
        ease: "power2.inOut",
      })
    }

    gsap.to(this.element, {
      autoAlpha: 0,
      scale: 0,
      duration: 0.2,
      delay: 0.4,
      ease: "expo.out",
      onComplete: () => this.element.remove(),
    })
  }
}
