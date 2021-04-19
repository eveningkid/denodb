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
import { connectorFactory } from "./connectors/factory.ts";
import { warning } from "./helpers/log.ts";

export type BuiltInDatabaseDialect = "postgres" | "sqlite3" | "mysql" | "mongo";

type ConnectorDatabaseOptions = {
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
  | ConnectorDatabaseOptions;

export type DatabaseOptions =
  | DatabaseOptionsOrConnector
  | DialectDatabaseOptions;

export type SyncOptions = {
  /** If tables should be dropped if they exist. */
  drop?: boolean;
  /** If tables should be truncated. Will raise errors if the linked tables don't exist. */
  truncate?: boolean;
};

/** Database client which interacts with an external database instance. */
export class Database {
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
    dialectOptionsOrDatabaseOptionsOrConnector: DatabaseOptions,
    connectionOptions?: ConnectorOptions,
  ) {
    if (Database._isInDialectForm(dialectOptionsOrDatabaseOptionsOrConnector)) {
      dialectOptionsOrDatabaseOptionsOrConnector = Database
        ._convertDialectFormToConnectorForm(
          dialectOptionsOrDatabaseOptionsOrConnector as DialectDatabaseOptions,
          connectionOptions as ConnectorOptions,
        );
    }

    this._connector =
      (dialectOptionsOrDatabaseOptionsOrConnector as ConnectorDatabaseOptions)
        ?.connector ??
        dialectOptionsOrDatabaseOptionsOrConnector;

    if (!this._connector) {
      throw new Error(`A connector must be defined, got ${this._connector}.`);
    }

    this._debug =
      (dialectOptionsOrDatabaseOptionsOrConnector as ConnectorDatabaseOptions)
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
    dialectOptionsOrDatabaseOptions: DatabaseOptions,
  ): boolean {
    return (
      // Has dialect as a property
      typeof dialectOptionsOrDatabaseOptions === "object" &&
      !!(dialectOptionsOrDatabaseOptions as Exclude<
        DialectDatabaseOptions,
        BuiltInDatabaseDialect
      >)?.dialect
    ) ||
      // Only dialect
      typeof dialectOptionsOrDatabaseOptions === "string";
  }

  private static _convertDialectFormToConnectorForm(
    dialectOptionsOrDatabaseOptions: DialectDatabaseOptions,
    connectionOptions: ConnectorOptions,
    fromConstructor = true,
  ): ConnectorDatabaseOptions {
    if (typeof dialectOptionsOrDatabaseOptions === "string") {
      dialectOptionsOrDatabaseOptions = {
        dialect: dialectOptionsOrDatabaseOptions,
      };
    }
    if (
      fromConstructor &&
      !dialectOptionsOrDatabaseOptions.disableDialectUsageDeprecationWarning
    ) {
      warning(
        "[denodb]: DEPRECATION warning, the usage with dialect instead of connector is deprecated and will be removed in future versions.\n" +
          "[denodb]: If you want to disable this warning pass `disableDialectUsageDeprecationWarning: true` with the dialect in the Database constructor.\n" +
          "[denodb]: If you want to migrate to the current behavior, visit https://github.com/eveningkid/denodb/blob/master/docs/v1.0.21-migrations/connectors.md for help",
      );
    }

    return {
      connector: connectorFactory(
        dialectOptionsOrDatabaseOptions.dialect,
        connectionOptions,
      ),
      debug: dialectOptionsOrDatabaseOptions.debug,
    };
  }

  static forDialect(
    dialectOptionsOrDatabaseOptions: Omit<
      DialectDatabaseOptions,
      "disableDialectUsageDeprecationWarning"
    >,
    connectionOptions: ConnectorOptions,
  ): Database {
    return new Database(
      Database._convertDialectFormToConnectorForm(
        dialectOptionsOrDatabaseOptions as DialectDatabaseOptions,
        connectionOptions,
        false,
      ),
    );
  }

  /** Test database connection. */
  ping() {
    return this.getConnector().ping();
  }

  /** Get the database dialect. */
  getDialect() {
    return this.getConnector()._dialect;
  }

  /* Get the database connector. */
  getConnector() {
    return this._connector;
  }

  /* Get the database client. */
  getClient() {
    return this.getConnector()._client;
  }

  /** Create the given models in the current database.
   *
   *     await db.sync({ drop: true });
   */
  async sync(options: SyncOptions = {}) {
    if (options.drop) {
      for (let i = this._models.length - 1; i >= 0; i--) {
        await this._models[i].drop();
      }
    }

    if (options.truncate) {
      for (let i = this._models.length - 1; i >= 0; i--) {
        await this._models[i].truncate();
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

    const results = await this.getConnector().query(query);

    return Array.isArray(results)
      ? results.map((result) =>
        formatResultToModelInstance(query.schema, result)
      )
      : formatResultToModelInstance(query.schema, results);
  }

  /** Execute queries within a transaction. */
  transaction(queries: () => Promise<void>) {
    if (!this.getConnector().transaction) {
      warning(
        "Transactions are not supported by this connector at the moment.",
      );

      return Promise.resolve();
    }

    return this.getConnector().transaction?.(queries);
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
  close() {
    return this.getConnector().close();
  }
}
