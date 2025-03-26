# NSEChainBridge API Backend

Backend service for NSEChainBridge - a platform for tokenizing stocks on the Nairobi Stock Exchange using Hedera Hashgraph.

## Features

- User authentication and account management
- Hedera account creation
- Token minting against stock positions
- Token burning to reclaim stock positions
- Token transfer functionality
- Transaction history

## Technologies

- Node.js & Express
- TypeScript
- MongoDB with Mongoose
- Hedera Hashgraph SDK
- JWT Authentication

## Prerequisites

- Node.js v16+
- MongoDB (local or Atlas)
- Hedera testnet or mainnet account

## Setup

1. Clone the repository:

```bash
git clone <repository-url>
cd NSEChainBridge/backend
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:

```
# Server Configuration
PORT=3001
NODE_ENV=development

# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/nsechainbridge

# JWT Authentication
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=24h

# Hedera Network
HEDERA_NETWORK=testnet
HEDERA_OPERATOR_ID=your_operator_account_id_here
HEDERA_OPERATOR_KEY=your_operator_private_key_here
```

4. Start the development server:

```bash
npm run dev
```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/create-hedera-account` - Create a Hedera account for the user
- `GET /api/auth/me` - Get current user profile

### Tokens

- `GET /api/tokens` - Get all tokens
- `GET /api/tokens/:tokenId` - Get token by ID
- `POST /api/tokens/:tokenId/mint` - Mint tokens
- `POST /api/tokens/:tokenId/burn` - Burn tokens
- `GET /api/tokens/balances` - Get user token balances

### Transactions

- `POST /api/transactions/buy` - Buy tokens
- `POST /api/transactions/sell` - Sell tokens
- `GET /api/transactions/history` - Get user transaction history

## Development

- Build the project: `npm run build`
- Run in development mode: `npm run dev`
- Run in production mode: `npm start`

## Security Notes

- In production, ensure private keys are properly encrypted
- Use environment variables for all sensitive information
- Consider using a key management system for Hedera keys

## License

[MIT](LICENSE)
