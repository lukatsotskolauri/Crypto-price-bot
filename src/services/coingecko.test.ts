import { describe, it, expect, vi, afterEach } from "vitest";
import { resolveCoin } from "./coingecko.js";

function mockFetch(coins: unknown[]) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ coins }),
    }),
  );
}

describe("resolveCoin – hardcoded map", () => {
  it("resolves btc to bitcoin", async () => {
    expect(await resolveCoin("btc")).toBe("bitcoin");
  });

  it("resolves eth to ethereum (case-insensitive)", async () => {
    expect(await resolveCoin("ETH")).toBe("ethereum");
  });

  it("resolves every ticker in the map", async () => {
    const cases: [string, string][] = [
      ["sol", "solana"],
      ["bnb", "binancecoin"],
      ["doge", "dogecoin"],
      ["avax", "avalanche-2"],
      ["usdt", "tether"],
    ];
    for (const [ticker, id] of cases) {
      expect(await resolveCoin(ticker)).toBe(id);
    }
  });
});

describe("resolveCoin – /search fallback", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("returns the coin id with the best market_cap_rank on a symbol match", async () => {
    mockFetch([
      { id: "scam-xyz1", name: "Scam XYZ1", symbol: "XYZ1", market_cap_rank: 9999 },
      { id: "real-xyz1", name: "Real XYZ1", symbol: "XYZ1", market_cap_rank: 50 },
    ]);
    expect(await resolveCoin("xyz1")).toBe("real-xyz1");
  });

  it("returns null when no coin has an exact symbol or name match", async () => {
    mockFetch([{ id: "unrelated", name: "Unrelated Coin", symbol: "UNRL", market_cap_rank: 200 }]);
    expect(await resolveCoin("nomatchwhatsoever_zz9")).toBeNull();
  });

  it("matches by full coin name as well as symbol", async () => {
    mockFetch([
      {
        id: "testcoin-alpha",
        name: "Testcoin Alpha",
        symbol: "TCA_DIFF",
        market_cap_rank: 300,
      },
    ]);
    expect(await resolveCoin("testcoin alpha")).toBe("testcoin-alpha");
  });

  it("prefers a coin with a rank over one without", async () => {
    mockFetch([
      { id: "ranked-xyz2", name: "Ranked XYZ2", symbol: "XYZ2", market_cap_rank: 100 },
      { id: "unranked-xyz2", name: "Unranked XYZ2", symbol: "XYZ2", market_cap_rank: null },
    ]);
    expect(await resolveCoin("xyz2")).toBe("ranked-xyz2");
  });
});
