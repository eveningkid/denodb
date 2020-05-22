import { QueryDescription, Query } from "../query-builder.ts";

/** Translator interface for translating `QueryDescription` objects to regular queries. */
export interface Translator {
  /** Translate a query description into a regular query. */
  translateToQuery(query: QueryDescription): Query;
}
