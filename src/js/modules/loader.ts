import { hey } from "../hey"
import gsap from "../gsap"

function arrivedFromBlog(): boolean {
  try {
    if (
      document.documentElement.classList.contains("xsite-from-blog") ||
      document.documentElement.classList.contains("xsite-arrived")
    ) {
      return true
    }
    // Query may already be stripped — class is the source of truth after head script
    const p = new URLSearchParams(window.location.search)
    const d = p.get("xsite")
    return d === "to-portfolio" || d === "from-blog"
  } catch {
    return false
  }
}

export class Loader {
  element: HTMLDivElement
  circle: SVGElement | null
  svg: HTMLElement | null = null
  #onLoad: (() => void) | null = null
  #skip: boolean
  #lifted = false

  constructor(element: HTMLDivElement) {
    this.element = element
    this.#skip = arrivedFromBlog()

    if (this.#skip) {
      this.circle = null
      try {
        this.element.style.display = "none"
        this.element.remove()
      } catch {
        /* already gone */
      }

      this.#onLoad = () => this.#liftVeil()
      hey.on("START", this.#onLoad)

      if (hey.START) {
        this.#liftVeil()
      } else {
        window.setTimeout(() => this.#liftVeil(), 4500)
      }
      return
    }

    this.circle = window.app?.loader?.circle ?? null
    this.svg = (this.circle?.parentElement as HTMLElement) ?? null
    this.#onLoad = () => this.animateIn()
    hey.on("START", this.#onLoad)
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
    }, 700)
  }

  animateIn = () => {
    if (this.#skip) {
      this.#liftVeil()
      return
    }

    try {
      window.app?.loader?.timeouts?.forEach((timeout: number) =>
        clearTimeout(timeout),
      )
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
      onComplete: () => {
        this.element.remove()
      },
    })
  }
}
