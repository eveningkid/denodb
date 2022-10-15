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

interface PostgresPoolOptions extends ConnectorPoolOptions, PostgresOptionsWithConfig, PostgresOptionsWithURI {
  size: number;
  lazy: boolean;
}

export type PostgresOptions = PostgresPoolOptions;

export class PostgresConnector implements Connector {
  _dialect: SupportedSQLDatabaseDialect = "postgres";
  _pool?: PostgresPool;
  _client?: PostgresClient;
  _options: PostgresOptions;
  _translator: SQLTranslator;
  _connected = false;

  constructor(options: PostgresOptions) {
    this._options = options;
    if (this._isPoolConnector()) {
      this._pool = new PostgresPool("uri" in options ? options.uri : {
        hostname: options.host,
        user: options.username,
        ...options,
      },
        options.size,
        options.lazy
      );
    } else
      if ("uri" in options) {
        this._client = new PostgresClient(options.uri);
      } else {
        this._client = new PostgresClient({
          hostname: options.host,
          user: options.username,
          password: options.password,
          database: options.database,
          port: options.port ?? 5432,
        });
      }
    this._translator = new SQLTranslator(this._dialect);
  }

  _isPoolConnector() {
    return "size" in this._options;
  }

  _getClientOrPool() {
    return this._isPoolConnector() ? this.getPool()! : this.getClient()!;
  }

  async _makeConnection() {
    if (!this._isPoolConnector()) {
      if (this._connected) {
        return this._client!;
      }
      await this._client!.connect();
      return this._client!;
    } else if (this._pool?.available || !this._pool?.available) {
      return await this.getPool()?.connect()
    } else {
      throw new Error("no connections available")
    }
  }

  getClient() {
    return this._client;
  }

  getPool() {
    return this._pool;
  }

  async ping() {
    try {
      const connection = await this._makeConnection();
      console.log(connection)
      const [result] =
        (await connection!.queryArray("SELECT 1 + 1 as result")
        ).rows[0];

      console.log(result)
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
      await this._getClientOrPool().end();
    }
    this._connected = false;
  }

}
