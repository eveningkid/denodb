import { configMySQLLogger, MySQLClient, MySQLConnection, MySQLReponseTimeoutError } from "../../deps.ts";
import type { LoggerConfig } from "../../deps.ts";
import type { Connector, ConnectorOptions } from "./connector.ts";
import { SQLTranslator } from "../translators/sql-translator.ts";
import type { SupportedSQLDatabaseDialect } from "../translators/sql-translator.ts";
import type { QueryDescription } from "../query-builder.ts";
import { warning } from "../helpers/log.ts";

export interface MySQLOptions extends ConnectorOptions {
  database: string;
  host: string;
  username: string;
  password: string;
  port?: number;
  charset?: string;
  logger?: LoggerConfig;
  idleTimeout?: number;
  reconnectOnTimeout?: boolean
}

export class MySQLConnector implements Connector {
  _dialect: SupportedSQLDatabaseDialect = "mysql";

  _client: MySQLClient;
  _options: MySQLOptions;
  _translator: SQLTranslator;
  _connected = false;

  /** Create a MySQL connection. */
  constructor(options: MySQLOptions) {
    this._options = options;
    this._client = new MySQLClient();
    this._translator = new SQLTranslator(this._dialect);
  }

  async _makeConnection() {
    if (this._connected) {
      return;
    }

    if (this._options.logger !== undefined) {
      await configMySQLLogger(this._options.logger);
    }

    await this._client.connect({
      hostname: this._options.host,
      username: this._options.username,
      db: this._options.database,
      password: this._options.password,
      port: this._options.port ?? 3306,
      charset: this._options.charset ?? "utf8",
      idleTimeout: this._options.idleTimeout
    });

    this._connected = true;
  }

  async ping() {
    await this._makeConnection();

    try {
      const [{ result }] = await this._client.query("SELECT 1 + 1 as result");
      return result === 2;
    } catch {
      return false;
    }
  }

  /**
   * Executing query
   * @param queryDescription {QueryDescription}
   * @param client {MySQLClient | MySQLConnection}
   * @param reconnectAttempt {boolean} - Used for reconnect client when ResponseTimeoutError happened
   */
  async query(
    queryDescription: QueryDescription,
    client?: MySQLClient | MySQLConnection
  ): Promise<any | any[]> {
    await this._makeConnection();

    const queryClient = client ?? this._client;
    const query = this._translator.translateToQuery(queryDescription);
    const subqueries = query.split(/;(?=(?:[^'"]|'[^']*'|"[^"]*")*$)/);
    const queryMethod = query.toLowerCase().startsWith("select")
      ? "query"
      : "execute";

    for (let i = 0; i < subqueries.length; i++) {
      let result = null;

      try {
        result = await queryClient[queryMethod](subqueries[i]);
      }
      catch (error) {
        
        //reconnect client on timeout error
        if (this._options.reconnectOnTimeout && error instanceof MySQLReponseTimeoutError) {
          //reconnect client, at this moment we can't subscribe to connectionState of mysql driver, we need to do this
          await this.reconnect();

          return this.query(queryDescription, client);
        }
        
        throw error;
      }

      if (i === subqueries.length - 1) {
        return result;
      }
    }
  }

  transaction(queries: () => Promise<void>) {
    return this._client.transaction(queries);
  }

  
  /**
   * Reconnect client connection
   */
  async reconnect() {
    warning("Client reconnection has been triggered.");

    await this.close();
    return this._makeConnection();
  }

  async close() {
    if (!this._connected) {
      return;
    }

    await this._client.close();
    this._connected = false;
  }
}
