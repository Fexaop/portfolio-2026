import { Mesh, PlaneGeometry, Color } from "three"
import { RawShaderMaterial, DoubleSide } from "three"
import gsap from "~/js/gsap"

import vertexShader from "./vertex.vert"
import fragmentShader from "./fragment.frag"

const RESOLUTION = 32

export class Bg extends Mesh {
  geometry = new PlaneGeometry(1, 1, RESOLUTION, RESOLUTION * 1.3)
  material = new Material()

  constructor(lib) {
    super()
    this.setBackground(lib)
  }

  #a_view = null
  set view(val) {
    if (this.#a_view) this.#a_view.kill()

    this.#a_view = gsap.to(this.material.uniforms.u_a_view, {
      value: val,
      duration: 1.4,
      delay: val > 0.7 ? 0.07 + Math.random() * 0.08 : 0,
      ease: "expo.out",
    })
  }

  #a_center = null

  set center(val) {
    if (this.#a_center) this.#a_center.kill()

    this.#a_center = gsap.to(this.material.uniforms.u_a_center, {
      value: val,
      duration: 1.4,
      ease: "expo.out",
    })
  }

  setBackground(lib) {
    this.material.uniforms.COL_1.value = new Color(lib.bg[0])
    this.material.uniforms.COL_2.value = new Color(lib.bg[1])
    this.material.uniforms.COL_3.value = new Color(lib.bg[2])
  }

  // tell the shader the card's world width + the ring radius so it can bend the
  // plane back along its width and hug the ring (a cylinder segment, not a flat
  // card). `amount` > 1 over-curves slightly for a more obvious convex look.
  setCurve(cardW, radius, amount = 1.25) {
    this.material.uniforms.u_cardW.value = cardW
    this.material.uniforms.u_radius.value = radius
    this.material.uniforms.u_curve.value = amount
  }

  set speed(val) {
    this.material.uniforms.u_a_speed.value = val
  }

  set opacity(val) {
    this.material.uniforms.u_opacity.value = val
  }

  // signed "pull": how hard / which way the card is dragged. Drives the banner
  // taper + curl in the vertex shader (one edge stretches out to a point).
  setPull(val) {
    this.material.uniforms.u_pull.value = val
  }

  set time(t) {
    this.material.uniforms.u_time.value = t
  }
}

class Material extends RawShaderMaterial {
  constructor(options) {
    super({
      vertexShader,
      fragmentShader,
      uniforms: {
        u_time: { value: 0 },
        u_t1: { value: options?.u_t1 || null },
        u_random: {
          value: [Math.random() * 3, Math.random() * 3, Math.random() * 4],
        },
        // gradient
        COL_1: { value: [0, 0, 0] },
        COL_2: { value: [0, 0, 0] },
        COL_3: { value: [0, 0, 0] },
        // animation
        u_a_view: { value: 0 },
        u_a_speed: { value: 0 },
        u_a_center: { value: 0 },
        u_a_in: { value: 0 },
        // ring curvature (card width + radius drive the cylinder bend)
        u_cardW: { value: 1 },
        u_radius: { value: 2 },
        u_curve: { value: 1.25 },
        // master amount for the fluid wave warp
        u_wave: { value: 1 },
        // signed banner pull (taper + curl toward one edge)
        u_pull: { value: 0 },
        // per-card fade for the hidden ends of the diagonal stream
        u_opacity: { value: 1 },
      },
      side: DoubleSide,
      // wireframe: true,
      // transparent so cards can fade out at the ends of the stream; depth still
      // written so the big centre cards occlude the ones behind them
      transparent: true,
      depthWrite: true,
      depthTest: true,
    })
  }

  set time(t) {
    this.uniforms.u_time.value = t

    // console.log(this.uniforms.u_a_view.value)
  }
}
