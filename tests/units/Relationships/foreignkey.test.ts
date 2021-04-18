import { DataTypes, Model, Relationships } from "../../../mod.ts";
import { getMySQLConnection } from "../../connection.ts";
import { assertEquals } from "../../deps.ts";

class Owner extends Model {
  static table = "foreignkeyowners";
  static timestamps = false;

  static fields = {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
    },
    name: DataTypes.STRING,
  };
}

class Business extends Model {
  static table = "foreignkeybusinesses";
  static timestamps = false;

  static fields = {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
    },
    name: DataTypes.STRING,
  };

  static owner() {
    return this.hasOne(Owner);
  }
}

Relationships.belongsTo(Business, Owner);

Deno.test("MySQL: Foreign key test", async function () {
  const connection = getMySQLConnection();

  connection.link([Owner, Business]);

  await connection.sync({ drop: false });

  await Owner.create({
    id: "1",
    name: "John",
  });

  await Business.create({
    id: "1",
    name: "Parisian Café",
    ownerId: "1",
  });

  const OwnerTest = await Business.where("id", "1").owner();

  await connection.close();

  assertEquals(
    JSON.stringify(OwnerTest),
    JSON.stringify({
      id: 1,
      name: "John",
    }),
  );
});
