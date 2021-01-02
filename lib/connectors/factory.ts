import { MongoDBConnector, MongoDBOptions } from "./mongodb-connector.ts";
import { SQLite3Connector, SQLite3Options } from "./sqlite3-connector.ts";
import { MySQLConnector, MySQLOptions } from "./mysql-connector.ts";
import { PostgresConnector, PostgresOptions } from "./postgres-connector.ts";
import type { BuiltInDatabaseDialect } from "../database.ts";
import { Connector, ConnectorOptions } from "./connector.ts";

export function connectorFactory(
  dialect: BuiltInDatabaseDialect,
  connectionOptions: ConnectorOptions,
): Connector {
  switch (dialect) {
    case "mongo":
      return new MongoDBConnector(connectionOptions as MongoDBOptions);
    case "sqlite3":
      return new SQLite3Connector(connectionOptions as SQLite3Options);
    case "mysql":
      return new MySQLConnector(connectionOptions as MySQLOptions);
    case "postgres":
      return new PostgresConnector(connectionOptions as PostgresOptions);
    default:
      throw new Error(
        `No connector was found for the given dialect: ${dialect}.`,
      );
  }
}
