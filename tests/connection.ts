import { config } from "https://deno.land/x/dotenv/mod.ts";
import { Database, MySQLConnector, SQLite3Connector } from "../mod.ts";

const env = config();

const defaultMySQLOptions = {
  database: "test",
  host: "127.0.0.1",
  username: env.DB_USER,
  password: env.DB_PASS,
  port: Number(env.DB_PORT),
};

const defaultSQLiteOptions = {
  filepath: "test.sqlite",
};

const getMySQLConnection = (options = {}, debug = true): Database => {
  const connector = new MySQLConnector({
    ...defaultMySQLOptions,
    ...options,
  });
  const connection: Database = new Database({ connector, debug });

  return connection;
};

const getSQLiteConnection = (options = {}, debug = true): Database => {
  const connector = new SQLite3Connector({
    ...defaultSQLiteOptions,
    ...options,
  });
  const connection: Database = new Database({ connector, debug });

  return connection;
};

export { getMySQLConnection, getSQLiteConnection };
