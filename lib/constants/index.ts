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
    { name: "Plugins", href: "/plugin" },
    { name: "Deployment", href: "/deployment" },
  ],
  footer: {
    platform: [
      { name: "Home", href: "/" },
      { name: "Plugins", href: "/plugin" },
      { name: "Deployment", href: "/deployment" },
    ],
    support: [
      { name: "Documentation", href: "/docs" },
      { name: "Help Center", href: "/support" },
      { name: "Contact Us", href: "/contact" },
    ],
  },
} as const; 