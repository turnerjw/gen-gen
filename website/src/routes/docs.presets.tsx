import {createFileRoute} from "@tanstack/react-router";

import {MarkdownDoc} from "@/components/markdown-doc";
import rawMd from "@/content/docs/presets.md?raw";

export const Route = createFileRoute("/docs/presets")({
  component: () => <MarkdownDoc raw={rawMd} />,
});
