import { getPostgreSQLPoolConnection } from "../../../connection.ts";
import { assertEquals } from "../../../deps.ts";

Deno.test("PostgreSQL: Connection", async function () {
  const connection = getPostgreSQLPoolConnection();
  const ping = await connection.ping();
  await connection.close();

  assertEquals(ping, true);
});
