# NSEChainBridge

NSEChainBridge is a revolutionary platform that bridges the gap between traditional stock trading and blockchain technology, specifically leveraging the Hedera network. This application enables users to trade NSE stocks using blockchain tokens, providing a seamless and secure trading experience.

### Completed Features

- **User Authentication & Profile Management**

  - Secure user registration and login
  - Hedera account integration
  - Profile management with stock holdings tracking

- **Token Management**

  - Stock token minting and burning
  - Token balance tracking
  - Transaction history
  - Actual transaction fee handling using Hedera Mirror Node

- **Stock Trading**

  - Stock token purchase and sale
  - USDC integration for token swaps
  - Real-time balance updates
  - Transaction fee management

- **Portfolio Management**
  - Stock holdings tracking
  - Token balance monitoring
  - Transaction history
  - Portfolio value calculation

### In Progress Features

- **Hedera Consensus Service (HCS) Integration**

  - Community insights sharing
  - Market sentiment analysis
  - Real-time market updates
  - Topic-based communication

- **Hedera AI Agent Integration**
  - Portfolio insights generation
  - Market trend analysis
  - Trading recommendations
  - Risk assessment

### Assumptions

To fast track development of the app we decided to make some initial assumptions that are realistic to achieve in the real world, but require resources and a little bit more time. These include:

- User Stocks & Shares: We assume we have an existing partnership with our user's broker that's NSE approved and we therefore can get & display their stock balances.
- We've also assumed that the NSE would be the treasury account for the tokens on the platform, hence sacrificing some decentralization but gaining a lot in terms of security and legal matters.
- The final assumption we've made is that via our partnership with NSE with have realtime data and historical prices for all the stocks on the platform.

## Technical Stack

### Frontend

- React Native with Expo
- TypeScript
- Hedera SDK

### Backend

- Node.js with Express
- TypeScript

### Blockchain

- Hedera Network (Testnet)
- Token Service
- Saucerswap
- Mirror Node API
- Consensus Service (In Progress)

### Key Information

```bash
Treasury Account -> 0.0.5483001
KCB Mock Token ID -> 0.0.5784604
Equity Mock Token ID -> 0.0.5784605
Safaricom Mock Token ID -> 0.0.5784606
EABL Mock Token ID -> 0.0.5784607
USDC Mock Token ID ->0.0.5791936

#pools(ROUTER 0.0.19264)
KCB/USDC -> 0.0.5792537
EQTY/USDC -> 0.0.5797294
SCOM/USDC -> 0.0.5797328
EABL/USDC -> 0.0.5797337

#ALL ON HEDERA TESTNET
```

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB
- Hedera Testnet Account
- Expo CLI
- iOS Simulator

### Installation

1. Clone the repository:

```bash
git clone https://github.com/divin3circle/NSEChainBridge.git
cd NSEChainBridge
```

2. Install dependencies:

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../app
npm install
```

3. Set up environment variables:

```bash
# Backend (.env)
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
HEDERA_OPERATOR_ID=your_operator_id
HEDERA_OPERATOR_KEY=your_operator_key

# Frontend (.env)
API_BASE_URL=your_backend_url
```

4. Start the development servers:

```bash
# Start backend server
cd backend
npm install
node scrips/populateHoldings #simulates data from user's broker
npm run build && NODE_ENV=testnet PORT=5004 node dist/index.js


# Start frontend development server
cd ../app
npx expo run:ios
```

## Project Structure

```
NSEChainBridge/
├── app/                    # Frontend React Native application
│   ├── components/        # Reusable UI components
│   ├── screens/          # Application screens
│   ├── constants/        # Constants and configuration
│   └── types/            # TypeScript type definitions
├── backend/              # Backend Node.js application
│   ├── controllers/      # Route controllers
│   ├── models/          # Database models
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   └── utils/           # Utility functions
└── scripts/             # Blockchain interaction scripts
```
