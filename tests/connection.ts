import { config } from "https://deno.land/x/dotenv/mod.ts";
import { Database, SQLite3Connector } from "../mod.ts";

const env = config();

const defaultMySQLOptions = {
  database: "test",
  host: "127.0.0.1",
  username: env.DB_USER,
  password: env.DB_PASS,
  port: Number(env.DB_PORT),
};

const defaultSQLitePath = {
  filepath: "test.sqlite"
};

const getMySQLConnection = (options = {}, debug = true): Database => {
  const connection: Database = new Database(
    { dialect: "mysql", debug },
    {
      ...defaultMySQLOptions,
      ...options,
    },
  );

  return connection;
};

const getSQLiteConnection = (options = {}, debug = true): Database => {
  const connection = new SQLite3Connector(defaultSQLitePath);

  const database = new Database(connection);

  return database;
};

export { getMySQLConnection, getSQLiteConnection };
