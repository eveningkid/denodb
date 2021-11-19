export * as ConsoleColor from "https://deno.land/x/colorlog@v1.0/mod.ts";

// NOTE: these changes fixes #303.
export { default as SQLQueryBuilder } from "https://raw.githubusercontent.com/Zhomart/dex/c452c40b365e73265a25c18cb7adf5d35c1dbb8b/mod-dyn.ts";

export { camelCase, snakeCase } from "https://deno.land/x/case@v2.1.0/mod.ts";

export {
  Client as MySQLClient,
  configLogger as configMySQLLogger,
  Connection as MySQLConnection,
} from "https://deno.land/x/mysql@v2.10.1/mod.ts";
export type { LoggerConfig } from "https://deno.land/x/mysql@v2.10.1/mod.ts";

export { Client as PostgresClient } from "https://deno.land/x/postgres@v0.14.2/mod.ts";

export { DB as SQLiteClient } from "https://deno.land/x/sqlite@v3.1.3/mod.ts";

export { MongoClient as MongoDBClient, Bson } from "https://deno.land/x/mongo@v0.28.0/mod.ts";
export type { ConnectOptions as MongoDBClientOptions } from "https://deno.land/x/mongo@v0.28.0/mod.ts";
export type { Database as MongoDBDatabase } from "https://deno.land/x/mongo@v0.28.0/src/database.ts";
