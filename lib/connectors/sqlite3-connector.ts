import { SQLiteClient } from "../../deps.ts";
import type { Connector, ConnectorOptions } from "./connector.ts";
import type { QueryDescription } from "../query-builder.ts";
import type { FieldValue } from "../data-types.ts";
import { SQLTranslator } from "../translators/sql-translator.ts";
import type { SupportedSQLDatabaseDialect } from "../translators/sql-translator.ts";

export interface SQLite3Options extends ConnectorOptions {
  filepath: string;
}

export class SQLite3Connector implements Connector {
  _dialect: SupportedSQLDatabaseDialect = "sqlite3";

  _client: SQLiteClient;
  _options: SQLite3Options;
  _translator: SQLTranslator;
  _connected = false;

  /** Create a SQLite connection. */
  constructor(options: SQLite3Options) {
    this._options = options;
    this._client = new SQLiteClient(this._options.filepath);
    this._translator = new SQLTranslator(this._dialect);
  }

  _makeConnection() {
    if (this._connected) {
      return;
    }

    this._connected = true;
  }

  ping() {
    this._makeConnection();

    try {
      let connected = false;

      for (const [result] of this._client.query("SELECT 1 + 1")) {
        connected = result === 2;
      }

      return Promise.resolve(connected);
    } catch {
      return Promise.resolve(false);
    }
  }

  // deno-lint-ignore no-explicit-any
  query(queryDescription: QueryDescription): Promise<any | any[]> {
    this._makeConnection();

    const query = this._translator.translateToQuery(queryDescription);
    const subqueries = query.split(/;(?=(?:[^'"]|'[^']*'|"[^"]*")*$)/);

    // deno-lint-ignore require-await
    const results = subqueries.map(async (subquery, index) => {
      const preparedQuery = this._client.prepareQuery(subquery + ";");
      const response = preparedQuery.allEntries();
      preparedQuery.finalize();

      if (index < subqueries.length - 1) {
        return [];
      }

      if (response.length === 0) {
        if (queryDescription.type === "insert" && queryDescription.values) {
          return {
            affectedRows: this._client.changes,
            lastInsertId: this._client.lastInsertRowId,
          };
        }

        if (queryDescription.type === "select") {
          return [];
        }

        return { affectedRows: this._client.changes };
      }

      return response.map(row => {
        const result: Record<string, FieldValue> = {};
        for (const [columnName, value] of Object.entries(row)) {
          if (columnName === "count(*)") {
            result.count = row[columnName] as FieldValue;
          } else if (columnName.startsWith("max(")) {
            result.max = value as FieldValue;
          } else if (columnName.startsWith("min(")) {
            result.min = value as FieldValue;
          } else if (columnName.startsWith("sum(")) {
            result.sum = value as FieldValue;
          } else if (columnName.startsWith("avg(")) {
            result.avg = value as FieldValue;
          } else {
            result[columnName] = value as FieldValue;
          }
        }
        return result;
      });
    });

    return results[results.length - 1];
  }

  async transaction(queries: () => Promise<void>) {
    this._client.query("begin");

    try {
      await queries();
      this._client.query("commit");
    } catch (error) {
      this._client.query("rollback");
      throw error;
    }
  }

  close() {
    if (!this._connected) {
      return Promise.resolve();
    }

    this._client.close();
    this._connected = false;
    return Promise.resolve();
  }
}
