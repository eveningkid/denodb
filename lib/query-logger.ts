export type LogHandler = (query: string, execTime?: number) => void;
export interface LoggerOptions {
  queryLogger: LogHandler;
}

export class QueryLogger {
  private static _single: QueryLogger;
  private _logger: LogHandler;
  constructor(logger: LogHandler) {
    this._logger = logger;
  }

  static init(logger: LogHandler) {
    if (this._single) {
      return this._single;
    }
    this._single = new QueryLogger(logger);
    return this._single;
  }

  static start(): Date {
    const start = new Date();
    return start;
  }

  static end(start: Date, query: string) {
    if (!this._single) return;
    const end = new Date();
    const execTime = end.getTime() - start.getTime();
    this._single._logger(query, execTime);
  }
}
