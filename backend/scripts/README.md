# NSEChainBridge Scripts

This directory contains utility scripts for managing the NSEChainBridge backend.

## Available Scripts

### Stock Holdings Population

Populates users with random stock holdings:

```bash
# First build TypeScript files
npm run build

# Then run the script
node scripts/populateStockHoldings.js
```

This script will:

- Connect to your MongoDB database
- Find all users
- Add random stock holdings (2000-5000 shares) for KCB, EQTY, SCOM, and EABL stocks
- Save the updated user data

### Stock Token Creation

Creates Hedera tokens for stocks:

```bash
# First build TypeScript files
npm run build

# Then run the script
node scripts/createStockTokens.js
```

This script will:

- Connect to your MongoDB database
- Import the token service
- Create Hedera tokens for each stock (KCB, EQTY, SCOM, EABL) if they don't already exist
- Save the token data to the database

## Usage Requirements

1. Make sure your `.env` file is properly configured with:

   - MongoDB connection string
   - Hedera credentials

2. Compile the TypeScript files first with `npm run build` before running the scripts.

3. Ensure you have enough HBAR in your Hedera account to create tokens.
