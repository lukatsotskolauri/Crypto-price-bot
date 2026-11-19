import type { CoinDetails } from "../services/coingecko.js";
import type { OnchainStats } from "../services/onchain.js";

export function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function compact(n: number, suffix: string): string {
  return `$${n.toFixed(2).replace(/\.?0+$/, "")}${suffix}`;
}

export function formatUSD(value: number): string {
  if (value === 0) return "$0.00";
  if (value >= 1e12) return compact(value / 1e12, "T");
  if (value >= 1e9) return compact(value / 1e9, "B");
  if (value >= 1e6) return compact(value / 1e6, "M");
  if (value >= 1e3) return compact(value / 1e3, "K");
  if (value >= 0.01) return `$${value.toFixed(2)}`;
  // Very small price: enough decimals for 4 significant figures
  const decimals = Math.max(2, -Math.floor(Math.log10(value)) + 3);
  return `$${value.toFixed(decimals).replace(/0+$/, "").replace(/\.$/, "")}`;
}

export function formatPct(value: number | null): string {
  if (value === null) return "—";
  const sign = value >= 0 ? "🟢 +" : "🔴 ";
  return `${sign}${value.toFixed(2)}%`;
}

export function formatSupply(value: number | null): string {
  if (value === null) return "∞";
  if (value >= 1e9) return `${(value / 1e9).toFixed(2).replace(/\.?0+$/, "")}B`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(2).replace(/\.?0+$/, "")}M`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(2).replace(/\.?0+$/, "")}K`;
  return value.toLocaleString("en-US");
}

function buildOnchainSection(stats: OnchainStats): string {
  const lines = ["⛓ <b>Network</b>"];
  if (stats.kind === "btc") {
    const { blockHeight, fees } = stats.data;
    lines.push(`Block: ${blockHeight.toLocaleString("en-US")}`);
    lines.push(`Fees: fast ${fees.fast} · med ${fees.medium} · slow ${fees.slow} sat/vB`);
  } else {
    const { blockNumber, gasPriceGwei } = stats.data;
    const gas = gasPriceGwei.toFixed(1).replace(/\.0$/, "");
    lines.push(`Block: ${blockNumber.toLocaleString("en-US")}`);
    lines.push(`Gas: ${gas} Gwei`);
  }
  return lines.join("\n");
}

export function buildCoinMessage(details: CoinDetails, onchain?: OnchainStats): string {
  const { name, symbol, market_cap_rank, links, market_data: md } = details;

  const rank = market_cap_rank != null ? ` · #${market_cap_rank}` : "";
  const header = `<b>${escapeHtml(name)} (${escapeHtml(symbol.toUpperCase())})</b>${rank}`;

  const changes =
    `24h: ${formatPct(md.price_change_percentage_24h)}  ` +
    `7d: ${formatPct(md.price_change_percentage_7d)}  ` +
    `30d: ${formatPct(md.price_change_percentage_30d)}`;

  const high = md.high_24h.usd !== null ? formatUSD(md.high_24h.usd) : "—";
  const low = md.low_24h.usd !== null ? formatUSD(md.low_24h.usd) : "—";

  const homepage = links.homepage.find((u) => u.length > 0);
  const explorer = links.blockchain_site.find((u) => u.length > 0);

  const linkParts: string[] = [];
  if (homepage) linkParts.push(`<a href="${escapeHtml(homepage)}">Website</a>`);
  if (explorer) linkParts.push(`<a href="${escapeHtml(explorer)}">Explorer</a>`);

  const lines: string[] = [
    header,
    "",
    "<b>Price</b>",
    formatUSD(md.current_price.usd),
    changes,
    "",
    "<b>Market</b>",
    `Market Cap: ${formatUSD(md.market_cap.usd)}`,
    `Volume 24h: ${formatUSD(md.total_volume.usd)}`,
    `High 24h: ${high}  Low: ${low}`,
    `ATH: ${formatUSD(md.ath.usd)} (${formatPct(md.ath_change_percentage.usd)})`,
    "",
    "<b>Supply</b>",
    `Circulating: ${formatSupply(md.circulating_supply)}  Total: ${formatSupply(md.total_supply)}  Max: ${formatSupply(md.max_supply)}`,
  ];

  if (onchain) {
    lines.push("", buildOnchainSection(onchain));
  }

  if (linkParts.length > 0) {
    lines.push("", linkParts.join(" · "));
  }

  return lines.join("\n");
}
