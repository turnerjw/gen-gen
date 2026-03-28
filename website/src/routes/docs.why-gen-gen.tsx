import {createFileRoute} from "@tanstack/react-router";

import {MarkdownDoc} from "@/components/markdown-doc";
import rawMd from "@/content/docs/why-gen-gen.md?raw";

export const Route = createFileRoute("/docs/why-gen-gen")({
  component: () => <MarkdownDoc raw={rawMd} />,
});
