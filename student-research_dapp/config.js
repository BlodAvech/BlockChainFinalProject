// Contract Configuration - YOU NEED TO UPDATE THESE ADDRESSES AFTER DEPLOYMENT
const CONTRACT_CONFIG = {
    // UPDATE THESE WITH YOUR DEPLOYED CONTRACT ADDRESSES
    researchPlatform: {
        address: "0x5409a82d30DCD8625e0eD2f13E8Cb9cD3323bCAf", // Replace with actual address
        abiFile: "platformABI.json"
    },
    supportToken: {
        address: "0x5820e9829Ffd7E13a551418b2A8f63277eaa65A9", // Replace with actual address
        abiFile: "tokenABI.json"
    }
};

// Network configurations
const NETWORKS = {
    11155111: {
        name: "Sepolia Testnet",
        chainId: "0xaa36a7",
        rpcUrl: "https://sepolia.infura.io/v3/YOUR_INFURA_KEY",
        explorer: "https://sepolia.etherscan.io"
    },
    17000: {
        name: "Holesky Testnet",
        chainId: "0x4268",
        rpcUrl: "https://holesky.infura.io/v3/YOUR_INFURA_KEY",
        explorer: "https://holesky.etherscan.io"
    },
    31337: {
        name: "Localhost",
        chainId: "0x7a69",
        explorer: "http://localhost:8545"
    }
};

// Testnet faucet links
const FAUCETS = {
    11155111: "https://sepoliafaucet.com",
    17000: "https://holesky-faucet.pk910.de"
};