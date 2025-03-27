# NSEChainBridge Scripts

This directory contains utility scripts for managing the NSEChainBridge backend.

## Available Scripts

### Stock Holdings Population

Populates users with random stock holdings:

```bash
# First build TypeScript files
npm run build

# Run the script
node scripts/populateHoldings.js
```

This script will:

- Connect to your MongoDB database
- Find all users
- Add random stock holdings (2000-5000 shares) for KCB, EQTY, SCOM, and EABL stocks
- Save the updated user data

### Stock Token Creation

Creates tokens for stocks:

```bash
# First build TypeScript files
npm run build

# Run the script
node scripts/createTokens.js
```

This script will:

- Connect to your MongoDB database
- Create mock tokens for each stock (KCB, EQTY, SCOM, EABL) if they don't already exist
- Save the token data to the database

## Usage Requirements

1. Make sure your `.env` file is properly configured with MongoDB connection string

2. Compile the TypeScript files first with `npm run build` before running the scripts.

## Troubleshooting

If you encounter module import errors, make sure:

1. Your TypeScript files are properly compiled to JavaScript in the `dist` folder
2. The path to the imported modules is correct
3. You're using Node.js version 14 or higher
