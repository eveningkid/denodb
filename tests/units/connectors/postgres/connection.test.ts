import { getPostgreSQLPoolConnection, getPostgreSQLConnection } from "../../../connection.ts";
import { assertEquals } from "../../../deps.ts";

Deno.test({ name: "PostgreSQL: Connection", sanitizeResources: false}, async function () {
  const connection = getPostgreSQLConnection();
  const ping = await connection.ping();
  await connection.close();

  assertEquals(ping, true);
});

Deno.test({ name: "PostgreSQL: Pool Connection", sanitizeResources: false}, async function () {
  const connection = getPostgreSQLPoolConnection();
  const ping = await connection.ping();
  await connection.close();

  assertEquals(ping, true);
});
