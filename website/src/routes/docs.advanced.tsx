import {createFileRoute} from "@tanstack/react-router";

import {MarkdownDoc} from "@/components/markdown-doc";
import rawMd from "@/content/docs/advanced.md?raw";

export const Route = createFileRoute("/docs/advanced")({
  component: () => <MarkdownDoc raw={rawMd} />,
});
