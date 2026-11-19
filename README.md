# Crypto Price Bot

A Telegram bot that delivers real-time cryptocurrency prices.

## Setup

1. **Clone and install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and fill in:
   - `TELEGRAM_BOT_TOKEN` — required, get one from [@BotFather](https://t.me/BotFather)
   - `COINGECKO_API_KEY` — optional, for higher rate limits

3. **Run in development**
   ```bash
   npm run dev
   ```

4. **Build for production**
   ```bash
   npm run build
   npm start
   ```

## Requirements

- Node.js 20+