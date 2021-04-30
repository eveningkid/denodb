import { PostgresClient } from "../../deps.ts";
import type { Connector, ConnectorOptions } from "./connector.ts";
import { SQLTranslator } from "../translators/sql-translator.ts";
import type { SupportedSQLDatabaseDialect } from "../translators/sql-translator.ts";
import type { QueryDescription } from "../query-builder.ts";
import type { Values } from "../data-types.ts";

interface PostgresOptionsBase extends ConnectorOptions {
  database: string;
  host: string;
  username: string;
  password: string;
  port?: number;
  // unused types
  uri?: never;
}

interface PostgresOptionsWithURI extends ConnectorOptions {
  uri: string;
  // unused types
  database?: never;
  host?: never;
  username?: never;
  password?: never;
  port?: never;
}

export type PostgresOptions = PostgresOptionsWithURI | PostgresOptionsBase;

export class PostgresConnector implements Connector {
  _dialect: SupportedSQLDatabaseDialect = "postgres";

  _client: PostgresClient;
  _options: PostgresOptions;
  _translator: SQLTranslator;
  _connected = false;

  /** Create a PostgreSQL connection. */
  constructor(options: PostgresOptions) {
    this._options = options;
    if (options.hasOwnProperty("uri")) {
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

  async _makeConnection() {
    if (this._connected) {
      return;
    }

    await this._client.connect();
    this._connected = true;
  }

  async ping() {
    await this._makeConnection();

    try {
      const [{ result }] = (
        await this._client.queryObject("SELECT 1 + 1 as result")
      ).rows;
      return result === 2;
    } catch {
      return false;
    }
  }

  async query(queryDescription: QueryDescription): Promise<any | any[]> {
    await this._makeConnection();

    const query = this._translator.translateToQuery(queryDescription);
    const response = await this._client.queryObject(query);
    const results = response.rows as Values[];

    if (queryDescription.type === "insert") {
      return results.length === 1 ? results[0] : results;
    }

    return results;
  }

  async transaction(queries: () => Promise<void>) {
    const transaction = this._client.createTransaction("transaction");
    await transaction.begin();
    await queries();
    return transaction.commit();
  }

  async close() {
    if (!this._connected) {
      return;
    }

    await this._client.end();
    this._connected = false;
  }
}
