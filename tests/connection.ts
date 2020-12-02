import { Database } from "../mod.ts";
import { config } from "https://deno.land/x/dotenv/mod.ts";

const ConnectionMySQL = (): Database => {
  const env = config();

  const connection: Database = new Database(
    { dialect: "mysql", debug: true },
    {
      database: "test",
      host: "127.0.0.1",
      username: env.DB_USER,
      password: env.DB_PASS,
      port: Number(env.DB_PORT),
    },
  );

  return connection;
};

export { ConnectionMySQL };
