import {type DocsNavItem, docsNav, getCurrentDoc} from "@/lib/docs";

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

export interface SearchableSection {
  heading: string | null;
  slug: string | null;
  body: string;
}

export interface SearchableDoc {
  nav: DocsNavItem;
  body: string;
  sections: SearchableSection[];
}

function buildSections(raw: string): SearchableSection[] {
  const body = raw.replace(/^---[\s\S]*?---\n?/, "");
  const sections: SearchableSection[] = [];
  // Split on h2/h3 headings, keeping the heading in the result
  const parts = body.split(/^(?=#{2,3}\s+)/m);

  for (const part of parts) {
    const headingMatch = part.match(/^(#{2,3})\s+(.+)$/m);
    if (headingMatch) {
      const text = headingMatch[2].replace(/[*_`]/g, "").trim();
      sections.push({
        heading: text,
        slug: slugify(text),
        body: stripMarkdown(part),
      });
    } else {
      // Content before the first heading
      const stripped = stripMarkdown(part);
      if (stripped) {
        sections.push({heading: null, slug: null, body: stripped});
      }
    }
  }
  return sections;
}

export const searchableDocs: SearchableDoc[] = docsNav.map((nav) => {
  const raw = rawByPath[nav.sourcePath] ?? "";
  return {
    nav,
    body: stripMarkdown(raw),
    sections: buildSections(raw),
  };
});

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

export interface TocHeading {
  level: 2 | 3;
  text: string;
  slug: string;
}

function extractHeadings(raw: string): TocHeading[] {
  const body = raw.replace(/^---[\s\S]*?---\n?/, "");
  // Remove code blocks so we don't pick up headings inside them
  const withoutCode = body.replace(/```[\s\S]*?```/g, "");
  const headings: TocHeading[] = [];
  for (const match of withoutCode.matchAll(/^(#{2,3})\s+(.+)$/gm)) {
    const level = match[1].length as 2 | 3;
    const text = match[2].replace(/[*_`]/g, "").trim();
    headings.push({level, text, slug: slugify(text)});
  }
  return headings;
}

export function getHeadingsForRoute(pathname: string): TocHeading[] {
  const doc = getCurrentDoc(pathname);
  if (!doc) return [];
  const raw = rawByPath[doc.sourcePath];
  if (!raw) return [];
  return extractHeadings(raw);
}
