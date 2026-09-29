import { enterTenant } from "@/lib/tenant";
import { db } from "./db.server";
import { drainMail } from "./platform.server";
import { drain as drainOutbox } from "./workflows.server";

/** Companies with pending outbox rows or due mail intents (security-definer scan). */
export async function companiesNeedingDrain(): Promise<string[]> {
  const sql = await db();
  const rows = await sql<{ company_id: string }>`select company_id from app_companies_needing_drain()`;
  return rows.map((row) => row.company_id);
}

/** Outbox then mail for one company. Web request path still drains for low latency. */
export async function drainCompany(companyId: string): Promise<void> {
  enterTenant({ companyId, publicSlug: "" });
  await drainOutbox(companyId);
  await drainMail(companyId);
}

/**
 * One worker tick: discover due work across tenants, then drain each company.
 * Returns how many companies were touched (0 when idle).
 */
export async function drainDueWork(): Promise<{ companies: number }> {
  const ids = await companiesNeedingDrain();
  for (const companyId of ids) {
    await drainCompany(companyId);
  }
  return { companies: ids.length };
}
