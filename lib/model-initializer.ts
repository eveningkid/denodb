import { Database, SyncOptions } from "./database.ts";
import { ModelSchema, ModelFields, ModelDefaults } from "./model.ts";
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

    const { database, initOptions, model, queryBuilder } =
      initializationOptions;

    if (initOptions.drop) {
      const dropQuery = queryBuilder.queryForSchema(model).table(
        model.table,
      ).dropIfExists().toDescription();

      await database.query(dropQuery);
    }

    const createQuery = queryBuilder.queryForSchema(model).table(model.table)
      .createTable(
        model.formatFieldToDatabase(model.fields) as ModelFields,
        model.formatFieldToDatabase(model.defaults) as ModelDefaults,
        {
          withTimestamps: model.timestamps,
          ifNotExists: true,
        },
      ).toDescription();

    return database.query(createQuery);
  }
}
