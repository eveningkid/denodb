<img src="./design/logo.png" height="150" />

# DenoDB

- 🗣Supports PostgreSQL, MySQL (5.5) and SQLite3
- 🔥Simple, typed API
- 🦕Deno-ready

> DenoDB relies extensively on the available database clients. DenoDB works as an abstract API based on top of these clients. Better support for more databases will come whenever new third-party clients are released.

```typescript
import { DATA_TYPES, Database, Model } from 'https://deno.land/x/denodb/mod.ts';

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
    departure: DATA_TYPES.STRING,
    destination: DATA_TYPES.STRING,
    flightDuration: DATA_TYPES.FLOAT,
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

> Relationships are not available for now. This is the next feature that will be added.

## Documentation

- [First steps](#first-steps)
- [Clients](#clients)
  - [SQLite](#sqlite)
  - [MySQL](#mysql)
  - [PostgreSQL](#postgresql)
- [Model methods](#model-methods)

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
      name: DATA_TYPES.STRING,
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
  port: 64, // Optional, defaults to 3306.
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
  port: 64, // Optional, defaults to 5432.
  returnOnInsert: false, // Optional, defaults to false.
});
```

### Model methods

The following section only shows some examples for each method. The methods signatures can easily be found through your editor intellisense.

- [DenoDB](#denodb)
  - [Documentation](#documentation)
    - [First steps](#first-steps)
    - [Clients](#clients)
      - [SQLite](#sqlite)
      - [MySQL](#mysql)
      - [PostgreSQL](#postgresql)
    - [Model methods](#model-methods)
      - [all](#all)
      - [avg](#avg)
      - [count](#count)
      - [create](#create)
      - [delete](#delete)
      - [deleteById](#deletebyid)
      - [field](#field)
      - [find](#find)
      - [first](#first)
      - [get](#get)
      - [join](#join)
      - [max](#max)
      - [min](#min)
      - [orderBy](#orderby)
      - [select](#select)
      - [sum](#sum)
      - [take](#take)
      - [update](#update)
      - [where](#where)
  - [License](#license)

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

## License

MIT License — [eveningkid](https://github.com/eveningkid)
