import type { QueryDescription } from "../query-builder.ts";
import { Translator } from "../translators/translator.ts";

/** Default connector options. */
export interface ConnectorOptions { }

/** Default pool options. */
export interface ConnectorPoolOptions { }

/** Default connector client. */
export interface ConnectorClient { }

/** Default connector pool. */
export interface ConnectorPool { }

/** Connector interface for a database provider connection. */
export interface Connector {
  /** Database dialect this connector is for. */
  readonly _dialect: string;

  /** Translator that converts queries to a database-specific command. */
  _translator: Translator;

  /** Client that maintains an external database connection. */
  _client?: ConnectorClient;

  /** Options to connect to an external instance. */
  _options: ConnectorOptions;

  /** Is the client connected to an external instance. */
  _connected?: boolean

  /** Is the optional pool for making connections to an external instance. */
  _pool?: ConnectorPool

  /** Gets the client or the pool connected to the database*/
  _getClientOrPool(): ConnectorPool | ConnectorClient

  /** Connect to an external database instance. */
  _makeConnection(): void | Promise<any>

  /** Gets the client connected to the database */
  getClient(): any

  /** Gets the pool connected to the database */
  getPool?(): any

  /** Test connection. */
  ping(): Promise<boolean>;

  /** Execute a query on the external database instance. */
  query(queryDescription: QueryDescription): Promise<any | any[]>;

  /** Execute queries within a transaction on the database instance. */
  transaction?(queries: () => Promise<void>): Promise<void>;

  /** Disconnect from the external database instance. */
  close(): Promise<any>;
}
