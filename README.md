# Campaign Launcher Action

A GitHub Action to create and manage escrows for market making campaigns using the Human Protocol.

## Usage

This is a **composite GitHub Action** that can be used in your workflows to launch volume campaigns.

### Basic Setup

1. **In your workflow file**, use the action as follows:

```yaml
name: Launch Campaign

on:
  schedule:
    - cron: "0 6 * * *" # Run daily at 6 AM UTC
  workflow_dispatch:

jobs:
  launch-campaign:
    runs-on: ubuntu-latest
    steps:
      - uses: Hu-Fi/campaign-launcher-action@v0
        with:
          CHAIN_ID: "137"
          DAILY_VOLUME_TARGET: "100000"
          DURATION: "24"
          EXCHANGE_NAME: "mexc"
          SYMBOL: "HMT/USDT"
          REWARD_TOKEN: "HMT"
          REWARD_AMOUNT: "1000"
          START_DELAY: "3600"
          RECORDING_ORACLE_ADDRESS: "0x..."
          RECORDING_ORACLE_FEE: "10"
          REPUTATION_ORACLE_ADDRESS: "0x..."
          REPUTATION_ORACLE_FEE: "10"
        env:
          WEB3_RPC_URL: ${{ secrets.WEB3_RPC_URL }}
          WEB3_PRIVATE_KEY: ${{ secrets.WEB3_PRIVATE_KEY }}
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

### Input Parameters

All inputs are **required**:

- `CHAIN_ID`: The blockchain chain ID (e.g., `137` for Polygon)
- `EXCHANGE_NAME`: The exchange name (e.g., `mexc`, `bybit`)
- `SYMBOL`: The trading pair symbol (e.g., `HMT/USDT`)
- `REWARD_TOKEN`: The token to use for rewards (e.g., `HMT`, `USDT`)
- `REWARD_AMOUNT`: The amount of tokens to reward
- `START_DELAY`: Delay in seconds before the campaign starts (added to current time)
- `DURATION`: Campaign duration in days
- `DAILY_VOLUME_TARGET`: Daily volume target as a float
- `RECORDING_ORACLE_ADDRESS`: Address of the recording oracle
- `RECORDING_ORACLE_FEE`: Fee for the recording oracle
- `REPUTATION_ORACLE_ADDRESS`: Address of the reputation oracle
- `REPUTATION_ORACLE_FEE`: Fee for the reputation oracle

### Environment Variables (Secrets)

Provide the following as secrets in your GitHub repository:

- `WEB3_RPC_URL`: JSON-RPC endpoint for the blockchain
- `WEB3_PRIVATE_KEY`: Private key of the wallet to use for transactions
- `SLACK_WEBHOOK_URL`: Webhook url from Slack to send error notifications

### Example Workflow

See [`campaign-example.yml`](campaign-example.yml) for a complete example of how to use this action.

### Canceling an Escrow

To cancel an existing escrow manually, use the [`.github/workflows/cancel-escrow.yml`](.github/workflows/cancel-escrow.yml) workflow:

1. Go to **Actions** → **Cancel Escrow**
2. Click **Run workflow**
3. Provide the escrow address as input

### Manifest Format

The action generates a manifest in the following format:

```json
{
  "exchange": "mexc",
  "pair": "HMT/USDT",
  "fund_token": "HMT",
  "start_date": "2025-05-27T12:00:00.000Z",
  "end_date": "2025-05-28T12:00:00.000Z",
  "type": "MARKET_MAKING",
  "daily_volume_target": 100000
}
```

## License

MIT
