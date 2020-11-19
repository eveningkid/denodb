import type { Connector } from "./connectors/connector.ts";
import type { ModelSchema, FieldMatchingTable, ModelFields } from "./model.ts";
import { QueryBuilder, QueryDescription } from "./query-builder.ts";
import { formatResultToModelInstance } from "./helpers/results.ts";
import { Translator } from "./translators/translator.ts";

export type DatabaseOptions =
  Connector
  | {
    connector: Connector;
    debug?: boolean;
  };

export type SyncOptions = {
  /** If tables should be dropped if they exist. */
  drop?: boolean;
};

export type BuiltInDatabaseDialect = "postgres" | "sqlite3" | "mysql" | "mongo";

/** Database client which interacts with an external database instance. */
export class Database {
  private _connector: Connector;
  private _translator: Translator;
  private _queryBuilder: QueryBuilder;
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
    databaseOptionsOrConnector: DatabaseOptions,
  ) {
    this._connector =
      typeof databaseOptionsOrConnector === "object"
        ? databaseOptionsOrConnector.connector
        : databaseOptionsOrConnector;

    this._debug =
      typeof databaseOptionsOrConnector === "object"
        ? databaseOptionsOrConnector.debug ?? false
        : false;

    this._translator = this._connector._translator;
    this._queryBuilder = new QueryBuilder();

    if (!this._connector) {
      throw new Error('connector must be defined')
    }

    if (!this._translator) {
      throw new Error('invalid connector must have _translator property with value')
    }
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
  async query(query: QueryDescription): Promise<any> {
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
        const databaseFieldName =
          typeof fieldType !== "string" && fieldType.as
            ? fieldType.as
            : (this._translator.formatFieldNameToDatabase(clientFieldName) as string);

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
