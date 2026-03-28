import {createFileRoute} from "@tanstack/react-router";

import {MarkdownDoc} from "@/components/markdown-doc";
import rawMd from "@/content/docs/configuration.md?raw";

export const Route = createFileRoute("/docs/configuration")({
  component: () => <MarkdownDoc raw={rawMd} />,
});
