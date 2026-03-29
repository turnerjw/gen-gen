import {useEffect, useState} from "react";

import type {TocHeading} from "@/lib/docs-content";

interface TableOfContentsProps {
  headings: TocHeading[];
}

export function TableOfContents({headings}: TableOfContentsProps) {
  const activeSlug = useActiveHeading(headings);

  if (headings.length === 0) return null;

  return (
    <nav className="space-y-1 text-xs">
      <div className="pb-1 text-xs font-semibold uppercase tracking-nav text-syntax-muted">
        On this page
      </div>
      {headings.map((heading) => (
        <a
          key={heading.slug}
          href={`#${heading.slug}`}
          className={`block transition-colors ${
            heading.level === 3 ? "pl-3" : ""
          } ${
            activeSlug === heading.slug
              ? "font-bold text-primary"
              : "text-docs-muted hover:text-background"
          }`}
        >
          {heading.text}
        </a>
      ))}
    </nav>
  );
}

function useActiveHeading(headings: TocHeading[]): string | null {
  const [active, setActive] = useState<string | null>(headings[0]?.slug ?? null);

  // Reset active heading when the page changes
  useEffect(() => {
    setActive(headings[0]?.slug ?? null);
  }, [headings]);

  useEffect(() => {
    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActive(entry.target.id);
            return;
          }
        }
      },
      {rootMargin: "-80px 0px -60% 0px", threshold: 0},
    );

    // Defer observation to next frame so the new page's DOM is ready
    const raf = requestAnimationFrame(() => {
      for (const heading of headings) {
        const el = document.getElementById(heading.slug);
        if (el) observer.observe(el);
      }
    });

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, [headings]);

  return active;
}
