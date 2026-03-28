export interface DocsNavItem {
  title: string;
  to: string;
  description: string;
  sourcePath: string;
  keywords: string[];
  section: string;
}

export const docsSections = ["Getting Started", "Guides", "Integration", "Help"] as const;

export type DocsSection = (typeof docsSections)[number];

export const docsNav: DocsNavItem[] = [
  // Getting Started
  {
    title: "Getting Started",
    to: "/docs",
    description: "Install gen-gen, create your first generator, and use it in a test.",
    sourcePath: "website/src/content/docs/getting-started.md",
    keywords: ["install", "quickstart", "first run", "overrides"],
    section: "Getting Started",
  },
  {
    title: "Why gen-gen?",
    to: "/docs/why-gen-gen",
    description: "The test data maintenance problem and how gen-gen solves it.",
    sourcePath: "website/src/content/docs/why-gen-gen.md",
    keywords: ["why", "philosophy", "maintenance", "test data"],
    section: "Getting Started",
  },

  // Guides
  {
    title: "Using Your Generators",
    to: "/docs/using-generators",
    description: "Overrides, nested helpers, callbacks, composition, and special cases.",
    sourcePath: "website/src/content/docs/using-generators.md",
    keywords: ["overrides", "helpers", "callbacks", "composition", "ignore", "unions"],
    section: "Guides",
  },
  {
    title: "Configuration",
    to: "/docs/configuration",
    description: "Faker overrides, strategies, GenGenConfig, and type filters.",
    sourcePath: "website/src/content/docs/configuration.md",
    keywords: ["config", "faker", "overrides", "strategy", "deepMerge", "include", "exclude"],
    section: "Guides",
  },
  {
    title: "Examples",
    to: "/docs/examples",
    description: "Short, self-contained recipes for common scenarios.",
    sourcePath: "website/src/content/docs/examples.md",
    keywords: ["examples", "recipes", "patterns", "testing"],
    section: "Guides",
  },

  // Integration
  {
    title: "CLI Reference",
    to: "/docs/cli",
    description: "All 7 command-line flags with copy-paste examples.",
    sourcePath: "website/src/content/docs/cli.md",
    keywords: ["cli", "flags", "watch", "commands"],
    section: "Integration",
  },
  {
    title: "API Reference",
    to: "/docs/api",
    description: "Programmatic usage with generateDataFile.",
    sourcePath: "website/src/content/docs/api.md",
    keywords: ["api", "generateDataFile", "programmatic", "typescript"],
    section: "Integration",
  },
  {
    title: "Vite Plugin",
    to: "/docs/vite-plugin",
    description: "Run gen-gen automatically during Vite dev and build.",
    sourcePath: "website/src/content/docs/vite-plugin.md",
    keywords: ["vite", "plugin", "dev server", "build"],
    section: "Integration",
  },

  // Help
  {
    title: "Troubleshooting",
    to: "/docs/troubleshooting",
    description: "Common warnings, errors, and their fixes.",
    sourcePath: "website/src/content/docs/troubleshooting.md",
    keywords: ["errors", "warnings", "diagnostics", "fixes"],
    section: "Help",
  },
];

const GITHUB_EDIT_BASE = "https://github.com/justinturner/gen-gen/blob/main";

function normalizePath(pathname: string): string {
  if (pathname !== "/" && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }
  return pathname;
}

export function getCurrentDoc(pathname: string): DocsNavItem | undefined {
  const normalized = normalizePath(pathname);
  return docsNav.find((item) => normalizePath(item.to) === normalized);
}

export function getAdjacentDocs(pathname: string): {previous?: DocsNavItem; next?: DocsNavItem} {
  const current = getCurrentDoc(pathname);
  if (!current) {
    return {};
  }

  const index = docsNav.findIndex((item) => item.to === current.to);
  return {
    previous: index > 0 ? docsNav[index - 1] : undefined,
    next: index >= 0 && index < docsNav.length - 1 ? docsNav[index + 1] : undefined,
  };
}

export function getEditUrl(sourcePath: string): string {
  return `${GITHUB_EDIT_BASE}/${sourcePath}`;
}
