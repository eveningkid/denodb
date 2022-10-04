import { PostgresClient, PostgresPool } from "../../deps.ts";
import type { Connector, ConnectorOptions, ConnectorPoolOptions } from "./connector.ts";
import { SQLTranslator } from "../translators/sql-translator.ts";
import type { SupportedSQLDatabaseDialect } from "../translators/sql-translator.ts";
import type { QueryDescription } from "../query-builder.ts";
import type { Values } from "../data-types.ts";

interface PostgresOptionsWithConfig extends ConnectorOptions {
  database: string;
  host: string;
  username: string;
  password: string;
  port?: number;
}

interface PostgresOptionsWithURI extends ConnectorOptions {
  uri: string;
}

interface PostgresPoolOptions extends ConnectorPoolOptions {
  connection_params: PostgresOptionsWithConfig | PostgresOptionsWithURI,
  size: number,
  lazy: boolean,
}

export type PostgresOptions =
  PostgresPoolOptions
  | PostgresOptionsWithConfig
  | PostgresOptionsWithURI;



export class PostgresConnector implements Connector {
  _dialect: SupportedSQLDatabaseDialect = "postgres";
  _pool: PostgresPool | undefined;
  _client: PostgresClient | undefined;
  _options: PostgresOptions;
  _translator: SQLTranslator;
  _connected: boolean | undefined;

  /** Create a PostgreSQL connection
   *  @example 
   * //Direct connection usage:
   * const connection = new PostgresConnector({
   *    host: '...',
   *    username: 'user',
   *    password: 'password',
   *    database: 'airlines',
   * });
   * //Pool connection usage:
   * const connection = new PostgresConnector({
   *    connection_params: {
   *      host: '...',
   *      username: 'user',
   *      password: 'password',
   *      database: 'airlines',
   *    },
   *    size: 5,
   *    lazy: false
   * });
   */
  constructor(options: PostgresOptions) {
    this._options = options;
    if ("uri" in options) {
      this._client = new PostgresClient(options.uri);
    } else if ("database" in options) {
      this._client = new PostgresClient({
        hostname: options.host,
        user: options.username,
        password: options.password,
        database: options.database,
        port: options.port ?? 5432,
      });
    }
    else {
      this._pool = new PostgresPool("uri" in options.connection_params ? options.connection_params.uri : {
        ...options.connection_params
      },
        options.size,
        options.lazy
      );
    }
    this._translator = new SQLTranslator(this._dialect);
  }

  async _makeConnection() {
    if (this._client) {
      if (this._connected) {
        return;
      }

      await this._client.connect();
      this._connected = true;
      return this._client;
    } else {
      return await this._pool!.connect();
    }

  }

  async ping() {
    return await this.tryConnection(await this._makeConnection());
  }

  async tryConnection(client?: PostgresClient) {
    try {
      const [result] = (
        await client!.queryObject("SELECT 1 + 1 as result")
      ).rows;
      return result === 2;
    } catch {
      return false;
    }
  }

  // deno-lint-ignore no-explicit-any
  async query(queryDescription: QueryDescription): Promise<any | any[]> {
    const client = await this._makeConnection()
    const query = this._translator.translateToQuery(queryDescription);
    const response = await client!.queryObject(query);
    const results = response.rows as Values[];

    if (queryDescription.type === "insert") {
      return results.length === 1 ? results[0] : results;
    }
    return results;
  }

  async transaction(queries: () => Promise<void>) {
    const client = await this._makeConnection()
    const transaction = client!.createTransaction("transaction");
    await transaction.begin();
    await queries();
    return transaction.commit();
  }

  async close() {
    if (this._client) {
      if (!this._connected) {
        return;
      }
      await this._client.end();
      this._connected = false;
    } else {
      await this._pool?.end()!
    }
  }
}
