<img src="./design/logo.png" height="150" />

# DenoDB

- 🗣Supports PostgreSQL, MySQL (5.5) and SQLite3
- 🔥Simple, typed API
- 🦕Deno-ready

> DenoDB relies extensively on the available database clients. DenoDB works as an abstract API based on top of these clients. Better support for more databases will come whenever new third-party clients are released.

```typescript
import { DataTypes, Database, Model } from 'https://deno.land/x/denodb/mod.ts';

const db = new Database('postgres', {
  host: '...',
  username: 'user',
  password: 'password',
  database: 'airlines',
});

class Flight extends Model {
  static table = 'flights';
  static timestamps = true;

  static fields = {
    id: {
      primaryKey: true,
      autoIncrement: true,
    },
    departure: DataTypes.STRING,
    destination: DataTypes.STRING,
    flightDuration: DataTypes.FLOAT,
  };

  static defaults = {
    flightDuration: 2.5,
  };
}

db.link([Flight]);

await db.sync({ drop: true });

await Flight.create([
  {
    departure: 'Paris',
    destination: 'Tokyo',
  },
  {
    departure: 'London',
    destination: 'San Francisco',
  },
]);

await Flight.select('destination').all();
// [ { destination: "Tokyo" }, { destination: "San Francisco" } ]

await Flight.where('destination', 'Tokyo').delete();

await Flight.all();
// [
//  {
//    id: 2,
//    departure: "London",
//    destination: "San Francisco",
//    flightDuration: 2.5,
//    created_at: 2020-05-17T13:16:32.333Z,
//    updated_at: 2020-05-17T13:16:32.333Z
//   }
// ]

await Flight.select('destination').find('2');
// [ { destination: "San Francisco" } ]

await Flight.count();
// 1

await Flight.select('id', 'destination').orderBy('id').get();
// [ { id: "2", destination: "San Francisco" } ]

await db.close();
```

## Documentation

- [First steps](#first-steps)
- [Clients](#clients)
  - [SQLite](#sqlite)
  - [MySQL](#mysql)
  - [PostgreSQL](#postgresql)
- [Data types](#data-types)
- [Fields descriptors](#fields-descriptors)
- [Model methods](#model-methods)
- [Relationships](#relationships)
  - [Belongs To](#belongs-to)
  - [One-to-one](#one-to-one)
  - [One-to-many](#one-to-many)
  - [Many-to-many](#many-to-many)

### First steps

Setting up your database with DenoDB is a four-step process:

- **Create a database**, using `Database` (learn more [about clients](#clients)):
  ```typescript
  const db = new Database('postgres', {
    host: '...',
    username: 'user',
    password: 'password',
    database: 'airlines',
  });
  ```
- **Create models**, extending `Model`. `table` and `fields` are both required static attributes:

  ```typescript
  class User extends Model {
    static table = 'users';
    static timestamps = true;

    static fields = {
      id: {
        primaryKey: true,
        autoIncrement: true,
      },
      name: DataTypes.STRING,
      email: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
        length: 50,
      },
    };
  }
  ```

- **Link your models**, to add them to your database instance:
  ```typescript
  db.link([User]);
  ```
- Optional: **Create tables in your database**, by using `sync(...)`:
  ```typescript
  await db.sync();
  ```
- **Query your models!**
  ```typescript
  await User.create({ name: 'Amelia' });
  await User.all();
  await User.deleteById('1');
  ```

### Clients

#### SQLite

Based on [Deno SQLite](https://deno.land/x/sqlite).

```typescript
const db = new Database('sqlite3', {
  filepath: './database.sqlite',
});
```

#### MySQL

Based on [deno_mysql](https://deno.land/x/mysql).

```typescript
const db = new Database('mysql', {
  database: 'my-database',
  host: 'https://url-to-db.com',
  username: 'username',
  password: 'password',
  port: 64, // optional
});
```

#### PostgreSQL

Based on [deno-postgres](https://deno.land/x/postgres).

```typescript
const db = new Database('postgres', {
  database: 'my-database',
  host: 'https://url-to-db.com',
  username: 'username',
  password: 'password',
  port: 64, // optional
});
```

### Fields types

| Type        | `DataTypes.?` | Example                                                            |
| ----------- | ------------- | ------------------------------------------------------------------ |
| Big Integer | `BIG_INTEGER` | `account: DataTypes.BIG_INTEGER`                                   |
| Integer     | `INTEGER`     | `id: DataTypes.INTEGER`                                            |
| Decimal     | `DECIMAL`     | `balance: { type: DataTypes.DECIMAL, precision?: 2, scale?: 4 }`   |
| Float       | `FLOAT`       | `balance: DataTypes.FLOAT`                                         |
| Uuid        | `UUID`        | `id: DataTypes.UUID`                                               |
| Boolean     | `BOOLEAN`     | `isActive: DataTypes.BOOLEAN`                                      |
| Binary      | `BINARY`      | `isActive: DataTypes.BINARY`                                       |
| Enum        | `ENUM`        | `status: { type: DataTypes.ENUM, values: ["active", "canceled"] }` |
| String      | `STRING`      | `name: { type: DataTypes.STRING, lengh: 20 }`                      |
| Text        | `TEXT`        | `description: DataTypes.TEXT`                                      |
| Date        | `DATE`        | `registeredAt: DataTypes.DATE`                                     |
| Datetime    | `DATETIME`    | `registeredAt: DataTypes.DATETIME`                                 |
| Time        | `TIME`        | `registeredAt: DataTypes.TIME`                                     |
| Timestamp   | `TIMESTAMP`   | `registeredAt: DataTypes.TIMESTAMP`                                |
| JSON        | `JSON`        | `credentials: DataTypes.JSON`                                      |
| JSONB       | `JSONB`       | `credentials: DataTypes.JSONB`                                     |

### Fields descriptors

A field can simply be defined as such: `field: DataTypes.TYPE`, but in some cases you might need a primary key or a given length for this field.

Here is a list of all the field descriptors available:

| Descriptor               | Object attribute | Example                          |
| ------------------------ | ---------------- | -------------------------------- |
| Type                     | `type`           | `type: DataTypes.STRING`         |
| Primary key              | `primaryKey`     | `primaryKey: true`               |
| Unique                   | `unique`         | `unique: true`                   |
| Auto increment           | `autoIncrement`  | `autoIncrement: true`            |
| Length                   | `length`         | `length: 64`                     |
| Allow null/is nullable   | `allowNull`      | `allowNull: false`               |
| Precision (for decimals) | `precision`      | `precision: 3`                   |
| Scale (for decimals)     | `scale`          | `scale: 2`                       |
| Values (for enums)       | `values`         | `values: ["active", "canceled"]` |

### Model methods

The following section only shows some examples for each method. The methods signatures can easily be found through your editor intellisense.

- [all](#all)
- [avg](#avg)
- [count](#count)
- [create](#create)
- [delete](#delete)
- [deleteById](#deleteById)
- [field](#field)
- [find](#find)
- [first](#first)
- [get](#get)
- [join](#join)
- [max](#max)
- [min](#min)
- [orderBy](#orderBy)
- [select](#select)
- [sum](#sum)
- [take](#take)
- [update](#update)
- [where](#where)

#### all

Fetch all the model records. It works just as `get` but is more readable when you intend to fetch _all_ records for a model.

```typescript
await Flight.all();
await Flight.select('departure').all();
```

#### avg

Compute the average value of a field's values from all the selected records.

```typescript
await Flight.avg('flightDuration');
await Flight.where('destination', 'San Francisco').avg('flightDuration');
```

#### count

Count the number of records of a model or filtered by a field name.

```typescript
await Flight.count();
await Flight.where('destination', 'Dublin').count();
```

#### create

Create one or multiple records in the current model.

```typescript
await Flight.create({ departure: "Paris", destination: "Tokyo" });
await Flight.create([{ ... }, { ... }]);
```

#### delete

Delete selected records.

```typescript
await Flight.where('destination', 'Paris').delete();
```

#### deleteById

Delete a record by a primary key value.

```typescript
await Flight.deleteById('1');
```

#### field

Return the table name followed by a field name. Passing a second parameter works as the `AS` SQL keyword.

```typescript
await Flight.select(Flight.field('departure', 'flight_departure')).all();
```

#### find

Find one or multiple records based on the model primary key. The value type **must** match the primary key type.

```typescript
await Flight.find('64');
// Find a flight where the `id` = '64' because the primary key is `id`
```

#### first

Return the first record that matches the current query. Sugar version of `take(1)`.

```typescript
await Flight.where('id', '>', '1').first();
```

#### get

Run the current query.

```typescript
await Flight.select('departure').get();
```

#### join

Join a table to the current query. You might need to use `field` in case field names are overlapping (which might happen with `id`s).

```typescript
await Flight.where(Flight.field('departure'), 'Paris')
  .join(Airport, Airport.field('id'), Flight.field('airportId'))
  .get();
```

#### max

Find the maximum value of a field from all the selected records.

```typescript
await Flight.max('flightDuration');
```

#### min

Find the minimum value of a field from all the selected records.

```typescript
await Flight.min('flightDuration');
```

#### orderBy

Order query results based on a field name and an optional direction. It will order in ascending order by default.

```typescript
await Flight.orderBy('departure').all();
await Flight.orderBy('departure', 'desc').all();
await Flight.orderBy('departure', 'asc').all();
```

#### select

Indicate which fields should be returned/selected from the query.

```typescript
await Flight.select('id').all();
await Flight.select('id', 'destination').all();
```

#### sum

Compute the sum of a field's values from all the selected records.

```typescript
await Flight.sum('flightDuration');
```

#### take

Limit the number of results returned from the query.

```typescript
await Flight.take(10).get();
```

#### update

Update one or multiple records. Also update `updated_at` if `timestamps` is `true`.

```typescript
await Flight.where('departure', 'Dublin').update('departure', 'Tokyo');
await Flight.where('departure', 'Dublin').update({ destination: 'Tokyo' });
await Flight.where('id', '64').update({ destination: 'Tokyo' });
```

#### where

Add a `WHERE` clause to your query.

```typescript
await Flight.where('id', '1').get();
await Flight.where('id', '>', '1').get();
await Flight.where({ id: '1', departure: 'Paris' }).get();
```

### Relationships

#### Belongs To

```typescript
import {
  Database,
  DataTypes,
  Model,
  Relationships,
} from 'https://deno.land/x/denodb/mod.ts';

const db = new Database('sqlite3', {
  filepath: './database.sqlite',
});

class Owner extends Model {
  static table = 'owners';

  static fields = {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    name: DataTypes.STRING,
  };

  // Fetch a business binded to this owner
  static business() {
    return this.hasOne(Business);
  }
}

class Business extends Model {
  static table = 'businesses';

  static fields = {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    name: DataTypes.STRING,

    // Convention is "modelName" followed by "Id"
    ownerId: Relationships.belongsTo(Owner),
  };
}

db.link([Business, Owner]);

await db.sync({ drop: true });

await Owner.create({
  id: '1',
  name: 'John',
});

await Business.create({
  id: '1',
  name: 'Parisian Café',
  ownerId: '1',
});

await Owner.where('id', '1').business();
// { id: "1", name: "Parisian Café", ownerId: 1 }

await db.close();
```

#### One-to-one

```typescript
import {
  Database,
  DataTypes,
  Model,
  Relationships,
} from 'https://deno.land/x/denodb/mod.ts';

const db = new Database('sqlite3', {
  filepath: './database.sqlite',
});

class Owner extends Model {
  static table = 'owners';

  static fields = {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    name: DataTypes.STRING,
  };

  // Fetch a business binded to this owner
  static business() {
    return this.hasOne(Business);
  }
}

class Business extends Model {
  static table = 'businesses';

  static fields = {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    name: DataTypes.STRING,
  };

  // Fetch an owner binded to this business
  static owner() {
    return this.hasOne(Owner);
  }
}

// Will automatically:
// - Add a `businessId` field to Owner
// - Add an `ownerId` field to Business
Relationships.oneToOne(Business, Owner);

db.link([Owner, Business]);

await db.sync({ drop: true });

await Owner.create({
  id: '1',
  name: 'John',
});

await Business.create({
  id: '1',
  name: 'Parisian Café',
  ownerId: '1',
});

// Bind the owner to this business
await Owner.where('id', '1').update({ businessId: '1' });

await Business.where('id', '1').owner();
// { id: "1", name: "John", businessId: 1 }

await Owner.where('id', '1').business();
// { id: "1", name: "Parisian Café", ownerId: 1 }

await db.close();
```

#### One-to-many

```typescript
import {
  Database,
  DataTypes,
  Model,
  Relationships,
} from 'https://deno.land/x/denodb/mod.ts';

const db = new Database('sqlite3', {
  filepath: './database.sqlite',
});

class Owner extends Model {
  static table = 'owners';

  static fields = {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    name: DataTypes.STRING,
  };

  static businesses() {
    return this.hasMany(Business);
  }
}

class Business extends Model {
  static table = 'businesses';

  static fields = {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    name: DataTypes.STRING,
    ownerId: Relationships.belongsTo(Owner),
  };

  static owner() {
    return this.hasOne(Owner);
  }
}

db.link([Owner, Business]);

await db.sync({ drop: true });

await Owner.create({
  id: '1',
  name: 'John',
});

await Business.create({
  id: '1',
  name: 'Parisian Café',
  ownerId: '1',
});

await Business.create({
  id: '2',
  name: 'Something About Us',
  ownerId: '1',
});

await Owner.where('id', '1').businesses();
// [
//   { id: "1", name: "Parisian Café", ownerId: 1 },
//   { id: "2", name: "Something About Us", ownerId: 1 }
// ]

await Business.where('id', '1').owner();
// { id: "1", name: "John" }

await Business.where('id', '2').owner();
// { id: "1", name: "John" }

await db.close();
```

#### Many-to-many

```typescript
import {
  Database,
  DataTypes,
  Model,
  Relationships,
} from 'https://deno.land/x/denodb/mod.ts';

const db = new Database('sqlite3', {
  filepath: './database.sqlite',
});

class Owner extends Model {
  static table = 'owners';

  static fields = {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    name: DataTypes.STRING,
  };

  static businesses() {
    return this.hasMany(Business);
  }
}

class Business extends Model {
  static table = 'businesses';

  static fields = {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    name: DataTypes.STRING,
  };

  static owners() {
    return this.hasMany(Owner);
  }
}

const BusinessOwner = Relationships.manyToMany(Business, Owner);

db.link([BusinessOwner, Business, Owner]);

await db.sync({ drop: true });

await Owner.create([
  {
    id: '1',
    name: 'John',
  },
  {
    id: '2',
    name: 'Sarah',
  },
]);

await Business.create([
  {
    id: '1',
    name: 'Parisian Café',
  },
  {
    id: '2',
    name: 'Something About Us',
  },
]);

await BusinessOwner.create([
  { businessId: '1', ownerId: '1' },
  { businessId: '1', ownerId: '2' },
  { businessId: '2', ownerId: '1' },
]);

console.log(await Owner.where('id', '1').businesses());
// [
//   { id: "1", businessId: 1, ownerId: 1, name: "Parisian Café" },
//   { id: "2", businessId: 2, ownerId: 1, name: "Something About Us" }
// ]

console.log(await Owner.where('id', '2').businesses());
// [ { id: "1", businessId: 1, ownerId: 2, name: "Parisian Café" } ]

console.log(await Business.where('id', '2').owners());
// [ { id: "1", businessId: 2, ownerId: 1, name: "John" } ]

await db.close();
```

## License

MIT License — [eveningkid](https://github.com/eveningkid)
