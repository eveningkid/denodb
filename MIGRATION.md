# Migration Guide

## Dialect to connector
> The Issue that suggested that [#121](https://github.com/eveningkid/denodb/issues/121)
>
> The PR with change [#126](https://github.com/eveningkid/denodb/pull/126)

### Why we change
We switched to this behavior, so you'll be able to use databases that we don't support out of the box (such as _redshift_).

### How to migrate
We wanted that the migration for the new behavior will be painless and familiar with the previous behavior.

Let's assume you have something like that:
```typescript
import { DataTypes, Database, Model } from 'https://deno.land/x/denodb/mod.ts';

const db = new Database('postgres', {
  host: '...',
  username: 'user',
  password: 'password',
  database: 'airlines',
});
```

To migrate, you only need to replace the dialect (in this example is `'postgres'`) with his connector (`PostgresConnector`) and pass the options to the connector, like this:
```typescript
import { DataTypes, Database, Model, PostgresConnector } from 'https://deno.land/x/denodb/mod.ts';

const db = new Database(new PostgresConnector({
  host: '...',
  username: 'user',
  password: 'password',
  database: 'airlines',
}));
```
See! it's that easy to migrate

If you want to debug, here is the previous Usage:
```typescript
import { DataTypes, Database, Model } from 'https://deno.land/x/denodb/mod.ts';

const db = new Database({dialect: 'postgres', debug: true}, {
  host: '...',
  username: 'user',
  password: 'password',
  database: 'airlines',
});
```

To migrate you need to do the same as before for the connector and add debug flag just like this:
```typescript
import { DataTypes, Database, Model, PostgresConnector } from 'https://deno.land/x/denodb/mod.ts';

const db = new Database({
  connector: new PostgresConnector({
    host: '...',
    username: 'user',
    password: 'password',
    database: 'airlines',
  }),
  debug: true // <-
});
```

And what if you get the database type from environment variables or else? we got you covered too:
```typescript
import { DataTypes, Database, Model, connectorFactory } from 'https://deno.land/x/denodb/mod.ts';

// If you want to debug so instead of 'postgres' pass {dialect: 'postgres', debug: true}
const db = new Database.forDialect('postgres', {
  host: '...',
  username: 'user',
  password: 'password',
  database: 'airlines',
});
```

### Disable the warning (not recommended)
You probably came here because you got the warning
```
[denodb]: DEPRECATION warning, the usage with dialect instead of connector is deprecated and will be removed in future versions.
[denodb]: If you want to disable this warning pass `disableDialectUsageDeprecationWarning: true` with the dialect in the Database constructor.
[denodb]: If you want to migrate to the current behavior, visit https://github.com/eveningkid/denodb/blob/master/MIGRATION.md#dialect-to-connector for help.
```
If you want to disable this warning and continue with the dialect behavior (not recommended) you can pass `disableDialectUsageDeprecationWarning: true` in the dialect options

**Example:**
```typescript
import { DataTypes, Database, Model } from 'https://deno.land/x/denodb/mod.ts';

const db = new Database({
  dialect: 'postgres',
  disableDialectUsageDeprecationWarning: true
}, {
  host: '...',
  username: 'user',
  password: 'password',
  database: 'airlines',
});
```

