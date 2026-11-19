import "dotenv/config";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    console.error(`Missing required environment variable: ${name}`);
    console.error(`Copy .env.example to .env and fill in the values.`);
    process.exit(1);
  }
  return value;
}

export const config = {
  telegramBotToken: requireEnv("TELEGRAM_BOT_TOKEN"),
  coingeckoApiKey: process.env["COINGECKO_API_KEY"],
  ethRpcUrl: process.env["ETH_RPC_URL"] ?? "https://cloudflare-eth.com",
};
