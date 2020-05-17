import { PostgresClient } from "../../deps.ts";
import { Connector, ConnectorOptions } from "../connector.ts";

export interface PostgresOptions extends ConnectorOptions {
  database: string;
  host: string;
  username: string;
  password: string;
  port?: number;
}

export class PostgresConnector implements Connector {
  _client: PostgresClient;
  _options: PostgresOptions;
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
  }

  async _makeConnection() {
    if (this._connected) {
      return;
    }

    await this._client.connect();
    this._connected = true;
  }

  async query(query: string): Promise<any[]> {
    await this._makeConnection();
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
