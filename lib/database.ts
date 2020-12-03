import type { Connector, ConnectorOptions } from "./connectors/connector.ts";
import type {
  FieldMatchingTable,
  Model,
  ModelFields,
  ModelSchema,
} from "./model.ts";
import { QueryBuilder, QueryDescription } from "./query-builder.ts";
import { formatResultToModelInstance } from "./helpers/results.ts";
import { Translator } from "./translators/translator.ts";
import {
  MongoDBConnector,
  MySQLConnector,
  PostgresConnector,
  SQLite3Connector,
} from "./connectors";

export type BuiltInDatabaseDialect = "postgres" | "sqlite3" | "mysql" | "mongo";

type DatabaseOptions = {
  connector: Connector;
  debug?: boolean;
};

type DialectDatabaseOptions =
  | BuiltInDatabaseDialect
  | {
    dialect: BuiltInDatabaseDialect;
    debug?: boolean;
    disableDialectUsageDeprecationWarning?: boolean;
  };

export type DatabaseOptionsOrConnector =
  | Connector
  | DatabaseOptions;

export type SyncOptions = {
  /** If tables should be dropped if they exist. */
  drop?: boolean;
};

/** Database client which interacts with an external database instance. */
export class Database implements IDatabase {
  private _connector: Connector;
  private _translator: Translator;
  private _queryBuilder: QueryBuilder;
  private _models: ModelSchema[] = [];
  private _debug: boolean;

  /** Initialize database given a dialect and options.
   *
   * Current Usage:
   *     const db = new Database(new SQLite3Connector({
   *       filepath: "./db.sqlite"
   *     }));
   *
   *     const db = new Database({
   *       connector: new SQLite3Connector({ ... }),
   *       debug: true
   *     });
   *
   * Dialect usage:
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
    dialectOptionsOrDatabaseOptionsOrConnector:
      | DatabaseOptionsOrConnector
      | DialectDatabaseOptions,
    connectionOptions?: ConnectorOptions,
  ) {
    if (this._isInDialectForm(dialectOptionsOrDatabaseOptionsOrConnector)) {
      dialectOptionsOrDatabaseOptionsOrConnector = this
        ._convertDialectFormToConnectorForm(
          dialectOptionsOrDatabaseOptionsOrConnector,
          connectionOptions,
        );
    }

    this._connector =
      (dialectOptionsOrDatabaseOptionsOrConnector as DatabaseOptions)
        ?.connector ??
        dialectOptionsOrDatabaseOptionsOrConnector;

    if (!this._connector) {
      throw new Error(`A connector must be defined, got ${this._connector}.`);
    }

    this._debug =
      (dialectOptionsOrDatabaseOptionsOrConnector as DatabaseOptions)
        ?.debug ??
        false;

    this._translator = this._connector._translator;

    if (!this._translator) {
      throw new Error(
        `A connector must provide a translator, got ${this._translator}.`,
      );
    }

    this._queryBuilder = new QueryBuilder();
  }

  private static _isInDialectForm(
    dialectOptionsOrDatabaseOptions:
      | DatabaseOptionsOrConnector
      | DialectDatabaseOptions,
  ): boolean {
    return (
      // has dialect as a property
      typeof dialectOptionsOrDatabaseOptions === "object" &&
      dialectOptionsOrDatabaseOptions?.dialect
    ) ||
      // Only Dialect
      typeof dialectOptionsOrDatabaseOptions === "string";
  }

  private static _convertDialectFormToConnectorForm(
    dialectOptionsOrDatabaseOptions: DialectDatabaseOptions,
    connectionOptions: ConnectorOptions,
  ): DatabaseOptions {
    if (typeof dialectOptionsOrDatabaseOptions === "string") {
      dialectOptionsOrDatabaseOptions = {
        dialect: dialectOptionsOrDatabaseOptions,
        disableDialectUsageDeprecationWarning: false
      };
    }
    if (
      !dialectOptionsOrDatabaseOptions.disableDialectUsageDeprecationWarning
    ) {
      // TODO(rluvaton): Add the migration to connector URL in the warning message
      // I've added [denodb] at the start of each line in the warning so developer will know from which package this warning came from.
      console.warn(
        "[denodb]: DEPRECATION warning, the usage with dialect instead of connector is deprecated and will be removed in future versions.\n" +
        "[denodb]: If you want to disable this warning pass `disableDialectUsageDeprecationWarning: true` with the dialect in the Database constructor.\n" +
        "[denodb]: If you want to migrate to the current behavior, visit $URL_HERE$ for help",
      );
    }

    let connectorForDialect: Connector;

    switch (dialectOptionsOrDatabaseOptions.dialect) {
      case "mongo":
        connectorForDialect = new MongoDBConnector(connectionOptions);
        break;
      case "sqlite3":
        connectorForDialect = new SQLite3Connector(connectionOptions);
        break;
      case "mysql":
        connectorForDialect = new MySQLConnector(connectionOptions);
        break;
      case "postgres":
        connectorForDialect = new PostgresConnector(connectionOptions);
        break;
      default:
        throw new Error(
          `No connector was found for the given dialect: ${dialectOptionsOrDatabaseOptions.dialect}.`,
        );
    }

    return {
      connector: connectorForDialect,
      debug: dialectOptionsOrDatabaseOptions.debug,
    };
  }

  /** Test database connection. */
  ping() {
    return this._connector.ping();
  }

  /** Get the database dialect. */
  getDialect() {
    return this._connector?._dialect;
  }

  /* Get the database connector. */
  getConnector() {
    return this._connector;
  }

  /** Create the given models in the current database.
   *
   *     await db.sync({ drop: true });
   */
  async sync(options: SyncOptions = {}) {
    if (options.drop) {
      for (const model of this._models) {
        await model.drop();
      }
    }

    for (const model of this._models) {
      await model.createTable();
    }
  }

  /** Associate all the required information for a model to connect to a database.
   *
   *     await db.link([Flight, Airport]);
   */
  link(models: ModelSchema[]) {
    this._models = models;

    this._models.forEach((model) =>
      model._link({
        queryBuilder: this._queryBuilder,
        database: this,
      })
    );

    return this;
  }

  /** Pass on any query to the database.
   *
   *     await db.query("SELECT * FROM `flights`");
   */
  async query(query: QueryDescription): Promise<Model | Model[]> {
    if (this._debug) {
      console.log(query);
    }

    const results = await this._connector.query(query);

    return Array.isArray(results)
      ? results.map((result) =>
        formatResultToModelInstance(query.schema, result)
      )
      : formatResultToModelInstance(query.schema, results);
  }

  /** Compute field matchings tables for model usage. */
  _computeModelFieldMatchings(
    table: string,
    fields: ModelFields,
    withTimestamps: boolean,
  ): {
    toClient: FieldMatchingTable;
    toDatabase: FieldMatchingTable;
  } {
    const modelFields = { ...fields };
    if (withTimestamps) {
      modelFields.updatedAt = "";
      modelFields.createdAt = "";
    }

    const toDatabase: FieldMatchingTable = Object.entries(modelFields).reduce(
      (prev: any, [clientFieldName, fieldType]) => {
        const databaseFieldName = typeof fieldType !== "string" && fieldType.as
          ? fieldType.as
          : (this._translator.formatFieldNameToDatabase(
            clientFieldName,
          ) as string);

        prev[clientFieldName] = databaseFieldName;
        prev[`${table}.${clientFieldName}`] = `${table}.${databaseFieldName}`;
        return prev;
      },
      {},
    );

    const toClient: FieldMatchingTable = Object.entries(toDatabase).reduce(
      (prev, [clientFieldName, databaseFieldName]) => ({
        ...prev,
        [databaseFieldName]: clientFieldName,
      }),
      {},
    );

    return { toDatabase, toClient };
  }

  /** Close the current database connection. */
  async close() {
    return this._connector.close();
  }
}
