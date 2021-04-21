export * as ConsoleColor from "https://deno.land/x/colorlog@v1.0/mod.ts";

// NOTE(eveningkid): this has not be versioned because the Github releases are not up-to-date.
// Only master is valid at the moment. Seems safe for now since there is no commits being added
export { default as SQLQueryBuilder } from "https://raw.githubusercontent.com/aghussb/dex/master/mod.ts";

export { camelCase, snakeCase } from "https://deno.land/x/case@v2.1.0/mod.ts";

export {
  Client as MySQLClient,
  Connection as MySQLConnection,
} from "https://deno.land/x/mysql@v2.8.0/mod.ts";

export { Client as PostgresClient } from "https://deno.land/x/postgres@v0.11.1/mod.ts";

export { DB as SQLiteClient } from "https://deno.land/x/sqlite@v2.3.1/mod.ts";

export { Bson, MongoClient as MongoDBClient } from "https://deno.land/x/mongo@v0.22.0/mod.ts";
export type { ConnectOptions as MongoDBClientOptions } from "https://deno.land/x/mongo@v0.22.0/mod.ts";
export type { Database as MongoDBDatabase } from "https://deno.land/x/mongo@v0.22.0/src/database.ts";
