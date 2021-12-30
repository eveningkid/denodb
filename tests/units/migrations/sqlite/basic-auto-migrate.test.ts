import { DataTypes, Model } from "../../../../mod.ts";
import { getSQLiteConnection } from "../../../connection.ts";
import { assertEquals } from "../../../deps.ts";

Deno.test("SQLite: Auto-Migration add, remove", async function () {
  let db = getSQLiteConnection(false);

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

  db.link([Flight]);
  // Should create all required fields in database
  await db.experimentalAutoMigrate();

  await Flight.create({
    departure: "PIT",
    destination: "LAX",
    flightDuration: 5.333333,
  });

  const [flight] = await Flight.where("id", "=", 1).get() as Flight[];

  assertEquals(flight.departure, "PIT");
  assertEquals(flight.destination, "LAX");
  assertEquals(flight.flightDuration, 5.333333);
  assertEquals(flight.airline, undefined);
  assertEquals(flight.flightNum, undefined);

  await db.close();

  class Flight2 extends Model {
    static table = "flights";
    static timestamps = true;

    static fields = {
      id: { primaryKey: true, autoIncrement: true },
      departure: DataTypes.STRING,
      destination: DataTypes.STRING,
      flightDuration: DataTypes.FLOAT,
      // Add in 2 new fields
      airline: DataTypes.STRING,
      flightNum: { type: DataTypes.STRING, allowNull: true, unique: true },
    };

    static defaults = {
      flightDuration: 2.5,
    };
  }

  // Get a new connection
  db = getSQLiteConnection(false);

  db.link([Flight2]);

  // Should now add 2 new fields
  await db.experimentalAutoMigrate();

  await Flight2.create({
    departure: "PIT",
    destination: "LAX",
    flightDuration: 5.333333,
    airline: "Delta",
    flightNum: "DAL8954",
  });

  const [flight2] = await Flight2.where("id", "=", 2).get() as Flight2[];

  assertEquals(flight2.departure, "PIT");
  assertEquals(flight2.destination, "LAX");
  assertEquals(flight2.flightDuration, 5.333333);
  assertEquals(flight2.airline, "Delta");
  assertEquals(flight2.flightNum, "DAL8954");

  await db.close();

  // TODO: When dropColumn is fixed this should
  // also pass

  // class Flight3 extends Model {
  //   static table = "flights";
  //   static timestamps = true;

  //   static fields = {
  //     id: { primaryKey: true, autoIncrement: true },
  //     departure: DataTypes.STRING,
  //     destination: DataTypes.STRING,
  //     // Remove duration
  //     airline: DataTypes.STRING,
  //     flightNum: { type: DataTypes.STRING, allowNull: true, unique: true },
  //   };
  // }

  // // Get a new connection
  // db = getSQLiteConnection(false);

  // db.link([Flight3]);

  // // Should now remove the duration field
  // await db.experimentalAutoMigrate();

  // await Flight3.create({
  //   departure: "PIT",
  //   destination: "LAX",
  //   airline: "Delta",
  //   flightNum: "DAL8955",
  // });

  // const [flight3] = await Flight3.where("id", "=", 3).get() as Flight3[];

  // assertEquals(flight3.departure, "PIT");
  // assertEquals(flight3.destination, "LAX");
  // assertEquals(flight3.flightDuration, undefined);
  // assertEquals(flight3.airline, "Delta");
  // assertEquals(flight3.flightNum, "DAL8955");

  // await db.close();
});
