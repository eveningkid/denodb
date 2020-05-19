import { openSQLiteFile, saveSQLiteFile, SQLiteClient } from "../../deps.ts";
import { Connector, ConnectorOptions } from "./connector.ts";
import { FieldValue } from "../query-builder.ts";

export interface SQLite3Options extends ConnectorOptions {
  filepath: string;
}

export class SQLite3Connector implements Connector {
  _client!: SQLiteClient;
  _options: SQLite3Options;
  _connected = false;

  /** Create a SQLite connection. */
  constructor(options: SQLite3Options) {
    this._options = options;
  }

  async _makeConnection() {
    if (this._connected) {
      return;
    }

    this._client = await openSQLiteFile(this._options.filepath);
    this._connected = true;
  }

  async query(query: string): Promise<any[]> {
    await this._makeConnection();
    const response = this._client!.query(query, []);

    if (query.toLowerCase().startsWith("select")) {
      const results = [];
      const columns = response.columns();

      for (const row of response) {
        const result: { [k: string]: FieldValue } = {};

        let i = 0;
        for (const column of row!) {
          const columnName = columns[i].name;
          if (columnName === ("count(*)")) {
            result.count = column;
          } else if (columnName.startsWith("max(")) {
            result.max = column;
          } else if (columnName.startsWith("min(")) {
            result.min = column;
          } else if (columnName.startsWith("sum(")) {
            result.sum = column;
          } else if (columnName.startsWith("avg(")) {
            result.avg = column;
          } else {
            result[columns[i].name] = column;
          }

          i++;
        }

        results.push(result);
      }

      return results;
    }

    return [];
  }

  async close() {
    if (!this._connected) {
      return;
    }

    await saveSQLiteFile(this._client!);
    this._client!.close();
    this._connected = false;
  }
}
