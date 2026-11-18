import { describe, it, expect } from "vitest";
import { buildAccounts } from "./bchile.js";

const mv = [{ date: "01-01-2026", description: "x", amount: -1, balance: 0, source: "account" as const }];

describe("buildAccounts", () => {
  it("falls back to a single account when no saldos", () => {
    expect(buildAccounts([], 5, mv)).toEqual([{ balance: 5, movements: mv }]);
  });
  it("keeps one entry per currency and attaches movements to the CLP checking account", () => {
    const r = buildAccounts([
      { label: "CUENTA_VISTA 1", currency: "CLP", balance: 10 },
      { label: "CUENTA_CORRIENTE 2", currency: "CLP", balance: 20 },
      { label: "CUENTA_CORRIENTE 3", currency: "USD", balance: 30 },
    ], undefined, mv);
    expect(r.map(a => [a.currency, a.balance, a.movements.length])).toEqual([["CLP", 10, 0], ["CLP", 20, 1], ["USD", 30, 0]]);
  });
});
