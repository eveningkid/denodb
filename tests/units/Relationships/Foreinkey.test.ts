import { DataTypes, Model, Relationships } from "../../../mod.ts";
import { ConnectionMySQL } from "../../connection.ts";
import { assertEquals } from "../../deps.ts";

class Owner extends Model {
  static table = "foreinkeyowners";

  static fields = {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
    },
    name: DataTypes.STRING,
  };
}

class Business extends Model {
  static table = "foreinkeybusinesses";

  static fields = {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
    },
    name: DataTypes.STRING,
    ownerId: Relationships.belongsTo(Owner),
  };

  static owner() {
    return this.hasOne(Owner);
  }
}

Deno.test("MySQL - Forein Key test", async function () {
  const connection = ConnectionMySQL();

  await connection.link([Owner, Business]);

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

  delete OwnerTest.updatedAt;
  delete OwnerTest.createdAt;

  await connection.close();

  assertEquals(
    JSON.stringify(OwnerTest),
    JSON.stringify({
      id: 1,
      name: "John",
    }),
  );
});
