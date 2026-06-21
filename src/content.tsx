// ----------------------------------------------------- portfolio

export const PROFILE = {
  name: "Gunit Kumar",
  role: "Backend & DevOps Engineer",
  // shown under the FEXA hero
  tagline:
    "Backend & DevOps engineer building reliable, scalable systems and automated infrastructure.",
  email: "gunit1895@gmail.com",
  github: "https://github.com/Fexaop",
}

export const LINKS = {
  github: PROFILE.github,
  email: `mailto:${PROFILE.email}`,
  // kept for legacy pages (examples/footer)
  twitter: "https://github.com/Fexaop",
  instagram: "https://github.com/Fexaop",
  website: PROFILE.github,
  docs: PROFILE.github,
}

export const GITHUB = {
  issues: PROFILE.github,
  pull_requests: PROFILE.github,
}

export const ABOUT = {
  lead: "I design and run the systems behind the product.",
  body: "I'm Gunit — a backend & DevOps engineer focused on building services that stay fast and reliable under load, and on the automation that ships them safely. From API design to Kubernetes, CI/CD and cloud infra, I care about clean architecture, observability, and making infrastructure boring (in the best way).",
}

export const SKILLS = [
  {
    title: "Backend",
    items: ["Go", "Python", "Node.js", "TypeScript", "gRPC", "REST", "GraphQL"],
  },
  {
    title: "DevOps / Infra",
    items: [
      "Docker",
      "Kubernetes",
      "Terraform",
      "GitHub Actions",
      "ArgoCD",
      "Helm",
      "Linux",
    ],
  },
  {
    title: "Cloud",
    items: ["AWS", "GCP", "Cloudflare", "Nginx", "Serverless"],
  },
  {
    title: "Databases",
    items: ["PostgreSQL", "Redis", "MongoDB", "Kafka"],
  },
]

export const IN_USE = {
  url: "https://example.com",
  items: [
    {
      title: "Iyo AI",
      year: "2026",
      by: "Federico",
      by_url: "https://www.federic.ooo",
      url: "https://www.iyo.ai",
    },
    {
      title: "Cleo",
      year: "2026",
      by: "Paulo Ferreira Jorge",
      by_url: "https://pauloferreirajorge.com",
      url: "https://web.meetcleo.com",
    },
    {
      title: "Rio Property",
      year: "2026",
      by: "Hishaam",
      by_url: "https://www.hishaam.co.za",
      url: "https://www.rioproperty.co.za",
    },
    {
      title: "Risk Film",
      year: "2026",
      by: "Carre Studio",
      by_url: "https://www.carre.studio",
      url: "https://www.risk.film",
    },
    {
      title: "More Nutrition",
      year: "2025",
      by: "Eduard Bodak",
      by_url: "https://eduardbodak.com",
      url: "https://more-nutrition.webflow.io/",
    },
    {
      title: "Siena Film",
      year: "2025",
      by: "Federico",
      by_url: "https://federic.ooo",
      url: "https://siena.film",
    },
    {
      title: "VisualBusiness",
      year: "2025",
      by: "Federico",
      by_url: "https://federic.ooo",
      url: "https://vvisual.biz",
    },
  ],
}

// /////////////////////////////////// (webgl)

// Selected work. Drives both the project carousel and its WebGL gradient
// backgrounds. (Kept the SLIDER_FOOD name + fields so the GL slider keeps
// working — `tag` is the big bubbly label, `copy` is the title/meta, `bg`
// is the animated gradient palette.) Edit freely.
export const SLIDER_FOOD = [
  {
    name: "lapick",
    tag: "LAPICK",
    rot: [0, 0, 0],
    wiggle: 0.4,
    copy: {
      name: "Lapick",
      description: "AI laptop finder · JS · 2025",
    },
    url: "https://github.com/JCKawin/Lapick",
    bg: [0xbf965a, 0x993b8b, 0xb26c52],
  },
  {
    name: "visionx",
    tag: "VISIONX",
    rot: [0, 0, 0],
    wiggle: 0.4,
    copy: {
      name: "VisionX",
      description: "Computer vision · Python · 2025",
    },
    url: "https://github.com/Fexaop/visionx",
    bg: [0x8daaaf, 0x152a42, 0xc49a62],
  },
  {
    name: "better-goth",
    tag: "AUTH",
    rot: [0, 0, 0],
    wiggle: 0.65,
    copy: {
      name: "better-goth",
      description: "Auth library · Go · 2025",
    },
    url: "https://github.com/Protofarm/better-goth",
    bg: [0xcbc06d, 0xad6090, 0xb05f5a],
  },
  {
    name: "pwncore",
    tag: "PWN",
    rot: [0, 0, 0],
    wiggle: 0.8,
    copy: {
      name: "pwncore",
      description: "CTF platform · Python · 2025",
    },
    url: "https://github.com/Fexaop/pwncore",
    bg: [0xbc995b, 0xa23a1e, 0x504934],
  },
  {
    name: "whats4linux",
    tag: "CHAT",
    rot: [0, 0, 0],
    wiggle: 0.7,
    copy: {
      name: "whats4linux",
      description: "WhatsApp client · Go · 2025",
    },
    url: "https://github.com/Fexaop/whats4linux",
    bg: [0xae7498, 0x6c537f, 0x72329f],
  },
  {
    name: "hyprbar",
    tag: "BAR",
    rot: [0, 0, 0],
    wiggle: 0.7,
    copy: {
      name: "hyprland-gtk4-bar",
      description: "Wayland status bar · Python · 2025",
    },
    url: "https://github.com/Fexaop/hyprland-gtk4-bar",
    bg: [0xc17d5c, 0xb69e4c, 0xc2b9a7],
  },
  {
    name: "gocher",
    tag: "GOCHER",
    rot: [0, 0, 0],
    wiggle: 0.5,
    copy: {
      name: "gocher",
      description: "Distributed systems · Go · 2026",
    },
    url: "https://github.com/Protofarm/gocher",
    bg: [0x6c9a8f, 0x2a3f6b, 0xc4a05a],
  },
]
