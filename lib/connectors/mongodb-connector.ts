import { Connector, ConnectorOptions } from "./connector.ts";
import { QueryDescription } from "../query-builder.ts";

type MongoDBOptionsBase = {
  database: string;
};

type MongoDBOptionsWithURI = {
  uri: string;
};

type MongoDBClientOptions = {
  hosts: string[];
  appName?: string;
  connectTimeout?: number;
  username?: string;
  password?: string;
  directConnection?: boolean;
  heartbeatFreq?: number;
  maxIdleTime?: number;
  maxPoolSize?: number;
  minPoolSize?: number;
  replSetName?: string;
  serverSelectionTimeout?: number;
  waitQueueTimeout?: number;
};

type FindOptions = {
  findOne?: boolean;
  skip?: number;
  limit?: number;
};

type UpdateResult = {
  matchedCount: number;
  modifiedCount: number;
  upsertedId: Object | null;
};

type MongoDBCollection = {
  count(filter?: Object): Promise<number>;
  findOne(filter?: Object): Promise<any>;
  find(filter?: Object, options?: FindOptions): Promise<any>;
  insertOne(doc: Object): Promise<any>;
  insertMany(docs: Object[]): Promise<any>;
  deleteOne(query: Object): Promise<number>;
  deleteMany(query: Object): Promise<number>;
  updateOne(query: Object, update: Object): Promise<UpdateResult>;
  updateMany(query: Object, update: Object): Promise<UpdateResult>;
  aggregate<T = any>(pipeline: Object[]): Promise<T[]>;
  createIndexes(
    models: {
      keys: Object;
      options?: {
        background?: boolean;
        unique?: boolean;
        name?: string;
        partialFilterExpression?: Object;
        sparse?: boolean;
        expireAfterSeconds?: number;
        storageEngine?: Object;
      };
    }[]
  ): Promise<string[]>;
};

type MongoDBDatabase = {
  listCollectionNames(): Promise<string[]>;
  collection(name: string): MongoDBCollection;
};

type MongoDBClient = {
  clientId: number;
  connectWithUri(uri: string): void;
  connectWithOptions(options: MongoDBClientOptions): void;
  listDatabases(): Promise<string[]>;
  database(name: string): MongoDBDatabase;
};

export type MongoDBOptions = ConnectorOptions &
  (MongoDBOptionsWithURI | MongoDBClientOptions) &
  MongoDBOptionsBase;

export class MongoDBConnector implements Connector {
  _client!: MongoDBClient;
  _database!: MongoDBDatabase;
  _options: MongoDBOptions;
  _connected = false;

  /** Create a MongoDB connection. */
  constructor(options: MongoDBOptions) {
    this._options = options;
  }

  async _makeConnection() {
    if (this._connected) {
      return;
    }

    if (!this._client) {
      const {
        MongoDBClient,
        MONGODB_PLUGIN_RELEASE_URL,
        initMongoDBPlugin,
      } = await import("../../unstable_deps.ts");
      await initMongoDBPlugin(MONGODB_PLUGIN_RELEASE_URL);
      this._client = new MongoDBClient();
    }

    if (this._options.hasOwnProperty("uri")) {
      this._client.connectWithUri((this._options as MongoDBOptionsWithURI).uri);
    } else {
      this._client.connectWithOptions(this._options as MongoDBClientOptions);
    }

    this._database = this._client.database(this._options.database);
    this._connected = true;
  }

  async ping() {
    await this._makeConnection();

    try {
      const dbs = await this._client.listDatabases();
      return dbs.includes(this._options.database);
    } catch (error) {
      return false;
    }
  }

  async query(queryDescription: QueryDescription): Promise<any | any[]> {
    await this._makeConnection();

    if (queryDescription.type === "create") {
      // There is no need to initialize collections in MongoDB
      return [];
    }

    const collection = this._database.collection(queryDescription.table!);

    let wheres: { [k: string]: any } = {};
    if (queryDescription.wheres) {
      wheres = queryDescription.wheres.reduce((prev, curr) => {
        let mongoOperator = "$eq";

        switch (curr.operator) {
          case "<":
            mongoOperator = "$lt";
            break;

          case "<=":
            mongoOperator = "$lte";
            break;

          case ">":
            mongoOperator = "$gt";
            break;

          case ">=":
            mongoOperator = "$gte";
            break;
        }

        const whereValue =
          curr.field === "_id" ? { $oid: curr.value } : curr.value;

        return {
          ...prev,
          [curr.field]: {
            [mongoOperator]: whereValue,
          },
        };
      }, {});
    }

    let results: any[] = [];

    switch (queryDescription.type) {
      case "drop":
        await collection.deleteMany({});
        break;

      case "insert":
        const defaultedValues = queryDescription.schema.defaults;
        let values = Array.isArray(queryDescription.values)
          ? queryDescription.values!
          : [queryDescription.values!];

        values = values.map((record) => {
          let timestamps = {};

          if (queryDescription.schema.timestamps) {
            timestamps = {
              createdAt: new Date(),
              updatedAt: new Date(),
            };
          }

          return { ...defaultedValues, ...record, ...timestamps };
        });

        const insertedRecords: { $oid: string }[] = await collection.insertMany(
          values
        );

        const recordIds = insertedRecords.map((record) => record.$oid);
        return await queryDescription.schema.find(recordIds);

      case "select":
        const selectFields: Object[] = [];

        if (queryDescription.whereIn) {
          wheres[queryDescription.whereIn.field] = {
            $in:
              queryDescription.whereIn.field === "_id"
                ? queryDescription.whereIn.possibleValues.map((value) => ({
                    $oid: value,
                  }))
                : queryDescription.whereIn.possibleValues,
          };
        }

        selectFields.push({
          $match: wheres,
        });

        if (queryDescription.select) {
          selectFields.push({
            $project: queryDescription.select.reduce((prev: Object, curr) => {
              if (typeof curr === "string") {
                return {
                  ...prev,
                  [curr]: 1,
                };
              } else {
                const [field, alias] = Object.entries(curr)[0];
                return {
                  ...prev,
                  [alias]: field,
                };
              }
            }, {}),
          });
        }

        if (queryDescription.joins) {
          const join = queryDescription.joins[0];
          selectFields.push({
            $lookup: {
              from: join.joinTable,
              localField: join.originField,
              foreignField: "_id",
              as: join.targetField,
            },
          });
        }

        if (queryDescription.orderBy) {
          selectFields.push({
            $sort: Object.entries(queryDescription.orderBy).reduce(
              (prev, [field, orderDirection]) => {
                return {
                  ...prev,
                  [field]: orderDirection === "asc" ? 1 : -1,
                };
              },
              {}
            ),
          });
        }

        if (queryDescription.groupBy) {
          selectFields.push({
            $group: {
              _id: `$${queryDescription.groupBy}`,
            },
          });
        }

        if (queryDescription.limit) {
          selectFields.push({ $limit: queryDescription.limit });
        }

        if (queryDescription.offset) {
          selectFields.push({ $skip: queryDescription.offset });
        }

        results = await collection.aggregate(selectFields);
        break;

      case "update":
        await collection.updateMany(wheres, { $set: queryDescription.values! });
        break;

      case "delete":
        await collection.deleteMany(wheres);
        break;

      case "count":
        return [{ count: await collection.count(wheres) }];

      case "avg":
        return await collection.aggregate([
          { $match: wheres },
          {
            $group: {
              _id: null,
              avg: { $avg: `$${queryDescription.aggregatorField}` },
            },
          },
        ]);

      case "max":
        return await collection.aggregate([
          { $match: wheres },
          {
            $group: {
              _id: null,
              max: { $max: `$${queryDescription.aggregatorField}` },
            },
          },
        ]);

      case "min":
        return await collection.aggregate([
          { $match: wheres },
          {
            $group: {
              _id: null,
              min: { $min: `$${queryDescription.aggregatorField}` },
            },
          },
        ]);

      case "sum":
        return await collection.aggregate([
          { $match: wheres },
          {
            $group: {
              _id: null,
              sum: { $sum: `$${queryDescription.aggregatorField}` },
            },
          },
        ]);

      default:
        throw new Error(`Unknown query type: ${queryDescription.type}.`);
    }

    results = results.map((result) => {
      const formattedResult: { [k: string]: any } = {};

      for (const [field, value] of Object.entries(result)) {
        if (field === "_id") {
          formattedResult._id = (value as { $oid?: string })?.$oid || value;
        } else if ((value as { $date?: { $numberLong: number } }).$date) {
          formattedResult[field] = new Date((value as any).$date.$numberLong);
        } else {
          formattedResult[field] = value;
        }
      }

      return formattedResult;
    });

    return results;
  }

  async close() {
    if (!this._connected) {
      return;
    }

    this._connected = false;
  }
}
