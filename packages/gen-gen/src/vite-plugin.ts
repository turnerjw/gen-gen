import fs from "node:fs";
import path from "node:path";
import ts from "typescript";
import {
  generateDataFile,
  type GenerateResult,
} from "./generator.js";

export interface GenGenPluginOptions {
  input?: string;
  failOnWarn?: boolean;
}

interface ViteLikePluginContext {
  addWatchFile(file: string): void;
}

interface ViteLikeServer {
  watcher: {
    on(event: "change", listener: (file: string) => void): void;
  };
  ws: {
    send(payload: { type: "full-reload" }): void;
  };
}

interface PluginDeps {
  generate(options: {
    input?: string;
    cwd?: string;
    write?: boolean;
    failOnWarn?: boolean;
  }): Promise<GenerateResult>;
  warn(message: string): void;
  error(message: string, error: unknown): void;
}

function createPluginLanguageService(inputPath: string, cwd: string): ts.LanguageService {
  const compilerOptions: ts.CompilerOptions = {
    target: ts.ScriptTarget.ESNext,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    allowJs: true,
    skipLibCheck: true,
    strict: true,
    noEmit: true,
  };
  const fileVersions = new Map<string, number>();
  const serviceHost: ts.LanguageServiceHost = {
    getScriptFileNames: () => [inputPath],
    getScriptVersion: (f) => String(fileVersions.get(f) ?? 0),
    getScriptSnapshot: (f) => {
      if (!ts.sys.fileExists(f)) return undefined;
      return ts.ScriptSnapshot.fromString(fs.readFileSync(f, "utf8"));
    },
    getCurrentDirectory: () => cwd,
    getCompilationSettings: () => compilerOptions,
    getDefaultLibFileName: ts.getDefaultLibFilePath,
    fileExists: ts.sys.fileExists,
    readFile: ts.sys.readFile,
    readDirectory: ts.sys.readDirectory,
  };
  return ts.createLanguageService(serviceHost);
}

export function createGenGenPlugin(options: GenGenPluginOptions = {}, deps?: PluginDeps) {
  let root = process.cwd();
  const watchedFiles = new Set<string>();
  let watchRunCount = 0;
  let languageService: ts.LanguageService | undefined;

  function getLanguageService(): ts.LanguageService {
    if (!languageService) {
      const inputPath = path.resolve(root, options.input ?? "data-gen.ts");
      languageService = createPluginLanguageService(inputPath, root);
    }
    return languageService;
  }

  const defaultDeps: PluginDeps = {
    generate(opts) {
      return generateDataFile({...opts, languageService: getLanguageService()});
    },
    warn(message) {
      console.warn(message);
    },
    error(message, error) {
      console.error(message, error);
    },
  };

  const resolvedDeps = deps ?? defaultDeps;

  async function runGeneration(write: boolean, triggerFile?: string): Promise<GenerateResult> {
    watchRunCount += 1;
    const startedAt = Date.now();
    const result = await resolvedDeps.generate({
      input: options.input,
      cwd: root,
      write,
      failOnWarn: options.failOnWarn,
    });

    watchedFiles.clear();
    for (const file of result.watchedFiles) {
      watchedFiles.add(path.resolve(file));
    }

    for (const warning of result.warnings) {
      resolvedDeps.warn(`[gen-gen] ${warning}`);
    }

    if (process.env.GEN_GEN_WATCH_DIAGNOSTICS === "1") {
      if (triggerFile) {
        resolvedDeps.warn(`[gen-gen] vite watch trigger: ${path.resolve(triggerFile)}`);
      }
      const elapsedMs = Date.now() - startedAt;
      resolvedDeps.warn(
        `[gen-gen] vite watch run #${watchRunCount} metrics: ${elapsedMs}ms, changed=${result.changed}, warnings=${result.warnings.length}, watched=${result.watchedFiles.length}`,
      );
    }

    return result;
  }

  return {
    name: "gen-gen",

    configResolved(config: { root: string }) {
      root = config.root;
    },

    async buildStart(this: ViteLikePluginContext) {
      const result = await runGeneration(true);
      for (const file of result.watchedFiles) {
        this.addWatchFile(file);
      }
    },

    configureServer(server: ViteLikeServer) {
      server.watcher.on("change", async (file) => {
        if (!watchedFiles.has(path.resolve(file))) {
          return;
        }

        try {
          const result = await runGeneration(true, file);
          if (result.changed) {
            server.ws.send({type: "full-reload"});
          }
        } catch (error) {
          resolvedDeps.error("[gen-gen] generation failed during watch", error);
        }
      });
    },
  };
}

export function genGenPlugin(options: GenGenPluginOptions = {}) {
  return createGenGenPlugin(options);
}
