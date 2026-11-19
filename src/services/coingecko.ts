import { z } from "zod";
import { config } from "../config.js";
import { TTLCache } from "../lib/cache.js";

const BASE_URL = "https://api.coingecko.com/api/v3";

const COIN_ID_MAP: Record<string, string> = {
  btc: "bitcoin",
  eth: "ethereum",
  sol: "solana",
  bnb: "binancecoin",
  xrp: "ripple",
  ada: "cardano",
  doge: "dogecoin",
  ton: "the-open-network",
  trx: "tron",
  dot: "polkadot",
  ltc: "litecoin",
  avax: "avalanche-2",
  link: "chainlink",
  usdt: "tether",
  usdc: "usd-coin",
};

export class CoinGeckoHttpError extends Error {
  readonly type = "http_error" as const;
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "CoinGeckoHttpError";
  }
}

export class CoinGeckoRateLimitError extends Error {
  readonly type = "rate_limit" as const;
  constructor() {
    super("CoinGecko rate limit exceeded (429)");
    this.name = "CoinGeckoRateLimitError";
  }
}

export class CoinGeckoParseError extends Error {
  readonly type = "parse_error" as const;
  constructor(public readonly zodError: z.ZodError) {
    super("Failed to parse CoinGecko response");
    this.name = "CoinGeckoParseError";
  }
}

export type CoinGeckoError = CoinGeckoHttpError | CoinGeckoRateLimitError | CoinGeckoParseError;

const SearchSchema = z.object({
  coins: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      symbol: z.string(),
      market_cap_rank: z.number().nullable(),
    }),
  ),
});

const CoinDetailsSchema = z.object({
  id: z.string(),
  name: z.string(),
  symbol: z.string(),
  market_cap_rank: z.number().nullable(),
  links: z.object({
    homepage: z.array(z.string()),
    blockchain_site: z.array(z.string()),
  }),
  market_data: z.object({
    current_price: z.object({ usd: z.number() }),
    price_change_percentage_24h: z.number().nullable(),
    price_change_percentage_7d: z.number().nullable(),
    price_change_percentage_30d: z.number().nullable(),
    market_cap: z.object({ usd: z.number() }),
    total_volume: z.object({ usd: z.number() }),
    high_24h: z.object({ usd: z.number().nullable() }),
    low_24h: z.object({ usd: z.number().nullable() }),
    ath: z.object({ usd: z.number() }),
    ath_change_percentage: z.object({ usd: z.number() }),
    circulating_supply: z.number().nullable(),
    total_supply: z.number().nullable(),
    max_supply: z.number().nullable(),
  }),
});

export type CoinDetails = z.infer<typeof CoinDetailsSchema>;

const resolveCache = new TTLCache<string | null>(60);
const detailsCache = new TTLCache<CoinDetails>(60);

function getHeaders(): Record<string, string> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (config.coingeckoApiKey) {
    headers["x-cg-demo-api-key"] = config.coingeckoApiKey;
  }
  return headers;
}

async function apiFetch<T>(url: string, schema: z.ZodType<T>): Promise<T> {
  const res = await fetch(url, { headers: getHeaders() });

  if (res.status === 429) throw new CoinGeckoRateLimitError();
  if (!res.ok) throw new CoinGeckoHttpError(res.status, `HTTP ${res.status} from CoinGecko`);

  const json: unknown = await res.json();
  const result = schema.safeParse(json);
  if (!result.success) throw new CoinGeckoParseError(result.error);
  return result.data;
}

export async function resolveCoin(query: string): Promise<string | null> {
  const q = query.trim().toLowerCase();

  const cached = resolveCache.get(q);
  if (cached !== undefined) return cached;

  const mapped = COIN_ID_MAP[q];
  if (mapped !== undefined) {
    resolveCache.set(q, mapped);
    return mapped;
  }

  const data = await apiFetch(`${BASE_URL}/search?query=${encodeURIComponent(q)}`, SearchSchema);

  const matches = data.coins.filter(
    (c) => c.symbol.toLowerCase() === q || c.name.toLowerCase() === q,
  );

  if (matches.length === 0) {
    resolveCache.set(q, null);
    return null;
  }

  matches.sort((a, b) => {
    if (a.market_cap_rank === null) return 1;
    if (b.market_cap_rank === null) return -1;
    return a.market_cap_rank - b.market_cap_rank;
  });

  const id = matches[0]!.id;
  resolveCache.set(q, id);
  return id;
}

export async function getCoinDetails(id: string): Promise<CoinDetails> {
  const cached = detailsCache.get(id);
  if (cached !== undefined) return cached;

  const data = await apiFetch(
    `${BASE_URL}/coins/${encodeURIComponent(id)}?tickers=false&community_data=false&developer_data=false`,
    CoinDetailsSchema,
  );
  detailsCache.set(id, data);
  return data;
}
