import { Database, SyncOptions } from "./database.ts";
import { Model } from "./model.ts";
import { QueryBuilder } from "./query-builder.ts";
import { addFieldToSchema } from "./helpers/fields.ts";

type ModelInitializationOptions = {
  database: Database;
  queryBuilder: QueryBuilder;
  model: typeof Model;
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
      const dropQuery = initializationOptions.queryBuilder.query().schema
        .dropTableIfExists(initializationOptions.model.table)
        .toString();

      await initializationOptions.database.query(dropQuery);
    }

    const createQuery = initializationOptions.queryBuilder.query().schema
      .createTable(
        initializationOptions.model.table,
        (table: any) => {
          for (
            const [fieldName, fieldType] of Object.entries(
              initializationOptions.model.fields,
            )
          ) {
            addFieldToSchema(
              table,
              {
                name: fieldName,
                type: fieldType,
                defaultValue: initializationOptions.model.defaults[fieldName],
              },
            );
          }

          if (initializationOptions.model.timestamps) {
            // Adds `createdAt` and `updatedAt` fields
            table.timestamps(null, true);
          }
        },
      ).toString();

    return initializationOptions.database.query(createQuery);
  }
}
