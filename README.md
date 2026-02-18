# Meta Core Fastify

Core API service for TradingView data ingestion and distribution.

## ⚠️ IMPORTANT DISCLAIMER - READ BEFORE USING

**THIS REPOSITORY IS STRICTLY FOR EDUCATIONAL AND DEMONSTRATION PURPOSES ONLY.**

### I AM NOT ASSOCIATED WITH ANY SCAM OR FRAUDULENT ACTIVITIES

This code was created solely to demonstrate technical skills and knowledge of software development. I have never used, do not use, and will never use this repository for any scam, fraud, phishing, or any other illegal activities.

### YOU ARE WARNED

By using this code you acknowledge that:
- This software is provided "as is" without any warranties
- The author is NOT responsible for any misuse, illegal activities, or damages
- This code should NOT be used for any malicious purposes
- Any use for scams, fraud, or illegal activities is strictly prohibited

### IF YOU ARE PLANNING TO USE THIS FOR SCAMMING, STOP NOW

I do NOT consent to and strongly oppose any use of this code for:
- Scams of any kind
- Phishing or social engineering
- Fraudulent activities
- Any illegal or unethical purposes

This repository exists only to demonstrate software engineering capabilities. If you use it for anything else, you are doing so against my express wishes and without my permission.

## Features

- TradingView WebSocket integration for real-time price data
- ClickHouse for time-series candle storage
- PostgreSQL for asset metadata
- NATS for real-time price broadcasting
- Garage (S3-compatible) for object storage

## Quick Start

```bash
docker compose up -d --build
```

## Environment Variables

See `.env.example` for required configuration.

## License

MIT
