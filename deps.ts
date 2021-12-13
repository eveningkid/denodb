export * as ConsoleColor from "https://deno.land/x/colorlog@v1.0/mod.ts";

// NOTE: Migrate to the official https://github.com/aghussb/dex when it's updated to the
//       latest deno version.
export { default as SQLQueryBuilder } from "https://raw.githubusercontent.com/Zhomart/dex/930253915093e1e08d48ec0409b4aee800d8bd0c/mod-dyn.ts";

export { camelCase, snakeCase } from "https://deno.land/x/case@v2.1.0/mod.ts";

export {
  Client as MySQLClient,
  configLogger as configMySQLLogger,
  Connection as MySQLConnection,
} from "https://deno.land/x/mysql@v2.10.1/mod.ts";
export type { LoggerConfig } from "https://deno.land/x/mysql@v2.10.1/mod.ts";

export { Client as PostgresClient } from "https://deno.land/x/postgres@v0.14.2/mod.ts";

export { DB as SQLiteClient } from "https://deno.land/x/sqlite@v3.1.3/mod.ts";

export { MongoClient as MongoDBClient, Bson } from "https://deno.land/x/mongo@v0.28.1/mod.ts";
export type { ConnectOptions as MongoDBClientOptions } from "https://deno.land/x/mongo@v0.28.1/mod.ts";
export type { Database as MongoDBDatabase } from "https://deno.land/x/mongo@v0.28.1/src/database.ts";
