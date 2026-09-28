import { AsyncLocalStorage } from "node:async_hooks";

export type TenantScope = {
  companyId?: string;
  userId?: string;
  publicSlug?: string;
};

const store = new AsyncLocalStorage<TenantScope>();

export function currentTenant(): TenantScope | undefined {
  return store.getStore();
}

/** Bind tenant facts for the rest of this request. Later fields replace earlier ones. */
export function enterTenant(scope: TenantScope) {
  store.enterWith({ ...store.getStore(), ...scope });
}
