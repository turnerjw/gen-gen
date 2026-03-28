import {createFileRoute} from "@tanstack/react-router";

import {MarkdownDoc} from "@/components/markdown-doc";
import rawMd from "@/content/docs/release-notes.md?raw";

export const Route = createFileRoute("/docs/release-notes")({
  component: () => <MarkdownDoc raw={rawMd} />,
});
