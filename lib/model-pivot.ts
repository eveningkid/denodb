import { Model, ModelSchema } from "./model.ts";

export type PivotModelSchema = typeof PivotModel;

export class PivotModel extends Model {
  static _pivotsModels: { [modelName: string]: ModelSchema } = {};
  static _pivotsFields: { [modelName: string]: string } = {};
}
