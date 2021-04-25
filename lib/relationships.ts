import type { ModelSchema } from "./model.ts";
import { DataTypes, RelationshipType } from "./data-types.ts";
import { PivotModel } from "./model-pivot.ts";

type PrimaryKeyOption = {
  primaryKey?: string;
};

type ForeignKeyOption = {
  foreignKey?: string;
};

type RelationshipOptions = PrimaryKeyOption & ForeignKeyOption;

export const Relationships = {
  /** Define a one-to-one or one-to-many relationship field for a given model. */
  _belongsToField(model: ModelSchema): RelationshipType {
    return {
      type: DataTypes.INTEGER,
      relationship: {
        kind: "single",
        model,
      },
    };
  },

  /** Define a one-to-one or one-to-many relationship for a given model. */
  belongsTo(
    modelA: ModelSchema,
    modelB: ModelSchema,
    options?: ForeignKeyOption,
  ) {
    const foreignKey = options?.foreignKey;
    const modelAFieldName = foreignKey || `${modelB.name.toLowerCase()}Id`;
    modelA.fields[modelAFieldName] = this._belongsToField(modelB);
  },

  /** Add corresponding fields to each model for a one-to-one relationship. */
  oneToOne(
    modelA: ModelSchema,
    modelB: ModelSchema,
    options?: RelationshipOptions,
  ) {
    const primaryKey = options?.primaryKey;
    const foreignKey = options?.foreignKey;

    const modelAFieldName = primaryKey || `${modelB.name.toLowerCase()}Id`;
    const modelBFieldName = foreignKey || `${modelA.name.toLowerCase()}Id`;

    modelA.fields[modelAFieldName] = this._belongsToField(modelB);
    modelB.fields[modelBFieldName] = this._belongsToField(modelA);
  },

  /** Generate a many-to-many pivot model for two given models.
   * 
   *     const AirportFlight = Relationships.manyToMany(Airport, Flight);
   */
  manyToMany(
    modelA: ModelSchema,
    modelB: ModelSchema,
    options?: RelationshipOptions,
  ): ModelSchema {
    const primaryKey = options?.primaryKey;
    const foreignKey = options?.foreignKey;

    const pivotClassName = `${modelA.table}_${modelB.table}`;
    const modelAFieldName = primaryKey || `${modelA.name.toLowerCase()}Id`;
    const modelBFieldName = foreignKey || `${modelB.name.toLowerCase()}Id`;

    class PivotClass extends PivotModel {
      static table = pivotClassName;

      static fields = {
        id: {
          primaryKey: true,
          autoIncrement: true,
        },
        [modelAFieldName]: Relationships._belongsToField(modelA),
        [modelBFieldName]: Relationships._belongsToField(modelB),
      };

      static _pivotsModels = {
        [modelA.name]: modelA,
        [modelB.name]: modelB,
      };

      static _pivotsFields = {
        [modelA.name]: modelAFieldName,
        [modelB.name]: modelBFieldName,
      };
    }

    modelA.pivot[modelB.name] = PivotClass;
    modelB.pivot[modelA.name] = PivotClass;

    return PivotClass;
  },
};
