import { DataTypes, Model } from "../../../../mod.ts";
import { getSQLiteConnection } from "../../../connection.ts";
import { assertEquals } from "../../../deps.ts";

class Article extends Model {
  static table = "updatearticle";
  static timestamps = false;

  static fields = {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    title: DataTypes.STRING,
    content: DataTypes.TEXT,
  };
}

Deno.test("SQLite: Response model", async () => {
  const connection = getSQLiteConnection();

  connection.link([Article]);

  await connection.sync({ drop: true });

  const createResponse = await Article.create({
    title: "Hello world!",
    content: "first article!",
  });

  assertEquals(
    JSON.stringify(createResponse),
    JSON.stringify({
      affectedRows: 1,
      lastInsertId: 1,
    }),
    "Insert response",
  );

  const selectResponse = await Article.select("id")
    .where({ title: "Hello world!" }).get();

  assertEquals(
    JSON.stringify(selectResponse),
    JSON.stringify([{ id: 1 }]),
    "Expected one article",
  );

  const updateResponse = await Article.where({ id: 1 })
    .update({ title: "Hello there!" });

  assertEquals(
    JSON.stringify(updateResponse),
    JSON.stringify({ affectedRows: 1 }),
    "Update response",
  );

  const deleteResponse = await Article.deleteById(1);

  assertEquals(
    JSON.stringify(deleteResponse),
    JSON.stringify({ affectedRows: 1 }),
    "Delete response",
  );

  const createManyResponse = await Article.create([
    { title: "hola mundo!", content: "primer articulo!" },
    { title: "hola mundo!", content: "first article!" },
  ]);

  assertEquals(
    JSON.stringify(createManyResponse),
    JSON.stringify({ affectedRows: 2, lastInsertId: 3 }),
    "Insert many records response",
  );

  const updateManyResponse = await Article.where({ title: "hola mundo!" })
    .update({ content: "updated" });

  assertEquals(
    JSON.stringify(updateManyResponse),
    JSON.stringify({ affectedRows: 2 }),
    "Update many records response",
  );

  const articleCount = await Article.where({ title: "hola mundo!" }).count();

  assertEquals(articleCount, 2, "Return article count");

  const deleteManyResponse = await Article.where({ title: "hola mundo!" })
    .delete();

  assertEquals(
    JSON.stringify(deleteManyResponse),
    JSON.stringify({ affectedRows: 2 }),
    "Delete many records response",
  );

  const selectEmptyResponse = await Article.all();

  assertEquals(
    JSON.stringify(selectEmptyResponse),
    JSON.stringify([]),
    "Select expected empty response",
  );

  await connection.close();
});
