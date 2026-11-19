import { Bot } from "grammy";
import { config } from "./config.js";

export const bot = new Bot(config.telegramBotToken);

bot.command("start", (ctx) =>
  ctx.reply(
    "Welcome to Crypto Price Bot!\n\n" +
      "I can look up real-time cryptocurrency prices for you.\n\n" +
      "Just send a coin symbol like btc or eth, or use /price <symbol>.\n" +
      "Type /help to see all available commands."
  )
);

bot.command("help", (ctx) =>
  ctx.reply(
    "Available commands:\n\n" +
      "/start — Welcome message\n" +
      "/help — Show this help text\n\n" +
      "Usage examples:\n" +
      "  • Send btc — look up Bitcoin price\n" +
      "  • Send eth — look up Ethereum price\n" +
      "  • /price btc — same as above\n" +
      "  • /price sol — look up Solana price"
  )
);

bot.on("message:text", (ctx) => ctx.reply(`Looking up ${ctx.message.text}...`));

bot.catch((err) => {
  console.error("Bot error:", err.error);
});

export async function startBot(): Promise<void> {
  await bot.api.setMyCommands([
    { command: "start", description: "Welcome message" },
    { command: "help", description: "List commands and usage examples" },
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