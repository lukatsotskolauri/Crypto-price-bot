import { z } from "zod";
import { config } from "../config.js";
import { TTLCache } from "../lib/cache.js";

export interface BtcOnchainStats {
  blockHeight: number;
  fees: { fast: number; medium: number; slow: number };
}

export interface EthOnchainStats {
  blockNumber: number;
  gasPriceGwei: number;
}

export type OnchainStats =
  | { kind: "btc"; data: BtcOnchainStats }
  | { kind: "eth"; data: EthOnchainStats };

const MemPoolFeesSchema = z.object({
  fastestFee: z.number(),
  halfHourFee: z.number(),
  hourFee: z.number(),
});

const RpcBatchSchema = z.array(
  z.object({
    id: z.number(),
    result: z.string(),
  }),
);

const btcCache = new TTLCache<BtcOnchainStats>(30);
const ethCache = new TTLCache<EthOnchainStats>(30);

export async function getBtcStats(): Promise<BtcOnchainStats> {
  const cached = btcCache.get("btc");
  if (cached !== undefined) return cached;

  const [heightRes, feesRes] = await Promise.all([
    fetch("https://mempool.space/api/blocks/tip/height"),
    fetch("https://mempool.space/api/v1/fees/recommended"),
  ]);

  if (!heightRes.ok) throw new Error(`mempool.space height: HTTP ${heightRes.status}`);
  if (!feesRes.ok) throw new Error(`mempool.space fees: HTTP ${feesRes.status}`);

  const blockHeight = parseInt(await heightRes.text(), 10);
  if (!Number.isFinite(blockHeight)) throw new Error("Invalid block height");

  const feesJson: unknown = await feesRes.json();
  const fees = MemPoolFeesSchema.parse(feesJson);

  const result: BtcOnchainStats = {
    blockHeight,
    fees: { fast: fees.fastestFee, medium: fees.halfHourFee, slow: fees.hourFee },
  };
  btcCache.set("btc", result);
  return result;
}

export async function getEthStats(): Promise<EthOnchainStats> {
  const cached = ethCache.get("eth");
  if (cached !== undefined) return cached;

  const res = await fetch(config.ethRpcUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify([
      { jsonrpc: "2.0", method: "eth_blockNumber", params: [], id: 1 },
      { jsonrpc: "2.0", method: "eth_gasPrice", params: [], id: 2 },
    ]),
  });

  if (!res.ok) throw new Error(`ETH RPC: HTTP ${res.status}`);

  const json: unknown = await res.json();
  const results = RpcBatchSchema.parse(json);

  const blockHex = results.find((r) => r.id === 1)?.result;
  const gasHex = results.find((r) => r.id === 2)?.result;
  if (!blockHex || !gasHex) throw new Error("Missing RPC results");

  const data: EthOnchainStats = {
    blockNumber: parseInt(blockHex, 16),
    gasPriceGwei: parseInt(gasHex, 16) / 1e9,
  };
  ethCache.set("eth", data);
  return data;
}