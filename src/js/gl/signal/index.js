import {
  BufferGeometry,
  Float32BufferAttribute,
  Points,
  LineSegments,
  ShaderMaterial,
  AdditiveBlending,
  Color,
} from "three"

import { Group } from "~/js/gl/dom/group"
import { Raf } from "~/js/utils/subscribable"
import { Mouse } from "~/js/mouse"
import { Observe } from "~/js/modules/_/observe"
import { prefersReducedMotion } from "~/js/utils/media"

import pointsVert from "./points.vert"
import pointsFrag from "./points.frag"
import linesVert from "./lines.vert"
import linesFrag from "./lines.frag"

const NODE_COUNT = 56
const LINK_DIST = 0.42

// Interactive infrastructure graph — nodes pulse and edges light up near the
// cursor so the skills section feels like a live network, not a static grid.
function buildNetwork() {
  const positions = new Float32Array(NODE_COUNT * 3)
  const seeds = new Float32Array(NODE_COUNT)
  const nodes = []

  for (let i = 0; i < NODE_COUNT; i++) {
    const x = (Math.random() * 2 - 1) * 0.95
    const y = (Math.random() * 2 - 1) * 0.7
    const z = (Math.random() * 2 - 1) * 0.35
    positions[i * 3] = x
    positions[i * 3 + 1] = y
    positions[i * 3 + 2] = z
    seeds[i] = Math.random()
    nodes.push({ x, y, z, seed: seeds[i] })
  }

  const links = []
  for (let i = 0; i < NODE_COUNT; i++) {
    for (let j = i + 1; j < NODE_COUNT; j++) {
      const dx = nodes[i].x - nodes[j].x
      const dy = nodes[i].y - nodes[j].y
      const dz = nodes[i].z - nodes[j].z
      const d = Math.sqrt(dx * dx + dy * dy + dz * dz)
      if (d < LINK_DIST) links.push(i, j)
    }
  }

  // guarantee a minimum edge density
  if (links.length < NODE_COUNT * 2) {
    for (let i = 0; i < NODE_COUNT; i++) {
      const j = (i + 1 + Math.floor(Math.random() * 4)) % NODE_COUNT
      links.push(i, j)
    }
  }

  const linePositions = new Float32Array(links.length * 3)
  const lineSeeds = new Float32Array(links.length)
  for (let k = 0; k < links.length; k++) {
    const ni = links[k]
    linePositions[k * 3] = nodes[ni].x
    linePositions[k * 3 + 1] = nodes[ni].y
    linePositions[k * 3 + 2] = nodes[ni].z
    lineSeeds[k] = nodes[ni].seed
  }

  return { positions, seeds, linePositions, lineSeeds }
}

export class SignalField extends Group {
  #reduced = prefersReducedMotion()
  #raf = Raf.subscribe(t => this.raf(t))
  #observe = new Observe(this.element, {
    callback: ({ isIn }) => {
      this.visible = isIn
    },
  })

  constructor(el) {
    super(el)

    const net = buildNetwork()

    const ptGeo = new BufferGeometry()
    ptGeo.setAttribute(
      "position",
      new Float32BufferAttribute(net.positions, 3)
    )
    ptGeo.setAttribute("a_seed", new Float32BufferAttribute(net.seeds, 1))

    this.pointsMat = new ShaderMaterial({
      vertexShader: pointsVert,
      fragmentShader: pointsFrag,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: AdditiveBlending,
      uniforms: {
        u_time: { value: 0 },
        u_spread: { value: 1 },
        u_size: { value: 9 },
        u_mouse: { value: [0, 0] },
        u_color: { value: new Color(0xf0c878) },
        u_colorHot: { value: new Color(0xa78bfa) },
        u_opacity: { value: 0.7 },
      },
    })

    this.points = new Points(ptGeo, this.pointsMat)
    this.points.frustumCulled = false
    this.add(this.points)

    const lnGeo = new BufferGeometry()
    lnGeo.setAttribute(
      "position",
      new Float32BufferAttribute(net.linePositions, 3)
    )
    lnGeo.setAttribute("a_seed", new Float32BufferAttribute(net.lineSeeds, 1))

    this.linesMat = new ShaderMaterial({
      vertexShader: linesVert,
      fragmentShader: linesFrag,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: AdditiveBlending,
      uniforms: {
        u_time: { value: 0 },
        u_spread: { value: 1 },
        u_mouse: { value: [0, 0] },
        u_color: { value: new Color(0xc4a06a) },
        u_opacity: { value: 0.35 },
      },
    })

    this.lines = new LineSegments(lnGeo, this.linesMat)
    this.lines.frustumCulled = false
    this.add(this.lines)

    this.visible = false
  }

  resize() {
    const s = Math.max(this.bounds.width, this.bounds.height) * 0.58
    this.pointsMat.uniforms.u_spread.value = s
    this.linesMat.uniforms.u_spread.value = s
  }

  raf({ time }) {
    if (!this.visible || this.#reduced) return

    const mx = Mouse.sex
    const my = Mouse.sey

    this.pointsMat.uniforms.u_time.value = time
    this.pointsMat.uniforms.u_mouse.value[0] = mx
    this.pointsMat.uniforms.u_mouse.value[1] = my

    this.linesMat.uniforms.u_time.value = time
    this.linesMat.uniforms.u_mouse.value[0] = mx
    this.linesMat.uniforms.u_mouse.value[1] = my

    // subtle whole-field tilt toward cursor
    this.rotation.y = mx * 0.18
    this.rotation.x = -my * 0.12
  }
}
