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

## License

MIT License — [eveningkid](https://github.com/eveningkid)
