import { Database, SyncOptions } from "./database.ts";
import { ModelSchema } from "./model.ts";
import { QueryBuilder } from "./query-builder.ts";

type ModelInitializationOptions = {
  database: Database;
  queryBuilder: QueryBuilder;
  model: ModelSchema;
  initOptions: SyncOptions;
};

/** Initialize models in a database. */
export class ModelInitializer {
  /** Create a model in a database, given a model schema. */
  async init(
    initializationOptions: ModelInitializationOptions,
  ): Promise<any[]> {
    // TODO(eveningkid): Once we have transactions working across all databases
    // the following queries should be done within a transaction.

    if (initializationOptions.initOptions.drop) {
      const dropQuery = initializationOptions.queryBuilder.queryForSchema(
        initializationOptions.model,
      ).table(
        initializationOptions.model.table,
      ).dropIfExists().toDescription();

      await initializationOptions.database.query(dropQuery);
    }

    const createQuery = initializationOptions.queryBuilder.queryForSchema(
      initializationOptions.model,
    ).table(
      initializationOptions.model.table,
    ).createTable(
      initializationOptions.model.fields,
      initializationOptions.model.defaults,
      { withTimestamps: true, ifNotExists: true },
    ).toDescription();

    return initializationOptions.database.query(createQuery);
  }
}
