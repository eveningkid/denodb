import { DATA_TYPES, Database, Model } from "../mod.ts";

Deno.test("No return on insert", async () => {
  const database: Database = new Database("postgres", {
    host: "127.0.0.1",
    port: 5432,
    username: "postgres",
    password: "",
    database: "test",
  });

  class UserModel extends Model {
    static table: string = "users";

    static timestamps: boolean = true;

    static fields = {
      id: {
        primaryKey: true,
        autoIncrement: true,
      },
      username: {
        type: DATA_TYPES.STRING,
        allowNull: false,
      },
      password: {
        type: DATA_TYPES.STRING,
        allowNull: false,
      },
    };
  }

  database.link([UserModel]);

  await database.sync({ drop: true });

  const username: string = "test";
  const password: string = "test";

  await UserModel.create({
    username,
    password,
  });

  await database.close();
});

Deno.test("Return on insert", async () => {
  const database: Database = new Database("postgres", {
    host: "127.0.0.1",
    port: 5432,
    username: "postgres",
    password: "",
    database: "test",
  });

  class UserModel extends Model {
    static table: string = "users";

    static timestamps: boolean = true;

    static fields = {
      id: {
        primaryKey: true,
        autoIncrement: true,
      },
      username: {
        type: DATA_TYPES.STRING,
        allowNull: false,
      },
      password: {
        type: DATA_TYPES.STRING,
        allowNull: false,
      },
    };
  }

  database.link([UserModel]);

  await database.sync({ drop: true });

  const username: string = "test";
  const password: string = "test";

  const insertedUser = await UserModel.create({
    username,
    password,
  }, {
    returnInsertedValue: true,
  });

  if (insertedUser[0].id !== 1) {
    throw Error("Returned user document should have an id of 1.");
  }

  await database.close();
});

Deno.test("Return some on insert", async () => {
  const database: Database = new Database("postgres", {
    host: "127.0.0.1",
    port: 5432,
    username: "postgres",
    password: "",
    database: "test",
  });

  class UserModel extends Model {
    static table: string = "users";

    static timestamps: boolean = true;

    static fields = {
      id: {
        primaryKey: true,
        autoIncrement: true,
      },
      username: {
        type: DATA_TYPES.STRING,
        allowNull: false,
      },
      password: {
        type: DATA_TYPES.STRING,
        allowNull: false,
      },
    };
  }

  database.link([UserModel]);

  await database.sync({ drop: true });

  const username: string = "test";
  const password: string = "test";

  const insertedUser = await UserModel.create({
    username,
    password,
  }, {
    returnInsertedValue: ["id", "username"],
  });

  if (insertedUser[0].id !== 1) {
    throw Error("Returned user document should have an id of 1.");
  }

  if (insertedUser[0].username !== username) {
    throw Error(
      `Returned user document should have an username of ${username}.`,
    );
  }

  if (insertedUser[0].password) {
    throw Error(
      `Returned user document should not have an password field.`,
    );
  }

  await database.close();
});

Deno.test("Return on multiple inserts", async () => {
  const database: Database = new Database("postgres", {
    host: "127.0.0.1",
    port: 5432,
    username: "postgres",
    password: "",
    database: "test",
  });

  class UserModel extends Model {
    static table: string = "users";

    static timestamps: boolean = true;

    static fields = {
      id: {
        primaryKey: true,
        autoIncrement: true,
      },
      username: {
        type: DATA_TYPES.STRING,
        allowNull: false,
      },
      password: {
        type: DATA_TYPES.STRING,
        allowNull: false,
      },
    };
  }

  database.link([UserModel]);

  await database.sync({ drop: true });

  const username: string = "test";
  const password: string = "test";

  const insertedUser = await UserModel.create([
    {
      username,
      password,
    },
    {
      username,
      password,
    },
    {
      username,
      password,
    },
  ], {
    returnInsertedValue: true,
  });

  if (insertedUser[0].id !== 1) {
    throw Error("Returned user 1 document should have an id of 1.");
  }

  if (insertedUser[1].id !== 2) {
    throw Error("Returned user 2 document should have an id of 2.");
  }

  if (insertedUser[2].id !== 3) {
    throw Error("Returned user 3 document should have an id of 3.");
  }

  await database.close();
});
