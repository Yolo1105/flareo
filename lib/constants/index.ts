export const SITE_CONFIG = {
  name: "Flareo",
  description: "Your AI Plugin Marketplace",
  url: "https://flareo.com",
  ogImage: "https://flareo.com/og.jpg",
  links: {
    twitter: "https://twitter.com/flareo",
    github: "https://github.com/flareo",
  },
} as const;

export const NAVIGATION = {
  main: [
    { name: "Home", href: "/" },
    { name: "Explore", href: "/explore" },
    { name: "Deployment", href: "/deployment" },
  ],
  footer: {
    platform: [
      { name: "Home", href: "/" },
      { name: "Explore", href: "/explore" },
      { name: "Deployment", href: "/deployment" },
    ],
    support: [
      { name: "Documentation", href: "/docs" },
      { name: "Help Center", href: "/support" },
      { name: "Contact Us", href: "/contact" },
    ],
  },
} as const;

export const EXPLORE_MARKETPLACE_DESCRIPTION = "探索市场是一个开放的平台，让开发者可以分享和发现各种工具和资源。"; 