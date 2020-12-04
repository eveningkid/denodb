import { getMySQLConnection } from "../../../connection.ts";
import { assertEquals } from "../../../deps.ts";

Deno.test("MySQL: Connection", async function () {
  const connection = getMySQLConnection();
  const ping = await connection.ping();
  await connection.close();

  assertEquals(ping, true);
});
