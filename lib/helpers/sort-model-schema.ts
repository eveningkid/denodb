/**
 *
 * @param models
 * @example
 * Models:
 * A->B
 * A->C
 * C->D
 * The returned value will be:
 * A,B,C,D
 */
export const topologicalSortModelSchema = (
  models: ModelSchema[],
): ModelSchema[] => {
  const modelTableToModel: { [tableName: string]: ModelSchema } = models.reduce(
    (tableNameToModel: { [tableName: string]: ModelSchema }, model) => {
      tableNameToModel[model.table] = model;
      return tableNameToModel;
    },
    {},
  );

  const edgesAsDependencies: [string, string][] = [];

  // Create Connections between models
  models.forEach((model) => {
    Object.values(model.fields)
      .filter((field) => typeof field !== "string" && field.relationship?.model)
      .forEach(({ relationship }: FieldProps) => {
        edgesAsDependencies.push(
          [relationship?.model.table || "", model.table],
        );
      });
  });

  return topologicalSort(edgesAsDependencies).map((tableName: string) =>
    modelTableToModel[tableName]
  );
};
