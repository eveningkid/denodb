import { DataTypes, Model } from "../../../mod.ts";
import { getMySQLConnection } from "../../connection.ts";
import { assertEquals } from "../../deps.ts";

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

Deno.test("MySQL - Update test", async function () {
  const connection = getMySQLConnection();

  await connection.link([Article]);

  await connection.sync({ drop: false });

  await Article.create({
    title: "Hello world !",
    content: "first articlE !",
  });

  await Article.where({ id: 1 }).update({ content: "first article !" });

  const article = await Article.where({ id: 1 }).first();

  await connection.close();

  assertEquals(
    JSON.stringify(article),
    JSON.stringify({
      id: 1,
      title: "Hello world !",
      content: "first article !",
    }),
  );
});
