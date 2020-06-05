import { Translator } from "./translator.ts";
import { DatabaseDialect } from "../database.ts";
import { SQLQueryBuilder } from "../../deps.ts";
import { Query, QueryDescription } from "../query-builder.ts";
import { addFieldToSchema } from "../helpers/fields.ts";

export class SQLTranslator implements Translator {
  _dialect: DatabaseDialect;

  constructor(dialect: DatabaseDialect) {
    this._dialect = dialect;
  }

  translateToQuery(query: QueryDescription): Query {
    let queryBuilder = new (SQLQueryBuilder as any)(
      {
        client: this._dialect,
        useNullAsDefault: this._dialect === "sqlite3",
        log: {
          // NOTE(eveningkid): It shows a message whenever `createTableIfNotExists`
          // is used. Knex deprecated it as part of its library but in our case,
          // it actually makes sense. As this warning message should be ignored,
          // we override the `log.warn` method so it doesn't show up.
          warn(message: string) {
          },
        },
      },
    );

    if (query.table && query.type !== "drop" && query.type !== "create") {
      queryBuilder = queryBuilder.table(query.table);
    }

    if (query.select) {
      query.select.forEach((field) => {
        queryBuilder = queryBuilder.select(field);
      });
    }

    if (query.whereIn) {
      queryBuilder = queryBuilder.whereIn(
        query.whereIn.field,
        query.whereIn.possibleValues,
      );
    }

    if (query.orderBy) {
      queryBuilder = queryBuilder.orderBy(
        Object.entries(query.orderBy).map(([field, orderDirection]) => ({
          column: field,
          order: orderDirection,
        })),
      );
    }

    if (query.groupBy) {
      queryBuilder = queryBuilder.groupBy(query.groupBy);
    }

    if (query.limit) {
      queryBuilder = queryBuilder.limit(query.limit);
    }

    if (query.wheres) {
      query.wheres.forEach((where) => {
        queryBuilder = queryBuilder.where(
          where.field,
          where.operator,
          where.value,
        );
      });
    }

    if (query.joins) {
      query.joins.forEach((join) => {
        queryBuilder = queryBuilder.join(
          join.joinTable,
          join.originField,
          "=",
          join.targetField,
        );
      });
    }

    switch (query.type) {
      case "drop":
        const dropTableHelper = query.ifExists
          ? "dropTableIfExists"
          : "dropTable";

        queryBuilder = queryBuilder.schema[dropTableHelper](query.table);
        break;

      case "create":
        if (!query.fields) {
          throw new Error(
            "Fields were not provided for creating a new instance.",
          );
        }

        const createTableHelper = query.ifExists
          ? "createTable"
          : "createTableIfNotExists";

        queryBuilder = queryBuilder.schema[createTableHelper](
          query.table,
          (table: any) => {
            const fieldDefaults = query.fieldsDefaults ?? {};

            for (
              const [field, fieldType] of Object.entries(query.fields!)
            ) {
              addFieldToSchema(
                table,
                {
                  name: field,
                  type: fieldType,
                  defaultValue: fieldDefaults[field],
                },
              );
            }

            if (query.timestamps) {
              // Adds `createdAt` and `updatedAt` fields
              table.timestamps(null, true);
            }
          },
        );
        break;

      case "insert":
        if (!query.values) {
          throw new Error(
            "Trying to make an insert query, but no values were provided.",
          );
        }

        queryBuilder = queryBuilder.returning("*").insert(query.values);
        break;

      case "update":
        if (!query.values) {
          throw new Error(
            "Trying to make an update query, but no values were provided.",
          );
        }

        queryBuilder = queryBuilder.update(query.values);
        break;

      case "delete":
        queryBuilder = queryBuilder.del();
        break;

      case "count":
        queryBuilder = queryBuilder.count(query.aggregatorField ?? "*");
        break;

      case "avg":
        queryBuilder = queryBuilder.avg(query.aggregatorField);
        break;

      case "min":
        queryBuilder = queryBuilder.min(query.aggregatorField);
        break;

      case "max":
        queryBuilder = queryBuilder.max(query.aggregatorField);
        break;

      case "sum":
        queryBuilder = queryBuilder.sum(query.aggregatorField);
        break;
    }

    return queryBuilder.toString();
  }
}
