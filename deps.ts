import Dex from "https://deno.land/x/dex/mod.ts";
export const SQLQueryBuilder = Dex;

export { Client as PostgresClient } from "https://deno.land/x/postgres/mod.ts";
export { Client as MySQLClient } from "https://deno.land/x/mysql/mod.ts";
export {
  open as openSQLiteFile,
  save as saveSQLiteFile,
  DB as SQLiteClient,
} from "https://deno.land/x/sqlite/mod.ts";
