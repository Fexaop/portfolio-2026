import { Scroll } from "../scroll"
import gsap from "../gsap"

// Hide the nav while the FEXA hero is on screen; once the user scrolls past it,
// slide the bar in and stagger-bounce the FEXAOP letters (like the hero). Scroll
// back to the top and it tucks away again, ready to re-animate next time.
export class Nav {
  element: HTMLElement
  letters: HTMLElement[]
  #shown: boolean | null = null
  #unsub: () => void

  constructor(element: HTMLElement) {
    this.element = element
    this.letters = [
      ...element.querySelectorAll<HTMLElement>(".brand-letter"),
    ]

    // start hidden (on the hero)
    gsap.set(this.element, { yPercent: -120, autoAlpha: 0 })
    gsap.set(this.letters, { yPercent: 160, rotate: -14, autoAlpha: 0 })

    this.#unsub = Scroll.subscribe(this.#onScroll)
    this.#onScroll({ scroll: Scroll.y })
  }

  #onScroll = ({ scroll }: { scroll: number }) => {
    // reveal once past ~40% of the first viewport (i.e. leaving the hero)
    const shouldShow = scroll > window.innerHeight * 0.4
    if (shouldShow === this.#shown) return
    this.#shown = shouldShow
    shouldShow ? this.#in() : this.#out()
  }

  #in() {
    gsap.to(this.element, {
      yPercent: 0,
      autoAlpha: 1,
      duration: 0.5,
      ease: "expo.out",
    })
    gsap.to(this.letters, {
      yPercent: 0,
      rotate: 0,
      autoAlpha: 1,
      duration: 0.7,
      ease: "back.out(2.2)",
      stagger: { each: 0.05, from: "start" },
      delay: 0.08,
    })
  }

  #out() {
    gsap.to(this.element, {
      yPercent: -120,
      autoAlpha: 0,
      duration: 0.4,
      ease: "power2.in",
    })
    gsap.set(this.letters, { yPercent: 160, rotate: -14, autoAlpha: 0 })
  }

  destroy() {
    this.#unsub?.()
  }
}
