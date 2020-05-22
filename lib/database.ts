import { Connector } from "./connectors/connector.ts";
import { ModelSchema } from "./model.ts";
import { ModelInitializer } from "./model-initializer.ts";
import { QueryBuilder, QueryDescription } from "./query-builder.ts";
import {
  PostgresConnector,
  PostgresOptions,
} from "./connectors/postgres-connector.ts";
import {
  SQLite3Connector,
  SQLite3Options,
} from "./connectors/sqlite3-connector.ts";
import { MySQLOptions, MySQLConnector } from "./connectors/mysql-connector.ts";

type DatabaseOptions = DatabaseDialect | {
  dialect: DatabaseDialect;
  debug?: boolean;
};

export type SyncOptions = {
  /** If tables be dropped if they exist. */
  drop?: boolean;
};

export type DatabaseDialect = "postgres" | "sqlite3" | "mysql";

/** Database client which interacts with an external database instance. */
export class Database {
  private _dialect: DatabaseDialect;
  private _connector: Connector;
  private _queryBuilder: QueryBuilder;
  private _modelInitializer: ModelInitializer;
  private _models: ModelSchema[] = [];
  private _debug: boolean;

  /** Initialize database given a dialect and options.
   * 
   *     const db = new Database("sqlite3", {
   *       filepath: "./db.sqlite"
   *     });
   *     
   *     const db = new Database({
   *       dialect: "sqlite3",
   *       debug: true
   *     }, { ... });
   */
  constructor(
    databaseOptionsOrDialect: DatabaseOptions,
    connectionOptions: PostgresOptions | SQLite3Options | MySQLOptions,
  ) {
    this._dialect = typeof databaseOptionsOrDialect === "object"
      ? databaseOptionsOrDialect.dialect
      : databaseOptionsOrDialect;

    this._debug = typeof databaseOptionsOrDialect === "object"
      ? databaseOptionsOrDialect.debug ?? false
      : false;

    this._queryBuilder = new QueryBuilder();
    this._modelInitializer = new ModelInitializer();

    switch (this._dialect) {
      case "postgres":
        this._connector = new PostgresConnector(
          connectionOptions as PostgresOptions,
        );
        break;

      case "sqlite3":
        this._connector = new SQLite3Connector(
          connectionOptions as SQLite3Options,
        );
        break;

      case "mysql":
        this._connector = new MySQLConnector(
          connectionOptions as MySQLOptions,
        );
        break;

      default:
        throw new Error(
          `No connector was found for the given dialect: ${this._dialect}.`,
        );
    }
  }

  /** Create the given models in the current database.
   * 
   *     await db.sync({ drop: true });
   */
  async sync(options: SyncOptions = {}) {
    return Promise.all(
      this._models.map((model) => model._createInDatabase(options)),
    );
  }

  /** Associate all the required information for a model to connect to a database.
   *
   *     await db.link([Flight, Airport]);
   */
  link(models: ModelSchema[]) {
    this._models = models;

    this._models.forEach((model) =>
      model._link(
        {
          queryBuilder: this._queryBuilder,
          modelInitializer: this._modelInitializer,
          database: this,
        },
      )
    );

    return this;
  }

  /** Pass on any query to the database.
   * 
   *     await db.query("SELECT * FROM `flights`");
   */
  async query(query: QueryDescription) {
    if (this._debug) {
      console.log(query);
    }

    return this._connector.query(query);
  }

  /** Close the current database connection. */
  async close() {
    return this._connector.close();
  }
}
