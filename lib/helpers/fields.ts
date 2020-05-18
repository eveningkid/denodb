import { FieldType, FieldValue } from "../query-builder.ts";

type FieldOptions = {
  name: string;
  type: FieldType;
  defaultValue: FieldValue;
};

/** Add a model field to a table schema. */
export function addFieldToSchema(
  table: any,
  fieldOptions: FieldOptions,
) {
  const type = typeof fieldOptions.type === "string"
    ? fieldOptions.type
    : fieldOptions.type.type!;

  let instruction;

  if (typeof fieldOptions.type === "object") {
    const fieldNameArgs: [string | number] = [fieldOptions.name];

    if (fieldOptions.type.length) {
      fieldNameArgs.push(fieldOptions.type.length);
    }

    if (fieldOptions.type.autoIncrement) {
      instruction = table.increments(fieldOptions.name);
    } else {
      instruction = table[type](...fieldNameArgs);
    }

    if (fieldOptions.type.primaryKey) {
      instruction = instruction.primary();
    }

    if (!fieldOptions.type.allowNull) {
      instruction = instruction.notNullable();
    }
  } else {
    instruction = table[type](fieldOptions.name);
  }

  if (typeof fieldOptions.defaultValue !== "undefined") {
    instruction.defaultTo(fieldOptions.defaultValue);
  }
}
