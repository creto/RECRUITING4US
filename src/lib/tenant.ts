import { AsyncLocalStorage } from "node:async_hooks";

export type TenantScope = {
  companyId?: string;
  userId?: string;
  publicSlug?: string;
};

const store = new AsyncLocalStorage<TenantScope>();

// enterWith inside a callee does not survive that callee's return once a query
// has crossed a worker boundary. The active request object does. Server code
// registers this bridge so a later query in the same request still sees the scope.
let readRequest: (() => TenantScope | undefined) | undefined;
let writeRequest: ((scope: TenantScope) => void) | undefined;

export function bindRequestTenant(
  read: () => TenantScope | undefined,
  write: (scope: TenantScope) => void,
) {
  readRequest = read;
  writeRequest = write;
}

function requestScope(): TenantScope | undefined {
  try {
    return readRequest?.();
  } catch {
    return undefined;
  }
}

export function currentTenant(): TenantScope | undefined {
  return requestScope() ?? store.getStore();
}

/** Bind tenant facts for the rest of this request. Later fields replace earlier ones. */
export function enterTenant(scope: TenantScope) {
  const next = { ...(requestScope() ?? store.getStore()), ...scope };
  store.enterWith(next);
  try {
    writeRequest?.(next);
  } catch {
    // No request to attach to (tests, startup). The async store still applies.
  }
}
