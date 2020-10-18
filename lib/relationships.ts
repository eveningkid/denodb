import { ModelSchema } from "./model.ts";
import { DataTypes, FieldTypeString, RelationshipType } from "./data-types.ts";
import { PivotModel } from "./model-pivot.ts";

export const Relationships = {
  /** Define a one-to-one or one-to-many relationship for a given model. */
  belongsTo(model: ModelSchema): RelationshipType {
    return {
      type: DataTypes.INTEGER,
      relationship: {
        kind: "single",
        model,
      },
    };
  },

  /** Add corresponding fields to each model for a one-to-one relationship. */
  oneToOne(modelA: ModelSchema, modelB: ModelSchema) {
    modelA.fields[`${modelB.name.toLowerCase()}Id`] = this.belongsTo(modelB);
    modelB.fields[`${modelA.name.toLowerCase()}Id`] = this.belongsTo(modelA);
  },

  /** Generate a many-to-many pivot model for two given models.
   * 
   *     const AirportFlight = Relationships.manyToMany(Airport, Flight);
   */
  manyToMany(modelA: ModelSchema, modelB: ModelSchema): ModelSchema {
    const pivotClassName = `${modelA.table}_${modelB.table}`;
    const modelAFieldName = `${modelA.name.toLowerCase()}Id`;
    const modelBFieldName = `${modelB.name.toLowerCase()}Id`;

    class PivotClass extends PivotModel {
      static table = pivotClassName;

      static fields = {
        id: {
          primaryKey: true,
          autoIncrement: true,
        },
        [modelAFieldName]: Relationships.belongsTo(modelA),
        [modelBFieldName]: Relationships.belongsTo(modelB),
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
