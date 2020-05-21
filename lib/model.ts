import { ModelInitializer } from "./model-initializer.ts";
import {
  QueryBuilder,
  FieldAlias,
  FieldValue,
  FieldType,
  OrderDirection,
  Values,
  Operator,
} from "./query-builder.ts";
import { Database, SyncOptions } from "./database.ts";

/** Represents a Model class, not an instance. */
export type ModelSchema = typeof Model;

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
  static timestamps = true;

  /** Model fields. */
  static fields: { [field: string]: FieldType } = {};

  /** Default values for the model fields. */
  static defaults: { [field: string]: FieldValue } = {};

  /** If the model has been created in the database. */
  private static _isCreatedInDatabase: boolean = false;

  /** Query builder instance. */
  private static _queryBuilder: QueryBuilder;

  /** Database which this model will be attached to. */
  private static _database: Database;

  /** Model primary key. Manually found through `_findPrimaryKey()`. */
  private static _primaryKey: string;

  /** Model current query being built. */
  private static _currentQuery: any;

  /** Options this model was initialized with. */
  private static _options: ModelOptions;

  /** Link a model to a database. Should not be called from a child model. */
  static _link(
    options: ModelOptions,
  ) {
    this._options = options;
    this._database = options.database;
    this._queryBuilder = options.queryBuilder;
    this._currentQuery = this._queryBuilder.query();
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
  private static async _runQuery(query: string) {
    this._currentQuery = this._queryBuilder.query();
    return this._database.query(query);
  }

  /** Return the table name followed by a field name. Can also rename a field using `nameAs`.
   * 
   *     Flight.field("departure") => "flights.departure"
   *     
   *     Flight.field("id", "flight_id") => { flight_id: "flights.id" }
   */
  static field(fieldName: string): string;
  static field(fieldName: string, nameAs: string): FieldAlias;
  static field(fieldName: string, nameAs?: string): string | FieldAlias {
    if (!this.fields.hasOwnProperty(fieldName)) {
      throw new Error(
        `Tried to get the "${fieldName}" field , but it does not exist. Try with any of these: ${
          Object.keys(this.fields).join(", ")
        }.`,
      );
    }

    const fullField = `${this.table}.${fieldName}`;

    if (nameAs) {
      return { [nameAs]: fullField };
    }

    return fullField;
  }

  /** Run the current query. */
  static async get() {
    return this._runQuery(
      this._currentQuery.table(this.table).toString(),
    );
  }

  /** Fetch all the model records.
   * 
   *     await Flight.all();
   *     
   *     await Flight.select("id").all();
   */
  static async all() {
    return this._runQuery(
      this._currentQuery.from(this.table)
        .toString(),
    );
  }

  /** Indicate which fields should be returned/selected from the query.
   * 
   *     await Flight.select("id").get();
   *     
   *     await Flight.select("id", "destination").get();
   */
  static select(...fields: (string | FieldAlias)[]) {
    for (const field of fields) {
      this._currentQuery = this._currentQuery.select(field);
    }

    return this;
  }

  /** Create one or multiple records in the current model.
   * 
   *     await Flight.create({ departure: "Paris", destination: "Tokyo" });
   *     
   *     await Flight.create([{ ... }, { ... }]);
   */
  static async create(values: Values | Values[]) {
    return this._runQuery(
      this._currentQuery.table(this.table).insert(values)
        .toString(),
    );
  }

  /** Find one or multiple records based on the model primary key.
   * 
   *     await Flight.find("1");
   */
  static async find(idOrIds: FieldValue | FieldValue[]) {
    return this._runQuery(
      this._currentQuery.table(this.table).whereIn(
        this._primaryKey,
        Array.isArray(idOrIds) ? idOrIds : [idOrIds],
      )
        .toString(),
    );
  }

  /** Order query results based on a field name and an optional direction.
   * 
   *     await Flight.orderBy("departure").all();
   *     
   *     await Flight.orderBy("departure", "desc").all();
   */
  static orderBy(
    fieldName: string,
    orderDirection: OrderDirection = "asc",
  ) {
    this._currentQuery = this._currentQuery.orderBy(fieldName, orderDirection);
    return this;
  }

  /** Limit the number of results returned from the query.
   * 
   *     await Flight.take(10).get();
   */
  static take(limit: number) {
    this._currentQuery = this._currentQuery.limit(limit);
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
  static where(
    fieldNameOrFields: string | Values,
    operatorOrFieldValue?: Operator | FieldValue,
    fieldValue?: FieldValue,
  ) {
    const whereOperator: Operator = typeof fieldValue !== "undefined"
      ? operatorOrFieldValue as Operator
      : "=";

    const whereValue: FieldValue = typeof fieldValue !== "undefined"
      ? fieldValue
      : operatorOrFieldValue as FieldValue;

    if (typeof fieldNameOrFields === "string") {
      this._currentQuery = this._currentQuery.where(
        fieldNameOrFields,
        whereOperator,
        whereValue,
      );
    } else {
      // TODO(eveningkid): cannot do multiple where with different operators
      // Need to find a great API for multiple where potentially with operators
      // .where({ name: 'John', age: { moreThan: 19 } })
      // and then format it using Knex .andWhere(...)
      this._currentQuery = this._currentQuery.where(fieldNameOrFields);
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
    fieldNameOrFields: string | Values,
    fieldValue?: FieldValue,
  ) {
    let fieldsToUpdate: Values = {};

    if (this.timestamps) {
      fieldsToUpdate.updated_at = new Date();
    }

    if (typeof fieldNameOrFields === "string") {
      fieldsToUpdate[fieldNameOrFields] = fieldValue!;
    } else {
      fieldsToUpdate = {
        ...fieldsToUpdate,
        ...fieldNameOrFields,
      };
    }

    return this._runQuery(
      this._currentQuery.table(this.table).update(
        fieldsToUpdate,
      ).toString(),
    );
  }

  /** Delete a record by a primary key value.
   * 
   *     await Flight.deleteById("1");
   */
  static async deleteById(id: FieldValue) {
    return this._runQuery(
      this._currentQuery.table(this.table).where(
        this._primaryKey,
        id,
      ).del().toString(),
    );
  }

  /** Delete selected records.
   * 
   *     await Flight.where("destination", "Paris").delete();
   */
  static async delete() {
    return this._runQuery(
      this._currentQuery.table(this.table).del().toString(),
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
  static join(
    joinTable: ModelSchema,
    originField: string,
    targetField: string,
  ) {
    this._currentQuery = this._currentQuery.join(
      joinTable.table,
      originField,
      "=",
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
  static async count(fieldName: string = "*") {
    const value = await this._runQuery(
      this._currentQuery.table(this.table).count(
        fieldName,
      )
        .toString(),
    );

    return value[0].count;
  }

  /** Find the minimum value of a field from all the selected records.
   * 
   *     await Flight.min("flightDuration");
   */
  static async min(fieldName: string) {
    const value = await this._runQuery(
      this._currentQuery.table(this.table).min(
        fieldName,
      )
        .toString(),
    );

    return value[0].min;
  }

  /** Find the maximum value of a field from all the selected records.
   * 
   *     await Flight.max("flightDuration");
   */
  static async max(fieldName: string) {
    const value = await this._runQuery(
      this._currentQuery.table(this.table).max(
        fieldName,
      )
        .toString(),
    );

    return value[0].max;
  }

  /** Compute the sum of a field's values from all the selected records.
   * 
   *     await Flight.sum("flightDuration");
   */
  static async sum(fieldName: string) {
    const value = await this._runQuery(
      this._currentQuery.table(this.table).sum(
        fieldName,
      )
        .toString(),
    );

    return value[0].sum;
  }

  /** Compute the average value of a field's values from all the selected records.
   * 
   *     await Flight.avg("flightDuration");
   *     
   *     await Flight.where("destination", "San Francisco").avg("flightDuration");
   */
  static async avg(fieldName: string) {
    const value = await this._runQuery(
      this._currentQuery.table(this.table).avg(
        fieldName,
      )
        .toString(),
    );

    return value[0].avg;
  }
}
