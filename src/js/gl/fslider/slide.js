import { Group, Mesh, PlaneGeometry, MeshBasicMaterial } from "three"
import gsap from "../../gsap"

import { hey } from "../../hey"
import { Raf } from "../../utils/subscribable"
import { Observe } from "../../modules/_/observe"
import { Bg } from "./bg/"
import { svgToTexture } from "./svg-texture"

import { SLIDER_FOOD } from "../../../content"

// One item of the rotating ring: a gradient "card" plane (Bg) with the slide's
// icon rasterized from the DOM <svg> floating just in front of it. Positioning
// on the ring (angle, depth-scale, stretch, direction-tilt) is driven by the
// parent FSlider every frame — this class only owns its own size + animations.
export class Slide extends Group {
  frustumCulled = false

  #raf = Raf.subscribe(t => this.raf(t))

  // base card size in world units (set by the ring on resize)
  cardW = 1
  cardH = 1

  // 0..1 visibility along the stream (set every frame by the ring); cards fade
  // out toward the hidden ends. starts hidden until the layout positions it.
  streamVis = 0
  #rev = { v: 0 } // icon entrance reveal (0..1), composed with streamVis
  #iconUniforms = null // wave uniforms injected into the icon material

  constructor(element, { index }) {
    super()
    this.element = element // the [data-gl] DOM node (also holds the source <svg>)
    this.index = index
    this.lib = SLIDER_FOOD[index]

    // gradient card
    this.bg = new Bg(this.lib)
    this.bg.frustumCulled = false
    this.add(this.bg)

    // icon plane (rasterized from the inline svg, transparent over the card).
    // it carries the same fluid wave as the card so it bends with the sheet
    // instead of floating rigidly on top.
    const iconMat = new MeshBasicMaterial({
      transparent: true,
      depthWrite: false,
      opacity: 0,
    })
    iconMat.onBeforeCompile = shader => {
      shader.uniforms.u_time = { value: 0 }
      shader.uniforms.u_speed = { value: 0 }
      shader.uniforms.u_pull = { value: 0 }
      shader.uniforms.u_rand = {
        value: this.bg.material.uniforms.u_random.value[0],
      }
      this.#iconUniforms = shader.uniforms
      shader.vertexShader = shader.vertexShader
        .replace(
          "#include <common>",
          `#include <common>
           uniform float u_time; uniform float u_speed; uniform float u_pull; uniform float u_rand;`
        )
        .replace(
          "#include <begin_vertex>",
          `#include <begin_vertex>
           float sp = u_speed; float asp = abs(sp);
           float rip = sin(transformed.x * 5.5 - u_time * 3.0 + u_rand)
                     + 0.5 * sin(transformed.y * 4.0 + u_time * 2.0 + u_rand);
           transformed.z += rip * (0.015 + asp * 0.12);
           // banner stretch + curl, matching the card so the icon stretches with it
           float ap = min(abs(u_pull), 1.6);
           float edge = clamp(transformed.x * sign(u_pull) + 0.5, 0.0, 1.0);
           float necks = edge * edge;
           transformed.x *= 1.0 + ap * 0.30;
           transformed.x += sign(u_pull) * necks * ap * 0.45;
           transformed.y *= 1.0 - 0.42 * min(ap, 1.0) * necks;
           transformed.z -= 0.42 * ap * necks * 0.7;
           transformed.z += transformed.y * necks * sign(u_pull) * ap * 0.45;`
        )
    }

    this.icon = new Mesh(new PlaneGeometry(1, 1, 24, 24), iconMat)
    this.icon.renderOrder = 20
    this.icon.position.z = 0.03
    this.icon.frustumCulled = false
    this.iconAspect = 1
    this.add(this.icon)

    this.#loadIcon()

    this.#observe = new Observe(this.element, {
      callback: ({ isIn }) => this.handleInView(isIn),
    })

    this.#onStart = hey.on("START", () => this.animateIn())
    this.#onSlideSettle = hey.on("FSLIDE_CHANGE", ([current, old]) =>
      this.onSettle(current, old)
    )
  }

  #observe = null
  #onStart = null
  #onSlideSettle = null
  #iconReady = false

  async #loadIcon() {
    const svgEl = this.element.querySelector("svg")
    const res = await svgToTexture(svgEl)
    if (!res) return

    this.icon.material.map = res.texture
    this.icon.material.needsUpdate = true
    this.iconAspect = res.aspect
    this.#iconReady = true
    this.applySize()

    // if the loader already fired, reveal the icon right away
    if (hey.START) this.#revealIn()
  }

  // -- sizing (called by the ring with the card size + radius in world units)
  setSize(cardW, cardH, radius) {
    this.cardW = cardW
    this.cardH = cardH
    this.applySize()
    this.bg.setCurve(cardW, radius)
  }

  applySize() {
    this.bg.scale.set(this.cardW, this.cardH, 1)
    // icon ~60% of the card width, keeping its own aspect ratio
    const iw = this.cardW * 0.6
    this.icon.scale.set(iw, iw / (this.iconAspect || 1), 1)
  }

  // banner pull, applied to both the card and its icon so they warp together
  setPull(p) {
    this.bg.setPull(p)
    if (this.#iconUniforms) this.#iconUniforms.u_pull.value = p
  }

  raf = ({ time }) => {
    const speed = hey.FSLIDER?.lspeed || 0
    this.bg.speed = speed
    this.bg.time = time * 0.4
    // fade the whole card (gradient + icon) for the hidden ends of the stream
    this.bg.opacity = this.streamVis
    this.icon.material.opacity = this.#rev.v * this.streamVis
    // drive the icon's matching wave
    if (this.#iconUniforms) {
      this.#iconUniforms.u_time.value = time * 0.4
      this.#iconUniforms.u_speed.value = speed
    }
  }

  /** -- Animation */
  handleInView = isIn => {
    this.bg.view = isIn ? 1 : 0
  }

  onSettle = (current, old) => {
    if (current === old) return
    if (this.index === current) this.bg.center = 1
    else if (this.index === old) this.bg.center = 0
  }

  #revAnim = null
  #revealIn() {
    if (!this.#iconReady) return
    if (this.#revAnim) this.#revAnim.kill()
    this.#revAnim = gsap.to(this.#rev, {
      v: 1,
      duration: 1.2,
      ease: "expo.out",
      delay: 0.7 + this.index * 0.08,
    })
  }

  animateIn = () => {
    gsap.to(this.bg.material.uniforms.u_a_in, {
      value: 1,
      duration: 1.4,
      ease: "expo.out",
      delay: () => 0.6 + this.index * 0.1,
    })
    this.#revealIn()
  }

  // kept for FSlider callback compatibility (per-slide pulse hooks)
  animateCentral = () => {}
  invalidate = () => {}

  destroy() {
    this.#raf?.()
    this.#observe?.destroy?.()
    this.#onStart?.()
    this.#onSlideSettle?.()
  }
}
