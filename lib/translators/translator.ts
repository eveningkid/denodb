import {
  QueryDescription,
  Query,
  FieldAlias,
  Values,
} from "../query-builder.ts";

/** Translator interface for translating `QueryDescription` objects to regular queries. */
export interface Translator {
  /** Translate a query description into a regular query. */
  translateToQuery(query: QueryDescription): Query;

  /** Format a field to the database format, e.g. `userName` to `user_name`. */
  formatFieldNameToDatabase(
    fieldName: string | FieldAlias,
  ): string | FieldAlias;

  /** Format a field from the database format to a client format, e.g. `user_name` to `userName`. */
  formatFieldNameToClient(fieldName: string): string;

  /** Format client values to database format. */
  formatClientValuesToDatabase(values: Values | Values[]): Values[];

  /** Format database results to client format. */
  formatDatabaseResultsToClient(results: Values | Values[]): Values | Values[];
}
