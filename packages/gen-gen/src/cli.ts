#!/usr/bin/env node
import {main} from "./cli-core.js";

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[gen-gen] ${message}`);
  process.exit(1);
});
