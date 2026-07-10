import {
  Points,
  BufferGeometry,
  Float32BufferAttribute,
  ShaderMaterial,
  AdditiveBlending,
} from "three"

import { Group } from "~/js/gl/dom/group"
import { Raf } from "~/js/utils/subscribable"
import { Mouse } from "~/js/mouse"
import { Observe } from "~/js/modules/_/observe"
import { prefersReducedMotion } from "~/js/utils/media"

import vertexShader from "./vertex.vert"
import fragmentShader from "./fragment.frag"

const COUNT = 280

// Drifting signal nodes — denser, mouse-reactive ambient field that fills
// empty hero space without competing with the FEXA wordmark.
function buildGeometry() {
  const positions = new Float32Array(COUNT * 3)
  const seeds = new Float32Array(COUNT)

  for (let i = 0; i < COUNT; i++) {
    // bias toward a soft ellipse so the field hugs the logo
    const a = Math.random() * Math.PI * 2
    const r = Math.pow(Math.random(), 0.55)
    positions[i * 3 + 0] = Math.cos(a) * r
    positions[i * 3 + 1] = Math.sin(a) * r * 0.72
    positions[i * 3 + 2] = (Math.random() * 2 - 1) * 0.55
    seeds[i] = Math.random()
  }

  const geometry = new BufferGeometry()
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3))
  geometry.setAttribute("a_seed", new Float32BufferAttribute(seeds, 1))
  return geometry
}

export class Particles extends Group {
  #reduced = prefersReducedMotion()
  #raf = Raf.subscribe(t => this.raf(t))
  #observe = new Observe(this.element, {
    callback: ({ isIn }) => {
      this.points.visible = isIn
    },
  })

  constructor(el) {
    super(el)

    this.points = new Points(
      buildGeometry(),
      new ShaderMaterial({
        vertexShader,
        fragmentShader,
        transparent: true,
        depthWrite: false,
        depthTest: false,
        blending: AdditiveBlending,
        uniforms: {
          u_time: { value: 0 },
          u_spread: { value: 1 },
          u_size: { value: 5.5 },
          u_mouse: { value: [0, 0] },
          u_color: { value: [0.92, 0.78, 0.52] },
          u_color2: { value: [0.62, 0.42, 0.95] },
          u_opacity: { value: 0.55 },
        },
      })
    )

    this.points.frustumCulled = false
    this.add(this.points)
  }

  resize() {
    this.points.material.uniforms.u_spread.value =
      Math.max(this.bounds.width, this.bounds.height) * 0.62
  }

  raf({ time }) {
    if (!this.points.visible || this.#reduced) return

    const uniforms = this.points.material.uniforms
    uniforms.u_time.value = time
    uniforms.u_mouse.value[0] = Mouse.sex
    uniforms.u_mouse.value[1] = Mouse.sey
  }
}
