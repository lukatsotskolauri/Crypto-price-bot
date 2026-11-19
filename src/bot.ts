import { Bot, Context } from "grammy";
import { config } from "./config.js";
import {
  resolveCoin,
  getCoinDetails,
  CoinGeckoRateLimitError,
  CoinGeckoHttpError,
  CoinGeckoParseError,
} from "./services/coingecko.js";
import { buildCoinMessage, escapeHtml } from "./lib/format.js";
import {
  getBtcStats,
  getEthStats,
  type OnchainStats,
} from "./services/onchain.js";

export const bot = new Bot(config.telegramBotToken);

async function fetchOnchain(coinId: string): Promise<OnchainStats | undefined> {
  try {
    if (coinId === "bitcoin") return { kind: "btc", data: await getBtcStats() };
    if (coinId === "ethereum") return { kind: "eth", data: await getEthStats() };
  } catch (err) {
    console.error("On-chain stats failed:", err);
  }
  return undefined;
}

async function handleLookup(ctx: Context, query: string): Promise<void> {
  await ctx.replyWithChatAction("typing");

  try {
    const id = await resolveCoin(query);
    if (id === null) {
      await ctx.reply(
        `Unknown coin: <b>${escapeHtml(query)}</b>\n\n` +
          `Try a ticker like <code>btc</code>, <code>eth</code>, or the full name like <code>bitcoin</code>.`,
        { parse_mode: "HTML" },
      );
      return;
    }

    const [details, onchain] = await Promise.all([
      getCoinDetails(id),
      fetchOnchain(id),
    ]);
    await ctx.reply(buildCoinMessage(details, onchain), {
      parse_mode: "HTML",
      link_preview_options: { is_disabled: true },
    });
  } catch (err) {
    if (err instanceof CoinGeckoRateLimitError) {
      await ctx.reply(
        "CoinGecko is rate-limiting us right now. Please try again in a moment.",
      );
    } else if (err instanceof CoinGeckoHttpError) {
      await ctx.reply(
        `Failed to fetch price data (HTTP ${err.status}). Please try again.`,
      );
    } else if (err instanceof CoinGeckoParseError) {
      console.error("CoinGecko parse error:", err.zodError);
      await ctx.reply(
        "Received unexpected data from CoinGecko. Please try again later.",
      );
    } else {
      console.error("Unexpected error during lookup:", err);
      await ctx.reply("Something went wrong. Please try again.");
    }
  }
}

bot.command("start", (ctx) =>
  ctx.reply(
    "Welcome to Crypto Price Bot!\n\n" +
      "I can look up real-time cryptocurrency prices for you.\n\n" +
      "Just send a coin symbol like btc or eth, or use /price <symbol>.\n" +
      "Type /help to see all available commands.",
  ),
);

bot.command("help", (ctx) =>
  ctx.reply(
    "Available commands:\n\n" +
      "/start — Welcome message\n" +
      "/help — Show this help text\n" +
      "/price <coin> — Look up a coin by ticker or name\n\n" +
      "Usage examples:\n" +
      "  • Send btc — look up Bitcoin price\n" +
      "  • Send eth — look up Ethereum price\n" +
      "  • /price btc — same as above\n" +
      "  • /price solana — look up by full name",
  ),
);

bot.command("price", async (ctx) => {
  const query = ctx.match.trim();
  if (!query) {
    await ctx.reply(
      "Please provide a coin symbol or name.\nExample: /price btc or /price ethereum",
    );
    return;
  }
  await handleLookup(ctx, query);
});

bot.on("message:text", async (ctx) => {
  await handleLookup(ctx, ctx.message.text.trim());
});

bot.catch((err) => {
  console.error("Bot error:", err.error);
});

export async function startBot(): Promise<void> {
  await bot.api.setMyCommands([
    { command: "start", description: "Welcome message" },
    { command: "help", description: "List commands and usage examples" },
    { command: "price", description: "Look up a coin price (e.g. /price btc)" },
  ]);

  const stopBot = bot.start();

  const shutdown = async () => {
    console.log("Shutting down...");
    await bot.stop();
    process.exit(0);
  };

  process.once("SIGINT", shutdown);
  process.once("SIGTERM", shutdown);

  await stopBot;
}