import { SQLQueryBuilder } from "../deps.ts";
import { DatabaseDialect } from "./database.ts";
import { FieldTypes } from "./data-types.ts";

export type FieldValue = number | string | boolean | Date;
export type FieldTypeString =
  | "integer"
  | "string"
  | "boolean"
  | "text"
  | "date"
  | "float";
export type Fields = {
  [key in FieldTypes]: FieldTypeString;
};
export type Values = { [key: string]: FieldValue };
export type FieldType = FieldTypeString | {
  type?: FieldTypeString;
  primaryKey?: boolean;
  autoIncrement?: boolean;
  length?: number;
  allowNull?: boolean;
};
export type FieldAlias = { [k: string]: string };

export type Query = string;
export type Operator = ">" | ">=" | "<" | "<=" | "=";
export type OrderDirection = "desc" | "asc";

export type Builder = typeof SQLQueryBuilder;

/** Create adapted queries for different database dialects. */
export class QueryBuilder {
  _builder: Builder;
  _dialect: DatabaseDialect;

  /** Create a query builder for a given database dialect. */
  constructor(dialect: DatabaseDialect) {
    this._dialect = dialect;
    this._builder = new (SQLQueryBuilder as any)(
      { client: dialect, useNullAsDefault: dialect === "sqlite3" },
    );
    return this;
  }

  /** Create a fresh new query (using Knex under the hood).
   * 
   *     queryBuilder.query().table("flights").select().toString();
   *     // SELECT * FROM `flights`
   */
  query(): any {
    return new QueryBuilder(this._dialect)._builder;
  }
}
