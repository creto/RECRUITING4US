import { AsyncLocalStorage } from "node:async_hooks";

export type QueryFn = (text: string, params?: unknown[]) => Promise<unknown[]>;

const store = new AsyncLocalStorage<QueryFn>();
let tail: Promise<void> = Promise.resolve();

/** The query function bound to the current transaction, if any. */
export function currentQuery(): QueryFn | undefined {
  return store.getStore();
}

/** Run work one-at-a-time so a transaction is not interleaved on one connection. */
export function runExclusive<T>(fn: () => Promise<T>): Promise<T> {
  const run = tail.then(fn, fn);
  tail = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

export function bindQuery<T>(query: QueryFn, fn: () => Promise<T>): Promise<T> {
  return store.run(query, fn);
}
