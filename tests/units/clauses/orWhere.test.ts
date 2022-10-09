import { DataTypes, Model } from "../../../mod.ts";
import { getSQLiteConnection } from "../../connection.ts";
import { assertEquals } from "../../deps.ts";

class User extends Model {
  static table = "users";

  static fields = {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: DataTypes.STRING,
    age: DataTypes.INTEGER,
  };
}

async function createConnection() {
  const connection = getSQLiteConnection({}, false);

  connection.link([User]);

  await connection.sync({ drop: true });

  return connection;
}

Deno.test("Model.orWhere()", async () => {
  const conn = await createConnection();

  await User.create({
    name: "User name 1",
    age: 23,
  });

  await User.create({
    name: "User name 2",
    age: 40,
  });

  const users = await User
    .select("id")
    .where({ name: "User name 1" })
    .orWhere({ age: 40 })
    .get();

  await conn.close();

  assertEquals(
    JSON.stringify(users),
    JSON.stringify([{ id: 1 }, { id: 2 }]),
  );
});
