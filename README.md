# Crypto Price Bot

A Telegram bot that delivers real-time cryptocurrency prices and on-chain network stats.

<!-- CI badge — replace YOUR_GITHUB_USERNAME with your GitHub username after pushing -->
<!-- [![CI](https://github.com/YOUR_GITHUB_USERNAME/crypto-price-bot/actions/workflows/ci.yml/badge.svg)](https://github.com/YOUR_GITHUB_USERNAME/crypto-price-bot/actions/workflows/ci.yml) -->

## Features

- **Price lookup** by ticker (`btc`, `eth`) or full name (`bitcoin`, `solana`)
- **Market data** — price, 24h/7d/30d change, market cap, volume, 24h high/low, ATH
- **Supply info** — circulating, total, max (∞ for inflationary tokens)
- **On-chain stats** — BTC block height + fee estimates (fast/medium/slow sat/vB) via mempool.space; ETH block number + gas price via JSON-RPC
- **60-second price cache** and **30-second on-chain cache** to stay within free-tier rate limits
- Results for 15 popular tickers resolved instantly from a hardcoded map; unknown tokens fall back to CoinGecko search with scam-token filtering by market cap rank
- Graceful shutdown on SIGINT/SIGTERM



## Setup

### 1. Create a bot via BotFather

1. Open Telegram and search for [@BotFather](https://t.me/BotFather)
2. Send `/newbot` and follow the prompts
3. Copy the **HTTP API token** — this is your `TELEGRAM_BOT_TOKEN`

### 2. Environment variables

Copy the example file and fill in values:

```bash
cp .env.example .env
```

| Variable | Required | Default | Description |
|---|---|---|---|
| `TELEGRAM_BOT_TOKEN` | **Yes** | — | Token from BotFather |
| `COINGECKO_API_KEY` | No | — | Demo API key for higher CoinGecko rate limits (get one free at coingecko.com) |
| `ETH_RPC_URL` | No | `https://cloudflare-eth.com` | Ethereum JSON-RPC endpoint for gas price and block number |

### 3. Run locally

```bash
npm install
npm run dev        # ts-node watch mode — reloads on file changes
```

## Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start in watch mode (tsx) |
| `npm run build` | Compile TypeScript → `dist/` |
| `npm start` | Run compiled output |
| `npm test` | Run Vitest unit tests |
| `npm run lint` | ESLint (TypeScript strict rules) |
| `npm run format` | Prettier auto-format |

## Deploy

### Docker

```bash
# Build the image
docker build -t crypto-price-bot .

# Run (pass env vars at runtime — never bake secrets into the image)
docker run -d \
  --name crypto-price-bot \
  --restart unless-stopped \
  -e TELEGRAM_BOT_TOKEN=your_token_here \
  -e COINGECKO_API_KEY=your_key_here \
  crypto-price-bot
```

### Railway

1. Push this repository to GitHub
2. Go to [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo**
3. Select your repository — Railway detects the `Dockerfile` automatically
4. Open **Settings → Variables** and add:
   - `TELEGRAM_BOT_TOKEN` (**required**)
   - `COINGECKO_API_KEY` (optional)
   - `ETH_RPC_URL` (optional)
5. Click **Deploy** — Railway builds and starts the container

Subsequent pushes to the connected branch redeploy automatically.

### VPS with pm2

Requires Node.js 20+ and pm2 on the server.

```bash
# Install pm2 globally (once)
npm install -g pm2

# Clone and build
git clone https://github.com/YOUR_GITHUB_USERNAME/crypto-price-bot.git
cd crypto-price-bot
npm ci
npm run build

# Configure environment
cp .env.example .env
nano .env   # fill in TELEGRAM_BOT_TOKEN

# Start with pm2
pm2 start ecosystem.config.cjs

# Save process list and enable auto-start on reboot
pm2 save
pm2 startup   # follow the printed command to register the init hook
```

**Useful pm2 commands:**

```bash
pm2 status                    # check process status
pm2 logs crypto-price-bot     # tail logs
pm2 restart crypto-price-bot  # restart
pm2 stop crypto-price-bot     # stop
```

**Updating the bot:**

```bash
git pull
npm ci
npm run build
pm2 restart crypto-price-bot
```
