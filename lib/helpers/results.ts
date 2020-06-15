import { ModelSchema } from "../model.ts";
import { Values } from "../query-builder.ts";

/** Transform a plain record object to a given model schema. */
export function formatResultToModelInstance(
  Schema: ModelSchema,
  fields: Values,
) {
  const instance = new Schema();

  for (const field in fields) {
    (instance as any)[Schema.formatFieldToClient(field) as string] =
      fields[field];
  }

  return instance;
}
