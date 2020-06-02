export type FieldTypeString =
  | "bigInteger"
  | "integer"
  | "decimal"
  | "float"
  | "uuid"
  | "boolean"
  | "binary"
  | "enu"
  | "string"
  | "text"
  | "date"
  | "datetime"
  | "time"
  | "timestamp"
  | "json"
  | "jsonb";

export type FieldTypes =
  | "BIG_INTEGER"
  | "INTEGER"
  | "DECIMAL"
  | "FLOAT"
  | "UUID"
  | "BOOLEAN"
  | "BINARY"
  | "ENUM"
  | "STRING"
  | "TEXT"
  | "DATE"
  | "DATETIME"
  | "TIME"
  | "TIMESTAMP"
  | "JSON"
  | "JSONB";

export type Fields = {
  [key in FieldTypes]: FieldTypeString;
};

/** Available fields data types. */
export const DATA_TYPES: Fields = {
  INTEGER: "integer",
  BIG_INTEGER: "bigInteger",
  DECIMAL: "decimal",
  FLOAT: "float",
  UUID: "uuid",

  BOOLEAN: "boolean",
  BINARY: "binary",

  ENUM: "enu",
  STRING: "string",
  TEXT: "text",

  DATE: "date",
  DATETIME: "datetime",
  TIME: "time",
  TIMESTAMP: "timestamp",

  JSON: "json",
  JSONB: "jsonb",
};

export const DataTypes = DATA_TYPES;
