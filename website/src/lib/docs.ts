export interface DocsNavItem {
  title: string;
  to: string;
  description: string;
  sourcePath: string;
  keywords: string[];
}

export const docsNav: DocsNavItem[] = [
  {
    title: "Overview",
    to: "/docs",
    description: "Roadmap, structure, and how docs map to product features.",
    sourcePath: "website/src/content/docs/overview.md",
    keywords: ["overview", "docs", "navigation"],
  },
  {
    title: "Getting Started",
    to: "/docs/getting-started",
    description: "Install, author your first data-gen file, and run generation.",
    sourcePath: "website/src/content/docs/getting-started.md",
    keywords: ["install", "quickstart", "first run"],
  },
  {
    title: "CLI Reference",
    to: "/docs/cli",
    description: "Full command-line flags, watch mode, and examples.",
    sourcePath: "website/src/content/docs/cli.md",
    keywords: ["cli", "flags", "watch", "commands"],
  },
  {
    title: "API Reference",
    to: "/docs/api",
    description: "Programmatic usage with generateDataFile options and result shape.",
    sourcePath: "website/src/content/docs/api.md",
    keywords: ["api", "generateDataFile", "typescript"],
  },
  {
    title: "Vite Plugin",
    to: "/docs/vite-plugin",
    description: "Use gen-gen inside Vite dev/build workflows.",
    sourcePath: "website/src/content/docs/vite-plugin.md",
    keywords: ["vite", "plugin", "dev server"],
  },
  {
    title: "Faker Overrides",
    to: "/docs/faker-overrides",
    description: "Override precedence, matching keys, and fakerStrategy behavior.",
    sourcePath: "website/src/content/docs/faker-overrides.md",
    keywords: ["faker", "overrides", "strategy", "precedence"],
  },
  {
    title: "Presets",
    to: "/docs/presets",
    description: "Built-in type mapping presets: common and commerce.",
    sourcePath: "website/src/content/docs/presets.md",
    keywords: ["preset", "type mapping", "common", "commerce"],
  },
  {
    title: "Advanced Behavior",
    to: "/docs/advanced",
    description: "Deep merge, ignore tags, helper ergonomics, unions, and policy controls.",
    sourcePath: "website/src/content/docs/advanced.md",
    keywords: ["deep merge", "ignore", "union", "helpers", "policy"],
  },
  {
    title: "Examples",
    to: "/docs/examples",
    description: "Copy-paste examples aligned with /example folders.",
    sourcePath: "website/src/content/docs/examples.md",
    keywords: ["examples", "copy paste", "sample"],
  },
  {
    title: "Troubleshooting",
    to: "/docs/troubleshooting",
    description: "Common errors/warnings and concrete fixes.",
    sourcePath: "website/src/content/docs/troubleshooting.md",
    keywords: ["errors", "warnings", "diagnostics"],
  },
  {
    title: "Playground",
    to: "/docs/playground",
    description: "Playground scope, limits, starter snippets, and parse/generation errors.",
    sourcePath: "website/src/content/docs/playground.md",
    keywords: ["playground", "limitations", "single-file"],
  },
  {
    title: "Release Notes",
    to: "/docs/release-notes",
    description: "Changelog and notable docs/feature updates.",
    sourcePath: "website/src/content/docs/release-notes.md",
    keywords: ["release", "changelog", "updates"],
  },
  {
    title: "Docs QA Checklist",
    to: "/docs/qa-checklist",
    description: "Repeatable checks to keep docs snippets accurate.",
    sourcePath: "website/src/content/docs/qa-checklist.md",
    keywords: ["qa", "checklist", "validation"],
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
