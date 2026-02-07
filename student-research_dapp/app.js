// Check if ethers is loaded
if (typeof ethers === 'undefined') {
    alert('Error: ethers.js library not loaded. Please check your internet connection.');
}

// Student Research DApp - Simplified Version
const ResearchDApp = {
    provider: null,
    signer: null,
    contracts: {},
    userAddress: null,
    selectedProjectId: null,
    networkId: null,

    async init() {
        console.log('Initializing DApp...');
        
        // Check if MetaMask is installed
        if (typeof window.ethereum === 'undefined') {
            this.showError('Please install MetaMask to use this DApp');
            return;
        }

        // Initialize event listeners
        this.initEventListeners();
        
        // Check if already connected
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
            await this.connectWallet();
        }
        
        console.log('DApp initialized');
    },

    initEventListeners() {
        console.log('Setting up event listeners...');
        
        // Connect wallet button
        document.getElementById('connectWallet').addEventListener('click', () => {
            this.connectWallet();
        });

        // Create project button
        document.getElementById('createProject').addEventListener('click', () => {
            this.createProject();
        });

        // Get test ETH button
        document.getElementById('getTestEth').addEventListener('click', () => {
            this.openFaucet();
        });

        // Modal close button
        document.querySelector('.close').addEventListener('click', () => {
            this.hideModal();
        });

        // Confirm support button
        document.getElementById('confirmSupport').addEventListener('click', () => {
            this.contributeToProject();
        });

        // Support project event delegation
        document.getElementById('projectsList').addEventListener('click', (e) => {
            if (e.target.classList.contains('support-btn')) {
                const projectId = e.target.dataset.projectId;
                this.showSupportModal(projectId);
            }
            
            if (e.target.classList.contains('finalize-btn')) {
                const projectId = e.target.dataset.projectId;
                this.finalizeProject(projectId);
            }
        });

        // Network change listener
        window.ethereum.on('chainChanged', () => {
            window.location.reload();
        });

        // Account change listener
        window.ethereum.on('accountsChanged', (accounts) => {
            if (accounts.length === 0) {
                this.disconnectWallet();
            } else {
                this.connectWallet();
            }
        });
    },

    async connectWallet() {
        try {
            console.log('Connecting wallet...');
            
            // Request account access
            const accounts = await window.ethereum.request({
                method: 'eth_requestAccounts'
            });

            this.userAddress = accounts[0];
            console.log('Connected account:', this.userAddress);
            
            // Get network ID
            this.networkId = await window.ethereum.request({ method: 'eth_chainId' });
            console.log('Network ID:', this.networkId);
            
            // Initialize provider and signer
            this.provider = new ethers.providers.Web3Provider(window.ethereum);
            this.signer = this.provider.getSigner();
            
            // Initialize contracts
            await this.initContracts();
            
            // Update UI
            this.updateWalletInfo();
            this.updateNetworkInfo();
            await this.loadProjects();
            await this.loadUserContributions();
            
            this.showSuccess('Wallet connected successfully!');
            
        } catch (error) {
            console.error('Wallet connection error:', error);
            this.showError('Failed to connect wallet: ' + error.message);
        }
    },

    async initContracts() {
        try {
            console.log('Initializing contracts...');
            
            // Check if contract addresses are set
            if (!CONTRACT_CONFIG.researchPlatform.address || CONTRACT_CONFIG.researchPlatform.address === "0xYourResearchPlatformContractAddressHere") {
                this.showError('Please update contract addresses in config.js');
                return;
            }
            
            // Load ABIs
            let platformABI, tokenABI;
            
            try {
                const platformResponse = await fetch('platformABI.json');
                platformABI = await platformResponse.json();
                
                const tokenResponse = await fetch('tokenABI.json');
                tokenABI = await tokenResponse.json();
            } catch (error) {
                console.error('Error loading ABIs:', error);
                this.showError('Failed to load contract ABIs');
                return;
            }
            
            // Initialize ResearchPlatform contract
            this.contracts.researchPlatform = new ethers.Contract(
                CONTRACT_CONFIG.researchPlatform.address,
                platformABI,
                this.signer
            );

            // Initialize SupportToken contract (if address is set)
            if (CONTRACT_CONFIG.supportToken.address && CONTRACT_CONFIG.supportToken.address !== "0xYourResearchTokenContractAddressHere") {
                this.contracts.supportToken = new ethers.Contract(
                    CONTRACT_CONFIG.supportToken.address,
                    tokenABI,
                    this.signer
                );
            }
            
            console.log('Contracts initialized successfully');
            
        } catch (error) {
            console.error('Contract initialization error:', error);
            this.showError('Failed to initialize contracts. Check contract addresses.');
        }
    },

    async updateWalletInfo() {
        if (!this.userAddress) return;

        try {
            // Update wallet address display
            const shortAddress = `${this.userAddress.slice(0, 6)}...${this.userAddress.slice(-4)}`;
            document.getElementById('walletAddress').textContent = shortAddress;
            
            // Get ETH balance
            const ethBalance = await this.provider.getBalance(this.userAddress);
            const ethFormatted = ethers.utils.formatEther(ethBalance);
            document.getElementById('ethBalance').textContent = parseFloat(ethFormatted).toFixed(4);
            
            // Get token balance if contract exists
            if (this.contracts.supportToken) {
                try {
                    const tokenBalance = await this.contracts.supportToken.balanceOf(this.userAddress);
                    const tokenFormatted = ethers.utils.formatUnits(tokenBalance, 18);
                    document.getElementById('tokenBalance').textContent = parseFloat(tokenFormatted).toFixed(2);
                } catch (error) {
                    console.warn('Could not fetch token balance:', error);
                    document.getElementById('tokenBalance').textContent = 'N/A';
                }
            } else {
                document.getElementById('tokenBalance').textContent = 'N/A';
            }
            
            // Show wallet details
            document.getElementById('walletDetails').classList.remove('hidden');
            document.getElementById('connectWallet').textContent = 'Disconnect';
            
        } catch (error) {
            console.error('Error updating wallet info:', error);
        }
    },

    updateNetworkInfo() {
        try {
            const networkId = parseInt(this.networkId);
            const networkName = this.getNetworkName(networkId);
            
            document.getElementById('networkName').textContent = networkName;
            document.getElementById('networkInfo').classList.remove('hidden');
            
            // Check if it's a testnet
            if (!this.isTestnet(networkId)) {
                this.showWarning('Please switch to a test network (Sepolia or Holesky)');
            }
            
        } catch (error) {
            console.error('Error updating network info:', error);
        }
    },

    getNetworkName(chainId) {
        const networks = {
            1: 'Ethereum Mainnet',
            11155111: 'Sepolia Testnet',
            17000: 'Holesky Testnet',
            31337: 'Localhost',
            1337: 'Local Development'
        };
        return networks[chainId] || `Unknown (${chainId})`;
    },

    isTestnet(chainId) {
        const testnets = [11155111, 17000, 31337, 1337, 5]; // 5 is Goerli
        return testnets.includes(chainId);
    },

    async createProject() {
        if (!this.userAddress) {
            this.showError('Please connect your wallet first');
            return;
        }

        const title = document.getElementById('projectTitle').value.trim();
        const goal = document.getElementById('fundingGoal').value;
        const days = document.getElementById('campaignDays').value;

        // Validation
        if (!title || !goal || !days) {
            this.showError('Please fill in all fields');
            return;
        }

        if (parseFloat(goal) <= 0) {
            this.showError('Funding goal must be greater than 0');
            return;
        }

        if (parseInt(days) <= 0) {
            this.showError('Duration must be at least 1 day');
            return;
        }

        try {
            this.showLoading('Creating project...');
            
            const goalWei = ethers.utils.parseEther(goal);
            const durationSeconds = parseInt(days) * 24 * 60 * 60;
            
            const tx = await this.contracts.researchPlatform.createProject(
                title,
                goalWei,
                durationSeconds
            );
            
            await tx.wait();
            
            // Clear form
            document.getElementById('projectTitle').value = '';
            document.getElementById('fundingGoal').value = '';
            document.getElementById('campaignDays').value = '';
            
            // Reload projects
            await this.loadProjects();
            
            this.showSuccess('Project created successfully!');
        } catch (error) {
            this.showError('Failed to create project: ' + error.message);
        } finally {
            this.hideLoading();
        }
    },

    async loadProjects() {
        if (!this.contracts.researchPlatform) {
            document.getElementById('projectsList').innerHTML = 
                '<p class="info-text">Connect wallet to load projects</p>';
            return;
        }

        try {
            const projectsList = document.getElementById('projectsList');
            projectsList.innerHTML = '<div class="loading">Loading projects...</div>';

            // Get project count
            const projectCount = await this.contracts.researchPlatform.projectCount();
            const count = projectCount.toNumber();

            if (count === 0) {
                projectsList.innerHTML = '<p class="info-text">No projects available. Create the first one!</p>';
                return;
            }

            let projectsHTML = '';

            // Load each project
            for (let i = 0; i < count; i++) {
                try {
                    const project = await this.contracts.researchPlatform.projects(i);
                    
                    // Check if project is active
                    const now = Math.floor(Date.now() / 1000);
                    const isActive = !project.finalized && now < project.deadline.toNumber();
                    
                    // Calculate progress
                    const goal = parseFloat(ethers.utils.formatEther(project.goal));
                    const raised = parseFloat(ethers.utils.formatEther(project.totalRaised));
                    const progress = goal > 0 ? (raised / goal) * 100 : 0;
                    
                    // Format deadline
                    const deadline = new Date(project.deadline.toNumber() * 1000);
                    const daysLeft = Math.max(0, Math.ceil((deadline - new Date()) / (1000 * 60 * 60 * 24)));
                    
                    projectsHTML += `
                        <div class="project-card">
                            <div class="project-header">
                                <h3 class="project-title">${project.title}</h3>
                                <span class="project-status ${isActive ? 'active' : 'ended'}">
                                    ${isActive ? `Active - ${daysLeft} days left` : 'Ended'}
                                </span>
                            </div>
                            <div class="project-details">
                                <p><strong>Goal:</strong> ${goal.toFixed(2)} ETH</p>
                                <p><strong>Raised:</strong> ${raised.toFixed(2)} ETH (${progress.toFixed(1)}%)</p>
                                <p><strong>Valuation:</strong> ${parseFloat(ethers.utils.formatEther(project.valuation)).toFixed(2)} ETH</p>
                                <p><strong>Shares:</strong> ${project.totalShares.toString()}</p>
                            </div>
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${Math.min(progress, 100)}%"></div>
                            </div>
                            <div class="project-actions">
                                ${isActive ? `
                                    <button class="btn-secondary support-btn" data-project-id="${i}">
                                        Support Project
                                    </button>
                                ` : `
                                    <button class="btn-secondary" disabled>
                                        Project Ended
                                    </button>
                                `}
                            </div>
                        </div>
                    `;
                } catch (error) {
                    console.error(`Error loading project ${i}:`, error);
                }
            }

            projectsList.innerHTML = projectsHTML || '<p class="info-text">No projects available</p>';

        } catch (error) {
            console.error('Error loading projects:', error);
            projectsList.innerHTML = '<p class="info-text">Error loading projects</p>';
        }
    },

    showSupportModal(projectId) {
        if (!this.userAddress) {
            this.showError('Please connect your wallet first');
            return;
        }

        this.selectedProjectId = projectId;
        document.getElementById('supportModal').classList.add('show');
        document.getElementById('supportAmount').value = '';
        document.getElementById('supportAmount').focus();
    },

    hideModal() {
        document.getElementById('supportModal').classList.remove('show');
        this.selectedProjectId = null;
    },

    async contributeToProject() {
        if (this.selectedProjectId === null) return;

        const amount = document.getElementById('supportAmount').value;

        if (!amount || parseFloat(amount) <= 0) {
            this.showError('Please enter a valid amount (minimum 0.001 ETH)');
            return;
        }

        try {
            this.showLoading('Processing contribution...');
            
            const amountWei = ethers.utils.parseEther(amount);
            
            const tx = await this.contracts.researchPlatform.contribute(
                this.selectedProjectId,
                { value: amountWei }
            );
            
            await tx.wait();
            
            // Hide modal
            this.hideModal();
            
            // Reload data
            await this.loadProjects();
            await this.updateWalletInfo();
            await this.loadUserContributions();
            
            this.showSuccess(`Successfully contributed ${amount} ETH to project!`);
        } catch (error) {
            this.showError('Failed to contribute: ' + error.message);
        } finally {
            this.hideLoading();
        }
    },

    async finalizeProject(projectId) {
        try {
            this.showLoading('Finalizing project...');
            
            const tx = await this.contracts.researchPlatform.finalizeProject(projectId);
            await tx.wait();
            
            await this.loadProjects();
            this.showSuccess('Project finalized successfully!');
        } catch (error) {
            this.showError('Failed to finalize project: ' + error.message);
        } finally {
            this.hideLoading();
        }
    },

    async loadUserContributions() {
        if (!this.userAddress || !this.contracts.researchPlatform) return;

        try {
            const contributionsDiv = document.getElementById('myContributions');
            
            // Get project count
            const projectCount = await this.contracts.researchPlatform.projectCount();
            const count = projectCount.toNumber();

            if (count === 0) {
                contributionsDiv.innerHTML = '<p class="info-text">No contributions yet</p>';
                return;
            }

            let contributionsHTML = '';
            let hasContributions = false;

            // Check each project for user contributions
            for (let i = 0; i < count; i++) {
                try {
                    // Get user shares for this project
                    const userShares = await this.contracts.researchPlatform.shares(i, this.userAddress);
                    const shareCount = userShares.toNumber();
                    
                    if (shareCount > 0) {
                        hasContributions = true;
                        
                        // Get project details
                        const project = await this.contracts.researchPlatform.projects(i);
                        const projectName = project.title;
                        
                        contributionsHTML += `
                            <div class="contribution-item">
                                <h4>${projectName}</h4>
                                <p><strong>Project ID:</strong> ${i}</p>
                                <p><strong>Your Shares:</strong> ${shareCount}</p>
                                <p><strong>Valuation:</strong> ${parseFloat(ethers.utils.formatEther(project.valuation)).toFixed(2)} ETH</p>
                            </div>
                        `;
                    }
                } catch (error) {
                    console.error(`Error loading contribution for project ${i}:`, error);
                }
            }

            if (!hasContributions) {
                contributionsHTML = '<p class="info-text">No contributions yet. Support a project to get started!</p>';
            }

            contributionsDiv.innerHTML = contributionsHTML;

        } catch (error) {
            console.error('Error loading contributions:', error);
            contributionsDiv.innerHTML = '<p class="info-text">Error loading contributions</p>';
        }
    },

    openFaucet() {
        const networkId = parseInt(this.networkId);
        let faucetUrl = '';
        
        if (networkId === 11155111) {
            faucetUrl = 'https://sepoliafaucet.com';
        } else if (networkId === 17000) {
            faucetUrl = 'https://holesky-faucet.pk910.de';
        } else if (networkId === 5) {
            faucetUrl = 'https://goerli-faucet.pk910.de';
        } else {
            this.showInfo('Switch to Sepolia (11155111) or Holesky (17000) testnet to get test ETH');
            return;
        }
        
        window.open(faucetUrl, '_blank');
    },

    disconnectWallet() {
        this.userAddress = null;
        this.contracts = {};
        
        // Update UI
        document.getElementById('connectWallet').textContent = 'Connect MetaMask';
        document.getElementById('walletDetails').classList.add('hidden');
        document.getElementById('networkInfo').classList.add('hidden');
        document.getElementById('myContributions').innerHTML = 
            '<p class="info-text">Connect wallet to see your contributions</p>';
        document.getElementById('projectsList').innerHTML = 
            '<p class="info-text">Connect wallet to load projects</p>';
        
        this.showInfo('Wallet disconnected');
    },

    // Notification functions
    showSuccess(message) {
        this.showNotification(message, 'success');
    },

    showError(message) {
        this.showNotification(message, 'error');
    },

    showWarning(message) {
        this.showNotification(message, 'warning');
    },

    showInfo(message) {
        this.showNotification(message, 'info');
    },

    showNotification(message, type = 'info') {
        // Remove existing notification
        const existing = document.querySelector('.notification');
        if (existing) existing.remove();

        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = message;
        
        // Set color based on type
        const colors = {
            success: '#4CAF50',
            error: '#f44336',
            warning: '#ff9800',
            info: '#2196F3'
        };
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 10px;
            color: white;
            background-color: ${colors[type] || colors.info};
            font-weight: 600;
            z-index: 10000;
            animation: slideIn 0.3s ease;
            box-shadow: 0 5px 15px rgba(0,0,0,0.3);
            min-width: 300px;
            max-width: 400px;
        `;

        document.body.appendChild(notification);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    },

    showLoading(message) {
        const overlay = document.createElement('div');
        overlay.id = 'loadingOverlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.7);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            color: white;
            font-size: 1.2rem;
        `;

        overlay.innerHTML = `
            <div style="width: 50px; height: 50px; border: 5px solid #f3f3f3; border-top: 5px solid #4CAF50; border-radius: 50%; animation: spin 1s linear infinite;"></div>
            <p style="margin-top: 20px;">${message}</p>
            <style>
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            </style>
        `;

        document.body.appendChild(overlay);
    },

    hideLoading() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) overlay.remove();
    }
};

// Initialize the DApp when page loads
document.addEventListener('DOMContentLoaded', () => {
    ResearchDApp.init();
});