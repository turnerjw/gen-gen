import {type DocsNavItem, docsNav} from "@/lib/docs";

import apiMd from "@/content/docs/api.md?raw";
import cliMd from "@/content/docs/cli.md?raw";
import configurationMd from "@/content/docs/configuration.md?raw";
import examplesMd from "@/content/docs/examples.md?raw";
import gettingStartedMd from "@/content/docs/getting-started.md?raw";
import troubleshootingMd from "@/content/docs/troubleshooting.md?raw";
import usingGeneratorsMd from "@/content/docs/using-generators.md?raw";
import vitePluginMd from "@/content/docs/vite-plugin.md?raw";
import whyGenGenMd from "@/content/docs/why-gen-gen.md?raw";

const rawByPath: Record<string, string> = {
  "website/src/content/docs/api.md": apiMd,
  "website/src/content/docs/cli.md": cliMd,
  "website/src/content/docs/configuration.md": configurationMd,
  "website/src/content/docs/examples.md": examplesMd,
  "website/src/content/docs/getting-started.md": gettingStartedMd,
  "website/src/content/docs/troubleshooting.md": troubleshootingMd,
  "website/src/content/docs/using-generators.md": usingGeneratorsMd,
  "website/src/content/docs/vite-plugin.md": vitePluginMd,
  "website/src/content/docs/why-gen-gen.md": whyGenGenMd,
};

/**
 * Strip markdown syntax to produce plain text for searching.
 */
function stripMarkdown(md: string): string {
  return (
    md
      // Remove frontmatter
      .replace(/^---[\s\S]*?---\n?/, "")
      // Remove code blocks
      .replace(/```[\s\S]*?```/g, " ")
      // Remove inline code
      .replace(/`[^`]*`/g, " ")
      // Remove headings markers
      .replace(/^#{1,6}\s+/gm, "")
      // Remove images
      .replace(/!\[.*?\]\(.*?\)/g, " ")
      // Remove links but keep text
      .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
      // Remove bold/italic markers
      .replace(/[*_]{1,3}/g, "")
      // Remove HTML tags
      .replace(/<[^>]+>/g, " ")
      // Collapse whitespace
      .replace(/\s+/g, " ")
      .trim()
  );
}

export interface SearchableDoc {
  nav: DocsNavItem;
  body: string;
}

export const searchableDocs: SearchableDoc[] = docsNav.map((nav) => ({
  nav,
  body: stripMarkdown(rawByPath[nav.sourcePath] ?? ""),
}));
