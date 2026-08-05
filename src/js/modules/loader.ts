import { hey } from "../hey"
import gsap from "../gsap"

function arrivedFromBlog(): boolean {
  try {
    return (
      document.documentElement.classList.contains("xsite-from-blog") ||
      document.documentElement.classList.contains("xsite-arrived") ||
      sessionStorage.getItem("pwnhub-skip-loader") === "1" ||
      sessionStorage.getItem("pwnhub-xsite") === "to-portfolio"
    )
  } catch {
    return false
  }
}

export class Loader {
  element: HTMLDivElement
  circle: SVGElement | null
  #onLoad = hey.on("START", () => this.animateIn())
  #skip: boolean

  constructor(element: HTMLDivElement) {
    this.element = element
    this.#skip = arrivedFromBlog()

    if (this.#skip) {
      // Never show circle loader — lift black veil when WebGL is ready
      this.circle = null
      this.element.style.display = "none"
      this.element.remove()
      // If START already fired, lift immediately
      if (hey.START) {
        this.#liftVeil()
      } else {
        hey.on("START", () => this.#liftVeil())
        // Fallback if START is slow
        window.setTimeout(() => this.#liftVeil(), 4000)
      }
      return
    }

    this.circle = window.app.loader.circle
    // @ts-expect-error parent exists on svg circle
    this.svg = this.circle?.parentElement
  }

  #liftVeil = () => {
    document.documentElement.classList.add("xsite-ready")
    try {
      sessionStorage.removeItem("pwnhub-skip-loader")
      sessionStorage.removeItem("pwnhub-xsite")
    } catch {
      /* ignore */
    }
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

    window.app.loader.timeouts.forEach(timeout => clearTimeout(timeout))

    if (!this.circle) return

    this.circle.style.transitionDuration = ".4s"
    this.circle.style.transitionDelay = "0s"
    this.circle.style.strokeDashoffset = "0px"

    // @ts-expect-error svg set in constructor
    gsap.to(this.svg, {
      scale: 0,
      duration: 0.8,
      delay: 0.2,
      ease: "power2.inOut",
    })

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
