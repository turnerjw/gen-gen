import {createFileRoute} from "@tanstack/react-router";

import {MarkdownDoc} from "@/components/markdown-doc";
import rawMd from "@/content/docs/faker-overrides.md?raw";

export const Route = createFileRoute("/docs/faker-overrides")({
  component: () => <MarkdownDoc raw={rawMd} />,
});
