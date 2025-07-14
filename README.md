# Campaign Launcher Action

A GitHub Action to create and manage escrows for market making campaigns using the Human Protocol.

## Usage

1. **Set up environment variables**  
   Set the following environment variables in your workflow or CI/CD environment:

   **Secrets (keep these private):**
   - `WEB3_PRIVATE_KEY`
   - `WEB3_RPC_URL`
   - `S3_ACCESS_KEY`
   - `S3_SECRET_KEY`
   - `S3_BUCKET_NAME`

   **Public or non-sensitive (can be set as GitHub environment variables):**
   - `CAMPAIGN_LAUNCH_ENABLED`
   - `CHAIN_ID`
   - `EXCHANGE_NAME`
   - `SYMBOL`
   - `REWARD_TOKEN`
   - `REWARD_AMOUNT`
   - `START_DELAY` (in seconds; period to add to current time for campaign start)
   - `DURATION` (in hours)
   - `DAILY_VOLUME_TARGET`
   - `RECORDING_ORACLE_ADDRESS`
   - `RECORDING_ORACLE_FEE`
   - `REPUTATION_ORACLE_ADDRESS`
   - `REPUTATION_ORACLE_FEE`

2. **Launch a campaign (create manifest and escrow)**
   ```
   node launch-campaign.js
   ```
   This will create and upload a manifest to S3 and launch an escrow using the manifest.

3. **Cancel an escrow**
   ```
   ESCROW_ADDRESS=<escrow_address> node cancel-escrow.js
   ```
   Or, if using the GitHub Actions workflow, provide the escrow address as an input parameter.

## Files

- `create-manifest.js`: Script to create and upload a campaign manifest to S3.
- `create-escrow.js`: Script to create and fund an escrow using a manifest.
- `cancel-escrow.js`: Script to cancel an escrow.
- `launch-campaign.js`: Script to create a manifest and immediately launch an escrow.

## Example GitHub Actions Workflows

**Daily Escrow Creation (`.github/workflows/daily-run.yml`):**
- Uses secrets for sensitive values and environment variables for public values.
- Calls `launch-campaign.js` to create a manifest and escrow.

**Manual Escrow Cancellation (`.github/workflows/cancel-escrow.yml`):**
- Cancels an escrow by address using secrets for sensitive values.

## .env Example

> **Note:** The `.env` file is not required, but you can use this format for reference or local testing.

```
# Secrets (keep these private)
WEB3_PRIVATE_KEY=your_private_key_here
WEB3_RPC_URL=https://your_rpc_url
S3_ACCESS_KEY=your_s3_access_key
S3_SECRET_KEY=your_s3_secret_key
S3_BUCKET_NAME=you_s3_bucket_name

# Public or non-sensitive
CAMPAIGN_LAUNCH_ENABLED=true
CHAIN_ID=11155111
EXCHANGE_NAME=mexc
SYMBOL=XIN/USDT
REWARD_TOKEN=USDT
REWARD_AMOUNT=100
START_DELAY=3600
DURATION=24
DAILY_VOLUME_TARGET=1000
RECORDING_ORACLE_ADDRESS=0x...
RECORDING_ORACLE_FEE=1
REPUTATION_ORACLE_ADDRESS=0x...
REPUTATION_ORACLE_FEE=1
```

## Manifest Example

```json
{
  "exchange": "mexc",
  "pair": "HMT/USDT",
  "fund_token": "HMT",
  "start_date": "2025-05-27T12:00:00.000Z",
  "end_date": "2025-05-28T12:00:00.000Z",
  "type": "MARKET_MAKING",
  "daily_volume_target": 1.01
}
```

## License

MIT
