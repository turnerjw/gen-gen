import {createFileRoute} from "@tanstack/react-router";

import {MarkdownDoc} from "@/components/markdown-doc";
import rawMd from "@/content/docs/qa-checklist.md?raw";

export const Route = createFileRoute("/docs/qa-checklist")({
  component: () => <MarkdownDoc raw={rawMd} />,
});
