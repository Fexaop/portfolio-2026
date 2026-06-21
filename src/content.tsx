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
    name: "proj-api",
    tag: "API",
    rot: [0, 0, 0],
    wiggle: 0.4,
    copy: {
      name: "Distributed API Gateway",
      description: "Go · gRPC · 2024",
    },
    url: "https://github.com/Fexaop",
    bg: [0xbf965a, 0x993b8b, 0xb26c52],
  },
  {
    name: "proj-k8s",
    tag: "K8S",
    rot: [0, 0, 0],
    wiggle: 0.4,
    copy: {
      name: "Kubernetes Platform",
      description: "Helm · ArgoCD · 2024",
    },
    url: "https://github.com/Fexaop",
    bg: [0x8daaaf, 0x152a42, 0xc49a62],
  },
  {
    name: "proj-cicd",
    tag: "CI/CD",
    rot: [0, 0, 0],
    wiggle: 0.65,
    copy: {
      name: "Release Pipeline",
      description: "Actions · Docker · 2023",
    },
    url: "https://github.com/Fexaop",
    bg: [0xcbc06d, 0xad6090, 0xb05f5a],
  },
  {
    name: "proj-cloud",
    tag: "CLOUD",
    rot: [0, 0, 0],
    wiggle: 0.8,
    copy: {
      name: "Multi-Region Infra",
      description: "AWS · Terraform · 2023",
    },
    url: "https://github.com/Fexaop",
    bg: [0xbc995b, 0xa23a1e, 0x504934],
  },
  {
    name: "proj-data",
    tag: "DATA",
    rot: [0, 0, 0],
    wiggle: 0.7,
    copy: {
      name: "Event Streaming",
      description: "Kafka · Postgres · 2023",
    },
    url: "https://github.com/Fexaop",
    bg: [0xae7498, 0x6c537f, 0x72329f],
  },
  {
    name: "proj-obs",
    tag: "OBS",
    rot: [0, 0, 0],
    wiggle: 0.7,
    copy: {
      name: "Observability Stack",
      description: "Prometheus · Grafana · 2022",
    },
    url: "https://github.com/Fexaop",
    bg: [0xc17d5c, 0xb69e4c, 0xc2b9a7],
  },
]
