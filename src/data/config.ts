export const siteConfig = {
  name: "Karthik",
  displayName: "KARTHIK",
  role: "Full-Stack Developer & DevOps Engineer",
  email: "karthikatomiq@gmail.com",
  version: "SYS.5.0",
  location: "EARTH // SECTOR-IN",

  nav: [
    { label: "LORE", href: "#about" },
    { label: "ARSENAL", href: "#projects" },
    { label: "COMMS", href: "#contact" },
  ],

  socials: [
    { label: "INSTAGRAM", href: "https://www.instagram.com/karthik_18_88?igsh=ZmIya3N2aGlxeWMx" },
    { label: "LINKEDIN", href: "#" },
  ],

  // Edit these freely — sample units. Kanji renders as background art on each card.
  projects: [
    {
      id: "01",
      name: "ORBITAL",
      codename: "CI/CD_PIPELINE.EXE",
      kanji: "軌道",
      status: "ONLINE",
      desc: "Zero-downtime deployment orchestrator. GitOps-driven pipelines that ship containers to production while the planet sleeps.",
      tags: ["NEXT.JS", "KUBERNETES", "GO", "ARGOCD"],
      gradient: "from-mecha-purple/35 via-transparent to-mecha-green/15",
      href: "#",
    },
    {
      id: "02",
      name: "SENTINEL",
      codename: "OBSERVABILITY_GRID.SYS",
      kanji: "監視",
      status: "STABLE",
      desc: "Full-stack observability grid. Distributed tracing, log aggregation and anomaly alerts before the pager ever screams.",
      tags: ["RUST", "PROMETHEUS", "GRAFANA", "OTEL"],
      gradient: "from-mecha-purple/40 via-transparent to-mecha-purple/15",
      href: "#",
    },
    {
      id: "03",
      name: "NEON-COMMERCE",
      codename: "STOREFRONT_CORE.APP",
      kanji: "商店",
      status: "ONLINE",
      desc: "Headless commerce engine with edge-rendered storefronts. Sub-second loads, real-time inventory, zero jank at checkout.",
      tags: ["REACT", "NODE.JS", "POSTGRES", "REDIS"],
      gradient: "from-mecha-green/15 via-transparent to-mecha-purple/30",
      href: "#",
    },
    {
      id: "04",
      name: "HYPERVISOR",
      codename: "INFRA_CONTROL.TF",
      kanji: "制御",
      status: "ARMED",
      desc: "Infrastructure control plane. One dashboard to provision, scale and destroy cloud fleets across regions with Terraform.",
      tags: ["TYPESCRIPT", "AWS", "TERRAFORM", "DOCKER"],
      gradient: "from-mecha-purple/30 via-transparent to-mecha-green/20",
      href: "#",
    },
  ],

  // Operator profile cards in the LORE horizontal track — edit copy here.
  operators: [
    {
      number: "01",
      title: "THE CORE ARCHITECT",
      subtitle: "// BEHIND_THE_OPERATIONS",
      fields: [
        { label: "EDUCATION", value: "SELF-DIRECTED // CONTINUOUS" },
        { label: "SPECIALIZATION", value: "DEVOPS // SYSTEM DESIGN" },
        { label: "SYSTEMS", value: "KUBERNETES // TERRAFORM" },
      ],
      stream: [
        "I architect the invisible: pipelines, clusters and control planes that let code ship itself while the planet sleeps.",
        "From blank repo to production fleet, I keep every layer honest — versioned, observable and reproducible on demand.",
        "When the pager screams, the blueprint answers. Clean architecture is not aesthetics; it is survival.",
      ],
    },
    {
      number: "02",
      title: "THE FULL-STACK OPERATIVE",
      subtitle: "// BEHIND_THE_CODE",
      fields: [
        { label: "EDUCATION", value: "DR.G.R.D COLLEGE (ACTIVE)" },
        { label: "SPECIALIZATION", value: "PYTHON // FULL-STACK" },
        { label: "SYSTEMS", value: "PYTHON // SQL" },
      ],
      stream: [
        "I am currently pursuing a B.Sc. in Computer Science and am in my second year at Dr. G.R. Damodaran College of Science.",
        "As a 5X Developer at Atomiq India, I translate high-level project goals into clean, scalable code, ensuring our technical execution is both robust and innovative.",
        "I build comprehensive full-stack applications, leveraging Python and SQL to integrate heavy data streams and bridge the gap between complex backend logic and dynamic front-end execution.",
      ],
    },
  ],

  // Horizontal-scroll LORE panels — edit copy here.
  lore: [
    {
      heading: "CLEAN\nARCHITECTURE",
      kanji: "設計",
      body: "Obsessed with systems that read like blueprints. Layered domains, honest interfaces, zero spaghetti. Code a stranger can deploy on day one.",
    },
    {
      heading: "SCALABLE\nBACKENDS",
      kanji: "拡張",
      body: "Backends built to take a punch. Queues, caches, horizontal scale — engineered for the traffic spike you didn't see coming.",
    },
    {
      heading: "PIXEL-PERFECT\nUIS",
      kanji: "精密",
      body: "The last 1% is the whole product. Micro-interactions, 60fps motion, typography tuned to the pixel. Ship interfaces that feel alive.",
    },
  ],
};

export type Project = (typeof siteConfig.projects)[number];
export type Operator = (typeof siteConfig.operators)[number];
