import {createFileRoute} from "@tanstack/react-router";

import {MarkdownDoc} from "@/components/markdown-doc";
import rawMd from "@/content/docs/cli.md?raw";

export const Route = createFileRoute("/docs/cli")({
  component: () => <MarkdownDoc raw={rawMd} />,
});
