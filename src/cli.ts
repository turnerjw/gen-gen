#!/usr/bin/env node
import path from "node:path";
import {generateDataFile} from "./generator.js";

interface CliOptions {
  input?: string;
  cwd?: string;
  check: boolean;
  dryRun: boolean;
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.includes("--help") || args.includes("-h")) {
    printHelp();
    return;
  }

  const options = parseArgs(args);
  const result = await generateDataFile({
    input: options.input,
    cwd: options.cwd,
    write: !options.dryRun && !options.check,
  });

  for (const warning of result.warnings) {
    console.warn(`[gen-gen] ${warning}`);
  }

  if (options.check) {
    if (result.changed) {
      console.error(`[gen-gen] ${path.relative(process.cwd(), result.inputPath)} is out of date.`);
      process.exitCode = 1;
      return;
    }

    console.log(`[gen-gen] ${path.relative(process.cwd(), result.inputPath)} is up to date.`);
    return;
  }

  if (options.dryRun) {
    console.log(result.content);
    return;
  }

  const verb = result.changed ? "Generated" : "No changes for";
  console.log(`[gen-gen] ${verb} ${path.relative(process.cwd(), result.inputPath)}`);
}

function parseArgs(args: string[]): CliOptions {
  const options: CliOptions = {
    check: false,
    dryRun: false,
  };

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];

    if (arg === "--input" || arg === "-i") {
      options.input = args[i + 1];
      i += 1;
      continue;
    }

    if (arg === "--cwd") {
      options.cwd = args[i + 1];
      i += 1;
      continue;
    }

    if (arg === "--check") {
      options.check = true;
      continue;
    }

    if (arg === "--dry-run") {
      options.dryRun = true;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
}

function printHelp(): void {
  console.log(`gen-gen

Usage:
  gen-gen [options]

Options:
  -i, --input <path>  Path to generator source file (default: data-gen.ts)
      --cwd <path>    Working directory to resolve input from
      --check         Exit 1 if generated section is out of date
      --dry-run       Print resulting file content to stdout
  -h, --help          Show this help message
`);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[gen-gen] ${message}`);
  process.exit(1);
});
