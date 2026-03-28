import {createFileRoute} from "@tanstack/react-router";

import {MarkdownDoc} from "@/components/markdown-doc";
import rawMd from "@/content/docs/examples.md?raw";

export const Route = createFileRoute("/docs/examples")({
  component: () => <MarkdownDoc raw={rawMd} />,
});
