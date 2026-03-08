import path from "node:path";
import {
  generateDataFile,
  type FakerOverrideInput,
  type FakerStrategyHook,
  type GenerateResult,
  type PropertyPolicy,
} from "./generator.js";

export interface GenGenPluginOptions {
  input?: string;
  markerText?: string;
  failOnWarn?: boolean;
  propertyPolicy?: Partial<PropertyPolicy>;
  deepMerge?: boolean;
  include?: string[];
  exclude?: string[];
  fakerOverrides?: Record<string, FakerOverrideInput>;
  fakerStrategy?: FakerStrategyHook;
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
    markerText?: string;
    write?: boolean;
    failOnWarn?: boolean;
    propertyPolicy?: Partial<PropertyPolicy>;
    deepMerge?: boolean;
    include?: string[];
    exclude?: string[];
    fakerOverrides?: Record<string, FakerOverrideInput>;
    fakerStrategy?: FakerStrategyHook;
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

  async function runGeneration(write: boolean): Promise<GenerateResult> {
    const result = await deps.generate({
      input: options.input,
      cwd: root,
      markerText: options.markerText,
      write,
      failOnWarn: options.failOnWarn,
      propertyPolicy: options.propertyPolicy,
      deepMerge: options.deepMerge,
      include: options.include,
      exclude: options.exclude,
      fakerOverrides: options.fakerOverrides,
      fakerStrategy: options.fakerStrategy,
    });

    watchedFiles.clear();
    for (const file of result.watchedFiles) {
      watchedFiles.add(path.resolve(file));
    }

    for (const warning of result.warnings) {
      deps.warn(`[gen-gen] ${warning}`);
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
          const result = await runGeneration(true);
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
