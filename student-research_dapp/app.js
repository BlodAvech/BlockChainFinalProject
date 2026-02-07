if (typeof ethers === "undefined") {
  alert("Error: ethers.js not loaded. Check internet connection.");
}

const ResearchDApp = {
  provider: null,
  signer: null,
  contracts: {},
  userAddress: null,
  chainId: null,
  selectedProjectId: null,

  async init() {
    if (typeof window.ethereum === "undefined") {
      this.notify("Please install MetaMask to use this DApp", "error");
      return;
    }

    this.initEventListeners();

    const accounts = await window.ethereum.request({ method: "eth_accounts" });
    if (accounts.length > 0) await this.connectWallet();
    else this.renderDisconnectedState();
  },

  initEventListeners() {
    const connectBtn = document.getElementById("connectWallet");
    connectBtn.addEventListener("click", async () => {
      if (this.userAddress) this.disconnectWallet();
      else await this.connectWallet();
    });

    document.getElementById("createProject").addEventListener("click", () => this.createProject());
    document.getElementById("getTestEth").addEventListener("click", () => this.openFaucet());

    document.querySelector(".close").addEventListener("click", () => this.hideModal());
    document.getElementById("confirmSupport").addEventListener("click", () => this.contributeToProject());

    document.getElementById("projectsList").addEventListener("click", (e) => {
      if (e.target.classList.contains("support-btn")) {
        const projectId = parseInt(e.target.dataset.projectId, 10);
        this.showSupportModal(projectId);
      }
      if (e.target.classList.contains("finalize-btn")) {
        const projectId = parseInt(e.target.dataset.projectId, 10);
        this.finalizeProject(projectId);
      }
    });

    window.ethereum.on("chainChanged", () => window.location.reload());

    window.ethereum.on("accountsChanged", (accounts) => {
      if (!accounts || accounts.length === 0) this.disconnectWallet();
      else this.connectWallet();
    });
  },

  async connectWallet() {
    try {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      this.userAddress = accounts[0];

      this.provider = new ethers.providers.Web3Provider(window.ethereum);
      this.signer = this.provider.getSigner();

      const chainHex = await window.ethereum.request({ method: "eth_chainId" });
      this.chainId = parseInt(chainHex, 16);

      await this.initContracts();

      this.updateNetworkInfo();
      await this.updateWalletInfo();
      await this.loadProjects();
      await this.loadUserContributions();

      this.notify("Wallet connected ✅", "success");
    } catch (err) {
      console.error(err);
      this.notify("Failed to connect wallet: " + (err?.message || err), "error");
    }
  },

  async initContracts() {
    const platformAddr = CONTRACT_CONFIG.researchPlatform.address;
    const tokenAddr = CONTRACT_CONFIG.researchToken.address;

    if (!platformAddr || platformAddr.startsWith("0xYOUR")) {
      this.notify("Update ResearchPlatform address in config.js", "error");
      throw new Error("Missing platform address");
    }
    if (!tokenAddr || tokenAddr.startsWith("0xYOUR")) {
      this.notify("Update ResearchToken address in config.js", "error");
      throw new Error("Missing token address");
    }

    this.contracts.researchPlatform = new ethers.Contract(platformAddr, PLATFORM_ABI, this.signer);
    this.contracts.researchToken = new ethers.Contract(tokenAddr, TOKEN_ABI, this.signer);
  },

  updateNetworkInfo() {
    const name = ALLOWED_TESTNETS[this.chainId] || `Unknown (${this.chainId})`;
    document.getElementById("networkName").textContent = name;
    document.getElementById("networkInfo").classList.remove("hidden");

    if (!ALLOWED_TESTNETS[this.chainId]) {
      this.notify("⚠️ Switch to Sepolia / Holesky testnet", "warning");
    }
  },

  async updateWalletInfo() {
    if (!this.userAddress) return;

    const short = `${this.userAddress.slice(0, 6)}...${this.userAddress.slice(-4)}`;
    document.getElementById("walletAddress").textContent = short;

    const balWei = await this.provider.getBalance(this.userAddress);
    document.getElementById("ethBalance").textContent = parseFloat(ethers.utils.formatEther(balWei)).toFixed(4);

    try {
      const tokenBal = await this.contracts.researchToken.balanceOf(this.userAddress);
      document.getElementById("tokenBalance").textContent = parseFloat(ethers.utils.formatUnits(tokenBal, 18)).toFixed(2);
    } catch (e) {
      document.getElementById("tokenBalance").textContent = "N/A";
    }

    document.getElementById("walletDetails").classList.remove("hidden");
    document.getElementById("connectWallet").textContent = "Disconnect";
  },

  renderDisconnectedState() {
    document.getElementById("connectWallet").textContent = "Connect MetaMask";
    document.getElementById("walletDetails").classList.add("hidden");
    document.getElementById("networkInfo").classList.add("hidden");
    document.getElementById("projectsList").innerHTML = '<p class="info-text">Connect wallet to load projects</p>';
    document.getElementById("myContributions").innerHTML = '<p class="info-text">Connect wallet to see your contributions</p>';
  },

  formatBigCompact(bn) {
    const b = ethers.BigNumber.from(bn);
    if (b.isZero()) return "0";

    const thousand = ethers.BigNumber.from("1000");
    const million = ethers.BigNumber.from("1000000");
    const billion = ethers.BigNumber.from("1000000000");
    const trillion = ethers.BigNumber.from("1000000000000");

    const format = (divisor, suffix) => {
      const scaled = b.mul(100).div(divisor);
      const intPart = scaled.div(100).toString();
      const frac = scaled.mod(100).toString().padStart(2, "0");
      return `${intPart}.${frac}${suffix}`;
    };

    if (b.gte(trillion)) return format(trillion, "T");
    if (b.gte(billion)) return format(billion, "B");
    if (b.gte(million)) return format(million, "M");
    if (b.gte(thousand)) return format(thousand, "K");

    return b.toString();
  },

  async createProject() {
    if (!this.userAddress) return this.notify("Connect wallet first", "error");
    if (!ALLOWED_TESTNETS[this.chainId]) return this.notify("Switch to a testnet first", "warning");

    const title = document.getElementById("projectTitle").value.trim();
    const goalEth = document.getElementById("fundingGoal").value;
    const days = document.getElementById("campaignDays").value;

    if (!title || !goalEth || !days) return this.notify("Fill all fields", "error");
    if (parseFloat(goalEth) <= 0) return this.notify("Goal must be > 0", "error");
    if (parseInt(days, 10) <= 0) return this.notify("Duration must be >= 1 day", "error");

    try {
      this.showLoading("Creating project...");

      const goalWei = ethers.utils.parseEther(String(goalEth));
      const durationSeconds = parseInt(days, 10) * 24 * 60 * 60;

      const tx = await this.contracts.researchPlatform.createProject(title, goalWei, durationSeconds);
      await tx.wait();

      document.getElementById("projectTitle").value = "";
      document.getElementById("fundingGoal").value = "";
      document.getElementById("campaignDays").value = "";

      await this.loadProjects();
      this.notify("Project created ✅", "success");
    } catch (err) {
      console.error(err);
      this.notify("Create failed: " + (err?.reason || err?.message || err), "error");
    } finally {
      this.hideLoading();
    }
  },

  async loadProjects() {
    if (!this.contracts.researchPlatform) return;

    const list = document.getElementById("projectsList");
    list.innerHTML = '<div class="loading">Loading projects...</div>';

    try {
      const countBN = await this.contracts.researchPlatform.projectCount();
      const count = countBN.toNumber();

      if (count === 0) {
        list.innerHTML = '<p class="info-text">No projects yet. Create the first one!</p>';
        return;
      }

      let html = "";

      for (let id = 1; id <= count; id++) {
        const p = await this.contracts.researchPlatform.projects(id);

        const now = Math.floor(Date.now() / 1000);
        const deadline = p.deadline.toNumber();
        const isActive = !p.finalized && now < deadline;

        const goal = parseFloat(ethers.utils.formatEther(p.goal));
        const raised = parseFloat(ethers.utils.formatEther(p.totalRaised));
        const progress = goal > 0 ? (raised / goal) * 100 : 0;

        const daysLeft = Math.max(0, Math.ceil((deadline * 1000 - Date.now()) / (1000 * 60 * 60 * 24)));

        const totalSharesPretty = this.formatBigCompact(p.totalShares);

        html += `
          <div class="project-card">
            <div class="project-header">
              <h3 class="project-title">${p.title}</h3>
              <span class="project-status ${isActive ? "active" : "ended"}">
                ${isActive ? `Active - ${daysLeft} days left` : "Ended"}
              </span>
            </div>

            <div class="project-details">
              <p><strong>ID:</strong> ${id}</p>
              <p><strong>Goal:</strong> ${goal.toFixed(3)} ETH</p>
              <p><strong>Raised:</strong> ${raised.toFixed(3)} ETH (${progress.toFixed(1)}%)</p>
              <p><strong>Valuation:</strong> ${parseFloat(ethers.utils.formatEther(p.valuation)).toFixed(3)} ETH</p>
              <p><strong>Total Shares:</strong> ${totalSharesPretty}</p>
            </div>

            <div class="progress-bar">
              <div class="progress-fill" style="width:${Math.min(progress, 100)}%"></div>
            </div>

            <div class="project-actions">
              ${
                isActive
                  ? `<button class="btn-secondary support-btn" data-project-id="${id}">Support Project</button>`
                  : `<button class="btn-secondary" disabled>Project Ended</button>`
              }
            </div>
          </div>
        `;
      }

      list.innerHTML = html;
    } catch (err) {
      console.error(err);
      list.innerHTML = '<p class="info-text">Error loading projects</p>';
    }
  },

  async loadUserContributions() {
    if (!this.userAddress || !this.contracts.researchPlatform) return;

    const box = document.getElementById("myContributions");
    box.innerHTML = '<div class="loading">Loading your contributions...</div>';

    try {
      const count = (await this.contracts.researchPlatform.projectCount()).toNumber();
      if (count === 0) {
        box.innerHTML = '<p class="info-text">No contributions yet</p>';
        return;
      }

      let html = "";
      let has = false;

      for (let id = 1; id <= count; id++) {
        const userSharesBN = await this.contracts.researchPlatform.shares(id, this.userAddress);
        if (!userSharesBN.isZero()) {
          has = true;
          const p = await this.contracts.researchPlatform.projects(id);
          const userSharesPretty = this.formatBigCompact(userSharesBN);

          html += `
            <div class="contribution-item">
              <h4>${p.title}</h4>
              <p><strong>Project ID:</strong> ${id}</p>
              <p><strong>Your Shares:</strong> ${userSharesPretty}</p>
              <p><strong>Valuation:</strong> ${parseFloat(ethers.utils.formatEther(p.valuation)).toFixed(3)} ETH</p>
            </div>
          `;
        }
      }

      box.innerHTML = has ? html : '<p class="info-text">No contributions yet. Support a project to get started!</p>';
    } catch (err) {
      console.error(err);
      box.innerHTML = '<p class="info-text">Error loading contributions</p>';
    }
  },

  showSupportModal(projectId) {
    if (!this.userAddress) return this.notify("Connect wallet first", "error");

    this.selectedProjectId = parseInt(projectId, 10);

    const info = document.getElementById("modalProjectInfo");
    info.innerHTML = `<p><strong>Project ID:</strong> ${this.selectedProjectId}</p>`;

    document.getElementById("supportAmount").value = "";
    document.getElementById("supportModal").classList.add("show");
    document.getElementById("supportAmount").focus();
  },

  hideModal() {
    document.getElementById("supportModal").classList.remove("show");
    this.selectedProjectId = null;
  },

  async contributeToProject() {
    if (this.selectedProjectId == null) return;

    const amountEth = document.getElementById("supportAmount").value;
    if (!amountEth || parseFloat(amountEth) <= 0) return this.notify("Enter valid ETH amount", "error");

    try {
      this.showLoading("Sending contribution...");

      const amountWei = ethers.utils.parseEther(String(amountEth));

      const tx = await this.contracts.researchPlatform.contribute(this.selectedProjectId, { value: amountWei });
      await tx.wait();

      this.hideModal();
      await this.loadProjects();
      await this.updateWalletInfo();
      await this.loadUserContributions();

      this.notify(`Contributed ${amountEth} ETH ✅`, "success");
    } catch (err) {
      console.error(err);
      this.notify("Contribution failed: " + (err?.reason || err?.message || err), "error");
    } finally {
      this.hideLoading();
    }
  },

  async finalizeProject(projectId) {
    try {
      this.showLoading("Finalizing project...");
      const tx = await this.contracts.researchPlatform.finalizeProject(parseInt(projectId, 10));
      await tx.wait();
      await this.loadProjects();
      this.notify("Project finalized ✅", "success");
    } catch (err) {
      console.error(err);
      this.notify("Finalize failed: " + (err?.reason || err?.message || err), "error");
    } finally {
      this.hideLoading();
    }
  },

  openFaucet() {
    if (!this.chainId) return this.notify("Connect wallet first", "info");

    const url = FAUCETS[this.chainId];
    if (!url) return this.notify("Switch to Sepolia/Holesky to use faucet", "info");

    window.open(url, "_blank");
  },

  disconnectWallet() {
    this.userAddress = null;
    this.contracts = {};
    this.provider = null;
    this.signer = null;
    this.chainId = null;
    this.selectedProjectId = null;

    this.renderDisconnectedState();
    this.notify("Wallet disconnected", "info");
  },

  notify(message, type = "info") {
    const existing = document.querySelector(".notification");
    if (existing) existing.remove();

    const n = document.createElement("div");
    n.className = `notification ${type}`;

    const colors = {
      success: "#4CAF50",
      error: "#f44336",
      warning: "#ff9800",
      info: "#2196F3"
    };

    n.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 15px 20px;
      border-radius: 10px;
      color: white;
      background-color: ${colors[type] || colors.info};
      font-weight: 600;
      z-index: 10000;
      box-shadow: 0 5px 15px rgba(0,0,0,0.3);
      min-width: 300px;
      max-width: 450px;
    `;

    n.textContent = message;
    document.body.appendChild(n);

    setTimeout(() => n.remove(), 5000);
  },

  showLoading(message) {
    const overlay = document.createElement("div");
    overlay.id = "loadingOverlay";
    overlay.style.cssText = `
      position: fixed; top: 0; left: 0;
      width: 100%; height: 100%;
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
      <div style="width:50px;height:50px;border:5px solid #f3f3f3;border-top:5px solid #4CAF50;border-radius:50%;animation:spin 1s linear infinite;"></div>
      <p style="margin-top:20px;">${message}</p>
      <style>
        @keyframes spin { 0%{transform:rotate(0)} 100%{transform:rotate(360deg)} }
      </style>
    `;

    document.body.appendChild(overlay);
  },

  hideLoading() {
    const overlay = document.getElementById("loadingOverlay");
    if (overlay) overlay.remove();
  }
};

document.addEventListener("DOMContentLoaded", () => {
  ResearchDApp.init();
});
