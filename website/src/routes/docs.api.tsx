import {createFileRoute} from "@tanstack/react-router";

import {MarkdownDoc} from "@/components/markdown-doc";
import rawMd from "@/content/docs/api.md?raw";

export const Route = createFileRoute("/docs/api")({
  component: () => <MarkdownDoc raw={rawMd} />,
});
