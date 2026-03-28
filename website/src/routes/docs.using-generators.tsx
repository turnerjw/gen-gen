import {createFileRoute} from "@tanstack/react-router";

import {MarkdownDoc} from "@/components/markdown-doc";
import rawMd from "@/content/docs/using-generators.md?raw";

export const Route = createFileRoute("/docs/using-generators")({
  component: () => <MarkdownDoc raw={rawMd} />,
});
