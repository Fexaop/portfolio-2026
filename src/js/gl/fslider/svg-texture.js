import { CanvasTexture, SRGBColorSpace, LinearFilter } from "three"

// Rasterize an inline DOM <svg> into a CanvasTexture so the slider icons can
// live inside the WebGL ring (instead of being a DOM layer on top). The slide
// icons are white strokes on a transparent background, so the texture keeps its
// alpha and sits cleanly over the gradient card.
export function svgToTexture(svgEl, { size = 600 } = {}) {
  return new Promise(resolve => {
    if (!svgEl) return resolve(null)

    // clone so normalizing attributes never touches the live DOM node
    const clone = svgEl.cloneNode(true)
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg")
    clone.removeAttribute("class")
    clone.removeAttribute("style")

    // figure out the intrinsic aspect ratio from width/height or the viewBox
    let w = parseFloat(clone.getAttribute("width")) || 0
    let h = parseFloat(clone.getAttribute("height")) || 0
    const vb = clone.getAttribute("viewBox")
    if ((!w || !h) && vb) {
      const p = vb.split(/[\s,]+/).map(Number)
      w = p[2]
      h = p[3]
    }
    if (!w || !h) w = h = 150
    const aspect = w / h

    // render at `size` on the long edge for a crisp texture at any card scale
    const cw = aspect >= 1 ? size : Math.round(size * aspect)
    const ch = aspect >= 1 ? Math.round(size / aspect) : size
    clone.setAttribute("width", w)
    clone.setAttribute("height", h)

    const xml = new XMLSerializer().serializeToString(clone)
    const url = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(xml)

    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => {
      const canvas = document.createElement("canvas")
      canvas.width = cw
      canvas.height = ch
      const ctx = canvas.getContext("2d")
      ctx.drawImage(img, 0, 0, cw, ch)

      const tex = new CanvasTexture(canvas)
      tex.colorSpace = SRGBColorSpace
      tex.minFilter = LinearFilter
      tex.magFilter = LinearFilter
      tex.anisotropy = 4
      tex.needsUpdate = true
      resolve({ texture: tex, aspect })
    }
    img.onerror = () => resolve(null)
    img.src = url
  })
}
