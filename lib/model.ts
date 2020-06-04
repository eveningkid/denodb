import { ModelInitializer } from "./model-initializer.ts";
import {
  QueryBuilder,
  FieldAlias,
  FieldValue,
  OrderDirection,
  Values,
  Operator,
  QueryDescription,
  FieldType,
} from "./query-builder.ts";
import { Database, SyncOptions } from "./database.ts";
import { PivotModelSchema } from "./model-pivot.ts";

/** Represents a Model class, not an instance. */
export type ModelSchema = typeof Model;

export type ModelFields = { [key: string]: FieldType };
export type ModelDefaults = { [field: string]: FieldValue };
export type ModelPivotModels = { [modelName: string]: PivotModelSchema };

export type ModelOptions = {
  queryBuilder: QueryBuilder;
  modelInitializer: ModelInitializer;
  database: Database;
};

/** Model that can be used with a `Database`. */
export class Model {
  /** Table name as it should be saved in the database. */
  static table = "";

  /** Should this model have `created_at` and `updated_at` fields by default. */
  static timestamps = false;

  /** Model fields. */
  static fields: ModelFields = {};

  /** Default values for the model fields. */
  static defaults: ModelDefaults = {};

  /** Pivot table to use for a given model. */
  static pivot: ModelPivotModels = {};

  /** If the model has been created in the database. */
  private static _isCreatedInDatabase: boolean = false;

  /** Query builder instance. */
  private static _queryBuilder: QueryBuilder;

  /** Database which this model will be attached to. */
  private static _database: Database;

  /** Model primary key. Manually found through `_findPrimaryKey()`. */
  private static _primaryKey: string;

  /** Model current query being built. */
  private static _currentQuery: QueryBuilder;

  /** Options this model was initialized with. */
  private static _options: ModelOptions;

  /** Link a model to a database. Should not be called from a child model. */
  static _link(
    options: ModelOptions,
  ) {
    this._options = options;
    this._database = options.database;
    this._queryBuilder = options.queryBuilder;
    this._currentQuery = this._queryBuilder.queryForSchema(this);
    this._primaryKey = this._findPrimaryKey();
  }

  /** Create a model in a database. Should not be called from a child model. */
  static async _createInDatabase(initOptions: SyncOptions = {}) {
    if (this._isCreatedInDatabase) {
      throw new Error("This model has already been initialized.");
    }

    await this._options.modelInitializer.init(
      {
        database: this._options.database,
        queryBuilder: this._options.queryBuilder,
        model: this,
        initOptions,
      },
    );

    this._isCreatedInDatabase = true;
  }

  /** Manually find the primary key by going through the schema fields. */
  private static _findPrimaryKey(): string {
    const field = Object.entries(this.fields).find(([_, fieldType]) =>
      typeof fieldType === "object" &&
      fieldType.primaryKey
    );

    return field ? field[0] : "";
  }

  /** Build the current query and run it on the associated database. */
  private static async _runQuery(query: QueryDescription) {
    this._currentQuery = this._queryBuilder.queryForSchema(this);
    return this._database.query(query);
  }

  /** Return the model computed primary key. */
  static getComputedPrimaryKey() {
    if (!this._primaryKey) {
      this._findPrimaryKey();
    }

    return this._primaryKey;
  }

  /** Return the table name followed by a field name. Can also rename a field using `nameAs`.
   * 
   *     Flight.field("departure") => "flights.departure"
   *     
   *     Flight.field("id", "flight_id") => { flight_id: "flights.id" }
   */
  static field(field: string): string;
  static field(field: string, nameAs: string): FieldAlias;
  static field(field: string, nameAs?: string): string | FieldAlias {
    if (!this.fields.hasOwnProperty(field)) {
      throw new Error(
        `Tried to get the "${field}" field , but it does not exist. Try with any of these: ${
          Object.keys(this.fields).join(", ")
        }.`,
      );
    }

    const fullField = `${this.table}.${field}`;

    if (nameAs) {
      return { [nameAs]: fullField };
    }

    return fullField;
  }

  /** Run the current query. */
  static async get() {
    return this._runQuery(
      this._currentQuery.table(this.table).get().toDescription(),
    );
  }

  /** Fetch all the model records.
   * 
   *     await Flight.all();
   *     
   *     await Flight.select("id").all();
   */
  static async all() {
    return this.get();
  }

  /** Indicate which fields should be returned/selected from the query.
   * 
   *     await Flight.select("id").get();
   *     
   *     await Flight.select("id", "destination").get();
   */
  static select<T extends ModelSchema>(
    this: T,
    ...fields: (string | FieldAlias)[]
  ) {
    this._currentQuery.select(...fields);
    return this;
  }

  /** Create one or multiple records in the current model.
   * 
   *     await Flight.create({ departure: "Paris", destination: "Tokyo" });
   *     
   *     await Flight.create([{ ... }, { ... }]);
   */
  static async create(values: Values | Values[]) {
    const insertions = Array.isArray(values) ? values : [values];

    return this._runQuery(
      this._currentQuery.table(this.table).create(insertions).toDescription(),
    );
  }

  /** Find one or multiple records based on the model primary key.
   * 
   *     await Flight.find("1");
   */
  static async find(idOrIds: FieldValue | FieldValue[]) {
    const results = await this._runQuery(
      this._currentQuery.table(this.table).find(
        this.getComputedPrimaryKey(),
        Array.isArray(idOrIds) ? idOrIds : [idOrIds],
      ).toDescription(),
    );

    return Array.isArray(idOrIds) ? results : results[0];
  }

  /** Order query results based on a field name and an optional direction.
   * 
   *     await Flight.orderBy("departure").all();
   *     
   *     await Flight.orderBy("departure", "desc").all();
   */
  static orderBy<T extends ModelSchema>(
    this: T,
    field: string,
    orderDirection: OrderDirection = "asc",
  ) {
    this._currentQuery.orderBy(field, orderDirection);
    return this;
  }

  /** Limit the number of results returned from the query.
   * 
   *     await Flight.take(10).get();
   */
  static take<T extends ModelSchema>(this: T, limit: number) {
    this._currentQuery.limit(limit);
    return this;
  }

  /** Return the first record that matches the current query.
   * 
   *     await Flight.where("id", ">", "1").first();
   */
  static async first() {
    this.take(1);
    const results = await this.get();
    return results[0];
  }

  /** Add a `where` clause to your query.
   * 
   *     await Flight.where("id", "1").get();
   *     
   *     await Flight.where("id", ">", "1").get();
   *     
   *     await Flight.where({ id: "1", departure: "Paris" }).get();
   */
  static where<T extends ModelSchema>(
    this: T,
    fieldOrFields: string | Values,
    operatorOrFieldValue?: Operator | FieldValue,
    fieldValue?: FieldValue,
  ) {
    const whereOperator: Operator = typeof fieldValue !== "undefined"
      ? operatorOrFieldValue as Operator
      : "=";

    const whereValue: FieldValue = typeof fieldValue !== "undefined"
      ? fieldValue
      : operatorOrFieldValue as FieldValue;

    if (typeof fieldOrFields === "string") {
      this._currentQuery.where(fieldOrFields, whereOperator, whereValue);
    } else {
      // TODO(eveningkid): cannot do multiple where with different operators
      // Need to find a great API for multiple where potentially with operators
      // .where({ name: 'John', age: { moreThan: 19 } })
      // and then format it using Knex .andWhere(...)

      Object.entries(fieldOrFields).forEach(([field, value]) => {
        this._currentQuery.where(field, "=", value);
      });
    }

    return this;
  }

  /** Update one or multiple records. Also update `updated_at` if `timestamps` is `true`.
   * 
   *     await Flight.where("departure", "Dublin").update("departure", "Tokyo");
   *     
   *     await Flight.where("departure", "Dublin").update({ destination: "Tokyo" });
   */
  static async update(
    fieldOrFields: string | Values,
    fieldValue?: FieldValue,
  ) {
    let fieldsToUpdate: Values = {};

    if (this.timestamps) {
      fieldsToUpdate.updated_at = new Date();
    }

    if (typeof fieldOrFields === "string") {
      fieldsToUpdate[fieldOrFields] = fieldValue!;
    } else {
      fieldsToUpdate = {
        ...fieldsToUpdate,
        ...fieldOrFields,
      };
    }

    return this._runQuery(
      this._currentQuery.table(this.table).update(fieldsToUpdate)
        .toDescription(),
    );
  }

  /** Delete a record by a primary key value.
   * 
   *     await Flight.deleteById("1");
   */
  static async deleteById(id: FieldValue) {
    return this._runQuery(
      this._currentQuery.table(this.table).where(
        this.getComputedPrimaryKey(),
        "=",
        id,
      ).delete().toDescription(),
    );
  }

  /** Delete selected records.
   * 
   *     await Flight.where("destination", "Paris").delete();
   */
  static async delete() {
    return this._runQuery(
      this._currentQuery.table(this.table).delete().toDescription(),
    );
  }

  /** Join a table to the current query.
   * 
   *     await Flight.where(
   *       Flight.field("departure"),
   *       "Paris",
   *     ).join(
   *       Airport,
   *       Airport.field("id"),
   *       Flight.field("airportId"),
   *     ).get()
   */
  static join<T extends ModelSchema>(
    this: T,
    joinTable: ModelSchema,
    originField: string,
    targetField: string,
  ) {
    this._currentQuery.join(
      joinTable.table,
      originField,
      targetField,
    );
    return this;
  }

  /** Count the number of records of a model or filtered by a field name.
   *     
   *     await Flight.count();
   *     
   *     await Flight.where("destination", "Dublin").count();
   */
  static async count(field: string = "*") {
    const value = await this._runQuery(
      this._currentQuery.table(this.table).count(
        field,
      ).toDescription(),
    );

    return value[0].count;
  }

  /** Find the minimum value of a field from all the selected records.
   * 
   *     await Flight.min("flightDuration");
   */
  static async min(field: string) {
    const value = await this._runQuery(
      this._currentQuery.table(this.table).min(
        field,
      )
        .toDescription(),
    );

    return value[0].min;
  }

  /** Find the maximum value of a field from all the selected records.
   * 
   *     await Flight.max("flightDuration");
   */
  static async max(field: string) {
    const value = await this._runQuery(
      this._currentQuery.table(this.table).max(
        field,
      )
        .toDescription(),
    );

    return value[0].max;
  }

  /** Compute the sum of a field's values from all the selected records.
   * 
   *     await Flight.sum("flightDuration");
   */
  static async sum(field: string) {
    const value = await this._runQuery(
      this._currentQuery.table(this.table).sum(
        field,
      )
        .toDescription(),
    );

    return value[0].sum;
  }

  /** Compute the average value of a field's values from all the selected records.
   * 
   *     await Flight.avg("flightDuration");
   *     
   *     await Flight.where("destination", "San Francisco").avg("flightDuration");
   */
  static async avg(field: string) {
    const value = await this._runQuery(
      this._currentQuery.table(this.table).avg(
        field,
      )
        .toDescription(),
    );

    return value[0].avg;
  }

  /** Find associated values for the given model for one-to-many and many-to-many relationships. 
   * 
   *     class Airport {
   *       static flights() {
   *         return this.hasMany(Flight);
   *       }
   *     }
   *     
   *     Airport.where("id", "1").flights();
   */
  static hasMany<T extends ModelSchema>(
    this: T,
    model: ModelSchema,
  ): Promise<any[]> {
    const currentWhereValue = this._findCurrentQueryWhereClause();

    if (model.name in this.pivot) {
      const pivot = this.pivot[model.name];
      const pivotField = pivot._pivotsFields[this.name];
      const pivotOtherModel = pivot._pivotsModels[model.name];
      const pivotOtherModelField = pivot._pivotsFields[model.name];

      return pivot.where(pivot.field(pivotField), currentWhereValue).join(
        pivotOtherModel,
        pivotOtherModel.field(pivotOtherModel.getComputedPrimaryKey()),
        pivot.field(pivotOtherModelField),
      ).get();
    }

    const foreignKeyName = this._findModelForeignKeyField(model);
    this._currentQuery = this._queryBuilder.queryForSchema(this);
    return model.where(foreignKeyName, currentWhereValue).all();
  }

  /** Find associated values for the given model for one-to-one and one-to-many relationships. */
  static async hasOne<T extends ModelSchema>(this: T, model: ModelSchema) {
    const currentWhereValue = this._findCurrentQueryWhereClause();
    const FKName = this._findModelForeignKeyField(model);

    if (!FKName) {
      const currentModelFKName = this._findModelForeignKeyField(this, model);
      const currentModelValue = await this.where(
        this.getComputedPrimaryKey(),
        currentWhereValue,
      ).first();
      const currentModelFKValue = currentModelValue[currentModelFKName];
      return model.where(model.getComputedPrimaryKey(), currentModelFKValue)
        .first();
    }

    return model.where(FKName, currentWhereValue).first();
  }

  /** Look for the current query's where clause for this model's primary key. */
  private static _findCurrentQueryWhereClause() {
    if (!this._currentQuery._query.wheres) {
      throw new Error("The current query does not have any where clause.");
    }

    const where = this._currentQuery._query.wheres.find((where) => {
      return where.field === this.getComputedPrimaryKey();
    });

    if (!where) {
      throw new Error(
        "The current query does not have any where clause for this model primary key.",
      );
    }

    return where.value;
  }

  /** Look for a `fieldName: Relationships.belongsTo(forModel)` field for a given `model`. */
  private static _findModelForeignKeyField(
    model: ModelSchema,
    forModel: ModelSchema = this,
  ): string {
    const modelFK: [string, FieldType] | undefined = Object.entries(
      model.fields,
    ).find(([, type]) => {
      return (typeof type === "object")
        ? type.relationship?.model === forModel
        : false;
    });

    if (!modelFK) {
      return "";
    }

    return modelFK[0];
  }
}
