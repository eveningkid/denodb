import { Connector, ConnectorOptions } from "./connector.ts";

import { PostgresClient } from "../../deps.ts";
import { QueryDescription } from "../query-builder.ts";
import { SQLTranslator } from "../translators/sql-translator.ts";

export interface PostgresOptions extends ConnectorOptions {
  database: string;
  host: string;
  username: string;
  password: string;
  port?: number;
  returnOnInsert?: boolean;
}

export class PostgresConnector implements Connector {
  _client: PostgresClient;
  _options: PostgresOptions;
  _translator: SQLTranslator;
  _returnOnInsert: boolean;
  _connected = false;

  /** Create a PostgreSQL connection. */
  constructor(options: PostgresOptions) {
    this._options = options;
    this._client = new PostgresClient({
      hostname: options.host,
      user: options.username,
      password: options.password,
      database: options.database,
      port: options.port ?? 5432,
    });
    this._translator = new SQLTranslator("postgres");
    this._returnOnInsert = options.returnOnInsert ?? false;
  }

  async _makeConnection() {
    if (this._connected) {
      return;
    }

    await this._client.connect();
    this._connected = true;
  }

  async query(queryDescription: QueryDescription): Promise<any[]> {
    await this._makeConnection();
    let query = this._translator.translateToQuery(queryDescription);

    if (queryDescription.type === "insert" && this._returnOnInsert) {
      query = `${query} returning *`;
    }

    const results = await this._client.query(query);
    return results.rowsOfObjects();
  }

  async close() {
    if (!this._connected) {
      return;
    }

    await this._client.end();
    this._connected = false;
  }
}
