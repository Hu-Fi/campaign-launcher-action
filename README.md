# Campaign Launcher Action

A GitHub Action to create and manage escrows for market making campaigns using the Human Protocol.

## Usage

This is a **composite GitHub Action** that can be used in your workflows to launch market making campaigns.

### Basic Setup

1. **In your workflow file**, use the action as follows:

```yaml
- uses: Hu-Fi/campaign-launcher-action@v1
  with:
    # Exchange name where you want campaign participants to trade
    exchange_name: "mexc"
    # Trading pair symbol for exchange (in <base>/<quote> format)
    symbol: "HMT/USDT"
    # Option 1: explicit campaign window in ISO 8601 format
    start_date: "2026-05-27T12:00:00.000Z"
    end_date: "2026-05-28T12:00:00.000Z"
    # Option 2: derive the campaign window from now
    # duration: "24"
    # start_delay: "3600"
    # Daily trading volume target (in <quote> token)
    daily_volume_target: "100000.0"
    # The token to use for rewards (only HMT and USDT are supported atm)
    reward_token: "HMT"
    # Total rewards amount for the whole campaign duration
    reward_amount: "1000"
    # Address of Exchange Oracle that will handle campaign
    exchange_oracle_address: "0x..."
    # Address of Recording Oracle that will handle campaign
    recording_oracle_address: "0x..."
    # Address of Reputation Oracle that will handle campaign
    reputation_oracle_address: "0x..."
  env:
    # JSON-RPC endpoint for the blockchain. Campaign will be launched on its chain
    WEB3_RPC_URL: ${{ secrets.WEB3_RPC_URL }}
    # Private key of the wallet to use for transactions
    WEB3_PRIVATE_KEY: ${{ secrets.WEB3_PRIVATE_KEY }}
    # Webhook url of Slack channel where to send notifications. Optional
    SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

Provide either:

- `start_date` and `end_date` as ISO 8601 timestamps, or
- `duration` in hours with optional `start_delay` in seconds.

If `start_date` and `end_date` are provided, they take precedence over derived timing.

### Example Workflow

See [`campaign-example.yml`](./examples/campaign-example.yml) for a complete example of how to use this action.

### Manifest Format

The action generates a manifest in the following format:

```json
{
  "type": "MARKET_MAKING",
  "exchange": "mexc",
  "pair": "HMT/USDT",
  "start_date": "2025-05-27T12:00:00.000Z",
  "end_date": "2025-05-28T12:00:00.000Z",
  "daily_volume_target": 100000.0
}
```

## License

MIT
