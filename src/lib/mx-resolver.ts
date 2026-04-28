import dns from "node:dns/promises";
import type { MxRecord as DnsMxRecord } from "node:dns";
import type { MxRecord } from "./types";

interface CacheEntry {
  records: MxRecord[];
  expiry: number;
}

export class MxResolver {
  private cache = new Map<string, CacheEntry>();
  private ttlMs: number;

  constructor(ttlMs = 300_000) {
    this.ttlMs = ttlMs;
  }

  async resolve(domain: string): Promise<MxRecord[]> {
    const lower = domain.toLowerCase();

    const cached = this.cache.get(lower);
    if (cached && cached.expiry > Date.now()) {
      return cached.records;
    }

    let records: MxRecord[];

    try {
      const mxRecords = await dns.resolveMx(lower);
      records = mxRecords
        .map((r: DnsMxRecord) => ({
          exchange: r.exchange.toLowerCase(),
          priority: r.priority,
        }))
        .sort((a, b) => a.priority - b.priority);

      if (records.length === 0) {
        const aRecords = await dns.resolve4(lower);
        records = aRecords.map(() => ({
          exchange: lower,
          priority: 0,
        }));
      }
    } catch {
      try {
        const aRecords = await dns.resolve4(lower);
        records = aRecords.map(() => ({
          exchange: lower,
          priority: 0,
        }));
      } catch {
        records = [];
      }
    }

    this.cache.set(lower, {
      records,
      expiry: Date.now() + this.ttlMs,
    });

    return records;
  }

  clear(): void {
    this.cache.clear();
  }
}
