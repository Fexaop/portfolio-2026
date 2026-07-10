import {
  Mesh,
  IcosahedronGeometry,
  MeshPhysicalMaterial,
  Color,
  Group as THREE_Group,
} from "three"
import { Group } from "~/js/gl/dom/group"
import { Raf } from "~/js/utils/subscribable"
import { Mouse } from "~/js/mouse"
import { Observe } from "~/js/modules/_/observe"
import { prefersReducedMotion } from "~/js/utils/media"
import gsap from "~/js/gsap"

// Iridescent glass orb — pure Three.js (no GLB). Tracks the cursor and
// gently breathes so About feels populated rather than text-only.
export class Orb extends Group {
  #reduced = prefersReducedMotion()
  #raf = Raf.subscribe(t => this.raf(t))
  #isIn = false
  #observe = new Observe(this.element, {
    callback: ({ isIn }) => {
      this.#isIn = isIn
      this.visible = isIn
      if (isIn) this.#intro()
    },
  })

  #introTween = null
  #scale = { v: 0 }

  constructor(el) {
    super(el)

    this.inner = new THREE_Group()
    this.add(this.inner)

    const geo = new IcosahedronGeometry(1, 3)
    this.material = new MeshPhysicalMaterial({
      color: new Color(0x1a1228),
      metalness: 0.35,
      roughness: 0.12,
      transmission: 0.55,
      thickness: 1.4,
      ior: 1.4,
      iridescence: 1,
      iridescenceIOR: 1.3,
      iridescenceThicknessRange: [120, 420],
      clearcoat: 1,
      clearcoatRoughness: 0.08,
      envMapIntensity: 1.4,
      transparent: true,
      opacity: 0.92,
      emissive: new Color(0x4c1d95),
      emissiveIntensity: 0.18,
    })

    this.mesh = new Mesh(geo, this.material)
    this.inner.add(this.mesh)

    // wireframe shell for a techy second layer
    const shell = new Mesh(
      new IcosahedronGeometry(1.06, 1),
      new MeshPhysicalMaterial({
        color: new Color(0xf0c878),
        metalness: 0.8,
        roughness: 0.3,
        wireframe: true,
        transparent: true,
        opacity: 0.22,
        emissive: new Color(0xf0c878),
        emissiveIntensity: 0.35,
      })
    )
    this.shell = shell
    this.inner.add(shell)

    this.scale.setScalar(0)
    this.visible = false
  }

  #intro() {
    if (this.#introTween) this.#introTween.kill()
    this.#scale.v = 0
    this.#introTween = gsap.to(this.#scale, {
      v: 1,
      duration: 1.4,
      ease: "expo.out",
      onUpdate: () => {
        const s =
          Math.max(this.bounds?.height || 1, this.bounds?.width || 1) * 0.42
        this.scale.setScalar(s * this.#scale.v)
      },
    })
  }

  resize() {
    if (!this.bounds) return
    const s =
      Math.max(this.bounds.height, this.bounds.width) * 0.42 * this.#scale.v
    this.scale.setScalar(s || 0.001)
  }

  raf({ time }) {
    if (!this.#isIn || this.#reduced) return

    const t = time * 0.4
    this.inner.rotation.x = t * 0.35 + Mouse.sey * 0.45
    this.inner.rotation.y = t * 0.55 + Mouse.sex * 0.55
    this.inner.rotation.z = Math.sin(t * 0.3) * 0.08

    const breath = 1 + Math.sin(time * 0.8) * 0.04
    this.mesh.scale.setScalar(breath)
    this.shell.scale.setScalar(breath * 1.02)

    // emissive pulse
    this.material.emissiveIntensity = 0.14 + Math.sin(time * 1.2) * 0.08
  }
}
