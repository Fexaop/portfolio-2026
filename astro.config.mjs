// @ts-check
import { defineConfig } from "astro/config"
import { qrcode } from "vite-plugin-qrcode"
import glsl from "vite-plugin-glsl"

import tailwindcss from "@tailwindcss/vite"
import react from "@astrojs/react"
import vue from "@astrojs/vue"

import sitemap from "@astrojs/sitemap"

export default defineConfig({
  // allow tunnels (ngrok, etc.) to reach the dev AND preview servers.
  // `astro preview` reads allowedHosts from this top-level server config.
  server: {
    allowedHosts: true,
  },
  vite: {
    plugins: [
      tailwindcss(),
      qrcode(),
      glsl({
        include: [
          "**/*.glsl",
          "**/*.wgsl",
          "**/*.vert",
          "**/*.frag",
          "**/*.vs",
          "**/*.fs",
        ],
        exclude: undefined,
        warnDuplicatedImports: true,
        removeDuplicatedImports: false,
        defaultExtension: "glsl",
        compress: true,
        watch: true,
        root: "/",
      }),
    ],
  },
  devToolbar: {
    enabled: false,
  },
  // TODO: set to your real deployed domain
  site: "https://fexa.dev",
  integrations: [react(), vue(), sitemap({})],
})
