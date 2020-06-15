import { QueryDescription, Query, FieldAlias } from "../query-builder.ts";

/** Translator interface for translating `QueryDescription` objects to regular queries. */
export class Translator {
  /** Translate a query description into a regular query. */
  translateToQuery(query: QueryDescription): Query {
    return "";
  }

  /** Format a field to the database format, e.g. `userName` to `user_name`. */
  formatFieldNameToDatabase(
    fieldName: string | FieldAlias,
  ): string | FieldAlias {
    return fieldName;
  }
}
