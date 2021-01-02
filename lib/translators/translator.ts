import type { Query, QueryDescription } from "../query-builder.ts";
import type { FieldAlias } from "../data-types.ts";

/** Translator interface for translating `QueryDescription` objects to regular queries. */
export interface Translator {
  /** Translate a query description into a regular query. */
  translateToQuery(query: QueryDescription): Query;

  /** Format a field to the database format, e.g. `userName` to `user_name`. */
  formatFieldNameToDatabase(
    fieldName: string | FieldAlias,
  ): string | FieldAlias;
}
