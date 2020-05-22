import { SQLQueryBuilder } from "../deps.ts";
import { FieldTypes } from "./data-types.ts";
import { ModelFields, ModelDefaults } from "./model.ts";

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
export type QueryType =
  | "create"
  | "drop"
  | "select"
  | "insert"
  | "update"
  | "delete"
  | "count"
  | "min"
  | "max"
  | "avg"
  | "sum";

export type JoinClause = {
  joinTable: string;
  originField: string;
  targetField: string;
};

export type WhereClause = {
  field: string;
  operator: Operator;
  value: FieldValue;
};

export type WhereInClause = {
  field: string;
  possibleValues: FieldValue[];
};

export type OrderByClause = {
  field: string;
  orderDirection: OrderDirection;
};

export type QueryDescription = {
  type?: QueryType;
  table?: string;
  orderBy?: OrderByClause;
  select?: (string | FieldAlias)[];
  wheres?: WhereClause[];
  whereIn?: WhereInClause;
  joins?: JoinClause[];
  aggregatorField?: string;
  limit?: number;
  ifExists?: boolean;
  fields?: ModelFields;
  fieldsDefaults?: ModelDefaults;
  timestamps?: boolean;
  values?: Values | Values[];
};

export type QueryResult = {};

export type Builder = typeof SQLQueryBuilder;

/** Create queries descriptions. */
export class QueryBuilder {
  _query: QueryDescription = {};

  /** Create a fresh new query. */
  query(): QueryBuilder {
    return new QueryBuilder();
  }

  toDescription(): QueryDescription {
    return this._query;
  }

  table(table: string) {
    this._query.table = table;
    return this;
  }

  get() {
    this._query.type = "select";
    return this;
  }

  all() {
    return this.get();
  }

  createTable(
    fields: ModelFields,
    fieldsDefaults: ModelDefaults,
    withTimestamps: boolean,
  ) {
    this._query.type = "create";
    this._query.fields = fields;
    this._query.fieldsDefaults = fieldsDefaults;
    this._query.timestamps = withTimestamps;
    return this;
  }

  dropIfExists() {
    this._query.type = "drop";
    this._query.ifExists = true;
    return this;
  }

  select(...fields: (string | FieldAlias)[]) {
    this._query.select = fields;
    return this;
  }

  create(values: Values[]) {
    this._query.type = "insert";
    this._query.values = values;
    return this;
  }

  find(field: string, possibleValues: FieldValue[]) {
    this._query.whereIn = {
      field,
      possibleValues,
    };
    return this;
  }

  orderBy(
    field: string,
    orderDirection: OrderDirection,
  ) {
    this._query.orderBy = {
      field,
      orderDirection,
    };
    return this;
  }

  limit(limit: number) {
    this._query.limit = limit;
    return this;
  }

  where(
    field: string,
    operator: Operator,
    value: FieldValue,
  ) {
    if (!this._query.wheres) {
      this._query.wheres = [];
    }

    this._query.wheres.push({
      field,
      operator,
      value,
    });

    return this;
  }

  update(values: Values) {
    this._query.type = "update";
    this._query.values = values;
    return this;
  }

  delete() {
    this._query.type = "delete";
    return this;
  }

  join(
    joinTable: string,
    originField: string,
    targetField: string,
  ) {
    if (!this._query.joins) {
      this._query.joins = [];
    }

    this._query.joins.push({
      joinTable,
      originField,
      targetField,
    });

    return this;
  }

  count(field: string) {
    this._query.type = "count";
    this._query.aggregatorField = field;
    return this;
  }

  min(field: string) {
    this._query.type = "min";
    this._query.aggregatorField = field;
    return this;
  }

  max(field: string) {
    this._query.type = "max";
    this._query.aggregatorField = field;
    return this;
  }

  sum(field: string) {
    this._query.type = "sum";
    this._query.aggregatorField = field;
    return this;
  }

  avg(field: string) {
    this._query.type = "avg";
    this._query.aggregatorField = field;
    return this;
  }
}
