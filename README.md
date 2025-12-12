# Campaign Launcher Action

A GitHub Action to create and manage escrows for market making campaigns using the Human Protocol.

## Usage

This is a **composite GitHub Action** that can be used in your workflows to launch market making campaigns.

### Basic Setup

1. **In your workflow file**, use the action as follows:

```yaml
- uses: Hu-Fi/campaign-launcher-action@v1
  with:
    # Blockchain chain ID where to launch campaign
    CHAIN_ID: "137"
    # Exchange name where you want campaign paticipants to trade
    EXCHANGE_NAME: "mexc"
    # Trading pair symbol for exchange (in <base>/<quote> format)
    SYMBOL: "HMT/USDT"
    # Duration of the campaign in hours
    DURATION: "24"
    # Delay in seconds before the campaign starts (added to current time)
    START_DELAY: "3600"
    # Daily trading volume target (in <quote> token)
    DAILY_VOLUME_TARGET: "100000.0"
    # The token to use for rewards
    REWARD_TOKEN: "HMT"
    # Total rewards amount for the whole campaign duration
    REWARD_AMOUNT: "1000"
    # Address of Exchange Oracle that will handle campaign
    EXCHANGE_ORACLE_ADDRESS: "0x..."
    # Address of Recording Oracle that will handle campaign
    RECORDING_ORACLE_ADDRESS: "0x..."
    # Address of Reputation Oracle that will handle campaign
    REPUTATION_ORACLE_ADDRESS: "0x..."
  env:
    # JSON-RPC endpoint for the blockchain
    WEB3_RPC_URL: ${{ secrets.WEB3_RPC_URL }}
    # Private key of the wallet to use for transactions
    WEB3_PRIVATE_KEY: ${{ secrets.WEB3_PRIVATE_KEY }}
    # Webhook url of Slack channel where to send notifications. Optional
    SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

### Example Workflow

See [`campaign-example.yml`](.github/workflows/campaign-example.yml) for a complete example of how to use this action.

### Canceling an Escrow

To cancel an existing escrow manually, use the [`.github/workflows/cancel-escrow.yml`](.github/workflows/cancel-escrow.yml) workflow:

1. Go to **Actions** → **Cancel Escrow**
2. Click **Run workflow**
3. Provide the escrow address as input

### Manifest Format

The action generates a manifest in the following format:

```json
{
  "type": "MARKET_MAKING",
  "exchange": "mexc",
  "pair": "HMT/USDT",
  "fund_token": "HMT",
  "daily_volume_target": 100000.0,
  "start_date": "2025-05-27T12:00:00.000Z",
  "end_date": "2025-05-28T12:00:00.000Z"
}
```

## License

MIT
