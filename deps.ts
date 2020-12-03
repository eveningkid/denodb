export * as ConsoleColor from "https://deno.land/x/colorlog@v1.0/mod.ts";

export { default as SQLQueryBuilder } from "https://raw.githubusercontent.com/denjucks/dex/master/mod.ts";

export { camelCase, snakeCase } from "https://deno.land/x/case/mod.ts";

// Connectors' Dependencies:
// -------------------------

// MySQL
export {
  Client as MySQLClient,
  Connection as MySQLConnection,
} from "https://deno.land/x/mysql/mod.ts";

// PostgreSQL
export { Client as PostgresClient } from "https://raw.githubusercontent.com/deno-postgres/deno-postgres/master/mod.ts";

// SQLite3
export { DB as SQLiteClient } from "https://deno.land/x/sqlite@v2.3.1/mod.ts";
