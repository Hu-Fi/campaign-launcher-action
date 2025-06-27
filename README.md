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

   **Public or non-sensitive (can be set as GitHub environment variables):**
   - `CHAIN_ID`
   - `EXCHANGE_NAME`
   - `SYMBOL`
   - `REWARD_TOKEN`
   - `REWARD_AMOUNT`
   - `START_DELAY` (in seconds; period to add to current time for campaign start)
   - `DURATION` (in days)
   - `DAILY_VOLUME_TARGET`
   - `RECORDING_ORACLE` (format: `address,fee`)
   - `REPUTATION_ORACLE` (format: `address,fee`)

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
- `update-config.js`: (Legacy) Script to upload manifest to S3 and print campaign details.

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

# Public or non-sensitive
CHAIN_ID=11155111
EXCHANGE_NAME=mexc
SYMBOL=XIN/USDT
REWARD_TOKEN=USDT
REWARD_AMOUNT=100
START_DELAY=3600
DURATION=60
DAILY_VOLUME_TARGET=1.01
RECORDING_ORACLE=0x...,10
REPUTATION_ORACLE=0x...,10
ADDITIONAL_DATA=optional
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
  "daily_volume_target": 1.01,
  "additional_data": "optional"
}
```

## License

MIT
