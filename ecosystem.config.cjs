// pm2 ecosystem file — must be .cjs because package.json has "type": "module"
module.exports = {
  apps: [
    {
      name: "crypto-price-bot",
      script: "dist/index.js",
      env: {
        NODE_ENV: "production",
      },
      restart_delay: 5000,
      max_restarts: 10,
    },
  ],
};