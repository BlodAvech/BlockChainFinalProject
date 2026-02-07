# Student Research Support DApp

## Overview
A decentralized application for supporting student research projects using Ethereum testnet.

## Features
- Connect/disconnect MetaMask wallet
- Create research projects with funding goals
- Support projects with test ETH
- Receive reward tokens for contributions
- Track project shares and valuation
- View wallet balances and network info

## Setup Instructions

### 1. Prerequisites
- Install [MetaMask](https://metamask.io/) browser extension
- Get test ETH from a faucet (Sepolia or Holesky testnet)

### 2. Installation
1. Clone the repository
2. Open `index.html` in a browser
3. Update `contract.js` with your deployed contract addresses

### 3. Contract Deployment
1. Deploy `SupportToken.sol` contract
2. Deploy `ResearchPlatform.sol` contract (pass token address to constructor)
3. Update addresses in `contract.js`

### 4. Usage
1. Click "Connect MetaMask" to connect wallet
2. Ensure you're on a test network (Sepolia/Holesky)
3. Create projects or support existing ones
4. Track your contributions and token balance

## Important Notes
- **USE TEST NETWORKS ONLY** - No real ETH allowed
- All transactions use test ETH only
- Tokens have no real monetary value
- Project for educational purposes only

## Team Members
- Person A: Smart Contracts (Solidity)
- Person B: Frontend & MetaMask Integration (HTML/CSS/JS)
- Person C: Documentation & Presentation

## License
Educational Use Only