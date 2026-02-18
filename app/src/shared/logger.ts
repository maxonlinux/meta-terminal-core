import {
  configure,
  getConsoleSink,
  getJsonLinesFormatter,
  getLogger,
} from "@logtape/logtape";
import { getPrettyFormatter } from "@logtape/pretty";
import { config } from "@/env.config";

const logger = getLogger("core");

export async function initLogging() {
  const usePretty =
    config.NODE_ENV === "development" && Boolean(process.stdout.isTTY);

  const formatter = usePretty
    ? getPrettyFormatter({ properties: true })
    : getJsonLinesFormatter();

  await configure({
    sinks: { console: getConsoleSink({ formatter }) },
    loggers: [
      {
        category: ["logtape", "meta"],
        lowestLevel: "warning",
        sinks: ["console"],
      },
      {
        category: "core",
        lowestLevel: config.LOG_LEVEL,
        sinks: ["console"],
      },
    ],
  });
}

export { logger };
