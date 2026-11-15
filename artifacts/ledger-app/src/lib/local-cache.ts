const KEYS = {
  customers: "lp_cache_customers",
  transactions: "lp_cache_transactions",
  meta: "lp_cache_meta",
};

export interface CacheMeta {
  savedAt: string;
  customerCount: number;
  transactionCount: number;
}

export function saveToLocalCache(customers: unknown[], transactions: unknown[]): boolean {
  try {
    localStorage.setItem(KEYS.customers, JSON.stringify(customers));
    localStorage.setItem(KEYS.transactions, JSON.stringify(transactions));
    const meta: CacheMeta = {
      savedAt: new Date().toISOString(),
      customerCount: customers.length,
      transactionCount: transactions.length,
    };
    localStorage.setItem(KEYS.meta, JSON.stringify(meta));
    return true;
  } catch {
    return false;
  }
}

export function loadFromLocalCache(): {
  customers: unknown[];
  transactions: unknown[];
  meta: CacheMeta | null;
} {
  try {
    const customers = JSON.parse(localStorage.getItem(KEYS.customers) ?? "[]");
    const transactions = JSON.parse(localStorage.getItem(KEYS.transactions) ?? "[]");
    const meta: CacheMeta | null = JSON.parse(localStorage.getItem(KEYS.meta) ?? "null");
    return { customers, transactions, meta };
  } catch {
    return { customers: [], transactions: [], meta: null };
  }
}

export function getLocalCacheMeta(): CacheMeta | null {
  try {
    return JSON.parse(localStorage.getItem(KEYS.meta) ?? "null");
  } catch {
    return null;
  }
}

export function clearLocalCache() {
  Object.values(KEYS).forEach((k) => localStorage.removeItem(k));
}
