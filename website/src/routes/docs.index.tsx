import {createFileRoute} from "@tanstack/react-router";

import {MarkdownDoc} from "@/components/markdown-doc";
import rawMd from "@/content/docs/getting-started.md?raw";

export const Route = createFileRoute("/docs/")({
  component: () => <MarkdownDoc raw={rawMd} />,
});
