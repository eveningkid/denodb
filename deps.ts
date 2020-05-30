import Dex from "https://deno.land/x/dex/mod.ts";
export const SQLQueryBuilder = Dex;

export { Client as PostgresClient } from "https://deno.land/x/postgres/mod.ts";

export {
  Client as MySQLClient,
  Connection as MySQLConnection,
} from "https://deno.land/x/mysql/mod.ts";

export { DB as SQLiteClient } from "https://deno.land/x/sqlite@v2.0.0/mod.ts";
