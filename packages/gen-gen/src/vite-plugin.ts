import path from "node:path";
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

const defaultPluginDeps: PluginDeps = {
  generate(options) {
    return generateDataFile(options);
  },
  warn(message) {
    console.warn(message);
  },
  error(message, error) {
    console.error(message, error);
  },
};

export function createGenGenPlugin(options: GenGenPluginOptions = {}, deps: PluginDeps = defaultPluginDeps) {
  let root = process.cwd();
  const watchedFiles = new Set<string>();
  let watchRunCount = 0;

  async function runGeneration(write: boolean, triggerFile?: string): Promise<GenerateResult> {
    watchRunCount += 1;
    const startedAt = Date.now();
    const result = await deps.generate({
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
      deps.warn(`[gen-gen] ${warning}`);
    }

    if (process.env.GEN_GEN_WATCH_DIAGNOSTICS === "1") {
      if (triggerFile) {
        deps.warn(`[gen-gen] vite watch trigger: ${path.resolve(triggerFile)}`);
      }
      const elapsedMs = Date.now() - startedAt;
      deps.warn(
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
          deps.error("[gen-gen] generation failed during watch", error);
        }
      });
    },
  };
}

export function genGenPlugin(options: GenGenPluginOptions = {}) {
  return createGenGenPlugin(options);
}
