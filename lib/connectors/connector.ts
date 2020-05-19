/** Default connector options. */
export interface ConnectorOptions {}

/** Default connector client. */
export interface ConnectorClient {}

/** Connector interface for a database provider connection. */
export interface Connector {
  /** Client that maintains an external database connection. */
  _client: ConnectorClient;

  /** Options to connect to an external instance. */
  _options: ConnectorOptions;

  /** Is the client connected to an external instance. */
  _connected: boolean;

  /** Connect to an external database instance. */
  _makeConnection(): void;

  /** Execute a query on the external database instance. */
  query(query: string): Promise<any[]>;

  /** Execute queries within a transaction on the database instance. */
  transaction?(queries: string[]): Promise<any[]>;

  /** Disconnect from the external database instance. */
  close(): Promise<any>;
}
