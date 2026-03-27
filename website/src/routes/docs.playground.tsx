import {createFileRoute} from "@tanstack/react-router";

import {MarkdownDoc} from "@/components/markdown-doc";
import rawMd from "@/content/docs/playground.md?raw";

export const Route = createFileRoute("/docs/playground")({
  component: () => <MarkdownDoc raw={rawMd} />,
});
