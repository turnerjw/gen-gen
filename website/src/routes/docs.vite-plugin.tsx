import {createFileRoute} from "@tanstack/react-router";

import {MarkdownDoc} from "@/components/markdown-doc";
import rawMd from "@/content/docs/vite-plugin.md?raw";

export const Route = createFileRoute("/docs/vite-plugin")({
  component: () => <MarkdownDoc raw={rawMd} />,
});
