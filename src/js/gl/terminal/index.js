import {
  WebGLRenderer,
  Scene,
  PerspectiveCamera,
  Mesh,
  PlaneGeometry,
  RawShaderMaterial,
  DoubleSide,
} from "three"
import { Raf } from "../../utils/subscribable"
import vertexShader from "./vertex.vert"
import fragmentShader from "./fragment.frag"

const SEG = 28

// Self-contained WebGL renderer that lives INSIDE the data-term="screen" div.
// It renders an animated purple-plasma background at z-index 0; the xterm DOM
// layer (z-index 1) appears on top, giving the terminal a "part of WebGL" feel
// with live wave distortion that reacts to scroll speed.
export class TerminalGl {
  #renderer
  #scene
  #camera
  #mesh
  #raf
  #wave = 0
  #canvas

  constructor(container) {
    this.#setup(container)
    this.#raf = Raf.subscribe(t => this.#render(t))
  }

  #setup(container) {
    this.#canvas = document.createElement("canvas")
    this.#canvas.style.cssText =
      "position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:0"
    container.prepend(this.#canvas)

    const w = container.clientWidth || 800
    const h = container.clientHeight || 500
    const asp = w / h

    this.#renderer = new WebGLRenderer({
      canvas: this.#canvas,
      alpha: true,
      antialias: false,
    })
    this.#renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.#renderer.setSize(w, h, false)

    this.#scene = new Scene()
    this.#camera = new PerspectiveCamera(45, asp, 0.1, 10)
    this.#camera.position.z = 1.37

    const mat = new RawShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        u_time: { value: 0 },
        u_wave: { value: 0 },
      },
      transparent: true,
      side: DoubleSide,
    })

    this.#mesh = new Mesh(new PlaneGeometry(1, 1, SEG, SEG), mat)
    this.#fitMesh(asp)
    this.#scene.add(this.#mesh)

    new ResizeObserver(() => this.#resize(container)).observe(container)
  }

  #fovH() {
    return (
      2 *
      Math.tan(((this.#camera.fov * Math.PI) / 180) / 2) *
      this.#camera.position.z
    )
  }

  #fitMesh(asp) {
    const h = this.#fovH()
    this.#mesh.scale.set(h * asp, h, 1)
  }

  #resize(container) {
    const w = container.clientWidth
    const h = container.clientHeight
    if (!w || !h) return
    const asp = w / h
    this.#renderer.setSize(w, h, false)
    this.#camera.aspect = asp
    this.#camera.updateProjectionMatrix()
    this.#fitMesh(asp)
  }

  // set wave in [0,1] — driven by scroll speed in terminal.ts
  set wave(val) {
    this.#wave = val
  }

  #render(t) {
    const u = this.#mesh.material.uniforms
    u.u_time.value = t
    // smooth lerp toward target wave so it doesn't snap
    u.u_wave.value += (this.#wave - u.u_wave.value) * 0.07
    this.#renderer.render(this.#scene, this.#camera)
  }

  dispose() {
    if (this.#raf) this.#raf()
    this.#renderer?.dispose()
    this.#canvas?.remove()
  }
}
