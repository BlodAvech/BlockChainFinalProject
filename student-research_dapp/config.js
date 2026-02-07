// === PUT YOUR DEPLOYED ADDRESSES HERE ===
const CONTRACT_CONFIG = {
  researchPlatform: {
    address: "0x5409a82d30DCD8625e0eD2f13E8Cb9cD3323bCAf"
  },
  researchToken: {
    address: "0x5820e9829Ffd7E13a551418b2A8f63277eaa65A9"
  }
};

// Allowed testnets (chainId)
const ALLOWED_TESTNETS = {
  11155111: "Sepolia Testnet",
  17000: "Holesky Testnet",
  31337: "Localhost"
};

// Faucet links
const FAUCETS = {
  11155111: "https://sepoliafaucet.com",
  17000: "https://holesky-faucet.pk910.de"
};

// === ABI (based on your current contracts) ===

// ResearchToken ABI (minimal for frontend)
const TOKEN_ABI = [
  { "inputs": [], "stateMutability": "nonpayable", "type": "constructor" },
  { "inputs": [], "name": "platform", "outputs": [{ "internalType": "address", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" },
  { "inputs": [{ "internalType": "address", "name": "_platform", "type": "address" }], "name": "setPlatform", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
  { "inputs": [{ "internalType": "address", "name": "to", "type": "address" }, { "internalType": "uint256", "name": "amount", "type": "uint256" }], "name": "mint", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
  { "inputs": [{ "internalType": "address", "name": "from", "type": "address" }, { "internalType": "uint256", "name": "amount", "type": "uint256" }], "name": "burn", "outputs": [], "stateMutability": "nonpayable", "type": "function" },

  { "inputs": [{ "internalType": "address", "name": "account", "type": "address" }], "name": "balanceOf", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },
  { "inputs": [], "name": "decimals", "outputs": [{ "internalType": "uint8", "name": "", "type": "uint8" }], "stateMutability": "view", "type": "function" },
  { "inputs": [], "name": "name", "outputs": [{ "internalType": "string", "name": "", "type": "string" }], "stateMutability": "view", "type": "function" },
  { "inputs": [], "name": "symbol", "outputs": [{ "internalType": "string", "name": "", "type": "string" }], "stateMutability": "view", "type": "function" },
  { "inputs": [], "name": "totalSupply", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }
];

// ResearchPlatform ABI
const PLATFORM_ABI = [
  { "inputs": [{ "internalType": "address", "name": "tokenAddress", "type": "address" }], "stateMutability": "nonpayable", "type": "constructor" },
  { "inputs": [], "name": "token", "outputs": [{ "internalType": "contract ResearchToken", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" },
  { "inputs": [], "name": "projectCount", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },
  { "inputs": [], "name": "SHARE_RATE", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },
  { "inputs": [], "name": "REWARD_RATE", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },

  { "inputs": [{ "internalType": "string", "name": "title", "type": "string" }, { "internalType": "uint256", "name": "goal", "type": "uint256" }, { "internalType": "uint256", "name": "duration", "type": "uint256" }], "name": "createProject", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
  { "inputs": [{ "internalType": "uint256", "name": "projectID", "type": "uint256" }], "name": "contribute", "outputs": [], "stateMutability": "payable", "type": "function" },
  { "inputs": [{ "internalType": "uint256", "name": "projectID", "type": "uint256" }, { "internalType": "uint256", "name": "newValuation", "type": "uint256" }], "name": "updateValuation", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
  { "inputs": [{ "internalType": "uint256", "name": "projectID", "type": "uint256" }], "name": "finalizeProject", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
  { "inputs": [{ "internalType": "uint256", "name": "projectID", "type": "uint256" }], "name": "withdraw", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
  { "inputs": [{ "internalType": "uint256", "name": "projectID", "type": "uint256" }], "name": "refund", "outputs": [], "stateMutability": "nonpayable", "type": "function" },

  { "inputs": [{ "internalType": "uint256", "name": "projectID", "type": "uint256" }], "name": "getSharedPrice", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },

  { "inputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "name": "projects", "outputs": [
      { "internalType": "string", "name": "title", "type": "string" },
      { "internalType": "address", "name": "owner", "type": "address" },
      { "internalType": "uint256", "name": "goal", "type": "uint256" },
      { "internalType": "uint256", "name": "deadline", "type": "uint256" },
      { "internalType": "uint256", "name": "totalRaised", "type": "uint256" },
      { "internalType": "uint256", "name": "totalShares", "type": "uint256" },
      { "internalType": "uint256", "name": "valuation", "type": "uint256" },
      { "internalType": "bool", "name": "finalized", "type": "bool" }
  ], "stateMutability": "view", "type": "function" },

  { "inputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }, { "internalType": "address", "name": "", "type": "address" }], "name": "contributions", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },
  { "inputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }, { "internalType": "address", "name": "", "type": "address" }], "name": "shares", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }
];
