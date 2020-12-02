import { DataTypes, Model } from "../../../mod.ts";
import { ConnectionMySQL } from "../../connection.ts";
import { assertEquals } from "../../deps.ts";

Deno.test("MySQL One Model", async function () {
  const connection = ConnectionMySQL();

  class Flight extends Model {
    static table = "flights";
    static timestamps = true;

    static fields = {
      id: { primaryKey: true, autoIncrement: true },
      departure: DataTypes.STRING,
      destination: DataTypes.STRING,
      flightDuration: DataTypes.FLOAT,
    };

    static defaults = {
      flightDuration: 2.5,
    };
  }

  connection.link([Flight]);

  await connection.sync({ drop: false });

  await Flight.create({
    departure: "Paris",
    destination: "Tokyo",
  });

  // Get
  const result = await Flight.where({ departure: "Paris" }).first();

  await connection.close();

  delete result.updatedAt;
  delete result.createdAt;

  assertEquals(
    JSON.stringify(result),
    JSON.stringify({
      id: 1,
      departure: "Paris",
      destination: "Tokyo",
      flightDuration: 2.5,
    }),
  );
});
