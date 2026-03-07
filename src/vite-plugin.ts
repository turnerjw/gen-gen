import path from "node:path";
import {generateDataFile, type GenerateResult} from "./generator.js";

export interface GenGenPluginOptions {
  input?: string;
  markerText?: string;
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

export function genGenPlugin(options: GenGenPluginOptions = {}) {
  let root = process.cwd();
  const watchedFiles = new Set<string>();

  async function runGeneration(write: boolean): Promise<GenerateResult> {
    const result = await generateDataFile({
      input: options.input,
      cwd: root,
      markerText: options.markerText,
      write,
    });

    watchedFiles.clear();
    for (const file of result.watchedFiles) {
      watchedFiles.add(path.resolve(file));
    }

    for (const warning of result.warnings) {
      console.warn(`[gen-gen] ${warning}`);
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
          console.error("[gen-gen] generation failed during watch", error);
        }
      });
    },
  };
}
