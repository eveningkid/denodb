import { Fields } from "./query-builder.ts";

export type FieldTypes =
  | "INTEGER"
  | "FLOAT"
  | "BOOLEAN"
  | "STRING"
  | "TEXT"
  | "DATETIME";

/** Available fields data types. */
export const DATA_TYPES: Fields = {
  INTEGER: "integer",
  FLOAT: "float",

  BOOLEAN: "boolean",

  STRING: "string",
  TEXT: "text",

  DATETIME: "date",
};
