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

  constructor(element: HTMLDivElement) {
    this.element = element
    this.#skip = arrivedFromBlog()

    if (this.#skip) {
      // Coming from blog: delete loader, show site immediately (no black veil)
      this.circle = null
      try {
        this.element.hidden = true
        this.element.style.display = "none"
        this.element.remove()
      } catch {
        /* already gone */
      }
      // Clear flags so a later refresh is normal
      try {
        document.documentElement.classList.remove(
          "xsite-from-blog",
          "xsite-arrived",
          "xsite-ready",
        )
      } catch {
        /* ignore */
      }
      return
    }

    this.circle = window.app?.loader?.circle ?? null
    this.svg = (this.circle?.parentElement as HTMLElement) ?? null
    hey.on("START", () => this.animateIn())
  }

  animateIn = () => {
    if (this.#skip) return

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
