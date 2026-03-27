import {createFileRoute} from "@tanstack/react-router";

import {MarkdownDoc} from "@/components/markdown-doc";
import rawMd from "@/content/docs/troubleshooting.md?raw";

export const Route = createFileRoute("/docs/troubleshooting")({
  component: () => <MarkdownDoc raw={rawMd} />,
});
