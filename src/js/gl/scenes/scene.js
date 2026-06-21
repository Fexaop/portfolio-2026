import { Scene as THREE_Scene } from "three"
import { FSlider } from "../fslider"
import { Item } from "../item"
import { loadAssets } from "../utils/loader"
import { hey } from "../../hey"

export class Scene extends THREE_Scene {
  isOn = true

  constructor() {
    super()
    this.create()
  }

  async load() {
    this.assets = await loadAssets()

    this.environment = this.assets.hdr_world
    this.environmentIntensity = 1
    this.environmentRotation.set(0, 0.5, 1)

    hey.WEBGL_LOADED = true

    setTimeout(() => {
      hey.START = true
    }, 0)
  }

  async create() {
    /** -- slider (animated background only — GLB food models removed) */
    const slider = document.querySelector('[data-module="fslider"]')
    if (slider) {
      this.fslider = new FSlider(slider)
      this.add(this.fslider)
    }

    const item = document.querySelector('[data-gl="item"]')
    if (item) {
      this.item = new Item(item)
      this.add(this.item)
    }

    await this.load()
  }

  // ////////////////////// world

  // static world = {
  //   env: new DataTexture(null, 1, 1),
  // }
}
