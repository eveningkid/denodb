# Migration Guide - Dialect to connector

> The Issue that suggested that [#121](https://github.com/eveningkid/denodb/issues/121)
>
> The PR with change [#126](https://github.com/eveningkid/denodb/pull/126)

## Why we change

We switched to this behavior, so you'll be able to use databases that we don't support out of the box (such as _redshift_).

## How to migrate

We wanted that the migration for the new behavior to be painless and familiar with the previous behavior.

Let's assume you have the following:

```typescript
import { Database } from 'https://deno.land/x/denodb/mod.ts';

const db = new Database('postgres', {
  host: '...',
  username: 'user',
  password: 'password',
  database: 'airlines',
});
```

To migrate, you only need to **replace the dialect (in this example is `'postgres'`) with its connector (`PostgresConnector`) and pass the options to the connector**:

```typescript
import { Database, PostgresConnector } from 'https://deno.land/x/denodb/mod.ts';

const connector = new PostgresConnector({
  host: '...',
  username: 'user',
  password: 'password',
  database: 'airlines',
});

const db = new Database(connector);
```

See! It's that easy to migrate.

If you need the `debug` option to be on, here is what you had before:

```typescript
import { Database } from 'https://deno.land/x/denodb/mod.ts';

const db = new Database(
  { dialect: 'postgres', debug: true },
  {
    host: '...',
    username: 'user',
    password: 'password',
    database: 'airlines',
  }
);
```

Let's do what we just did for the connector before and add the debug flag:

```typescript
import { Database, PostgresConnector } from 'https://deno.land/x/denodb/mod.ts';

const connector = new PostgresConnector({
  host: '...',
  username: 'user',
  password: 'password',
  database: 'airlines',
});

const db = new Database({
  connector,
  debug: true, // <-
});
```

And what if you get the database type from an environment variable or somewhere else? You can still keep it similar to what we had before:

```typescript
import { Database } from 'https://deno.land/x/denodb/mod.ts';

const db = new Database.forDialect('postgres', {
  host: '...',
  username: 'user',
  password: 'password',
  database: 'airlines',
});


// If you need to debug, replace 'postgres' with:
const db = new Database.forDialect({ dialect: 'postgres', debug: true }, {
  ...
});
```

## Disable the warning (not recommended)

You probably came here because you got the following:

```
[denodb]: DEPRECATION warning, the usage with dialect instead of connector is deprecated and will be removed in future versions.
[denodb]: If you want to disable this warning pass `disableDialectUsageDeprecationWarning: true` with the dialect in the Database constructor.
[denodb]: If you want to migrate to the current behavior, visit https://github.com/eveningkid/denodb/blob/master/docs/v1.0.21-migrations/connectors.md for help.
```

If you want to disable this warning and continue with the dialect behavior (not recommended), you can pass `disableDialectUsageDeprecationWarning: true` in the dialect options:

```typescript
import { Database } from 'https://deno.land/x/denodb/mod.ts';

const db = new Database(
  {
    dialect: 'postgres',
    disableDialectUsageDeprecationWarning: true,
  },
  {
    host: '...',
    username: 'user',
    password: 'password',
    database: 'airlines',
  }
);
```
