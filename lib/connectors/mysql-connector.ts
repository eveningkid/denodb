import { MySQLClient } from "../../deps.ts";
import { Connector, ConnectorOptions } from "./connector.ts";

export interface MySQLOptions extends ConnectorOptions {
  database: string;
  host: string;
  username: string;
  password: string;
  port?: number;
}

export class MySQLConnector implements Connector {
  _client: MySQLClient;
  _options: MySQLOptions;
  _connected = false;

  /** Create a MySQL connection. */
  constructor(options: MySQLOptions) {
    this._options = options;
    this._client = new MySQLClient();
  }

  async _makeConnection() {
    if (this._connected) {
      return;
    }

    await this._client.connect({
      hostname: this._options.host,
      username: this._options.username,
      db: this._options.database,
      password: this._options.password,
      port: this._options.port ?? 3306,
    });

    this._connected = true;
  }

  async query(query: string, client?: any): Promise<any[]> {
    await this._makeConnection();

    const queryClient = client ?? this._client;

    if (query.toLowerCase().startsWith("select")) {
      return queryClient.query(query);
    }

    return queryClient.execute(query) as any;
  }

  async transaction(queries: string[]): Promise<any[]> {
    if (queries.length === 0) {
      return [];
    }

    const results = await this._client.transaction(async (transaction) => {
      const lastQuery: string = queries.pop()!;

      for (const query of queries) {
        await this.query(query, transaction);
      }

      return this.query(lastQuery, transaction);
    });

    return results as any;
  }

  async close() {
    if (!this._connected) {
      return;
    }

    await this._client.close();
    this._connected = false;
  }
}
