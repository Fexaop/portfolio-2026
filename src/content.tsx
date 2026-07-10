// ----------------------------------------------------- portfolio

export const PROFILE = {
  name: "Gunit Kumar",
  role: "Backend & DevOps Engineer",
  handle: "FEXAOP",
  location: "India",
  availability: "Open to roles & freelance",
  tagline:
    "Backend & DevOps engineer building reliable, scalable systems and automated infrastructure.",
  email: "gunit1895@gmail.com",
  github: "https://github.com/Fexaop",
}

export const LINKS = {
  github: PROFILE.github,
  email: `mailto:${PROFILE.email}`,
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
  body: "I'm Gunit, a backend & DevOps engineer focused on services that stay fast under load and the automation that ships them safely. From API design to Kubernetes, CI/CD, and cloud infra — I care about clean architecture, observability, and making infrastructure boring in the best way.",
  body2:
    "Day to day I live in Go, Python, and the Linux terminal: distributed services, CTF platforms, Wayland tooling, and the glue that keeps deploys boring and rollbacks instant. I ship open source, hack on infra, and treat reliability as a product feature.",
  focus: [
    { label: "Systems", value: "APIs, workers, queues, and the paths between them" },
    { label: "Platform", value: "Containers, clusters, pipelines, and gitops" },
    { label: "Craft", value: "Observability, docs, and code reviewers can trust" },
  ],
}

export const STATS = [
  { value: "08+", label: "Shipped projects" },
  { value: "04", label: "Primary languages" },
  { value: "24/7", label: "Uptime mindset" },
  { value: "OSS", label: "Always open source" },
]

export const SERVICES = [
  {
    title: "Backend systems",
    copy: "APIs, workers, and service boundaries that stay readable as the product grows — REST, gRPC, or event-driven as the load demands.",
    tags: ["Go", "Python", "Node", "gRPC", "REST"],
  },
  {
    title: "Platform & DevOps",
    copy: "CI/CD, containers, and cluster workflows that make deploys routine: green pipelines, predictable rollouts, and short recovery paths.",
    tags: ["Docker", "K8s", "GitHub Actions", "ArgoCD", "Helm"],
  },
  {
    title: "Cloud infrastructure",
    copy: "Cloud resources as code — networks, compute, and edge configs you can review, recreate, and tear down without tribal knowledge.",
    tags: ["AWS", "GCP", "Terraform", "Cloudflare", "Nginx"],
  },
  {
    title: "Data & messaging",
    copy: "Postgres, Redis, and streams tuned for real access patterns — not generic boilerplate. Caching, queues, and schemas that match the product.",
    tags: ["PostgreSQL", "Redis", "MongoDB", "Kafka"],
  },
]

export const EXPERIENCE = [
  {
    period: "2024 — Now",
    role: "Backend & DevOps Engineer",
    org: "Independent / Open source",
    points: [
      "Designing and shipping backend services, CTF platforms, and Linux desktop tooling under Fexaop.",
      "Owning full lifecycle: schema design, containerization, CI, and production-minded ops defaults.",
      "Collaborating on multi-repo systems (auth, distributed Go services, AI tooling) with clean interfaces.",
    ],
  },
  {
    period: "2023 — 2025",
    role: "Platform & Infrastructure",
    org: "Personal systems lab",
    points: [
      "Built and hardened local + cloud stacks: Kubernetes experiments, Terraform modules, and self-hosted services.",
      "Automated delivery with GitHub Actions, Docker multi-stage builds, and gitops-style deploys.",
      "Ran observability baselines — logs, health checks, and failure modes — before features hit users.",
    ],
  },
  {
    period: "Ongoing",
    role: "Hackathons & clubs",
    org: "SIH · campus · community",
    points: [
      "Shipped end-to-end prototypes under tight deadlines: full-stack apps, computer vision, and IoT-adjacent work.",
      "Led backend and infra slices so demos survive real traffic, not only the judging room Wi-Fi.",
    ],
  },
]

export const PRINCIPLES = [
  {
    title: "Boring infrastructure wins",
    copy: "Fancy diagrams are optional. Predictable deploys, boring databases, and documented runbooks are not. I optimize for 3am-you, not demo-day-you.",
  },
  {
    title: "Interfaces over frameworks",
    copy: "Clear service boundaries and contracts outlast whatever framework is fashionable this quarter. Design the seams first; pick the glue second.",
  },
  {
    title: "Observe or it didn't happen",
    copy: "If you can't see it fail, you can't fix it. Metrics, structured logs, and health endpoints ship with the feature — not as a later ticket.",
  },
  {
    title: "Automate the path to prod",
    copy: "Manual deploys are a liability. Pipelines, containers, and infrastructure-as-code turn releases into a reviewed, reversible habit.",
  },
]

export const SKILLS = [
  {
    title: "Backend",
    items: ["Go", "Python", "Node.js", "TypeScript", "Rust", "gRPC", "REST", "GraphQL"],
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
      "Nix",
    ],
  },
  {
    title: "Cloud",
    items: ["AWS", "GCP", "Cloudflare", "Nginx", "Serverless", "CDN"],
  },
  {
    title: "Databases",
    items: ["PostgreSQL", "Redis", "MongoDB", "Kafka", "SQLite"],
  },
]

/** Infinite marquee strip — stack & domains for visual density between sections */
export const MARQUEE = [
  "Go",
  "Python",
  "Kubernetes",
  "Terraform",
  "PostgreSQL",
  "gRPC",
  "Docker",
  "GitOps",
  "Redis",
  "AWS",
  "Linux",
  "CI/CD",
  "Observability",
  "Edge",
  "Distributed systems",
]

export const PROCESS = [
  {
    step: "01",
    title: "Map the system",
    copy: "Users, load, failure modes, and the seams between services — before a single container ships.",
  },
  {
    step: "02",
    title: "Build the spine",
    copy: "APIs, data model, and delivery pipeline in parallel so every commit has a place to land.",
  },
  {
    step: "03",
    title: "Harden & observe",
    copy: "Health checks, rollbacks, and the signals that tell you when reality diverges from the design.",
  },
  {
    step: "04",
    title: "Ship & iterate",
    copy: "Small releases, clear ownership, and docs that outlive the PR description.",
  },
]

export const PROJECT_DETAILS = [
  {
    name: "Lapick",
    summary:
      "AI-assisted laptop finder that ranks machines against real usage profiles — not marketing checkboxes.",
    stack: "JS · AI",
    year: "2025",
    status: "Live",
    url: "https://github.com/JCKawin/Lapick",
  },
  {
    name: "VisionX",
    summary:
      "Computer-vision toolkit for detection and experiment workflows, built for rapid iteration in Python.",
    stack: "Python · CV",
    year: "2025",
    status: "Open",
    url: "https://github.com/Fexaop/visionx",
  },
  {
    name: "better-goth",
    summary:
      "Go auth library with a clear API surface — sessions, tokens, and the boring security defaults done right.",
    stack: "Go · Auth",
    year: "2025",
    status: "Lib",
    url: "https://github.com/Protofarm/better-goth",
  },
  {
    name: "pwncore",
    summary:
      "CTF platform backend with dynamic flags and Dockerized challenges — built for contest scale, not toy demos.",
    stack: "Python · Docker",
    year: "2025",
    status: "Open",
    url: "https://github.com/Fexaop/pwncore",
  },
  {
    name: "whats4linux",
    summary:
      "Unofficial WhatsApp client for Linux — native-feeling messaging without the browser tax.",
    stack: "Go · Linux",
    year: "2025",
    status: "Open",
    url: "https://github.com/Fexaop/whats4linux",
  },
  {
    name: "hyprland-gtk4-bar",
    summary:
      "Wayland status bar for Hyprland, GTK4-native modules, and the widgets you actually leave open.",
    stack: "Python · GTK4",
    year: "2025",
    status: "Open",
    url: "https://github.com/Fexaop/hyprland-gtk4-bar",
  },
  {
    name: "gocher",
    summary:
      "Distributed systems experiments in Go — coordination, partitions, and the fun edge cases between nodes.",
    stack: "Go · Distributed",
    year: "2026",
    status: "WIP",
    url: "https://github.com/Protofarm/gocher",
  },
  {
    name: "niri-caelestia-shell",
    summary:
      "Desktop shell for the niri compositor — QML surfaces, panels, and the chrome around a tiling day.",
    stack: "QML · Wayland",
    year: "2025",
    status: "Open",
    url: "https://github.com/Fexaop/niri-caelestia-shell",
  },
  {
    name: "TelegramDB",
    summary:
      "Library that turns a Telegram account into a lightweight database — quirky storage with a clean API.",
    stack: "Python · API",
    year: "2025",
    status: "Lib",
    url: "https://github.com/Fexaop/TelegramDB",
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
  {
    name: "niri-shell",
    tag: "SHELL",
    rot: [0, 0, 0],
    wiggle: 0.6,
    copy: {
      name: "niri-caelestia-shell",
      description: "Desktop shell · QML · 2025",
    },
    url: "https://github.com/Fexaop/niri-caelestia-shell",
    bg: [0x3b4a8b, 0x6c4f9e, 0xc9a04a],
  },
]
